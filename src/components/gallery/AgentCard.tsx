"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { AgentGlyph } from "@/components/agent-chat/AgentGlyph";

import { artFor, GalleryArt } from "./GalleryArt";
import { CARD, CHIP, FRAME } from "./gallery-styles";

/**
 * An agent in the gallery, and the card that introduces it.
 *
 * Opening an agent is two steps on purpose: the card opens a panel saying what
 * this agent is for and what a good question looks like, and only then does
 * "Open" take you into the conversation. A first-time user meeting a chat box
 * cold has nothing to go on — the same reason the conversation itself carries a
 * context panel (CLAUDE.md §5 Tab 3). The panel is the tile's own content, so
 * nothing is fetched to open it.
 */

export type GalleryAgent = {
  href: string;
  name: string;
  description?: string;
  /** Openers to show in the panel — the agent's own, or the tab's fallback. */
  suggestions: string[];
  /** The platform, where it is worth naming (Tab 4 only). */
  eyebrow?: string;
  /** The verb — "Ask" for a conversation, "Open" for an embedded app. */
  cta: string;
};

export function AgentCard({ agent }: { agent: GalleryAgent }) {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const scene = artFor(agent.name, agent.description);

  useEffect(() => {
    if (!open) return;

    panel.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);

    // The page behind must not scroll under the panel.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        ref={opener}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`group ${CARD} text-left hover:-translate-y-0.5 hover:border-peak-200 hover:shadow-[0_18px_40px_-22px_rgba(29,58,158,0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peak-500`}
      >
        <div className={FRAME}>
          <div className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.03]">
            <GalleryArt scene={scene} />
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
            About this agent
            <ArrowRight
              aria-hidden
              className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </button>

      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-peak-950/55"
            />
            <motion.div
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-label={agent.name}
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 4 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 max-h-full w-full max-w-xl overflow-y-auto rounded-2xl border border-canvas-line bg-surface shadow-[0_32px_80px_-32px_rgba(7,13,38,0.6)] focus:outline-none"
            >
              <div className="relative aspect-[16/7] overflow-hidden rounded-t-2xl">
                <GalleryArt scene={scene} />
                <span className="absolute bottom-4 left-5 flex h-12 w-12 items-center justify-center rounded-xl bg-surface shadow-[0_2px_8px_rgba(7,13,38,0.35)]">
                  <AgentGlyph seed={agent.name} className="h-8 w-8" />
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-peak-950/55 text-peak-100 transition-colors hover:bg-peak-950/80 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <X aria-hidden className="h-4 w-4" />
                </button>
              </div>

              <div className="px-6 pb-6 pt-5">
                {agent.eyebrow ? (
                  <p className="text-[11.5px] font-medium text-peak-600">
                    {agent.eyebrow}
                  </p>
                ) : null}
                <h2 className="mt-1.5 text-[21px] font-semibold leading-tight tracking-[-0.01em] text-ink">
                  {agent.name}
                </h2>
                {agent.description ? (
                  <p className="mt-2.5 text-[14px] leading-[1.65] text-ink-muted">
                    {agent.description}
                  </p>
                ) : null}

                {agent.suggestions.length > 0 ? (
                  <div className="mt-5">
                    <p className="mb-2.5 text-[12px] font-medium text-ink-subtle">
                      Questions to start with
                    </p>
                    <ul className="space-y-1.5">
                      {agent.suggestions.map((suggestion) => (
                        <li
                          key={suggestion}
                          className="rounded-lg border border-canvas-line bg-canvas-raised px-3.5 py-2.5 text-[13.5px] leading-snug text-ink-muted"
                        >
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-6 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3.5 py-2 text-[13.5px] font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peak-500"
                  >
                    Close
                  </button>
                  <Link
                    href={agent.href}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-peak-600 px-4 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-peak-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peak-500"
                  >
                    {agent.cta}
                    <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
