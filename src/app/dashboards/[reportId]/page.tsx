import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardSwitcher } from "@/components/DashboardSwitcher";
import { PowerBiEmbed } from "@/components/PowerBiEmbed";
import type { Dashboard } from "@/lib/dashboard-store";
import { findDashboard, getDashboards } from "@/lib/dashboard-store";
import { getReportEmbedUrl } from "@/lib/powerbi";
import { getSession } from "@/lib/session";
import { getTenantConfig } from "@/lib/tenant-config";

/**
 * Rendered per request, never prerendered. Without this Next tries to collect
 * static paths for this segment, which evaluates the route in a Node worker —
 * the step that was crashing on hard refresh ("Failed to generate static paths
 * for /dashboards/[reportId]" in the dev log, right before the worker died).
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const dashboard = await findDashboard(getTenantConfig(), reportId);
  return { title: dashboard?.name ?? "Dashboards" };
}

function Notice({
  title,
  tone = "neutral",
  children,
}: {
  title: string;
  tone?: "neutral" | "warn";
  children: React.ReactNode;
}) {
  return (
    <div
      className={[
        "rounded-lg border bg-surface p-8",
        tone === "warn" ? "border-amber-300" : "border-hairline",
      ].join(" ")}
    >
      <h2 className="text-base font-medium text-ink">{title}</h2>
      <div className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
        {children}
      </div>
    </div>
  );
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const config = getTenantConfig();

  const dashboards = await getDashboards(config);
  // Only dashboards this deployment knows about may be opened. A report id from
  // the URL never reaches Power BI unless it is in this list.
  const dashboard = dashboards.find((item) => item.id === reportId);
  if (!dashboard) notFound();

  const session = await getSession();

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/dashboards"
            className="text-xs font-medium uppercase tracking-wider text-ink-muted transition-colors hover:text-peak-600"
          >
            &larr; All dashboards
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            {dashboard.name}
          </h1>
        </div>
        <Link
          href="/dashboards/manage"
          className="rounded border border-hairline bg-surface px-3.5 py-1.5 text-sm text-ink-muted transition-colors hover:border-peak-300 hover:text-ink"
        >
          Manage dashboards
        </Link>
      </div>

      <DashboardSwitcher dashboards={dashboards} activeId={dashboard.id} />

      <div className="mt-5">
        <ReportBody dashboard={dashboard} session={session} />
      </div>
    </div>
  );
}

async function ReportBody({
  dashboard,
  session,
}: {
  dashboard: Dashboard;
  session: Awaited<ReturnType<typeof getSession>>;
}) {
  if (session.sessionExpired) {
    return (
      <Notice tone="warn" title="Your session has expired">
        Your Microsoft sign-in has timed out, so Power BI will not accept it any
        more. Sign out and back in from the top right to reconnect. This is not a
        permissions problem — nothing about your access has changed.
      </Notice>
    );
  }

  if (!session.isAuthenticated || !session.powerBiToken) {
    return (
      <Notice title="Sign in to view this dashboard">
        Reports load with your own Microsoft account, so Power BI applies your
        permissions directly. Use{" "}
        <strong className="font-medium text-ink">Sign in</strong> at the top
        right.
      </Notice>
    );
  }

  const access = await getReportEmbedUrl(
    dashboard.workspaceId,
    dashboard.id,
    session.powerBiToken,
  );

  if (access.status === "forbidden") {
    return (
      <Notice tone="warn" title="You do not have access to this dashboard">
        You are signed in, but Power BI has not granted your account access to{" "}
        <strong className="font-medium text-ink">{dashboard.name}</strong>.
        Access is managed in Power BI, not in NuIQ — ask whoever administers the
        workspace to share the report with you. A Power BI licence is also
        required.
      </Notice>
    );
  }

  if (access.status === "not-found") {
    return (
      <Notice tone="warn" title="Not found in that workspace">
        Power BI cannot find this report in workspace{" "}
        <code className="text-ink">{dashboard.workspaceId}</code>. Check the
        workspace and report IDs on the{" "}
        <Link href="/dashboards/manage" className="text-peak-600 underline underline-offset-4">
          manage screen
        </Link>
        , or the report may have been deleted.
      </Notice>
    );
  }

  if (access.status === "error") {
    return <Notice tone="warn" title="Could not load this dashboard">{access.detail}</Notice>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-hairline bg-surface shadow-[0_1px_2px_rgba(20,24,31,0.04)]">
      <PowerBiEmbed
        reportId={dashboard.id}
        embedUrl={access.embedUrl}
        accessToken={session.powerBiToken}
        pageName={dashboard.pageName}
      />
    </div>
  );
}
