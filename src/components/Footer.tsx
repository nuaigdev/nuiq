import Image from "next/image";
import Link from "next/link";

/**
 * Site footer — deliberately minimal.
 *
 * "Powered by NuAIg" appears on every page of every client deployment and is
 * not configurable via tenant.json (CLAUDE.md §1, §8). This is the only place
 * the NuAIg logo appears — never in the nav, the favicon, or as a watermark.
 * The dark surface is why nuaig-logo-white.svg exists.
 *
 * Keep it to the NuAIg credit and the About link. The footer is not a second
 * navigation surface: the NuIQ mark, the wordmark, and the portal links all
 * live in the header, and repeating them here just duplicates the top of the
 * page at the bottom of it.
 */
export function Footer() {
  return (
    <footer className="mt-12 bg-peak-950 text-peak-100">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-6 py-5">
        <a
          href="https://www.nuaig.ai"
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-2.5"
          aria-label="Powered by NuAIg"
        >
          <span className="text-xs text-peak-100/50">Powered by</span>
          <Image
            src="/nuaig-logo-white.svg"
            alt="NuAIg"
            width={82}
            height={34}
            className="h-[22px] w-auto"
          />
        </a>

        <Link
          href="/about"
          className="text-sm text-peak-100/70 transition-colors hover:text-white"
        >
          About
        </Link>
      </div>
    </footer>
  );
}
