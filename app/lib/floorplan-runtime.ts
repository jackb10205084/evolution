import { A11_SHELL_V1 } from "./a11-shell";
import { A6_SHELL_V2 } from "./a6-shell";

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
    shell: A6_SHELL_V2,
    audit: {
      overlayPath: "/assets/floorplans/a6-pdf-overlay.png",
      sourcePage: 2,
      furnishedPage: 3,
      overlayDimensions: [A6_SHELL_V2.dimensions.width, A6_SHELL_V2.dimensions.depth],
      confirmedWidth: 6.825,
      cameraZoom: 45,
      calibration: "confirmed-width-proportional-depth",
    },
    initialPositions: {
      // I1A6-02 room positions, catalog millimetres (do not shrink the 1560x840 sofa to the sample-house 100x230 note).
      "rug-meadow": [-1.85, -1.55], "sofa-cloud": [-1.85, -0.88], "table-pebble": [-1.85, -1.88], "chair-breeze": [-0.92, -2.18], "lamp-moon": [-2.72, -1.28], "plant-olive": [-2.78, -2.58], "shelf-cabin": [-2.95, 0.12],
      "ikea-stoense": [-1.85, -1.55], "ikea-saltsjobaden": [-1.85, -0.88], "ikea-borgeby": [-1.85, -1.88], "ikea-ekenaset": [-0.92, -2.18], "ikea-lauters": [-2.72, -1.28], "ikea-fejka-fig": [-2.78, -2.58], "ikea-kallax": [-2.95, 0.12],
    },
    bonusPositions: {
      "ikea-fejka-fig": [-0.88, 1.18], "ikea-borgeby": [-1.68, 1.38], "ikea-kallax": [0.72, -2.52], "ikea-lauters": [-0.58, 1.52], "bed-soft": [1.82, 0.08],
    },
    candidateSpots: [[-2.35, 0.55], [-1.45, 0.55], [-2.35, -1.45], [-1.25, -1.45], [0.72, -2.15], [0.72, -3.05], [1.55, 0.55], [2.15, 0.55]],
    mascotStart: [-0.82, 1.88],
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
      "rug-meadow": [-2.78, 1.85], "sofa-cloud": [-3, 2.32], "table-pebble": [-2.72, 1.42], "chair-breeze": [-2.08, 2.18], "lamp-moon": [-3.79, 2.73], "plant-olive": [-3.74, 0.55], "shelf-cabin": [-2.7, 0.9],
      "ikea-stoense": [-2.78, 1.85], "ikea-saltsjobaden": [-3.18, 2.32], "ikea-borgeby": [-2.72, 1.42], "ikea-ekenaset": [-2.08, 2.18], "ikea-lauters": [-3.79, 2.73], "ikea-fejka-fig": [-3.74, 0.55], "ikea-kallax": [-2, 2.7],
    },
    bonusPositions: {
      "ikea-fejka-fig": [0.7, 2.2], "ikea-borgeby": [-2.45, 1.2], "ikea-kallax": [2.6, 2.2], "ikea-lauters": [1.4, -2.2], "bed-soft": [1.9, -1.6],
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
