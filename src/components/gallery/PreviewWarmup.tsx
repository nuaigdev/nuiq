"use client";

import { useEffect } from "react";

/**
 * Gets the dashboard tile previews ready before anyone asks for them.
 *
 * Rendered once in the shell, so it runs on whatever page the portal is opened
 * at. Once the browser is idle it does two things, both of which are the slow
 * part of a tile preview:
 *
 *  1. calls /api/dashboard-previews, which resolves every dashboard's embed URL
 *     and fills the server-side cache — so the gallery has no lookup to wait
 *     for when it is opened;
 *  2. pulls the Power BI client bundle into the browser cache, since that chunk
 *     is otherwise only fetched the moment the first tile tries to render.
 *
 * Failures are ignored on purpose. This is a head start, not a dependency: with
 * none of it the gallery behaves exactly as it did, only slower.
 */
export function PreviewWarmup() {
  useEffect(() => {
    let cancelled = false;

    const warm = async () => {
      if (cancelled) return;

      // Same module the tiles load with ssr:false, so this is a cache fill
      // rather than a second copy.
      import("./DashboardPreviewEmbed").catch(() => {});

      try {
        const response = await fetch("/api/dashboard-previews");
        if (!response.ok || cancelled) return;
        const body = (await response.json()) as {
          previews: { embedUrl: string }[];
        };

        // Pull each report's embed document into the browser cache. The tiles
        // still mount the real embed; this just means the frame's own HTML and
        // the TLS handshake are already paid for when they do.
        for (const preview of body.previews.slice(0, 4)) {
          fetch(preview.embedUrl, {
            mode: "no-cors",
            credentials: "omit",
          }).catch(() => {});
        }
      } catch {
        /* A head start, not a dependency. */
      }
    };

    // Safari has no requestIdleCallback; a short timer is close enough. The
    // DOM types declare it as always present, hence the runtime check.
    const canIdle = typeof window.requestIdleCallback === "function";
    const handle = canIdle
      ? window.requestIdleCallback(() => void warm(), { timeout: 2000 })
      : window.setTimeout(() => void warm(), 800);

    return () => {
      cancelled = true;
      if (canIdle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, []);

  return null;
}
