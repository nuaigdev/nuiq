import Link from "next/link";

import type { Dashboard } from "@/lib/dashboard-store";

/**
 * A dashboard tile: a still preview, never a live embed.
 *
 * The index shows every dashboard at once, so embedding each one would mean N
 * Power BI iframes loading in parallel — slow, and pointless when nobody is
 * reading them yet. Clicking through opens the real, interactive report.
 *
 * Power BI publishes no public report-thumbnail API, so a preview image is
 * supplied per dashboard (`thumbnailUrl`). Without one, the tile draws a
 * deterministic facet pattern instead. That placeholder is deliberately
 * abstract: a fake mini bar chart would be a dashboard-template cliché and
 * would also imply data that is not really there (CLAUDE.md §8).
 */

/** Stable small integer from a dashboard id, so a tile always looks the same. */
function hashOf(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function FacetPlaceholder({ seed }: { seed: string }) {
  const hash = hashOf(seed);
  // Three facets whose split points vary per dashboard.
  const a = 20 + (hash % 25); // 20–44
  const b = 55 + ((hash >> 4) % 25); // 55–79
  const lift = 12 + ((hash >> 8) % 16); // 12–27

  return (
    <svg
      viewBox="0 0 160 90"
      preserveAspectRatio="none"
      aria-hidden
      className="h-full w-full"
    >
      <rect width="160" height="90" className="fill-peak-50" />
      <polygon points={`0,90 ${a},${lift} ${a + 30},90`} className="fill-peak-300/45" />
      <polygon points={`${a},${lift} ${b},${lift + 18} ${b},90 ${a + 30},90`} className="fill-peak-600/35" />
      <polygon points={`${b},${lift + 18} 160,${lift - 4} 160,90 ${b},90`} className="fill-peak-800/25" />
    </svg>
  );
}

export function DashboardTile({ dashboard }: { dashboard: Dashboard }) {
  return (
    <Link
      href={`/dashboards/${dashboard.id}`}
      className="group block overflow-hidden rounded-lg border border-hairline bg-surface transition-colors hover:border-peak-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peak-600"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-hairline bg-peak-50">
        {dashboard.thumbnailUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element -- operator-supplied URL, dimensions unknown */
          <img
            src={dashboard.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <FacetPlaceholder seed={dashboard.id} />
        )}
        <span className="absolute right-2 top-2 rounded bg-peak-950/75 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-peak-100">
          Preview
        </span>
      </div>

      <div className="p-4">
        <h2 className="text-sm font-medium text-ink group-hover:text-peak-700">
          {dashboard.name}
        </h2>
        <p className="mt-1 font-mono text-[11px] text-ink-muted">
          {dashboard.workspaceId.slice(0, 8)}…
        </p>
      </div>
    </Link>
  );
}
