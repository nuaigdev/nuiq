"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavItem } from "@/lib/navigation";

/**
 * Top-level navigation (CLAUDE.md §5).
 *
 * Top nav only — a horizontal bar across the top of the shell. Do not turn this
 * into a left sidebar, a collapsible rail, a desktop hamburger drawer, or a
 * split top+side arrangement: Tab 1's React Flow canvas and Tab 2's embedded
 * reports both need the full page width.
 */

type TopNavProps = {
  items: NavItem[];
  defaultRoute: string;
  clientName: string;
  clientLogoUrl?: string;
  /** Sign in / sign out controls, rendered on the server. */
  authControls: React.ReactNode;
};

export function TopNav({
  items,
  defaultRoute,
  clientName,
  clientLogoUrl,
  authControls,
}: TopNavProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-peak-950 text-white">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-[72px] max-w-[1600px] items-center gap-8 px-6"
      >
        <Link
          href={defaultRoute}
          aria-label="NuIQ home"
          className="flex shrink-0 items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-peak-300"
        >
          <Image
            src="/nuiq-logo.png"
            alt=""
            width={80}
            height={80}
            priority
            className="h-11 w-11"
          />
          {/* Gradient is on the NuIQ wordmark only. The origami mark itself stays
              flat and untouched — never apply a gradient to the mark (§8). */}
          <span className="bg-gradient-to-br from-white via-peak-300 to-peak-600 bg-clip-text text-[26px] font-semibold leading-none tracking-[-0.03em] text-transparent">
            NuIQ
          </span>
        </Link>

        <ul className="flex items-center gap-1">
          {items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "relative flex h-[72px] items-center px-3.5 text-sm transition-colors",
                    "focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-peak-300",
                    isActive
                      ? "font-medium text-white after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-peak-300"
                      : "text-peak-100/70 hover:text-white",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex shrink-0 items-center gap-4">
          {clientLogoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element -- client-supplied URL, dimensions unknown */
            <img
              src={clientLogoUrl}
              alt={clientName}
              className="h-7 w-auto border-r border-white/15 pr-4"
            />
          ) : null}
          {authControls}
        </div>
      </nav>
    </header>
  );
}
