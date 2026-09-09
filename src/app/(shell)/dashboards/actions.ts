"use server";

import { revalidatePath } from "next/cache";

import { checkAdmin } from "@/lib/admin";
import { ConfigConflictError } from "@/lib/config-store";
import {
  addDashboard,
  dashboardInputSchema,
  removeDashboard,
} from "@/lib/dashboard-store";

/**
 * Admin actions for Tab 2's dashboard list.
 *
 * Every one of these checks admin rights server-side before touching anything.
 * The Manage screen also hides its controls, but that is presentation — this is
 * the enforcement (CLAUDE.md §6).
 *
 * Writes are conditional on the etag the config was read at, so two admins
 * editing at once get a conflict they can act on rather than one silently
 * losing their change.
 */

export type ActionState = { error?: string; success?: string };

export async function addDashboardAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await checkAdmin();
  if (!admin.allowed) return { error: admin.reason };

  const parsed = dashboardInputSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    workspaceId: formData.get("workspaceId"),
    pageName: formData.get("pageName"),
    thumbnailUrl: formData.get("thumbnailUrl"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((issue) => issue.message).join(" ") };
  }

  try {
    await addDashboard(parsed.data);
  } catch (error) {
    if (error instanceof ConfigConflictError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath("/", "layout");
  return { success: `Added “${parsed.data.name}”.` };
}

export async function removeDashboardAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await checkAdmin();
  if (!admin.allowed) return { error: admin.reason };

  const reportId = String(formData.get("id") ?? "");
  if (!reportId) return { error: "No dashboard specified." };

  try {
    await removeDashboard(reportId);
  } catch (error) {
    if (error instanceof ConfigConflictError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath("/", "layout");
  return { success: "Dashboard removed." };
}
