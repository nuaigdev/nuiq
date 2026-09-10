/**
 * The anchor visual for the context panel.
 *
 * Deliberately not a chart. An ambient line or area trace in this product would
 * imply figures that are not really there — and chart iconography as decoration
 * is exactly the dashboard-template cliché CLAUDE.md §8 rules out. So the motif
 * is the mark's own geometry: flat faceted planes, no gradients, no glow, in
 * three tones of the peak family. A few loose facets drift above the ridge on a
 * half-minute cycle; the ridge itself never moves.
 */
export function FacetField({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 250"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden
      className={className}
    >
      {/* The ridge, back to front: lighter planes read as further away. */}
      <polygon points="255,104 330,142 392,222 300,222" className="fill-peak-200/55" />
      <polygon points="330,142 392,178 392,222" className="fill-peak-300/40" />
      <polygon points="185,128 255,104 300,222 215,222" className="fill-peak-300/60" />
      <polygon points="120,66 185,128 215,222 150,222" className="fill-peak-500/45" />
      <polygon points="120,66 150,222 10,222" className="fill-peak-600/25" />
      <polygon points="120,66 150,222 92,222" className="fill-peak-700/20" />

      {/* The ground plane the ridge sits on. */}
      <rect x="0" y="221" width="400" height="1.5" className="fill-peak-400/35" />

      {/* Loose facets, drifting. */}
      <g className="agent-drift-a">
        <polygon points="60,60 92,44 84,80" className="fill-peak-400/30" />
      </g>
      <g className="agent-drift-b">
        <polygon points="296,52 330,64 306,84" className="fill-peak-500/25" />
      </g>
      <g className="agent-drift-c">
        <polygon points="212,26 238,38 216,50" className="fill-peak-300/45" />
      </g>
    </svg>
  );
}
