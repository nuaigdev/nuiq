/**
 * HTML laid out over a box, in the diagram's own coordinates. Pointer events
 * are off so the SVG rect underneath stays the hit target for hover and clicks.
 *
 * SVG text cannot centre a mark and a label as a group without knowing how wide
 * the text renders, and it cannot know; flexbox can. So: one coordinate space,
 * real layout, nothing measured.
 *
 * Centred by default. Lists that stack (the source groups) align left instead:
 * rows of differing name length read as ragged when each is centred on its own.
 */
export function BoxContent({
  x,
  y,
  w,
  h,
  align = "center",
  justify = "center",
  interactive = false,
  className = "",
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  align?: "center" | "left";
  justify?: "center" | "start";
  /** Let the HTML inside take pointer events — for real buttons and links. */
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <foreignObject
      x={x}
      y={y}
      width={w}
      height={h}
      style={{ pointerEvents: interactive ? "auto" : "none" }}
    >
      <div
        className={`flex h-full w-full flex-col ${
          justify === "start" ? "justify-start" : "justify-center"
        } ${
          align === "left" ? "items-start text-left" : "items-center text-center"
        } ${className}`}
      >
        {children}
      </div>
    </foreignObject>
  );
}
