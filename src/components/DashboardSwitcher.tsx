"use client";

import Link from "next/link";

import type { Dashboard } from "@/lib/dashboard-store";

/**
 * Switches between dashboards. Each is its own route, so a dashboard can be
 * linked to a colleague directly (CLAUDE.md §5).
 *
 * Hidden entirely when there is only one dashboard — a switcher between one
 * option is chrome without a purpose.
 */
export function DashboardSwitcher({
  dashboards,
  activeId,
}: {
  dashboards: Dashboard[];
  activeId: string;
}) {
  if (dashboards.length < 2) return null;

  return (
    <nav aria-label="Dashboards" className="mt-5 border-b border-hairline">
      <ul className="-mb-px flex flex-wrap items-center gap-x-1">
        {dashboards.map((dashboard) => {
          const isActive = dashboard.id === activeId;
          return (
            <li key={dashboard.id}>
              <Link
                href={`/dashboards/${dashboard.id}`}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "-mb-px block border-b-2 px-3.5 py-2.5 text-sm transition-colors",
                  isActive
                    ? "border-peak-600 font-medium text-ink"
                    : "border-transparent text-ink-muted hover:border-hairline hover:text-ink",
                ].join(" ")}
              >
                {dashboard.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
