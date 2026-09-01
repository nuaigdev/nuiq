"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  addDashboard,
  removeDashboard,
  restoreDashboard,
} from "@/lib/dashboard-store";
import { getSession } from "@/lib/session";
import { getTenantConfig } from "@/lib/tenant-config";

/**
 * Admin actions for Tab 2's dashboard list.
 *
 * TODO(rbac): these currently require only a signed-in user. Managing which
 * dashboards a whole organization sees is an administrator's job, and this must
 * be gated on an admin role resolved from Entra group membership before it goes
 * anywhere near production (CLAUDE.md §6). The check belongs here, server-side —
 * hiding the Manage screen in the UI is not access control.
 */

const GUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const formSchema = z.object({
  name: z.string().trim().min(1, "Give the dashboard a name."),
  workspaceId: z
    .string()
    .trim()
    .regex(GUID, "Workspace ID must be a GUID."),
  id: z.string().trim().regex(GUID, "Report ID must be a GUID."),
  pageName: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  thumbnailUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine(
      (value) => value === undefined || z.string().url().safeParse(value).success,
      "Preview image must be a URL.",
    ),
});

export type ActionState = { error?: string; success?: string };

async function requireAdmin(): Promise<string | undefined> {
  const session = await getSession();
  if (!session.isAuthenticated) {
    return "Sign in to manage dashboards.";
  }
  return undefined;
}

export async function addDashboardAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const parsed = formSchema.safeParse({
    name: formData.get("name"),
    workspaceId: formData.get("workspaceId"),
    id: formData.get("id"),
    pageName: formData.get("pageName"),
    thumbnailUrl: formData.get("thumbnailUrl"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((issue) => issue.message).join(" ") };
  }

  await addDashboard(getTenantConfig(), parsed.data);
  revalidatePath("/dashboards", "layout");
  return { success: `Added “${parsed.data.name}”.` };
}

export async function removeDashboardAction(formData: FormData): Promise<void> {
  if (await requireAdmin()) return;

  const reportId = String(formData.get("id") ?? "");
  if (!reportId) return;

  await removeDashboard(getTenantConfig(), reportId);
  revalidatePath("/dashboards", "layout");
}

export async function restoreDashboardAction(formData: FormData): Promise<void> {
  if (await requireAdmin()) return;

  const reportId = String(formData.get("id") ?? "");
  if (!reportId) return;

  await restoreDashboard(getTenantConfig(), reportId);
  revalidatePath("/dashboards", "layout");
}
