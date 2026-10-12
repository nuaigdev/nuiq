import { Film, Settings2 } from "lucide-react";
import Link from "next/link";

import { DashboardCard } from "@/components/gallery/DashboardCard";
import { EmptyGallery } from "@/components/gallery/EmptyGallery";
import { GalleryHeader, HEADER_ACTION_CLASS } from "@/components/gallery/GalleryHeader";
import { CARD, CHIP, FRAME } from "@/components/gallery/gallery-styles";
import { getDashboards } from "@/lib/dashboard-store";
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
        <div className="mx-auto grid max-w-[1600px] items-start gap-6 px-6 py-8 md:grid-cols-2">
          <ul className="grid gap-6 self-start sm:grid-cols-2">
            {dashboards.map((dashboard) => (
              <li key={dashboard.id}>
                <DashboardCard dashboard={dashboard} />
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-6">
            {videos.map((video, i) => (
              <DashboardVideoCard key={video.title ?? i} video={video} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

const DIRECT_FILE = /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i;

function DashboardVideoCard({ video }: { video: GalleryVideo }) {
  return (
    <section aria-label={video.title ?? "Dashboard video"} className={CARD}>
      <div className={FRAME}>
        {DIRECT_FILE.test(video.url) ? (
          <video
            src={video.url}
            poster={video.posterUrl}
            controls
            preload="metadata"
            playsInline
            className="h-full w-full bg-peak-950"
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
            className="h-full w-full bg-peak-950"
          />
        )}
        <span className={CHIP}>Demo</span>
      </div>

      <div className="flex flex-col px-3 pb-3 pt-4">
        <p className="mb-1.5 inline-flex items-center gap-2 text-[11.5px] font-medium text-peak-600">
          <Film aria-hidden className="h-4 w-4" />
          Dashboard walkthrough
        </p>
        <h3 className="text-[16px] font-semibold leading-snug tracking-[-0.01em] text-ink">
          {video.title ?? "Dashboard video"}
        </h3>
      </div>
    </section>
  );
}
