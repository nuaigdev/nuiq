import { ArrowRight, Clapperboard, Rocket } from "lucide-react";
import Link from "next/link";

import { AgentGlyph } from "@/components/agent-chat/AgentGlyph";
import type { GalleryVideo } from "@/lib/tenant-config";

import { artFor, GalleryArt, type ArtScene } from "./GalleryArt";

/**
 * The body of both agent tabs (§5 Tabs 3 and 4): three columns of one card.
 *
 *   1. every agent this deployment has, each opening its own conversation;
 *   2. one demo video for the page;
 *   3. one launch video for the page.
 *
 * Agents can be many; the videos are one each per page, not per agent. An agent
 * card and a video card are deliberately the same object — same width, same
 * 16:9 picture, same body — so the row reads as three of a kind rather than a
 * list beside two players.
 *
 * Videos come from the client's config (`videos.dataAgents` / `videos.aiAgents`).
 * Until one is set, its card keeps the picture and says the video is coming,
 * rather than collapsing and leaving the row lopsided.
 */

export type GalleryAgent = {
  href: string;
  name: string;
  description?: string;
  /** The platform, where it is worth naming (Tab 4 only). */
  eyebrow?: string;
  /** The verb — "Ask" for a conversation, "Open" for an embedded app. */
  cta: string;
};

export type VideoSlot = {
  kind: "demo" | "launch";
  heading: string;
  blurb: string;
  video?: GalleryVideo;
};

const CARD =
  "card flex h-full flex-col overflow-hidden rounded-2xl p-2.5 transition-[border-color,box-shadow,transform] duration-200";

const FRAME =
  "relative aspect-video shrink-0 overflow-hidden rounded-xl border border-canvas-line bg-peak-900";

const CHIP =
  "absolute left-3 top-3 rounded-md bg-peak-950/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-peak-100";

export function AgentGallery({
  agents,
  videos,
  listLabel,
}: {
  agents: GalleryAgent[];
  videos: [VideoSlot, VideoSlot];
  listLabel: string;
}) {
  /*
   * items-start, not stretch: with several agents the first column grows, and a
   * video card stretched to match it would be a tall frame with one line of
   * text stranded at the bottom.
   */
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

function AgentCard({ agent }: { agent: GalleryAgent }) {
  return (
    <Link
      href={agent.href}
      className={`group ${CARD} hover:-translate-y-0.5 hover:border-peak-200 hover:shadow-[0_18px_40px_-22px_rgba(29,58,158,0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peak-500`}
    >
      <div className={FRAME}>
        <div className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.03]">
          <GalleryArt scene={artFor(agent.name, agent.description)} />
        </div>
        <span className={CHIP}>Agent</span>
        {/* The same mark that sits beside this agent's answers in the chat. */}
        <span className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-xl bg-surface shadow-[0_2px_8px_rgba(7,13,38,0.35)]">
          <AgentGlyph seed={agent.name} className="h-7 w-7" />
        </span>
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-4">
        {agent.eyebrow ? (
          <p className="mb-1.5 text-[11.5px] font-medium text-peak-600">
            {agent.eyebrow}
          </p>
        ) : null}
        <h3 className="text-[16px] font-semibold leading-snug tracking-[-0.01em] text-ink group-hover:text-peak-700">
          {agent.name}
        </h3>
        {agent.description ? (
          <p className="mt-1.5 line-clamp-3 text-[13px] leading-[1.6] text-ink-muted">
            {agent.description}
          </p>
        ) : null}
        <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[13px] font-medium text-peak-600">
          {agent.cta}
          <ArrowRight
            aria-hidden
            className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </Link>
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

      <div className="flex flex-1 flex-col px-3 pb-3 pt-4">
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
        <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[12.5px] text-ink-subtle">
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
