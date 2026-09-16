import { readClientAsset } from "@/lib/config-store/assets";
import { findDashboard } from "@/lib/dashboard-store";
import { getSession } from "@/lib/session";
import { getClientId, getTenantConfig } from "@/lib/tenant-config";

/**
 * The preview image on a dashboard tile.
 *
 * Stored per client in the private blob store (see config-store/assets.ts) and
 * streamed through here rather than served from a public URL: the image shows a
 * client's own figures, so it is behind the same login gate as everything else.
 *
 * The report id arrives in the URL, so it is matched against the client's
 * configured dashboards before it is used to build an asset path — the same
 * rule the embed routes follow (CLAUDE.md §5 Tab 2). Nothing else can be
 * fetched through this route.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const session = await getSession();
  if (!session.isAuthenticated) {
    return new Response("Not signed in.", { status: 401 });
  }

  const { reportId } = await params;
  const config = await getTenantConfig();
  if (!findDashboard(config, reportId)) {
    return new Response("Unknown dashboard.", { status: 404 });
  }

  const asset = await readClientAsset(
    getClientId(),
    `dashboard-thumbnails/${reportId}.png`,
  );
  if (!asset) {
    return new Response("No preview image.", { status: 404 });
  }

  return new Response(asset.stream, {
    headers: {
      "Content-Type": asset.contentType,
      // Per-user and immutable in practice: replacing a thumbnail replaces the
      // blob, and an hour of staleness on a tile picture costs nothing.
      "Cache-Control": "private, max-age=3600",
    },
  });
}
