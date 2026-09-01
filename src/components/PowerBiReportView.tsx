"use client";

import { models } from "powerbi-client";
import { PowerBIEmbed } from "powerbi-client-react";
import { useMemo, useState } from "react";

import { NoAccessBanner } from "./NoAccessBanner";

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
 */

export default function PowerBiReportView({
  reportId,
  embedUrl,
  accessToken,
  pageName,
  reportName,
}: {
  reportId: string;
  embedUrl: string;
  accessToken: string;
  pageName?: string;
  reportName: string;
}) {
  const [failed, setFailed] = useState(false);

  /**
   * The server pre-checks report and dataset access, but Power BI can still
   * refuse at render time — a visual-level permission, an RLS role that does
   * not resolve, a token that expired mid-session. Without this the embed just
   * sits there empty, which looks like a broken dashboard rather than a
   * permission problem. Catch the error and say what it is.
   */
  const eventHandlers = useMemo(
    () =>
      new Map<string, (event?: { detail?: unknown }) => void>([
        [
          "error",
          (event) => {
            console.error("[NuIQ] Power BI embed error", event?.detail);
            setFailed(true);
          },
        ],
      ]),
    [],
  );

  if (failed) {
    return <NoAccessBanner reportName={reportName} reason="unknown" />;
  }

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
          panes: {
            filters: { visible: false },
            pageNavigation: { visible: true },
          },
        },
      }}
      eventHandlers={eventHandlers}
      cssClassName="h-[78vh] w-full"
    />
  );
}
