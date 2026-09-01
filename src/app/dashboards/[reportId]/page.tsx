import Link from "next/link";
import { notFound } from "next/navigation";

import { PowerBiEmbed } from "@/components/PowerBiEmbed";
import { findReport, getReportEmbedUrl } from "@/lib/powerbi";
import { getSession } from "@/lib/session";
import { getTenantConfig } from "@/lib/tenant-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const report = findReport(getTenantConfig(), reportId);
  return { title: report?.name ?? "Dashboards" };
}

function Notice({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded border border-hairline bg-surface p-6">
      <h2 className="text-sm font-medium text-ink">{title}</h2>
      <div className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
        {children}
      </div>
    </div>
  );
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const config = getTenantConfig();

  // Only reports this client has configured may be requested. Never pass an id
  // straight from the URL to Power BI.
  const report = findReport(config, reportId);
  if (!report) notFound();

  const session = await getSession();

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Power BI Dashboards
      </h1>

      <nav aria-label="Reports" className="mt-5 flex flex-wrap gap-2">
        {config.powerBi.reports.map((item) => {
          const isActive = item.id === report.id;
          return (
            <Link
              key={item.id}
              href={`/dashboards/${item.id}`}
              aria-current={isActive ? "page" : undefined}
              className={[
                "rounded border px-3.5 py-1.5 text-sm transition-colors",
                isActive
                  ? "border-peak-600 bg-peak-600 text-white"
                  : "border-hairline bg-surface text-ink-muted hover:text-ink",
              ].join(" ")}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6">
        <ReportBody report={report} session={session} config={config} />
      </div>
    </div>
  );
}

async function ReportBody({
  report,
  session,
  config,
}: {
  report: NonNullable<ReturnType<typeof findReport>>;
  session: Awaited<ReturnType<typeof getSession>>;
  config: ReturnType<typeof getTenantConfig>;
}) {
  if (!session.isAuthenticated || !session.powerBiToken) {
    return (
      <Notice title="Sign in to view dashboards">
        Reports are loaded with your own Microsoft account, so Power BI applies
        your permissions directly. Use <strong className="font-medium text-ink">Sign in</strong>{" "}
        at the top right.
      </Notice>
    );
  }

  const access = await getReportEmbedUrl(config, report, session.powerBiToken);

  if (access.status === "forbidden") {
    return (
      <Notice title="You do not have access to this report">
        Your account is signed in, but Power BI has not granted it access to{" "}
        <strong className="font-medium text-ink">{report.name}</strong>. Access is
        managed in Power BI, not in NuIQ — ask whoever administers the workspace
        to share the report with you. A Power BI licence is also required.
      </Notice>
    );
  }

  if (access.status === "not-found") {
    return (
      <Notice title="Report not found in the workspace">
        <strong className="font-medium text-ink">{report.name}</strong> is listed
        in this deployment&apos;s configuration, but Power BI cannot find it in
        the configured workspace. The report id or workspace id in{" "}
        <code className="text-ink">tenant.json</code> is likely wrong, or the
        report has been deleted.
      </Notice>
    );
  }

  if (access.status === "error") {
    return (
      <Notice title="Could not load this report">{access.detail}</Notice>
    );
  }

  return (
    <div className="overflow-hidden rounded border border-hairline bg-surface">
      <PowerBiEmbed
        reportId={report.id}
        embedUrl={access.embedUrl}
        accessToken={session.powerBiToken}
        pageName={report.pageName}
      />
    </div>
  );
}
