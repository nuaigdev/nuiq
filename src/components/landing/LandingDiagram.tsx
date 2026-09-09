"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AXIS_Y,
  BUS_X,
  CANVAS,
  DESTINATIONS,
  DEST_BOX,
  INGEST_GATE,
  PLATFORM,
  SEMANTIC_STAGE_INDEX,
  SHIFT_Y,
  SOURCES,
  SOURCE_BOX,
  STACK_CYCLE_S,
  STAGES,
  STAGE_BOX,
  busPath,
  curve,
} from "./landing-data";
import { GlyphPaths, Icon, SourceMark } from "./LandingGlyphs";

/**
 * The landing diagram: every source system an operator runs, the Fabric
 * platform that unifies them, and the three ways into the portal.
 *
 * One SVG in one coordinate space (see landing-data.ts) rather than HTML boxes
 * with a measured overlay — the connector paths are computed from the same
 * numbers that place the boxes, so they cannot drift out of alignment at any
 * viewport width.
 *
 * The *contents* of each box are laid out as HTML inside a `foreignObject`.
 * SVG text cannot centre a mark and a label as a group without knowing how wide
 * the text renders, and it cannot know; flexbox can. So: one coordinate space,
 * real centring, nothing measured.
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
 * Most of these groups now contain a `foreignObject`, and Safari has long-
 * standing bugs positioning foreignObject inside a transformed SVG group. An
 * opacity-only entrance sidesteps that entirely, and the page's motion is
 * carried by the packets and the stage sweep rather than by this.
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

/**
 * HTML centred over a box, in the diagram's own coordinates. Pointer events are
 * off so the SVG rect underneath stays the hit target for hover and clicks.
 */
function BoxContent({
  x,
  y,
  w,
  h,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  children: React.ReactNode;
}) {
  return (
    <foreignObject
      x={x}
      y={y}
      width={w}
      height={h}
      style={{ pointerEvents: "none" }}
    >
      <div className="flex h-full w-full flex-col items-center justify-center text-center">
        {children}
      </div>
    </foreignObject>
  );
}

export function LandingDiagram() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [hoveredSource, setHovered] = useState<string | null>(null);
  const [hoveredDest, setHoveredDest] = useState<string | null>(null);

  const gateLeft = INGEST_GATE.x - INGEST_GATE.r;
  const gateRight = INGEST_GATE.x + INGEST_GATE.r;
  const stackRailX = STAGE_BOX.x - 13;

  // Feeds run orthogonally onto a shared spine rather than curving into one
  // point, which is what turned the left half into a web of crossing lines.
  const feeds = SOURCES.map((source) =>
    busPath(SOURCE_BOX.x + SOURCE_BOX.w, source.y, gateLeft, INGEST_GATE.y),
  );

  // The trunk runs level along the axis and lands on the rail the packet then
  // steps down, so outside and inside of the platform are one continuous path.
  const gateToPlatform = `M ${gateRight} ${AXIS_Y} H ${stackRailX}`;

  const busTop = Math.min(...SOURCES.map((s) => s.y));
  const busBottom = Math.max(...SOURCES.map((s) => s.y));
  const stackPath = `M ${stackRailX} ${STAGES[0].y} V ${STAGES[STAGES.length - 1].y}`;

  const outbound = DESTINATIONS.map((destination) =>
    curve(
      PLATFORM.x + PLATFORM.w,
      STAGES[SEMANTIC_STAGE_INDEX].y,
      DEST_BOX.x,
      destination.y,
    ),
  );

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
          const active = hoveredSource === SOURCES[i].name;
          return (
            <motion.path
              key={`feed-${SOURCES[i].name}`}
              d={path}
              fill="none"
              stroke={active ? "#ffffff" : "#93b8f9"}
              strokeOpacity={active ? 1 : hoveredSource ? 0.12 : 0.32}
              strokeWidth={active ? 2.2 : 1.25}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, delay: 0.2 + i * 0.035, ease: "easeOut" }}
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

        {!reduced ? (
          <>
            {feeds.map((path, i) => (
              <Packet
                key={`p-feed-${SOURCES[i].name}`}
                path={path}
                delay={i * 0.34}
                duration={4.2}
                active={hoveredSource === SOURCES[i].name}
                r={2.8}
              />
            ))}
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

      {/* ---- left: every source system ---- */}
      {SOURCES.map((source, i) => {
        const active = hoveredSource === source.name;
        return (
          <motion.g
            key={source.name}
            {...stagger(i)}
            onMouseEnter={() => setHovered(source.name)}
            onMouseLeave={() => setHovered(null)}
          >
            <rect
              x={SOURCE_BOX.x}
              y={source.y - SOURCE_BOX.h / 2}
              width={SOURCE_BOX.w}
              height={SOURCE_BOX.h}
              rx="8"
              fill={active ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)"}
              stroke={active ? "#c2d7fc" : "rgba(147,184,249,0.26)"}
              strokeWidth="1"
              className="transition-all duration-200"
            />
            <BoxContent
              x={SOURCE_BOX.x}
              y={source.y - SOURCE_BOX.h / 2}
              w={SOURCE_BOX.w}
              h={SOURCE_BOX.h}
            >
              <span className="flex items-center justify-center gap-2 px-3">
                <SourceMark logo={source.logo} glyph={source.glyph} size={23} />
                <span className="text-[13.5px] font-medium leading-none text-peak-100">
                  {source.name}
                </span>
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

      {/* ---- centre: the Fabric platform, on the canvas's vertical midline ---- */}
      <motion.g {...stagger(2, 0.08)}>
        <rect
          x={PLATFORM.x}
          y={PLATFORM.y}
          width={PLATFORM.w}
          height={PLATFORM.h}
          rx="20"
          fill="url(#platform-fill)"
          stroke="rgba(147,184,249,0.4)"
          strokeWidth="1.25"
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
      {!reduced ? (
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

      <motion.g {...stagger(6, 0.09)}>
        <text
          x={PLATFORM.x + PLATFORM.w / 2}
          y={PLATFORM.y + PLATFORM.h - 22}
          textAnchor="middle"
          className="fill-peak-300/70 text-[11.5px]"
          letterSpacing="0.06em"
        >
          Built on Microsoft Cloud · Enterprise grade · Governed &amp; compliant
        </text>
      </motion.g>

      {/* ---- right: the three ways in ---- */}
      {DESTINATIONS.map((destination, i) => {
        const active = hoveredDest === destination.href;
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
              router.push(destination.href);
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
              <p className="mt-3 px-6 text-[12px] leading-[1.45] text-peak-200/75">
                {destination.detail}
              </p>
              <span
                className={`mt-3 text-[12.5px] leading-none ${
                  active ? "font-semibold text-white" : "font-medium text-peak-300"
                }`}
              >
                Open →
              </span>
            </BoxContent>
          </motion.a>
        );
      })}
    </svg>
  );
}
