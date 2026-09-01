import NextAuth from "next-auth";
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

const SCOPE = ["openid", "profile", "email", "offline_access", ...POWERBI_SCOPES].join(" ");

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

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const config = getTenantConfig();

  return {
    providers: [
      MicrosoftEntraID({
        clientId: config.entraClientId,
        clientSecret: process.env.ENTRA_CLIENT_SECRET ?? "",
        issuer: `https://login.microsoftonline.com/${config.entraTenantId}/v2.0`,
        authorization: { params: { scope: SCOPE } },
      }),
    ],
    callbacks: {
      async jwt({ token, account }) {
        // Keep the Power BI access token on the JWT. Power BI is called with
        // this, so the call carries the user's own entitlements.
        if (account?.access_token) {
          token.powerBiToken = account.access_token;
          token.powerBiTokenExpires = account.expires_at
            ? account.expires_at * 1000
            : undefined;
        }
        return token;
      },
      async session({ session, token }) {
        session.powerBiToken = token.powerBiToken as string | undefined;
        session.powerBiTokenExpires = token.powerBiTokenExpires as
          | number
          | undefined;
        return session;
      },
    },
  };
});
