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
    <header className="chrome-header chrome-edge sticky top-0 z-50 text-white">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-[68px] max-w-[1600px] items-center gap-6 px-6"
      >
        <Link
          href={defaultRoute}
          aria-label="NuIQ home"
          className="flex shrink-0 items-center gap-1.5 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-peak-300"
        >
          <Image
            src="/nuiq-logo.png"
            alt=""
            width={80}
            height={80}
            priority
            className="h-[37px] w-[37px]"
          />
          {/* Gradient is on the NuIQ wordmark only — the origami mark itself
              stays flat and untouched (CLAUDE.md §8). */}
          <span className="bg-gradient-to-br from-white via-peak-200 to-peak-500 bg-clip-text text-[22px] font-semibold leading-none tracking-[-0.03em] text-transparent">
            NuIQ
          </span>
        </Link>

        {/* Which client's portal this is. Sits with the product mark rather than
            with the user menu: it answers "where am I", not "who am I", and
            keeping the two apart stops the right-hand cluster becoming a pile of
            unrelated labels. */}
        <div className="flex min-w-0 shrink items-center gap-2.5">
          <span aria-hidden className="h-6 w-px shrink-0 bg-white/15" />
          {clientLogoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element -- client-supplied URL, dimensions unknown */
            <img src={clientLogoUrl} alt="" className="h-6 w-auto shrink-0" />
          ) : null}
          <span className="truncate text-sm text-peak-100/85" title={clientName}>
            {clientName}
          </span>
        </div>

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
