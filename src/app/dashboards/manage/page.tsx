import Link from "next/link";

import {
  removeDashboardAction,
  restoreDashboardAction,
} from "@/app/dashboards/actions";
import { AddDashboardForm } from "@/components/AddDashboardForm";
import {
  getDashboards,
  getHiddenConfigDashboards,
} from "@/lib/dashboard-store";
import { getSession } from "@/lib/session";
import { getTenantConfig } from "@/lib/tenant-config";

export const metadata = { title: "Manage dashboards" };

export default async function ManageDashboardsPage() {
  const config = getTenantConfig();
  const [dashboards, hidden, session] = await Promise.all([
    getDashboards(config),
    getHiddenConfigDashboards(config),
    getSession(),
  ]);

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
            Dashboards
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            Manage dashboards
          </h1>
        </div>
        <Link
          href="/dashboards"
          className="rounded border border-hairline bg-surface px-3.5 py-1.5 text-sm text-ink-muted transition-colors hover:border-peak-300 hover:text-ink"
        >
          Back to dashboards
        </Link>
      </div>

      {!session.isAuthenticated ? (
        <p className="mt-6 rounded border border-amber-300 bg-surface p-4 text-sm text-ink-muted">
          Sign in to add or remove dashboards.
        </p>
      ) : null}

      <section className="mt-7">
        <h2 className="text-xs font-medium uppercase tracking-wider text-ink-muted">
          In this portal ({dashboards.length})
        </h2>
        <ul className="mt-3 divide-y divide-hairline overflow-hidden rounded-lg border border-hairline bg-surface">
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
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboards/${dashboard.id}`}
                    className="text-sm font-medium text-ink hover:text-peak-600"
                  >
                    {dashboard.name}
                  </Link>
                  <span
                    className={[
                      "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                      dashboard.source === "config"
                        ? "bg-peak-50 text-peak-700"
                        : "bg-surface-sunken text-ink-muted",
                    ].join(" ")}
                    title={
                      dashboard.source === "config"
                        ? "Ships with this deployment's tenant.json"
                        : "Added from this screen"
                    }
                  >
                    {dashboard.source === "config" ? "config" : "added"}
                  </span>
                </div>
                <dl className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] text-ink-muted">
                  <div className="flex gap-1.5">
                    <dt className="text-ink-muted/60">workspace</dt>
                    <dd>{dashboard.workspaceId}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="text-ink-muted/60">report</dt>
                    <dd>{dashboard.id}</dd>
                  </div>
                  {dashboard.pageName ? (
                    <div className="flex gap-1.5">
                      <dt className="text-ink-muted/60">page</dt>
                      <dd>{dashboard.pageName}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>

              <form action={removeDashboardAction}>
                <input type="hidden" name="id" value={dashboard.id} />
                <button
                  type="submit"
                  disabled={!session.isAuthenticated}
                  className="rounded border border-hairline px-3 py-1.5 text-sm text-ink-muted transition-colors hover:border-amber-400 hover:text-amber-700 disabled:opacity-40"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      {hidden.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-xs font-medium uppercase tracking-wider text-ink-muted">
            Hidden from configuration ({hidden.length})
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-ink-muted">
            These ship in this deployment&rsquo;s{" "}
            <code className="text-ink">tenant.json</code> and cannot be deleted
            from here, so they are hidden instead. Restoring brings one back.
          </p>
          <ul className="mt-3 divide-y divide-hairline overflow-hidden rounded-lg border border-hairline bg-surface">
            {hidden.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-4 p-4"
              >
                <div>
                  <p className="text-sm text-ink">{entry.name}</p>
                  <p className="mt-1 font-mono text-[11px] text-ink-muted">
                    {entry.id}
                  </p>
                </div>
                <form action={restoreDashboardAction}>
                  <input type="hidden" name="id" value={entry.id} />
                  <button
                    type="submit"
                    disabled={!session.isAuthenticated}
                    className="rounded border border-hairline px-3 py-1.5 text-sm text-ink-muted transition-colors hover:border-peak-300 hover:text-ink disabled:opacity-40"
                  >
                    Restore
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-8">
        <AddDashboardForm />
      </section>
    </div>
  );
}
