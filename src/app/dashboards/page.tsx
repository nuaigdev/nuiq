import { redirect } from "next/navigation";

import { PageShell } from "@/components/PageShell";
import { getTenantConfig } from "@/lib/tenant-config";

export const metadata = { title: "Dashboards" };

export default function DashboardsPage() {
  const { powerBi } = getTenantConfig();
  const first = powerBi.reports[0];

  if (first) {
    redirect(`/dashboards/${first.id}`);
  }

  return (
    <PageShell
      title="Power BI Dashboards"
      intro="Reports from this organization's Power BI workspace."
    >
      <div className="rounded border border-dashed border-hairline bg-surface p-5 text-sm text-ink-muted">
        No reports are listed in this deployment&apos;s configuration
        (<code className="text-ink">tenant.json → powerBi.reports</code>).
      </div>
    </PageShell>
  );
}
