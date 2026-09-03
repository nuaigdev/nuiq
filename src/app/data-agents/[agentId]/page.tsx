import { notFound } from "next/navigation";

import { AgentWorkspace } from "@/components/data-agent/AgentWorkspace";
import { findDataAgent, getDataAgents } from "@/lib/data-agent-store";
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

/**
 * Domain-correct openers, so a first-time user is not staring at an empty box
 * wondering what this thing knows. Deliberately generic across clients — they
 * name the metrics the industry uses, never a specific community.
 */
const SUGGESTIONS = [
  "What is current occupancy by community?",
  "How have falls trended over the last three months?",
  "Which communities have the lowest staffing ratios?",
  "What tables can you query?",
];

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

  return (
    <AgentWorkspace
      agentId={agent.id}
      agentName={agent.name}
      description={agent.description}
      suggestions={SUGGESTIONS}
      agents={agents}
    />
  );
}
