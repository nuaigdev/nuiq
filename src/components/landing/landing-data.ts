/**
 * What the landing diagram draws.
 *
 * Geometry lives here with the content, because the connector paths are
 * computed from these coordinates rather than measured from the DOM — one
 * coordinate space for the boxes and the paths between them means they can
 * never drift apart.
 *
 * The canvas is deliberately landscape (roughly 2.3:1) so that `meet` scaling
 * fills a normal widescreen viewport instead of fitting to height and leaving
 * the sides empty. Anything added here has to keep that ratio roughly intact,
 * or the diagram starts shrinking to fit.
 *
 * Everything named here is **illustrative**. The diagram draws the same shape
 * for every client and reads nothing from the warehouse or from config, so a
 * named system is not a claim that this client runs it (CLAUDE.md §5). Nothing
 * client-specific belongs in this file — that lives in tenant.json (§9).
 */

/**
 * The drawing surface. Everything below is in these units.
 *
 * The column headings that used to sit at the top are gone, so the content is
 * lifted by SHIFT_Y and the canvas shortened to match — otherwise the diagram
 * would sit low against a band of empty space. Positions below are unchanged;
 * the whole drawing is translated once.
 */
export const CANVAS = { w: 1600, h: 676 };
export const SHIFT_Y = 24;

export type SourceSystem = {
  name: string;
  /** Vendor mark in /public/logos, or null to draw `glyph` instead. */
  logo: string | null;
  /**
   * Fallback when no mark exists. Two letters for a product whose logo we
   * could not source, or a shape name for a category that has no vendor.
   */
  glyph: string;
  y: number;
};

const SOURCE_ROW_H = 48;
/* Chosen so the twelve rows centre on AXIS_Y, like everything else. */
const SOURCE_TOP = 96;

const SOURCE_NAMES: Omit<SourceSystem, "y">[] = [
  { name: "PointClickCare", logo: "/logos/pointclickcare.png", glyph: "PC" },
  { name: "MatrixCare", logo: "/logos/matrixcare.png", glyph: "MC" },
  // No retrievable vendor mark for these two — a lettermark is honest, where
  // guessing at a similarly-named company's logo would not be.
  { name: "CareSage", logo: null, glyph: "CS" },
  { name: "FullCount", logo: null, glyph: "FC" },
  { name: "Yardi Senior Living", logo: "/logos/yardi.png", glyph: "Y" },
  { name: "Eldermark", logo: "/logos/eldermark.png", glyph: "EM" },
  { name: "Enquire CRM", logo: "/logos/enquire.png", glyph: "EQ" },
  { name: "OnShift", logo: "/logos/onshift.png", glyph: "OS" },
  // Categories rather than products: every operator has these, no two run the
  // same vendor, so naming one would be wrong for most clients.
  { name: "Finance / GL", logo: null, glyph: "ledger" },
  { name: "Payroll / HR", logo: null, glyph: "people" },
  { name: "Pharmacy", logo: null, glyph: "pharmacy" },
  { name: "Other Senior Living Systems", logo: null, glyph: "stack" },
];

export const SOURCES: SourceSystem[] = SOURCE_NAMES.map((source, i) => ({
  ...source,
  y: SOURCE_TOP + i * SOURCE_ROW_H,
}));

export const SOURCE_BOX = { x: 40, w: 280, h: 38 };

/**
 * The vertical spine every source joins before the ingestion gate.
 *
 * Twelve separate curves fanning into one point read as a spider's web — the
 * lines cross each other and nothing about the picture says "these merge".
 * Routing them orthogonally onto a shared bus is both cleaner and truer: it is
 * what a manifold of feeds into one pipeline actually looks like.
 */
export const BUS_X = 360;

export const INGEST_GATE = {
  x: 420,
  y: SOURCE_TOP + ((SOURCE_NAMES.length - 1) * SOURCE_ROW_H) / 2,
  r: 36,
};

export type PlatformStage = {
  id: string;
  step: number;
  title: string;
  detail: string;
  /** Drawn inline — flat and geometric, never a chart or brain cliché (§8). */
  glyph: "ingest" | "transform" | "lakehouse" | "semantic" | "governance";
  y: number;
};

/**
 * The platform is centred on the canvas — PLATFORM.x + PLATFORM.w / 2 is
 * exactly CANVAS.w / 2 — so it sits directly under the NuAIg mark above the
 * diagram. If either number changes, the other has to change with it.
 */
export const PLATFORM = { x: 565, w: 470, y: 60, h: 600 };
export const STAGE_BOX = { x: 591, w: 418, h: 72 };

/**
 * The one horizontal line everything is arranged around: the vertical centre
 * of the platform, of the twelve sources, of the ingestion gate and of the
 * three destinations. Keeping all four on it is what makes the diagram read
 * as one composition rather than three columns that happen to be adjacent.
 */
export const AXIS_Y = PLATFORM.y + PLATFORM.h / 2;

const STAGE_TOP = 226;
const STAGE_ROW_H = 88;

export const STAGES: PlatformStage[] = (
  [
    {
      id: "ingest",
      step: 1,
      title: "Ingestion",
      detail: "Secure, scheduled loads from every source",
      glyph: "ingest",
    },
    {
      id: "transform",
      step: 2,
      title: "Transformation",
      detail: "Cleansed, conformed, deduplicated",
      glyph: "transform",
    },
    {
      id: "lakehouse",
      step: 3,
      title: "Warehouse / Lakehouse",
      detail: "OneLake — one copy, every workload",
      glyph: "lakehouse",
    },
    {
      id: "semantic",
      step: 4,
      title: "Knowledge / Semantic Layer",
      detail: "Measures, hierarchy, and row-level security",
      glyph: "semantic",
    },
    {
      id: "governance",
      step: 5,
      title: "Governance & Security",
      detail: "Lineage, audit, and least-privilege access",
      glyph: "governance",
    },
  ] as const
).map((stage, i) => ({ ...stage, y: STAGE_TOP + i * STAGE_ROW_H }));

/** The layer the outputs actually read from — stage 4, not the raw lakehouse. */
export const SEMANTIC_STAGE_INDEX = 3;

/** How long one sweep of the whole platform stack takes, in seconds. */
export const STACK_CYCLE_S = 5.5;

export type Destination = {
  href: string;
  name: string;
  detail: string;
  logo: string;
  y: number;
};

const DEST_TOP = 180;
const DEST_ROW_H = 180;

export const DEST_BOX = { x: 1140, w: 420, h: 140 };

export const DESTINATIONS: Destination[] = [
  {
    href: "/dashboards",
    name: "Power BI Dashboards",
    detail:
      "Census, falls, staffing and revenue — interactive, and scoped to the communities you are entitled to.",
    logo: "/logos/power-bi.png",
  },
  {
    href: "/data-agents",
    name: "Conversational Data Agent",
    detail:
      "Ask the warehouse a question in plain language and get an answer grounded in your own data.",
    logo: "/logos/microsoft-fabric.png",
  },
  {
    href: "/ai-agents",
    name: "Advanced AI Agents",
    detail:
      "Assistants on Azure AI Foundry, Copilot Studio and Power Platform for the work past the warehouse.",
    logo: "/logos/azure-ai-foundry.png",
  },
].map((destination, i) => ({
  ...destination,
  y: DEST_TOP + i * DEST_ROW_H,
}));

/**
 * An orthogonal run from a source onto the shared bus and along to the gate:
 * out horizontally, one rounded corner onto the spine, down or up it, one
 * rounded corner off, then in. Sources level with the gate go straight across.
 */
export function busPath(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  busX = BUS_X,
  radius = 16,
): string {
  if (Math.abs(fromY - toY) < 0.5) return `M ${fromX} ${fromY} H ${toX}`;

  const goingDown = toY > fromY;
  const step = goingDown ? 1 : -1;
  const r = Math.min(radius, Math.abs(toY - fromY) / 2);

  return [
    `M ${fromX} ${fromY}`,
    `H ${busX - r}`,
    `Q ${busX} ${fromY} ${busX} ${fromY + step * r}`,
    `V ${toY - step * r}`,
    `Q ${busX} ${toY} ${busX + r} ${toY}`,
    `H ${toX}`,
  ].join(" ");
}

/** A cubic curve between two points, flat where it meets each end. */
export function curve(fromX: number, fromY: number, toX: number, toY: number) {
  const midX = (fromX + toX) / 2;
  return `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
}
