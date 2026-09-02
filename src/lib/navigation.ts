import type { TenantConfig } from "./tenant-config";

/**
 * The four top-level destinations (CLAUDE.md §5).
 *
 * Home is the hub; the rest are ordered as the reporting on the data, then the
 * two ways of asking questions of it. Do not reorder these as a cosmetic
 * change.
 *
 * A tab the client has not configured hides itself rather than rendering empty.
 * Hiding is presentation only — it is never access control. Any route that a
 * user must not reach has to refuse them server-side as well (CLAUDE.md §6).
 */

export type NavItem = {
  href: string;
  label: string;
};

type NavDefinition = NavItem & {
  isConfigured: (config: TenantConfig) => boolean;
};

const NAV_DEFINITIONS: NavDefinition[] = [
  {
    href: "/",
    label: "Home",
    isConfigured: () => true,
  },
  {
    href: "/dashboards",
    label: "Dashboards",
    // Always available: an admin can add dashboards from within the tab, so
    // hiding it when config is empty would hide the only way to add the first.
    isConfigured: () => true,
  },
  {
    href: "/data-agents",
    label: "Data Agents",
    // Always available: an admin adds the first agent from inside the tab, so
    // hiding it when config is empty would hide the only way to add one.
    isConfigured: () => true,
  },
  {
    href: "/ai-agents",
    label: "AI Agents",
    isConfigured: (config) => config.agents.length > 0,
  },
];

export function getNavItems(config: TenantConfig): NavItem[] {
  return NAV_DEFINITIONS.filter((item) => item.isConfigured(config)).map(
    ({ href, label }) => ({ href, label }),
  );
}

/** Where the NuIQ mark points. Home is always present. */
export function getDefaultRoute(): string {
  return "/";
}
