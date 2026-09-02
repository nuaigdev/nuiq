import Link from "next/link";

import {
  AddDataAgentForm,
  RemoveDataAgentButton,
} from "@/components/ManageDataAgents";
import { checkAdmin } from "@/lib/admin";
import { getDataAgents } from "@/lib/data-agent-store";
import { getTenantConfig } from "@/lib/tenant-config";

export const metadata = { title: "Manage data agents" };

export default async function ManageDataAgentsPage() {
  const config = await getTenantConfig();
  const agents = getDataAgents(config);
  const admin = await checkAdmin();

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-9">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-peak-600">
            Administration
          </p>
          <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-tight text-ink">
            Manage data agents
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
            Agents added here appear for everyone using this portal, and take
            effect immediately without a redeploy. What each person can actually
            ask is still governed by their own Fabric access.
          </p>
        </div>
        <Link
          href="/data-agents"
          className="shrink-0 rounded-lg border border-hairline-strong bg-surface px-3.5 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-peak-300 hover:text-ink"
        >
          Back to data agents
        </Link>
      </div>

      {!admin.allowed ? (
        <p className="mt-7 rounded-lg border border-caution-border bg-surface p-4 text-sm leading-relaxed text-ink-muted">
          {admin.reason}
        </p>
      ) : null}

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
          In this portal ({agents.length})
        </h2>
        <ul className="card mt-3 divide-y divide-hairline overflow-hidden rounded-xl">
          {agents.length === 0 ? (
            <li className="p-6 text-sm text-ink-muted">
              No data agents yet. Add one below.
            </li>
          ) : null}
          {agents.map((agent) => (
            <li
              key={agent.id}
              className="flex flex-wrap items-center justify-between gap-4 p-4"
            >
              <div className="min-w-0">
                <Link
                  href={`/data-agents/${agent.id}`}
                  className="text-sm font-medium text-ink hover:text-peak-600"
                >
                  {agent.name}
                </Link>
                {agent.description ? (
                  <p className="mt-1 max-w-xl text-sm text-ink-muted">
                    {agent.description}
                  </p>
                ) : null}
                <dl className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] text-ink-muted">
                  <div className="flex gap-1.5">
                    <dt className="text-ink-subtle">workspace</dt>
                    <dd>{agent.workspaceId}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="text-ink-subtle">agent</dt>
                    <dd>{agent.id}</dd>
                  </div>
                </dl>
              </div>

              <RemoveDataAgentButton
                id={agent.id}
                name={agent.name}
                disabled={!admin.allowed}
              />
            </li>
          ))}
        </ul>
      </section>

      {admin.allowed ? (
        <section className="mt-8">
          <AddDataAgentForm />
        </section>
      ) : null}
    </div>
  );
}
