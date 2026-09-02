import Link from "next/link";
import { notFound } from "next/navigation";

import { DataAgentChat } from "@/components/DataAgentChat";
import { findDataAgent, getDataAgents } from "@/lib/data-agent-store";
import { getTenantConfig } from "@/lib/tenant-config";

/**
 * Rendered per request, never prerendered — agent ids come from the client's
 * configuration document, not from the build.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const agent = findDataAgent(await getTenantConfig(), agentId);
  return { title: agent?.name ?? "Data Agents" };
}

/**
 * Domain-correct openers, so a first-time user is not staring at an empty box
 * wondering what this thing knows. Deliberately generic across clients — they
 * name the metrics the industry uses, never a specific community.
 */
const SUGGESTIONS = [
  "What is current occupancy across our communities?",
  "How have falls trended over the last three months?",
  "Which communities had the most medication errors last quarter?",
];

export default async function DataAgentPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const config = await getTenantConfig();

  // Only agents this client has configured may be opened.
  const agent = findDataAgent(config, agentId);
  if (!agent) notFound();

  const agents = getDataAgents(config);

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <Link
            href="/data-agents"
            className="text-xs font-medium uppercase tracking-wider text-ink-muted transition-colors hover:text-peak-600"
          >
            &larr; All data agents
          </Link>
          <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight text-ink">
            {agent.name}
          </h1>
          {agent.description ? (
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {agent.description}
            </p>
          ) : null}
        </div>
      </div>

      {agents.length > 1 ? (
        <nav aria-label="Data agents" className="mt-5 border-b border-hairline">
          <ul className="-mb-px flex flex-wrap items-center gap-x-1">
            {agents.map((item) => {
              const isActive = item.id === agent.id;
              return (
                <li key={item.id}>
                  <Link
                    href={`/data-agents/${item.id}`}
                    aria-current={isActive ? "page" : undefined}
                    className={[
                      "-mb-px block border-b-2 px-3.5 py-2.5 text-sm transition-colors",
                      isActive
                        ? "border-peak-600 font-medium text-ink"
                        : "border-transparent text-ink-muted hover:border-hairline hover:text-ink",
                    ].join(" ")}
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}

      <div className="mt-5">
        <DataAgentChat
          agentId={agent.id}
          agentName={agent.name}
          suggestions={SUGGESTIONS}
        />
      </div>

      <p className="mt-4 max-w-3xl text-xs leading-relaxed text-ink-subtle">
        Answers come from your Fabric warehouse and are scoped to your own
        access. This conversation is not saved — it lives only in this browser
        tab for as long as you stay on the page.
      </p>
    </div>
  );
}
