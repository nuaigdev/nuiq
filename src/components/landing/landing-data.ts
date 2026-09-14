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
  /** What the chip shows — shortened where the product name will not fit. */
  name: string;
  /** The product's full name, for assistive tech, where `name` abbreviates. */
  fullName?: string;
  /** Vendor mark in /public/logos, or null to draw `glyph` instead. */
  logo: string | null;
  /**
   * Fallback when no mark exists. Two letters for a product whose logo we
   * could not source, or a shape name for a category that has no vendor.
   */
  glyph: string;
};

export type SourceGroup = {
  id: string;
  label: string;
  systems: SourceSystem[];
  /** Top edge, height and vertical centre — computed, never hand-placed. */
  y: number;
  h: number;
  cy: number;
};

/**
 * The source column: twenty-odd systems, grouped by what they run.
 *
 * One row per system stopped fitting past twelve — at twenty-five rows the text
 * would be unreadable at hero size. Grouping by domain is also what an operator
 * actually recognises ("our workforce systems"), and it gives the bus one feed
 * per domain instead of a comb of twenty-five lines.
 *
 * Where no mark could be sourced (CareSage, WorxHub) the chip draws a
 * lettermark; guessing at a similarly-named company's logo would not be honest.
 * Dynamics and Sage Intacct carry their parent company's mark, which is the
 * mark those products ship under.
 */
const SOURCE_GROUP_DEFS: Omit<SourceGroup, "y" | "h" | "cy">[] = [
  {
    id: "clinical",
    label: "Clinical & EHR",
    systems: [
      { name: "PointClickCare", logo: "/logos/pointclickcare.png", glyph: "PC" },
      { name: "MatrixCare", logo: "/logos/matrixcare.png", glyph: "MC" },
      { name: "Netsmart myUnity", logo: "/logos/netsmart.png", glyph: "NS" },
      { name: "AlayaCare", logo: "/logos/alayacare.png", glyph: "AC" },
      { name: "Eldermark", logo: "/logos/eldermark.png", glyph: "EM" },
      { name: "CareSage", logo: null, glyph: "CS" },
      { name: "Pharmacy", logo: null, glyph: "pharmacy" },
    ],
  },
  {
    id: "sales",
    label: "Sales & Occupancy",
    systems: [
      { name: "Yardi Senior Living", logo: "/logos/yardi.png", glyph: "Y" },
      { name: "Enquire CRM", logo: "/logos/enquire.png", glyph: "EQ" },
    ],
  },
  {
    id: "resident",
    label: "Resident Experience",
    systems: [
      { name: "FullCount", logo: "/logos/fullcount.png", glyph: "FC" },
      { name: "Uniguest", logo: "/logos/uniguest.png", glyph: "UG" },
      // A category rather than a product: no two operators fill it the same.
      { name: "Other systems", fullName: "Other senior living systems", logo: null, glyph: "stack" },
    ],
  },
  {
    id: "workforce",
    label: "Workforce & Payroll",
    systems: [
      { name: "OnShift", logo: "/logos/onshift.png", glyph: "OS" },
      { name: "Paycom", logo: "/logos/paycom.png", glyph: "PY" },
      { name: "ADP", logo: "/logos/adp.png", glyph: "AD" },
      { name: "UKG (UltiPro)", fullName: "UltiPro / UKG", logo: "/logos/ukg.png", glyph: "UK" },
      { name: "Relias", logo: "/logos/relias.png", glyph: "RE" },
    ],
  },
  {
    id: "finance",
    label: "Finance & Accounting",
    systems: [
      {
        name: "Dynamics 365 BC",
        fullName: "Microsoft Dynamics 365 Business Central",
        logo: "/logos/microsoft.png",
        glyph: "BC",
      },
      {
        name: "Dynamics GP",
        fullName: "Microsoft Dynamics GP (Great Plains)",
        logo: "/logos/microsoft.png",
        glyph: "GP",
      },
      { name: "Sage Intacct", logo: "/logos/sage.png", glyph: "SI" },
      { name: "Solver", logo: "/logos/solver.png", glyph: "SV" },
    ],
  },
  {
    id: "risk",
    label: "Risk, Quality & Facilities",
    systems: [
      {
        name: "RLDatix RL6",
        fullName: "PEER / RL6 Datix (RL Solutions)",
        logo: "/logos/rldatix.png",
        glyph: "RL",
      },
      { name: "WorxHub", logo: null, glyph: "WH" },
    ],
  },
];

/** The column the groups stack in, and the chips inside each group. */
export const SOURCE_COL = { x: 28, w: 320 };
export const SOURCE_CHIP = { h: 26, gap: 4, cols: 2 };
const GROUP_HEAD = 24;
const GROUP_PAD_BOTTOM = 8;
const GROUP_GAP = 8;

/**
 * The vertical spine every source joins before the ingestion gate.
 *
 * Separate curves fanning into one point read as a spider's web — the lines
 * cross each other and nothing about the picture says "these merge". Routing
 * them orthogonally onto a shared bus is both cleaner and truer: it is what a
 * manifold of feeds into one pipeline actually looks like.
 */
export const BUS_X = 376;

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

function groupHeight(count: number) {
  const rows = Math.ceil(count / SOURCE_CHIP.cols);
  return (
    GROUP_HEAD +
    rows * SOURCE_CHIP.h +
    (rows - 1) * SOURCE_CHIP.gap +
    GROUP_PAD_BOTTOM
  );
}

/* The groups are stacked as one block centred on AXIS_Y, like everything else. */
export const SOURCE_GROUPS: SourceGroup[] = (() => {
  const heights = SOURCE_GROUP_DEFS.map((g) => groupHeight(g.systems.length));
  const total =
    heights.reduce((sum, h) => sum + h, 0) +
    (SOURCE_GROUP_DEFS.length - 1) * GROUP_GAP;
  let y = AXIS_Y - total / 2;
  return SOURCE_GROUP_DEFS.map((group, i) => {
    const placed = { ...group, y, h: heights[i], cy: y + heights[i] / 2 };
    y += heights[i] + GROUP_GAP;
    return placed;
  });
})();

export const SOURCE_GROUP_HEAD = GROUP_HEAD;

export const INGEST_GATE = { x: 434, y: AXIS_Y, r: 36 };

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
  /** Where this destination sits on the maturity path (see MATURITY_LEVELS). */
  level: 2 | 3 | 4;
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
    level: 2 as const,
  },
  {
    href: "/data-agents",
    name: "Conversational Data Agent",
    detail:
      "Ask the warehouse a question in plain language and get an answer grounded in your own data.",
    logo: "/logos/microsoft-fabric.png",
    level: 3 as const,
  },
  {
    href: "/ai-agents",
    name: "Advanced AI Agents",
    detail:
      "Assistants on Azure AI Foundry, Copilot Studio and Power Platform for the work past the warehouse.",
    logo: "/logos/azure-ai-foundry.png",
    level: 4 as const,
  },
].map((destination, i) => ({
  ...destination,
  y: DEST_TOP + i * DEST_ROW_H,
}));

/**
 * The maturity path revealed by expanding the platform.
 *
 * The platform is the foundation; the three destinations are the levels built
 * on it, in the same order the nav carries them. Each level answers a harder
 * question than the one beneath it, and none of them is trustworthy without the
 * foundation — which is the point the expanded view exists to make.
 *
 * Illustrative, like the rest of this file: it describes the shape of the
 * product, not this client's progress along it. Nothing here is a score.
 */
export type MaturityLevel = {
  level: 1 | 2 | 3 | 4;
  stage: "Foundation" | "Visualize" | "Converse" | "Advanced";
  name: string;
  logo: string;
  href: string | null;
  question: string;
  /** One word for what the level gives you. Used as a column label. */
  value: string;
  mode: string;
  outcomes: string[];
};

export const MATURITY_LEVELS: MaturityLevel[] = [
  {
    level: 1,
    stage: "Foundation",
    name: "Unified, governed data",
    logo: "/logos/microsoft-fabric.png",
    href: null,
    question: "Can we trust it?",
    value: "Trust",
    mode: "Governed",
    outcomes: STAGES.map((s) => s.title),
  },
  {
    level: 2,
    stage: "Visualize",
    name: "Power BI Dashboards",
    logo: "/logos/power-bi.png",
    href: "/dashboards",
    question: "What happened?",
    value: "Insight",
    mode: "Descriptive",
    outcomes: [
      "Census & occupancy by community",
      "Falls, elopements & med errors",
      "Staffing ratios & labor",
    ],
  },
  {
    level: 3,
    stage: "Converse",
    name: "Conversational Data Agent",
    logo: "/logos/microsoft-fabric.png",
    href: "/data-agents",
    question: "Why did it happen?",
    value: "Answers",
    mode: "Diagnostic",
    outcomes: [
      "Plain-language questions",
      "Answers show the SQL behind them",
      "Scoped to your own access",
    ],
  },
  {
    level: 4,
    stage: "Advanced",
    name: "Advanced AI Agents",
    logo: "/logos/azure-ai-foundry.png",
    href: "/ai-agents",
    question: "What should we do next?",
    value: "Action",
    mode: "Predictive & prescriptive",
    outcomes: [
      "Incident intake & triage",
      "Quality insights",
      "Assistants that draft and act",
    ],
  },
];

/** The rect the platform grows into when expanded. */
export const MATURITY_PANEL = { x: 176, y: 40, w: 1248, h: 648 };

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
