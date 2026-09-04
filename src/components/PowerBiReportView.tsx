"use client";

import { models, type Report } from "powerbi-client";
import { PowerBIEmbed } from "powerbi-client-react";
import { useEffect, useMemo, useState } from "react";

import type { Fit, FailureKind, ReportPage } from "./dashboard/report-store";

/**
 * The actual Power BI embed.
 *
 * IMPORTANT: this module must never be imported on the server. `powerbi-client`
 * is a browser bundle that touches `self` at import time, so evaluating it in
 * Node crashes the render worker (Next surfaces this as "Jest worker
 * encountered N child process exceptions"). It is reached only through
 * PowerBiEmbed, which loads it with `ssr: false` behind a browser gate. Do not
 * import it directly.
 *
 * The report is embedded with the signed-in user's own Entra token
 * (tokenType: Aad), so Power BI applies that person's permissions and row-level
 * security directly.
 *
 * Every call into the Power BI client API lives here. The chrome bar states
 * what it wants through props; this file is the only thing that acts on the
 * live report, so there is one place where the API surface can go wrong.
 */

export type PowerBiReportViewProps = {
  reportId: string;
  embedUrl: string;
  accessToken: string;
  pageName?: string;

  /* What the chrome bar wants to be true. */
  activePage: string | null;
  filtersVisible: boolean;
  fit: Fit;
  refreshNonce: number;
  resetNonce: number;

  /* What the report reports back. */
  onLoaded: (pages: ReportPage[], active: string | null) => void;
  onRendered: () => void;
  onFailed: (kind: FailureKind) => void;
  onPageChanged: (pageName: string) => void;
};

function displayOptionFor(fit: Fit): models.DisplayOption {
  if (fit === "width") return models.DisplayOption.FitToWidth;
  if (fit === "actual") return models.DisplayOption.ActualSize;
  return models.DisplayOption.FitToPage;
}

/**
 * How the report is scaled inside its frame. Kept in one function so the config
 * the embed mounts with and the settings sent afterwards cannot drift apart.
 */
function fitSettings(fit: Fit): models.ISettings {
  return {
    layoutType: models.LayoutType.Custom,
    customLayout: { displayOption: displayOptionFor(fit) },
  };
}

/**
 * An expired token and a refused permission both surface as an embed error, and
 * they need opposite advice: one is fixed by reloading the page, the other by an
 * administrator. Telling somebody whose token simply aged out that they lack
 * access is both wrong and impossible to act on.
 */
function classify(detail: unknown): FailureKind {
  const text = JSON.stringify(detail ?? "").toLowerCase();
  return text.includes("tokenexpired") || text.includes("token expired")
    ? "token-expired"
    : "render-failed";
}

export default function PowerBiReportView({
  reportId,
  embedUrl,
  accessToken,
  pageName,
  activePage,
  filtersVisible,
  fit,
  refreshNonce,
  resetNonce,
  onLoaded,
  onRendered,
  onFailed,
  onPageChanged,
}: PowerBiReportViewProps) {
  /*
   * The live report is state rather than a ref: the effects below have to run
   * again once it exists, and a ref would not tell them to.
   */
  const [report, setReport] = useState<Report | null>(null);
  const [loaded, setLoaded] = useState(false);

  /*
   * The store's callbacks are useCallback values with no dependencies, so their
   * identities are stable for the life of the provider and this map is built
   * once. That matters: rebuilding it makes powerbi-client-react tear down and
   * re-attach its handlers, which can lose an event mid-load.
   */
  const eventHandlers = useMemo(
    () =>
      new Map<string, (event?: { detail?: unknown }) => void>([
        ["loaded", () => setLoaded(true)],
        ["rendered", () => onRendered()],
        [
          /*
           * The server pre-checks report and dataset access, but Power BI can
           * still refuse at render time — a visual-level permission, an RLS role
           * that does not resolve, a token that aged out mid-session. Without
           * this the embed sits there empty, which reads as a broken dashboard
           * rather than as a permission problem.
           */
          "error",
          (event) => {
            console.error("[NuIQ] Power BI embed error", event?.detail);
            onFailed(classify(event?.detail));
          },
        ],
        [
          "pageChanged",
          (event) => {
            const page = (event?.detail as { newPage?: { name?: string } })
              ?.newPage;
            if (page?.name) onPageChanged(page.name);
          },
        ],
      ]),
    [onRendered, onFailed, onPageChanged],
  );

  /* --- reading the report's own pages ------------------------------------ */

  useEffect(() => {
    if (!report || !loaded) return;

    void report
      .getPages()
      .then((all) => {
        // Pages hidden in view mode are hidden deliberately — drill-through
        // targets, working pages — and putting them in the tab bar would show
        // what the report's author chose not to.
        const visible = all.filter(
          (page) => page.visibility === models.SectionVisibility.AlwaysVisible,
        );
        onLoaded(
          visible.map((page) => ({
            name: page.name,
            displayName: page.displayName || page.name,
          })),
          (visible.find((page) => page.isActive) ?? visible[0])?.name ?? null,
        );
      })
      .catch(() => {
        // No page list means no tabs, a smaller loss than a broken bar. The
        // report itself is unaffected.
        onLoaded([], null);
      });
  }, [report, loaded, onLoaded]);

  /* --- applying what the chrome bar asked for ---------------------------- */

  useEffect(() => {
    void report
      ?.updateSettings({ panes: { filters: { visible: filtersVisible } } })
      .catch(() => undefined);
  }, [report, filtersVisible]);

  useEffect(() => {
    void report?.updateSettings(fitSettings(fit)).catch(() => undefined);
  }, [report, fit]);

  useEffect(() => {
    if (!activePage) return;
    void report?.setPage(activePage).catch(() => undefined);
  }, [report, activePage]);

  useEffect(() => {
    if (refreshNonce === 0) return;
    void report?.refresh().catch(() => {
      // An import-mode dataset the user cannot refresh simply refuses. Report
      // it as rendered so the spinner stops rather than hanging for ever.
      onRendered();
    });
  }, [report, refreshNonce, onRendered]);

  useEffect(() => {
    if (resetNonce === 0) return;
    void report?.resetPersistentFilters().catch(() => undefined);
  }, [report, resetNonce]);

  return (
    <PowerBIEmbed
      embedConfig={{
        type: "report",
        id: reportId,
        embedUrl,
        accessToken,
        tokenType: models.TokenType.Aad,
        ...(pageName ? { pageName } : {}),
        settings: {
          ...fitSettings("page"),
          panes: {
            filters: { visible: false },
            // Page navigation is ours: Power BI's own strip carries Power BI's
            // chrome and type, and costs height the report should have.
            pageNavigation: { visible: false },
          },
          background: models.BackgroundType.Transparent,
        },
      }}
      eventHandlers={eventHandlers}
      getEmbeddedComponent={(embed) => setReport(embed as Report)}
      cssClassName="h-full w-full"
    />
  );
}
