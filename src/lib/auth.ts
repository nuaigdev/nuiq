import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

import { getTenantConfig } from "./tenant-config";

/**
 * Entra ID sign-in (CLAUDE.md §4, §6).
 *
 * Single-tenant: the app registration lives in *this client's* Entra tenant and
 * only their staff can sign in. There is deliberately no multi-tenant logic and
 * no "which tenant is this" resolution — that is explicitly out of scope (§3).
 *
 * We request delegated Power BI scopes at sign-in so dashboards can be loaded
 * with the user's own identity. Power BI then decides what they may see: a user
 * without Power BI access gets nothing, and row-level security applies against
 * the real person rather than an identity NuIQ asserts on their behalf.
 */

const POWERBI_SCOPES = [
  "https://analysis.windows.net/powerbi/api/Report.Read.All",
  "https://analysis.windows.net/powerbi/api/Dataset.Read.All",
  "https://analysis.windows.net/powerbi/api/Workspace.Read.All",
];

// offline_access is what makes Entra issue a refresh token. Without it the
// Power BI token simply dies after about an hour with no way to renew it.
const SCOPE = [
  "openid",
  "profile",
  "email",
  "offline_access",
  ...POWERBI_SCOPES,
].join(" ");

/** Renew slightly early, so a token does not expire mid-request. */
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

/**
 * Whether sign-in can work in this environment.
 *
 * ENTRA_CLIENT_SECRET is injected from the client's Key Vault via managed
 * identity in a deployment; locally it belongs in .env.local, which is
 * gitignored and must never be committed (CLAUDE.md §3). AUTH_SECRET is what
 * NextAuth signs its own session cookie with.
 *
 * When either is absent the app still runs — unauthenticated — so a missing
 * secret shows up as a clear message rather than a 500 on every page.
 */
export function isAuthConfigured(): boolean {
  return Boolean(process.env.ENTRA_CLIENT_SECRET && process.env.AUTH_SECRET);
}

/** Names of the environment values sign-in needs, for error messages. */
export function missingAuthEnv(): string[] {
  const missing: string[] = [];
  if (!process.env.ENTRA_CLIENT_SECRET) missing.push("ENTRA_CLIENT_SECRET");
  if (!process.env.AUTH_SECRET) missing.push("AUTH_SECRET");
  return missing;
}

/**
 * Exchange the refresh token for a fresh access token.
 *
 * Access tokens last about an hour. Without this, coming back to the portal
 * after lunch means Power BI rejects the stale token and the UI reports it as
 * "no access" — which is both wrong and impossible for the user to act on.
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  const config = await getTenantConfig();

  if (!token.refreshToken) {
    return { ...token, error: "NoRefreshToken" };
  }

  try {
    const response = await fetch(
      `https://login.microsoftonline.com/${config.entraTenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: config.entraClientId,
          client_secret: process.env.ENTRA_CLIENT_SECRET ?? "",
          refresh_token: token.refreshToken,
          scope: SCOPE,
        }),
        cache: "no-store",
      },
    );

    const body = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
      refresh_token?: string;
    };

    if (!response.ok || !body.access_token) {
      return { ...token, error: "RefreshFailed" };
    }

    return {
      ...token,
      powerBiToken: body.access_token,
      powerBiTokenExpires: Date.now() + (body.expires_in ?? 3600) * 1000,
      // Entra may hand back a rotated refresh token; keep the newest one.
      refreshToken: body.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshFailed" };
  }
}

// NextAuth accepts an async config factory, so the client config can come from
// the store rather than being duplicated into environment variables.
export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
  const config = await getTenantConfig();

  return {
    providers: [
      MicrosoftEntraID({
        clientId: config.entraClientId,
        clientSecret: process.env.ENTRA_CLIENT_SECRET ?? "",
        issuer: `https://login.microsoftonline.com/${config.entraTenantId}/v2.0`,
        authorization: {
          params: {
            scope: SCOPE,
            /*
             * Entra only shows a consent screen for scopes the app asks for,
             * and sign-in asks for Power BI scopes only — the Fabric token is
             * obtained later by redeeming the refresh token. So adding a Fabric
             * permission in the portal never triggers a new prompt, and the
             * existing grant can go stale without any visible sign.
             *
             * Setting AUTH_FORCE_CONSENT=true forces the consent screen on the
             * next sign-in, which refreshes the grant. Set it, sign in once,
             * then remove it — forcing consent on every sign-in is noise.
             */
            ...(process.env.AUTH_FORCE_CONSENT === "true"
              ? { prompt: "consent" }
              : {}),
          },
        },
      }),
    ],
    callbacks: {
      async jwt({ token, account }) {
        // First pass, straight after sign-in: capture what Entra issued.
        if (account) {
          return {
            ...token,
            powerBiToken: account.access_token,
            powerBiTokenExpires: account.expires_at
              ? account.expires_at * 1000
              : Date.now() + 3600 * 1000,
            refreshToken: account.refresh_token,
            error: undefined,
          };
        }

        // Still valid with room to spare — nothing to do.
        if (
          token.powerBiTokenExpires &&
          Date.now() < token.powerBiTokenExpires - REFRESH_MARGIN_MS
        ) {
          return token;
        }

        return refreshAccessToken(token);
      },
      async session({ session, token }) {
        session.powerBiToken = token.powerBiToken;
        session.powerBiTokenExpires = token.powerBiTokenExpires;
        session.error = token.error;
        return session;
      },
    },
  };
});
