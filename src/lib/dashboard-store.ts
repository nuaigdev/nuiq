import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import type { TenantConfig } from "./tenant-config";

/**
 * Dashboards shown in Tab 2 = the baseline list in tenant.json, plus anything
 * an admin has added at runtime, minus anything an admin has hidden.
 *
 * tenant.json stays config-as-code and is never written to (CLAUDE.md §3).
 * Runtime edits live in their own store so the two never fight: config is what
 * ships with the deployment, the store is what an operator changed afterwards.
 *
 * PERSISTENCE CAVEAT: the store is a JSON file on local disk. That is correct
 * for development, but an Azure Container App's filesystem is ephemeral — a
 * revision restart or scale-to-zero loses it. Before this is relied on in
 * production, back it with durable storage (Azure Storage, a database, or a
 * metadata table in the client's warehouse). The interface below is the only
 * thing that would need to change.
 */

const dashboardEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  workspaceId: z.string().min(1),
  pageName: z.string().min(1).optional(),
  thumbnailUrl: z.string().url().optional(),
});

const storeSchema = z.object({
  added: z.array(dashboardEntrySchema).default([]),
  hidden: z.array(z.string().min(1)).default([]),
});

export type DashboardEntry = z.infer<typeof dashboardEntrySchema>;
type Store = z.infer<typeof storeSchema>;

/** A dashboard as the UI sees it, with where it came from. */
export type Dashboard = DashboardEntry & {
  /** "config" entries come from tenant.json; "admin" ones were added at runtime. */
  source: "config" | "admin";
};

const EMPTY: Store = { added: [], hidden: [] };

function storePath(clientId: string): string {
  return path.join(process.cwd(), "data", clientId, "dashboards.json");
}

async function readStore(clientId: string): Promise<Store> {
  let raw: string;
  try {
    raw = await readFile(storePath(clientId), "utf8");
  } catch {
    return EMPTY;
  }

  try {
    const parsed = storeSchema.safeParse(JSON.parse(raw));
    // A corrupt store must not take the tab down — fall back to config-only and
    // let the admin re-add. Losing runtime edits beats serving no dashboards.
    return parsed.success ? parsed.data : EMPTY;
  } catch {
    return EMPTY;
  }
}

async function writeStore(clientId: string, store: Store): Promise<void> {
  const file = storePath(clientId);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

/** The dashboards this deployment should show, config and runtime merged. */
export async function getDashboards(config: TenantConfig): Promise<Dashboard[]> {
  const store = await readStore(config.clientId);
  const hidden = new Set(store.hidden);
  const addedIds = new Set(store.added.map((entry) => entry.id));

  const fromConfig: Dashboard[] = config.powerBi.reports
    .filter((report) => !hidden.has(report.id) && !addedIds.has(report.id))
    .map((report) => ({
      id: report.id,
      name: report.name,
      workspaceId: report.workspaceId ?? config.powerBi.workspaceId,
      pageName: report.pageName,
      thumbnailUrl: report.thumbnailUrl,
      source: "config",
    }));

  const fromAdmin: Dashboard[] = store.added
    .filter((entry) => !hidden.has(entry.id))
    .map((entry) => ({ ...entry, source: "admin" }));

  return [...fromConfig, ...fromAdmin];
}

export async function findDashboard(
  config: TenantConfig,
  reportId: string,
): Promise<Dashboard | undefined> {
  const dashboards = await getDashboards(config);
  return dashboards.find((dashboard) => dashboard.id === reportId);
}

export async function addDashboard(
  config: TenantConfig,
  entry: DashboardEntry,
): Promise<void> {
  const store = await readStore(config.clientId);
  await writeStore(config.clientId, {
    // Re-adding something previously hidden should bring it back.
    hidden: store.hidden.filter((id) => id !== entry.id),
    added: [...store.added.filter((item) => item.id !== entry.id), entry],
  });
}

export async function removeDashboard(
  config: TenantConfig,
  reportId: string,
): Promise<void> {
  const store = await readStore(config.clientId);
  const wasAdded = store.added.some((entry) => entry.id === reportId);

  await writeStore(config.clientId, {
    added: store.added.filter((entry) => entry.id !== reportId),
    // A config-sourced dashboard cannot be deleted from tenant.json at runtime,
    // so record it as hidden instead.
    hidden: wasAdded ? store.hidden : [...new Set([...store.hidden, reportId])],
  });
}

/** Config-sourced dashboards an admin has hidden, so they can be restored. */
export async function getHiddenConfigDashboards(
  config: TenantConfig,
): Promise<{ id: string; name: string }[]> {
  const store = await readStore(config.clientId);
  const hidden = new Set(store.hidden);
  return config.powerBi.reports
    .filter((report) => hidden.has(report.id))
    .map((report) => ({ id: report.id, name: report.name }));
}

export async function restoreDashboard(
  config: TenantConfig,
  reportId: string,
): Promise<void> {
  const store = await readStore(config.clientId);
  await writeStore(config.clientId, {
    ...store,
    hidden: store.hidden.filter((id) => id !== reportId),
  });
}
