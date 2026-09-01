import "server-only";

import { z } from "zod";

import { getConfigStore } from "./config-store";

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
   * Optional still image shown on the dashboard tile. Power BI has no public
   * report-thumbnail API, so this is supplied rather than fetched. Omit it and
   * the tile falls back to a generated placeholder.
   */
  thumbnailUrl: z.string().url().optional(),
  /**
   * Workspace this report lives in. Optional — falls back to
   * powerBi.workspaceId. Set it when a client's reports are spread across
   * several Fabric/Power BI workspaces.
   */
  workspaceId: z.string().min(1).optional(),
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

/** How long a loaded config is reused before re-reading the store. */
function cacheTtlMs(): number {
  const configured = Number(process.env.CONFIG_CACHE_TTL_SECONDS);
  return Number.isFinite(configured) && configured >= 0
    ? configured * 1000
    : 30_000;
}

/** The client this deployment serves. Resolved from the environment, never from a request. */
export function getClientId(): string {
  const clientId = process.env.CLIENT_ID?.trim();

  if (!clientId) {
    throw new Error(
      "[NuIQ config] Refusing to start: CLIENT_ID is not set. Each deployment " +
        "serves exactly one client and resolves it from this env var at startup " +
        "(CLAUDE.md §3).",
    );
  }

  // CLIENT_ID becomes a storage key segment; keep it to a safe slug so it can
  // never traverse outside this client's prefix, even though it is operator-set
  // rather than user-supplied.
  if (!/^[a-z0-9][a-z0-9-]*$/.test(clientId)) {
    throw new Error(
      `[NuIQ config] Refusing to start: CLIENT_ID "${clientId}" is not a valid ` +
        `client slug (lowercase letters, digits and hyphens only).`,
    );
  }

  return clientId;
}

/**
 * Validates a raw configuration document.
 *
 * Exported so the seed script and admin writes run exactly the same checks a
 * boot does — config that would fail to load must fail to save.
 */
export function parseTenantConfig(
  raw: unknown,
  clientId: string,
  origin: string,
): TenantConfig {
  assertNoSecrets(raw);

  const result = tenantConfigSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `[NuIQ config] Configuration at ${origin} is malformed.
${issues}`,
    );
  }

  if (result.data.clientId !== clientId) {
    throw new Error(
      `[NuIQ config] CLIENT_ID is "${clientId}" but ${origin} declares ` +
        `clientId "${result.data.clientId}".`,
    );
  }

  return result.data;
}

export type LoadedTenantConfig = { config: TenantConfig; etag: string };

let cached: (LoadedTenantConfig & { loadedAt: number }) | undefined;

async function loadTenantConfig(): Promise<LoadedTenantConfig> {
  const clientId = getClientId();
  const stored = await getConfigStore().read(clientId);

  // Fail loudly. A deployment whose config is absent must not quietly serve
  // defaults or another client's settings (CLAUDE.md §3).
  if (!stored) {
    throw new Error(
      `[NuIQ config] Refusing to start: no configuration found for CLIENT_ID ` +
        `"${clientId}" in the configured store. Seed it first ` +
        `(\`npm run seed-config\`) — there is deliberately no fallback.`,
    );
  }

  const config = parseTenantConfig(
    stored.config,
    clientId,
    `the configuration store (client "${clientId}")`,
  );

  return { config, etag: stored.etag };
}

/**
 * This deployment's client config, with its version tag.
 *
 * Cached in memory for a short window so a page render does not re-fetch per
 * component. Each serving instance caches independently, so after an admin
 * writes, other warm instances can serve the previous config until their window
 * lapses. That staleness is bounded by CONFIG_CACHE_TTL_SECONDS and accepted.
 */
export async function getTenantConfigWithEtag(): Promise<LoadedTenantConfig> {
  if (cached && Date.now() - cached.loadedAt < cacheTtlMs()) {
    return { config: cached.config, etag: cached.etag };
  }

  const loaded = await loadTenantConfig();
  cached = { ...loaded, loadedAt: Date.now() };
  return loaded;
}

/** This deployment's client config. Throws loudly if missing or invalid. */
export async function getTenantConfig(): Promise<TenantConfig> {
  return (await getTenantConfigWithEtag()).config;
}

/** Drop the memoised config so the next read goes to the store. */
export function invalidateTenantConfig(): void {
  cached = undefined;
}

/**
 * Persists an updated configuration.
 *
 * Validated before writing, and written conditionally: if the stored copy moved
 * on since `etag` was read, the store raises a conflict rather than discarding
 * whoever wrote in between.
 */
export async function saveTenantConfig(
  config: TenantConfig,
  etag: string,
): Promise<void> {
  const clientId = getClientId();
  parseTenantConfig(config, clientId, "the submitted configuration");

  await getConfigStore().write(clientId, config, etag);
  invalidateTenantConfig();
}
