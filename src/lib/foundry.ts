import "server-only";

import type { PlatformAgent, TenantConfig } from "./tenant-config";

/**
 * Azure AI Foundry agents (CLAUDE.md §5 Tab 4).
 *
 * A prompt agent published in a Foundry project is reached through the
 * agent-scoped Responses API on the project endpoint:
 *
 *   POST {projectEndpoint}/agents/{agentName}/endpoint/protocols/openai/responses
 *
 * which is OpenAI-Responses-compatible. `endpoint` in config is the project
 * endpoint (`https://<resource>.services.ai.azure.com/api/projects/<project>`)
 * and `agentId` is the agent's *name* — Foundry's v1 API addresses agents by
 * name and version, not by an `asst_` id.
 *
 * IDENTITY — read before changing anything here.
 *
 * Unlike Power BI (§5 Tab 2) and Fabric data agents (§5 Tab 3), this call is
 * made as the *application*, not as the signed-in user. That is not a shortcut
 * taken to save work: Foundry secures its data plane with Azure RBAC and
 * publishes no delegated scope for it, so there is no on-behalf-of flow to
 * wire — a user's token cannot be exchanged for one this endpoint accepts. The
 * deployment's own app registration is granted a Foundry role on the project
 * and calls with client credentials.
 *
 * The consequence has to be stated rather than discovered: an answer from this
 * agent is NOT scoped to the asking user's warehouse permissions or facility
 * scope. Do not point a Foundry agent at PHI or at community-level clinical
 * detail until either Foundry supports delegated access or the agent's own data
 * sources enforce the scoping (§2, §6). This is the open compliance question in
 * §5 Tab 4, in concrete form.
 */

/**
 * Token audiences to try, in order.
 *
 * Microsoft's own REST quickstart authenticates the project endpoint with
 * `https://ai.azure.com/.default`, while older Azure AI resources answer to
 * `https://cognitiveservices.azure.com/.default`. Which one a given account
 * accepts depends on how it was provisioned, and the failure is an opaque 401
 * either way — so try the documented one first and fall back rather than
 * making an operator guess.
 */
const TOKEN_SCOPES = [
  "https://ai.azure.com/.default",
  "https://cognitiveservices.azure.com/.default",
];

/**
 * How long to wait for an answer.
 *
 * A Foundry agent with tools can take well over the platform default: it plans,
 * calls its tools, and summarises. Leave headroom below the route's
 * `maxDuration` so our own timeout fires first and produces a message a user
 * can act on, rather than a bare 504.
 */
const RESPONSE_TIMEOUT_MS = 240_000;

/** How many prior turns to carry. Enough for a follow-up, bounded so the
 *  prompt cannot grow without limit over a long conversation. */
const CONTEXT_TURNS = 6;

function responsesUrl(agent: PlatformAgent): string {
  // Trailing slashes in a pasted endpoint would produce a double slash, which
  // Foundry answers with a 404 that looks like a missing agent.
  const base = (agent.endpoint ?? "").replace(/\/+$/, "");
  return (
    `${base}/agents/${encodeURIComponent(agent.agentId ?? "")}` +
    `/endpoint/protocols/openai/responses?api-version=v1`
  );
}

type TokenResult =
  | { ok: true; token: string; scope: string }
  | { ok: false; detail: string };

async function getFoundryToken(config: TenantConfig): Promise<TokenResult> {
  const secret = process.env.ENTRA_CLIENT_SECRET;
  if (!secret) {
    return {
      ok: false,
      detail:
        "This deployment has no Entra client secret, so it cannot authenticate " +
        "to Foundry. Set ENTRA_CLIENT_SECRET for this environment.",
    };
  }

  let lastError = "";

  for (const scope of TOKEN_SCOPES) {
    try {
      const response = await fetch(
        `https://login.microsoftonline.com/${config.entraTenantId}/oauth2/v2.0/token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: config.entraClientId,
            client_secret: secret,
            scope,
          }),
          cache: "no-store",
        },
      );

      const body = (await response.json()) as {
        access_token?: string;
        error_description?: string;
      };

      if (response.ok && body.access_token) {
        return { ok: true, token: body.access_token, scope };
      }

      lastError = body.error_description?.split("\n")[0] ?? `HTTP ${response.status}`;
    } catch (error) {
      lastError = (error as Error).message;
    }
  }

  return {
    ok: false,
    detail:
      "Could not get a token for Foundry. This deployment's app registration " +
      `must be able to request ${TOKEN_SCOPES[0]}. ${lastError}`,
  };
}

function withContext(
  question: string,
  history: { role: "user" | "agent"; text: string }[],
): { role: "user" | "assistant"; content: string }[] {
  /*
   * Multi-turn context is sent as the input array rather than by creating a
   * Foundry conversation.
   *
   * Foundry conversations are stored in the project, which would mean this
   * portal persisting free text that can name residents, communities and
   * incidents on a platform whose data handling has not been reviewed for this
   * client (§5 Tab 4). Keeping the transcript in the browser and replaying a
   * bounded window of it gives the same follow-up behaviour with nothing left
   * behind. Do not switch to server-side conversations without deciding that
   * question first.
   */
  const recent = history.slice(-CONTEXT_TURNS).map((turn) => ({
    role: turn.role === "user" ? ("user" as const) : ("assistant" as const),
    content: turn.text,
  }));

  return [...recent, { role: "user" as const, content: question }];
}

/** Pull the assistant's text out of an OpenAI Responses payload. */
function readOutputText(body: unknown): string {
  const payload = body as {
    output_text?: string | string[];
    output?: {
      type?: string;
      content?: { type?: string; text?: string }[];
    }[];
  };

  const fromOutput = (payload.output ?? [])
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content ?? [])
    .filter((block) => block.type === "output_text" && block.text)
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (fromOutput) return fromOutput;

  // `output_text` is a convenience the SDKs synthesise; some responses carry it.
  const convenience = payload.output_text;
  if (Array.isArray(convenience)) return convenience.join("\n").trim();
  return (convenience ?? "").trim();
}

export type FoundryAnswer =
  | { status: "ok"; text: string }
  /** Authenticated, but this app has no role on the Foundry project. */
  | { status: "forbidden" }
  /** The project or agent name does not resolve — usually a config mistake. */
  | { status: "not-found" }
  /** The agent did not answer in time. */
  | { status: "timeout" }
  /** The agent ran but produced nothing usable — filtered, or cut short. */
  | { status: "incomplete"; detail: string }
  /**
   * The agent itself is reachable, but one of the tools it is built on refused
   * the call. Worth its own state: nothing is wrong with this portal's access
   * to Foundry, and the fix is in the agent's own tool configuration.
   */
  | { status: "tool-access"; tool: string }
  | { status: "error"; detail: string };

/**
 * Recognise a downstream tool refusal inside an otherwise successful call.
 *
 * Foundry answers 200 and reports the failure in the body, so this cannot be
 * read off the status code. The message names the MCP server it could not
 * enumerate; that URL is the only part worth showing, and the rest is a wall of
 * generic troubleshooting prose.
 */
function readToolDenial(detail: string): string | undefined {
  if (!/403|forbidden|access denied/i.test(detail)) return undefined;
  const server = detail.match(/MCP server at (\S+?)(?:\s|$)/i)?.[1];
  if (!server) return undefined;
  // ".../integrations/m365" and ".../dataagents/<id>/agent" both end in the
  // part that identifies the tool; the host is the same for all of them.
  return server.replace(/^https?:\/\/[^/]+\//, "").replace(/:\d+/, "");
}

/**
 * Ask one question of a Foundry agent.
 *
 * The agent must already have been matched against this client's configuration
 * by the caller — nothing here validates that the endpoint belongs to this
 * client, because config is the only place it can come from.
 */
export async function askFoundryAgent(
  config: TenantConfig,
  agent: PlatformAgent,
  question: string,
  history: { role: "user" | "agent"; text: string }[] = [],
): Promise<FoundryAnswer> {
  if (!agent.endpoint || !agent.agentId) {
    return {
      status: "error",
      detail:
        `“${agent.name}” is missing its Foundry project endpoint or agent name ` +
        `in this client's configuration, so there is nothing to ask.`,
    };
  }

  const auth = await getFoundryToken(config);
  if (!auth.ok) return { status: "error", detail: auth.detail };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RESPONSE_TIMEOUT_MS);

  try {
    const response = await fetch(responsesUrl(agent), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({ input: withContext(question, history) }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (response.status === 401 || response.status === 403) {
      return { status: "forbidden" };
    }
    if (response.status === 404) {
      return { status: "not-found" };
    }

    const raw = await response.text();

    if (!response.ok) {
      let detail = raw.slice(0, 500);
      try {
        const parsed = JSON.parse(raw) as { error?: { message?: string } };
        detail = parsed.error?.message ?? detail;
      } catch {
        // Not JSON — the raw body is the best detail available.
      }
      const tool = readToolDenial(detail);
      if (tool) return { status: "tool-access", tool };
      return { status: "error", detail: detail || `Foundry returned ${response.status}.` };
    }

    const body = JSON.parse(raw) as { status?: string; incomplete_details?: { reason?: string } };
    const text = readOutputText(body);

    if (text) return { status: "ok", text };

    // A tool refusal comes back as a completed response whose only content is
    // the refusal, so check the raw body before deciding this is an empty answer.
    const denied = readToolDenial(raw);
    if (denied) return { status: "tool-access", tool: denied };

    if (body.status && body.status !== "completed") {
      return {
        status: "incomplete",
        detail: body.incomplete_details?.reason ?? body.status,
      };
    }

    return {
      status: "error",
      detail: "The agent returned an empty answer.",
    };
  } catch (error) {
    if ((error as Error).name === "AbortError") return { status: "timeout" };
    return {
      status: "error",
      detail: (error as Error).message || "The Foundry agent call failed.",
    };
  } finally {
    clearTimeout(timer);
  }
}
