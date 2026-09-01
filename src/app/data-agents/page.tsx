import { NotWiredYet, PageShell } from "@/components/PageShell";
import { getTenantConfig } from "@/lib/tenant-config";

export const metadata = { title: "Data Agents" };

export default async function DataAgentsPage() {
  const { fabricDataAgents } = await getTenantConfig();

  return (
    <PageShell
      eyebrow="Microsoft Fabric"
      title="Data Agents"
      intro="Ask questions of the warehouse in plain language and get an answer back from your own data — no report to find, no filter to set. Each agent is scoped to one subject area, because an agent that covers everything answers everything vaguely."
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <ul className="grid gap-4 sm:grid-cols-2">
          {fabricDataAgents.map((agent) => (
            <li key={agent.id} className="card rounded-xl p-5">
              <h2 className="text-sm font-semibold text-ink">{agent.name}</h2>
              {agent.description ? (
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                  {agent.description}
                </p>
              ) : null}
            </li>
          ))}
        </ul>

        <aside className="card rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink">
            What these agents can see
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            A data agent reads the warehouse directly, so its answers are only as
            narrow as your own access. Questions are asked on your behalf rather
            than through a shared service account, which is what keeps one
            community&rsquo;s numbers out of another&rsquo;s answers.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Where an agent reports the tables or query behind a figure, that
            detail is shown alongside the answer. A census or falls number with
            no visible origin is worth less than no number at all.
          </p>
        </aside>
      </div>

      <div className="mt-6">
        <NotWiredYet>
          Chat surface not built yet. This will be a first-party chat UI calling
          the Fabric data agent endpoint server-side — Fabric data agents ship no
          drop-in web-chat widget, so do not go looking for one. Queries must run{" "}
          <strong className="font-medium text-ink">
            on behalf of the signed-in user
          </strong>
          , never a service principal with blanket warehouse access, or the
          answers stop respecting each user&rsquo;s facility scope (CLAUDE.md §5
          Tab 3).
        </NotWiredYet>
      </div>
    </PageShell>
  );
}
