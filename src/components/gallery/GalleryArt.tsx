/**
 * The picture at the top of every gallery card.
 *
 * These are drawn, not photographed: flat faceted planes in the peak family,
 * the same geometry as the landing diagram and the context panel. A stock photo
 * of a nurse, or a glowing "AI brain", would be exactly the template cliché
 * CLAUDE.md §8 rules out — and a picture of a dashboard would imply data that
 * is not really there.
 *
 * Which scene a card gets is chosen from what the agent is *for*, so a
 * marketing agent and an incidents agent do not look alike. `artFor` does the
 * matching on the agent's own name and description; an unrecognised agent falls
 * back to the neutral ridge.
 */

export type ArtScene =
  | "enquiries"
  | "census"
  | "quality"
  | "workforce"
  | "finance"
  | "operations"
  | "ridge"
  | "demo"
  | "launch";

/** Keyword to scene, most specific first. Matched against name + description. */
const SCENE_RULES: [ArtScene, RegExp][] = [
  ["enquiries", /market|enquir|inquir|sales|lead|crm|tour|move-?in/i],
  ["census", /census|occupancy|admission|resident count|bed|capacity/i],
  ["quality", /quality|incident|fall|elopement|medication|safety|risk|compliance|clinical|care/i],
  ["workforce", /staff|workforce|schedul|labor|labour|payroll|agency|training/i],
  ["finance", /financ|revenue|billing|ledger|budget|accounts/i],
  ["operations", /operation|intake|workflow|maintenance|facilit|service/i],
];

export function artFor(name: string, description?: string): ArtScene {
  const haystack = `${name} ${description ?? ""}`;
  for (const [scene, pattern] of SCENE_RULES) {
    if (pattern.test(haystack)) return scene;
  }
  return "ridge";
}

/**
 * One scene, drawn to a 320x180 box and scaled to fill the card's 16:9 frame.
 * Every scene shares the same ground and grid so the cards read as a set.
 */
export function GalleryArt({
  scene,
  className = "",
}: {
  scene: ArtScene;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      className={`h-full w-full ${className}`}
    >
      <rect width="320" height="180" className="fill-peak-900" />
      <g className="opacity-[0.16]">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line
            key={`h${i}`}
            x1="0"
            y1={30 * i + 15}
            x2="320"
            y2={30 * i + 15}
            className="stroke-peak-300"
            strokeWidth="0.5"
          />
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <line
            key={`v${i}`}
            x1={32 * i + 16}
            y1="0"
            x2={32 * i + 16}
            y2="180"
            className="stroke-peak-300"
            strokeWidth="0.5"
          />
        ))}
      </g>
      <Scene scene={scene} />
      {/* One flat wash, so label chips laid on top always have contrast. */}
      <rect width="320" height="180" className="fill-peak-950/25" />
    </svg>
  );
}

function Scene({ scene }: { scene: ArtScene }) {
  switch (scene) {
    /*
     * Enquiries and marketing: channels feeding a funnel, and the move-in at
     * the end of it. Three inbound bars, because the question this agent is
     * asked most often is which channel produced what.
     */
    case "enquiries":
      return (
        <g>
          <polygon points="0,180 0,118 66,80 132,180" className="fill-peak-850" />
          <polygon points="252,110 300,80 320,100 320,180 244,180" className="fill-peak-800/70" />

          {/* Channels, each a different weight of spend. */}
          {[
            { y: 34, w: 54, cls: "fill-peak-400/70" },
            { y: 52, w: 38, cls: "fill-peak-300/60" },
            { y: 70, w: 46, cls: "fill-peak-500/70" },
          ].map((bar) => (
            <g key={bar.y}>
              <rect x="34" y={bar.y} width={bar.w} height="10" rx="5" className={bar.cls} />
              <path
                d={`M ${34 + bar.w + 6} ${bar.y + 5} H 106`}
                className="stroke-peak-300/45"
                strokeWidth="1.5"
                strokeDasharray="3 4"
              />
            </g>
          ))}

          {/* The funnel. */}
          <polygon points="106,26 232,26 190,84 148,84" className="fill-peak-500/45 stroke-peak-200/45" strokeWidth="1.25" />
          <polygon points="148,84 190,84 178,112 160,112" className="fill-peak-400/60" />
          <rect x="160" y="112" width="18" height="14" className="fill-peak-300/70" />

          {/* Qualified enquiries, dropping through. */}
          <circle cx="169" cy="136" r="3.5" className="fill-peak-200/80" />
          <circle cx="169" cy="148" r="2.5" className="fill-peak-200/50" />

          {/* The move-in at the end: a community with a lit unit. */}
          <polygon points="206,160 246,132 286,160 286,180 206,180" className="fill-peak-700/70" />
          <rect x="238" y="150" width="14" height="14" className="fill-peak-100/80" />
          <rect x="220" y="166" width="10" height="14" className="fill-peak-200/35" />
          <rect x="258" y="166" width="10" height="14" className="fill-peak-200/35" />

          <g className="agent-drift-a">
            <polygon points="40,118 62,108 56,134" className="fill-peak-400/30" />
          </g>
        </g>
      );

    /* Census: communities as a skyline of filled and empty units. */
    case "census":
      return (
        <g>
          <polygon points="0,180 0,110 58,74 120,180" className="fill-peak-850" />
          <rect x="108" y="66" width="46" height="114" className="fill-peak-700/70" />
          <rect x="162" y="40" width="46" height="140" className="fill-peak-600/60" />
          <rect x="216" y="86" width="46" height="94" className="fill-peak-700/55" />
          {[0, 1, 2, 3].map((r) =>
            [0, 1].map((c) => (
              <rect
                key={`${r}-${c}`}
                x={118 + c * 20}
                y={78 + r * 22}
                width="12"
                height="12"
                className={(r + c) % 3 ? "fill-peak-200/70" : "fill-peak-300/25"}
              />
            )),
          )}
          {[0, 1, 2, 3, 4].map((r) =>
            [0, 1].map((c) => (
              <rect
                key={`b${r}-${c}`}
                x={172 + c * 20}
                y={52 + r * 22}
                width="12"
                height="12"
                className={(r * 2 + c) % 4 ? "fill-peak-200/75" : "fill-peak-300/25"}
              />
            )),
          )}
          <g className="agent-drift-b">
            <polygon points="276,34 300,46 278,58" className="fill-peak-300/35" />
          </g>
        </g>
      );

    /* Quality: a shield over a line of events. */
    case "quality":
      return (
        <g>
          <polygon points="0,180 0,116 66,82 132,180" className="fill-peak-850" />
          <polygon points="224,116 286,80 320,110 320,180 232,180" className="fill-peak-700/45" />
          <path
            d="M160 34 L206 50 V92 C206 122 186 140 160 148 C134 140 114 122 114 92 V50 Z"
            className="fill-peak-600/45 stroke-peak-200/70"
            strokeWidth="1.5"
          />
          <path
            d="M136 92 L154 110 L186 72"
            fill="none"
            className="stroke-peak-100"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {[0, 1, 2, 3, 4].map((i) => (
            <circle
              key={i}
              cx={38 + i * 14}
              cy={150 - i * 8}
              r="3"
              className="fill-peak-300/70"
            />
          ))}
          <g className="agent-drift-a">
            <polygon points="42,44 66,32 60,60" className="fill-peak-400/30" />
          </g>
        </g>
      );

    /* Workforce: shifts as stacked bands, people as simple marks. */
    case "workforce":
      return (
        <g>
          <polygon points="0,180 0,104 70,66 140,180" className="fill-peak-850" />
          <polygon points="210,120 268,88 320,118 320,180 220,180" className="fill-peak-700/45" />
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              x={96 + i * 12}
              y={48 + i * 26}
              width={140 - i * 18}
              height="18"
              rx="9"
              className={["fill-peak-500/55", "fill-peak-400/45", "fill-peak-300/40"][i]}
            />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(${112 + i * 30} 128)`}>
              <circle cx="0" cy="0" r="7" className="fill-peak-200/75" />
              <path
                d="M-11 26 C-11 12 -6 8 0 8 C6 8 11 12 11 26 Z"
                className="fill-peak-200/45"
              />
            </g>
          ))}
          <g className="agent-drift-c">
            <polygon points="272,36 296,48 274,60" className="fill-peak-300/35" />
          </g>
        </g>
      );

    /*
     * Finance: the ledger, and the balance that has to come out of it. Invoice
     * lines on the left, a pair of scales on the right, and a short column of
     * periods — flat shapes, not a chart with invented numbers.
     */
    case "finance":
      return (
        <g>
          <polygon points="0,180 0,116 56,84 112,180" className="fill-peak-850" />
          <polygon points="262,120 302,94 320,112 320,180 258,180" className="fill-peak-800/70" />

          {/* Ledger lines, each with a figure squared off to the right. */}
          {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(38 ${36 + i * 26})`}>
              <rect width="122" height="18" rx="4" className="fill-peak-700/55" />
              <rect x="8" y="7" width={52 - i * 8} height="4" rx="2" className="fill-peak-100/60" />
              <rect x="86" y="7" width="28" height="4" rx="2" className="fill-peak-200/70" />
            </g>
          ))}

          {/* Periods closing, one taller than the last. */}
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              x={38 + i * 20}
              y={148 - i * 10}
              width="13"
              height={22 + i * 10}
              rx="3"
              className={["fill-peak-600/60", "fill-peak-500/60", "fill-peak-400/65"][i]}
            />
          ))}

          {/* The scales: what is owed against what is collected. */}
          <g transform="translate(232 40)">
            <rect x="-2" y="10" width="4" height="86" rx="2" className="fill-peak-200/70" />
            <rect x="-26" y="92" width="52" height="6" rx="3" className="fill-peak-200/70" />
            <path d="M-44 14 H44" className="stroke-peak-200/80" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="0" cy="6" r="5" className="fill-peak-100" />
            <path d="M-44 14 L-56 40 H-32 Z" className="fill-peak-400/70" />
            <path d="M44 14 L32 40 H56 Z" className="fill-peak-300/70" />
          </g>

          <g className="agent-drift-b">
            <polygon points="286,36 308,46 288,58" className="fill-peak-300/35" />
          </g>
        </g>
      );

    /* Operations: a request moving through stations. */
    case "operations":
      return (
        <g>
          <polygon points="0,180 0,108 64,72 130,180" className="fill-peak-850" />
          <polygon points="222,116 284,84 320,112 320,180 230,180" className="fill-peak-700/45" />
          <path
            d="M96 128 H224"
            className="stroke-peak-300/60"
            strokeWidth="2"
            strokeDasharray="6 7"
          />
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${104 + i * 54} 54)`}>
              <rect
                width="44"
                height="44"
                rx="10"
                className="fill-peak-600/45 stroke-peak-200/50"
                strokeWidth="1.25"
              />
              <rect x="12" y="16" width="20" height="3" rx="1.5" className="fill-peak-100/75" />
              <rect x="12" y="24" width="13" height="3" rx="1.5" className="fill-peak-200/50" />
            </g>
          ))}
          <circle cx="126" cy="128" r="4.5" className="fill-peak-100" />
          <circle cx="180" cy="128" r="4.5" className="fill-peak-200/70" />
          <circle cx="234" cy="128" r="4.5" className="fill-peak-300/45" />
        </g>
      );

    /* Demo: a screen mid-walkthrough, with a play mark set into it. */
    case "demo":
      return (
        <g>
          <polygon points="0,180 0,116 60,84 120,180" className="fill-peak-850" />
          <polygon points="238,116 292,84 320,108 320,180 244,180" className="fill-peak-700/45" />
          <rect
            x="88"
            y="38"
            width="144"
            height="88"
            rx="10"
            className="fill-peak-800 stroke-peak-300/40"
            strokeWidth="1.25"
          />
          <rect x="88" y="38" width="144" height="16" rx="10" className="fill-peak-700/70" />
          <circle cx="100" cy="46" r="2.5" className="fill-peak-300/70" />
          <circle cx="109" cy="46" r="2.5" className="fill-peak-300/45" />
          <polygon points="150,70 184,86 150,102" className="fill-peak-100" />
          <rect x="132" y="138" width="56" height="5" rx="2.5" className="fill-peak-300/50" />
          <g className="agent-drift-a">
            <polygon points="40,44 64,32 58,60" className="fill-peak-400/30" />
          </g>
        </g>
      );

    /* Launch: the same facets, climbing. */
    case "launch":
      return (
        <g>
          <polygon points="0,180 0,124 52,96 108,180" className="fill-peak-850" />
          <polygon points="236,104 292,72 320,96 320,180 244,180" className="fill-peak-700/45" />
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={104 + i * 30}
              y={132 - i * 26}
              width="24"
              height={40 + i * 26}
              rx="5"
              className={[
                "fill-peak-700/70",
                "fill-peak-600/65",
                "fill-peak-500/60",
                "fill-peak-400/60",
              ][i]}
            />
          ))}
          <path
            d="M108 118 L138 92 L168 66 L198 40"
            fill="none"
            className="stroke-peak-100/80"
            strokeWidth="2"
            strokeDasharray="5 6"
            strokeLinecap="round"
          />
          <path
            d="M190 36 L202 36 L202 48"
            fill="none"
            className="stroke-peak-100"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g className="agent-drift-c">
            <polygon points="262,40 286,52 264,64" className="fill-peak-300/35" />
          </g>
        </g>
      );

    /* The neutral ridge, for anything unrecognised. */
    default:
      return (
        <g>
          <polygon points="0,180 0,120 56,86 118,180" className="fill-peak-850" />
          <polygon points="86,64 160,32 214,86 236,180 112,180" className="fill-peak-600/45" />
          <polygon points="160,32 236,80 262,180 236,180" className="fill-peak-500/40" />
          <polygon points="236,102 292,72 320,98 320,180 248,180" className="fill-peak-700/50" />
          <g className="agent-drift-a">
            <polygon points="42,48 66,36 60,64" className="fill-peak-400/30" />
          </g>
          <g className="agent-drift-b">
            <polygon points="268,40 292,52 270,64" className="fill-peak-300/35" />
          </g>
        </g>
      );
  }
}
