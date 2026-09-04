"use client";

import { MotionConfig, motion } from "framer-motion";

import { useViewportLock } from "@/lib/focus-mode";

import { DashboardChrome, type DashboardLink } from "./DashboardChrome";
import { ReportFrame, type ReportAccess } from "./ReportFrame";
import { ReportViewProvider, useReportView } from "./report-store";

/**
 * A single Power BI dashboard (CLAUDE.md §5 Tab 2).
 *
 * The route is locked to the viewport. Before this, the embed sat at a fixed
 * 78vh inside a page that also scrolled — so scrolling the page ran into the
 * report, whose own scroll then took over, and the two fought each other. Here
 * nothing scrolls but the report itself.
 *
 * Focus mode reuses exactly the mechanism the data agent workspace uses: the
 * header and footer slide out rather than unmount, and the frame grows over
 * them, so leaving focus restores the same geometry with nothing to reflow. The
 * chrome bar stays put in focus mode — a dashboard filling a screen still needs
 * its page tabs and a way back out.
 */

type WorkspaceProps = {
  reportId: string;
  reportName: string;
  pageName?: string;
  access: ReportAccess;
  dashboards: DashboardLink[];
};

function Workspace({
  reportId,
  pageName,
  access,
  dashboards,
}: Omit<WorkspaceProps, "reportName">) {
  const { focus } = useReportView();
  useViewportLock();

  return (
    <div className="h-full bg-canvas-ground">
      <motion.div
        layout
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        className={
          focus
            ? "fixed inset-0 z-[60] flex flex-col bg-surface"
            : "flex h-full flex-col bg-surface"
        }
      >
        <DashboardChrome dashboards={dashboards} currentId={reportId} />
        <div className="min-h-0 flex-1">
          <ReportFrame access={access} reportId={reportId} pageName={pageName} />
        </div>
      </motion.div>
    </div>
  );
}

export function DashboardWorkspace({ reportName, ...rest }: WorkspaceProps) {
  return (
    <ReportViewProvider reportName={reportName}>
      {/* reducedMotion="user" makes every animation below honour the setting. */}
      <MotionConfig reducedMotion="user">
        <Workspace {...rest} />
      </MotionConfig>
    </ReportViewProvider>
  );
}
