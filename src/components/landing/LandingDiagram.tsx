"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  CANVAS,
  DESTINATIONS,
  DEST_BOX,
  INGEST_GATE,
  PLATFORM,
  SEMANTIC_STAGE_INDEX,
  SOURCES,
  SOURCE_BOX,
  STAGES,
  STAGE_BOX,
  curve,
} from "./landing-data";
import { SourceTile, StageGlyph } from "./LandingGlyphs";

/**
 * The landing diagram: every source system an operator runs, the Fabric
 * platform that unifies them, and the three ways into the portal.
 *
 * One SVG in one coordinate space (see landing-data.ts) rather than HTML boxes
 * with a measured overlay — the connector curves are computed from the same
 * numbers that place the boxes, so they cannot drift out of alignment at any
 * viewport width.
 *
 * Motion is the point here, not decoration: particles travel every edge so the
 * diagram reads as data moving rather than a static architecture chart. All of
 * it is gated on `useReducedMotion` — SMIL animation is *not* stopped by the
 * prefers-reduced-motion rule in globals.css, which only reaches CSS
 * animations, so it has to be switched off in React instead.
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

function ColumnHeading({ x, children }: { x: number; children: string }) {
  return (
    <text
      x={x}
      y={88}
      className="fill-peak-300/70 text-[13px] font-semibold uppercase"
      letterSpacing="0.14em"
    >
      {children}
    </text>
  );
}

/** A dot travelling one edge, on a loop. */
function Particle({
  path,
  delay,
  duration = 3.4,
  active,
}: {
  path: string;
  delay: number;
  duration?: number;
  active: boolean;
}) {
  return (
    <circle r={active ? 3.6 : 2.6} className={active ? "fill-white" : "fill-peak-400"}>
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
        keyTimes="0;0.1;0.85;1"
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

  const inbound = SOURCES.map((source) =>
    curve(SOURCE_BOX.x + SOURCE_BOX.w, source.y, INGEST_GATE.x - 30, INGEST_GATE.y),
  );
  const gateToPlatform = curve(
    INGEST_GATE.x + 30,
    INGEST_GATE.y,
    PLATFORM.x,
    STAGES[0].y,
  );
  const outbound = DESTINATIONS.map((destination) =>
    curve(PLATFORM.x + PLATFORM.w, semanticY, DEST_BOX.x, destination.y),
  );

  return (
    <svg
      viewBox={`0 0 ${CANVAS.w} ${CANVAS.h}`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      role="group"
      aria-label="How data reaches this portal: senior living source systems flow through secure ingestion into the Microsoft Fabric platform, and out to dashboards and agents."
    >
      <defs>
        {/* The one gradient family the chrome already uses (§8). */}
        <linearGradient id="platform-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16276b" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#0b1436" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="edge-live" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b74f0" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#93b8f9" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#3b74f0" stopOpacity="0.15" />
        </linearGradient>
        <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <motion.g {...stagger(0)}>
        <ColumnHeading x={SOURCE_BOX.x}>Source systems</ColumnHeading>
        <ColumnHeading x={DEST_BOX.x}>In this portal</ColumnHeading>
      </motion.g>

      {/* ---- edges, behind everything ---- */}
      <g>
        {inbound.map((path, i) => {
          const active = hoveredSource === SOURCES[i].name;
          return (
            <motion.path
              key={`edge-in-${SOURCES[i].name}`}
              d={path}
              fill="none"
              stroke={active ? "#c2d7fc" : "#93b8f9"}
              strokeOpacity={active ? 0.9 : hoveredSource ? 0.12 : 0.28}
              strokeWidth={active ? 2 : 1.25}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, delay: 0.2 + i * 0.04, ease: "easeOut" }}
            />
          );
        })}

        <motion.path
          d={gateToPlatform}
          fill="none"
          stroke="url(#edge-live)"
          strokeWidth={3}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7, delay: 0.7, ease: "easeOut" }}
        />

        {outbound.map((path, i) => {
          const active = hoveredDest === DESTINATIONS[i].href;
          return (
            <motion.path
              key={`edge-out-${DESTINATIONS[i].href}`}
              d={path}
              fill="none"
              stroke={active ? "#c2d7fc" : "#93b8f9"}
              strokeOpacity={active ? 0.95 : hoveredDest ? 0.14 : 0.35}
              strokeWidth={active ? 2.4 : 1.5}
              strokeDasharray="4 5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 0.9 + i * 0.1, ease: "easeOut" }}
            />
          );
        })}

        {!reduced ? (
          <>
            {inbound.map((path, i) => (
              <Particle
                key={`p-in-${SOURCES[i].name}`}
                path={path}
                delay={i * 0.26}
                duration={3.1}
                active={hoveredSource === SOURCES[i].name}
              />
            ))}
            <Particle path={gateToPlatform} delay={0.4} duration={1.6} active={false} />
            <Particle path={gateToPlatform} delay={1.2} duration={1.6} active={false} />
            {outbound.map((path, i) => (
              <Particle
                key={`p-out-${DESTINATIONS[i].href}`}
                path={path}
                delay={0.5 + i * 0.7}
                duration={2.6}
                active={hoveredDest === DESTINATIONS[i].href}
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
            style={{ cursor: "default" }}
          >
            <rect
              x={SOURCE_BOX.x}
              y={source.y - SOURCE_BOX.h / 2}
              width={SOURCE_BOX.w}
              height={SOURCE_BOX.h}
              rx="8"
              fill={active ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.06)"}
              stroke={active ? "#93b8f9" : "rgba(147,184,249,0.28)"}
              strokeWidth="1"
              className="transition-all duration-200"
            />
            <SourceTile
              x={SOURCE_BOX.x + 10}
              y={source.y - 13}
              size={26}
              logo={source.logo}
              glyph={source.glyph}
            />
            <text
              x={SOURCE_BOX.x + 48}
              y={source.y + 5}
              className="fill-peak-100 text-[14px] font-medium"
            >
              {source.name}
            </text>
          </motion.g>
        );
      })}

      {/* ---- the ingestion gate every source passes through ---- */}
      <motion.g {...stagger(12, 0.03)}>
        <rect
          x={INGEST_GATE.x - 30}
          y={INGEST_GATE.y - 30}
          width="60"
          height="60"
          rx="14"
          fill="rgba(36,80,214,0.3)"
          stroke="rgba(102,153,246,0.7)"
          strokeWidth="1.25"
        />
        <g
          transform={`translate(${INGEST_GATE.x - 14} ${INGEST_GATE.y - 16}) scale(1.15)`}
          className="text-peak-200"
        >
          <StageGlyph glyph="governance" />
        </g>
        <text
          x={INGEST_GATE.x}
          y={INGEST_GATE.y + 48}
          textAnchor="middle"
          className="fill-peak-300/80 text-[11px] font-medium"
        >
          Secure ingestion
        </text>
        {!reduced ? (
          <circle
            cx={INGEST_GATE.x}
            cy={INGEST_GATE.y}
            r="30"
            fill="none"
            stroke="#6699f6"
            strokeWidth="1"
            className="landing-pulse-ring"
          />
        ) : null}
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
          stroke="rgba(102,153,246,0.45)"
          strokeWidth="1.25"
        />

        <image
          href="/logos/microsoft-fabric.png"
          x={PLATFORM.x + 30}
          y={PLATFORM.y + 26}
          width="38"
          height="38"
          preserveAspectRatio="xMidYMid meet"
        />
        <text
          x={PLATFORM.x + 80}
          y={PLATFORM.y + 46}
          className="fill-white text-[24px] font-semibold tracking-tight"
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

      {STAGES.map((stage, i) => {
        const isSemantic = i === SEMANTIC_STAGE_INDEX;
        return (
          <motion.g key={stage.id} {...stagger(i, 0.09)}>
            <rect
              x={STAGE_BOX.x}
              y={stage.y - STAGE_BOX.h / 2}
              width={STAGE_BOX.w}
              height={STAGE_BOX.h}
              rx="10"
              fill={isSemantic ? "rgba(59,116,240,0.22)" : "rgba(255,255,255,0.05)"}
              stroke={
                isSemantic ? "rgba(147,184,249,0.75)" : "rgba(147,184,249,0.24)"
              }
              strokeWidth={isSemantic ? 1.5 : 1}
            />
            {/* The stage indicator sweeps 1 → 5 on a loop, so the stack reads as
                a pipeline rather than a list. */}
            {!reduced ? (
              <rect
                x={STAGE_BOX.x}
                y={stage.y - STAGE_BOX.h / 2}
                width="3"
                height={STAGE_BOX.h}
                rx="1.5"
                className="landing-stage-bar"
                style={{ animationDelay: `${i * 0.9}s` }}
                fill="#93b8f9"
              />
            ) : null}

            <g
              transform={`translate(${STAGE_BOX.x + 20} ${stage.y - 12}) scale(1.05)`}
              className={isSemantic ? "text-white" : "text-peak-300"}
            >
              <StageGlyph glyph={stage.glyph} />
            </g>

            <text
              x={STAGE_BOX.x + 62}
              y={stage.y - 4}
              className="fill-white text-[15px] font-semibold"
            >
              {stage.step}. {stage.title}
            </text>
            <text
              x={STAGE_BOX.x + 62}
              y={stage.y + 15}
              className="fill-peak-200/80 text-[11.5px]"
            >
              {stage.detail}
            </text>
          </motion.g>
        );
      })}

      <motion.g {...stagger(6, 0.09)}>
        <text
          x={PLATFORM.x + PLATFORM.w / 2}
          y={PLATFORM.y + PLATFORM.h - 34}
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
              fill={active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)"}
              stroke={active ? "#c2d7fc" : "rgba(147,184,249,0.3)"}
              strokeWidth={active ? 1.75 : 1}
              className="transition-all duration-200"
            />

            <rect
              x={DEST_BOX.x + 20}
              y={destination.y - DEST_BOX.h / 2 + 20}
              width="34"
              height="34"
              rx="9"
              fill="#ffffff"
            />
            <image
              href={destination.logo}
              x={DEST_BOX.x + 25}
              y={destination.y - DEST_BOX.h / 2 + 25}
              width="24"
              height="24"
              preserveAspectRatio="xMidYMid meet"
            />

            <text
              x={DEST_BOX.x + 66}
              y={destination.y - DEST_BOX.h / 2 + 42}
              className="fill-white text-[15.5px] font-semibold tracking-tight"
            >
              {destination.name}
            </text>

            <foreignObject
              x={DEST_BOX.x + 20}
              y={destination.y - DEST_BOX.h / 2 + 60}
              width={DEST_BOX.w - 40}
              height="46"
            >
              <p className="text-[11.5px] leading-[1.45] text-peak-200/75">
                {destination.detail}
              </p>
            </foreignObject>

            <text
              x={DEST_BOX.x + DEST_BOX.w - 20}
              y={destination.y + DEST_BOX.h / 2 - 12}
              textAnchor="end"
              className={
                active
                  ? "fill-white text-[12px] font-medium"
                  : "fill-peak-300 text-[12px] font-medium"
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
