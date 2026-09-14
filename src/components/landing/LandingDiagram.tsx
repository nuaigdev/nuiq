"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { BoxContent } from "./BoxContent";
import {
  AXIS_Y,
  BUS_X,
  CANVAS,
  DESTINATIONS,
  DEST_BOX,
  INGEST_GATE,
  MATURITY_LEVELS,
  PLATFORM,
  SEMANTIC_STAGE_INDEX,
  SHIFT_Y,
  SOURCE_CHIP,
  SOURCE_COL,
  SOURCE_GROUPS,
  SOURCE_GROUP_HEAD,
  STACK_CYCLE_S,
  STAGES,
  STAGE_BOX,
  busPath,
  curve,
} from "./landing-data";
import { GlyphPaths, Icon, SourceMark } from "./LandingGlyphs";
import { MaturityPanel, type MaturityVariant } from "./MaturityPanel";

/**
 * The landing diagram: every source system an operator runs, the Fabric
 * platform that unifies them, and the three ways into the portal.
 *
 * One SVG in one coordinate space (see landing-data.ts) rather than HTML boxes
 * with a measured overlay — the connector paths are computed from the same
 * numbers that place the boxes, so they cannot drift out of alignment at any
 * viewport width. The *contents* of each box are HTML in a `foreignObject`
 * (BoxContent), because only HTML can centre a mark and a label as a group.
 *
 * Clicking the platform expands it into the maturity path (MaturityPanel):
 * the foundation, and the three destinations as the levels built on it.
 *
 * Motion is the point here, not decoration: packets travel every feed, merge
 * onto the bus, pass the ingestion gate and then step down the platform stack
 * stage by stage, so the picture reads as a pipeline running rather than an
 * architecture chart. All of it is gated on `useReducedMotion` — SMIL animation
 * is *not* stopped by the prefers-reduced-motion rule in globals.css, which
 * only reaches CSS animations, so it has to be switched off in React instead.
 */

/**
 * The staggered entrance fades only — no translate.
 *
 * Most of these groups contain a `foreignObject`, and Safari has long-standing
 * bugs positioning foreignObject inside a transformed SVG group. An
 * opacity-only entrance sidesteps that entirely.
 */
const stagger = (i: number, base = 0.04) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: {
    duration: 0.55,
    delay: 0.15 + i * base,
    ease: [0.22, 1, 0.36, 1] as const,
  },
});

/** A packet travelling one path, on a loop. */
function Packet({
  path,
  delay,
  duration,
  active,
  r = 3,
}: {
  path: string;
  delay: number;
  duration: number;
  active: boolean;
  r?: number;
}) {
  return (
    <circle
      r={active ? r * 1.4 : r}
      className={active ? "fill-white" : "fill-peak-300"}
      filter="url(#packet-glow)"
    >
      <animateMotion
        dur={`${duration}s`}
        begin={`${delay}s`}
        repeatCount="indefinite"
        path={path}
        keyPoints="0;1"
        keyTimes="0;1"
        calcMode="linear"
      />
      <animate
        attributeName="opacity"
        values="0;1;1;0"
        keyTimes="0;0.08;0.88;1"
        dur={`${duration}s`}
        begin={`${delay}s`}
        repeatCount="indefinite"
      />
    </circle>
  );
}

/** Level n of 4, in miniature — the destination cards' place on the path. */
function MiniMeter({ level, bright }: { level: number; bright: boolean }) {
  return (
    <span className="inline-flex items-center gap-[2px]" aria-hidden>
      {[1, 2, 3, 4].map((n) => (
        <span
          key={n}
          className="h-[3px] w-[9px] rounded-full"
          style={{
            background:
              n <= level
                ? bright
                  ? "#ffffff"
                  : "#93b8f9"
                : "rgba(147,184,249,0.22)",
          }}
        />
      ))}
    </span>
  );
}

export function LandingDiagram() {
  const router = useRouter();
  const reduced = useReducedMotion() ?? false;
  const [hoveredSource, setHovered] = useState<string | null>(null);
  const [hoveredDest, setHoveredDest] = useState<string | null>(null);
  const [platformHover, setPlatformHover] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [variant, setVariant] = useState<MaturityVariant>("staircase");

  const platformRef = useRef<SVGGElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasExpanded = useRef(false);
  const diagramRef = useRef<SVGGElement>(null);

  // The receded diagram must not be reachable by Tab either. `inert` is set on
  // the DOM node because React's SVG props do not type it.
  useEffect(() => {
    diagramRef.current?.toggleAttribute("inert", expanded);
  }, [expanded]);

  // Escape closes; focus moves into the panel on open and back on close.
  useEffect(() => {
    if (expanded) {
      closeRef.current?.focus({ preventScroll: true });
      const onKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") setExpanded(false);
      };
      window.addEventListener("keydown", onKey);
      wasExpanded.current = true;
      return () => window.removeEventListener("keydown", onKey);
    }
    if (wasExpanded.current) {
      platformRef.current?.focus({ preventScroll: true });
      wasExpanded.current = false;
    }
  }, [expanded]);

  const gateLeft = INGEST_GATE.x - INGEST_GATE.r;
  const gateRight = INGEST_GATE.x + INGEST_GATE.r;
  const stackRailX = STAGE_BOX.x - 13;
  const groupRight = SOURCE_COL.x + SOURCE_COL.w;

  // One feed per domain, run orthogonally onto a shared spine rather than
  // curving into one point, which turns the left half into a web of lines.
  const feeds = SOURCE_GROUPS.map((group) =>
    busPath(groupRight, group.cy, gateLeft, INGEST_GATE.y),
  );

  // The trunk runs level along the axis and lands on the rail the packet then
  // steps down, so outside and inside of the platform are one continuous path.
  const gateToPlatform = `M ${gateRight} ${AXIS_Y} H ${stackRailX}`;

  const busTop = Math.min(...SOURCE_GROUPS.map((g) => g.cy));
  const busBottom = Math.max(...SOURCE_GROUPS.map((g) => g.cy));
  const stackPath = `M ${stackRailX} ${STAGES[0].y} V ${STAGES[STAGES.length - 1].y}`;

  const outbound = DESTINATIONS.map((destination) =>
    curve(
      PLATFORM.x + PLATFORM.w,
      STAGES[SEMANTIC_STAGE_INDEX].y,
      DEST_BOX.x,
      destination.y,
    ),
  );

  const navigate = (href: string) => router.push(href);

  const affordance = { w: 244, h: 30, y: PLATFORM.y + PLATFORM.h - 44 };

  return (
    <svg
      /* The origin is offset by SHIFT_Y rather than wrapping the drawing in a
         translated group: same lift, and every coordinate below still means
         what landing-data.ts says it means. */
      viewBox={`0 ${SHIFT_Y} ${CANVAS.w} ${CANVAS.h}`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      role="group"
      aria-label="How data reaches this portal: senior living source systems flow through secure ingestion into the Microsoft Fabric platform, and out to dashboards and agents."
    >
      <defs>
        <linearGradient id="platform-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d3a9e" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#070d26" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="trunk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6699f6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#c2d7fc" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="rail" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#93b8f9" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#93b8f9" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#93b8f9" stopOpacity="0.15" />
        </linearGradient>
        {/* Packets glow so movement reads at a glance across a wide canvas. */}
        <filter id="packet-glow" x="-300%" y="-300%" width="700%" height="700%">
          <feGaussianBlur stdDeviation="2.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="gate-glow" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* The whole diagram, which recedes while the maturity path is open.
          Opacity only — no transform — for the Safari foreignObject reason. */}
      <motion.g
        animate={{ opacity: expanded ? 0.12 : 1 }}
        transition={{ duration: reduced ? 0 : 0.4 }}
        style={{ pointerEvents: expanded ? "none" : undefined }}
        aria-hidden={expanded || undefined}
        ref={diagramRef}
      >
        {/* ---- feeds, behind everything ---- */}
        <g>
          {/* The spine, drawn once. */}
          <motion.path
            d={`M ${BUS_X} ${busTop} V ${busBottom}`}
            fill="none"
            stroke="#93b8f9"
            strokeOpacity={0.35}
            strokeWidth={1.5}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
          />

          {feeds.map((path, i) => {
            const active = hoveredSource === SOURCE_GROUPS[i].id;
            return (
              <motion.path
                key={`feed-${SOURCE_GROUPS[i].id}`}
                d={path}
                fill="none"
                stroke={active ? "#ffffff" : "#93b8f9"}
                strokeOpacity={active ? 1 : hoveredSource ? 0.12 : 0.32}
                strokeWidth={active ? 2.2 : 1.25}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.9, delay: 0.2 + i * 0.05, ease: "easeOut" }}
              />
            );
          })}

          <motion.path
            d={gateToPlatform}
            fill="none"
            stroke="url(#trunk)"
            strokeWidth={5}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.85, ease: "easeOut" }}
          />

          {outbound.map((path, i) => {
            const active = hoveredDest === DESTINATIONS[i].href;
            return (
              <motion.path
                key={`edge-out-${DESTINATIONS[i].href}`}
                d={path}
                fill="none"
                stroke={active ? "#ffffff" : "#93b8f9"}
                strokeOpacity={active ? 1 : hoveredDest ? 0.14 : 0.4}
                strokeWidth={active ? 2.4 : 1.5}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: 1 + i * 0.1, ease: "easeOut" }}
              />
            );
          })}

          {!reduced && !expanded ? (
            <>
              {/* Busier domains carry more traffic: one packet per two systems. */}
              {feeds.flatMap((path, i) => {
                const group = SOURCE_GROUPS[i];
                const count = Math.max(1, Math.round(group.systems.length / 2));
                return Array.from({ length: count }, (_, k) => (
                  <Packet
                    key={`p-feed-${group.id}-${k}`}
                    path={path}
                    delay={i * 0.55 + (k * 4.2) / count}
                    duration={4.2}
                    active={hoveredSource === group.id}
                    r={2.8}
                  />
                ));
              })}
              {[0, 0.5, 1, 1.5].map((delay) => (
                <Packet
                  key={`p-trunk-${delay}`}
                  path={gateToPlatform}
                  delay={delay}
                  duration={0.9}
                  active={false}
                  r={4}
                />
              ))}
              {outbound.map((path, i) => (
                <Packet
                  key={`p-out-${DESTINATIONS[i].href}`}
                  path={path}
                  delay={0.4 + i * 0.6}
                  duration={2.4}
                  active={hoveredDest === DESTINATIONS[i].href}
                  r={3.2}
                />
              ))}
            </>
          ) : null}
        </g>

        {/* ---- left: every source system, grouped by domain ---- */}
        {SOURCE_GROUPS.map((group, i) => {
          const active = hoveredSource === group.id;
          return (
            <motion.g
              key={group.id}
              {...stagger(i, 0.06)}
              onMouseEnter={() => setHovered(group.id)}
              onMouseLeave={() => setHovered(null)}
              role="group"
              aria-label={`${group.label}: ${group.systems
                .map((s) => s.fullName ?? s.name)
                .join(", ")}`}
            >
              <rect
                x={SOURCE_COL.x}
                y={group.y}
                width={SOURCE_COL.w}
                height={group.h}
                rx="10"
                fill={active ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.045)"}
                stroke={active ? "#c2d7fc" : "rgba(147,184,249,0.24)"}
                strokeWidth="1"
                className="transition-all duration-200"
              />
              <BoxContent
                x={SOURCE_COL.x}
                y={group.y}
                w={SOURCE_COL.w}
                h={group.h}
                align="left"
                justify="start"
              >
                <span
                  className="flex w-full items-center justify-between px-2.5"
                  style={{ height: SOURCE_GROUP_HEAD }}
                >
                  <span
                    className={`text-[10px] font-semibold uppercase leading-none tracking-[0.14em] ${
                      active ? "text-white" : "text-peak-300"
                    }`}
                  >
                    {group.label}
                  </span>
                  <span className="text-[10px] font-medium leading-none text-peak-300/70">
                    {group.systems.length}
                  </span>
                </span>
                <span
                  className="grid w-full px-2"
                  style={{
                    gridTemplateColumns: `repeat(${SOURCE_CHIP.cols}, minmax(0, 1fr))`,
                    gridAutoRows: SOURCE_CHIP.h,
                    gap: SOURCE_CHIP.gap,
                  }}
                >
                  {group.systems.map((system) => (
                    <span
                      key={system.name}
                      className="flex min-w-0 items-center gap-1.5 rounded-[6px] bg-white/[0.06] px-1"
                    >
                      <SourceMark logo={system.logo} glyph={system.glyph} size={18} />
                      <span className="truncate text-[11px] font-medium leading-none text-peak-100">
                        {system.name}
                      </span>
                    </span>
                  ))}
                </span>
              </BoxContent>
            </motion.g>
          );
        })}

        {/* ---- the ingestion gate every feed passes through ---- */}
        <motion.g {...stagger(12, 0.03)}>
          {!reduced ? (
            <>
              <circle
                cx={INGEST_GATE.x}
                cy={INGEST_GATE.y}
                r={INGEST_GATE.r}
                fill="none"
                stroke="#93b8f9"
                strokeWidth="1.5"
                className="landing-pulse-ring"
              />
              <circle
                cx={INGEST_GATE.x}
                cy={INGEST_GATE.y}
                r={INGEST_GATE.r}
                fill="none"
                stroke="#6699f6"
                strokeWidth="1.5"
                className="landing-pulse-ring"
                style={{ animationDelay: "1.1s" }}
              />
            </>
          ) : null}
          <circle
            cx={INGEST_GATE.x}
            cy={INGEST_GATE.y}
            r={INGEST_GATE.r}
            fill="rgba(36,80,214,0.4)"
            stroke="#93b8f9"
            strokeWidth="1.5"
            filter="url(#gate-glow)"
            className={reduced ? undefined : "landing-gate-core"}
          />
          <g
            transform={`translate(${INGEST_GATE.x - 15} ${INGEST_GATE.y - 15}) scale(1.25)`}
            className="text-white"
          >
            <GlyphPaths glyph="governance" />
          </g>
          <text
            x={INGEST_GATE.x}
            y={INGEST_GATE.y + INGEST_GATE.r + 20}
            textAnchor="middle"
            className="fill-peak-200 text-[11.5px] font-medium"
          >
            Secure ingestion
          </text>
        </motion.g>

        {/* ---- centre: the Fabric platform — the foundation, and a button ---- */}
        <g
          ref={platformRef}
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          aria-label="Microsoft Fabric, the data foundation. Open the data maturity path."
          onClick={() => setExpanded(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setExpanded(true);
            }
          }}
          onMouseEnter={() => setPlatformHover(true)}
          onMouseLeave={() => setPlatformHover(false)}
          onFocus={() => setPlatformHover(true)}
          onBlur={() => setPlatformHover(false)}
          style={{ cursor: "pointer" }}
          className="focus:outline-none"
        >
          <motion.g {...stagger(2, 0.08)}>
            <rect
              x={PLATFORM.x}
              y={PLATFORM.y}
              width={PLATFORM.w}
              height={PLATFORM.h}
              rx="20"
              fill="url(#platform-fill)"
              stroke={platformHover ? "rgba(255,255,255,0.85)" : "rgba(147,184,249,0.4)"}
              strokeWidth={platformHover ? 1.75 : 1.25}
              className="transition-all duration-200"
            />
            <BoxContent x={PLATFORM.x} y={PLATFORM.y + 14} w={PLATFORM.w} h={112}>
              {/* eslint-disable-next-line @next/next/no-img-element -- static local asset inside a foreignObject */}
              <img
                src="/logos/microsoft-fabric.png"
                alt=""
                width={40}
                height={40}
                style={{ width: 40, height: 40 }}
              />
              <span className="mt-1.5 text-[25px] font-semibold leading-none tracking-tight text-white">
                Microsoft Fabric
              </span>
              <span className="mt-2.5 text-[13px] leading-none text-peak-200">
                Unified Data Warehouse / Lakehouse
              </span>
            </BoxContent>
          </motion.g>

          {/* The rail the packet runs down, so the five stages read as one path. */}
          <path
            d={stackPath}
            fill="none"
            stroke="url(#rail)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {STAGES.map((stage, i) => {
            const isSemantic = i === SEMANTIC_STAGE_INDEX;
            const delay = `${(i * STACK_CYCLE_S) / STAGES.length}s`;
            return (
              <motion.g key={stage.id} {...stagger(i, 0.09)}>
                <rect
                  x={STAGE_BOX.x}
                  y={stage.y - STAGE_BOX.h / 2}
                  width={STAGE_BOX.w}
                  height={STAGE_BOX.h}
                  rx="10"
                  fill={isSemantic ? "rgba(59,116,240,0.24)" : "rgba(255,255,255,0.05)"}
                  stroke={isSemantic ? "rgba(194,215,252,0.8)" : "rgba(147,184,249,0.24)"}
                  strokeWidth={isSemantic ? 1.5 : 1}
                />

                {/* The stage the pipeline is "in" right now. A whole lit panel
                    rather than a hairline, so the sweep is visible at hero size. */}
                {!reduced ? (
                  <rect
                    x={STAGE_BOX.x}
                    y={stage.y - STAGE_BOX.h / 2}
                    width={STAGE_BOX.w}
                    height={STAGE_BOX.h}
                    rx="10"
                    fill="rgba(102,153,246,0.3)"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="landing-stage-active"
                    style={{ animationDelay: delay }}
                  />
                ) : null}

                <BoxContent
                  x={STAGE_BOX.x}
                  y={stage.y - STAGE_BOX.h / 2}
                  w={STAGE_BOX.w}
                  h={STAGE_BOX.h}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Icon
                      glyph={stage.glyph}
                      size={21}
                      className={isSemantic ? "text-white" : "text-peak-200"}
                    />
                    <span className="text-[15.5px] font-semibold leading-none text-white">
                      {stage.step}. {stage.title}
                    </span>
                  </span>
                  <span className="mt-2.5 px-4 text-[12px] leading-none text-peak-200/80">
                    {stage.detail}
                  </span>
                </BoxContent>
              </motion.g>
            );
          })}

          {/* The packet stepping down the stack, in time with the lit stage. */}
          {!reduced && !expanded ? (
            <circle r="5" fill="#ffffff" filter="url(#packet-glow)">
              <animateMotion
                dur={`${STACK_CYCLE_S}s`}
                repeatCount="indefinite"
                path={stackPath}
                keyPoints="0;0;0.25;0.25;0.5;0.5;0.75;0.75;1;1"
                keyTimes="0;0.14;0.2;0.34;0.4;0.54;0.6;0.74;0.8;1"
                calcMode="linear"
              />
            </circle>
          ) : null}

          {/* The way in to the maturity path. It replaces a tagline, and says
              what clicking the platform does before anyone has to guess. */}
          <motion.g {...stagger(7, 0.09)}>
            <rect
              x={PLATFORM.x + PLATFORM.w / 2 - affordance.w / 2}
              y={affordance.y}
              width={affordance.w}
              height={affordance.h}
              rx={affordance.h / 2}
              fill={platformHover ? "#ffffff" : "rgba(255,255,255,0.08)"}
              stroke={platformHover ? "#ffffff" : "rgba(194,215,252,0.45)"}
              className={`transition-all duration-200 ${
                platformHover || reduced ? "" : "landing-affordance"
              }`}
            />
            <BoxContent
              x={PLATFORM.x + PLATFORM.w / 2 - affordance.w / 2}
              y={affordance.y}
              w={affordance.w}
              h={affordance.h}
            >
              <span
                className={`flex items-center gap-2 text-[12px] font-semibold leading-none ${
                  platformHover ? "text-peak-900" : "text-white"
                }`}
              >
                <MiniMeter level={4} bright={!platformHover} />
                Explore the maturity path
                <span aria-hidden>↗</span>
              </span>
            </BoxContent>
          </motion.g>
        </g>

        {/* ---- right: the three ways in ---- */}
        {DESTINATIONS.map((destination, i) => {
          const active = hoveredDest === destination.href;
          const stage = MATURITY_LEVELS[destination.level - 1].stage;
          return (
            <motion.a
              key={destination.href}
              href={destination.href}
              {...stagger(i, 0.12)}
              onClick={(event) => {
                // Client-side nav, but the real href stays on the element so the
                // card is a genuine link: middle-click, copy-link and no-JS all
                // behave the way a link should.
                if (event.metaKey || event.ctrlKey || event.shiftKey) return;
                event.preventDefault();
                navigate(destination.href);
              }}
              onMouseEnter={() => setHoveredDest(destination.href)}
              onMouseLeave={() => setHoveredDest(null)}
              onFocus={() => setHoveredDest(destination.href)}
              onBlur={() => setHoveredDest(null)}
              aria-label={`${destination.name} — ${destination.detail}`}
              style={{ cursor: "pointer" }}
              className="focus:outline-none"
            >
              <rect
                x={DEST_BOX.x}
                y={destination.y - DEST_BOX.h / 2}
                width={DEST_BOX.w}
                height={DEST_BOX.h}
                rx="14"
                fill={active ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)"}
                stroke={active ? "#ffffff" : "rgba(147,184,249,0.3)"}
                strokeWidth={active ? 1.75 : 1}
                className="transition-all duration-200"
              />
              <BoxContent
                x={DEST_BOX.x}
                y={destination.y - DEST_BOX.h / 2}
                w={DEST_BOX.w}
                h={DEST_BOX.h}
              >
                <span className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase leading-none tracking-[0.16em] text-peak-300">
                  {stage}
                  <MiniMeter level={destination.level} bright={active} />
                </span>
                <span className="flex items-center justify-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element -- static local asset inside a foreignObject */}
                    <img
                      src={destination.logo}
                      alt=""
                      width={25}
                      height={25}
                      style={{ width: 25, height: 25, objectFit: "contain" }}
                    />
                  </span>
                  <span className="text-[17px] font-semibold leading-none tracking-tight text-white">
                    {destination.name}
                  </span>
                </span>
                <p className="mt-2.5 px-6 text-[12px] leading-[1.45] text-peak-200/75">
                  {destination.detail}
                </p>
                <span
                  className={`mt-2.5 text-[12.5px] leading-none ${
                    active ? "font-semibold text-white" : "font-medium text-peak-300"
                  }`}
                >
                  Open →
                </span>
              </BoxContent>
            </motion.a>
          );
        })}
      </motion.g>

      {/* ---- the maturity path: the platform, expanded ---- */}
      <AnimatePresence>
        {expanded ? (
          <motion.g key="maturity" exit={{ opacity: 1 }}>
            {/* Clicking anywhere off the panel closes it. */}
            <rect
              x={0}
              y={SHIFT_Y}
              width={CANVAS.w}
              height={CANVAS.h}
              fill="transparent"
              onClick={() => setExpanded(false)}
            />
            <MaturityPanel
              variant={variant}
              onVariant={setVariant}
              onClose={() => setExpanded(false)}
              onNavigate={navigate}
              reduced={reduced}
              closeRef={closeRef}
            />
          </motion.g>
        ) : null}
      </AnimatePresence>
    </svg>
  );
}
