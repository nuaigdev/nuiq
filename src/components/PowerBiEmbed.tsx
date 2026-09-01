"use client";

import { models } from "powerbi-client";
import { PowerBIEmbed } from "powerbi-client-react";

/**
 * Renders a Power BI report with the signed-in user's own Entra token
 * (tokenType: Aad — "user owns data"). Power BI applies that user's
 * permissions and row-level security directly; NuIQ asserts nothing.
 */
export function PowerBiEmbed({
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
