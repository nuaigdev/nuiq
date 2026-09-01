import Link from "next/link";

import { DataFlowHero } from "@/components/DataFlowHero";
import { getDashboards } from "@/lib/dashboard-store";
import { getTenantConfig } from "@/lib/tenant-config";

export const metadata = { title: "Home" };

/**
 * The hub. One place that shows how data reaches the portal and what is
 * available inside it — dashboards, Fabric data agents, and platform agents —
 * so a first-time visitor can orient without opening every tab.
 */

function SectionCard({
  href,
  eyebrow,
  title,
  description,
  items,
  emptyLabel,
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  items: string[];
  emptyLabel: string;
}) {
  return (
    <Link href={href} className="card card-interactive group block rounded-xl p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-peak-600">
        {eyebrow}
      </p>
      <h3 className="mt-2 text-lg font-semibold tracking-tight text-ink">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{description}</p>

      <ul className="mt-4 space-y-1.5 border-t border-hairline pt-4">
        {items.length === 0 ? (
          <li className="text-sm text-ink-subtle">{emptyLabel}</li>
        ) : (
          items.slice(0, 4).map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-ink-muted">
              <span
                aria-hidden
                className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-peak-400"
              />
              <span className="truncate">{item}</span>
            </li>
          ))
        )}
        {items.length > 4 ? (
          <li className="text-sm text-ink-subtle">
            +{items.length - 4} more
          </li>
        ) : null}
      </ul>

      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-peak-600">
        Open
        <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
          &rarr;
        </span>
      </span>
    </Link>
  );
}

export default async function HomePage() {
  const config = await getTenantConfig();
  const dashboards = getDashboards(config);

  return (
    <div>
      <section className="chrome-header text-white">
        <div className="mx-auto grid max-w-[1600px] items-center gap-10 px-6 py-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight">
              Your data, end to end.
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-peak-100/75">
              NuIQ sits on top of your Microsoft Fabric warehouse and brings the
              whole picture into one place: how data moves from your source
              systems, the dashboards built on it, and the agents that answer
              questions about it — without anyone needing to read a warehouse
              schema.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/dashboards"
                className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-peak-900 transition-colors hover:bg-peak-100"
              >
                View dashboards
              </Link>
              <Link
                href="/data-agents"
                className="rounded-lg border border-white/25 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/50"
              >
                Ask the data
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <DataFlowHero />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-12">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
          In this portal
        </h2>
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <SectionCard
            href="/dashboards"
            eyebrow="Power BI"
            title="Dashboards"
            description="Reports from your Power BI workspaces, opened with your own Microsoft account so you see exactly what you are entitled to."
            items={dashboards.map((dashboard) => dashboard.name)}
            emptyLabel="No dashboards configured yet."
          />
          <SectionCard
            href="/data-agents"
            eyebrow="Microsoft Fabric"
            title="Data Agents"
            description="Ask questions of the warehouse in plain language. Each agent covers its own subject area rather than trying to answer everything."
            items={config.fabricDataAgents.map((agent) => agent.name)}
            emptyLabel="No data agents configured yet."
          />
          <SectionCard
            href="/ai-agents"
            eyebrow="Foundry & Copilot"
            title="AI Agents"
            description="Agents built on Azure AI Foundry, Copilot Studio, and Power Platform for the work that reaches beyond the warehouse."
            items={config.agents.map((agent) => agent.name)}
            emptyLabel="No AI agents configured yet."
          />
        </div>
      </section>
    </div>
  );
}
