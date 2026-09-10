import { AgentTile } from "@/components/AgentTile";
import {
  agentSlug,
  getPlatformAgents,
  PLATFORM_LABELS,
} from "@/lib/ai-agent-store";
import { getTenantConfig } from "@/lib/tenant-config";

export const metadata = { title: "Advanced AI Agents" };

/** Agents come from the client's configuration document, never from the build. */
export const dynamic = "force-dynamic";

/**
 * Tab 4 (CLAUDE.md §5).
 *
 * A gallery of tiles, the same shape as Dashboards and Conversational Data
 * Agents — the three galleries share `AgentTile`/`DashboardTile` so they read as
 * one product. Each agent opens at its own URL, so a colleague can be linked
 * straight to one.
 *
 * There is deliberately no explanatory preamble here. The agent's own context
 * panel says what it is and what to ask it, which is the same information at
 * the point it is useful.
 */
export default async function AiAgentsPage() {
  const config = await getTenantConfig();
  const agents = getPlatformAgents(config);

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-9">
      <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-ink">
        Advanced AI Agents
      </h1>

      {agents.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-hairline-strong bg-surface p-10 text-center">
          <p className="text-sm text-ink-muted">
            No AI agents are configured for this portal yet.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {agents.map((agent) => {
            const slug = agentSlug(agent);
            return (
              <li key={slug}>
                <AgentTile
                  href={`/ai-agents/${slug}`}
                  name={agent.name}
                  description={agent.description}
                  eyebrow={PLATFORM_LABELS[agent.type] ?? agent.type}
                  cta={agent.display === "chat-panel" ? "Ask" : "Open"}
                  seed={slug}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
