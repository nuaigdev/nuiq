import { Settings2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { DashboardCard } from "@/components/gallery/DashboardCard";
import { DashboardPreview } from "@/components/gallery/DashboardPreview";
import { EmptyGallery } from "@/components/gallery/EmptyGallery";
import { GalleryHeader, HEADER_ACTION_CLASS } from "@/components/gallery/GalleryHeader";
import { getDashboards, type Dashboard } from "@/lib/dashboard-store";
import { getPreviewEmbedUrl } from "@/lib/powerbi";
import { getSession } from "@/lib/session";
import { getTenantConfig } from "@/lib/tenant-config";

export const metadata = { title: "Power BI Dashboards" };

/**
 * The dashboard index. Each card shows the real report, small and inert, and
 * opening one loads it properly at /dashboards/[reportId] (CLAUDE.md §5 Tab 2).
 *
 * Nothing about a preview blocks the page. Each resolves its embed URL inside
 * its own Suspense boundary and streams in when ready, so the gallery paints as
 * soon as the config is read — a slow or unreachable report costs that one
 * tile, not the page.
 */
export default async function DashboardsPage() {
  const config = await getTenantConfig();
  const dashboards = getDashboards(config);
  const session = await getSession();
  const token = session.powerBiToken;

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
                preview={
                  token ? (
                    <Suspense fallback={null}>
                      <LivePreview dashboard={dashboard} token={token} />
                    </Suspense>
                  ) : null
                }
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/**
 * One tile's preview, resolved as the signed-in user. A report they cannot open
 * returns nothing and the tile keeps its artwork, rather than embedding a frame
 * that can only render an error.
 */
async function LivePreview({
  dashboard,
  token,
}: {
  dashboard: Dashboard;
  token: string;
}) {
  const embedUrl = await getPreviewEmbedUrl(
    dashboard.workspaceId,
    dashboard.id,
    token,
  );
  if (!embedUrl) return null;

  return (
    <DashboardPreview
      reportId={dashboard.id}
      embedUrl={embedUrl}
      accessToken={token}
      pageName={dashboard.pageName}
    />
  );
}
