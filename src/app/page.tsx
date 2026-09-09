import Image from "next/image";

import { LandingDiagram } from "@/components/landing/LandingDiagram";

export const metadata = { title: "Landing" };

/**
 * The landing page.
 *
 * Deliberately outside the `(shell)` route group, so it renders with no top nav
 * and no footer: the diagram is the whole page, and the three cards on its right
 * are the way into the portal.
 *
 * Two departures from CLAUDE.md, both explicitly asked for and recorded in §5
 * and §8 there — do not "fix" them back:
 *   - the NuAIg mark appears here rather than only in a footer, and
 *   - this one page carries no nav and no footer credit.
 * Every other route still renders inside the shell with both.
 *
 * The page is still fully gated: src/proxy.ts stops the request before it
 * renders, and the root layout refuses to render children while signed out.
 */
export default function LandingPage() {
  return (
    <div className="landing-stage relative flex min-h-screen flex-col overflow-hidden">
      {/* Live background: three slow-drifting fields of the chrome gradient,
          over a fine grid. Pure CSS, so the reduced-motion rule in globals.css
          stops all of it. */}
      <div aria-hidden className="landing-aurora" />
      <div aria-hidden className="landing-grid" />

      <header className="relative z-10 flex justify-center px-6 pt-9">
        <Image
          src="/nuaig-logo-white.svg"
          alt="NuAIg"
          width={132}
          height={34}
          priority
          className="h-[34px] w-auto opacity-95"
        />
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-4 pb-6 pt-4">
        {/* Below ~1100px the twelve source rows stop being legible if the SVG is
            scaled to fit, so the canvas keeps a minimum width and scrolls
            sideways instead of shrinking into unreadability. */}
        <div className="h-full w-full overflow-x-auto">
          <div className="mx-auto h-full min-h-[560px] w-full min-w-[1100px]">
            <LandingDiagram />
          </div>
        </div>
      </div>
    </div>
  );
}
