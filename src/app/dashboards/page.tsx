import Link from "next/link";
import { redirect } from "next/navigation";

import { getDashboards } from "@/lib/dashboard-store";
import { getTenantConfig } from "@/lib/tenant-config";

export const metadata = { title: "Dashboards" };

export default async function DashboardsPage() {
  const config = getTenantConfig();
  const dashboards = await getDashboards(config);
  const first = dashboards[0];

  if (first) {
    redirect(`/dashboards/${first.id}`);
  }

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-7">
      <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
        Dashboards
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
        No dashboards yet
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted">
        Nothing is configured for this portal yet. Add one with its Power BI
        workspace and report IDs.
      </p>
      <Link
        href="/dashboards/manage"
        className="mt-5 inline-block rounded bg-peak-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-peak-700"
      >
        Add a dashboard
      </Link>
    </div>
  );
}
