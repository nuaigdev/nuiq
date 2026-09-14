import Link from "next/link";

/** What a gallery shows before anything has been added to it. */
export function EmptyGallery({
  message,
  actionHref,
  actionLabel,
}: {
  message: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="mx-auto max-w-[1600px] px-6 py-8">
      <div className="rounded-2xl border border-dashed border-hairline-strong bg-surface px-6 py-14 text-center">
        <p className="mx-auto max-w-[56ch] text-[14px] leading-relaxed text-ink-muted">
          {message}
        </p>
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="mt-5 inline-block rounded-lg bg-peak-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-peak-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peak-500"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
