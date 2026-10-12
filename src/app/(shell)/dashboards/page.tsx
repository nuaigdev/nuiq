import { Film, Settings2 } from "lucide-react";
import Link from "next/link";

import { DashboardCard } from "@/components/gallery/DashboardCard";
import { EmptyGallery } from "@/components/gallery/EmptyGallery";
import { GalleryHeader, HEADER_ACTION_CLASS } from "@/components/gallery/GalleryHeader";
import { getDashboards, type Dashboard } from "@/lib/dashboard-store";
import { getTenantConfig, type GalleryVideo } from "@/lib/tenant-config";

export const metadata = { title: "Power BI Dashboards" };

/**
 * The dashboard index: a still image per dashboard, never a live embed.
 *
 * Embedding the real report on every tile was tried and removed. It was slow by
 * construction — each tile had to resolve an embed URL and then render a whole
 * report in an iframe before it showed anything — and none of that work is
 * worth it for a picture somebody looks at for a second before clicking
 * through. The image is supplied per dashboard instead (`thumbnailUrl`), and
 * opening a card still loads the real, interactive report.
 *
 * A dashboard that also has a walkthrough video (`videos.dashboards`) is paired
 * with it, tile and video side by side at the same size — matched by the
 * video's `title` against the dashboard's own name, not by a hardcoded id, so
 * this keeps working if dashboards are reordered or a new one is added.
 */
export default async function DashboardsPage() {
  const config = await getTenantConfig();
  const dashboards = getDashboards(config);
  const videos = config.videos.dashboards;

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
        <ul className="mx-auto flex max-w-[920px] flex-col gap-6 px-6 py-8">
          {dashboards.map((dashboard) => (
            <li key={dashboard.id} className="grid gap-5 sm:grid-cols-2">
              <DashboardCard dashboard={dashboard} />
              <DashboardVideoTile video={matchVideo(dashboard, videos)} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Matches a dashboard video to its tile by name, not by a hardcoded id. */
function matchVideo(dashboard: Dashboard, videos: GalleryVideo[]): GalleryVideo | undefined {
  const name = dashboard.name.trim().toLowerCase();
  return videos.find((video) => video.title?.trim().toLowerCase() === name);
}

const DIRECT_FILE = /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i;

/**
 * Same shape and size as `DashboardCard` — a 16:10 frame in a rounded-2xl card
 * with the same padding — so the pair reads as one row, not a tile beside an
 * oversized video.
 */
function DashboardVideoTile({ video }: { video: GalleryVideo | undefined }) {
  return (
    <div className="card flex h-full flex-col rounded-2xl p-2.5">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-canvas-line bg-peak-950">
        {video ? (
          DIRECT_FILE.test(video.url) ? (
            <video
              src={video.url}
              poster={video.posterUrl}
              controls
              preload="metadata"
              playsInline
              className="h-full w-full object-contain"
            >
              <track kind="captions" />
            </video>
          ) : (
            <iframe
              src={video.url}
              title={video.title ?? "Dashboard video"}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              className="h-full w-full"
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-[12.5px] font-medium text-peak-200">Video coming soon</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 items-start gap-3 px-2.5 pb-2 pt-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-canvas-line bg-surface">
          <Film aria-hidden className="h-4 w-4 text-peak-600" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold leading-snug text-ink">Walkthrough</h2>
          <p className="mt-1 text-[12px] text-ink-subtle">
            {video ? "See this dashboard in action" : "Not yet recorded"}
          </p>
        </div>
      </div>
    </div>
  );
}
