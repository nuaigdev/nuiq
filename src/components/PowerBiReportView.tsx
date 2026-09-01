"use client";

import { models } from "powerbi-client";
import { PowerBIEmbed } from "powerbi-client-react";

/**
 * The actual Power BI embed.
 *
 * IMPORTANT: this module must never be imported on the server. `powerbi-client`
 * is a browser bundle that touches `self` at import time, so evaluating it in
 * Node crashes the render worker (Next surfaces this as "Jest worker
 * encountered N child process exceptions"). It is reached only through
 * PowerBiEmbed, which loads it with `ssr: false`. Do not import it directly.
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
}: {
  reportId: string;
  embedUrl: string;
  accessToken: string;
  pageName?: string;
}) {
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
      cssClassName="h-[78vh] w-full"
    />
  );
}
