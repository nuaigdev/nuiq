import Image from "next/image";
import Link from "next/link";

/**
 * Site footer.
 *
 * "Powered by NuAIg" appears on every page of every client deployment and is
 * not configurable via tenant.json (CLAUDE.md §1, §8). The dark surface is why
 * nuaig-logo-white.svg exists.
 *
 * One compact bar, everywhere. It used to carry a paragraph describing the
 * product above the credit, which the viewport-locked routes then had to hide
 * to win back the height — so a dashboard or a conversation already showed this
 * shorter footer, and it read better there than the tall one did anywhere else.
 * The tall variant is gone rather than conditional: a footer that changes shape
 * between pages is a footer the eye has to re-find. The landing page remains
 * the one page with no footer at all (§8).
 *
 * It is not a second navigation surface: no portal links, no repeat of the
 * header. `/about` is here because the footer is deliberately where secondary
 * routes live (§5, Secondary routes) — it is the only link that belongs.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer chrome-footer mt-16 text-peak-100">
      <div className="app-footer-inner mx-auto flex max-w-[1600px] flex-col gap-3 px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between">
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

        <div className="flex items-center gap-5">
          <Link
            href="/about"
            className="text-xs text-peak-100/70 transition-colors hover:text-white"
          >
            About
          </Link>
          <p className="text-xs text-peak-100/40">&copy; {year} NuAIg LLC</p>
        </div>
      </div>
    </footer>
  );
}
