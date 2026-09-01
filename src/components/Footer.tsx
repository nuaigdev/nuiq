import Image from "next/image";

/**
 * "Powered by NuAIg" (CLAUDE.md §1, §8).
 *
 * Present on every page of every client deployment, and deliberately not
 * configurable via tenant.json. This is the only place the NuAIg logo appears —
 * never in the nav, the favicon, or as a watermark.
 */
export function Footer() {
  return (
    <footer className="border-t border-hairline bg-surface">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-5">
        <a
          href="https://nuaig.ai"
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-2.5"
        >
          <span className="text-xs text-ink-muted">Powered by</span>
          <Image
            src="/nuaig-logo.svg"
            alt="NuAIg"
            width={82}
            height={34}
            className="h-[26px] w-auto"
          />
        </a>
      </div>
    </footer>
  );
}
