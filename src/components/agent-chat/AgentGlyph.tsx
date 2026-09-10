/**
 * The mark beside an agent's answers.
 *
 * A faceted peak rather than an initial in a circle: it is the product's own
 * geometry (CLAUDE.md §8), and it ties an answer visually back to the tile the
 * agent was opened from, which draws its facets from the same seed.
 */

function hashOf(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function AgentGlyph({
  seed,
  className = "h-6 w-6",
}: {
  seed: string;
  className?: string;
}) {
  const hash = hashOf(seed);
  const peak = 5 + (hash % 7);
  const ridge = 13 + ((hash >> 5) % 5);

  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <rect width="24" height="24" rx="7" className="fill-peak-50" />
      <polygon points={`4,19 ${peak},7 ${peak + 6},19`} className="fill-peak-300" />
      <polygon
        points={`${peak},7 ${ridge},11 ${ridge},19 ${peak + 6},19`}
        className="fill-peak-500"
      />
      <polygon points={`${ridge},11 20,8 20,19 ${ridge},19`} className="fill-peak-700" />
    </svg>
  );
}
