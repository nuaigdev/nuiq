import "server-only";

import { getToken } from "next-auth/jwt";
import { headers } from "next/headers";

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

/**
 * The user's Entra refresh token, read straight from the session JWT.
 *
 * Deliberately not exposed on the session object. NextAuth's session is what
 * would be serialized to the browser if a client component ever asked for it,
 * and a refresh token in the browser is a standing credential for that user.
 * Reading the JWT here keeps it server-side by construction.
 *
 * It is needed because an access token is issued for one resource: the Power BI
 * token on the session cannot call Fabric, so a second token has to be minted
 * for the same user (see `fabric.ts`).
 */
export async function getRefreshToken(): Promise<string | undefined> {
  if (!isAuthConfigured()) return undefined;

  const requestHeaders = await headers();
  const token = await getToken({
    req: { headers: requestHeaders },
    secret: process.env.AUTH_SECRET as string,
    secureCookie:
      requestHeaders.get("x-forwarded-proto") === "https" ||
      (requestHeaders.get("origin") ?? "").startsWith("https:"),
  });

  return token?.refreshToken;
}
