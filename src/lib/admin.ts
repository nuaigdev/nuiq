import "server-only";

import { getSession } from "./session";

/**
 * Who may change what the whole organization sees (CLAUDE.md §6).
 *
 * Admins are listed in ADMIN_EMAILS, comma-separated, per deployment. This is
 * enforced server-side in every mutating action — hiding the Manage screen in
 * the UI is not access control, and the check must not live only in the page.
 *
 * TODO(entra-roles): an email allow-list is a deployment-time list, not a real
 * directory role. The production form of this is an Entra app role or group
 * claim resolved at sign-in, so access is administered where the rest of the
 * client's access already is. Replace this, do not extend it.
 */

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

/** True when this deployment has nominated anybody as an admin. */
export function hasAdminList(): boolean {
  return adminEmails().length > 0;
}

export type AdminCheck =
  | { allowed: true; email: string }
  | { allowed: false; reason: string };

export async function checkAdmin(): Promise<AdminCheck> {
  const session = await getSession();

  if (!session.isAuthenticated || !session.email) {
    return { allowed: false, reason: "Sign in to manage dashboards." };
  }

  const allowList = adminEmails();

  // Fail closed. An empty ADMIN_EMAILS must not mean "everyone is an admin".
  if (allowList.length === 0) {
    return {
      allowed: false,
      reason:
        "No administrators are configured for this deployment. Set ADMIN_EMAILS " +
        "to the people who may change dashboards.",
    };
  }

  if (!allowList.includes(session.email.toLowerCase())) {
    return {
      allowed: false,
      reason:
        "Your account is not an administrator of this portal, so it cannot " +
        "change which dashboards everyone sees.",
    };
  }

  return { allowed: true, email: session.email };
}
