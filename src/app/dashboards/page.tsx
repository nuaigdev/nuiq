import { NotWiredYet, PageShell } from "@/components/PageShell";
import { getTenantConfig } from "@/lib/tenant-config";

export const metadata = { title: "Dashboards" };

export default function DashboardsPage() {
  const { powerBi } = getTenantConfig();

  return (
    <PageShell
      title="Power BI Dashboards"
      intro="Reports embedded from this client's Power BI workspace."
    >
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {powerBi.reports.map((report) => (
          <li
            key={report.id}
            className="rounded border border-hairline bg-surface p-4"
          >
            <h2 className="text-sm font-medium text-ink">{report.name}</h2>
            <p className="mt-1 text-xs text-ink-muted">
              Filtered on {report.facilityFilterField}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <NotWiredYet>
          Embedding not wired yet. Reports must render through{" "}
          <code className="text-ink">powerbi-client-react</code> with embed tokens
          minted server-side, and row-level security applied from the signed-in
          user&apos;s facility scope — never client-side filters, which a user could
          change to reach another community&apos;s data (CLAUDE.md §5 Tab 2).
        </NotWiredYet>
      </div>
    </PageShell>
  );
}
