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
  const config = getTenantConfig();
  const dashboards = await getDashboards(config);

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
            Dashboards
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            Power BI Dashboards
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            {dashboards.length === 0
              ? "Nothing configured for this portal yet."
              : "Open a dashboard to view it live."}
          </p>
        </div>
        <Link
          href="/dashboards/manage"
          className="rounded border border-hairline bg-surface px-3.5 py-1.5 text-sm text-ink-muted transition-colors hover:border-peak-300 hover:text-ink"
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
