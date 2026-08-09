import type { FloorplanOpening, FloorplanShell, FloorplanWallSegment } from "./floorplan-runtime";

// PDF p.2, left-hand clean construction plan (AutoCAD point coordinates).
// The X scale is anchored to the confirmed 682.5 cm overall width. Y uses the
// same scale so the plan keeps the drawing's proportions without inventing a
// second overall dimension.
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
  // Exterior and structural walls, kept as separate AutoCAD-derived runs so
  // openings remain actual gaps instead of painted marks on a solid box.
  wall("outer-multi-top-right", [435.4, 137.6, 526.9, 145.1], "outer", "full"),
  wall("outer-multi-left", [315.7, 137.6, 323.0, 218.8], "outer", "full"),
  wall("outer-right-upper", [526.9, 137.6, 534.2, 202.9], "outer", "cutaway"),
  wall("outer-right-mid", [526.9, 210.8, 534.2, 267.8], "outer", "cutaway"),
  wall("outer-right-lower", [526.9, 325.1, 534.2, 647.9], "outer", "cutaway"),
  wall("outer-left-upper", [147.0, 219.4, 154.9, 284.5], "outer", "full"),
  wall("outer-left-lower", [147.0, 293.0, 154.3, 647.9], "outer", "full"),
  wall("outer-bottom-left-jamb", [147.0, 647.9, 171.7, 655.3], "outer", "cutaway"),
  wall("outer-bottom-main", [234.3, 647.9, 526.9, 655.3], "outer", "cutaway"),

  // Main partition spine and room boundaries from I1A6-01.
  wall("partition-spine-upper", [318.0, 276.0, 323.6, 469.1], "partition"),
  wall("partition-spine-lower", [318.0, 516.7, 323.6, 569.4], "partition"),
  wall("partition-multi-master-left", [323.6, 319.9, 436.2, 325.6], "partition"),
  wall("partition-multi-master-right", [443.5, 317.6, 526.9, 325.1], "partition"),
  wall("partition-master-bath", [385.1, 479.3, 526.9, 484.3], "partition"),
  wall("partition-hall-bath", [385.1, 479.3, 389.6, 564.2], "partition"),
  wall("partition-bath-top-left", [323.6, 564.2, 346.8, 569.4], "partition"),
  wall("partition-bath-top-center", [351.4, 564.2, 437.5, 569.4], "partition"),
  wall("partition-bath-top-right", [442.1, 564.2, 475.8, 568.8], "partition"),
  wall("partition-bath-left", [346.8, 568.8, 351.4, 647.9], "partition"),
  wall("partition-bath-core", [437.5, 568.8, 442.1, 591.5], "partition"),
  wall("partition-pipe-left", [496.6, 565.7, 501.6, 651.6], "partition"),
  wall("partition-pipe-bottom", [442.1, 586.9, 497.0, 591.5], "partition"),
] satisfies FloorplanWallSegment[];

const openings = [
  opening("living-balcony-window", "sliding-door", [154.9, 215.1, 315.1, 215.1], 0, 0.05, 2.3),
  opening("multi-balcony-window", "sliding-door", [323.0, 141.3, 435.4, 141.3], 0, 0.05, 2.3),
  opening("multi-side-door", "door", [530.5, 267.8, 530.5, 317.6], Math.PI / 2, 0, 2.1),
  opening("master-entry-door", "door", [320.8, 469.1, 320.8, 516.7], Math.PI / 2, 0, 2.1, 0.1),
  opening("main-bath-door", "door", [346.8, 566.7, 351.4, 566.7], 0, 0, 2.1, 0.1),
  opening("secondary-bath-door", "door", [437.5, 566.7, 442.1, 566.7], 0, 0, 2.1, 0.1),
  opening("entry-door", "door", [171.7, 651.6, 234.3, 651.6], 0, 0, 2.1),
] satisfies FloorplanOpening[];

const footprint = [
  point(315.7, 137.6), point(534.2, 137.6), point(534.2, 655.3),
  point(147.0, 655.3), point(147.0, 211.3), point(315.7, 211.3),
] as const;

export const A6_SHELL_V1 = {
  schemaVersion: "1.0" as const,
  status: "drawing-audit-runtime-shell" as const,
  source: {
    pdf: "遠雄BH7樣品屋大樣圖 0718.pdf",
    drawingSet: "A6",
    pages: { dimensions: 2, furnishedPlan: 3, ceilingAndHeights: 7 },
    caveat: "Walls and openings trace I1A6-01; proportional depth still requires CAD/Blender verification.",
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

export const A6_EDITABLE_BOUNDS = A6_SHELL_V1.editableBounds;
