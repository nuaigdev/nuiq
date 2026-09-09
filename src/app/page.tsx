import type { Metadata } from "next";
import Image from "next/image";

import { LandingDiagram } from "@/components/landing/LandingDiagram";

/**
 * `absolute` deliberately bypasses the `%s · NuIQ` template in the root layout:
 * the landing page is NuAIg's, and its tab should say so.
 */
export const metadata: Metadata = { title: { absolute: "NuAIg" } };

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
    /*
     * Locked to the viewport: exactly 100dvh with nothing allowed to overflow,
     * so the page never scrolls and the diagram gets every pixel that is left
     * after the mark. `dvh` rather than `vh` because mobile browsers shrink the
     * viewport as their chrome collapses, and `vh` would leave the bottom of
     * the diagram under it.
     */
    <div className="landing-stage relative flex h-[100dvh] flex-col overflow-hidden">
      {/* Live background, back to front. Layered radial fields drifting at
          different speeds and directions, a slow sheen crossing them, and a
          grid for the light to move over — all CSS, so the reduced-motion rule
          in globals.css stops the lot. */}
      <div aria-hidden className="landing-grid" />
      <div aria-hidden className="landing-aurora" />
      <div aria-hidden className="landing-aurora-b" />
      <div aria-hidden className="landing-sheen" />
      <div aria-hidden className="landing-vignette" />

      <header className="relative z-10 flex shrink-0 justify-center px-6 pb-1 pt-5">
        <Image
          src="/nuaig-logo-white.svg"
          alt="NuAIg"
          width={124}
          height={32}
          priority
          className="h-8 w-auto"
        />
      </header>

      {/* min-h-0 lets this actually shrink inside the flex column; without it
          the SVG's intrinsic height wins and the page grows a scrollbar. */}
      <div className="relative z-10 min-h-0 flex-1 px-5 pb-4">
        <LandingDiagram />
      </div>
    </div>
  );
}
