import { A11_SHELL_V1 } from "./a11-shell";
import { A6_SHELL_V3 } from "./a6-shell";

export type FloorplanWallSegment = {
  id: string;
  center: readonly [number, number];
  size: readonly [number, number];
  height: number;
  kind: "outer" | "partition" | "window";
  rotationY?: number;
  view?: "full" | "cutaway";
  sourceRect?: readonly [number, number, number, number];
  sourcePage: number;
};

export type FloorplanOpening = {
  id: string;
  type: "door" | "window" | "sliding-door";
  center: readonly [number, number];
  width: number;
  rotationY: number;
  sill: number;
  height: number;
  wallThickness: number;
  sourcePage: number;
  sourceSpan?: readonly [number, number, number, number];
};

export type FloorplanShell = {
  schemaVersion: "1.0";
  status: "drawing-audit-runtime-shell";
  source: {
    pdf: string;
    drawingSet: string;
    pages: { dimensions: number; furnishedPlan: number; ceilingAndHeights: number };
    caveat: string;
  };
  dimensions: { width: number; depth: number; wallHeight: number; outerWall: number; partitionWall: number };
  footprint: readonly (readonly [number, number])[];
  openings: readonly FloorplanOpening[];
  editableBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  walls: readonly FloorplanWallSegment[];
  collisionWalls: readonly FloorplanWallSegment[];
};

export type FloorplanRuntime = {
  floorplanId: "bh7-a6" | "bh7-a11";
  shell: FloorplanShell;
  audit: {
    overlayPath: string;
    sourcePage: number;
    furnishedPage: number;
    overlayDimensions: readonly [number, number];
    confirmedWidth: number;
    cameraZoom: number;
    calibration: "confirmed-width-proportional-depth";
  };
  initialPositions: Readonly<Record<string, readonly [number, number]>>;
  bonusPositions: Readonly<Record<string, readonly [number, number]>>;
  candidateSpots: readonly (readonly [number, number])[];
  mascotStart: readonly [number, number];
  cameraZoom: number;
};

const runtimes: Record<FloorplanRuntime["floorplanId"], FloorplanRuntime> = {
  "bh7-a6": {
    floorplanId: "bh7-a6",
    shell: A6_SHELL_V3,
    audit: {
      overlayPath: "/assets/floorplans/a6-pdf-overlay.png",
      sourcePage: 2,
      furnishedPage: 3,
      overlayDimensions: [A6_SHELL_V3.dimensions.width, A6_SHELL_V3.dimensions.depth],
      confirmedWidth: 6.825,
      cameraZoom: 45,
      calibration: "confirmed-width-proportional-depth",
    },
    initialPositions: {
      // 銷講簡報 p4–p20 完成方案. World xz = A6_SHELL_V3 scale (6.825 m / 388.44 pt).
      // Catalog mm stay catalog — sofa 1560x840, not the sample-house 100x230 note.
      // Yaw: sofa stays in sideFacingFurnitureIds (−90°) so it FACES the spine/TV wall.
      // sofa-cloud: 客廳, balcony-window end (p7/p17/p20). Back to west light, face spine.
      // Nudged east of outer-left (~0.56 m gap) and north toward 220 slider light. Catalog 1560×840.
      "sofa-cloud": [-2.28, -2.02],
      // table-pla-tb-02 380: coffee in front of sofa toward the spine. Deck 50x75 zone; 700 is too big.
      "table-pla-tb-02": [-1.40, -2.02],
      // table-pebble PLA-TB-01 700: NOT the default coffee. Parked only if someone adds the SKU later.
      "table-pebble": [-1.40, -1.18],
      // chair-breeze: lounge seat south of coffee (deck bar stools have no SKU). Yaw π faces the group.
      "chair-breeze": [-1.36, -1.15],
      // rug-meadow: under sofa + 380 coffee group.
      "rug-meadow": [-1.82, -1.88],
      // lamp-moon: 客廳 balcony-window corner (p20 afternoon light).
      "lamp-moon": [-2.88, -2.96],
      // plant-olive: living window corner, inside the slider.
      "plant-olive": [-2.08, -2.86],
      // table-dme52-1000/800: NOT in the A6 完成方案 (deck uses a breakfast bar, no dining table).
      // Positions kept so a manual add still resolves; default loadout omits them.
      "table-dme52-1000": [-1.70, 1.90],
      "table-dme52-800": [-1.70, 1.90],
      // bed-soft: 主臥, headboard toward bath (south, +Z). Shifted west so east edge (~2.39) clears
      // master-balcony-door west jamb (~2.58) into 右陽台. West entry door kept clear.
      "bed-soft": [1.48, 0.22],
      // shelf-cabin: omitted from loadout — 1650 h would read as a floor divider, not a TV console.
      // Stored against 多功能室 east wall as an add-spot only. No invented desk/daybed.
      "shelf-cabin": [1.40, -2.80],
      "ikea-stoense": [-1.82, -1.88], "ikea-saltsjobaden": [-2.28, -2.02], "ikea-borgeby": [-1.40, -2.02],
      "ikea-ekenaset": [-1.36, -1.15], "ikea-lauters": [-2.88, -2.96], "ikea-fejka-fig": [-2.08, -2.86],
      "ikea-kallax": [1.40, -2.80],
    },
    bonusPositions: {
      "ikea-fejka-fig": [-0.95, 2.55], "ikea-borgeby": [-1.15, 1.15], "ikea-kallax": [0.72, -2.52],
      "ikea-lauters": [-0.70, 1.55], "bed-soft": [1.48, 0.22],
    },
    candidateSpots: [[-2.20, 0.45], [-1.35, 0.45], [-2.20, -1.85], [-1.20, -1.85], [0.75, -2.20], [0.75, -3.20], [1.45, 0.55], [2.10, 0.55]],
    mascotStart: [-0.85, 2.15],
    cameraZoom: 57,
  },
  "bh7-a11": {
    floorplanId: "bh7-a11",
    shell: A11_SHELL_V1,
    audit: {
      overlayPath: "/assets/floorplans/a11-pdf-overlay.png",
      sourcePage: 13,
      furnishedPage: 14,
      overlayDimensions: [A11_SHELL_V1.dimensions.width, A11_SHELL_V1.dimensions.depth],
      confirmedWidth: 8.65,
      cameraZoom: 40,
      calibration: "confirmed-width-proportional-depth",
    },
    initialPositions: {
      "rug-meadow": [-2.78, 1.85], "sofa-cloud": [-3, 2.32], "table-pebble": [-2.72, 1.42], "table-pla-tb-02": [-2.15, 1.05], "chair-breeze": [-2.08, 2.18], "lamp-moon": [-3.79, 2.73], "plant-olive": [-3.74, 0.55], "shelf-cabin": [-2.7, 0.9],
      "table-dme52-1000": [-2.45, 0.70], "table-dme52-800": [-2.45, 0.70], "bed-soft": [0.90, -2.45],
      "ikea-stoense": [-2.78, 1.85], "ikea-saltsjobaden": [-3.18, 2.32], "ikea-borgeby": [-2.72, 1.42], "ikea-ekenaset": [-2.08, 2.18], "ikea-lauters": [-3.79, 2.73], "ikea-fejka-fig": [-3.74, 0.55], "ikea-kallax": [-2, 2.7],
    },
    bonusPositions: {
      "ikea-fejka-fig": [0.7, 2.2], "ikea-borgeby": [-2.45, 1.2], "ikea-kallax": [2.6, 2.2], "ikea-lauters": [1.4, -2.2], "bed-soft": [0.90, -2.45],
    },
    candidateSpots: [[-3.4, 1.35], [-2.45, 1.2], [-3.55, 2.65], [-2.25, 2.7], [0.7, 2.2], [2.6, 2.2], [1.4, -2.2], [2.2, -2.15]],
    mascotStart: [-2.15, 0.78],
    cameraZoom: 52,
  },
};

export function getFloorplanRuntime(floorplanId: string): FloorplanRuntime | null {
  return runtimes[floorplanId as FloorplanRuntime["floorplanId"]] ?? null;
}

export function resolveFloorplanPlacement(
  floorplanId: string,
  requested: { x: number; z: number },
  footprint: { width: number; depth: number },
) {
  const runtime = getFloorplanRuntime(floorplanId);
  if (!runtime) return { ...requested, blocked: true };
  const { editableBounds } = runtime.shell;
  const halfWidth = footprint.width / 2;
  const halfDepth = footprint.depth / 2;
  const x = Math.min(editableBounds.maxX - halfWidth, Math.max(editableBounds.minX + halfWidth, requested.x));
  const z = Math.min(editableBounds.maxZ - halfDepth, Math.max(editableBounds.minZ + halfDepth, requested.z));
  const footprintCorners = [
    [x - halfWidth, z - halfDepth],
    [x + halfWidth, z - halfDepth],
    [x + halfWidth, z + halfDepth],
    [x - halfWidth, z + halfDepth],
  ] as const;
  const outsideFootprint = footprintCorners.some(([cornerX, cornerZ]) => !pointInPolygon(cornerX, cornerZ, runtime.shell.footprint));
  const intersectsWall = runtime.shell.walls
    .filter((wall) => wall.kind === "partition")
    .some((wall) => intersectsRotatedWall(x, z, halfWidth, halfDepth, wall));
  return { x, z, blocked: outsideFootprint || intersectsWall };
}

function pointInPolygon(x: number, z: number, polygon: readonly (readonly [number, number])[]) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const [currentX, currentZ] = polygon[index];
    const [previousX, previousZ] = polygon[previous];
    const crosses = (currentZ > z) !== (previousZ > z)
      && x < ((previousX - currentX) * (z - currentZ)) / (previousZ - currentZ) + currentX;
    if (crosses) inside = !inside;
  }
  return inside;
}

function intersectsRotatedWall(x: number, z: number, halfWidth: number, halfDepth: number, wall: FloorplanWallSegment) {
  const angle = -(wall.rotationY ?? 0);
  const dx = x - wall.center[0];
  const dz = z - wall.center[1];
  const localX = dx * Math.cos(angle) - dz * Math.sin(angle);
  const localZ = dx * Math.sin(angle) + dz * Math.cos(angle);
  return Math.abs(localX) < halfWidth + wall.size[0] / 2
    && Math.abs(localZ) < halfDepth + wall.size[1] / 2;
}
