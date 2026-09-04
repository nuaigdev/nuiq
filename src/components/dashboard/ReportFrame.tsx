"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import Link from "next/link";

import { PowerBiEmbed } from "@/components/PowerBiEmbed";

import { useReportView } from "./report-store";

/**
 * Everything that can occupy the report area: the skeleton while Power BI is
 * still painting, the embed once it is, and the notice when it cannot be.
 *
 * Every state renders *inside* the frame, with the chrome bar still above it —
 * someone who cannot open one dashboard can still switch to another or leave,
 * rather than landing on a dead end (CLAUDE.md §5).
 */

/** What the server determined before the browser was involved at all. */
export type ReportAccess =
  | { kind: "ready"; embedUrl: string; accessToken: string }
  | { kind: "session-expired" }
  | { kind: "signed-out" }
  | { kind: "forbidden" }
  | { kind: "no-data-access" }
  | { kind: "not-found"; workspaceId: string }
  | { kind: "error"; detail: string };

function Notice({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex h-full items-center justify-center px-6 py-10">
      <div className="max-w-[46ch] text-center">
        <h2 className="text-[16px] font-semibold tracking-tight text-ink">
          {title}
        </h2>
        <div className="mt-2.5 text-[14px] leading-[1.7] text-ink-muted">
          {children}
        </div>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}

const RELOAD_CLASS =
  "inline-flex items-center gap-2 rounded-lg bg-peak-600 px-4 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-peak-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peak-500";

/**
 * A quiet stand-in while Power BI paints.
 *
 * Deliberately not a ghost chart. A skeleton shaped like bars and lines implies
 * figures that are not there yet, and chart iconography as decoration is the
 * dashboard-template cliché §8 rules out. Facet planes say "something is coming"
 * without pretending to be data.
 */
function ReportSkeleton({ name }: { name: string }) {
  return (
    <div
      role="status"
      aria-label={`Loading ${name}`}
      className="absolute inset-0 flex flex-col gap-3 bg-canvas-ground p-4"
    >
      <div className="flex gap-3">
        <div className="canvas-shimmer h-[22%] min-h-[76px] flex-1 rounded-xl" />
        <div className="canvas-shimmer h-[22%] min-h-[76px] flex-1 rounded-xl" />
        <div className="canvas-shimmer h-[22%] min-h-[76px] flex-1 rounded-xl" />
      </div>
      <div className="flex min-h-0 flex-1 gap-3">
        <div className="canvas-shimmer min-h-0 flex-[2] rounded-xl" />
        <div className="canvas-shimmer min-h-0 flex-1 rounded-xl" />
      </div>
      <span className="sr-only">Loading {name}</span>
    </div>
  );
}

export function ReportFrame({
  access,
  reportId,
  pageName,
}: {
  access: ReportAccess;
  reportId: string;
  pageName?: string;
}) {
  const {
    reportName,
    ready,
    failure,
    activePage,
    filtersVisible,
    fit,
    refreshNonce,
    resetNonce,
    reportLoaded,
    reportRendered,
    reportFailed,
    pageChanged,
  } = useReportView();

  /* --- states the server already decided --------------------------------- */

  if (access.kind === "session-expired") {
    return (
      <Notice
        title="Your session has expired"
        action={
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={RELOAD_CLASS}
          >
            <RotateCcw aria-hidden className="h-3.5 w-3.5" />
            Reload
          </button>
        }
      >
        Your Microsoft sign-in has timed out, so Power BI will not accept it any
        more. Sign out and back in from the top right to reconnect. This is not a
        permissions problem — nothing about your access has changed.
      </Notice>
    );
  }

  if (access.kind === "signed-out") {
    return (
      <Notice title="Sign in to view this dashboard">
        Reports load with your own Microsoft account, so Power BI applies your
        permissions directly. Use{" "}
        <strong className="font-medium text-ink">Sign in</strong> at the top
        right.
      </Notice>
    );
  }

  if (access.kind === "forbidden" || access.kind === "no-data-access") {
    return <NoAccess reportName={reportName} reason={access.kind} />;
  }

  if (access.kind === "not-found") {
    return (
      <Notice title="Not found in that workspace">
        Power BI cannot find this report in workspace{" "}
        <code className="font-mono text-[12.5px] text-ink">
          {access.workspaceId}
        </code>
        . Check the workspace and report IDs on the{" "}
        <Link
          href="/dashboards/manage"
          className="font-medium text-peak-600 underline underline-offset-[3px]"
        >
          manage screen
        </Link>
        , or the report may have been deleted.
      </Notice>
    );
  }

  if (access.kind === "error") {
    return <Notice title="Could not load this dashboard">{access.detail}</Notice>;
  }

  /* --- states only the embed can discover --------------------------------- */

  if (failure === "token-expired") {
    return (
      <Notice
        title="This view has been open a while"
        action={
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={RELOAD_CLASS}
          >
            <RotateCcw aria-hidden className="h-3.5 w-3.5" />
            Reload the dashboard
          </button>
        }
      >
        Power BI stopped accepting the sign-in this view was opened with — they
        last about an hour. Nothing about your access has changed and no figures
        are wrong; reloading reconnects with a current one.
      </Notice>
    );
  }

  if (failure === "render-failed") {
    return <NoAccess reportName={reportName} reason="unknown" />;
  }

  return (
    <div className="relative h-full w-full bg-surface">
      <PowerBiEmbed
        reportId={reportId}
        embedUrl={access.embedUrl}
        accessToken={access.accessToken}
        pageName={pageName}
        activePage={activePage}
        filtersVisible={filtersVisible}
        fit={fit}
        refreshNonce={refreshNonce}
        resetNonce={resetNonce}
        onLoaded={reportLoaded}
        onRendered={reportRendered}
        onFailed={reportFailed}
        onPageChanged={pageChanged}
      />

      <AnimatePresence>
        {ready ? null : (
          <motion.div
            key="skeleton"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            <ReportSkeleton name={reportName} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Shown when a dashboard cannot be displayed for this user. Access to Power BI
 * content is administered in Power BI, never in NuIQ, so the only useful action
 * is to ask whoever owns the workspace.
 */
function NoAccess({
  reportName,
  reason,
}: {
  reportName: string;
  reason: "forbidden" | "no-data-access" | "unknown";
}) {
  const detail = {
    forbidden: "Your account does not have access to this report in Power BI.",
    "no-data-access":
      "You can open this report, but your account cannot read the data behind it. That is usually access to the report without access to its dataset.",
    unknown:
      "This report could not be loaded with your account. That is most often a Power BI permission that has not been granted yet.",
  }[reason];

  return (
    <Notice title="You don't have access to this dashboard">
      <p>{detail}</p>
      <p className="mt-3">
        Ask an administrator to grant your account access to{" "}
        <strong className="font-medium text-ink">{reportName}</strong> in Power
        BI. Access is managed there rather than in NuIQ, so nothing on this
        screen can grant it. A Power BI licence is also required.
      </p>
    </Notice>
  );
}
