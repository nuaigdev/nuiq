import { AuthControls } from "@/components/AuthControls";
import { Footer } from "@/components/Footer";
import { PreviewWarmup } from "@/components/gallery/PreviewWarmup";
import { TopNav } from "@/components/TopNav";
import { getDefaultRoute, getNavItems } from "@/lib/navigation";
import { getTenantConfig } from "@/lib/tenant-config";

/**
 * The portal shell: top nav above, content below, NuAIg footer credit always
 * present (CLAUDE.md §5, §8).
 *
 * This used to be the root layout. It moved into a route group so that the
 * landing page at `/` can render without chrome — a route group changes no
 * URLs, so every path below is exactly where it was. The root layout still
 * owns <html>, the font, the auth gate and force-dynamic; only the visible
 * chrome lives here.
 *
 * Every route that is part of the portal proper belongs in this group. A new
 * tab added outside it would silently lose the nav and the footer credit, and
 * the footer credit is not optional (§8).
 */
export default async function ShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const config = await getTenantConfig();

  return (
    <>
      {/* Power BI is a third party the dashboard tiles have to reach; opening
          the connection here means the first tile is not also paying for the
          DNS and TLS handshake. */}
      <link rel="preconnect" href="https://app.powerbi.com" />
      <link rel="dns-prefetch" href="https://app.powerbi.com" />
      <PreviewWarmup />

      <TopNav
        items={getNavItems(config)}
        defaultRoute={getDefaultRoute()}
        clientLogoUrl={config.branding.clientLogoUrl || undefined}
        authControls={<AuthControls />}
      />
      <main className="app-main flex-1">{children}</main>
      <Footer />
    </>
  );
}
