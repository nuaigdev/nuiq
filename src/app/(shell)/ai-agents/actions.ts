"use server";

import { findPlatformAgent } from "@/lib/ai-agent-store";
import { askFoundryAgent } from "@/lib/foundry";
import { getSession } from "@/lib/session";
import { getTenantConfig } from "@/lib/tenant-config";

export type AskState = {
  answer?: string;
  error?: string;
};

/**
 * Ask one question of a chat-panel agent (CLAUDE.md §5 Tab 4).
 *
 * The slug is matched against this client's configuration before anything
 * leaves the server, so a crafted URL cannot address an arbitrary endpoint.
 *
 * The signed-in check is a real gate, not decoration: unlike Tab 2 and Tab 3,
 * the call downstream runs as the application rather than as the user (see the
 * identity note in `lib/foundry.ts`), so being signed in is the *only* thing
 * standing between a request and the agent.
 */
export async function askAiAgentAction(
  slug: string,
  question: string,
  history: { role: "user" | "agent"; text: string }[] = [],
): Promise<AskState> {
  const session = await getSession();
  if (!session.isAuthenticated) {
    return { error: "Sign in to ask a question." };
  }

  const trimmed = question.trim();
  if (!trimmed) return { error: "Ask a question first." };

  const config = await getTenantConfig();
  const agent = findPlatformAgent(config, slug);
  if (!agent) return { error: "That agent is not configured." };

  if (agent.type !== "foundry") {
    return {
      error: `“${agent.name}” is not a Foundry agent, so it cannot be asked this way.`,
    };
  }

  const result = await askFoundryAgent(config, agent, trimmed, history);

  switch (result.status) {
    case "ok":
      return { answer: result.text };
    case "forbidden":
      return {
        error:
          "Foundry refused this deployment's identity. Its app registration " +
          "needs a Foundry role — Foundry User is enough to run an agent — " +
          "assigned on the Foundry project under Access control (IAM). This is " +
          "a deployment-level grant, not something your own account controls.",
      };
    case "not-found":
      return {
        error:
          "That agent could not be found in the Foundry project. Check the " +
          "project endpoint and the agent name in this client's configuration, " +
          "and that the agent still exists.",
      };
    case "timeout":
      return {
        error:
          "The agent did not answer in time. A question that sets off a lot of " +
          "tool work can take longer than the portal will wait — try a narrower " +
          "question, or ask about one thing at a time.",
      };
    case "tool-access":
      return {
        error:
          "The agent is running, but one of the tools it is built on refused " +
          `the request (${result.tool}). This is not a problem with your ` +
          "access or with the portal's: the identity that tool's connection " +
          "uses does not have permission on what it reaches. Whoever owns the " +
          "agent in Foundry needs to fix that connection, or remove the tool.",
      };
    case "incomplete":
      return {
        error:
          "The agent stopped before it finished answering " +
          `(${result.detail}). This usually means the answer was cut short or ` +
          "filtered — try rephrasing the question.",
      };
    default:
      return { error: result.detail };
  }
}
