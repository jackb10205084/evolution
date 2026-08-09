import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createServer } from "vite";

const server = await createServer({
  configFile: false,
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "silent",
});

try {
  const runtimeModule = await server.ssrLoadModule("/app/lib/floorplan-runtime.ts");
  const catalogModule = await server.ssrLoadModule("/app/lib/catalog.ts");
  const expectations = {
    "bh7-a6": { width: 6.825, depth: 9.114759036144576, pages: [2, 3, 7], confirmedWidth: 6.825 },
    "bh7-a11": { width: 8.954764719791916, depth: 9.54793095294396, pages: [13, 14, 18], confirmedWidth: 8.65 },
  };

  for (const [floorplanId, expected] of Object.entries(expectations)) {
    const runtime = runtimeModule.getFloorplanRuntime(floorplanId);
    assert.ok(runtime, `${floorplanId} runtime is missing`);
    assert.equal(runtime.shell.dimensions.width, expected.width);
    assert.equal(runtime.shell.dimensions.depth, expected.depth);
    assert.deepEqual(Object.values(runtime.shell.source.pages), expected.pages);
    assert.ok(runtime.shell.walls.every((wall) => expected.pages.includes(wall.sourcePage)), `${floorplanId} contains an untraceable wall`);
    assert.equal(runtime.audit.overlayDimensions[0], expected.width, `${floorplanId} audit width must use the confirmed PDF dimension`);
    assert.equal(runtime.audit.overlayDimensions[1], expected.depth, `${floorplanId} audit overlay aspect changed unexpectedly`);
    assert.equal(runtime.audit.confirmedWidth, expected.confirmedWidth, `${floorplanId} confirmed width changed unexpectedly`);
    assert.equal(runtime.audit.sourcePage, expected.pages[0]);
    assert.equal(runtime.audit.furnishedPage, expected.pages[1]);
    assert.equal(runtime.audit.calibration, "confirmed-width-proportional-depth");
    assert.ok(runtime.shell.footprint.length >= 6, `${floorplanId} must publish its stepped PDF footprint`);
    assert.ok(runtime.shell.walls.every((wall) => wall.sourceRect?.length === 4), `${floorplanId} has a wall without an AutoCAD source rect`);
    assert.ok(runtime.shell.openings.some((opening) => opening.type === "door"), `${floorplanId} must publish PDF-traced doors`);
    assert.ok(runtime.shell.openings.some((opening) => opening.type !== "door"), `${floorplanId} must publish PDF-traced windows`);
    assert.ok(runtime.shell.openings.every((opening) => opening.sourceSpan?.length === 4), `${floorplanId} has an opening without a PDF source span`);
    assert.ok(
      existsSync(new URL(`../public${runtime.audit.overlayPath}`, import.meta.url)),
      `${floorplanId} PDF audit overlay is missing`,
    );

    for (const productId of catalogModule.initialFurnitureIds) {
      const product = catalogModule.catalog.find((item) => item.id === productId);
      assert.ok(product, `${productId} is missing from the catalog`);
      const position = runtime.initialPositions[productId];
      assert.ok(position, `${floorplanId}/${productId} has no curated initial position`);
      const placement = runtimeModule.resolveFloorplanPlacement(
        floorplanId,
        { x: position[0], z: position[1] },
        product.size,
      );
      assert.equal(placement.blocked, false, `${floorplanId}/${productId} intersects a wall`);
      assert.equal(placement.x, position[0], `${floorplanId}/${productId} starts outside X bounds`);
      assert.equal(placement.z, position[1], `${floorplanId}/${productId} starts outside Z bounds`);
    }

    const clearCandidateCount = runtime.candidateSpots.filter(([x, z]) => !runtimeModule.resolveFloorplanPlacement(
      floorplanId,
      { x, z },
      { width: 0.6, depth: 0.6 },
    ).blocked).length;
    assert.ok(clearCandidateCount >= 4, `${floorplanId} has too few safe add-furniture spots`);
  }

  assert.equal(runtimeModule.getFloorplanRuntime("proposal-27"), null, "unverified floorplan must not resolve to a playable shell");
  console.log("Validated A6 and A11 through the floorplan-runtime interface.");
} finally {
  await server.close();
}
