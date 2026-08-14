import type { FloorplanOpening, FloorplanShell, FloorplanWallSegment } from "./floorplan-runtime";

// I1A6-01 (PDF p.2) left-hand construction plan, AutoCAD page coordinates.
// X is anchored to the labeled 682.5 cm overall width. Y uses the same scale
// so the plan keeps the drawing's proportions. There is no single labeled
// overall depth; the left/right vertical chains each SUM to 915 cm, while
// this width-scale depth is ~911.5 cm. Do not treat either as CAD-confirmed.
const pdfBounds = { x0: 146.4, y0: 137.04, x1: 534.84, y1: 655.8 } as const;
const width = 6.825;
const scale = width / (pdfBounds.x1 - pdfBounds.x0);
const depth = (pdfBounds.y1 - pdfBounds.y0) * scale;
const wallHeight = 2.85;
const outer = 0.15;
const centerX = (pdfBounds.x0 + pdfBounds.x1) / 2;
const centerY = (pdfBounds.y0 + pdfBounds.y1) / 2;

const point = (x: number, y: number) => [(x - centerX) * scale, (y - centerY) * scale] as const;

function wall(
  id: string,
  rect: readonly [number, number, number, number],
  kind: FloorplanWallSegment["kind"],
  view: FloorplanWallSegment["view"] = "cutaway",
): FloorplanWallSegment {
  const [x0, y0, x1, y1] = rect;
  return {
    id,
    center: point((x0 + x1) / 2, (y0 + y1) / 2),
    size: [(x1 - x0) * scale, (y1 - y0) * scale],
    height: wallHeight,
    kind,
    view,
    sourceRect: rect,
    sourcePage: 2,
  };
}

function opening(
  id: string,
  type: FloorplanOpening["type"],
  span: readonly [number, number, number, number],
  rotationY: number,
  sill: number,
  height: number,
  thickness = outer,
): FloorplanOpening {
  const [x0, y0, x1, y1] = span;
  return {
    id,
    type,
    center: point((x0 + x1) / 2, (y0 + y1) / 2),
    width: Math.hypot(x1 - x0, y1 - y0) * scale,
    rotationY,
    sill,
    height,
    wallThickness: thickness,
    sourcePage: 2,
    sourceSpan: span,
  };
}

const walls = [
  // Exterior / structural poche from I1A6-01. Openings stay as gaps or
  // labeled windows — the right outer run is continuous in the drawing.
  wall("outer-balcony-column", [146.4, 137.04, 184.68, 210.84], "outer", "full"),
  wall("outer-multi-top", [323.04, 137.64, 526.92, 145.08], "outer", "full"),
  wall("outer-multi-left", [315.72, 137.64, 323.04, 218.76], "outer", "full"),
  wall("outer-right", [526.92, 137.64, 534.24, 655.32], "outer", "cutaway"),
  wall("outer-ac-block", [502.2, 145.56, 526.32, 210.84], "outer", "full"),
  wall("outer-left-upper", [147.0, 219.36, 154.92, 284.52], "outer", "full"),
  wall("outer-left-corner", [146.4, 284.52, 154.92, 293.04], "outer", "full"),
  wall("outer-left-lower", [147.0, 293.04, 154.32, 647.88], "outer", "full"),
  wall("outer-bottom-left-jamb", [147.0, 647.88, 171.7, 655.32], "outer", "cutaway"),
  wall("outer-bottom-main", [234.3, 647.88, 526.92, 655.32], "outer", "cutaway"),
  wall("outer-pipe-block", [502.2, 570.84, 526.32, 647.4], "outer", "cutaway"),

  // Room boundaries: 多功能室 / 主臥 / 雙衛浴 / 管道間 / 玄關.
  wall("partition-multi-ac", [436.2, 145.08, 443.52, 325.08], "partition"),
  wall("partition-spine-stub", [318.0, 219.36, 323.64, 222.36], "partition"),
  wall("partition-spine-upper", [318.0, 276.0, 323.64, 469.08], "partition"),
  wall("partition-spine-lower", [318.0, 516.72, 323.64, 569.4], "partition"),
  wall("partition-multi-master-left", [323.64, 319.92, 436.2, 325.56], "partition"),
  wall("partition-multi-master-right", [443.52, 317.64, 526.92, 325.08], "partition"),
  wall("partition-master-bath", [385.08, 479.28, 526.92, 484.32], "partition"),
  wall("partition-hall-bath", [385.08, 479.28, 389.64, 564.24], "partition"),
  wall("partition-bath-top-left", [323.64, 564.24, 346.8, 569.4], "partition"),
  wall("partition-bath-top-center", [351.36, 564.24, 437.52, 569.4], "partition"),
  wall("partition-bath-top-right", [442.08, 564.24, 475.8, 568.8], "partition"),
  wall("partition-bath-left", [346.8, 568.8, 351.36, 647.88], "partition"),
  wall("partition-bath-core", [437.52, 568.8, 442.08, 591.48], "partition"),
  wall("partition-pipe-left", [496.56, 565.68, 501.6, 651.6], "partition"),
  wall("partition-pipe-bottom", [442.08, 586.92, 497.04, 591.48], "partition"),
  wall("partition-bath-pipe-jog", [475.8, 550.08, 480.36, 568.8], "partition"),
  wall("partition-entry-dining", [154.92, 563.76, 262.68, 573.96], "partition"),
  wall("partition-entry-cabinet", [154.92, 573.96, 166.32, 647.4], "partition"),
] satisfies FloorplanWallSegment[];

const openings = [
  opening("living-balcony-window", "sliding-door", [154.9, 215.1, 315.1, 215.1], 0, 0.05, 2.3),
  opening("multi-north-window", "window", [359.6, 141.36, 399.4, 141.36], 0, 0.9, 1.0),
  opening("ac-side-window", "window", [530.58, 157.6, 530.58, 197.4], Math.PI / 2, 0.9, 1.0),
  opening("guest-bath-window", "window", [450.1, 651.6, 489.9, 651.6], 0, 0.9, 1.0),
  opening("multi-entry-door", "door", [320.82, 222.36, 320.82, 276.0], Math.PI / 2, 0, 2.1, 0.1),
  opening("master-entry-door", "door", [320.82, 469.08, 320.82, 516.72], Math.PI / 2, 0, 2.1, 0.1),
  opening("ensuite-door", "door", [387.36, 500.0, 387.36, 545.5], Math.PI / 2, 0, 2.1, 0.1),
  opening("guest-bath-door", "door", [349.08, 590.0, 349.08, 635.5], Math.PI / 2, 0, 2.1, 0.1),
  opening("entry-door", "door", [171.7, 651.6, 234.3, 651.6], 0, 0, 2.1),
] satisfies FloorplanOpening[];

const footprint = [
  point(315.72, 137.04), point(534.24, 137.04), point(534.24, 655.8),
  point(146.4, 655.8), point(146.4, 211.32), point(315.72, 211.32),
] as const;

export const A6_SHELL_V2 = {
  schemaVersion: "1.0" as const,
  status: "drawing-audit-runtime-shell" as const,
  source: {
    pdf: "遠雄BH7樣品屋大樣圖 0718.pdf",
    drawingSet: "A6",
    pages: { dimensions: 2, furnishedPlan: 3, ceilingAndHeights: 7 },
    caveat: "Walls and openings trace I1A6-01 poche; 682.5 cm width is labeled. Depth uses the same width scale (~9.115 m). Labeled vertical chains sum to 915 cm but no single overall depth is printed. Ceiling collision height 2.85 m is an interactive simplification (CH220–CH290 on I1A6-06).",
  },
  dimensions: { width, depth, wallHeight, outerWall: outer, partitionWall: 0.1 },
  footprint,
  openings,
  editableBounds: {
    minX: -width / 2 + 0.22,
    maxX: width / 2 - 0.22,
    minZ: -depth / 2 + 0.22,
    maxZ: depth / 2 - 0.22,
  },
  walls,
  collisionWalls: walls.filter((segment) => segment.kind === "outer"),
} as const satisfies FloorplanShell;

/** @deprecated Use A6_SHELL_V2. Kept so older adapters keep resolving. */
export const A6_SHELL_V1 = A6_SHELL_V2;

export const A6_EDITABLE_BOUNDS = A6_SHELL_V2.editableBounds;
