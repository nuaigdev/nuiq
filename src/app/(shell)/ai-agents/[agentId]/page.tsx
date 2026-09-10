import { notFound } from "next/navigation";

import { AgentSurface } from "@/components/ai-agent/AgentSurface";
import {
  agentSlug,
  findPlatformAgent,
  getPlatformAgents,
} from "@/lib/ai-agent-store";
import { getTenantConfig } from "@/lib/tenant-config";

/**
 * One agent, at its own URL, so a colleague can be linked straight to it
 * (CLAUDE.md §5). Rendered per request — agents come from the client's
 * configuration document, not from the build.
 */
export const dynamic = "force-dynamic";

/** Same reason as the tab itself: a Foundry agent can take minutes to answer. */
export const maxDuration = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const agent = findPlatformAgent(await getTenantConfig(), agentId);
  return { title: agent?.name ?? "Advanced AI Agents" };
}

export default async function AiAgentPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const config = await getTenantConfig();

  // Only agents this client has configured may be opened.
  const agent = findPlatformAgent(config, agentId);
  if (!agent) notFound();

  const siblings = getPlatformAgents(config)
    .map((other) => ({
      id: agentSlug(other),
      name: other.name,
      href: `/ai-agents/${agentSlug(other)}`,
    }))
    .filter((other) => other.id !== agentId);

  return <AgentSurface agent={agent} siblings={siblings} />;
}
