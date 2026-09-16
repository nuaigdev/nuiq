import { Clapperboard, Rocket } from "lucide-react";

import type { GalleryVideo } from "@/lib/tenant-config";

import { AgentCard, type GalleryAgent } from "./AgentCard";
import { GalleryArt, type ArtScene } from "./GalleryArt";
import { CARD, CHIP, FRAME } from "./gallery-styles";

/**
 * The body of both agent tabs (§5 Tabs 3 and 4): three columns of one card.
 *
 *   1. every agent this deployment has, each opening its own conversation;
 *   2. one demo video for the page;
 *   3. one launch video for the page.
 *
 * Agents can be many; the videos are one each per page, not per agent. Every
 * card is the same object (see gallery-styles), and each is only as tall as its
 * own content — adding a third agent must not stretch the video cards.
 *
 * Videos come from the client's config (`videos.dataAgents` / `videos.aiAgents`).
 * Until one is set, its card keeps its picture and says the video is coming,
 * rather than collapsing and leaving the row lopsided.
 */

export type { GalleryAgent };

export type VideoSlot = {
  kind: "demo" | "launch";
  heading: string;
  blurb: string;
  video?: GalleryVideo;
};

export function AgentGallery({
  agents,
  videos,
  listLabel,
}: {
  agents: GalleryAgent[];
  videos: [VideoSlot, VideoSlot];
  listLabel: string;
}) {
  return (
    <div className="mx-auto grid max-w-[1600px] items-start gap-6 px-6 py-8 md:grid-cols-2 lg:grid-cols-3">
      <section aria-label={listLabel} className="flex flex-col gap-6">
        {agents.map((agent) => (
          <AgentCard key={agent.href} agent={agent} />
        ))}
      </section>

      {videos.map((slot) => (
        <VideoCard key={slot.kind} slot={slot} />
      ))}
    </div>
  );
}

const SLOT_META = {
  demo: { label: "Demo video", Icon: Clapperboard, scene: "demo" as ArtScene },
  launch: { label: "Launch video", Icon: Rocket, scene: "launch" as ArtScene },
} as const;

function VideoCard({ slot }: { slot: VideoSlot }) {
  const { label, Icon, scene } = SLOT_META[slot.kind];
  const ready = Boolean(slot.video);

  return (
    <section aria-label={label} className={CARD}>
      <div className={FRAME}>
        {slot.video ? (
          <VideoPlayer video={slot.video} label={label} />
        ) : (
          <>
            <GalleryArt scene={scene} />
            <span className={CHIP}>{slot.kind === "demo" ? "Demo" : "Launch"}</span>
          </>
        )}
      </div>

      <div className="flex flex-col px-3 pb-3 pt-4">
        <p className="mb-1.5 inline-flex items-center gap-2 text-[11.5px] font-medium text-peak-600">
          <Icon aria-hidden className="h-4 w-4" />
          {label}
        </p>
        <h3 className="text-[16px] font-semibold leading-snug tracking-[-0.01em] text-ink">
          {slot.video?.title ?? slot.heading}
        </h3>
        <p className="mt-1.5 text-[13px] leading-[1.6] text-ink-muted">
          {slot.blurb}
        </p>
        <span className="inline-flex items-center gap-1.5 pt-4 text-[12.5px] text-ink-subtle">
          <span
            aria-hidden
            className={`h-1.5 w-1.5 rounded-full ${ready ? "bg-peak-500" : "bg-ink-subtle/50"}`}
          />
          {ready ? "Ready to watch" : "Coming soon"}
        </span>
      </div>
    </section>
  );
}

const DIRECT_FILE = /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i;

function VideoPlayer({ video, label }: { video: GalleryVideo; label: string }) {
  if (DIRECT_FILE.test(video.url)) {
    return (
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
    );
  }

  return (
    <iframe
      src={video.url}
      title={video.title ?? label}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      className="h-full w-full bg-peak-950"
    />
  );
}
