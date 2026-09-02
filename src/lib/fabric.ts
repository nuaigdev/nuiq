import "server-only";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import type { FabricDataAgent, TenantConfig } from "./tenant-config";

/**
 * Fabric data agents (CLAUDE.md §5 Tab 3).
 *
 * A published data agent is consumed over the Model Context Protocol, not a
 * plain REST call: the endpoint requires an `initialize` handshake, a
 * `tools/list` to discover the single tool the agent exposes, then a
 * `tools/call` to ask the question. A generic HTTP request that skips the
 * handshake is rejected.
 *
 * Every call carries the *signed-in user's own* delegated token, so the agent
 * answers against that person's warehouse permissions. NuIQ holds no service
 * principal for Fabric — a shared identity here would quietly defeat the
 * scoping that Tab 2 enforces.
 */

/**
 * Fabric's token audience.
 *
 * Note the asymmetry, which costs people an afternoon: the *audience* is
 * api.fabric.microsoft.com, but the *permissions* are granted under "Power BI
 * Service" in the app registration. There is no "Fabric API" entry in the
 * permissions picker — Fabric and Power BI are the same resource application,
 * which is also why one set of consented scopes covers both audiences.
 */
const FABRIC_SCOPE = "https://api.fabric.microsoft.com/.default";

/** MCP endpoint for a published data agent. Unpublished agents error here. */
function mcpUrl(agent: FabricDataAgent): URL {
  return new URL(
    `https://api.fabric.microsoft.com/v1/mcp/workspaces/${agent.workspaceId}` +
      `/dataagents/${agent.id}/agent`,
  );
}

/**
 * Trade the user's refresh token for a token whose audience is Fabric.
 *
 * An access token is issued for one resource. The Power BI token the session
 * already holds cannot call Fabric, so a second token is needed for the same
 * user. This runs per question rather than being cached on the session: it
 * costs one extra round trip, and it avoids holding a second long-lived
 * credential in the cookie.
 */
async function getFabricToken(
  config: TenantConfig,
  refreshToken: string,
): Promise<string> {
  const response = await fetch(
    `https://login.microsoftonline.com/${config.entraTenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: config.entraClientId,
        client_secret: process.env.ENTRA_CLIENT_SECRET ?? "",
        refresh_token: refreshToken,
        scope: FABRIC_SCOPE,
      }),
      cache: "no-store",
    },
  );

  const body = (await response.json()) as {
    access_token?: string;
    error_description?: string;
  };

  if (!response.ok || !body.access_token) {
    throw new Error(
      "Could not get a Fabric token for your account. Fabric scopes are granted " +
        'under "Power BI Service" in the app registration — there is no separate ' +
        '"Fabric API" entry in the permissions picker — so check that ' +
        "Item.Read.All and Item.Execute.All are added there and admin-consented. " +
        (body.error_description?.split("\n")[0] ?? ""),
    );
  }

  return body.access_token;
}

/** How many prior turns to carry. Enough for a follow-up, bounded so the
 *  prompt cannot grow without limit over a long conversation. */
const CONTEXT_TURNS = 6;

function withContext(
  question: string,
  history: { role: "user" | "agent"; text: string }[],
): string {
  const recent = history.slice(-CONTEXT_TURNS);
  if (recent.length === 0) return question;

  const transcript = recent
    .map((turn) => `${turn.role === "user" ? "Q" : "A"}: ${turn.text}`)
    .join("\n");

  return (
    `Earlier in this conversation:\n${transcript}\n\n` +
    `Using that context where it is relevant, answer: ${question}`
  );
}

export type AgentAnswer =
  | { status: "ok"; text: string }
  | { status: "forbidden" }
  | { status: "not-published" }
  | { status: "error"; detail: string };

/**
 * Ask one question of a published data agent.
 *
 * The MCP endpoint has no conversation memory of its own — Microsoft is
 * explicit that callers must "orchestrate multi-turn interactions by
 * maintaining conversation state and supplying relevant context across
 * requests". So a short transcript of recent turns is prepended to the
 * question; without it, "and what about last month?" would arrive with nothing
 * to refer back to.
 *
 * That state lives in the browser for the length of the visit and is never
 * persisted here — these questions can name residents, communities, and
 * incidents (CLAUDE.md §2).
 */
export async function askDataAgent(
  config: TenantConfig,
  agent: FabricDataAgent,
  refreshToken: string,
  question: string,
  history: { role: "user" | "agent"; text: string }[] = [],
): Promise<AgentAnswer> {
  let token: string;
  try {
    token = await getFabricToken(config, refreshToken);
  } catch (error) {
    return { status: "error", detail: (error as Error).message };
  }

  const transport = new StreamableHTTPClientTransport(mcpUrl(agent), {
    requestInit: { headers: { Authorization: `Bearer ${token}` } },
  });
  const client = new Client({ name: "nuiq", version: "1.0.0" });

  try {
    await client.connect(transport);

    // A data agent exposes exactly one tool. Discover its name and the name of
    // its question argument from the schema rather than hardcoding either —
    // the docs note both can change.
    const { tools } = await client.listTools();
    const tool = tools[0];
    if (!tool) {
      return {
        status: "error",
        detail: "The data agent exposed no tools. Confirm it is published.",
      };
    }

    const properties = (tool.inputSchema?.properties ?? {}) as Record<
      string,
      unknown
    >;
    const questionArg = Object.keys(properties)[0] ?? "question";

    const result = await client.callTool({
      name: tool.name,
      arguments: { [questionArg]: withContext(question, history) },
    });

    const content = (result.content ?? []) as { type: string; text?: string }[];
    const text = content
      .filter((block) => block.type === "text" && block.text)
      .map((block) => block.text)
      .join("\n")
      .trim();

    return text
      ? { status: "ok", text }
      : { status: "error", detail: "The data agent returned an empty answer." };
  } catch (error) {
    const message = (error as Error).message ?? "";

    if (/401|403|unauthor|forbidden/i.test(message)) {
      return { status: "forbidden" };
    }
    // A manually built URL is valid but dead until the agent is published.
    if (/404|not found/i.test(message)) {
      return { status: "not-published" };
    }
    return { status: "error", detail: message || "The data agent call failed." };
  } finally {
    await client.close().catch(() => {});
  }
}
