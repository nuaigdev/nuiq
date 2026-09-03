import "server-only";

import { z } from "zod";

import {
  getTenantConfigWithEtag,
  saveTenantConfig,
  type FabricDataAgent,
  type TenantConfig,
} from "./tenant-config";

/**
 * Fabric data agents shown in Tab 3.
 *
 * Like dashboards, these live in the client's configuration document, which is
 * editable at runtime — so adding an agent takes effect without a redeploy, and
 * writes are conditional on the etag the document was read at (CLAUDE.md §3).
 */

const GUID =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Shown when an agent carries no openers of its own — agents added before
 * suggestions were configurable, mostly. Deliberately schema-agnostic: these
 * ask the agent what it holds rather than assuming what it holds.
 */
export const FALLBACK_SUGGESTIONS = [
  "What tables can you query?",
  "What time period does this data cover?",
  "Summarise the key trends in this data.",
  "Which measures can you report on?",
];

export const dataAgentInputSchema = z.object({
  id: z.string().trim().regex(GUID, "Data agent ID must be a GUID."),
  name: z.string().trim().min(1, "Give the data agent a name."),
  workspaceId: z.string().trim().regex(GUID, "Workspace ID must be a GUID."),
  description: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  // One per line in the form, because a comma is fair game inside a question.
  suggestions: z
    .string()
    .nullish()
    .transform((value) =>
      (value ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .refine(
      (lines) => lines.length <= 4,
      "Four suggested questions at most — more than that is a list, not a prompt.",
    ),
});

export type DataAgentInput = z.infer<typeof dataAgentInputSchema>;

export function getDataAgents(config: TenantConfig): FabricDataAgent[] {
  return config.fabricDataAgents;
}

export function findDataAgent(
  config: TenantConfig,
  agentId: string,
): FabricDataAgent | undefined {
  return config.fabricDataAgents.find((agent) => agent.id === agentId);
}

/** Adds an agent, or updates one already present with the same id. */
export async function addDataAgent(entry: DataAgentInput): Promise<void> {
  const { config, etag } = await getTenantConfigWithEtag();

  const others = config.fabricDataAgents.filter(
    (agent) => agent.id !== entry.id,
  );

  await saveTenantConfig(
    { ...config, fabricDataAgents: [...others, entry] },
    etag,
  );
}

export async function removeDataAgent(agentId: string): Promise<void> {
  const { config, etag } = await getTenantConfigWithEtag();

  await saveTenantConfig(
    {
      ...config,
      fabricDataAgents: config.fabricDataAgents.filter(
        (agent) => agent.id !== agentId,
      ),
    },
    etag,
  );
}
