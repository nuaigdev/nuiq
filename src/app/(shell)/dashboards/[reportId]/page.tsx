import { notFound } from "next/navigation";

import { DashboardWorkspace } from "@/components/dashboard/DashboardWorkspace";
import type { ReportAccess } from "@/components/dashboard/ReportFrame";
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
  const dashboard = findDashboard(await getTenantConfig(), reportId);
  return { title: dashboard?.name ?? "Dashboards" };
}

/**
 * Resolve what this user can actually see, before the browser is involved.
 *
 * Each outcome stays its own state all the way to the screen. An expired
 * session, a report they cannot open, and a report they can open but whose
 * dataset they cannot read need three different pieces of advice, and collapsing
 * them into one message leaves people with no idea who to ask (CLAUDE.md §5).
 */
async function resolveAccess(
  dashboard: Dashboard,
  session: Awaited<ReturnType<typeof getSession>>,
): Promise<ReportAccess> {
  if (session.sessionExpired) return { kind: "session-expired" };
  if (!session.isAuthenticated || !session.powerBiToken) {
    return { kind: "signed-out" };
  }

  const access = await getReportEmbedUrl(
    dashboard.workspaceId,
    dashboard.id,
    session.powerBiToken,
  );

  switch (access.status) {
    case "forbidden":
      return { kind: "forbidden" };
    // Openable, but the data behind it is not readable — Power BI would render
    // an empty report, which reads as broken rather than as a permission
    // problem.
    case "no-data-access":
      return { kind: "no-data-access" };
    case "not-found":
      return { kind: "not-found", workspaceId: dashboard.workspaceId };
    case "error":
      return { kind: "error", detail: access.detail };
    default:
      return {
        kind: "ready",
        embedUrl: access.embedUrl,
        accessToken: session.powerBiToken,
      };
  }
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const config = await getTenantConfig();

  const dashboards = getDashboards(config);
  // Only dashboards this deployment knows about may be opened. A report id from
  // the URL never reaches Power BI unless it is in this list.
  const dashboard = dashboards.find((item) => item.id === reportId);
  if (!dashboard) notFound();

  const access = await resolveAccess(dashboard, await getSession());

  return (
    <DashboardWorkspace
      reportId={dashboard.id}
      reportName={dashboard.name}
      pageName={dashboard.pageName}
      access={access}
      dashboards={dashboards.map(({ id, name }) => ({ id, name }))}
    />
  );
}
