"use client";

import { models } from "powerbi-client";
import { PowerBIEmbed } from "powerbi-client-react";
import { useState } from "react";

/**
 * A real report, rendered small and inert as a tile preview.
 *
 * IMPORTANT: this module must never be imported on the server. `powerbi-client`
 * is a browser bundle that touches `self` at import time, so evaluating it in
 * Node crashes the render worker (Next surfaces it as "Jest worker encountered
 * N child process exceptions"). It is reached only through DashboardPreview,
 * which loads it with `ssr: false` behind a browser gate and only once the tile
 * is actually on screen. Do not import it directly.
 *
 * Embedded with the signed-in user's own token, like every other Power BI call
 * in this app (CLAUDE.md §5 Tab 2) — a preview shows exactly what that person
 * is entitled to see, and nothing is asserted on their behalf.
 */

export type DashboardPreviewEmbedProps = {
  reportId: string;
  embedUrl: string;
  accessToken: string;
  pageName?: string;
  /** Called when the report fails, so the tile can fall back to its artwork. */
  onFailed: () => void;
  /** Called once this preview is done loading, either way, so the next starts. */
  onSettled: () => void;
};

export default function DashboardPreviewEmbed({
  reportId,
  embedUrl,
  accessToken,
  pageName,
  onFailed,
  onSettled,
}: DashboardPreviewEmbedProps) {
  const [rendered, setRendered] = useState(false);

  return (
    <div
      className={`h-full w-full transition-opacity duration-500 ${
        rendered ? "opacity-100" : "opacity-0"
      }`}
    >
      <PowerBIEmbed
        embedConfig={{
          type: "report",
          id: reportId,
          embedUrl,
          accessToken,
          tokenType: models.TokenType.Aad,
          pageName,
          settings: {
            /* Nothing to drive: no panes, no chrome, no interaction. The tile
               is a picture of the report, and the card is the way in. */
            panes: {
              filters: { visible: false },
              pageNavigation: { visible: false },
            },
            background: models.BackgroundType.Transparent,
            layoutType: models.LayoutType.Custom,
            customLayout: { displayOption: models.DisplayOption.FitToPage },
          },
        }}
        eventHandlers={
          new Map([
            [
              "rendered",
              () => {
                setRendered(true);
                onSettled();
              },
            ],
            [
              "error",
              () => {
                onFailed();
                onSettled();
              },
            ],
          ])
        }
        cssClassName="h-full w-full [&>iframe]:border-0"
      />
    </div>
  );
}
