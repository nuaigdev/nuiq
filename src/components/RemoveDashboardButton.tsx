"use client";

import { useActionState } from "react";

import {
  removeDashboardAction,
  type ActionState,
} from "@/app/dashboards/actions";

/**
 * Removes one dashboard. Surfaces the action's own error — notably the
 * conflict raised when another admin changed the configuration first, which the
 * operator needs to see rather than have swallowed.
 */
export function RemoveDashboardButton({
  id,
  name,
  disabled,
}: {
  id: string;
  name: string;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    removeDashboardAction,
    {},
  );

  return (
    <div className="shrink-0 text-right">
      <form action={formAction}>
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          disabled={disabled || pending}
          aria-label={`Remove ${name}`}
          className="rounded-lg border border-hairline-strong px-3 py-1.5 text-sm text-ink-muted transition-colors hover:border-caution-border hover:text-caution disabled:opacity-40"
        >
          {pending ? "Removing…" : "Remove"}
        </button>
      </form>
      {state.error ? (
        <p role="alert" className="mt-1.5 max-w-xs text-xs text-caution">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
