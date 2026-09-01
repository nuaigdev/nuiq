/**
 * Animated picture of how data reaches this portal.
 *
 * Source systems → the client's Fabric warehouse → what NuIQ puts in front of
 * it. Particles travel the edges on a loop, so the movement is the point rather
 * than decoration (CLAUDE.md §5).
 *
 * Inline SVG rather than a GIF: it stays sharp at any width, weighs a couple of
 * kilobytes instead of megabytes, inherits the theme's colours, and honours
 * prefers-reduced-motion via the global rule in globals.css.
 */

type Node = { x: number; y: number; label: string; sub?: string };

const SOURCES: Node[] = [
  { x: 40, y: 46, label: "EHR / EMR", sub: "PointClickCare" },
  { x: 40, y: 116, label: "Financial", sub: "GL & billing" },
  { x: 40, y: 186, label: "Staffing", sub: "HR & scheduling" },
];

const OUTPUTS: Node[] = [
  { x: 600, y: 46, label: "Dashboards" },
  { x: 600, y: 116, label: "Data Agents" },
  { x: 600, y: 186, label: "AI Agents" },
];

const NODE_W = 132;
const NODE_H = 44;
const HUB = { x: 320, y: 116, w: 128, h: 68 };

/** Edge from a source's right edge into the hub's left edge, and hub → output. */
function edgePath(fromX: number, fromY: number, toX: number, toY: number) {
  const midX = (fromX + toX) / 2;
  return `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
}

function NodeBox({
  node,
  align,
}: {
  node: Node;
  align: "start" | "end";
}) {
  const textX = align === "start" ? node.x + 12 : node.x + NODE_W - 12;
  return (
    <g>
      <rect
        x={node.x}
        y={node.y - NODE_H / 2}
        width={NODE_W}
        height={NODE_H}
        rx="6"
        className="fill-white/[0.06] stroke-peak-300/30"
        strokeWidth="1"
      />
      <text
        x={textX}
        y={node.sub ? node.y - 2 : node.y + 4}
        textAnchor={align === "start" ? "start" : "end"}
        className="fill-peak-100 text-[12px] font-medium"
      >
        {node.label}
      </text>
      {node.sub ? (
        <text
          x={textX}
          y={node.y + 13}
          textAnchor={align === "start" ? "start" : "end"}
          className="fill-peak-300/70 text-[10px]"
        >
          {node.sub}
        </text>
      ) : null}
    </g>
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
    edgePath(source.x + NODE_W, source.y, HUB.x, HUB.y),
  );
  const outbound = OUTPUTS.map((output) =>
    edgePath(HUB.x + HUB.w, HUB.y, output.x, output.y),
  );

  return (
    <svg
      viewBox="0 0 772 232"
      className="h-auto w-full"
      role="img"
      aria-label="Data flows from EHR, financial, and staffing systems into the Fabric warehouse, and from there into dashboards, data agents, and AI agents."
    >
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
        <FlowParticle key={`in-${path}`} path={path} delay={`${i * 0.55}s`} />
      ))}
      {outbound.map((path, i) => (
        <FlowParticle
          key={`out-${path}`}
          path={path}
          delay={`${1.4 + i * 0.55}s`}
        />
      ))}

      {SOURCES.map((node) => (
        <NodeBox key={node.label} node={node} align="start" />
      ))}
      {OUTPUTS.map((node) => (
        <NodeBox key={node.label} node={node} align="end" />
      ))}

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
        <text
          x={HUB.x + HUB.w / 2}
          y={HUB.y - 6}
          textAnchor="middle"
          className="fill-white text-[13px] font-semibold"
        >
          Microsoft Fabric
        </text>
        <text
          x={HUB.x + HUB.w / 2}
          y={HUB.y + 12}
          textAnchor="middle"
          className="fill-peak-200 text-[10px]"
        >
          Warehouse
        </text>
      </g>
    </svg>
  );
}
