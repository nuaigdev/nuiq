"use server";

import { revalidatePath } from "next/cache";

import { checkAdmin } from "@/lib/admin";
import { ConfigConflictError } from "@/lib/config-store";
import {
  addDataAgent,
  dataAgentInputSchema,
  findDataAgent,
  removeDataAgent,
} from "@/lib/data-agent-store";
import { askDataAgent } from "@/lib/fabric";
import { getRefreshToken, getSession } from "@/lib/session";
import { getTenantConfig } from "@/lib/tenant-config";

export type AskState = {
  answer?: string;
  error?: string;
};

/**
 * Ask one question of a data agent.
 *
 * The agent id is matched against this client's configuration before anything
 * reaches Fabric, so a crafted id cannot address an arbitrary agent. The
 * question runs as the signed-in user, so the answer respects that person's own
 * warehouse permissions.
 */
export async function askDataAgentAction(
  agentId: string,
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
  const agent = findDataAgent(config, agentId);
  if (!agent) return { error: "That data agent is not configured." };

  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return {
      error:
        "Your session cannot be used to reach Fabric. Sign out and back in, then try again.",
    };
  }

  const result = await askDataAgent(
    config,
    agent,
    refreshToken,
    trimmed,
    history,
  );

  switch (result.status) {
    case "ok":
      return { answer: result.text };
    case "missing-scope": {
      // Name what the token actually carried. "Add the permission" is useless
      // advice to someone who already added it — seeing the scopes that came
      // back shows whether consent reached this token at all.
      const carried =
        result.scopes.length > 0
          ? result.scopes.join(", ")
          : "(none — the token carries no delegated scopes)";
      return {
        error:
          "Fabric refused the token for missing scopes. It needs " +
          "Item.Execute.All, granted under Power BI Service in the app " +
          `registration. Your token carried: ${carried}. Audience: ` +
          `${result.audience || "unknown"}. If Item.Execute.All is not in that ` +
          "list, the consent has not reached your session — re-consent with " +
          "AUTH_FORCE_CONSENT=true and sign in again.",
      };
    }
    case "timeout":
      return {
        error:
          "The agent did not answer in time. Questions that span many tables or " +
          "a wide date range can take longer than the portal will wait — try a " +
          "narrower question, or ask about one community or one month first.",
      };
    case "forbidden":
      return {
        error:
          "Your account does not have access to this data agent, or to the data behind it. Access is managed in Fabric — ask an administrator.",
      };
    case "not-published":
      return {
        error:
          "This data agent could not be reached. It must be published in Fabric before it can answer questions.",
      };
    default:
      return { error: result.detail };
  }
}

/* ------------------------------- admin ---------------------------------- */

export type ManageState = { error?: string; success?: string };

export async function addDataAgentAction(
  _prev: ManageState,
  formData: FormData,
): Promise<ManageState> {
  const admin = await checkAdmin();
  if (!admin.allowed) return { error: admin.reason };

  const parsed = dataAgentInputSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    workspaceId: formData.get("workspaceId"),
    description: formData.get("description"),
    suggestions: formData.get("suggestions"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((issue) => issue.message).join(" ") };
  }

  try {
    await addDataAgent(parsed.data);
  } catch (error) {
    if (error instanceof ConfigConflictError) return { error: error.message };
    throw error;
  }

  revalidatePath("/", "layout");
  return { success: `Added “${parsed.data.name}”.` };
}

export async function removeDataAgentAction(
  _prev: ManageState,
  formData: FormData,
): Promise<ManageState> {
  const admin = await checkAdmin();
  if (!admin.allowed) return { error: admin.reason };

  const agentId = String(formData.get("id") ?? "");
  if (!agentId) return { error: "No data agent specified." };

  try {
    await removeDataAgent(agentId);
  } catch (error) {
    if (error instanceof ConfigConflictError) return { error: error.message };
    throw error;
  }

  revalidatePath("/", "layout");
  return { success: "Data agent removed." };
}
