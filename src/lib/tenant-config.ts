import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

/**
 * Loads the running deployment's client config (CLAUDE.md §3).
 *
 * One deployment == one client == one CLIENT_ID env var. The client identity is
 * resolved from that env var at startup and never inferred from the request, so
 * there is deliberately no way to pass a client id in here from a caller.
 */

const AGENT_TYPES = ["foundry", "copilot-studio", "power-platform"] as const;
const DISPLAY_MODES = ["chat-panel", "iframe", "link-card"] as const;

const powerBiReportSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /**
   * Report page (section) to open on, e.g. "bcb646c3f4e6fe1a7859". Optional —
   * omit to open the report's default page.
   */
  pageName: z.string().min(1).optional(),
  /**
   * The model field that scopes this report to a community. Informational —
   * filtering is enforced by row-level security in the semantic model against
   * the signed-in user's own Power BI identity, not by anything NuIQ passes.
   */
  facilityFilterField: z.string().min(1).optional(),
})

const fabricDataAgentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  workspaceId: z.string().min(1),
  description: z.string().optional(),
});

const agentSchema = z.object({
  type: z.enum(AGENT_TYPES),
  name: z.string().min(1),
  // Drives which rendering mode the agent gets in Tab 4 (CLAUDE.md §5).
  display: z.enum(DISPLAY_MODES).default("chat-panel"),
  endpoint: z.string().optional(),
  agentId: z.string().optional(),
  embedUrl: z.string().optional(),
  appUrl: z.string().optional(),
});

const tenantConfigSchema = z.object({
  clientId: z.string().min(1),
  displayName: z.string().min(1),
  entraTenantId: z.string().min(1),
  entraClientId: z.string().min(1),
  fabricWorkspaceId: z.string().min(1),
  warehouseSqlEndpoint: z.string().min(1),
  powerBi: z.object({
    workspaceId: z.string().min(1),
    reports: z.array(powerBiReportSchema).default([]),
  }),
  fabricDataAgents: z.array(fabricDataAgentSchema).default([]),
  agents: z.array(agentSchema).default([]),
  orgHierarchy: z.object({
    levels: z.array(z.string().min(1)).min(1),
  }),
  branding: z.object({
    primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "must be a #rrggbb hex color"),
    clientLogoUrl: z.string().optional(),
  }),
});

export type TenantConfig = z.infer<typeof tenantConfigSchema>;
export type PowerBiReport = z.infer<typeof powerBiReportSchema>;
export type FabricDataAgent = z.infer<typeof fabricDataAgentSchema>;
export type PlatformAgent = z.infer<typeof agentSchema>;
export type AgentType = (typeof AGENT_TYPES)[number];
export type AgentDisplayMode = (typeof DISPLAY_MODES)[number];

/**
 * Key names that would indicate a secret has been checked into /config.
 * Secrets belong in that client's Key Vault, reached via Managed Identity —
 * never in tenant.json (CLAUDE.md §3). Fail the boot rather than serve a
 * deployment whose config file is leaking credentials into the repo.
 */
const FORBIDDEN_KEY_PATTERN =
  /secret|password|passwd|connectionstring|conn_str|apikey|api_key|accesskey|access_key|sastoken|sas_token|credential|private_key|privatekey/i;

function assertNoSecrets(value: unknown, trail: string[] = []): void {
  if (Array.isArray(value)) {
    value.forEach((item, i) => assertNoSecrets(item, [...trail, String(i)]));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (FORBIDDEN_KEY_PATTERN.test(key)) {
        throw new Error(
          `[NuIQ config] Refusing to start: "${[...trail, key].join(".")}" looks like a secret. ` +
            `tenant.json holds non-secret identifiers only — move this to the client's Key Vault ` +
            `and read it at runtime via Managed Identity (CLAUDE.md §3).`,
        );
      }
      assertNoSecrets(child, [...trail, key]);
    }
  }
}

function loadTenantConfig(): TenantConfig {
  const clientId = process.env.CLIENT_ID?.trim();

  if (!clientId) {
    throw new Error(
      "[NuIQ config] Refusing to start: CLIENT_ID is not set. Each deployment serves exactly " +
        "one client and resolves it from this env var at startup (CLAUDE.md §3). " +
        "For local development: CLIENT_ID=kestrelbrook npm run dev",
    );
  }

  // CLIENT_ID becomes a path segment; keep it to a safe slug so it can never
  // escape /config, even though it is operator-set rather than user-supplied.
  if (!/^[a-z0-9][a-z0-9-]*$/.test(clientId)) {
    throw new Error(
      `[NuIQ config] Refusing to start: CLIENT_ID "${clientId}" is not a valid client slug ` +
        `(lowercase letters, digits and hyphens only).`,
    );
  }

  const configPath = path.join(process.cwd(), "config", clientId, "tenant.json");

  let raw: string;
  try {
    raw = readFileSync(configPath, "utf8");
  } catch {
    throw new Error(
      `[NuIQ config] Refusing to start: no config found for CLIENT_ID "${clientId}" ` +
        `(looked for ${configPath}).`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `[NuIQ config] Refusing to start: ${configPath} is not valid JSON — ` +
        `${(error as Error).message}`,
    );
  }

  assertNoSecrets(parsed);

  const result = tenantConfigSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `[NuIQ config] Refusing to start: ${configPath} is malformed.\n${issues}`,
    );
  }

  if (result.data.clientId !== clientId) {
    throw new Error(
      `[NuIQ config] Refusing to start: CLIENT_ID is "${clientId}" but ` +
        `${configPath} declares clientId "${result.data.clientId}".`,
    );
  }

  return result.data;
}

let cached: TenantConfig | undefined;

/** The current deployment's client config. Throws loudly if it is missing or invalid. */
export function getTenantConfig(): TenantConfig {
  cached ??= loadTenantConfig();
  return cached;
}
