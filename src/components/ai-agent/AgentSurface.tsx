import {
  agentSlug,
  FALLBACK_SUGGESTIONS,
  PLATFORM_LABELS,
} from "@/lib/ai-agent-store";
import type { PlatformAgent } from "@/lib/tenant-config";

import { AgentLinkCard } from "./AgentLinkCard";
import { EmbeddedApp } from "./EmbeddedApp";
import { FoundryChat } from "./FoundryChat";
import type { AgentLink } from "@/components/agent-chat/AgentWorkspace";

/**
 * Picks the rendering mode for one agent (CLAUDE.md §5 Tab 4).
 *
 * Presentation varying per agent is the point of this tab, so this file is the
 * only place that decides which surface an agent gets, and it decides on the
 * `display` field with `type` narrowing it. Each mode is its own component:
 * adding a new one — a Copilot Studio Direct Line embed, say — means adding a
 * component and a branch here, and touching no layout code.
 *
 * Anything without a renderer falls through to the link card rather than
 * erroring, which is the graceful per-agent fallback the spec asks for.
 */

const NO_RENDERER_NOTE =
  "This agent is configured but its embedded view has not been built yet, so " +
  "it opens on its own platform for now.";

export function AgentSurface({
  agent,
  siblings,
}: {
  agent: PlatformAgent;
  /** The other agents on this tab, for the switcher beside a conversation. */
  siblings: AgentLink[];
}) {
  const slug = agentSlug(agent);
  const platformLabel = PLATFORM_LABELS[agent.type] ?? agent.type;
  const suggestions =
    agent.suggestions.length > 0 ? agent.suggestions : FALLBACK_SUGGESTIONS;

  if (agent.display === "chat-panel" && agent.type === "foundry") {
    return (
      <FoundryChat
        slug={slug}
        agentName={agent.name}
        description={agent.description}
        suggestions={suggestions}
        agents={siblings}
      />
    );
  }

  const url = agent.appUrl ?? agent.embedUrl;

  if (agent.display === "iframe" && url) {
    return <EmbeddedApp agentName={agent.name} url={url} />;
  }

  return (
    <AgentLinkCard
      agentName={agent.name}
      platformLabel={platformLabel}
      description={agent.description}
      url={url}
      note={agent.display === "link-card" ? undefined : NO_RENDERER_NOTE}
    />
  );
}
