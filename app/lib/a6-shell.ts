import type { FloorplanOpening, FloorplanShell, FloorplanWallSegment } from "./floorplan-runtime";

// I1A6-01 (PDF p.2) left-hand construction plan, AutoCAD page coordinates.
// X is anchored to the labeled 682.5 cm overall width. Y uses the SAME scale.
// There is no single labeled overall depth; left/right vertical chains each
// SUM to 915 cm, while this width-scale envelope is 518.76 pt → ~9.115 m.
const pdfBounds = { x0: 146.4, y0: 137.04, x1: 534.84, y1: 655.8 } as const;
const width = 6.825;
const scale = width / (pdfBounds.x1 - pdfBounds.x0);
const depth = (pdfBounds.y1 - pdfBounds.y0) * scale;
const wallHeight = 2.85;
const outer = 0.15;
const centerX = (pdfBounds.x0 + pdfBounds.x1) / 2;
const centerY = (pdfBounds.y0 + pdfBounds.y1) / 2;

/** Convert labeled centimetres to PDF user-space using the confirmed width scale. */
const cm = (n: number) => n / 100 / scale;

const point = (x: number, y: number) => [(x - centerX) * scale, (y - centerY) * scale] as const;

function wall(
  id: string,
  rect: readonly [number, number, number, number],
  kind: FloorplanWallSegment["kind"],
  view: FloorplanWallSegment["view"] = "cutaway",
  height = wallHeight,
): FloorplanWallSegment {
  const [x0, y0, x1, y1] = rect;
  return {
    id,
    center: point((x0 + x1) / 2, (y0 + y1) / 2),
    size: [(x1 - x0) * scale, (y1 - y0) * scale],
    height,
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

// --- vector anchors from I1A6-01 left poche / thick strokes ---
const columnEast = 184.68;
const balconyWallY0 = 210.84;
const balconyWallY1 = 219.36;
const sliderStart = columnEast + cm(7.5); // 7.5 cm labeled left jamb
const sliderEnd = sliderStart + cm(220); // 220 cm labeled inner opening
const multiLeftX0 = 315.12;
const multiLeftX1 = 323.64;
const multiTopY0 = 137.64;
const multiTopY1 = 145.08;
const multiWin70X0 = 325.8;
const multiWin70X1 = 365.52;
const multiGlassX0 = 365.52;
const multiGlassX1 = 431.28;
const g15HatchX0 = 444.12;
const g15HatchX1 = 493.68;
const g15Center = (g15HatchX0 + g15HatchX1) / 2;
const g15X0 = g15Center - cm(35);
const g15X1 = g15Center + cm(35);
const rightX0 = 526.92;
const rightX1 = 534.24;
const b9CenterY = 237.64;
const b9Y0 = b9CenterY - cm(35);
const b9Y1 = b9CenterY + cm(35);
const bottomY0 = 647.88;
const bottomY1 = 655.8;
const entryJambL = 171.96;
const entryJambR = 234.36;
const spineX0 = 318.0;
const spineX1 = 323.64;
const multiDoorY0 = 222.36;
const multiDoorY1 = 276.0;
const masterDoorY0 = 469.08;
const masterDoorY1 = 516.72;
const ensuiteX0 = 384.6;
const ensuiteX1 = 390.24;
const ensuiteDoorY0 = 484.32;
const ensuiteDoorY1 = 529.68;
const guestBathX0 = 346.32;
const guestBathX1 = 351.96;
const guestDoorY0 = 602.04;
const guestDoorY1 = 647.4;
// I1A6-01 right-sheet door leaf onto 右陽台, mapped to left coords (offset 498.727).
// Closed leaf 431.51–434.39 × 149.52–199.44 = 49.92 pt = 87.7 cm. No labeled door width.
const multiAcX0 = 435.6;
const multiAcX1 = 444.12;
const multiBalconyDoorY0 = 149.52;
const multiBalconyDoorY1 = 199.44;
const multiAcMidX = (multiAcX0 + multiAcX1) / 2;
const parapetY1 = 145.56; // inner face of thin north double line (8.52 pt = 15 cm)

const walls = [
  // Exterior / structural poche from I1A6-01. Openings are gaps in these runs.
  wall("outer-balcony-column", [146.4, 137.04, columnEast, balconyWallY0], "outer", "full"),
  wall("outer-balcony-sill", [146.4, balconyWallY0, sliderStart, balconyWallY1], "outer", "full"),
  wall("outer-multi-left", [multiLeftX0, 137.04, multiLeftX1, balconyWallY1], "outer", "full"),
  // 右陽台 is the east vertical strip east of partition-multi-ac, north parapet
  // down to partition-multi-master-right (444.12–534.24, 137.04–325.08).
  // L-shaped around 多功能室: G15 on the north, B9 on the east.
  // 多功能室 stays west of that partition and still meets the north outer wall
  // (x≈323–436, y=137–325). outer-ac-block sits ON the balcony.
  // I1A6-01 right + I1A6-02 show a door leaf at the north of partition-multi-ac.
  // 左陽台 north edge is a 15 cm 女兒牆 (thin double line), not a window.
  wall("outer-balcony-parapet", [columnEast, 137.04, multiLeftX0, parapetY1], "outer", "full", 1.1),
  wall("outer-multi-top-west-jamb", [323.04, multiTopY0, multiWin70X0, multiTopY1], "outer", "full"),
  wall("outer-multi-top-between-glass-g15", [multiGlassX1, multiTopY0, g15X0, multiTopY1], "outer", "full"),
  wall("outer-multi-top-east", [g15X1, multiTopY0, rightX0, multiTopY1], "outer", "full"),
  wall("outer-right-above-b9", [rightX0, 137.64, rightX1, b9Y0], "outer", "cutaway"),
  wall("outer-right-below-b9", [rightX0, b9Y1, rightX1, 655.32], "outer", "cutaway"),
  wall("outer-ac-block", [493.68, 145.08, 526.32, 210.84], "outer", "full"),
  wall("outer-left-upper", [146.4, 219.36, 154.92, 284.52], "outer", "full"),
  wall("outer-left-corner", [146.4, 284.52, 154.92, 293.04], "outer", "full"),
  wall("outer-left-lower", [146.4, 293.04, 154.92, 647.88], "outer", "full"),
  wall("outer-bottom-left-jamb", [146.4, bottomY0, entryJambL, bottomY1], "outer", "cutaway"),
  // Julian: 下方不是窗是牆 — south run is solid from entry jamb to east corner.
  // Printed G11 70×100 is not an opening in this shell.
  wall("outer-bottom-from-entry", [entryJambR, bottomY0, 534.24, bottomY1], "outer", "cutaway"),
  wall("outer-pipe-block", [502.2, 570.84, 526.32, 647.4], "outer", "cutaway"),

  // Room boundaries: 多功能室 / 主臥 / 雙衛浴 / 管道間 / 玄關.
  wall("partition-multi-ac-north-jamb", [multiAcX0, 145.08, multiAcX1, multiBalconyDoorY0], "partition"),
  wall("partition-multi-ac-south", [multiAcX0, multiBalconyDoorY1, multiAcX1, 325.08], "partition"),
  wall("partition-spine-stub", [spineX0, 219.36, spineX1, multiDoorY0], "partition"),
  wall("partition-spine-upper", [spineX0, multiDoorY1, spineX1, masterDoorY0], "partition"),
  wall("partition-spine-lower", [spineX0, masterDoorY1, spineX1, 569.4], "partition"),
  wall("partition-multi-master-left", [323.64, 319.92, 436.2, 325.56], "partition"),
  wall("partition-multi-master-right", [443.52, 317.64, 526.92, 325.08], "partition"),
  wall("partition-master-bath", [385.08, 478.68, 526.92, 484.32], "partition"),
  wall("partition-ensuite-head", [ensuiteX0, 478.68, ensuiteX1, ensuiteDoorY0], "partition"),
  wall("partition-ensuite-jamb", [ensuiteX0, ensuiteDoorY1, ensuiteX1, 564.24], "partition"),
  wall("partition-bath-top-left", [323.64, 563.76, 346.8, 569.4], "partition"),
  wall("partition-bath-top-center", [351.36, 563.76, 437.52, 569.4], "partition"),
  wall("partition-bath-top-right", [442.08, 563.76, 475.8, 569.4], "partition"),
  wall("partition-guest-bath-head", [guestBathX0, 568.8, guestBathX1, guestDoorY0], "partition"),
  wall("partition-bath-core", [437.52, 568.8, 442.08, 591.48], "partition"),
  wall("partition-pipe-left", [496.56, 565.68, 501.6, 651.6], "partition"),
  wall("partition-pipe-bottom", [442.08, 586.92, 497.04, 591.48], "partition"),
  wall("partition-bath-pipe-jog", [475.8, 549.6, 480.36, 568.8], "partition"),
  wall("partition-bath-pipe-shelf", [480.36, 549.6, 526.92, 555.24], "partition"),
  wall("partition-entry-dining", [154.92, 563.76, 262.68, 573.96], "partition"),
  wall("partition-entry-cabinet", [154.92, 573.96, 166.32, 647.4], "partition"),
] satisfies FloorplanWallSegment[];

const openings = [
  opening("living-balcony-door", "sliding-door", [sliderStart, 215.1, sliderEnd, 215.1], 0, 0.05, 2.3),
  // 多功能室 north is the outer envelope (70 + 115 glass). No invented inner balcony wall.
  opening("multi-north-window", "window", [multiWin70X0, 141.3, multiWin70X1, 141.3], 0, 0.9, 1.0),
  opening("multi-north-glass", "window", [multiGlassX0, 141.3, multiGlassX1, 141.3], 0, 0.9, 1.0),
  opening("g15-window", "window", [g15X0, 141.3, g15X1, 141.3], 0, 0.9, 1.0),
  opening("b9-window", "window", [530.58, b9Y0, 530.58, b9Y1], Math.PI / 2, 0.9, 1.0),
  // 多功能室 → 右陽台. Leaf 49.92 pt = 87.7 cm from I1A6-01 right / I1A6-02. Not 220.
  opening("multi-balcony-door", "door", [multiAcMidX, multiBalconyDoorY0, multiAcMidX, multiBalconyDoorY1], Math.PI / 2, 0, 2.1, 0.15),
  opening("multi-entry-door", "door", [320.82, multiDoorY0, 320.82, multiDoorY1], Math.PI / 2, 0, 2.1, 0.1),
  opening("master-entry-door", "door", [320.82, masterDoorY0, 320.82, masterDoorY1], Math.PI / 2, 0, 2.1, 0.1),
  opening("ensuite-door", "door", [387.42, ensuiteDoorY0, 387.42, ensuiteDoorY1], Math.PI / 2, 0, 2.1, 0.1),
  opening("guest-bath-door", "door", [349.14, guestDoorY0, 349.14, guestDoorY1], Math.PI / 2, 0, 2.1, 0.1),
  opening("entry-door", "door", [entryJambL, 651.6, entryJambR, 651.6], 0, 0, 2.1),
] satisfies FloorplanOpening[];

const footprint = [
  point(146.4, 137.04), point(315.12, 137.04), point(534.24, 137.04),
  point(534.24, 655.8), point(146.4, 655.8), point(146.4, 137.04),
] as const;

export const A6_SHELL_V3 = {
  schemaVersion: "1.0" as const,
  status: "drawing-audit-runtime-shell" as const,
  source: {
    pdf: "遠雄BH7樣品屋大樣圖 0718.pdf",
    drawingSet: "A6",
    pages: { dimensions: 2, furnishedPlan: 3, ceilingAndHeights: 7 },
    caveat: "Walls and openings trace I1A6-01. 左陽台 is the living-north 130 cm band (220 cm slider). 右陽台 is the east vertical strip 444.12–534.24 × 137.04–325.08 (partition-multi-master-right is the south edge), L-shaped around 多功能室 with G15 north and B9 east. 多功能室 stays west of partition-multi-ac and still meets the north outer wall. outer-ac-block sits on 右陽台. partition-multi-ac is split for a 87.7 cm door (I1A6-01 right leaf 149.52–199.44) onto 右陽台; G15 stays the balcony north window. 左陽台 north edge is a 1.10 m 女兒牆 (15 cm poche). South envelope from the entry jamb to the east corner is solid wall (Julian: 下方不是窗是牆); printed G11 70×100 is not an opening in this shell. 682.5 cm width is labeled. Depth uses the same width scale (~9.115 m). Ceiling collision height 2.85 m is an interactive simplification.",
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

/** @deprecated Use A6_SHELL_V3. Alias kept so older adapters keep resolving. */
export const A6_SHELL_V2 = A6_SHELL_V3;

/** @deprecated Use A6_SHELL_V3. Kept so older adapters keep resolving. */
export const A6_SHELL_V1 = A6_SHELL_V3;

export const A6_EDITABLE_BOUNDS = A6_SHELL_V3.editableBounds;
