"use client";

/**
 * The right half of the data agent workspace.
 *
 * A chat box on its own is a blank stare: nothing tells a first-time user what
 * this agent knows or what a good question looks like. This panel answers both,
 * and carries the same animated flow language as the Home hero so the portal
 * reads as one product rather than a set of screens.
 */

function QuestionFlow({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 300 120"
      className="h-auto w-full"
      role="img"
      aria-label="Your question travels to the Fabric warehouse and an answer comes back."
    >
      <defs>
        <linearGradient id="agent-flow-line" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#93b8f9" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#93b8f9" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#93b8f9" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {/* Out: question to the warehouse. Back: the answer. */}
      <path
        d="M 46 44 C 110 44, 150 44, 254 44"
        fill="none"
        stroke="url(#agent-flow-line)"
        strokeWidth="1.5"
      />
      <path
        d="M 254 78 C 150 78, 110 78, 46 78"
        fill="none"
        stroke="url(#agent-flow-line)"
        strokeWidth="1.5"
        strokeDasharray="3 4"
      />

      {active ? (
        <>
          <circle r="3.5" className="fill-peak-300">
            <animateMotion
              dur="1.6s"
              repeatCount="indefinite"
              path="M 46 44 C 110 44, 150 44, 254 44"
            />
          </circle>
          <circle r="3.5" className="fill-white">
            <animateMotion
              dur="1.6s"
              begin="0.8s"
              repeatCount="indefinite"
              path="M 254 78 C 150 78, 110 78, 46 78"
            />
          </circle>
        </>
      ) : null}

      {/* You */}
      <g>
        <rect
          x="6"
          y="30"
          width="40"
          height="62"
          rx="8"
          className="fill-white/[0.07] stroke-white/20"
          strokeWidth="1"
        />
        <text x="26" y="66" textAnchor="middle" className="fill-peak-100 text-[10px] font-medium">
          You
        </text>
      </g>

      {/* The warehouse */}
      <g>
        <rect
          x="254"
          y="22"
          width="40"
          height="78"
          rx="8"
          className="fill-peak-500/25 stroke-peak-300/50"
          strokeWidth="1"
        />
        <text x="274" y="56" textAnchor="middle" className="fill-white text-[10px] font-semibold">
          Fabric
        </text>
        <text x="274" y="70" textAnchor="middle" className="fill-peak-200 text-[9px]">
          OneLake
        </text>
      </g>

      <text x="150" y="36" textAnchor="middle" className="fill-peak-200/70 text-[9px]">
        your question
      </text>
      <text x="150" y="95" textAnchor="middle" className="fill-peak-200/70 text-[9px]">
        grounded answer
      </text>
    </svg>
  );
}

export function AgentFlowPanel({
  agentName,
  description,
  suggestions,
  onAsk,
  busy,
}: {
  agentName: string;
  description?: string;
  suggestions: string[];
  onAsk: (question: string) => void;
  busy: boolean;
}) {
  return (
    <aside className="chrome-header flex h-full flex-col overflow-hidden rounded-2xl text-white">
      <div className="flex-1 p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-peak-300">
          Fabric data agent
        </p>
        <h2 className="mt-2.5 text-[26px] font-semibold leading-tight tracking-tight">
          {agentName}
        </h2>
        {description ? (
          <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-peak-100/70">
            {description}
          </p>
        ) : null}

        <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <QuestionFlow active={busy} />
        </div>

        <div className="mt-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-peak-300">
            Try asking
          </p>
          <ul className="mt-3 space-y-2">
            {suggestions.map((suggestion) => (
              <li key={suggestion}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onAsk(suggestion)}
                  className="group w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-left text-[13px] leading-snug text-peak-100/85 transition-colors hover:border-white/25 hover:bg-white/[0.08] hover:text-white disabled:opacity-40"
                >
                  <span className="mr-1.5 text-peak-300 transition-transform group-hover:translate-x-0.5">
                    &rarr;
                  </span>
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="border-t border-white/10 px-7 py-4 text-[11px] leading-relaxed text-peak-100/45">
        Questions run as you, so answers never reach past your own access.
        Nothing in this conversation is saved.
      </p>
    </aside>
  );
}
