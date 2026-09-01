import type { Metadata } from "next";

import { AuthControls } from "@/components/AuthControls";
import { Footer } from "@/components/Footer";
import { TopNav } from "@/components/TopNav";
import { getDefaultRoute, getNavItems } from "@/lib/navigation";
import { getTenantConfig } from "@/lib/tenant-config";

import "./globals.css";

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
  const config = getTenantConfig();
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
  const config = getTenantConfig();

  return (
    <html lang="en">
      <body
        className="flex min-h-full flex-col"
        style={
          {
            "--color-client-accent": config.branding.primaryColor,
          } as React.CSSProperties
        }
      >
        <TopNav
          items={getNavItems(config)}
          defaultRoute={getDefaultRoute(config)}
          clientName={config.displayName}
          clientLogoUrl={config.branding.clientLogoUrl || undefined}
          authControls={<AuthControls />}
        />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
