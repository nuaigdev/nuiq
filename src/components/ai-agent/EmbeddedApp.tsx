import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

/**
 * Rendering mode: `iframe` (§5 Tab 4).
 *
 * A Power Platform canvas app, or anything else that ships its own full UI at a
 * URL. The frame gets the whole route below the nav, because a canvas app
 * designed for a browser tab does not survive being squeezed into a card.
 *
 * `sandbox` is deliberately absent rather than forgotten: a Power Apps player
 * needs same-origin storage and its own popups to sign the user in, and a
 * sandbox tight enough to be worth having breaks it outright. The URL comes
 * from this client's own configuration, which is the trust boundary here.
 */
export function EmbeddedApp({
  agentName,
  url,
}: {
  agentName: string;
  url: string;
}) {
  return (
    <div className="flex h-full flex-col bg-canvas-ground">
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-canvas-line px-5 py-3">
        <Link
          href="/ai-agents"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-subtle transition-colors hover:text-peak-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peak-500"
        >
          <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
          All AI agents
        </Link>
        <p className="text-[13.5px] font-medium text-ink">{agentName}</p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1.5 text-[12.5px] text-ink-subtle transition-colors hover:text-peak-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peak-500"
        >
          Open in a new tab
          <ExternalLink aria-hidden className="h-3.5 w-3.5" />
        </a>
      </div>

      <iframe
        src={url}
        title={agentName}
        className="min-h-0 flex-1 border-0 bg-surface"
        allow="clipboard-write; microphone"
      />
    </div>
  );
}
