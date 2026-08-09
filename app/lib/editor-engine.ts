import type { FurnitureItem, SceneObjectV1 } from "./domain";

type Point2 = readonly [number, number];

export type EditorFloorplan = {
  id: string;
  footprint: readonly Point2[];
  editableBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  walls: readonly {
    id: string;
    center: Point2;
    size: Point2;
    rotationY?: number;
    kind: "outer" | "partition" | "window";
  }[];
  openings: readonly {
    id: string;
    type: "door" | "window" | "sliding-door";
    center: Point2;
    width: number;
    rotationY: number;
    wallThickness: number;
  }[];
  candidateSpots: readonly Point2[];
};

export type EditorView = {
  items: SceneObjectV1[];
  selectedId: string | null;
  canUndo: boolean;
  canRedo: boolean;
};

export type EditorEffect = {
  kind: "blocked" | "warning" | "info";
  code:
    | "outside-floorplan"
    | "wall-collision"
    | "door-clearance"
    | "furniture-overlap"
    | "missing-product"
    | "out-of-stock"
    | "no-open-spot"
    | "circulation-warning";
  message: string;
};

export type EditorCommand =
  | { type: "select"; id: string | null }
  | { type: "move.update"; id: string; x: number; z: number }
  | { type: "move.end"; id: string }
  | { type: "rotate"; id: string; radians?: number }
  | { type: "material.next"; id: string }
  | { type: "remove"; id: string }
  | { type: "add"; productId: string }
  | { type: "replace"; items: SceneObjectV1[]; selectedId?: string | null; recordHistory?: boolean }
  | { type: "undo" }
  | { type: "redo" };

export type EditorResult = {
  view: EditorView;
  effect?: EditorEffect;
};

export type EditorEngine = {
  load(input: { floorplanId: string; items: SceneObjectV1[]; selectedId?: string | null }): EditorView;
  dispatch(command: EditorCommand): EditorResult;
  view(): EditorView;
  snapshot(): SceneObjectV1[];
};

type OrientedRect = {
  center: Point2;
  width: number;
  depth: number;
  rotation: number;
};

type EngineOptions = {
  products: readonly FurnitureItem[];
  floorplans: readonly EditorFloorplan[];
  idFactory?: () => string;
  historyLimit?: number;
};

const DEFAULT_ROTATION_STEP = Math.PI / 4;
const COLLISION_INSET = 0.035;
const CIRCULATION_CLEARANCE = 0.45;

/**
 * Owns every physical editing invariant behind one small interface. Callers
 * render EditorView and send commands; they never duplicate placement rules.
 */
export function createEditorEngine(options: EngineOptions): EditorEngine {
  const productsById = new Map(options.products.map((product) => [product.id, product]));
  const productsBySku = new Map(options.products.map((product) => [product.sku, product]));
  const floorplans = new Map(options.floorplans.map((floorplan) => [floorplan.id, floorplan]));
  const historyLimit = options.historyLimit ?? 40;
  const idFactory = options.idFactory ?? (() => crypto.randomUUID());

  let floorplanId = options.floorplans[0]?.id ?? "";
  let items: SceneObjectV1[] = [];
  let selectedId: string | null = null;
  let past: SceneObjectV1[][] = [];
  let future: SceneObjectV1[][] = [];
  let dragOrigin: SceneObjectV1[] | null = null;

  const currentView = (): EditorView => ({
    items: cloneItems(items),
    selectedId,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  });

  const result = (effect?: EditorEffect): EditorResult => ({ view: currentView(), effect });

  const checkpoint = (nextItems: SceneObjectV1[]) => {
    past = [...past.slice(-(historyLimit - 1)), cloneItems(items)];
    future = [];
    items = cloneItems(nextItems);
    dragOrigin = null;
  };

  const productForObject = (object: SceneObjectV1) => productsBySku.get(object.sku);

  const validateObject = (object: SceneObjectV1, ignoredId = object.id): EditorEffect | undefined => {
    const floorplan = floorplans.get(floorplanId);
    const product = productForObject(object);
    if (!floorplan || !product) {
      return blocked("missing-product", "找不到這件家具的正式尺寸資料");
    }

    const rect = objectRect(object, product);
    const corners = rectCorners(rect);
    if (corners.some(([x, z]) => !pointInPolygon(x, z, floorplan.footprint))) {
      return blocked("outside-floorplan", "家具不可超出房間範圍");
    }

    const wallHit = floorplan.walls
      .filter((wall) => wall.kind !== "window")
      .some((wall) => rectanglesOverlap(rect, {
        center: wall.center,
        width: wall.size[0],
        depth: wall.size[1],
        rotation: wall.rotationY ?? 0,
      }));
    if (wallHit) return blocked("wall-collision", "這裡會穿過牆面或固定隔間");

    if (product.shape !== "rug") {
      const doorHit = floorplan.openings
        .filter((opening) => opening.type === "door")
        .some((opening) => rectanglesOverlap(rect, doorClearanceRect(opening)));
      if (doorHit) return blocked("door-clearance", "這裡會擋住門口的開啟與通行空間");
    }

    const furnitureHit = items.some((other) => {
      if (other.id === ignoredId) return false;
      const otherProduct = productForObject(other);
      if (!otherProduct || product.shape === "rug" || otherProduct.shape === "rug") return false;
      return rectanglesOverlap(shrinkRect(rect, COLLISION_INSET), shrinkRect(objectRect(other, otherProduct), COLLISION_INSET));
    });
    if (furnitureHit) return blocked("furniture-overlap", "這裡會與其他家具重疊");
    return undefined;
  };

  const circulationEffect = (object: SceneObjectV1): EditorEffect | undefined => {
    const product = productForObject(object);
    if (!product || product.shape === "rug") return undefined;
    const expanded = growRect(objectRect(object, product), CIRCULATION_CLEARANCE);
    const tight = items.some((other) => {
      if (other.id === object.id) return false;
      const otherProduct = productForObject(other);
      if (!otherProduct || otherProduct.shape === "rug") return false;
      return rectanglesOverlap(expanded, objectRect(other, otherProduct));
    });
    return tight
      ? { kind: "warning", code: "circulation-warning", message: "家具可放置，但周圍生活動線可能偏窄" }
      : undefined;
  };

  const moveObject = (id: string, x: number, z: number): EditorResult => {
    const floorplan = floorplans.get(floorplanId);
    const current = items.find((item) => item.id === id);
    const product = current && productForObject(current);
    if (!floorplan || !current || !product) return result(blocked("missing-product", "找不到這件家具的正式尺寸資料"));

    if (!dragOrigin) dragOrigin = cloneItems(items);
    const clamped = clampCenter({ x, z }, product.size, quaternionToY(current.rotation), floorplan.editableBounds);
    const nextObject = { ...current, position: { ...current.position, x: clamped.x, z: clamped.z } };
    const validation = validateObject(nextObject);
    if (validation) return result(validation);
    items = items.map((item) => item.id === id ? nextObject : item);
    selectedId = id;
    return result();
  };

  return {
    load(input) {
      if (!floorplans.has(input.floorplanId)) throw new Error(`Unknown editor floorplan: ${input.floorplanId}`);
      floorplanId = input.floorplanId;
      items = cloneItems(input.items);
      selectedId = input.selectedId ?? input.items[0]?.id ?? null;
      past = [];
      future = [];
      dragOrigin = null;
      return currentView();
    },

    dispatch(command) {
      switch (command.type) {
        case "select":
          selectedId = command.id && items.some((item) => item.id === command.id) ? command.id : null;
          return result();
        case "move.update":
          return moveObject(command.id, command.x, command.z);
        case "move.end": {
          const moved = items.find((item) => item.id === command.id);
          if (dragOrigin && !sameItems(dragOrigin, items)) {
            past = [...past.slice(-(historyLimit - 1)), dragOrigin];
            future = [];
          }
          dragOrigin = null;
          return result(moved ? circulationEffect(moved) : undefined);
        }
        case "rotate": {
          const current = items.find((item) => item.id === command.id);
          if (!current) return result(blocked("missing-product", "找不到要旋轉的家具"));
          const nextObject = {
            ...current,
            rotation: quaternionFromY(quaternionToY(current.rotation) + (command.radians ?? DEFAULT_ROTATION_STEP)),
          };
          const validation = validateObject(nextObject);
          if (validation) return result(validation);
          checkpoint(items.map((item) => item.id === command.id ? nextObject : item));
          selectedId = command.id;
          return result(circulationEffect(nextObject));
        }
        case "material.next": {
          if (!items.some((item) => item.id === command.id)) return result(blocked("missing-product", "找不到要換色的家具"));
          checkpoint(items.map((item) => item.id === command.id ? { ...item, materialVariant: item.materialVariant + 1 } : item));
          selectedId = command.id;
          return result();
        }
        case "remove": {
          if (!items.some((item) => item.id === command.id)) return result(blocked("missing-product", "找不到要移除的家具"));
          checkpoint(items.filter((item) => item.id !== command.id));
          selectedId = null;
          return result({ kind: "info", code: "missing-product", message: "已從房間移除" });
        }
        case "add": {
          const floorplan = floorplans.get(floorplanId);
          const product = productsById.get(command.productId);
          if (!floorplan || !product) return result(blocked("missing-product", "找不到這件家具的正式尺寸資料"));
          if (product.stock === "out_of_stock") return result(blocked("out-of-stock", "這件家具目前缺貨，暫時不能加入新配置"));
          const spot = floorplan.candidateSpots.find(([x, z]) => {
            const candidate = sceneObject(product, x, z, "candidate");
            return !validateObject(candidate, candidate.id);
          });
          if (!spot) return result(blocked("no-open-spot", "房間沒有足夠空間，請先移動其他家具"));
          const nextObject = sceneObject(product, spot[0], spot[1], `scene-${product.id}-${idFactory()}`);
          checkpoint([...items, nextObject]);
          selectedId = nextObject.id;
          return result({ kind: "info", code: "no-open-spot", message: `${product.name} 已放入房間` });
        }
        case "replace":
          if (command.recordHistory) checkpoint(command.items);
          else {
            items = cloneItems(command.items);
            past = [];
            future = [];
            dragOrigin = null;
          }
          selectedId = command.selectedId ?? command.items[0]?.id ?? null;
          return result();
        case "undo": {
          const previous = past.at(-1);
          if (!previous) return result();
          future = [...future, cloneItems(items)];
          items = cloneItems(previous);
          past = past.slice(0, -1);
          if (selectedId && !items.some((item) => item.id === selectedId)) selectedId = items[0]?.id ?? null;
          dragOrigin = null;
          return result();
        }
        case "redo": {
          const next = future.at(-1);
          if (!next) return result();
          past = [...past.slice(-(historyLimit - 1)), cloneItems(items)];
          items = cloneItems(next);
          future = future.slice(0, -1);
          if (selectedId && !items.some((item) => item.id === selectedId)) selectedId = items[0]?.id ?? null;
          dragOrigin = null;
          return result();
        }
      }
    },

    view: currentView,
    snapshot: () => cloneItems(items),
  };
}

function sceneObject(product: FurnitureItem, x: number, z: number, id: string): SceneObjectV1 {
  return {
    id,
    sku: product.sku,
    assetVersion: product.assetVersion,
    position: { x, y: 0, z },
    rotation: quaternionFromY(0),
    materialVariant: 0,
  };
}

function objectRect(object: SceneObjectV1, product: FurnitureItem): OrientedRect {
  return {
    center: [object.position.x, object.position.z],
    width: product.size.width,
    depth: product.size.depth,
    rotation: quaternionToY(object.rotation),
  };
}

function doorClearanceRect(opening: EditorFloorplan["openings"][number]): OrientedRect {
  return {
    center: opening.center,
    width: opening.width,
    depth: Math.max(0.72, opening.width * 0.72) + opening.wallThickness,
    rotation: opening.rotationY,
  };
}

function clampCenter(
  requested: { x: number; z: number },
  size: FurnitureItem["size"],
  rotation: number,
  bounds: EditorFloorplan["editableBounds"],
) {
  const c = Math.abs(Math.cos(rotation));
  const s = Math.abs(Math.sin(rotation));
  const halfX = c * size.width / 2 + s * size.depth / 2;
  const halfZ = s * size.width / 2 + c * size.depth / 2;
  return {
    x: Math.min(bounds.maxX - halfX, Math.max(bounds.minX + halfX, requested.x)),
    z: Math.min(bounds.maxZ - halfZ, Math.max(bounds.minZ + halfZ, requested.z)),
  };
}

function rectCorners(rect: OrientedRect): Point2[] {
  const halfWidth = rect.width / 2;
  const halfDepth = rect.depth / 2;
  const c = Math.cos(rect.rotation);
  const s = Math.sin(rect.rotation);
  return [
    [-halfWidth, -halfDepth], [halfWidth, -halfDepth], [halfWidth, halfDepth], [-halfWidth, halfDepth],
  ].map(([x, z]) => [rect.center[0] + x * c - z * s, rect.center[1] + x * s + z * c] as const);
}

function rectanglesOverlap(a: OrientedRect, b: OrientedRect) {
  const aCorners = rectCorners(a);
  const bCorners = rectCorners(b);
  const axes = [...rectAxes(aCorners), ...rectAxes(bCorners)];
  return axes.every((axis) => projectionsOverlap(project(aCorners, axis), project(bCorners, axis)));
}

function rectAxes(corners: Point2[]): Point2[] {
  return [edgeNormal(corners[0], corners[1]), edgeNormal(corners[1], corners[2])];
}

function edgeNormal(a: Point2, b: Point2): Point2 {
  const x = -(b[1] - a[1]);
  const z = b[0] - a[0];
  const length = Math.hypot(x, z) || 1;
  return [x / length, z / length];
}

function project(points: Point2[], axis: Point2): Point2 {
  const values = points.map(([x, z]) => x * axis[0] + z * axis[1]);
  return [Math.min(...values), Math.max(...values)];
}

function projectionsOverlap(a: Point2, b: Point2) {
  return a[1] > b[0] && b[1] > a[0];
}

function shrinkRect(rect: OrientedRect, inset: number): OrientedRect {
  return { ...rect, width: Math.max(0.02, rect.width - inset * 2), depth: Math.max(0.02, rect.depth - inset * 2) };
}

function growRect(rect: OrientedRect, amount: number): OrientedRect {
  return { ...rect, width: rect.width + amount * 2, depth: rect.depth + amount * 2 };
}

function pointInPolygon(x: number, z: number, polygon: readonly Point2[]) {
  if (polygon.some((point, index) => pointOnSegment(x, z, point, polygon[(index + 1) % polygon.length]))) return true;
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

function pointOnSegment(x: number, z: number, a: Point2, b: Point2) {
  const cross = (x - a[0]) * (b[1] - a[1]) - (z - a[1]) * (b[0] - a[0]);
  if (Math.abs(cross) > 1e-7) return false;
  const dot = (x - a[0]) * (b[0] - a[0]) + (z - a[1]) * (b[1] - a[1]);
  if (dot < -1e-7) return false;
  const lengthSquared = (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2;
  return dot <= lengthSquared + 1e-7;
}

function blocked(code: EditorEffect["code"], message: string): EditorEffect {
  return { kind: "blocked", code, message };
}

function cloneItems(value: SceneObjectV1[]) {
  return structuredClone(value);
}

function sameItems(a: SceneObjectV1[], b: SceneObjectV1[]) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function quaternionFromY(angle: number) {
  return { x: 0, y: Math.sin(angle / 2), z: 0, w: Math.cos(angle / 2) };
}

export function quaternionToY(q: SceneObjectV1["rotation"]) {
  return Math.atan2(2 * (q.w * q.y + q.x * q.z), 1 - 2 * (q.y * q.y + q.z * q.z));
}
