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
 * split top+side arrangement: the dashboard grid and embedded reports both need
 * the full page width.
 */

type TopNavProps = {
  items: NavItem[];
  defaultRoute: string;
  clientLogoUrl?: string;
  /** Sign in / sign out controls, rendered on the server. */
  authControls: React.ReactNode;
};

export function TopNav({
  items,
  defaultRoute,
  clientLogoUrl,
  authControls,
}: TopNavProps) {
  const pathname = usePathname();

  return (
    <header className="app-header chrome-header chrome-edge sticky top-0 z-50 text-white">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-[68px] max-w-[1600px] items-center gap-6 px-6"
      >
        <Link
          href={defaultRoute}
          aria-label="Home page"
          className="flex shrink-0 items-center rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-peak-300"
        >
          {/* The NuAIg logo is the mark throughout the product now — the NuIQ
              origami mark is no longer used anywhere (CLAUDE.md §8). White
              variant because the header is the dark chrome gradient. */}
          <Image
            src="/nuaig-logo-white.svg"
            alt="NuAIg"
            width={116}
            height={30}
            priority
            className="h-[30px] w-auto"
          />
        </Link>

        {/* The client's own logo, when one is configured. The client *name*
            used to sit here too and no longer does. Nothing renders at all
            without a configured logo, rather than leaving a divider with
            nothing beside it. */}
        {clientLogoUrl ? (
          <div className="flex min-w-0 shrink items-center gap-2.5">
            <span aria-hidden className="h-6 w-px shrink-0 bg-white/15" />
            {/* eslint-disable-next-line @next/next/no-img-element -- client-supplied URL, dimensions unknown */}
            <img src={clientLogoUrl} alt="" className="h-6 w-auto shrink-0" />
          </div>
        ) : null}

        <ul className="flex shrink-0 items-center gap-0.5">
          {items.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "relative flex h-[68px] items-center px-3.5 text-sm transition-colors",
                    "focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-peak-300",
                    isActive
                      ? "font-medium text-white after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:rounded-full after:bg-peak-400"
                      : "text-peak-100/65 hover:text-white",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex shrink-0 items-center gap-4">{authControls}</div>
      </nav>
    </header>
  );
}
