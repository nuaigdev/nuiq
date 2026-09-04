/**
 * Animated picture of how data reaches this portal.
 *
 * The senior living systems a community already runs → the client's Fabric
 * warehouse → what NuIQ puts in front of it. Particles travel the edges on a
 * loop, so the movement is the point rather than decoration (CLAUDE.md §5).
 *
 * Inline SVG rather than a GIF: it stays sharp at any width, weighs a couple of
 * kilobytes instead of megabytes, inherits the theme's colours, and honours
 * prefers-reduced-motion via the global rule in globals.css.
 *
 * The vendor marks in `/public/logos` are the recognisable shorthand for each
 * category — an LTC operator reads "PointClickCare" faster than "EHR / EMR".
 * They are illustrative, exactly like the rest of this hero: the diagram draws
 * the same shape for every client and reads nothing from the warehouse, so a
 * named system here is not a claim that this client runs it. Anything that
 * varies per client belongs in config, not in this file (CLAUDE.md §9).
 */

type FlowNode = {
  y: number;
  label: string;
  sub: string;
  logo: string;
};

/** Left column: where the data is produced. */
const SOURCES: FlowNode[] = [
  {
    y: 51,
    label: "PointClickCare",
    sub: "EHR & census",
    logo: "/logos/pointclickcare.png",
  },
  {
    y: 97,
    label: "MatrixCare",
    sub: "Clinical & MDS",
    logo: "/logos/matrixcare.png",
  },
  {
    y: 143,
    label: "Yardi",
    sub: "Finance & billing",
    logo: "/logos/yardi.png",
  },
  {
    y: 189,
    label: "OnShift",
    sub: "Staffing & scheduling",
    logo: "/logos/onshift.png",
  },
];

/** Right column: the three tabs this portal opens onto. */
const OUTPUTS: FlowNode[] = [
  {
    y: 64,
    label: "Dashboards",
    sub: "Power BI",
    logo: "/logos/power-bi.png",
  },
  {
    y: 120,
    label: "Data Agents",
    sub: "Fabric",
    logo: "/logos/microsoft-fabric.png",
  },
  {
    y: 176,
    label: "AI Agents",
    sub: "Foundry & Copilot",
    logo: "/logos/azure-ai-foundry.png",
  },
];

const SOURCE = { x: 36, w: 156, h: 38 };
const OUTPUT = { x: 588, w: 156, h: 44 };
const HUB = { x: 312, y: 120, w: 148, h: 84 };

const TILE = 24;

/** Edge from a column's inner edge into the hub, and hub → output. */
function edgePath(fromX: number, fromY: number, toX: number, toY: number) {
  const midX = (fromX + toX) / 2;
  return `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
}

/**
 * Vendor marks come from each vendor as a coloured glyph meant for a light
 * background, so they sit on a white tile rather than directly on the indigo
 * chrome — otherwise the blue ones (Yardi, Foundry) all but disappear.
 */
function LogoTile({ x, y, size, href }: { x: number; y: number; size: number; href: string }) {
  const inset = size * 0.14;
  return (
    <g>
      <rect x={x} y={y} width={size} height={size} rx={size * 0.26} fill="#ffffff" />
      <image
        href={href}
        x={x + inset}
        y={y + inset}
        width={size - inset * 2}
        height={size - inset * 2}
        preserveAspectRatio="xMidYMid meet"
      />
    </g>
  );
}

function NodeBox({
  node,
  box,
}: {
  node: FlowNode;
  box: { x: number; w: number; h: number };
}) {
  const textX = box.x + 12 + TILE + 10;
  return (
    <g>
      <rect
        x={box.x}
        y={node.y - box.h / 2}
        width={box.w}
        height={box.h}
        rx="6"
        className="fill-white/[0.06] stroke-peak-300/30"
        strokeWidth="1"
      />
      <LogoTile x={box.x + 12} y={node.y - TILE / 2} size={TILE} href={node.logo} />
      <text x={textX} y={node.y - 1} className="fill-peak-100 text-[11.5px] font-medium">
        {node.label}
      </text>
      <text x={textX} y={node.y + 11} className="fill-peak-300/70 text-[9.5px]">
        {node.sub}
      </text>
    </g>
  );
}

function ColumnHeading({ x, children }: { x: number; children: string }) {
  return (
    <text
      x={x}
      y="16"
      className="fill-peak-300/60 text-[9px] font-semibold uppercase"
      letterSpacing="0.1em"
    >
      {children}
    </text>
  );
}

function FlowParticle({ path, delay }: { path: string; delay: string }) {
  return (
    <circle r="3" className="fill-peak-400">
      <animateMotion
        dur="3.2s"
        begin={delay}
        repeatCount="indefinite"
        path={path}
        keyPoints="0;1"
        keyTimes="0;1"
        calcMode="linear"
      />
      <animate
        attributeName="opacity"
        values="0;1;1;0"
        keyTimes="0;0.12;0.85;1"
        dur="3.2s"
        begin={delay}
        repeatCount="indefinite"
      />
    </circle>
  );
}

export function DataFlowHero() {
  const inbound = SOURCES.map((source) =>
    edgePath(SOURCE.x + SOURCE.w, source.y, HUB.x, HUB.y),
  );
  const outbound = OUTPUTS.map((output) =>
    edgePath(HUB.x + HUB.w, HUB.y, OUTPUT.x, output.y),
  );

  return (
    <svg
      viewBox="0 0 772 232"
      className="h-auto w-full"
      role="img"
      aria-label="Data flows from senior living source systems — PointClickCare, MatrixCare, Yardi, and OnShift — into the Microsoft Fabric warehouse, and from there into Power BI dashboards, Fabric data agents, and AI agents."
    >
      <ColumnHeading x={SOURCE.x}>Source systems</ColumnHeading>
      <ColumnHeading x={OUTPUT.x}>In this portal</ColumnHeading>

      {[...inbound, ...outbound].map((path, i) => (
        <path
          key={path}
          d={path}
          fill="none"
          className="stroke-peak-300/25"
          strokeWidth="1.25"
          strokeDasharray={i < inbound.length ? undefined : "3 4"}
        />
      ))}

      {inbound.map((path, i) => (
        <FlowParticle key={`in-${path}`} path={path} delay={`${i * 0.45}s`} />
      ))}
      {outbound.map((path, i) => (
        <FlowParticle
          key={`out-${path}`}
          path={path}
          delay={`${1.5 + i * 0.45}s`}
        />
      ))}

      {SOURCES.map((node) => (
        <NodeBox key={node.label} node={node} box={SOURCE} />
      ))}
      {OUTPUTS.map((node) => (
        <NodeBox key={node.label} node={node} box={OUTPUT} />
      ))}

      <text
        x={SOURCE.x}
        y="222"
        className="fill-peak-300/55 text-[9.5px]"
      >
        + pharmacy, payroll, and CRM systems
      </text>

      {/* The warehouse: the one thing everything passes through. */}
      <g>
        <rect
          x={HUB.x}
          y={HUB.y - HUB.h / 2}
          width={HUB.w}
          height={HUB.h}
          rx="8"
          className="fill-peak-600/25 stroke-peak-400/60"
          strokeWidth="1.25"
        />
        <LogoTile
          x={HUB.x + HUB.w / 2 - 14}
          y={HUB.y - HUB.h / 2 + 12}
          size={28}
          href="/logos/microsoft-fabric.png"
        />
        <text
          x={HUB.x + HUB.w / 2}
          y={HUB.y + 18}
          textAnchor="middle"
          className="fill-white text-[12.5px] font-semibold"
        >
          Microsoft Fabric
        </text>
        <text
          x={HUB.x + HUB.w / 2}
          y={HUB.y + 32}
          textAnchor="middle"
          className="fill-peak-200 text-[9.5px]"
        >
          Warehouse / Lakehouse
        </text>
      </g>
    </svg>
  );
}
