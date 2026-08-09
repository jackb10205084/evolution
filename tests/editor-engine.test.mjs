import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../app/lib/editor-engine.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
}).outputText;
const engineModule = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const { createEditorEngine, quaternionFromY } = engineModule;

const products = [
  product("sofa", "SOFA", "sofa", 1, 0.8),
  product("bench", "BENCH", "chair", 1.8, 0.6),
  product("rug", "RUG", "rug", 2, 1.4),
];

const floorplan = {
  id: "test-room",
  footprint: [[-2, -2], [2, -2], [2, 2], [-2, 2]],
  editableBounds: { minX: -2, maxX: 2, minZ: -2, maxZ: 2 },
  walls: [
    { id: "partition", center: [0, 1.3], size: [2.4, 0.12], kind: "partition" },
  ],
  openings: [
    { id: "door", type: "door", center: [0, -1.9], width: 0.9, rotationY: 0, wallThickness: 0.12 },
  ],
  candidateSpots: [[-1, 0], [1, 0], [0, 0]],
};

test("moves through one command interface and coalesces drag history", () => {
  const engine = makeEngine([object("sofa-1", "SOFA", -1, 0)]);
  assert.equal(engine.dispatch({ type: "move.update", id: "sofa-1", x: -0.5, z: 0 }).effect, undefined);
  assert.equal(engine.dispatch({ type: "move.update", id: "sofa-1", x: 0, z: 0 }).effect, undefined);
  const committed = engine.dispatch({ type: "move.end", id: "sofa-1" });
  assert.equal(committed.view.canUndo, true);
  assert.equal(committed.view.items[0].position.x, 0);

  assert.equal(engine.dispatch({ type: "undo" }).view.items[0].position.x, -1);
  assert.equal(engine.dispatch({ type: "redo" }).view.items[0].position.x, 0);
});

test("blocks walls, door clearance and rotated footprints", () => {
  const wallEngine = makeEngine([object("sofa-1", "SOFA", -1, 0)]);
  assert.equal(wallEngine.dispatch({ type: "move.update", id: "sofa-1", x: 0, z: 1.3 }).effect.code, "wall-collision");

  const doorEngine = makeEngine([object("sofa-1", "SOFA", -1, 0)]);
  assert.equal(doorEngine.dispatch({ type: "move.update", id: "sofa-1", x: 0, z: -1.55 }).effect.code, "door-clearance");

  const rotateEngine = makeEngine([object("bench-1", "BENCH", 1.45, 0)]);
  assert.equal(rotateEngine.dispatch({ type: "rotate", id: "bench-1", radians: Math.PI / 4 }).effect.code, "outside-floorplan");
});

test("allows rugs beneath furniture while blocking solid furniture overlap", () => {
  const engine = makeEngine([
    object("sofa-1", "SOFA", -1, 0),
    object("rug-1", "RUG", -1, 0),
    object("bench-1", "BENCH", 1, 0),
  ]);
  assert.equal(engine.dispatch({ type: "move.update", id: "rug-1", x: 1, z: 0 }).effect, undefined);
  engine.dispatch({ type: "move.end", id: "rug-1" });
  assert.equal(engine.dispatch({ type: "move.update", id: "bench-1", x: -1, z: 0 }).effect.code, "furniture-overlap");
});

test("adds stock through candidate spots and keeps snapshots isolated", () => {
  let sequence = 0;
  const engine = createEditorEngine({ products, floorplans: [floorplan], idFactory: () => `id-${++sequence}` });
  engine.load({ floorplanId: floorplan.id, items: [], selectedId: null });
  const added = engine.dispatch({ type: "add", productId: "sofa" });
  assert.equal(added.view.items[0].id, "scene-sofa-id-1");
  const snapshot = engine.snapshot();
  snapshot[0].position.x = 999;
  assert.notEqual(engine.snapshot()[0].position.x, 999);
});

function makeEngine(items) {
  const engine = createEditorEngine({ products, floorplans: [floorplan], idFactory: () => "fixed" });
  engine.load({ floorplanId: floorplan.id, items, selectedId: items[0]?.id ?? null });
  return engine;
}

function product(id, sku, shape, width, depth) {
  return {
    id, sku, shape, assetVersion: "1", name: id, category: shape === "rug" ? "decor" : "living",
    brand: "HomePlay", brandKind: "owned", price: 100, color: "#fff", accent: "#eee",
    size: { width, depth, height: 0.8 }, stock: "in_stock",
  };
}

function object(id, sku, x, z) {
  return { id, sku, assetVersion: "1", position: { x, y: 0, z }, rotation: quaternionFromY(0), materialVariant: 0 };
}
