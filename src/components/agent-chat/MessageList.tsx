"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { AgentGlyph } from "./AgentGlyph";
import { useChat } from "./chat-store";
import {
  AssistantAnswer,
  ErrorMessage,
  UserMessage,
  WaitingIndicator,
} from "./Messages";

/** Close enough to the bottom that the reader is plainly following along. */
const STICK_THRESHOLD = 56;

export function MessageList() {
  const { agentName, turns, pending, elapsed, revealingId, arrivedId } = useChat();

  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(true);
  const [unread, setUnread] = useState(false);

  /*
   * The last thing the reader's own scrolling said about where they are. It has
   * to be a ref rather than the state above, because by the time the observer
   * below runs, the content has already grown — measuring the element then
   * would say "not at the bottom" for someone who never left it.
   */
  const stuckRef = useRef(true);

  const scrollToEnd = useCallback((smooth: boolean) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD;
    stuckRef.current = atBottom;
    setStuck(atBottom);
    if (atBottom) setUnread(false);
  }, []);

  /*
   * Everything that lands in the conversation — a question, an answer arriving,
   * an answer still revealing itself — shows up here as the content growing.
   *
   * Follow it while the reader is at the bottom, and leave them alone the moment
   * they have scrolled up to re-read something: being yanked back down
   * mid-sentence is the single most irritating thing a chat can do. Offer the
   * pill instead. The catch-up scroll is instant rather than smooth so that a
   * reveal growing every frame does not restart an easing animation every frame.
   */
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const observer = new ResizeObserver(() => {
      if (stuckRef.current) scrollToEnd(false);
      else setUnread(true);
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [scrollToEnd]);

  const empty = turns.length === 0 && !pending;

  /*
   * What a screen reader hears. Announcing the reveal character by character
   * would be unusable, so the live region carries the state of the exchange and
   * then the finished answer, once.
   */
  const announcement = pending
    ? "Working on your question."
    : arrivedId && !revealingId
      ? (turns.find((turn) => turn.id === arrivedId)?.text ?? "")
      : "";

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="h-full overflow-y-auto overscroll-contain px-5 py-6 sm:px-6"
      >
        <div ref={contentRef} className="flex flex-col gap-7">
          {empty ? (
            <div className="flex flex-col items-center px-4 pt-10 text-center">
              <AgentGlyph seed={agentName} className="h-9 w-9" />
              <p className="mt-4 text-[14px] font-medium text-ink">
                Ask {agentName} about your data
              </p>
              <p className="mt-1.5 max-w-[34ch] text-[13.5px] leading-[1.6] text-ink-muted">
                Plain language works best. Start with one of the questions below,
                or type your own.
              </p>
            </div>
          ) : null}

          {turns.map((turn) =>
            turn.role === "user" ? (
              <UserMessage key={turn.id} text={turn.text} />
            ) : turn.role === "agent" ? (
              <AssistantAnswer key={turn.id} id={turn.id} text={turn.text} />
            ) : (
              <ErrorMessage key={turn.id} text={turn.text} />
            ),
          )}

          <AnimatePresence>
            {pending ? (
              <WaitingIndicator key="waiting" seed={agentName} seconds={elapsed} />
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {/*
       * Catching up is offered, never forced — and it lives inside the panel,
       * because a chat event should not put anything over the rest of the page.
       */}
      <AnimatePresence>
        {unread && !stuck ? (
          <motion.button
            key="unread"
            type="button"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.16 }}
            onClick={() => {
              scrollToEnd(true);
              setUnread(false);
            }}
            className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-canvas-line bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink shadow-[0_4px_16px_rgba(15,20,32,0.1)] transition-colors hover:border-peak-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peak-500"
          >
            <ArrowDown aria-hidden className="h-3.5 w-3.5 text-peak-600" />
            New message
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
