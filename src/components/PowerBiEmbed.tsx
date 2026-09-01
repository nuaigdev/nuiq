"use client";

import dynamic from "next/dynamic";

/**
 * Browser-only wrapper around the Power BI embed.
 *
 * `powerbi-client` is a browser bundle: it references `self` at import time, so
 * server-rendering it crashes the Next render worker. Client components are
 * still server-rendered by default, so marking the embed "use client" is not
 * enough on its own — it has to be excluded from SSR explicitly, which is what
 * `ssr: false` does here. `ssr: false` is only permitted inside a client
 * component, which is why this thin wrapper exists.
 */
const PowerBiReportView = dynamic(() => import("./PowerBiReportView"), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      aria-label="Loading dashboard"
      className="flex h-[78vh] w-full items-center justify-center bg-surface-sunken"
    >
      <span className="text-sm text-ink-muted">Loading dashboard…</span>
    </div>
  ),
});

export function PowerBiEmbed(props: {
  reportId: string;
  embedUrl: string;
  accessToken: string;
  pageName?: string;
}) {
  return <PowerBiReportView {...props} />;
}
