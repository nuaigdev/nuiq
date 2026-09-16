import "server-only";



/**
 * Power BI, embedded with the signed-in user's own identity ("user owns data").
 *
 * Every call below carries the user's delegated token, so Power BI applies that
 * person's own permissions and row-level security. NuIQ never asserts an
 * identity on someone's behalf and holds no service principal that could read
 * more than the user can. A user without Power BI access simply gets a 401/403
 * from Power BI, which is exactly the intended behaviour.
 *
 * Server-side only: the delegated token must never reach the browser as
 * anything other than the embed token for a report the user can already open.
 */

const POWERBI_API = "https://api.powerbi.com/v1.0/myorg";

export type ReportAccess =
  | { status: "ok"; embedUrl: string }
  /** Cannot open the report at all. */
  | { status: "forbidden" }
  /**
   * Can open the report but cannot read its dataset. Power BI renders the
   * report chrome and leaves every visual empty, which looks like a broken
   * dashboard rather than a permission problem — so it is worth detecting
   * separately and saying so plainly.
   */
  | { status: "no-data-access" }
  | { status: "not-found" }
  | { status: "error"; detail: string };

/**
 * Look up a report's embed URL as the signed-in user.
 *
 * The workspace is per-report, so a client's dashboards can live in several
 * different Fabric/Power BI workspaces.
 */
export async function getReportEmbedUrl(
  workspaceId: string,
  reportId: string,
  powerBiToken: string,
): Promise<ReportAccess> {
  let response: Response;
  try {
    response = await fetch(
      `${POWERBI_API}/groups/${workspaceId}/reports/${reportId}`,
      {
        headers: { Authorization: `Bearer ${powerBiToken}` },
        cache: "no-store",
      },
    );
  } catch (error) {
    return { status: "error", detail: (error as Error).message };
  }

  if (response.status === 401 || response.status === 403) {
    return { status: "forbidden" };
  }
  if (response.status === 404) {
    return { status: "not-found" };
  }
  if (!response.ok) {
    return {
      status: "error",
      detail: `Power BI returned ${response.status}.`,
    };
  }

  const body = (await response.json()) as {
    embedUrl?: string;
    datasetId?: string;
  };
  if (!body.embedUrl) {
    return { status: "error", detail: "Power BI returned no embed URL." };
  }

  // Reading the report does not imply reading the semantic model behind it: a
  // report can be shared without dataset access. Probe the dataset as the user
  // so an empty dashboard is caught here rather than being rendered blank.
  if (body.datasetId) {
    const dataset = await canReadDataset(
      workspaceId,
      body.datasetId,
      powerBiToken,
    );
    if (dataset === "forbidden") {
      return { status: "no-data-access" };
    }
  }

  return { status: "ok", embedUrl: body.embedUrl };
}

/**
 * Whether the signed-in user can read a dataset.
 *
 * "unknown" on anything other than a clear allow/deny: a probe that cannot
 * reach Power BI must not be treated as a denial, or a transient blip would
 * tell a user they have lost access they still have.
 */
async function canReadDataset(
  workspaceId: string,
  datasetId: string,
  powerBiToken: string,
): Promise<"ok" | "forbidden" | "unknown"> {
  try {
    const response = await fetch(
      `${POWERBI_API}/groups/${workspaceId}/datasets/${datasetId}`,
      {
        headers: { Authorization: `Bearer ${powerBiToken}` },
        cache: "no-store",
      },
    );

    if (response.status === 401 || response.status === 403) return "forbidden";
    return response.ok ? "ok" : "unknown";
  } catch {
    return "unknown";
  }
}
