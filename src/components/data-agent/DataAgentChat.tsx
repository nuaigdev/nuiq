"use client";

import { useCallback } from "react";

import { askDataAgentAction } from "@/app/(shell)/data-agents/actions";
import {
  AgentWorkspace,
  type AgentLink,
} from "@/components/agent-chat/AgentWorkspace";

/**
 * A Fabric data agent in the shared conversation workspace (CLAUDE.md §5 Tab 3).
 *
 * The only thing this adds to the workspace is the transport — the question
 * goes to Fabric over MCP, as the signed-in user — and the copy that says so.
 * Everything else about the exchange is the same as any other agent chat, and
 * lives in `components/agent-chat`.
 */

const PRIVACY_NOTE =
  "Questions run as you, so an answer never reaches past your own access. " +
  "Nothing in this conversation is saved.";

export function DataAgentChat({
  agentId,
  agentName,
  description,
  suggestions,
  agents,
}: {
  agentId: string;
  agentName: string;
  description?: string;
  suggestions: string[];
  agents: AgentLink[];
}) {
  const ask = useCallback(
    (question: string, history: { role: "user" | "agent"; text: string }[]) =>
      askDataAgentAction(agentId, question, history),
    [agentId],
  );

  return (
    <AgentWorkspace
      agentName={agentName}
      platform="Fabric"
      subtitle="Answers from your Fabric warehouse"
      ask={ask}
      description={description}
      suggestions={suggestions}
      agents={agents}
      currentId={agentId}
      eyebrow="Fabric data agent"
      backHref="/data-agents"
      backLabel="All data agents"
      privacyNote={PRIVACY_NOTE}
    />
  );
}
