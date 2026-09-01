/**
 * Shared frame for the section pages, so each opens the same way: what the page
 * is, then its content. The explanatory line is not decoration — most readers
 * here are facility staff, not analysts, and should not have to infer what a
 * "data agent" is from an empty grid.
 */
export function PageShell({
  eyebrow,
  title,
  intro,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1600px] px-6 py-9">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-peak-600">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-tight text-ink">
            {title}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
            {intro}
          </p>
        </div>
        {action ? <div className="shrink-0 pt-1">{action}</div> : null}
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}

/** Marks a surface that is scaffolded but not yet wired to its data source. */
export function NotWiredYet({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-hairline-strong bg-surface-raised p-6 text-sm leading-relaxed text-ink-muted">
      {children}
    </div>
  );
}
