/** Shared page frame so every tab sits on the same grid and rhythm. */
export function PageShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1600px] px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      <p className="mt-1.5 max-w-3xl text-sm text-ink-muted">{intro}</p>
      <div className="mt-7">{children}</div>
    </div>
  );
}

/** Marks a surface that is scaffolded but not yet wired to its data source. */
export function NotWiredYet({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded border border-dashed border-hairline bg-surface p-5 text-sm text-ink-muted">
      {children}
    </div>
  );
}
