"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

/**
 * Browser-only wrapper around the Power BI embed.
 *
 * `powerbi-client` is a browser bundle: it references `self` at import time, so
 * evaluating it in Node kills the render worker. Next reports that as "Jest
 * worker encountered N child process exceptions", which names neither the
 * module nor the cause — so if that error ever returns, suspect this file.
 *
 * Two guards, because one was not enough:
 *
 *  1. `ssr: false` keeps it out of server rendering. "use client" alone does
 *     not: client components are still server-rendered.
 *  2. A mount gate. `ssr: false` still leaves the import reachable from the
 *     module graph, and Next evaluates that graph in a Node worker during route
 *     compilation and static-path collection — which is why the crash came back
 *     on a hard refresh (a hard refresh forces a recompile) while ordinary
 *     navigation was fine. Gating on mount means the import is only ever
 *     triggered by a real browser, after hydration.
 *
 * Do not remove either guard, and do not import PowerBiReportView directly.
 */
const PowerBiReportView = dynamic(() => import("./PowerBiReportView"), {
  ssr: false,
});

/**
 * False while rendering on the server, true once running in a browser.
 * useSyncExternalStore is the idiomatic way to express this: it has a distinct
 * server snapshot, so there is no hydration mismatch and no state-in-effect.
 */
const neverChanges = () => () => {};
function useIsBrowser(): boolean {
  return useSyncExternalStore(
    neverChanges,
    () => true,
    () => false,
  );
}

function EmbedFrame({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="flex h-[78vh] w-full items-center justify-center bg-surface-sunken"
    >
      <span className="text-sm text-ink-muted">{label}</span>
    </div>
  );
}

export function PowerBiEmbed(props: {
  reportId: string;
  embedUrl: string;
  accessToken: string;
  pageName?: string;
  reportName: string;
}) {
  const isBrowser = useIsBrowser();

  if (!isBrowser) {
    return <EmbedFrame label="Loading dashboard…" />;
  }

  return <PowerBiReportView {...props} />;
}
