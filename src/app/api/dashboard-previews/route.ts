import { NextResponse } from "next/server";

import { getDashboards } from "@/lib/dashboard-store";
import { getPreviewEmbedUrl } from "@/lib/powerbi";
import { getSession } from "@/lib/session";
import { getTenantConfig } from "@/lib/tenant-config";

/**
 * Warms the dashboard tile previews, from whatever page the user is on.
 *
 * The gallery's tiles embed real reports, and the slow part of that is not the
 * embed itself — it is finding each report's embed URL, one Power BI call per
 * dashboard, at the moment the gallery is opened. This route does those calls
 * early and fills the server-side cache in `powerbi.ts`, so by the time anyone
 * reaches /dashboards the URLs are already there and the tiles start loading
 * immediately.
 *
 * Called once per session from the shell, after the page is idle (see
 * PreviewWarmup). It resolves as the signed-in user like every other Power BI
 * call in this app, and returns only embed URLs — never a token, which stays
 * server-side and reaches the browser solely as the embed's own credential on
 * a report the user can already open (CLAUDE.md §5 Tab 2).
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session.isAuthenticated || !session.powerBiToken) {
    return NextResponse.json({ previews: [] }, { status: 401 });
  }

  const config = await getTenantConfig();
  const dashboards = getDashboards(config);
  const token = session.powerBiToken;

  const resolved = await Promise.all(
    dashboards.map(async (dashboard) => ({
      id: dashboard.id,
      embedUrl: await getPreviewEmbedUrl(
        dashboard.workspaceId,
        dashboard.id,
        token,
      ),
    })),
  );

  return NextResponse.json(
    { previews: resolved.filter((entry) => entry.embedUrl) },
    {
      // Per-user and short-lived: this is a warm-up, not a source of truth.
      headers: { "Cache-Control": "private, max-age=300" },
    },
  );
}
