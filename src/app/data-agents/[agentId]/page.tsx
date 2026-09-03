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

/**
 * Data agent questions are slow by nature — plan, generate SQL, query,
 * summarise. Without this the platform's default would cut the request off
 * before the agent had a chance to answer.
 */
export const maxDuration = 300;

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
  "What is current occupancy by community?",
  "Which referral sources generated the most inquiries this month?",
  "How have falls trended over the last three months?",
  "Which communities have the lowest staffing ratios?",
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
        <Link
          href="/data-agents"
          className="text-xs font-medium uppercase tracking-wider text-ink-muted transition-colors hover:text-peak-600"
        >
          &larr; All data agents
        </Link>
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

      <div className="mt-4">
        <DataAgentChat
          agentId={agent.id}
          agentName={agent.name}
          description={agent.description}
          suggestions={SUGGESTIONS}
        />
      </div>

    </div>
  );
}
