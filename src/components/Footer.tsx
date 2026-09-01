import Image from "next/image";
import Link from "next/link";

/**
 * Site footer.
 *
 * "Powered by NuAIg" appears on every page of every client deployment and is
 * not configurable via tenant.json (CLAUDE.md §1, §8). This is the only place
 * the NuAIg logo appears — never in the nav, the favicon, or as a watermark.
 * The dark surface is why nuaig-logo-white.svg exists.
 *
 * It is not a second navigation surface: no NuIQ mark, no portal links. Those
 * live in the header, and repeating them here just duplicates the top of the
 * page at the bottom of it.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="chrome-footer mt-16 text-peak-100">
      <div className="mx-auto max-w-[1600px] px-6 py-9">
        <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl">
            <h2 className="text-sm font-semibold text-white">
              A data intelligence portal for senior living
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-peak-100/60">
              NuIQ brings a Microsoft Fabric warehouse into one place for the
              people who run communities — how the data flows, the Power BI
              dashboards built on it, and the Fabric and AI agents that answer
              questions about it. Every view respects the access you already
              have; nothing here widens it.
            </p>
          </div>

          <Link
            href="/about"
            className="shrink-0 text-sm text-peak-100/70 transition-colors hover:text-white"
          >
            About
          </Link>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
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
          <p className="text-xs text-peak-100/40">
            &copy; {year} NuAIg LLC
          </p>
        </div>
      </div>
    </footer>
  );
}
