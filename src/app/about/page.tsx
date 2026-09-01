import Image from "next/image";

export const metadata = { title: "About" };

/**
 * Secondary route, reached from the footer — deliberately NOT a fifth top-level
 * tab. The nav carries exactly the four core destinations (CLAUDE.md §5).
 *
 * This page is about the product. It is client-agnostic on purpose: no client
 * name, no client data, nothing read from tenant.json. The NuAIg section stays
 * brief, and anything it states must be verifiable on nuaig.ai.
 */

const TABS = [
  {
    name: "Data Flow",
    body: "An animated picture of how data moves from source systems through the warehouse — drawn from the warehouse itself, not a diagram someone maintains by hand.",
  },
  {
    name: "Dashboards",
    body: "Power BI reports embedded in place rather than linked out, so they stay interactive and stay scoped to the communities you are responsible for.",
  },
  {
    name: "Data Agents",
    body: "Ask questions of the warehouse in plain language. Each agent covers its own subject area — census, quality and incidents, staffing.",
  },
  {
    name: "Agents",
    body: "Broader AI agents built on Azure AI Foundry, Copilot Studio, and Power Platform, surfaced in the form that suits each one.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[1600px] px-6 py-12">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          About NuIQ
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink-muted">
          NuIQ is a data intelligence portal for senior living and long-term
          care. It sits on top of an operator&rsquo;s existing Microsoft Fabric
          warehouse and gives directors, regional leadership, and quality teams
          one place to see how their data flows, read the dashboards built on
          it, and ask questions of it directly — without needing to read a
          warehouse schema or wait on an analyst.
        </p>
        <p className="mt-4 text-base leading-relaxed text-ink-muted">
          It is not a data warehouse, an ETL tool, or a BI tool. It is the
          presentation layer in front of infrastructure you already own.
        </p>
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {TABS.map((tab) => (
          <div key={tab.name} className="rounded border border-hairline bg-surface p-5">
            <h2 className="text-sm font-medium text-ink">{tab.name}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              {tab.body}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-14 max-w-3xl border-t border-hairline pt-10">
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          Built for the way senior living actually operates
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink-muted">
          Senior living runs as organizations, regions, communities, and units —
          so NuIQ does too. What you see is scoped to the part of the
          organization you are responsible for, and that scope is enforced on
          every query behind the screen, not just reflected in the filters in
          front of it.
        </p>
        <p className="mt-4 text-base leading-relaxed text-ink-muted">
          The vocabulary is the industry&rsquo;s own. Census, falls, elopements,
          medication errors, staffing ratios, and CMS Five-Star ratings are
          modelled as the named measures they are, not flattened into generic
          business metrics.
        </p>
      </section>

      <section className="mt-14 max-w-3xl border-t border-hairline pt-10">
        <Image
          src="/nuaig-logo.svg"
          alt="NuAIg"
          width={82}
          height={34}
          className="h-8 w-auto"
        />
        <p className="mt-5 text-base leading-relaxed text-ink-muted">
          NuIQ is built by <strong className="font-medium text-ink">NuAIg</strong>,
          a US-based AI advisory and implementation partner working exclusively
          with senior living, aging services, and post-acute care providers.
          Strategy and hands-on implementation sit in the same team, so nothing
          is lost between the diagnosis and the deployment.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-ink-muted">
          More at{" "}
          <a
            href="https://www.nuaig.ai"
            target="_blank"
            rel="noreferrer noopener"
            className="text-peak-600 underline underline-offset-4 hover:text-peak-700"
          >
            nuaig.ai
          </a>
          .
        </p>
      </section>
    </div>
  );
}
