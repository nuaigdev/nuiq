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
type FabricToken = { token: string; scopes: string[]; audience: string };

/**
 * Read the scope (`scp`) and audience (`aud`) claims out of an access token.
 *
 * Decode only — no verification, and the token itself is never returned or
 * logged. This exists so a scope failure can say which scopes the token
 * actually carries, which turns an opaque "required scopes" error into
 * something an admin can act on.
 */
function readTokenClaims(token: string): { scopes: string[]; audience: string } {
  try {
    const payload = token.split(".")[1];
    if (!payload) return { scopes: [], audience: "" };
    const decoded = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
        "utf8",
      ),
    ) as { scp?: string; aud?: string };
    return {
      scopes: decoded.scp ? decoded.scp.split(" ").filter(Boolean) : [],
      audience: decoded.aud ?? "",
    };
  } catch {
    return { scopes: [], audience: "" };
  }
}

async function getFabricToken(
  config: TenantConfig,
  refreshToken: string,
): Promise<FabricToken> {
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

  return { token: body.access_token, ...readTokenClaims(body.access_token) };
}

/**
 * How long to wait for an answer.
 *
 * The MCP SDK defaults to 60s, which a data agent routinely exceeds: it has to
 * plan the question, generate SQL, run it against the warehouse and summarise
 * the result. Vercel functions allow up to 300s, so leave headroom below that —
 * hitting our own timeout produces a clear message, whereas hitting the
 * platform's produces a bare 504.
 */
const TOOL_TIMEOUT_MS = 240_000;

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
  /**
   * Authenticated, but the token lacks the scopes the endpoint requires.
   * Carries what the token *did* have, so the gap is visible rather than
   * guessed at.
   */
  | { status: "missing-scope"; scopes: string[]; audience: string }
  /** Authenticated and scoped, but not permitted on this agent or its data. */
  | { status: "forbidden" }
  /** The agent did not answer in time. */
  | { status: "timeout" }
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
  let fabricToken: FabricToken;
  try {
    fabricToken = await getFabricToken(config, refreshToken);
  } catch (error) {
    return { status: "error", detail: (error as Error).message };
  }

  const transport = new StreamableHTTPClientTransport(mcpUrl(agent), {
    requestInit: {
      headers: { Authorization: `Bearer ${fabricToken.token}` },
    },
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

    const result = await client.callTool(
      {
        name: tool.name,
        arguments: { [questionArg]: withContext(question, history) },
      },
      undefined,
      {
        timeout: TOOL_TIMEOUT_MS,
        // If Fabric reports progress, treat that as liveness rather than
        // counting it against the clock.
        resetTimeoutOnProgress: true,
        maxTotalTimeout: TOOL_TIMEOUT_MS,
      },
    );

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

    // Fabric reports a scope problem as AuthorizationFailedException with
    // "does not have any of the required scopes". That is a consent gap in the
    // app registration, not a permission the user is missing — quite different
    // to act on, so keep it separate from "forbidden".
    // -32001 is the MCP timeout code. Worth its own state: nothing is wrong
    // with access or configuration, the question was simply too slow.
    if (/-32001|timed out|timeout/i.test(message)) {
      return { status: "timeout" };
    }
    if (/required scopes|AuthorizationFailed/i.test(message)) {
      return {
        status: "missing-scope",
        scopes: fabricToken.scopes,
        audience: fabricToken.audience,
      };
    }
    if (/401|403|unauthorized|forbidden/i.test(message)) {
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
