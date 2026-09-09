import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { SignInScreen } from "@/components/SignInScreen";
import { getSession } from "@/lib/session";
import { getTenantConfig } from "@/lib/tenant-config";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * The document and the login gate — nothing visible of its own.
 *
 * The portal's chrome (top nav, footer credit) lives in the `(shell)` route
 * group instead, so the landing page at `/` can be the full-bleed diagram it is
 * meant to be. Anything added directly under `src/app/` therefore renders bare;
 * portal pages belong in `(shell)`.
 */

/**
 * Rendered per request, never prerendered at build time.
 *
 * One container image is built once and deployed per client, each with its own
 * CLIENT_ID (CLAUDE.md §3). If these routes were static, the config of whichever
 * client happened to be set at build time would be baked into the HTML that
 * every other client's deployment then serves. Do not remove this.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getTenantConfig();
  return {
    title: {
      default: `NuIQ — ${config.displayName}`,
      template: `%s · NuIQ`,
    },
    description: "Data intelligence portal for senior living and long-term care.",
    /* The square NuAIg mark cropped out of the wordmark: the full wordmark is
       unreadable at 16px, and the NuIQ mark is no longer used (CLAUDE.md §8). */
    icons: { icon: "/nuaig-mark.svg" },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const config = await getTenantConfig();
  const session = await getSession();

  return (
    <html lang="en" className={inter.variable}>
      <body
        className="flex min-h-full flex-col"
        style={
          {
            "--color-client-accent": config.branding.primaryColor,
          } as React.CSSProperties
        }
      >
        {session.isAuthenticated ? (
          children
        ) : (
          /*
           * The login gate for the whole portal (CLAUDE.md §6).
           *
           * `children` is never rendered while signed out, so no page below can
           * put a client's dashboards, agents or name in front of an anonymous
           * visitor — the landing page and its diagram included. Enforcing it
           * here rather than per page means a new route cannot forget to be
           * protected: it is behind the gate by existing. src/proxy.ts stops the
           * request even earlier; this is the second layer, not the only one.
           * The auth route handlers are unaffected: route handlers do not render
           * inside layouts, so sign-in itself still works.
           */
          <SignInScreen clientName={config.displayName} />
        )}
      </body>
    </html>
  );
}
