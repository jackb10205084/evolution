import type { FloorplanOpening, FloorplanShell, FloorplanWallSegment } from "./floorplan-runtime";

// PDF p.13, left-hand clean construction plan (AutoCAD point coordinates).
// The bottom 865.0 cm chain anchors X; the upper bathroom projection is kept,
// so the actual bounding width is slightly larger than the front dimension.
const pdfBounds = { x0: 8.04, y0: 139.08, x1: 533.4, y1: 699.24 } as const;
const scale = 8.65 / (515.52 - 8.04);
const width = (pdfBounds.x1 - pdfBounds.x0) * scale;
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
    sourcePage: 13,
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
    sourcePage: 13,
    sourceSpan: span,
  };
}

const walls = [
  // Stepped exterior outline from I1A11-00.
  wall("outer-entry-top-left", [42.1, 139.1, 65.0, 146.4], "outer", "full"),
  wall("outer-entry-top-right", [118.0, 139.1, 151.8, 146.4], "outer", "full"),
  wall("outer-entry-right", [151.8, 139.1, 159.1, 215.6], "outer", "full"),
  wall("outer-kitchen-top-left", [159.1, 212.8, 276.5, 220.2], "outer", "full"),
  wall("outer-kitchen-top-right", [276.5, 212.8, 397.6, 220.2], "outer", "full"),
  wall("outer-structure-block", [8.6, 212.8, 64.2, 302.4], "outer", "full"),
  wall("outer-left-lower", [8.6, 302.4, 16.0, 691.8], "outer", "full"),
  wall("outer-secondary-top", [324.7, 312.0, 490.8, 319.3], "outer", "full"),
  wall("outer-secondary-right", [483.5, 319.3, 490.8, 435.4], "outer"),
  wall("outer-bath-projection-top", [490.8, 435.4, 526.0, 442.7], "outer"),
  wall("outer-bath-projection-right", [526.0, 435.4, 533.4, 530.5], "outer"),
  wall("outer-bath-projection-bottom", [507.6, 523.2, 526.0, 530.5], "outer"),
  wall("outer-master-right-upper", [507.6, 530.5, 514.9, 610.0], "outer"),
  wall("outer-master-right-lower", [507.6, 650.0, 514.9, 691.8], "outer"),
  wall("outer-bottom-left", [8.0, 691.8, 56.0, 699.2], "outer"),
  wall("outer-bottom-living-jamb", [185.0, 691.8, 190.3, 699.2], "outer"),
  wall("outer-bottom-multi-jamb", [327.6, 691.8, 392.2, 699.2], "outer"),
  wall("outer-bottom-right-jamb", [507.6, 691.8, 515.5, 699.2], "outer"),

  // Kitchen, bathroom, secondary room, multi room and master partitions.
  wall("partition-kitchen-left", [56.9, 220.2, 64.2, 295.0], "partition"),
  wall("partition-kitchen-right", [128.5, 215.6, 133.7, 308.9], "partition"),
  wall("partition-bath-left", [185.8, 308.3, 190.3, 443.3], "partition"),
  wall("partition-bath-top", [190.3, 347.4, 276.5, 352.0], "partition"),
  wall("partition-bath-right", [276.5, 409.8, 281.0, 438.1], "partition"),
  wall("partition-secondary-left", [327.6, 352.0, 332.0, 438.1], "partition"),
  wall("partition-upper-lower-left", [190.3, 438.1, 276.0, 442.7], "partition"),
  wall("partition-upper-lower-right", [327.0, 438.1, 483.5, 442.7], "partition"),
  wall("partition-multi-left", [185.3, 499.9, 190.3, 691.3], "partition"),
  wall("partition-multi-master", [327.6, 499.9, 332.6, 691.3], "partition"),
  wall("partition-service-core-left", [387.1, 442.7, 391.6, 523.2], "partition"),
  wall("partition-service-core-right", [475.0, 442.7, 479.5, 468.2], "partition"),
] satisfies FloorplanWallSegment[];

const openings = [
  opening("entry-door", "door", [65.0, 142.7, 118.0, 142.7], 0, 0, 2.1),
  opening("secondary-door", "door", [283.9, 348.3, 324.7, 348.3], 0, 0, 2.1, 0.1),
  opening("bath-door", "door", [276.0, 440.4, 327.0, 440.4], 0, 0, 2.1, 0.1),
  opening("multi-room-door", "door", [187.8, 443.3, 187.8, 499.9], Math.PI / 2, 0, 2.1, 0.1),
  opening("master-entry-door", "door", [511.2, 610.0, 511.2, 650.0], Math.PI / 2, 0, 2.1),
  opening("living-front-window", "sliding-door", [56.0, 695.5, 185.0, 695.5], 0, 0.05, 2.3),
  opening("multi-front-window", "sliding-door", [190.3, 695.5, 327.6, 695.5], 0, 0.05, 2.3),
  opening("master-front-window", "sliding-door", [392.2, 695.5, 507.6, 695.5], 0, 0.05, 2.3),
  opening("secondary-side-window", "window", [487.1, 344.6, 487.1, 435.4], Math.PI / 2, 0.72, 1.42),
] satisfies FloorplanOpening[];

const footprint = [
  point(42.1, 139.1), point(159.1, 139.1), point(159.1, 212.8),
  point(397.6, 212.8), point(397.6, 312.0), point(490.8, 312.0),
  point(490.8, 435.4), point(533.4, 435.4), point(533.4, 530.5),
  point(514.9, 530.5), point(514.9, 699.2), point(8.0, 699.2),
  point(8.0, 294.4), point(42.1, 294.4),
] as const;

export const A11_SHELL_V1 = {
  schemaVersion: "1.0" as const,
  status: "drawing-audit-runtime-shell" as const,
  source: {
    pdf: "遠雄BH7樣品屋大樣圖 0718.pdf",
    drawingSet: "A11",
    pages: { dimensions: 13, furnishedPlan: 14, ceilingAndHeights: 18 },
    caveat: "Walls, stepped outline and openings trace I1A11-00; proportional depth still requires CAD/Blender verification.",
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
