"use client";

import { useActionState } from "react";

import { addDashboardAction, type ActionState } from "@/app/dashboards/actions";

const FIELD =
  "w-full rounded border border-hairline bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/50 focus:border-peak-600 focus:outline-none";
const LABEL = "block text-xs font-medium uppercase tracking-wider text-ink-muted";

export function AddDashboardForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addDashboardAction,
    {},
  );

  return (
    <form
      action={formAction}
      className="rounded-lg border border-hairline bg-surface p-6"
    >
      <h2 className="text-base font-medium text-ink">Add a dashboard</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Paste the workspace and report IDs from the report&rsquo;s URL in Power
        BI. Dashboards may live in different workspaces.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Senior Living Journey Dashboard"
            className={`${FIELD} mt-1.5`}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="workspaceId">
            Workspace ID
          </label>
          <input
            id="workspaceId"
            name="workspaceId"
            required
            placeholder="00000000-0000-0000-0000-000000000000"
            className={`${FIELD} mt-1.5 font-mono text-xs`}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="id">
            Report ID
          </label>
          <input
            id="id"
            name="id"
            required
            placeholder="00000000-0000-0000-0000-000000000000"
            className={`${FIELD} mt-1.5 font-mono text-xs`}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor="pageName">
            Report page / section{" "}
            <span className="normal-case">(optional)</span>
          </label>
          <input
            id="pageName"
            name="pageName"
            placeholder="Leave blank to open the report's default page"
            className={`${FIELD} mt-1.5 font-mono text-xs`}
          />
        </div>
      </div>

      {state.error ? (
        <p role="alert" className="mt-4 text-sm text-amber-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="mt-4 text-sm text-peak-700">
          {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 rounded bg-peak-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-peak-700 disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add dashboard"}
      </button>
    </form>
  );
}
