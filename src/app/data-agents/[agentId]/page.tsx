import { notFound } from "next/navigation";

import { AgentWorkspace } from "@/components/data-agent/AgentWorkspace";
import {
  FALLBACK_SUGGESTIONS,
  findDataAgent,
  getDataAgents,
} from "@/lib/data-agent-store";
import { getTenantConfig } from "@/lib/tenant-config";

/**
 * Rendered per request, never prerendered — agent ids come from the client's
 * configuration document, not from the build.
 */
export const dynamic = "force-dynamic";

/**
 * Data agent questions are slow by nature — plan, generate SQL, query,
 * summarise. Without this the platform's default would cut the request off
 * before the agent had a chance to answer.
 */
export const maxDuration = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const agent = findDataAgent(await getTenantConfig(), agentId);
  return { title: agent?.name ?? "Data Agents" };
}

export default async function DataAgentPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const config = await getTenantConfig();

  // Only agents this client has configured may be opened.
  const agent = findDataAgent(config, agentId);
  if (!agent) notFound();

  const agents = getDataAgents(config).map(({ id, name }) => ({ id, name }));

  // The openers belong to the agent, not to this page: what makes a good
  // question depends on the schema it was published over.
  const suggestions =
    agent.suggestions.length > 0 ? agent.suggestions : FALLBACK_SUGGESTIONS;

  return (
    <AgentWorkspace
      agentId={agent.id}
      agentName={agent.name}
      description={agent.description}
      suggestions={suggestions}
      agents={agents}
    />
  );
}
