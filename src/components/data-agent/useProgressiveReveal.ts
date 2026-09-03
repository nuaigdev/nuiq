"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reveals an answer progressively instead of dropping it in whole.
 *
 * The Fabric MCP endpoint returns one complete answer — there is no token
 * stream to render (CLAUDE.md §5 Tab 3). After a wait measured in minutes,
 * having several hundred words appear in a single frame reads as a page
 * reload rather than a reply, and gives the eye nowhere to start. So the text
 * is paced out here, in the browser, purely as presentation.
 *
 * Nothing about the request changes: if the action is ever made to stream, this
 * hook takes the growing string instead of the finished one and the screen
 * looks the same.
 */

/** Ahead of reading speed, but unhurried enough to watch the answer form. */
const MIN_CHARS_PER_SECOND = 465;

/** A long answer should not take proportionally longer to finish. */
const TARGET_SECONDS = 4;

/** Roughly 22 updates a second: fluid to read, a third of the parsing. */
const EMIT_INTERVAL_MS = 45;

export type PendingBlock = "code" | "table" | null;

/**
 * Markdown that is only half-arrived renders as debris — an unterminated fence
 * becomes literal backticks, half a table becomes a row of pipes. Rather than
 * show that, hold the incomplete block back and let the caller draw a
 * placeholder for it.
 */
function splitPending(visible: string): { body: string; pending: PendingBlock } {
  const lines = visible.split("\n");

  let fenceCount = 0;
  let lastFenceLine = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (/^\s*(```|~~~)/.test(lines[i])) {
      fenceCount += 1;
      lastFenceLine = i;
    }
  }

  if (fenceCount % 2 === 1) {
    return { body: lines.slice(0, lastFenceLine).join("\n"), pending: "code" };
  }

  // A table still arriving: the text ends inside a run of pipe rows.
  let end = lines.length - 1;
  while (end >= 0 && lines[end].trim() === "") end -= 1;
  if (end >= 0 && lines[end].trim().startsWith("|")) {
    let start = end;
    while (start > 0 && lines[start - 1].trim().startsWith("|")) start -= 1;
    return { body: lines.slice(0, start).join("\n"), pending: "table" };
  }

  return { body: visible, pending: null };
}

export function useProgressiveReveal({
  text,
  active,
  reducedMotion,
  onComplete,
}: {
  text: string;
  active: boolean;
  reducedMotion: boolean;
  onComplete: () => void;
}): { body: string; pending: PendingBlock; revealing: boolean } {
  const [count, setCount] = useState(0);

  // Held in a ref so the animation loop never has to be torn down and rebuilt
  // just because the callback identity changed between renders.
  const completeRef = useRef(onComplete);
  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!active) return;

    // Someone who has asked for less motion gets the whole answer at once —
    // and still gets the arrival cue, because that is information, not motion.
    if (reducedMotion) {
      completeRef.current();
      return;
    }

    const total = text.length;
    const rate = Math.max(MIN_CHARS_PER_SECOND, total / TARGET_SECONDS);
    const started = performance.now();
    let frame = 0;
    let lastEmit = 0;

    function step(now: number) {
      const shown = Math.min(total, Math.floor(((now - started) / 1000) * rate));
      const done = shown >= total;

      /*
       * Every state change here re-parses the markdown, so emitting on every
       * frame would mean parsing the whole answer sixty times a second. At this
       * cadence a reader sees the same continuous flow of text for a third of
       * the work.
       */
      if (done || now - lastEmit >= EMIT_INTERVAL_MS) {
        lastEmit = now;
        setCount(shown);
      }

      if (done) completeRef.current();
      else frame = requestAnimationFrame(step);
    }

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [text, active, reducedMotion]);

  // Skipped to the end, already finished, or never paced at all.
  if (!active || reducedMotion) return { body: text, pending: null, revealing: false };

  const visible = text.slice(0, count);
  const { body, pending } = splitPending(visible);
  return { body, pending, revealing: count < text.length };
}
