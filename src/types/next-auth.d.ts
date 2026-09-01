import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    /** Delegated Power BI access token for the signed-in user. */
    powerBiToken?: string;
    /** Epoch ms at which powerBiToken expires. */
    powerBiTokenExpires?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    powerBiToken?: string;
    powerBiTokenExpires?: number;
  }
}
