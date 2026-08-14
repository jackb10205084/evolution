import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { A6_SHELL_V1 } from "../../app/lib/a6-shell";
import { catalog } from "../../app/lib/catalog";
import { getFloorplanRuntime } from "../../app/lib/floorplan-runtime";
import { getScenePresentation } from "../../app/lib/scene-presentation";
import { HOMEPLAY_VISUAL_VERSION, homePlayVisual } from "../../app/lib/visual-contract";

const outputDirectory = path.resolve("tmp/blender/a6-painterly-v1");
const outputPath = path.join(outputDirectory, "scene-spec.json");
const runtime = getFloorplanRuntime("bh7-a6");

if (!runtime) throw new Error("BH7 A6 runtime is unavailable");

const requiredFurnitureIds = [
  "sofa-cloud",
  "table-pebble",
  "chair-breeze",
  "rug-meadow",
  "lamp-moon",
  "plant-olive",
  "shelf-cabin",
] as const;

const furniture = requiredFurnitureIds.map((id) => {
  const product = catalog.find((candidate) => candidate.id === id);
  if (!product) throw new Error(`Missing required product ${id}`);
  const placement = runtime.initialPositions[id];
  if (!placement) throw new Error(`Missing A6 placement for ${id}`);
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    size: product.size,
    placement: { x: placement[0], z: placement[1], rotationY: 0 },
  };
});

const presentation = getScenePresentation("bh7-a6", "hero", false);

const spec = {
  schemaVersion: "1.0",
  candidateVersion: "painterly-lookdev-v1",
  visualContractVersion: HOMEPLAY_VISUAL_VERSION,
  status: "lookdev-candidate-not-for-commerce",
  generatedAt: new Date().toISOString(),
  sourceTrace: {
    floorplanSource: "docs/assets/source/遠雄BH7樣品屋大樣圖_0718.pdf",
    dimensionsPage: A6_SHELL_V1.source.pages.dimensions,
    furnishedPlanPage: A6_SHELL_V1.source.pages.furnishedPlan,
    ceilingPage: A6_SHELL_V1.source.pages.ceilingAndHeights,
    runtimeSource: "app/lib/a6-shell.ts",
    visualContract: "docs/design-system/v2-visual-contract.md",
    painterlyAddendum: "docs/design-system/blender-painterly-lookdev-v1.md",
    caveat: A6_SHELL_V1.source.caveat,
  },
  coordinateSystem: { units: "meter", upAxis: "Y", forwardAxis: "-Z", handedness: "right" },
  shell: A6_SHELL_V1,
  furniture,
  resident: {
    id: "homeplay-pebble-resident-v1",
    placement: {
      x: presentation.residentAnchor?.[0] ?? -0.48,
      z: presentation.residentAnchor?.[1] ?? -0.24,
      rotationY: 0,
    },
  },
  diningComposition: {
    table: { x: -1.62, z: 1.42, width: 1.5, depth: 0.8, height: 0.75 },
    chairOffsets: [
      [-0.94, 0],
      [0.94, 0],
      [-0.44, -0.66],
      [0.44, -0.66],
    ],
  },
  fixedKitchen: {
    sourcePage: A6_SHELL_V1.source.pages.furnishedPlan,
    status: "furnished-plan-visual-proxy",
    run: { x: -3.02, z: 1.35, width: 0.54, depth: 2.72, counterHeight: 0.88 },
  },
  camera: {
    type: "orthographic",
    position: presentation.camera.position,
    target: presentation.camera.target,
    // The editor canvas occupies roughly 600 CSS px inside the 900 px review
    // frame. Keep the Blender camera equivalent to the live Hero Room, not the
    // entire browser viewport height.
    orthographicScale: 6.4,
    viewport: [1440, 900],
  },
  palette: {
    milk: homePlayVisual.color.milk,
    vanilla: homePlayVisual.color.vanilla,
    cream: homePlayVisual.color.cream,
    peach: homePlayVisual.color.peach,
    coral: homePlayVisual.color.coral,
    mint: homePlayVisual.color.mint,
    blue: homePlayVisual.color.blue,
    lineBlue: homePlayVisual.color.blueLine,
    cocoa: homePlayVisual.color.cocoa,
    quietInk: homePlayVisual.color.quietInk,
    oatmeal: "#d7c2a3",
    sage: "#a9b79e",
    blush: "#d9a995",
    neutralShadow: "#c9c7c3",
  },
  webGate: {
    exactProductDimensions: true,
    floorPivot: true,
    maxMaterialCountPerProduct: 6,
    targetRoughness: 0.92,
    allowGeneratedConstructionDimensions: false,
  },
};

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(spec, null, 2)}\n`);
console.log(`Wrote ${path.relative(process.cwd(), outputPath)}`);
