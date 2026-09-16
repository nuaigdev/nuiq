import { Settings2 } from "lucide-react";
import Link from "next/link";

import { DashboardCard } from "@/components/gallery/DashboardCard";
import { EmptyGallery } from "@/components/gallery/EmptyGallery";
import { GalleryHeader, HEADER_ACTION_CLASS } from "@/components/gallery/GalleryHeader";
import { getDashboards } from "@/lib/dashboard-store";
import { getReportEmbedUrl } from "@/lib/powerbi";
import { getSession } from "@/lib/session";
import { getTenantConfig } from "@/lib/tenant-config";

export const metadata = { title: "Power BI Dashboards" };

/**
 * The dashboard index. Each card shows the real report, small and inert, and
 * opening one loads it properly at /dashboards/[reportId] (CLAUDE.md §5 Tab 2).
 *
 * The embed URL is resolved here, per dashboard, as the signed-in user — so a
 * report they cannot open, or whose dataset they cannot read, simply gets no
 * preview and keeps its artwork instead of rendering an empty report. The card
 * itself decides when to load (DashboardPreview): nothing starts until the tile
 * is on screen, and only two start at a time.
 */
export default async function DashboardsPage() {
  const config = await getTenantConfig();
  const dashboards = getDashboards(config);
  const session = await getSession();
  const token = session.powerBiToken;

  const previews = new Map<string, { embedUrl: string; accessToken: string }>();
  if (token) {
    const resolved = await Promise.all(
      dashboards.map(async (dashboard) => {
        const access = await getReportEmbedUrl(
          dashboard.workspaceId,
          dashboard.id,
          token,
        );
        return access.status === "ok"
          ? ([dashboard.id, { embedUrl: access.embedUrl, accessToken: token }] as const)
          : null;
      }),
    );
    for (const entry of resolved) {
      if (entry) previews.set(entry[0], entry[1]);
    }
  }

  return (
    <>
      <GalleryHeader
        logo="/logos/power-bi.png"
        eyebrow="Power BI"
        title="Power BI Dashboards"
        count={
          dashboards.length
            ? `${dashboards.length} ${dashboards.length === 1 ? "dashboard" : "dashboards"}`
            : undefined
        }
        action={
          <Link href="/dashboards/manage" className={HEADER_ACTION_CLASS}>
            <Settings2 aria-hidden className="h-4 w-4" />
            Manage dashboards
          </Link>
        }
      />

      {dashboards.length === 0 ? (
        <EmptyGallery
          message="Add a dashboard with its Power BI workspace and report IDs."
          actionHref="/dashboards/manage"
          actionLabel="Add a dashboard"
        />
      ) : (
        <ul className="mx-auto grid max-w-[1600px] gap-6 px-6 py-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {dashboards.map((dashboard) => (
            <li key={dashboard.id}>
              <DashboardCard
                dashboard={dashboard}
                preview={previews.get(dashboard.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
