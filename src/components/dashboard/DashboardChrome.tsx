"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  Filter,
  Maximize2,
  Minimize2,
  RefreshCw,
  RotateCcw,
  Settings2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

import { useReportView, type Fit } from "./report-store";

/**
 * The bar above the report.
 *
 * A dashboard has no second half to fill: the report is the content, it carries
 * its own colour and density, and any chrome that competes with it makes the
 * page look worse rather than more designed. So this bar is deliberately quiet —
 * greyscale except the active page tab and focus rings, one row tall, and it
 * gives back every pixel it does not need.
 */

export type DashboardLink = { id: string; name: string };

const CONTROL =
  "flex h-8 w-8 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-canvas-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peak-500 disabled:opacity-40 disabled:hover:bg-transparent";

const CONTROL_ON = "bg-canvas-raised text-peak-700 hover:text-peak-700";

const FIT_LABELS: Record<Fit, string> = {
  page: "Fit to page",
  width: "Fit to width",
  actual: "Actual size",
};

/** Closes a popover on an outside click or Escape. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) close();
    }
    function onKey(event: KeyboardEvent) {
      // Stopped here so Escape closes the menu rather than leaving focus mode
      // out from under it.
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open, close]);

  return ref;
}

const MENU_CLASS =
  "absolute z-50 mt-1.5 min-w-[15rem] overflow-hidden rounded-xl border border-canvas-line bg-surface p-1 shadow-[0_12px_32px_-12px_rgba(15,20,32,0.28)]";

const MENU_ITEM =
  "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-canvas-raised focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-peak-500";

/** Which dashboard is open, and a way to any of the others. */
function DashboardMenu({
  dashboards,
  currentId,
}: {
  dashboards: DashboardLink[];
  currentId: string;
}) {
  const { reportName } = useReportView();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));

  // A menu listing the one dashboard you are already on is chrome without a
  // purpose.
  if (dashboards.length < 2) {
    return (
      <p className="truncate text-[13.5px] font-medium text-ink">{reportName}</p>
    );
  }

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[13.5px] font-medium text-ink transition-colors hover:bg-canvas-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peak-500"
      >
        <span className="truncate">{reportName}</span>
        <ChevronDown
          aria-hidden
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-ink-subtle transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className={MENU_CLASS}
          >
            {dashboards.map((dashboard) => (
              <Link
                key={dashboard.id}
                href={`/dashboards/${dashboard.id}`}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(
                  MENU_ITEM,
                  dashboard.id === currentId
                    ? "font-medium text-ink"
                    : "text-ink-muted",
                )}
              >
                <Check
                  aria-hidden
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 text-peak-600",
                    dashboard.id !== currentId && "invisible",
                  )}
                />
                <span className="truncate">{dashboard.name}</span>
              </Link>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** The report's own pages, in our type rather than Power BI's. */
function PageTabs() {
  const { pages, activePage, selectPage } = useReportView();
  if (pages.length < 2) return null;

  return (
    <nav
      aria-label="Report pages"
      className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex items-center gap-0.5">
        {pages.map((page) => {
          const isActive = page.name === activePage;
          return (
            <li key={page.name}>
              <button
                type="button"
                onClick={() => selectPage(page.name)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peak-500",
                  isActive
                    ? "font-medium text-ink"
                    : "text-ink-subtle hover:bg-canvas-raised hover:text-ink",
                )}
              >
                {page.displayName}
                {isActive ? (
                  <motion.span
                    layoutId="dashboard-page-underline"
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute inset-x-2 -bottom-[7px] h-[2px] rounded-full bg-peak-600"
                  />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function FitMenu() {
  const { fit, setFit } = useReportView();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        title={`Scaling — ${FIT_LABELS[fit]}`}
        className={cn(CONTROL, open && CONTROL_ON)}
      >
        <Settings2 aria-hidden className="h-4 w-4" />
        <span className="sr-only">Report scaling</span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className={cn(MENU_CLASS, "right-0 min-w-[12rem]")}
          >
            {(Object.keys(FIT_LABELS) as Fit[]).map((option) => (
              <button
                key={option}
                type="button"
                role="menuitemradio"
                aria-checked={fit === option}
                onClick={() => {
                  setFit(option);
                  setOpen(false);
                }}
                className={cn(
                  MENU_ITEM,
                  fit === option ? "font-medium text-ink" : "text-ink-muted",
                )}
              >
                <Check
                  aria-hidden
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 text-peak-600",
                    fit !== option && "invisible",
                  )}
                />
                {FIT_LABELS[option]}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/**
 * When this view last painted.
 *
 * Careful wording: this is when *the embed* last drew, which is not the same as
 * when the dataset last refreshed. Saying "data as of" would be a claim we
 * cannot support without the Power BI REST API.
 */
function ShownAt() {
  const { shownAt, refreshing, refreshedByHand } = useReportView();
  if (refreshing) return <span className="tabular-nums">Refreshing…</span>;
  if (!shownAt) return null;

  const time = shownAt.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  return (
    <span className="tabular-nums">
      {refreshedByHand ? "Refreshed" : "Loaded"} {time}
    </span>
  );
}

export function DashboardChrome({
  dashboards,
  currentId,
}: {
  dashboards: DashboardLink[];
  currentId: string;
}) {
  const {
    ready,
    failure,
    filtersVisible,
    toggleFilters,
    refresh,
    refreshing,
    reset,
    focus,
    toggleFocus,
  } = useReportView();

  // Controls that act on a live report are meaningless until there is one.
  const live = ready && !failure;

  return (
    <div className="flex h-12 shrink-0 items-center gap-3 border-b border-canvas-line bg-surface px-3 sm:px-4">
      <div className="flex min-w-0 shrink items-center gap-2">
        <Link
          href="/dashboards"
          title="All dashboards"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-canvas-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peak-500"
        >
          <ChevronDown aria-hidden className="h-4 w-4 rotate-90" />
          <span className="sr-only">All dashboards</span>
        </Link>
        <DashboardMenu dashboards={dashboards} currentId={currentId} />
      </div>

      <span aria-hidden className="h-5 w-px shrink-0 bg-canvas-line" />

      <PageTabs />

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <p className="hidden text-[11.5px] text-ink-subtle lg:block">
          <ShownAt />
        </p>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={toggleFilters}
            disabled={!live}
            aria-pressed={filtersVisible}
            title={filtersVisible ? "Hide filters" : "Show filters"}
            className={cn(CONTROL, filtersVisible && live && CONTROL_ON)}
          >
            <Filter aria-hidden className="h-4 w-4" />
            <span className="sr-only">
              {filtersVisible ? "Hide the filters pane" : "Show the filters pane"}
            </span>
          </button>

          <button
            type="button"
            onClick={reset}
            disabled={!live}
            title="Reset to the report's saved view"
            className={CONTROL}
          >
            <RotateCcw aria-hidden className="h-4 w-4" />
            <span className="sr-only">Reset filters to the saved view</span>
          </button>

          <button
            type="button"
            onClick={refresh}
            disabled={!live || refreshing}
            title="Refresh"
            className={CONTROL}
          >
            <RefreshCw
              aria-hidden
              className={cn("h-4 w-4", refreshing && "animate-spin")}
            />
            <span className="sr-only">Refresh the report</span>
          </button>

          <FitMenu />

          <button
            type="button"
            onClick={toggleFocus}
            aria-pressed={focus}
            title={focus ? "Exit focus mode (Esc)" : "Focus mode"}
            className={cn(CONTROL, focus && CONTROL_ON)}
          >
            {focus ? (
              <Minimize2 aria-hidden className="h-4 w-4" />
            ) : (
              <Maximize2 aria-hidden className="h-4 w-4" />
            )}
            <span className="sr-only">
              {focus ? "Exit focus mode" : "Fill the screen with this dashboard"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
