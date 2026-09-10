import "server-only";

import type { PlatformAgent, TenantConfig } from "./tenant-config";

/**
 * The platform agents shown in Tab 4 (CLAUDE.md §5).
 *
 * These are the client's broader AI agents — Foundry, Copilot Studio, Power
 * Platform — as distinct from the Fabric data agents in Tab 3, which answer
 * over the warehouse itself.
 */

/**
 * A URL-safe id for an agent.
 *
 * Config gives these agents a name and a platform reference but no id of their
 * own, and the platform reference is the wrong thing to route on: an endpoint
 * is long, a Copilot Studio agent has none, and neither is stable when an agent
 * is rebuilt. The display name is what a colleague would recognise in a link
 * they were sent, so the slug comes from that.
 */
export function agentSlug(agent: PlatformAgent): string {
  return agent.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getPlatformAgents(config: TenantConfig): PlatformAgent[] {
  return config.agents;
}

/**
 * Resolve a slug from a URL to a configured agent.
 *
 * A route parameter is user-supplied, so it is matched against config rather
 * than used to build a request — the same rule dashboards follow (§5 Tab 2).
 */
export function findPlatformAgent(
  config: TenantConfig,
  slug: string,
): PlatformAgent | undefined {
  return config.agents.find((agent) => agentSlug(agent) === slug);
}

/** The label for an agent's platform, for the one place it is worth naming. */
export const PLATFORM_LABELS: Record<PlatformAgent["type"], string> = {
  foundry: "Azure AI Foundry",
  "copilot-studio": "Copilot Studio",
  "power-platform": "Power Platform",
};

/**
 * Shown when an agent carries no openers of its own. Deliberately
 * capability-agnostic: these ask the agent what it can do rather than assuming.
 */
export const FALLBACK_SUGGESTIONS = [
  "What can you help me with?",
  "What information can you draw on?",
  "Give me a short summary of what you do.",
];
