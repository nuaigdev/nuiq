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

    const warm = () => {
      if (cancelled) return;

      fetch("/api/dashboard-previews").catch(() => {});
      // Same module the tiles load with ssr:false, so this is a cache fill
      // rather than a second copy.
      import("./DashboardPreviewEmbed").catch(() => {});
    };

    // Safari has no requestIdleCallback; a short timer is close enough. The
    // DOM types declare it as always present, hence the runtime check.
    const canIdle = typeof window.requestIdleCallback === "function";
    const handle = canIdle
      ? window.requestIdleCallback(warm, { timeout: 4000 })
      : window.setTimeout(warm, 1500);

    return () => {
      cancelled = true;
      if (canIdle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, []);

  return null;
}
