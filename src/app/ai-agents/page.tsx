import { NotWiredYet, PageShell } from "@/components/PageShell";
import { getTenantConfig } from "@/lib/tenant-config";

export const metadata = { title: "AI Agents" };

const TYPE_LABELS: Record<string, string> = {
  foundry: "Azure AI Foundry",
  "copilot-studio": "Copilot Studio",
  "power-platform": "Power Platform",
};

const DISPLAY_LABELS: Record<string, string> = {
  "chat-panel": "Chat panel",
  iframe: "Embedded app",
  "link-card": "Opens externally",
};

export default async function AiAgentsPage() {
  const { agents } = await getTenantConfig();

  return (
    <PageShell
      eyebrow="Foundry & Copilot"
      title="AI Agents"
      intro="Assistants for the work that reaches past the warehouse — drafting, summarising, guiding a process, or pulling from systems the reporting layer never sees. Built on Azure AI Foundry, Copilot Studio, and Power Platform, so each one appears in whatever form suits it."
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <ul className="grid gap-4 sm:grid-cols-2">
          {agents.map((agent) => (
            <li
              key={`${agent.type}:${agent.name}`}
              className="card rounded-xl p-5"
            >
              <h2 className="text-sm font-semibold text-ink">{agent.name}</h2>
              <p className="mt-1.5 text-xs text-ink-muted">
                {TYPE_LABELS[agent.type] ?? agent.type}
              </p>
              <span className="mt-3 inline-block rounded bg-peak-50 px-2 py-0.5 text-[11px] font-medium text-peak-700">
                {DISPLAY_LABELS[agent.display] ?? agent.display}
              </span>
            </li>
          ))}
        </ul>

        <aside className="card rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink">
            How these differ from Data Agents
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            A data agent answers <em>from</em> the warehouse. These agents are
            built on separate platforms and may reach other systems entirely, so
            they are useful for different work — and they carry different data
            handling.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Take care with resident detail in free text here. A Fabric data agent
            stays inside your own tenant; these platforms may not, and that is a
            question worth answering per agent rather than assuming.
          </p>
        </aside>
      </div>

      <div className="mt-6">
        <NotWiredYet>
          Renderers not built yet. Build one component per display mode and
          select it from the agent&rsquo;s{" "}
          <code className="text-ink">display</code> field — not a single chat
          frame for everything, and not a{" "}
          <code className="text-ink">type</code> switch inlined in one
          mega-component. An agent not ready to embed falls back to a link card
          (CLAUDE.md §5 Tab 4).
        </NotWiredYet>
      </div>
    </PageShell>
  );
}
