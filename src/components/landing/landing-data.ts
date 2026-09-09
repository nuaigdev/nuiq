/**
 * What the landing diagram draws.
 *
 * Geometry lives here with the content, because the connector curves are
 * computed from these coordinates rather than measured from the DOM — one
 * coordinate space for the boxes and the paths between them means they can
 * never drift apart.
 *
 * Everything named here is **illustrative**. The diagram draws the same shape
 * for every client and reads nothing from the warehouse or from config, so a
 * named system is not a claim that this client runs it (CLAUDE.md §5). Nothing
 * client-specific belongs in this file — that lives in tenant.json (§9).
 */

/** The drawing surface. Everything below is in these units. */
export const CANVAS = { w: 1440, h: 812 };

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

const SOURCE_ROW_H = 52;
const SOURCE_TOP = 118;

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

export const SOURCE_BOX = { x: 56, w: 276, h: 42 };

/** Where every source's curve gathers before entering the platform. */
export const INGEST_GATE = {
  x: 392,
  y: SOURCE_TOP + ((SOURCE_NAMES.length - 1) * SOURCE_ROW_H) / 2,
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

const STAGE_TOP = 196;
const STAGE_ROW_H = 96;

export const PLATFORM = { x: 520, w: 400, y: 96, h: 656 };
export const STAGE_BOX = { x: 552, w: 336, h: 74 };

export const STAGES: PlatformStage[] = [
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
].map((stage, i) => ({
  ...stage,
  y: STAGE_TOP + i * STAGE_ROW_H,
})) as PlatformStage[];

/** The layer the outputs actually read from — stage 4, not the raw lakehouse. */
export const SEMANTIC_STAGE_INDEX = 3;

export type Destination = {
  href: string;
  name: string;
  detail: string;
  logo: string;
  y: number;
};

const DEST_TOP = 236;
const DEST_ROW_H = 168;

export const DEST_BOX = { x: 1064, w: 320, h: 128 };

export const DESTINATIONS: Destination[] = [
  {
    href: "/dashboards",
    name: "Live Power BI Dashboards",
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

/** A cubic curve between two points, flat where it meets each end. */
export function curve(fromX: number, fromY: number, toX: number, toY: number) {
  const midX = (fromX + toX) / 2;
  return `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
}
