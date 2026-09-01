import "server-only";

import { z } from "zod";

import {
  getTenantConfigWithEtag,
  saveTenantConfig,
  type TenantConfig,
} from "./tenant-config";

/**
 * Dashboards shown in Tab 2.
 *
 * These live in the client's configuration document, which is now itself
 * editable at runtime — so there is no longer a "shipped baseline" to protect
 * and no added/hidden overlay. One document, one etag, one list. Adding or
 * removing a dashboard is an edit to that document, written conditionally so a
 * concurrent edit is refused rather than silently discarded (CLAUDE.md §3).
 */

const GUID =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const dashboardInputSchema = z.object({
  id: z.string().trim().regex(GUID, "Report ID must be a GUID."),
  name: z.string().trim().min(1, "Give the dashboard a name."),
  workspaceId: z.string().trim().regex(GUID, "Workspace ID must be a GUID."),
  pageName: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  thumbnailUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine(
      (value) => value === undefined || z.string().url().safeParse(value).success,
      "Preview image must be a URL.",
    ),
});

export type DashboardInput = z.infer<typeof dashboardInputSchema>;

/** A dashboard as the UI sees it. */
export type Dashboard = {
  id: string;
  name: string;
  workspaceId: string;
  pageName?: string;
  thumbnailUrl?: string;
};

/**
 * The dashboards this deployment should show.
 *
 * Derived from config, so it needs no I/O of its own — the caller has already
 * paid for the config read.
 */
export function getDashboards(config: TenantConfig): Dashboard[] {
  return config.powerBi.reports.map((report) => ({
    id: report.id,
    name: report.name,
    // Falls back to the workspace-wide id so a client whose reports all live
    // together does not have to repeat it per report.
    workspaceId: report.workspaceId ?? config.powerBi.workspaceId,
    pageName: report.pageName,
    thumbnailUrl: report.thumbnailUrl,
  }));
}

export function findDashboard(
  config: TenantConfig,
  reportId: string,
): Dashboard | undefined {
  return getDashboards(config).find((dashboard) => dashboard.id === reportId);
}

/**
 * Adds a dashboard, or updates one already present with the same report id.
 *
 * Reads the current document and writes it back against the etag it was read
 * at, so two admins editing at once produce a conflict rather than a silent
 * overwrite.
 */
export async function addDashboard(entry: DashboardInput): Promise<void> {
  const { config, etag } = await getTenantConfigWithEtag();

  const reports = config.powerBi.reports.filter(
    (report) => report.id !== entry.id,
  );

  await saveTenantConfig(
    {
      ...config,
      powerBi: {
        ...config.powerBi,
        reports: [
          ...reports,
          {
            id: entry.id,
            name: entry.name,
            workspaceId: entry.workspaceId,
            pageName: entry.pageName,
            thumbnailUrl: entry.thumbnailUrl,
          },
        ],
      },
    },
    etag,
  );
}

export async function removeDashboard(reportId: string): Promise<void> {
  const { config, etag } = await getTenantConfigWithEtag();

  await saveTenantConfig(
    {
      ...config,
      powerBi: {
        ...config.powerBi,
        reports: config.powerBi.reports.filter(
          (report) => report.id !== reportId,
        ),
      },
    },
    etag,
  );
}
