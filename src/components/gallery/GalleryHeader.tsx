/**
 * The band every gallery page opens with: the product's mark, what the page
 * is, how many there are, and the one action it offers.
 *
 * It sits on the cooler canvas ground the chat and dashboard workspaces use, so
 * moving from a gallery into one of its items does not change the material the
 * page is made of. The faceted ridge on the right is the context panel's own
 * motif, pale — geometry from the mark, not a chart (CLAUDE.md §8).
 */
export function GalleryHeader({
  logo,
  eyebrow,
  title,
  intro,
  count,
  action,
}: {
  /** A mark in /public/logos, drawn on a white tile. */
  logo: string;
  eyebrow: string;
  title: string;
  intro?: string;
  /** e.g. "3 agents". Omitted when the list is empty. */
  count?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-canvas-line bg-canvas-ground">
      <HeaderRidge />
      <div className="relative mx-auto flex max-w-[1600px] flex-wrap items-end justify-between gap-6 px-6 pb-8 pt-9">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-canvas-line bg-surface shadow-[0_1px_2px_rgba(15,20,32,0.05)]">
              {/* eslint-disable-next-line @next/next/no-img-element -- small static mark from /public */}
              <img src={logo} alt="" width={22} height={22} className="h-[22px] w-[22px] object-contain" />
            </span>
            <p className="text-[12px] font-medium text-peak-600">{eyebrow}</p>
            {count ? (
              <span className="rounded-full border border-canvas-line bg-surface/80 px-2.5 py-0.5 text-[11.5px] font-medium text-ink-muted">
                {count}
              </span>
            ) : null}
          </div>
          <h1 className="mt-4 text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink">
            {title}
          </h1>
          {intro ? (
            <p className="mt-3 max-w-[68ch] text-[15px] leading-[1.65] text-ink-muted">
              {intro}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </section>
  );
}

/** The header's pale ridge, anchored to the band's bottom-right corner. */
function HeaderRidge() {
  return (
    <svg
      viewBox="0 0 520 180"
      preserveAspectRatio="xMaxYMax meet"
      aria-hidden
      className="pointer-events-none absolute bottom-0 right-0 hidden h-full w-[46%] max-w-[640px] md:block"
    >
      <polygon points="330,62 430,100 520,168 390,168" className="fill-peak-200/50" />
      <polygon points="430,100 520,120 520,168" className="fill-peak-300/35" />
      <polygon points="236,92 330,62 390,168 272,168" className="fill-peak-300/45" />
      <polygon points="150,40 236,92 272,168 188,168" className="fill-peak-500/25" />
      <polygon points="150,40 188,168 40,168" className="fill-peak-600/12" />
      <rect x="0" y="167" width="520" height="1.5" className="fill-peak-400/30" />
      <g className="agent-drift-a">
        <polygon points="96,40 124,26 118,58" className="fill-peak-400/25" />
      </g>
      <g className="agent-drift-c">
        <polygon points="270,20 294,32 274,44" className="fill-peak-300/40" />
      </g>
    </svg>
  );
}

/** The quiet secondary action used in gallery headers ("Manage agents"). */
export const HEADER_ACTION_CLASS =
  "inline-flex items-center gap-2 rounded-lg border border-canvas-line bg-surface px-3.5 py-2 text-[13.5px] font-medium text-ink-muted shadow-[0_1px_2px_rgba(15,20,32,0.04)] transition-colors hover:border-peak-300 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peak-500";
