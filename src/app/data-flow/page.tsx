import { NotWiredYet, PageShell } from "@/components/PageShell";
import { getTenantConfig } from "@/lib/tenant-config";

export const metadata = { title: "Data Flow" };

export default function DataFlowPage() {
  const config = getTenantConfig();

  return (
    <PageShell
      title="Data Model & Flow"
      intro="How data moves from source systems through the warehouse."
    >
      <NotWiredYet>
        <p className="text-ink">React Flow canvas not built yet.</p>
        <p className="mt-2">
          Lineage sources, in order of preference (CLAUDE.md §5 Tab 1): live schema
          introspection against{" "}
          <code className="text-ink">{config.warehouseSqlEndpoint}</code>, pipeline
          lineage from the Fabric REST API cached into a first-party metadata store,
          or the hand-maintained per-client lineage config. The config fallback is a
          supported mode — build against it rather than blocking on automation.
        </p>
      </NotWiredYet>
    </PageShell>
  );
}
