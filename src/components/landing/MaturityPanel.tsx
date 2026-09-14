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
 * EXPERIMENT: three treatments of the same content, switchable from the panel
 * header, so one can be chosen on the real page. Once one is picked the other
 * two and the switcher are deleted; nothing else depends on them.
 */

export const MATURITY_VARIANTS = [
  { id: "staircase", label: "A · Staircase" },
  { id: "stack", label: "B · Stack" },
  { id: "bars", label: "C · Bars" },
] as const;

export type MaturityVariant = (typeof MATURITY_VARIANTS)[number]["id"];

/* The content area below the header, shared by every variant. */
const LEFT = P.x + 40;
const RIGHT = P.x + P.w - 40;
const WIDTH = RIGHT - LEFT;
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

/** A dashed rising line through `points`, with a packet climbing it. */
function AscentLine({
  points,
  reduced,
  delay,
}: {
  points: [number, number][];
  reduced: boolean;
  delay: number;
}) {
  const d = points.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ");
  const [ex, ey] = points[points.length - 1];
  const [px, py] = points[points.length - 2];
  const angle = (Math.atan2(ey - py, ex - px) * 180) / Math.PI;
  return (
    <g>
      <motion.path
        d={d}
        fill="none"
        stroke="#c2d7fc"
        strokeOpacity={0.55}
        strokeWidth={1.5}
        strokeDasharray="5 6"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.9, delay, ease: "easeOut" }}
      />
      <motion.path
        d="M -9 -5 L 0 0 L -9 5"
        fill="none"
        stroke="#ffffff"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        transform={`translate(${ex} ${ey}) rotate(${angle})`}
        {...fade(delay + 0.8)}
      />
      {!reduced ? (
        <circle r="4.5" fill="#ffffff" filter="url(#packet-glow)">
          <animateMotion
            dur="3.2s"
            begin={`${delay + 0.9}s`}
            repeatCount="indefinite"
            path={d}
          />
          <animate
            attributeName="opacity"
            values="0;1;1;0"
            keyTimes="0;0.1;0.85;1"
            dur="3.2s"
            begin={`${delay + 0.9}s`}
            repeatCount="indefinite"
          />
        </circle>
      ) : null}
    </g>
  );
}

/* ------------------------------------------------------------------------ */
/* A · Staircase — four columns rising left to right from one baseline.      */
/* ------------------------------------------------------------------------ */

function Staircase({
  reduced,
  onNavigate,
}: {
  reduced: boolean;
  onNavigate: (href: string) => void;
}) {
  const gap = 16;
  const firstW = 320;
  const restW = (WIDTH - firstW - gap * 3) / 3;
  const heights = [220, 306, 392, 478];

  const bars = MATURITY_LEVELS.map((level, i) => {
    const x = LEFT + (i === 0 ? 0 : firstW + gap + (i - 1) * (restW + gap));
    const w = i === 0 ? firstW : restW;
    const h = heights[i];
    return { level, x, w, h, y: BOTTOM - h };
  });

  return (
    <g>
      {bars.map(({ level, x, w, h, y }, i) => (
        <LevelLink key={level.stage} level={level} onNavigate={onNavigate}>
          <motion.rect
            x={x}
            width={w}
            rx={14}
            initial={{ y: BOTTOM, height: 0 }}
            animate={{ y, height: h }}
            transition={{ duration: 0.7, delay: 0.25 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
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
              rx={14}
              fill="rgba(102,153,246,0.16)"
              stroke="#ffffff"
              strokeOpacity={0.6}
              strokeWidth={1.25}
              className="landing-stage-active"
              style={{ animationDelay: SWEEP_DELAY(i) }}
            />
          ) : null}
          <motion.g {...fade(0.55 + i * 0.12)}>
            <BoxContent x={x} y={y} w={w} h={h} align="left" justify="start" className="p-5">
              <Eyebrow level={level} />
              <span className="mt-3 flex items-center gap-2.5">
                <LogoTile src={level.logo} />
                <span className="text-[16.5px] font-semibold leading-tight tracking-tight text-white">
                  {level.name}
                </span>
              </span>
              <span className="mt-3 text-[15px] font-medium leading-snug text-peak-100">
                “{level.question}”
              </span>
              {level.level === 1 ? (
                <span className="mt-3 flex flex-wrap gap-1.5">
                  {STAGES.map((stage) => (
                    <span
                      key={stage.id}
                      className="flex items-center gap-1 rounded-full border border-peak-300/25 bg-white/5 px-2 py-[3px] text-[10.5px] leading-none text-peak-100"
                    >
                      <Icon glyph={stage.glyph} size={11} className="text-peak-300" />
                      {stage.title}
                    </span>
                  ))}
                </span>
              ) : (
                <ul className="mt-3 space-y-1.5 text-[12px] leading-snug text-peak-200/85">
                  {level.outcomes.map((outcome) => (
                    <li key={outcome} className="flex gap-2">
                      <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-peak-300" />
                      {outcome}
                    </li>
                  ))}
                </ul>
              )}
              <span className="mt-auto flex w-full items-center justify-between pt-3">
                <span className="flex items-center gap-2">
                  <Meter level={level.level} />
                  <span className="text-[11px] text-peak-300">{level.mode}</span>
                </span>
                {level.href ? (
                  <span className="text-[12.5px] font-medium text-peak-200">Open →</span>
                ) : null}
              </span>
            </BoxContent>
          </motion.g>
        </LevelLink>
      ))}

      <AscentLine
        reduced={reduced}
        delay={0.9}
        points={bars.map(({ x, w, y }) => [x + w / 2, y - 18])}
      />
    </g>
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
  const sizes = [
    { w: 1080, h: 150 },
    { w: 840, h: 104 },
    { w: 620, h: 104 },
    { w: 420, h: 104 },
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
                className="flex-row! justify-between! gap-4 px-5"
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
/* C · Bars — one segmented bar per level, each filled one step further.     */
/* ------------------------------------------------------------------------ */

function Bars({
  reduced,
  onNavigate,
}: {
  reduced: boolean;
  onNavigate: (href: string) => void;
}) {
  const labelW = 300;
  const trackX = LEFT + labelW + 24;
  const trackW = 660;
  const segGap = 8;
  const segW = (trackW - segGap * 3) / 4;
  const trackH = 50;
  const rowH = 104;
  const rowGap = 14;
  const endX = trackX + trackW + 24;

  const rows = MATURITY_LEVELS.map((level, i) => ({
    level,
    cy: BOTTOM - rowH / 2 - i * (rowH + rowGap),
  }));
  const headerY = rows[3].cy - rowH / 2 - 14;

  return (
    <g>
      {/* The four columns the bars fill through. */}
      <motion.g {...fade(0.2)}>
        {MATURITY_LEVELS.map((level, s) => (
          <text
            key={level.value}
            x={trackX + s * (segW + segGap) + segW / 2}
            y={headerY}
            textAnchor="middle"
            className="fill-peak-300 text-[11px] font-semibold uppercase"
            letterSpacing="0.16em"
          >
            {level.value}
          </text>
        ))}
      </motion.g>

      {rows.map(({ level, cy }, i) => {
        const n = level.level;
        const top = cy - trackH / 2;
        return (
          <LevelLink key={level.stage} level={level} onNavigate={onNavigate}>
            {/* Hit area and hover wash for the whole row. */}
            <rect
              x={LEFT - 14}
              y={cy - rowH / 2}
              width={WIDTH + 28}
              height={rowH}
              rx={14}
              fill="rgba(255,255,255,0)"
              className="transition-[fill] duration-200 group-hover/level:fill-[rgba(255,255,255,0.06)]"
            />

            <motion.g {...fade(0.3 + i * 0.1)}>
              <BoxContent
                x={LEFT}
                y={cy - rowH / 2}
                w={labelW}
                h={rowH}
                align="left"
              >
                <Eyebrow level={level} />
                <span className="mt-2 flex items-center gap-2.5">
                  <LogoTile src={level.logo} />
                  <span className="text-[16.5px] font-semibold leading-tight text-white">
                    {level.name}
                  </span>
                </span>
                <span className="mt-2 line-clamp-1 text-[11.5px] text-peak-200/80">
                  {level.outcomes.join(" · ")}
                </span>
              </BoxContent>
            </motion.g>

            {[0, 1, 2, 3].map((s) => {
              const sx = trackX + s * (segW + segGap);
              const filled = s < n;
              return filled ? (
                <motion.rect
                  key={s}
                  x={sx}
                  y={top}
                  height={trackH}
                  rx={9}
                  initial={{ width: 0 }}
                  animate={{ width: segW }}
                  transition={{
                    duration: 0.4,
                    delay: 0.35 + i * 0.12 + s * 0.09,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  fill={`rgba(59,116,240,${0.16 + s * 0.1 + (s === n - 1 ? 0.12 : 0)})`}
                  stroke={s === n - 1 ? "rgba(255,255,255,0.75)" : "rgba(194,215,252,0.35)"}
                  strokeWidth={s === n - 1 ? 1.5 : 1}
                />
              ) : (
                <rect
                  key={s}
                  x={sx}
                  y={top}
                  width={segW}
                  height={trackH}
                  rx={9}
                  fill="rgba(255,255,255,0.025)"
                  stroke="rgba(147,184,249,0.2)"
                  strokeDasharray="4 5"
                />
              );
            })}

            {!reduced ? (
              <rect
                x={trackX + (n - 1) * (segW + segGap)}
                y={top}
                width={segW}
                height={trackH}
                rx={9}
                fill="rgba(194,215,252,0.18)"
                className="landing-stage-active"
                style={{ animationDelay: SWEEP_DELAY(i) }}
              />
            ) : null}

            <motion.g {...fade(0.6 + i * 0.12)}>
              <BoxContent
                x={trackX + (n - 1) * (segW + segGap)}
                y={top}
                w={segW}
                h={trackH}
                className="px-2"
              >
                <span className="text-[12.5px] font-semibold leading-tight text-white">
                  {level.question}
                </span>
              </BoxContent>
              <BoxContent x={endX} y={cy - rowH / 2} w={RIGHT - endX} h={rowH} align="left">
                <span className="text-[11px] uppercase tracking-[0.12em] text-peak-300">
                  {level.mode}
                </span>
                <span className="mt-1.5 text-[13px] font-medium text-peak-100">
                  {level.href ? "Open →" : "Beneath every level"}
                </span>
              </BoxContent>
            </motion.g>
          </LevelLink>
        );
      })}

      <AscentLine
        reduced={reduced}
        delay={1}
        points={rows.map(({ level, cy }) => [
          trackX + level.level * segW + (level.level - 1) * segGap + 10,
          cy - trackH / 2 - 10,
        ])}
      />
    </g>
  );
}

/* ------------------------------------------------------------------------ */

export function MaturityPanel({
  variant,
  onVariant,
  onClose,
  onNavigate,
  reduced,
  closeRef,
}: {
  variant: MaturityVariant;
  onVariant: (variant: MaturityVariant) => void;
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
            <span
              role="radiogroup"
              aria-label="Preview variant"
              className="flex rounded-full border border-peak-300/30 bg-white/5 p-[3px]"
            >
              {MATURITY_VARIANTS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={variant === option.id}
                  onClick={() => onVariant(option.id)}
                  className={`rounded-full px-3 py-1.5 text-[11.5px] font-medium leading-none transition-colors ${
                    variant === option.id
                      ? "bg-white text-peak-900"
                      : "text-peak-200 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </span>
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

      {/* Keyed, so switching variant replays that variant's entrance. */}
      <g key={variant}>
        {variant === "staircase" ? (
          <Staircase reduced={reduced} onNavigate={onNavigate} />
        ) : variant === "stack" ? (
          <Stack reduced={reduced} onNavigate={onNavigate} />
        ) : (
          <Bars reduced={reduced} onNavigate={onNavigate} />
        )}
      </g>
    </g>
  );
}
