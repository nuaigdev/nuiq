"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import type { DashboardPreviewEmbedProps } from "./DashboardPreviewEmbed";

/**
 * The live preview on a dashboard tile.
 *
 * The index used to draw abstract artwork here, because embedding every report
 * at once means N Power BI iframes loading for reports nobody is reading yet.
 * Showing the real thing was asked for explicitly, so the cost is managed
 * rather than avoided:
 *
 *  - nothing loads until the tile is actually on screen (IntersectionObserver),
 *    so a long gallery below the fold costs nothing until it is scrolled to;
 *  - previews start one after another, not all at once, so the first tile is
 *    quick rather than every tile being slow together;
 *  - the artwork stays underneath as the loading state and as the fallback, so
 *    a report that is slow, unreachable, or refused never leaves a blank tile.
 *
 * Both guards from PowerBiEmbed apply here for the same reason: `ssr: false`
 * plus a mount gate, because client components are still server-rendered and
 * `powerbi-client` cannot be evaluated in Node.
 */
const DashboardPreviewEmbed = dynamic(() => import("./DashboardPreviewEmbed"), {
  ssr: false,
});

/** How many previews may be starting up at once, across the whole gallery. */
const MAX_CONCURRENT = 2;
let active = 0;
const waiting: (() => void)[] = [];

function takeSlot(start: () => void) {
  if (active < MAX_CONCURRENT) {
    active += 1;
    start();
    return;
  }
  waiting.push(start);
}

/** A preview is "done" once it has had its turn — rendered, or given up. */
function releaseSlot() {
  const next = waiting.shift();
  if (next) {
    next();
    return;
  }
  active = Math.max(0, active - 1);
}

export function DashboardPreview(
  props: Omit<DashboardPreviewEmbedProps, "onFailed" | "onSettled">,
) {
  const holder = useRef<HTMLDivElement>(null);
  const releaseRef = useRef<() => void>(() => {});
  const [show, setShow] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const node = holder.current;
    if (!node) return;

    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      releaseSlot();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        takeSlot(() => setShow(true));
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);

    // The queue must move on even if a report never reports back.
    const timer = window.setTimeout(release, 12_000);
    releaseRef.current = release;

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      release();
    };
  }, []);

  if (failed) return null;

  return (
    <div ref={holder} className="absolute inset-0">
      {show ? (
        <DashboardPreviewEmbed
          {...props}
          onFailed={() => setFailed(true)}
          onSettled={() => releaseRef.current()}
        />
      ) : null}
    </div>
  );
}
