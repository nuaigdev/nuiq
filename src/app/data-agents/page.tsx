import { NotWiredYet, PageShell } from "@/components/PageShell";
import { getTenantConfig } from "@/lib/tenant-config";

export const metadata = { title: "Data Agents" };

export default function DataAgentsPage() {
  const { fabricDataAgents } = getTenantConfig();

  return (
    <PageShell
      title="Fabric Data Agents"
      intro="Ask questions of the warehouse directly. Each agent covers its own subject area."
    >
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {fabricDataAgents.map((agent) => (
          <li
            key={agent.id}
            className="rounded border border-hairline bg-surface p-4"
          >
            <h2 className="text-sm font-medium text-ink">{agent.name}</h2>
            {agent.description ? (
              <p className="mt-1 text-xs text-ink-muted">{agent.description}</p>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <NotWiredYet>
          Chat surface not built yet. This is a first-party chat UI calling the
          Fabric data agent endpoint server-side — Fabric data agents ship no
          drop-in web-chat widget, so do not go looking for one. Query{" "}
          <strong className="font-medium text-ink">
            on behalf of the signed-in user
          </strong>
          , never a service principal with blanket warehouse access, or the answers
          stop respecting each user&apos;s facility scope (CLAUDE.md §5 Tab 3).
        </NotWiredYet>
      </div>
    </PageShell>
  );
}
