import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import type { Dashboard } from "@/lib/dashboard-store";

/**
 * A dashboard in the gallery: a still preview, never a live embed.
 *
 * The index shows every dashboard at once, so embedding each would mean N Power
 * BI iframes loading in parallel for reports nobody is reading yet. Opening the
 * card loads the real, interactive report at /dashboards/[reportId].
 *
 * The preview sits in a mat — a report seen on a screen rather than a picture
 * pasted onto a card. Power BI publishes no public thumbnail API, so the image
 * is `thumbnailUrl` when supplied and otherwise a deterministic facet field.
 * That placeholder is deliberately abstract: a fake mini chart would be the
 * dashboard-template cliché CLAUDE.md §8 rules out, and would imply data that
 * is not there.
 */

function hashOf(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function FacetPreview({ seed }: { seed: string }) {
  const hash = hashOf(seed);
  const a = 36 + (hash % 50);
  const b = 120 + ((hash >> 4) % 60);
  const lift = 40 + ((hash >> 8) % 40);
  const drift = (hash >> 12) % 3;

  return (
    <svg
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      className="h-full w-full"
    >
      <rect width="320" height="200" className="fill-peak-50" />
      <polygon points={`0,200 0,${lift + 60} ${a},${lift} ${a + 70},200`} className="fill-peak-200/70" />
      <polygon points={`${a},${lift} ${b},${lift + 40} ${b + 30},200 ${a + 70},200`} className="fill-peak-400/45" />
      <polygon points={`${b},${lift + 40} 260,${lift - 10} 320,${lift + 30} 320,200 ${b + 30},200`} className="fill-peak-600/30" />
      <polygon points={`260,${lift - 10} 320,${lift - 30} 320,${lift + 30}`} className="fill-peak-700/25" />
      <g className={["agent-drift-a", "agent-drift-b", "agent-drift-c"][drift]}>
        <polygon points="54,34 80,22 74,52" className="fill-peak-300/45" />
      </g>
    </svg>
  );
}

export function DashboardCard({ dashboard }: { dashboard: Dashboard }) {
  return (
    <Link
      href={`/dashboards/${dashboard.id}`}
      className="group card flex h-full flex-col rounded-2xl p-2.5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-peak-200 hover:shadow-[0_18px_40px_-22px_rgba(29,58,158,0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peak-500"
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-canvas-line bg-canvas-ground">
        <div className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.03]">
          {dashboard.thumbnailUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element -- operator-supplied URL, dimensions unknown */
            <img
              src={dashboard.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <FacetPreview seed={dashboard.id} />
          )}
        </div>

        {/* A wash and an "open" mark on hover, so the whole frame reads as the
            way in rather than only the title beneath it. */}
        <div className="absolute inset-0 flex items-center justify-center bg-peak-950/0 transition-colors duration-200 group-hover:bg-peak-950/35">
          <span className="inline-flex translate-y-1 items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[12.5px] font-semibold text-peak-800 opacity-0 shadow-sm transition-[opacity,transform] duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            Open report
            <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
          </span>
        </div>

        <span className="absolute left-2.5 top-2.5 rounded-md bg-peak-950/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-peak-100">
          Preview
        </span>
      </div>

      <div className="flex flex-1 items-start gap-3 px-2.5 pb-2 pt-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-canvas-line bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element -- small static mark from /public */}
          <img src="/logos/power-bi.png" alt="" width={20} height={20} className="h-5 w-5 object-contain" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold leading-snug text-ink group-hover:text-peak-700">
            {dashboard.name}
          </h2>
          <p className="mt-1 text-[12px] text-ink-subtle">
            Workspace{" "}
            <span className="font-mono text-[11px]">
              {dashboard.workspaceId.slice(0, 8)}…
            </span>
          </p>
        </div>
        <ArrowUpRight
          aria-hidden
          className="mt-0.5 h-4 w-4 shrink-0 text-ink-subtle transition-[color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-peak-600"
        />
      </div>
    </Link>
  );
}
