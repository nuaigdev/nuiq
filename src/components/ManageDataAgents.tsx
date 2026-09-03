"use client";

import { useActionState } from "react";

import {
  addDataAgentAction,
  removeDataAgentAction,
  type ManageState,
} from "@/app/data-agents/actions";

const FIELD =
  "w-full rounded border border-hairline bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-peak-600 focus:outline-none";
const LABEL = "block text-xs font-medium uppercase tracking-wider text-ink-muted";

export function RemoveDataAgentButton({
  id,
  name,
  disabled,
}: {
  id: string;
  name: string;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState<ManageState, FormData>(
    removeDataAgentAction,
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

export function AddDataAgentForm() {
  const [state, formAction, pending] = useActionState<ManageState, FormData>(
    addDataAgentAction,
    {},
  );

  return (
    <form action={formAction} className="card rounded-xl p-6">
      <h2 className="text-base font-medium text-ink">Add a data agent</h2>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-muted">
        Publish the agent in Fabric first — an unpublished agent has no endpoint
        and cannot answer. Then take the workspace and agent IDs from its URL, or
        from the agent&rsquo;s <strong className="font-medium text-ink">Settings &rarr; Model Context Protocol</strong> tab.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor="agent-name">
            Name
          </label>
          <input
            id="agent-name"
            name="name"
            required
            placeholder="Census &amp; Occupancy Agent"
            className={`${FIELD} mt-1.5`}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="agent-workspace">
            Workspace ID
          </label>
          <input
            id="agent-workspace"
            name="workspaceId"
            required
            placeholder="00000000-0000-0000-0000-000000000000"
            className={`${FIELD} mt-1.5 font-mono text-xs`}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="agent-id">
            Data agent ID
          </label>
          <input
            id="agent-id"
            name="id"
            required
            placeholder="00000000-0000-0000-0000-000000000000"
            className={`${FIELD} mt-1.5 font-mono text-xs`}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor="agent-description">
            Description <span className="normal-case">(optional)</span>
          </label>
          <input
            id="agent-description"
            name="description"
            placeholder="What this agent knows — shown on its tile"
            className={`${FIELD} mt-1.5`}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor="agent-suggestions">
            Suggested questions{" "}
            <span className="normal-case">(optional, one per line)</span>
          </label>
          <textarea
            id="agent-suggestions"
            name="suggestions"
            rows={4}
            placeholder={
              "Which referral sources generated the most inquiries this month?\nHow many inquiries converted to move-ins last quarter?"
            }
            className={`${FIELD} mt-1.5 resize-y`}
          />
          <p className="mt-1.5 text-xs leading-relaxed text-ink-subtle">
            Up to four. These are the openers offered before the first question,
            so write them for what <em>this</em> agent is published over — the
            right questions for a marketing schema are not the right questions
            for a clinical one. Leave blank to fall back to generic openers.
          </p>
        </div>
      </div>

      {state.error ? (
        <p role="alert" className="mt-4 text-sm text-caution">
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
        className="mt-5 rounded-lg bg-peak-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-peak-700 disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add data agent"}
      </button>
    </form>
  );
}
