import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    /** Delegated Power BI access token for the signed-in user. */
    powerBiToken?: string;
    /** Epoch ms at which powerBiToken expires. */
    powerBiTokenExpires?: number;
    /** Set when the token could not be renewed and the user must sign in again. */
    error?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    powerBiToken?: string;
    powerBiTokenExpires?: number;
    /** Used to renew the Power BI token without sending the user back to Entra. */
    refreshToken?: string;
    error?: string;
  }
}
