import "server-only";

import type { TenantConfig } from "./tenant-config";

/**
 * Facility scope for the signed-in user (CLAUDE.md §2, §6).
 *
 * TODO(auth): this is a placeholder. Real scope must be resolved at sign-in from
 * the user's Entra ID group membership (or the mapping table), attached to the
 * NextAuth session, and enforced on every data-fetching call — not just used to
 * label the UI. Nothing below may be trusted for authorization.
 */

export type FacilityScope = {
  /** Hierarchy level this user's access is rooted at, from orgHierarchy.levels. */
  level: string;
  /** Human-readable name of the scope root, for display in the shell. */
  label: string;
  /** How many communities the scope covers, so a reader can size an aggregate. */
  communityCount: number;
};

export type AppSession = {
  userName: string;
  scope: FacilityScope;
};

export async function getSession(config: TenantConfig): Promise<AppSession> {
  return {
    userName: "Signed-out preview",
    scope: {
      level: config.orgHierarchy.levels[0] ?? "organization",
      label: config.displayName,
      communityCount: 0,
    },
  };
}
