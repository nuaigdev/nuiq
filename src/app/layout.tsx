import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AuthControls } from "@/components/AuthControls";
import { Footer } from "@/components/Footer";
import { SignInScreen } from "@/components/SignInScreen";
import { TopNav } from "@/components/TopNav";
import { getDefaultRoute, getNavItems } from "@/lib/navigation";
import { getSession } from "@/lib/session";
import { getTenantConfig } from "@/lib/tenant-config";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * The one persistent shell (CLAUDE.md §5): top nav above, content below,
 * NuAIg footer always present. Tabs render inside this — never replace it.
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
    icons: { icon: "/nuiq-logo.png" },
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
          <>
            <TopNav
              items={getNavItems(config)}
              defaultRoute={getDefaultRoute()}
              clientName={config.displayName}
              clientLogoUrl={config.branding.clientLogoUrl || undefined}
              authControls={<AuthControls />}
            />
            <main className="app-main flex-1">{children}</main>
            <Footer />
          </>
        ) : (
          /*
           * The login gate for the whole portal (CLAUDE.md §6).
           *
           * `children` is never rendered while signed out, so no page below can
           * put a client's dashboards, agents or name in front of an anonymous
           * visitor. Enforcing it here rather than per page means a new route
           * cannot forget to be protected — it is behind the gate by existing.
           * The auth route handlers are unaffected: route handlers do not render
           * inside layouts, so sign-in itself still works.
           */
          <SignInScreen clientName={config.displayName} />
        )}
      </body>
    </html>
  );
}
