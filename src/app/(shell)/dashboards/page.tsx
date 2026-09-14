import { Settings2 } from "lucide-react";
import Link from "next/link";

import { DashboardCard } from "@/components/gallery/DashboardCard";
import { EmptyGallery } from "@/components/gallery/EmptyGallery";
import { GalleryHeader, HEADER_ACTION_CLASS } from "@/components/gallery/GalleryHeader";
import { getDashboards } from "@/lib/dashboard-store";
import { getTenantConfig } from "@/lib/tenant-config";

export const metadata = { title: "Power BI Dashboards" };

/**
 * The dashboard index: still-preview cards, not live embeds. Opening a card
 * loads the real report at /dashboards/[reportId] (CLAUDE.md §5 Tab 2).
 */
export default async function DashboardsPage() {
  const config = await getTenantConfig();
  const dashboards = getDashboards(config);

  return (
    <>
      <GalleryHeader
        logo="/logos/power-bi.png"
        eyebrow="Power BI"
        title="Power BI Dashboards"
        intro="Census and occupancy, falls and incidents, staffing — the reports built on your warehouse, opened with your own Microsoft account, so you see exactly the communities you are entitled to."
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
              <DashboardCard dashboard={dashboard} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
