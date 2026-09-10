import Link from "next/link";

/**
 * The tile used by both agent tabs (§5 Tabs 3 and 4).
 *
 * A dashboard tile carries a real preview image; an agent has nothing to
 * preview, so it gets the same card with a facet band where the thumbnail would
 * be. Sharing one component is what keeps the three galleries looking like one
 * product rather than three people's ideas of a card.
 *
 * The facet is deliberately abstract. A mini chart or a robot glyph would be
 * the dashboard-template cliché §8 rules out, and would imply a capability the
 * tile cannot know anything about.
 */

/** Stable small integer from a seed, so a tile always looks the same. */
function hashOf(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function AgentFacet({ seed }: { seed: string }) {
  const hash = hashOf(seed);
  const a = 22 + (hash % 26);
  const b = 58 + ((hash >> 4) % 22);
  const lift = 14 + ((hash >> 8) % 14);

  return (
    <svg
      viewBox="0 0 160 60"
      preserveAspectRatio="none"
      aria-hidden
      className="h-full w-full"
    >
      <rect width="160" height="60" className="fill-peak-50" />
      <polygon points={`0,60 ${a},${lift} ${a + 26},60`} className="fill-peak-300/45" />
      <polygon
        points={`${a},${lift} ${b},${lift + 12} ${b},60 ${a + 26},60`}
        className="fill-peak-600/30"
      />
      <polygon
        points={`${b},${lift + 12} 160,${lift - 3} 160,60 ${b},60`}
        className="fill-peak-800/20"
      />
    </svg>
  );
}

export function AgentTile({
  href,
  name,
  description,
  eyebrow,
  cta,
  seed,
}: {
  href: string;
  name: string;
  description?: string;
  /** The platform this agent runs on, when it is worth naming. */
  eyebrow?: string;
  /** The verb on the tile — "Ask" for a data agent, "Open" for the rest. */
  cta: string;
  seed: string;
}) {
  return (
    <Link
      href={href}
      className="card card-interactive group block overflow-hidden rounded-xl"
    >
      <div className="h-[76px] w-full border-b border-hairline">
        <AgentFacet seed={seed} />
      </div>
      <div className="p-5">
        {eyebrow ? (
          <p className="mb-1.5 text-[11.5px] font-medium text-peak-600">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-sm font-semibold text-ink group-hover:text-peak-700">
          {name}
        </h2>
        {description ? (
          <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-ink-muted">
            {description}
          </p>
        ) : null}
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-peak-600">
          {cta}
          <span
            aria-hidden
            className="transition-transform group-hover:translate-x-0.5"
          >
            &rarr;
          </span>
        </span>
      </div>
    </Link>
  );
}
