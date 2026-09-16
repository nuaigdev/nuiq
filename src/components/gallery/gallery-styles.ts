/**
 * The shapes the gallery cards share.
 *
 * An agent card and a video card are deliberately the same object — same width,
 * same 16:9 picture, same body — so a row reads as three of a kind. They live
 * here because one is a client component (it opens a panel) and the other is
 * not, and the two must not drift apart.
 *
 * No `h-full`: these are grid items, and a percentage height resolves against
 * the grid *area*, which is as tall as the tallest item in the row. That made a
 * video card stretch to match a column of several agents, leaving a tall empty
 * card with one line stranded at the bottom. `self-start` keeps each card the
 * height of its own content.
 */

export const CARD =
  "card flex flex-col self-start overflow-hidden rounded-2xl p-2.5 transition-[border-color,box-shadow,transform] duration-200";

export const FRAME =
  "relative aspect-video shrink-0 overflow-hidden rounded-xl border border-canvas-line bg-peak-900";

export const CHIP =
  "absolute left-3 top-3 rounded-md bg-peak-950/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-peak-100";
