import { NotWiredYet, PageShell } from "@/components/PageShell";
import { getTenantConfig } from "@/lib/tenant-config";

export const metadata = { title: "Agents" };

const TYPE_LABELS: Record<string, string> = {
  foundry: "Azure AI Foundry",
  "copilot-studio": "Copilot Studio",
  "power-platform": "Power Platform",
};

const DISPLAY_LABELS: Record<string, string> = {
  "chat-panel": "Chat panel",
  iframe: "Iframe embed",
  "link-card": "Link card",
};

export default function AgentsPage() {
  const { agents } = getTenantConfig();

  return (
    <PageShell
      title="Foundry & Copilot Agents"
      intro="Agents built on platforms rather than directly over the warehouse. Presentation varies per agent."
    >
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => (
          <li
            key={`${agent.type}:${agent.name}`}
            className="rounded border border-hairline bg-surface p-4"
          >
            <h2 className="text-sm font-medium text-ink">{agent.name}</h2>
            <p className="mt-1 text-xs text-ink-muted">
              {TYPE_LABELS[agent.type] ?? agent.type} ·{" "}
              {DISPLAY_LABELS[agent.display] ?? agent.display}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <NotWiredYet>
          Renderers not built yet. Build one component per display mode and select
          it from the agent&apos;s <code className="text-ink">display</code> field —
          not a single chat frame for everything, and not a{" "}
          <code className="text-ink">type</code> switch inlined in one
          mega-component. An agent not ready to embed falls back to a link card
          (CLAUDE.md §5 Tab 4).
        </NotWiredYet>
      </div>
    </PageShell>
  );
}
