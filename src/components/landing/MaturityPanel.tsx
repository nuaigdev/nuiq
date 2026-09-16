"use client";

import { motion } from "framer-motion";
import type { Ref } from "react";

import { BoxContent } from "./BoxContent";
import { Icon } from "./LandingGlyphs";
import {
  MATURITY_LEVELS,
  MATURITY_PANEL as P,
  PLATFORM,
  STACK_CYCLE_S,
  STAGES,
  type MaturityLevel,
} from "./landing-data";

/**
 * The platform, expanded: the maturity path from the data foundation up
 * through Visualize, Converse and Advanced.
 *
 * Drawn in the landing diagram's own coordinate space, so the panel is the
 * platform rect literally growing — not a modal laid over the page — and every
 * size in it scales with the diagram at any viewport.
 *
 * The shape is a ziggurat: a wide foundation slab carrying the five platform
 * stages, with each level built narrower on top of it. Two other treatments
 * were built alongside this one and deleted once this was chosen.
 */

/* The content area below the header. */
const RIGHT = P.x + P.w - 40;
const BOTTOM = P.y + P.h - 32;
const CENTER_X = P.x + P.w / 2;

/** One lit level at a time, reusing the platform's sweep keyframes. */
const SWEEP_DELAY = (i: number) => `${(i * STACK_CYCLE_S) / MATURITY_LEVELS.length}s`;

const fade = (delay: number) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.12 } },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] as const },
});

/** Level n of 4, as equal segments — a level indicator, not a chart. */
function Meter({ level, size = "md" }: { level: number; size?: "sm" | "md" }) {
  const w = size === "sm" ? 9 : 16;
  const h = size === "sm" ? 3 : 4;
  return (
    <span
      className="inline-flex items-center gap-[3px]"
      aria-label={`Level ${level} of 4`}
    >
      {[1, 2, 3, 4].map((n) => (
        <span
          key={n}
          className="rounded-full"
          style={{
            width: w,
            height: h,
            background: n <= level ? "#c2d7fc" : "rgba(147,184,249,0.22)",
          }}
        />
      ))}
    </span>
  );
}

function LogoTile({ src, size = 30 }: { src: string; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-[8px] bg-white"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static local asset inside a foreignObject */}
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        style={{ width: size * 0.7, height: size * 0.7, objectFit: "contain" }}
      />
    </span>
  );
}

function Eyebrow({ level }: { level: MaturityLevel }) {
  return (
    <span className="text-[10.5px] font-semibold uppercase leading-none tracking-[0.14em] text-peak-300">
      Level {level.level} · {level.stage}
    </span>
  );
}

/**
 * A level that is also a destination renders as a real link, the same way the
 * destination cards do: genuine href, client-side navigation on click.
 */
function LevelLink({
  level,
  onNavigate,
  children,
}: {
  level: MaturityLevel;
  onNavigate: (href: string) => void;
  children: React.ReactNode;
}) {
  if (!level.href) return <g>{children}</g>;
  const href = level.href;
  return (
    <a
      href={href}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        onNavigate(href);
      }}
      aria-label={`${level.stage}: ${level.name} — ${level.question}`}
      className="group/level focus:outline-none"
      style={{ cursor: "pointer" }}
    >
      {children}
    </a>
  );
}

/* ------------------------------------------------------------------------ */
/* B · Stack — a foundation slab with each level built narrower on top.      */
/* ------------------------------------------------------------------------ */

function Stack({
  reduced,
  onNavigate,
}: {
  reduced: boolean;
  onNavigate: (href: string) => void;
}) {
  const gap = 12;
  /* Each level is narrower than the one below it, but never so narrow that its
     name and its question crowd each other — level 4 asks the longest one. */
  const sizes = [
    { w: 1104, h: 150 },
    { w: 936, h: 104 },
    { w: 800, h: 104 },
    { w: 664, h: 104 },
  ];

  const slabs = MATURITY_LEVELS.map((level, i) => {
    const { w, h } = sizes[i];
    const below = sizes.slice(0, i).reduce((sum, s) => sum + s.h + gap, 0);
    const y = BOTTOM - below - h;
    return { level, w, h, y, x: CENTER_X - w / 2 };
  });

  const axisX = P.x + 40;
  const axisTop = slabs[3].y + 4;

  return (
    <g>
      {/* The maturity axis, rising up the left margin. */}
      <motion.g {...fade(0.3)}>
        <path
          d={`M ${axisX} ${BOTTOM} V ${axisTop}`}
          stroke="#93b8f9"
          strokeOpacity={0.45}
          strokeWidth={1.5}
        />
        <path
          d={`M ${axisX - 6} ${axisTop + 9} L ${axisX} ${axisTop} L ${axisX + 6} ${axisTop + 9}`}
          fill="none"
          stroke="#ffffff"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text
          x={axisX - 12}
          y={(BOTTOM + axisTop) / 2}
          textAnchor="middle"
          transform={`rotate(-90 ${axisX - 12} ${(BOTTOM + axisTop) / 2})`}
          className="fill-peak-300 text-[10.5px] font-semibold uppercase"
          letterSpacing="0.16em"
        >
          Maturity
        </text>
        {slabs.map(({ level, y, h }) => (
          <g key={level.stage}>
            <circle cx={axisX} cy={y + h / 2} r={3.5} fill="#c2d7fc" />
            <text
              x={axisX + 10}
              y={y + h / 2 + 4}
              className="fill-peak-200 text-[11px] font-semibold"
            >
              L{level.level}
            </text>
          </g>
        ))}
      </motion.g>

      {!reduced ? (
        <circle r="4.5" fill="#ffffff" filter="url(#packet-glow)">
          <animateMotion
            dur={`${STACK_CYCLE_S}s`}
            repeatCount="indefinite"
            path={`M ${axisX} ${BOTTOM} V ${axisTop}`}
          />
        </circle>
      ) : null}

      {slabs.map(({ level, w, h, y, x }, i) => (
        <LevelLink key={level.stage} level={level} onNavigate={onNavigate}>
          <motion.rect
            y={y}
            height={h}
            rx={12}
            initial={{ x: CENTER_X, width: 0, opacity: 0 }}
            animate={{ x, width: w, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 + i * 0.13, ease: [0.22, 1, 0.36, 1] }}
            fill={`rgba(59,116,240,${0.1 + i * 0.07})`}
            stroke={`rgba(194,215,252,${0.28 + i * 0.14})`}
            strokeWidth={1.25}
            className="transition-[fill] duration-200 group-hover/level:fill-[rgba(102,153,246,0.42)]"
          />
          {!reduced ? (
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx={12}
              fill="rgba(102,153,246,0.16)"
              stroke="#ffffff"
              strokeOpacity={0.6}
              strokeWidth={1.25}
              className="landing-stage-active"
              style={{ animationDelay: SWEEP_DELAY(i) }}
            />
          ) : null}

          <motion.g {...fade(0.5 + i * 0.13)}>
            {level.level === 1 ? (
              <BoxContent x={x} y={y} w={w} h={h} className="flex-row! gap-4 px-5">
                <span className="flex w-[230px] shrink-0 flex-col items-start text-left">
                  <Eyebrow level={level} />
                  <span className="mt-2.5 flex items-center gap-2.5">
                    <LogoTile src={level.logo} />
                    <span className="text-[16.5px] font-semibold leading-tight text-white">
                      {level.name}
                    </span>
                  </span>
                  <span className="mt-2.5 text-[14px] font-medium text-peak-100">
                    “{level.question}”
                  </span>
                  <span className="mt-2.5">
                    <Meter level={1} />
                  </span>
                </span>
                <span className="grid flex-1 grid-cols-5 gap-2.5">
                  {STAGES.map((stage) => (
                    <span
                      key={stage.id}
                      className="flex h-[96px] flex-col items-center justify-center gap-2 rounded-[10px] border border-peak-300/25 bg-white/5 px-2 text-center"
                    >
                      <Icon glyph={stage.glyph} size={22} className="text-peak-200" />
                      <span className="text-[11.5px] font-medium leading-tight text-white">
                        {stage.title}
                      </span>
                    </span>
                  ))}
                </span>
              </BoxContent>
            ) : (
              <BoxContent
                x={x}
                y={y}
                w={w}
                h={h}
                className="flex-row! justify-between! gap-8 px-5"
              >
                <span className="flex min-w-0 items-center gap-3 text-left">
                  <LogoTile src={level.logo} size={36} />
                  <span className="flex min-w-0 flex-col items-start">
                    <Eyebrow level={level} />
                    <span className="mt-1.5 truncate text-[16.5px] font-semibold leading-tight text-white">
                      {level.name}
                    </span>
                    <span className="mt-2">
                      <Meter level={level.level} />
                    </span>
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end text-right">
                  <span className="text-[14px] font-medium text-peak-100">
                    “{level.question}”
                  </span>
                  <span className="mt-1.5 text-[11px] text-peak-300">
                    {level.mode} · Open →
                  </span>
                </span>
              </BoxContent>
            )}
          </motion.g>
        </LevelLink>
      ))}

      {/* What each level gives you, read up the right margin. */}
      <motion.g {...fade(0.9)}>
        {slabs.map(({ level, w, y, h, x }) => {
          const labelX = RIGHT + 10;
          const from = x + w + 12;
          const to = labelX - 58;
          return (
            <g key={level.stage}>
              {to - from > 12 ? (
                <path
                  d={`M ${from} ${y + h / 2} H ${to}`}
                  stroke="#93b8f9"
                  strokeOpacity={0.35}
                  strokeDasharray="3 5"
                />
              ) : null}
              <text
                x={labelX}
                y={y + h / 2 + 4}
                textAnchor="end"
                className="fill-peak-100 text-[12px] font-semibold uppercase"
                letterSpacing="0.12em"
              >
                {level.value}
              </text>
            </g>
          );
        })}
      </motion.g>
    </g>
  );
}

/* ------------------------------------------------------------------------ */

export function MaturityPanel({
  onClose,
  onNavigate,
  reduced,
  closeRef,
}: {
  onClose: () => void;
  onNavigate: (href: string) => void;
  reduced: boolean;
  closeRef: Ref<HTMLButtonElement>;
}) {
  const grow = reduced ? { duration: 0 } : { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };
  const collapsed = { x: PLATFORM.x, y: PLATFORM.y, width: PLATFORM.w, height: PLATFORM.h };
  const expanded = { x: P.x, y: P.y, width: P.w, height: P.h };

  return (
    <g role="dialog" aria-modal="true" aria-label="Data maturity path">
      {/* The platform rect, growing into the panel. */}
      <motion.rect
        initial={collapsed}
        animate={expanded}
        exit={{ ...collapsed, transition: grow }}
        transition={grow}
        rx={22}
        fill="#0b1640"
        fillOpacity={0.94}
        stroke="rgba(194,215,252,0.5)"
        strokeWidth={1.25}
      />

      <motion.g {...fade(0.3)}>
        <BoxContent
          x={P.x + 40}
          y={P.y + 26}
          w={P.w - 80}
          h={78}
          interactive
          className="flex-row! items-start! justify-between!"
        >
          <span className="flex flex-col items-start text-left">
            <span className="text-[11px] font-semibold uppercase leading-none tracking-[0.18em] text-peak-300">
              Data maturity path
            </span>
            <span className="mt-2.5 text-[25px] font-semibold leading-none tracking-tight text-white">
              From a trusted foundation to agents that act
            </span>
            <span className="mt-2.5 text-[13px] leading-none text-peak-200">
              Each level is built on the one beneath it — dashboards, answers and
              agents are only as good as the governed data under them.
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-3">
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close the maturity path"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-peak-300/30 text-[18px] leading-none text-peak-100 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
            >
              ×
            </button>
          </span>
        </BoxContent>
      </motion.g>

      <Stack reduced={reduced} onNavigate={onNavigate} />
    </g>
  );
}
