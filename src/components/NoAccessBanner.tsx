/**
 * Shown when a dashboard cannot be displayed for this user.
 *
 * Used by both the server-side pre-check and the client-side embed error
 * handler, so a person sees the same explanation whichever path detects the
 * problem. Access to Power BI content is administered in Power BI, never in
 * NuIQ, so the only useful action is to ask whoever owns the workspace.
 */
export function NoAccessBanner({
  reportName,
  reason,
}: {
  reportName: string;
  reason: "report" | "data" | "unknown";
}) {
  const detail = {
    report:
      "Your account does not have access to this report in Power BI.",
    data:
      "You can open this report, but your account cannot read the data behind it. That is usually access to the report without access to its dataset.",
    unknown:
      "This report could not be loaded with your account. That is most often a Power BI permission that has not been granted yet.",
  }[reason];

  return (
    <div className="card rounded-xl p-8">
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-peak-50 text-lg text-peak-700"
        >
          !
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink">
            You don&rsquo;t have access to this dashboard
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
            {detail}
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Ask an administrator to grant your account access to{" "}
            <strong className="font-medium text-ink">{reportName}</strong> in
            Power BI. Access is managed there rather than in NuIQ, so nothing on
            this screen can grant it. A Power BI licence is also required.
          </p>
        </div>
      </div>
    </div>
  );
}
