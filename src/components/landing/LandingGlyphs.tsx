/**
 * The marks drawn inside the landing diagram.
 *
 * Each glyph is authored once as a set of paths in a 24×24 box, and exposed
 * two ways: `GlyphPaths` for use directly inside the SVG, and `Icon` wrapped in
 * its own `<svg>` for use inside a `foreignObject`, where the box contents are
 * laid out as HTML so they can actually be centred.
 *
 * `SourceMark` fills in for a source system with no vendor logo: a lettermark
 * where the product is real but its mark could not be sourced, a shape where
 * the row is a category (Finance / GL, Pharmacy) that every operator fills with
 * a different vendor.
 *
 * All of it is flat, geometric and monochrome — no gradients, no bar-chart
 * iconography, no "AI brain" (CLAUDE.md §8).
 */

const STROKE = {
  fill: "none",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** The paths for one glyph, in a 24×24 box, stroked in `currentColor`. */
export function GlyphPaths({ glyph }: { glyph: string }) {
  switch (glyph) {
    case "ingest":
      return (
        <g stroke="currentColor" {...STROKE}>
          <ellipse cx="12" cy="7" rx="6.5" ry="2.6" />
          <path d="M5.5 7v9.4c0 1.4 2.9 2.6 6.5 2.6s6.5-1.2 6.5-2.6V7" />
          <path d="M12 10.4v5.2M9.6 13.2 12 10.6l2.4 2.6" />
        </g>
      );
    case "transform":
      return (
        <g stroke="currentColor" {...STROKE}>
          <circle cx="7" cy="7" r="2.4" />
          <circle cx="17" cy="7" r="2.4" />
          <circle cx="7" cy="17" r="2.4" />
          <circle cx="17" cy="17" r="2.4" />
          <path d="M9.4 7h5.2M7 9.4v5.2M9.4 17h5.2M17 9.4v5.2" />
        </g>
      );
    case "lakehouse":
      return (
        <g stroke="currentColor" {...STROKE}>
          <path d="M4.5 10.5 12 4.8l7.5 5.7" />
          <path d="M6.4 11.9v7.3h11.2v-7.3" />
          <path d="M4.6 16.2c1.4 0 1.4 1.1 2.8 1.1M16.6 17.3c1.4 0 1.4-1.1 2.8-1.1" />
        </g>
      );
    case "semantic":
      // A hub with satellites: meaning layered over the raw store. Deliberately
      // not a brain or a sparkle.
      return (
        <g stroke="currentColor" {...STROKE}>
          <circle cx="12" cy="12" r="2.8" />
          <circle cx="12" cy="4.8" r="1.8" />
          <circle cx="18.6" cy="15.6" r="1.8" />
          <circle cx="5.4" cy="15.6" r="1.8" />
          <path d="M12 6.6v2.6M14.4 13.5l2.7 1.4M9.6 13.5l-2.7 1.4" />
        </g>
      );
    case "governance":
      return (
        <g stroke="currentColor" {...STROKE}>
          <path d="M12 4.4 19 7v5.4c0 3.7-2.9 6.3-7 7.2-4.1-.9-7-3.5-7-7.2V7z" />
          <path d="M9.6 12.2 11.4 14l3.4-3.6" />
        </g>
      );
    case "ledger":
      return (
        <g stroke="currentColor" {...STROKE}>
          <rect x="5.5" y="4.5" width="13" height="15" rx="1.8" />
          <path d="M8.5 9h7M8.5 12h7M8.5 15h4" />
        </g>
      );
    case "people":
      return (
        <g stroke="currentColor" {...STROKE}>
          <circle cx="9.5" cy="9" r="2.6" />
          <circle cx="15.8" cy="10" r="2" />
          <path d="M4.8 18.5c0-2.7 2.1-4.5 4.7-4.5s4.7 1.8 4.7 4.5" />
          <path d="M15.4 14.2c2.1.2 3.8 1.9 3.8 4.3" />
        </g>
      );
    case "pharmacy":
      return (
        <g stroke="currentColor" {...STROKE}>
          <rect x="4.5" y="4.5" width="15" height="15" rx="3.4" />
          <path d="M12 8.4v7.2M8.4 12h7.2" />
        </g>
      );
    case "stack":
      return (
        <g stroke="currentColor" {...STROKE}>
          <ellipse cx="12" cy="6.6" rx="6.8" ry="2.4" />
          <path d="M5.2 6.6v4.6c0 1.3 3 2.4 6.8 2.4s6.8-1.1 6.8-2.4V6.6" />
          <path d="M5.2 11.2v5.2c0 1.3 3 2.4 6.8 2.4s6.8-1.1 6.8-2.4v-5.2" />
        </g>
      );
    default:
      return null;
  }
}

/** The same glyph, standalone, for use inside a foreignObject. */
export function Icon({
  glyph,
  size,
  className,
}: {
  glyph: string;
  size: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
    >
      <GlyphPaths glyph={glyph} />
    </svg>
  );
}

/**
 * A source system's mark on a white tile.
 *
 * Vendor marks are published for light backgrounds, so they sit on white
 * rather than directly on the indigo chrome — otherwise the blue ones (Yardi,
 * Foundry) all but disappear.
 */
export function SourceMark({
  logo,
  glyph,
  size,
}: {
  logo: string | null;
  glyph: string;
  size: number;
}) {
  const isLettermark = !logo && glyph.length <= 2;
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-[6px] bg-white"
      style={{ width: size, height: size }}
    >
      {logo ? (
        /* eslint-disable-next-line @next/next/no-img-element -- static local asset inside a foreignObject; next/image cannot lay out here */
        <img
          src={logo}
          alt=""
          width={size}
          height={size}
          style={{ width: size * 0.74, height: size * 0.74, objectFit: "contain" }}
        />
      ) : isLettermark ? (
        <span
          className="font-bold text-peak-700"
          style={{ fontSize: size * 0.38, letterSpacing: "-0.02em" }}
        >
          {glyph}
        </span>
      ) : (
        <Icon glyph={glyph} size={size * 0.72} className="text-peak-700" />
      )}
    </span>
  );
}
