import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "public/assets/commercial-pilot/manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const releaseMode = process.argv.includes("--release");

assert.equal(manifest.schemaVersion, "1.0");
assert.equal(manifest.pilotId, "bh7-a6-commercial-vertical-slice");
assert.equal(manifest.floorplan.id, "bh7-a6");
assert.equal(manifest.artDirection.version, "v2-original-cozy");
assert.ok(Array.isArray(manifest.releaseGates) && manifest.releaseGates.length >= 6);
assert.ok(Array.isArray(manifest.candidateOwnedSkus));
assert.equal(new Set(manifest.candidateOwnedSkus.map((entry) => entry.sku)).size, manifest.candidateOwnedSkus.length);

await Promise.all([
  access(path.join(root, `public${manifest.artDirection.master}`)),
  access(path.join(root, "docs/assets/bh7-floorplan-source-audit.md")),
  access(path.join(root, "app/lib/editor-engine.ts")),
]);

const ready = manifest.releaseGates.filter((gate) => gate.status === "ready");
const blocked = manifest.releaseGates.filter((gate) => gate.status !== "ready");
console.log(`A6 Commercial Pilot: ${ready.length}/${manifest.releaseGates.length} release gates ready.`);
blocked.forEach((gate) => console.log(`BLOCKED ${gate.label}: ${gate.note}`));

if (releaseMode) {
  assert.equal(manifest.releaseStatus, "ready", "Commercial pilot is explicitly blocked from release");
  assert.equal(blocked.length, 0, "All commercial release gates must be ready");
  assert.ok(manifest.candidateOwnedSkus.length >= manifest.requiredOwnedSkuCount, "Not enough verified owned SKUs");
  assert.equal(manifest.floorplan.currentStatus, manifest.floorplan.requiredStatus, "Floorplan is not CAD verified");
  assert.ok(manifest.floorplan.webAsset && manifest.floorplan.renderAsset, "Commercial floorplan assets are missing");
}
