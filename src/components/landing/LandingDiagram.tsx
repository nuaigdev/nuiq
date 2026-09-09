"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  BUS_X,
  CANVAS,
  DESTINATIONS,
  DEST_BOX,
  INGEST_GATE,
  PLATFORM,
  SEMANTIC_STAGE_INDEX,
  SOURCES,
  SHIFT_Y,
  SOURCE_BOX,
  STACK_CYCLE_S,
  STAGES,
  STAGE_BOX,
  busPath,
  curve,
} from "./landing-data";
import { SourceTile, StageGlyph } from "./LandingGlyphs";

/**
 * The landing diagram: every source system an operator runs, the Fabric
 * platform that unifies them, and the three ways into the portal.
 *
 * One SVG in one coordinate space (see landing-data.ts) rather than HTML boxes
 * with a measured overlay — the connector paths are computed from the same
 * numbers that place the boxes, so they cannot drift out of alignment at any
 * viewport width.
 *
 * Motion is the point here, not decoration: packets travel every feed, merge
 * onto the bus, pass the ingestion gate and then step down the platform stack
 * stage by stage, so the picture reads as a pipeline running rather than an
 * architecture chart. All of it is gated on `useReducedMotion` — SMIL animation
 * is *not* stopped by the prefers-reduced-motion rule in globals.css, which
 * only reaches CSS animations, so it has to be switched off in React instead.
 */

const stagger = (i: number, base = 0.04) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.5,
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

export function LandingDiagram() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [hoveredSource, setHovered] = useState<string | null>(null);
  const [hoveredDest, setHoveredDest] = useState<string | null>(null);

  const semanticY = STAGES[SEMANTIC_STAGE_INDEX].y;
  const gateLeft = INGEST_GATE.x - INGEST_GATE.r;
  const gateRight = INGEST_GATE.x + INGEST_GATE.r;

  // Feeds run orthogonally onto a shared spine rather than curving into one
  // point, which is what turned the left half into a web of crossing lines.
  const feeds = SOURCES.map((source) =>
    busPath(SOURCE_BOX.x + SOURCE_BOX.w, source.y, gateLeft, INGEST_GATE.y),
  );
  const gateToPlatform = `M ${gateRight} ${INGEST_GATE.y} H ${PLATFORM.x}`;

  // The spine itself, drawn once so it is a solid line rather than twelve
  // overlapping strokes of varying opacity.
  const busTop = Math.min(...SOURCES.map((s) => s.y));
  const busBottom = Math.max(...SOURCES.map((s) => s.y));

  // Inside the platform, the packet steps from stage 1 down to stage 5.
  const stackRailX = STAGE_BOX.x - 13;
  const stackPath = `M ${stackRailX} ${STAGES[0].y} V ${STAGES[STAGES.length - 1].y}`;

  const outbound = DESTINATIONS.map((destination) =>
    curve(PLATFORM.x + PLATFORM.w, semanticY, DEST_BOX.x, destination.y),
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

        {/* Gate into the platform: the one trunk everything has become. */}
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
            <SourceTile
              x={SOURCE_BOX.x + 9}
              y={source.y - 12}
              size={24}
              logo={source.logo}
              glyph={source.glyph}
            />
            <text
              x={SOURCE_BOX.x + 44}
              y={source.y + 5}
              className="fill-peak-100 text-[13.5px] font-medium"
            >
              {source.name}
            </text>
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
          transform={`translate(${INGEST_GATE.x - 14} ${INGEST_GATE.y - 14}) scale(1.16)`}
          className="text-white"
        >
          <StageGlyph glyph="governance" />
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

      {/* ---- centre: the Fabric platform ---- */}
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
        <image
          href="/logos/microsoft-fabric.png"
          x={PLATFORM.x + 26}
          y={PLATFORM.y + 24}
          width="42"
          height="42"
          preserveAspectRatio="xMidYMid meet"
        />
        <text
          x={PLATFORM.x + 80}
          y={PLATFORM.y + 46}
          className="fill-white text-[25px] font-semibold tracking-tight"
        >
          Microsoft Fabric
        </text>
        <text
          x={PLATFORM.x + 80}
          y={PLATFORM.y + 68}
          className="fill-peak-200 text-[13px]"
        >
          Unified Data Warehouse / Lakehouse
        </text>
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
              stroke={
                isSemantic ? "rgba(194,215,252,0.8)" : "rgba(147,184,249,0.24)"
              }
              strokeWidth={isSemantic ? 1.5 : 1}
            />

            {/* The stage the pipeline is "in" right now. A whole lit panel
                rather than a hairline, so the sweep is visible at hero size. */}
            {!reduced ? (
              <g className="landing-stage-active" style={{ animationDelay: delay }}>
                <rect
                  x={STAGE_BOX.x}
                  y={stage.y - STAGE_BOX.h / 2}
                  width={STAGE_BOX.w}
                  height={STAGE_BOX.h}
                  rx="10"
                  fill="rgba(102,153,246,0.3)"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <rect
                  x={STAGE_BOX.x}
                  y={stage.y - STAGE_BOX.h / 2}
                  width="4"
                  height={STAGE_BOX.h}
                  rx="2"
                  fill="#ffffff"
                />
              </g>
            ) : null}

            <g
              transform={`translate(${STAGE_BOX.x + 20} ${stage.y - 12}) scale(1.05)`}
              className={isSemantic ? "text-white" : "text-peak-200"}
            >
              <StageGlyph glyph={stage.glyph} />
            </g>

            <text
              x={STAGE_BOX.x + 62}
              y={stage.y - 4}
              className="fill-white text-[15.5px] font-semibold"
            >
              {stage.step}. {stage.title}
            </text>
            <text
              x={STAGE_BOX.x + 62}
              y={stage.y + 16}
              className="fill-peak-200/80 text-[12px]"
            >
              {stage.detail}
            </text>
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

            <rect
              x={DEST_BOX.x + 22}
              y={destination.y - DEST_BOX.h / 2 + 22}
              width="38"
              height="38"
              rx="10"
              fill="#ffffff"
            />
            <image
              href={destination.logo}
              x={DEST_BOX.x + 28}
              y={destination.y - DEST_BOX.h / 2 + 28}
              width="26"
              height="26"
              preserveAspectRatio="xMidYMid meet"
            />

            <text
              x={DEST_BOX.x + 74}
              y={destination.y - DEST_BOX.h / 2 + 47}
              className="fill-white text-[17px] font-semibold tracking-tight"
            >
              {destination.name}
            </text>

            <foreignObject
              x={DEST_BOX.x + 22}
              y={destination.y - DEST_BOX.h / 2 + 70}
              width={DEST_BOX.w - 44}
              height="44"
            >
              <p className="text-[12px] leading-[1.45] text-peak-200/75">
                {destination.detail}
              </p>
            </foreignObject>

            <text
              x={DEST_BOX.x + DEST_BOX.w - 22}
              y={destination.y + DEST_BOX.h / 2 - 14}
              textAnchor="end"
              className={
                active
                  ? "fill-white text-[12.5px] font-semibold"
                  : "fill-peak-300 text-[12.5px] font-medium"
              }
            >
              Open →
            </text>
          </motion.a>
        );
      })}
    </svg>
  );
}
