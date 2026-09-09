import Link from "next/link";

import { AddDashboardForm } from "@/components/AddDashboardForm";
import { RemoveDashboardButton } from "@/components/RemoveDashboardButton";
import { checkAdmin } from "@/lib/admin";
import { getDashboards } from "@/lib/dashboard-store";
import { getTenantConfig } from "@/lib/tenant-config";

export const metadata = { title: "Manage dashboards" };

export default async function ManageDashboardsPage() {
  const config = await getTenantConfig();
  const dashboards = getDashboards(config);
  const admin = await checkAdmin();

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-9">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-peak-600">
            Administration
          </p>
          <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-tight text-ink">
            Manage dashboards
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
            Dashboards added here appear for everyone using this portal, and take
            effect immediately without a redeploy.
          </p>
        </div>
        <Link
          href="/dashboards"
          className="shrink-0 rounded-lg border border-hairline-strong bg-surface px-3.5 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-peak-300 hover:text-ink"
        >
          Back to dashboards
        </Link>
      </div>

      {!admin.allowed ? (
        <p className="mt-7 rounded-lg border border-caution-border bg-surface p-4 text-sm leading-relaxed text-ink-muted">
          {admin.reason}
        </p>
      ) : null}

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
          In this portal ({dashboards.length})
        </h2>
        <ul className="card mt-3 divide-y divide-hairline overflow-hidden rounded-xl">
          {dashboards.length === 0 ? (
            <li className="p-6 text-sm text-ink-muted">
              No dashboards yet. Add one below.
            </li>
          ) : null}
          {dashboards.map((dashboard) => (
            <li
              key={dashboard.id}
              className="flex flex-wrap items-center justify-between gap-4 p-4"
            >
              <div className="min-w-0">
                <Link
                  href={`/dashboards/${dashboard.id}`}
                  className="text-sm font-medium text-ink hover:text-peak-600"
                >
                  {dashboard.name}
                </Link>
                <dl className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] text-ink-muted">
                  <div className="flex gap-1.5">
                    <dt className="text-ink-subtle">workspace</dt>
                    <dd>{dashboard.workspaceId}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="text-ink-subtle">report</dt>
                    <dd>{dashboard.id}</dd>
                  </div>
                  {dashboard.pageName ? (
                    <div className="flex gap-1.5">
                      <dt className="text-ink-subtle">page</dt>
                      <dd>{dashboard.pageName}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>

              <RemoveDashboardButton
                id={dashboard.id}
                name={dashboard.name}
                disabled={!admin.allowed}
              />
            </li>
          ))}
        </ul>
      </section>

      {admin.allowed ? (
        <section className="mt-8">
          <AddDashboardForm />
        </section>
      ) : null}
    </div>
  );
}
