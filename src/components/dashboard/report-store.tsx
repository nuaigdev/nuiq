"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { useFocusMode } from "@/lib/focus-mode";

/**
 * State for one embedded Power BI report.
 *
 * The chrome bar and the embed are siblings: the bar has to drive a report it
 * does not render. Rather than pass the live `Report` object around, this holds
 * only what the bar wants to be true, and the embed applies it — so every call
 * into the Power BI client API happens in one file, the one that is already
 * gated to the browser. Nothing here talks to Power BI's REST API or to our
 * server; the embed is already authorised by the time any of this runs.
 */

export type Fit = "page" | "width" | "actual";

/**
 * Why an embed stopped working. The two want different advice — one is fixed by
 * reloading, the other by an administrator — so they are kept apart rather than
 * collapsed into "something went wrong".
 */
export type FailureKind = "token-expired" | "render-failed";

export type ReportPage = { name: string; displayName: string };

type ReportContextValue = {
  reportName: string;
  /** True once Power BI has painted the report, not merely loaded it. */
  ready: boolean;
  failure: FailureKind | null;
  pages: ReportPage[];
  activePage: string | null;
  filtersVisible: boolean;
  fit: Fit;
  refreshing: boolean;
  /** Bumped to ask the embed for a one-off action. */
  refreshNonce: number;
  resetNonce: number;
  /** When this view last painted, for the bar's timestamp. */
  shownAt: Date | null;
  refreshedByHand: boolean;
  focus: boolean;
  toggleFocus: () => void;

  /* Reported by the embed. */
  reportLoaded: (pages: ReportPage[], active: string | null) => void;
  reportRendered: () => void;
  reportFailed: (kind: FailureKind) => void;
  pageChanged: (pageName: string) => void;

  /* Asked for by the chrome bar. */
  selectPage: (pageName: string) => void;
  toggleFilters: () => void;
  setFit: (fit: Fit) => void;
  refresh: () => void;
  reset: () => void;
};

const ReportContext = createContext<ReportContextValue | null>(null);

export function useReportView() {
  const value = useContext(ReportContext);
  if (!value) {
    throw new Error("useReportView must be used inside ReportViewProvider");
  }
  return value;
}

const FOCUS_KEY = "nuiq:dashboard-focus";

export function ReportViewProvider({
  reportName,
  children,
}: {
  reportName: string;
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [failure, setFailure] = useState<FailureKind | null>(null);
  const [pages, setPages] = useState<ReportPage[]>([]);
  const [activePage, setActivePage] = useState<string | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [fit, setFitState] = useState<Fit>("page");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [resetNonce, setResetNonce] = useState(0);
  const [shownAt, setShownAt] = useState<Date | null>(null);
  const [refreshedByHand, setRefreshedByHand] = useState(false);

  const { focus, toggleFocus } = useFocusMode(FOCUS_KEY);

  const reportLoaded = useCallback(
    (loadedPages: ReportPage[], active: string | null) => {
      setPages(loadedPages);
      setActivePage(active);
    },
    [],
  );

  const reportRendered = useCallback(() => {
    setReady(true);
    setRefreshing(false);
    setShownAt(new Date());
  }, []);

  const reportFailed = useCallback((kind: FailureKind) => {
    setFailure(kind);
    setRefreshing(false);
  }, []);

  const pageChanged = useCallback((pageName: string) => {
    setActivePage(pageName);
  }, []);

  const selectPage = useCallback((pageName: string) => {
    // Optimistic. Power BI confirms with pageChanged, but waiting for the round
    // trip makes the tab feel as though it did not register the click.
    setActivePage(pageName);
  }, []);

  const toggleFilters = useCallback(
    () => setFiltersVisible((visible) => !visible),
    [],
  );

  const setFit = useCallback((next: Fit) => setFitState(next), []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    setRefreshedByHand(true);
    setRefreshNonce((n) => n + 1);
  }, []);

  const reset = useCallback(() => setResetNonce((n) => n + 1), []);

  const value = useMemo<ReportContextValue>(
    () => ({
      reportName,
      ready,
      failure,
      pages,
      activePage,
      filtersVisible,
      fit,
      refreshing,
      refreshNonce,
      resetNonce,
      shownAt,
      refreshedByHand,
      focus,
      toggleFocus,
      reportLoaded,
      reportRendered,
      reportFailed,
      pageChanged,
      selectPage,
      toggleFilters,
      setFit,
      refresh,
      reset,
    }),
    [
      reportName,
      ready,
      failure,
      pages,
      activePage,
      filtersVisible,
      fit,
      refreshing,
      refreshNonce,
      resetNonce,
      shownAt,
      refreshedByHand,
      focus,
      toggleFocus,
      reportLoaded,
      reportRendered,
      reportFailed,
      pageChanged,
      selectPage,
      toggleFilters,
      setFit,
      refresh,
      reset,
    ],
  );

  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>;
}
