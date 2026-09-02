import Link from "next/link";

import { getDataAgents } from "@/lib/data-agent-store";
import { getTenantConfig } from "@/lib/tenant-config";

export const metadata = { title: "Data Agents" };

/** Stable facet pattern per agent, so a tile always looks the same. */
function hashOf(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function AgentFacet({ seed }: { seed: string }) {
  const hash = hashOf(seed);
  const a = 22 + (hash % 26);
  const b = 58 + ((hash >> 4) % 22);
  const lift = 14 + ((hash >> 8) % 14);

  return (
    <svg viewBox="0 0 160 60" preserveAspectRatio="none" aria-hidden className="h-full w-full">
      <rect width="160" height="60" className="fill-peak-50" />
      <polygon points={`0,60 ${a},${lift} ${a + 26},60`} className="fill-peak-300/45" />
      <polygon points={`${a},${lift} ${b},${lift + 12} ${b},60 ${a + 26},60`} className="fill-peak-600/30" />
      <polygon points={`${b},${lift + 12} 160,${lift - 3} 160,60 ${b},60`} className="fill-peak-800/20" />
    </svg>
  );
}

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
            Data Agents
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
              <Link
                href={`/data-agents/${agent.id}`}
                className="card card-interactive group block overflow-hidden rounded-xl"
              >
                <div className="h-[76px] w-full border-b border-hairline">
                  <AgentFacet seed={agent.id} />
                </div>
                <div className="p-5">
                  <h2 className="text-sm font-semibold text-ink group-hover:text-peak-700">
                    {agent.name}
                  </h2>
                  {agent.description ? (
                    <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-ink-muted">
                      {agent.description}
                    </p>
                  ) : null}
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-peak-600">
                    Ask
                    <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                      &rarr;
                    </span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
