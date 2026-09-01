import Link from "next/link";

import { DashboardTile } from "@/components/DashboardTile";
import { getDashboards } from "@/lib/dashboard-store";
import { getTenantConfig } from "@/lib/tenant-config";

export const metadata = { title: "Dashboards" };

/**
 * The dashboard index: still-preview tiles, not live embeds. Opening a tile
 * loads the real report at /dashboards/[reportId] (CLAUDE.md §5 Tab 2).
 */
export default async function DashboardsPage() {
  const config = await getTenantConfig();
  const dashboards = getDashboards(config);

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-peak-600">
            Power BI
          </p>
          <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-tight text-ink">
            Dashboards
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
            The Power BI reports built on your warehouse — census and occupancy,
            falls and incidents, staffing — opened with your own Microsoft
            account. You see exactly the communities you are entitled to, because
            Power BI applies your permissions rather than NuIQ deciding for you.
          </p>
        </div>
        <Link
          href="/dashboards/manage"
          className="shrink-0 rounded-lg border border-hairline-strong bg-surface px-3.5 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-peak-300 hover:text-ink"
        >
          Manage dashboards
        </Link>
      </div>

      {dashboards.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-hairline bg-surface p-10 text-center">
          <p className="text-sm text-ink-muted">
            Add a dashboard with its Power BI workspace and report IDs.
          </p>
          <Link
            href="/dashboards/manage"
            className="mt-4 inline-block rounded bg-peak-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-peak-700"
          >
            Add a dashboard
          </Link>
        </div>
      ) : (
        <ul className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {dashboards.map((dashboard) => (
            <li key={dashboard.id}>
              <DashboardTile dashboard={dashboard} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
