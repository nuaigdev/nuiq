import { ArrowRight, Clapperboard, Play, Rocket } from "lucide-react";
import Link from "next/link";

import { AgentGlyph } from "@/components/agent-chat/AgentGlyph";
import type { GalleryVideo } from "@/lib/tenant-config";

/**
 * The body of both agent tabs (§5 Tabs 3 and 4): three columns.
 *
 *   1. every agent this deployment has, each opening its own conversation;
 *   2. one demo video for the page;
 *   3. one launch video for the page.
 *
 * Agents can be many; the videos are one each per page, not per agent. They
 * come from the client's config (`videos.dataAgents` / `videos.aiAgents`), and
 * until one is set its column shows a placeholder frame rather than collapsing,
 * so the page keeps its shape while the videos are being produced.
 *
 * Both video columns stick under the header as a long agent list scrolls.
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
    <div className="mx-auto grid max-w-[1600px] items-start gap-6 px-6 py-8 md:grid-cols-2 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <section
        aria-label={listLabel}
        className="card rounded-2xl p-2.5 md:col-span-2 lg:col-span-1"
      >
        <div className="flex items-center justify-between px-3 pb-3 pt-2.5">
          <h2 className="text-[13px] font-semibold text-ink">{listLabel}</h2>
          <span className="text-[12px] text-ink-subtle">
            Select one to open it
          </span>
        </div>
        <ul className="space-y-2">
          {agents.map((agent, i) => (
            <li key={agent.href}>
              <AgentCard agent={agent} index={i} />
            </li>
          ))}
        </ul>
      </section>

      {videos.map((slot) => (
        <VideoCard key={slot.kind} slot={slot} />
      ))}
    </div>
  );
}

function AgentCard({ agent, index }: { agent: GalleryAgent; index: number }) {
  return (
    <Link
      href={agent.href}
      className="group relative flex items-start gap-4 rounded-xl border border-transparent bg-canvas-raised/60 p-4 transition-[background-color,border-color,box-shadow] duration-150 hover:border-peak-200 hover:bg-surface hover:shadow-[0_8px_24px_-14px_rgba(29,58,158,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peak-500"
    >
      {/* Seeded from the name, as in the conversation, so the mark on the card
          is the mark beside that agent's answers. */}
      <AgentGlyph seed={agent.name} className="h-11 w-11 shrink-0" />

      <div className="min-w-0 flex-1">
        {agent.eyebrow ? (
          <p className="mb-1 text-[11.5px] font-medium text-peak-600">
            {agent.eyebrow}
          </p>
        ) : null}
        <h3 className="text-[15px] font-semibold leading-snug text-ink group-hover:text-peak-700">
          {agent.name}
        </h3>
        {agent.description ? (
          <p className="mt-1 line-clamp-2 text-[13px] leading-[1.55] text-ink-muted">
            {agent.description}
          </p>
        ) : null}
        <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-peak-600">
          {agent.cta}
          <ArrowRight
            aria-hidden
            className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
          />
        </span>
      </div>

      <span
        aria-hidden
        className="pt-0.5 font-mono text-[11px] tabular-nums text-ink-subtle/70"
      >
        {String(index + 1).padStart(2, "0")}
      </span>
    </Link>
  );
}

const SLOT_META = {
  demo: { label: "Demo video", Icon: Clapperboard },
  launch: { label: "Launch video", Icon: Rocket },
} as const;

function VideoCard({ slot }: { slot: VideoSlot }) {
  const { label, Icon } = SLOT_META[slot.kind];
  const ready = Boolean(slot.video);

  return (
    <section
      aria-label={label}
      className="card flex flex-col rounded-2xl p-2.5 lg:sticky lg:top-[92px]"
    >
      <div className="flex items-center justify-between px-3 pb-3 pt-2.5">
        <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink">
          <Icon aria-hidden className="h-4 w-4 text-peak-600" />
          {label}
        </p>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            ready ? "bg-peak-50 text-peak-700" : "bg-canvas-ground text-ink-subtle"
          }`}
        >
          <span
            aria-hidden
            className={`h-1.5 w-1.5 rounded-full ${ready ? "bg-peak-500" : "bg-ink-subtle/50"}`}
          />
          {ready ? "Ready to watch" : "Coming soon"}
        </span>
      </div>

      <VideoFrame slot={slot} label={label} />

      <div className="px-3 pb-3 pt-4">
        <h3 className="text-[16px] font-semibold leading-snug tracking-[-0.01em] text-ink">
          {slot.video?.title ?? slot.heading}
        </h3>
        <p className="mt-1.5 text-[13px] leading-[1.6] text-ink-muted">
          {slot.blurb}
        </p>
      </div>
    </section>
  );
}

const DIRECT_FILE = /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i;

function VideoFrame({ slot, label }: { slot: VideoSlot; label: string }) {
  const { video } = slot;

  if (video && DIRECT_FILE.test(video.url)) {
    return (
      <div className="overflow-hidden rounded-xl bg-peak-950">
        <video
          src={video.url}
          poster={video.posterUrl}
          controls
          preload="metadata"
          playsInline
          className="aspect-video w-full"
        >
          <track kind="captions" />
        </video>
      </div>
    );
  }

  if (video) {
    return (
      <div className="overflow-hidden rounded-xl bg-peak-950">
        <iframe
          src={video.url}
          title={video.title ?? label}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className="aspect-video w-full"
        />
      </div>
    );
  }

  return <VideoPlaceholder kind={slot.kind} label={label} />;
}

/**
 * Where a video will go. Flat facets in the dark chrome tones, and a play
 * mark that is plainly inert — a frame waiting for its film, not a fake player.
 */
function VideoPlaceholder({ kind, label }: { kind: VideoSlot["kind"]; label: string }) {
  const flip = kind === "launch";
  return (
    <div
      role="img"
      aria-label={`${label} — to be added`}
      className="relative aspect-video overflow-hidden rounded-xl bg-peak-900"
    >
      <svg
        viewBox="0 0 320 180"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
        className="absolute inset-0 h-full w-full"
        style={flip ? { transform: "scaleX(-1)" } : undefined}
      >
        <rect width="320" height="180" className="fill-peak-900" />
        <polygon points="0,180 0,96 88,58 150,180" className="fill-peak-850" />
        <polygon points="88,58 196,112 232,180 150,180" className="fill-peak-800/80" />
        <polygon points="196,112 272,70 320,98 320,180 232,180" className="fill-peak-700/45" />
        <polygon points="272,70 320,40 320,98" className="fill-peak-600/35" />
        <rect x="0" y="0" width="320" height="180" className="fill-none stroke-peak-300/10" />
        <g className="agent-drift-a">
          <polygon points="42,34 64,24 58,50" className="fill-peak-400/25" />
        </g>
        <g className="agent-drift-c">
          <polygon points="236,26 256,36 240,46" className="fill-peak-300/30" />
        </g>
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-[2px]">
          <Play aria-hidden className="ml-0.5 h-5 w-5 fill-white/90 text-white/90" />
        </span>
        <span className="text-[12px] font-medium text-peak-100/80">
          {label} will appear here
        </span>
      </div>

      <span className="absolute left-3 top-3 rounded-md bg-peak-950/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-peak-200">
        {kind === "demo" ? "Demo" : "Launch"}
      </span>
      <span className="absolute bottom-3 right-3 font-mono text-[10.5px] text-peak-200/60">
        --:--
      </span>
    </div>
  );
}
