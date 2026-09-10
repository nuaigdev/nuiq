import Link from "next/link";

import { AgentTile } from "@/components/AgentTile";
import { getDataAgents } from "@/lib/data-agent-store";
import { getTenantConfig } from "@/lib/tenant-config";

export const metadata = { title: "Conversational Data Agent" };

export default async function DataAgentsPage() {
  const config = await getTenantConfig();
  const agents = getDataAgents(config);

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-9">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-peak-600">
            Microsoft Fabric
          </p>
          <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-tight text-ink">
            Conversational Data Agent
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
            Ask questions of the warehouse in plain language and get an answer
            from your own data — no report to find, no filter to set. Each agent
            covers one subject area, because an agent that covers everything
            answers everything vaguely. Questions run as you, so an answer never
            reaches past your own access.
          </p>
        </div>
        <Link
          href="/data-agents/manage"
          className="shrink-0 rounded-lg border border-hairline-strong bg-surface px-3.5 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-peak-300 hover:text-ink"
        >
          Manage agents
        </Link>
      </div>

      {agents.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-hairline-strong bg-surface p-10 text-center">
          <p className="text-sm text-ink-muted">
            No data agents are configured yet. Publish one in Fabric, then add it
            here with its workspace and agent IDs.
          </p>
          <Link
            href="/data-agents/manage"
            className="mt-4 inline-block rounded-lg bg-peak-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-peak-700"
          >
            Add a data agent
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {agents.map((agent) => (
            <li key={agent.id}>
              <AgentTile
                href={`/data-agents/${agent.id}`}
                name={agent.name}
                description={agent.description}
                cta="Ask"
                seed={agent.id}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
