import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

/**
 * Rendering mode: `link-card` (§5 Tab 4).
 *
 * Also the graceful fallback for an agent whose display mode has no renderer
 * yet — a Copilot Studio bot before its Direct Line embed is built, say. That
 * is a supported per-agent outcome rather than a special case: an agent nobody
 * has finished wiring should still be reachable, and should say plainly that it
 * opens elsewhere rather than pretending to be embedded.
 */
export function AgentLinkCard({
  agentName,
  platformLabel,
  description,
  url,
  note,
}: {
  agentName: string;
  platformLabel: string;
  description?: string;
  url?: string;
  /** Why this agent opens elsewhere, when there is something worth saying. */
  note?: string;
}) {
  return (
    <div className="mx-auto max-w-[1600px] px-6 py-9">
      <Link
        href="/ai-agents"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-subtle transition-colors hover:text-peak-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peak-500"
      >
        <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
        All AI agents
      </Link>

      <div className="card mt-6 max-w-2xl rounded-xl p-6">
        <p className="text-[12px] font-medium text-peak-600">{platformLabel}</p>
        <h1 className="mt-2 text-[22px] font-semibold tracking-tight text-ink">
          {agentName}
        </h1>
        {description ? (
          <p className="mt-3 text-[14.5px] leading-[1.65] text-ink-muted">
            {description}
          </p>
        ) : null}
        {note ? (
          <p className="mt-3 text-[13px] leading-[1.65] text-ink-subtle">{note}</p>
        ) : null}

        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-peak-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-peak-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peak-500"
          >
            Open {agentName}
            <ExternalLink aria-hidden className="h-4 w-4" />
          </a>
        ) : (
          <p className="mt-5 text-[13px] text-ink-subtle">
            No link is configured for this agent yet.
          </p>
        )}
      </div>
    </div>
  );
}
