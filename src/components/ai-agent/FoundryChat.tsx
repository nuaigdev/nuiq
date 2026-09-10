"use client";

import { useCallback } from "react";

import { askAiAgentAction } from "@/app/(shell)/ai-agents/actions";
import {
  AgentWorkspace,
  type AgentLink,
} from "@/components/agent-chat/AgentWorkspace";

/**
 * Rendering mode: `chat-panel`, for an Azure AI Foundry agent (§5 Tab 4).
 *
 * One component per rendering mode is the rule for this tab, and this is the
 * chat one. It owns exactly two things — the transport that reaches Foundry,
 * and the copy that tells the reader what that means. The conversation surface
 * itself is the same one Tab 3 uses.
 *
 * The privacy note here deliberately does NOT say "questions run as you". They
 * do not: Foundry publishes no delegated scope, so the portal calls as the
 * application (see `lib/foundry.ts`). Saying otherwise on screen would be a
 * false assurance in a setting where someone might act on it.
 */

const PRIVACY_NOTE =
  "This agent runs under the portal's own identity, not yours, so its answers " +
  "are not limited by your access — take care with resident detail in what you " +
  "type. Nothing in this conversation is saved.";

export function FoundryChat({
  slug,
  agentName,
  description,
  suggestions,
  agents,
}: {
  slug: string;
  agentName: string;
  description?: string;
  suggestions: string[];
  agents: AgentLink[];
}) {
  const ask = useCallback(
    (question: string, history: { role: "user" | "agent"; text: string }[]) =>
      askAiAgentAction(slug, question, history),
    [slug],
  );

  return (
    <AgentWorkspace
      agentName={agentName}
      platform="Foundry"
      subtitle="Azure AI Foundry agent"
      ask={ask}
      description={description}
      suggestions={suggestions}
      agents={agents}
      currentId={slug}
      eyebrow="Azure AI Foundry"
      backHref="/ai-agents"
      backLabel="All AI agents"
      privacyNote={PRIVACY_NOTE}
    />
  );
}
