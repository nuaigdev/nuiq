import "server-only";

import { auth, isAuthConfigured } from "./auth";

/**
 * The signed-in user (CLAUDE.md §6).
 *
 * Facility scope is NOT resolved here yet. For Power BI, scoping is enforced by
 * row-level security in the semantic model against the user's own Power BI
 * identity, so dashboards are correctly scoped without NuIQ asserting anything.
 *
 * TODO(scope): warehouse-backed features (Tab 1 detail, Tab 3 data agents) still
 * need the organization/region/community/unit scope resolved from Entra group
 * membership and enforced server-side. Do not treat a signed-in session as
 * authorization for those until that exists.
 */

export type AppSession = {
  isAuthenticated: boolean;
  userName?: string;
  email?: string;
  /** Delegated Power BI token. Server-side only — never send this to the client. */
  powerBiToken?: string;
  /**
   * True when the token could not be renewed and the user must sign in again.
   * Distinct from "no access": one is a stale session, the other is a
   * permission the user genuinely does not have. Telling them apart is the
   * difference between an actionable message and a dead end.
   */
  sessionExpired: boolean;
};

export async function getSession(): Promise<AppSession> {
  // Never call auth() before the environment can support it — without a secret
  // NextAuth throws, which would take down every page rather than just sign-in.
  if (!isAuthConfigured()) {
    return { isAuthenticated: false, sessionExpired: false };
  }

  const session = await auth();

  if (!session?.user) {
    return { isAuthenticated: false, sessionExpired: false };
  }

  const expired = Boolean(session.error) || !session.powerBiToken;

  return {
    isAuthenticated: true,
    userName: session.user.name ?? undefined,
    email: session.user.email ?? undefined,
    powerBiToken: expired ? undefined : session.powerBiToken,
    sessionExpired: expired,
  };
}
