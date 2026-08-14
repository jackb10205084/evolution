import assert from "node:assert/strict";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import validator from "gltf-validator";

const root = path.resolve(import.meta.dirname, "../..");
const outputDirectory = path.join(root, "outputs/blender/watercolor-pipeline-v2");
const buildReport = JSON.parse(
  await readFile(path.join(outputDirectory, "build-report.json"), "utf8"),
);
const passReport = JSON.parse(
  await readFile(path.join(outputDirectory, "pass-report.json"), "utf8"),
);

assert.equal(buildReport.candidateVersion, "watercolor-pipeline-v2");
assert.equal(buildReport.residentVisible, false);
assert.ok(
  buildReport.removedGlobalGrainNodes.some((name) => name.includes("HP_PaperTooth")),
  "V2 must remove the global paper-tooth shader nodes",
);
assert.ok(
  buildReport.removedGlobalGrainNodes.some((name) => name.includes("HP_PencilGrain")),
  "V2 must remove the global pencil-grain shader nodes",
);

const requiredPngs = [
  "beauty-neutral.png",
  "audit-whole-floorplan.png",
  "mask-architecture.png",
  "mask-products.png",
  "mask-lifestyle.png",
  "mask-protected.png",
  "mask-styleable.png",
  "line-architecture.png",
  "line-products.png",
  "line-lifestyle.png",
  "pass-contact-sheet.png",
];

for (const filename of requiredPngs) {
  const buffer = await readFile(path.join(outputDirectory, filename));
  assert.equal(buffer.toString("ascii", 1, 4), "PNG", `${filename} is not a PNG`);
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const expected = filename === "pass-contact-sheet.png" ? [1440, 1350] : [1440, 900];
  assert.deepEqual([width, height], expected, `${filename} has the wrong dimensions`);
}

assert.ok(passReport.coverage.architecture > 0.03 && passReport.coverage.architecture < 0.98);
assert.ok(passReport.coverage.products > 0.003 && passReport.coverage.products < 0.6);
assert.ok(passReport.coverage.protected > passReport.coverage.products);
assert.ok(passReport.coverage.protected < 0.7);
assert.ok(passReport.coverage.styleable > 0.3);

const exrPath = path.join(root, buildReport.multilayerExr);
const exr = await readFile(exrPath);
assert.deepEqual([...exr.subarray(0, 4)], [0x76, 0x2f, 0x31, 0x01], "Invalid OpenEXR header");
assert.ok(exr.length > 50_000, "Multilayer EXR is unexpectedly small");

const blendStat = await stat(path.join(root, buildReport.blendFile));
assert.ok(blendStat.size > 250_000, "V2 blend file is unexpectedly small");

const glbPath = path.join(root, buildReport.glb);
const glb = await readFile(glbPath);
const glbValidation = await validator.validateBytes(toUint8Array(glb), {
  uri: path.basename(glbPath),
  writeTimestamp: false,
  maxIssues: 0,
});
assert.equal(glbValidation.issues.numErrors, 0, "V2 GLB has validation errors");
const glbJson = parseGlbJson(glb);
for (const material of glbJson.materials ?? []) {
  const pbr = material.pbrMetallicRoughness ?? {};
  assert.equal(pbr.metallicFactor ?? 1, 0, `${material.name} must remain non-metallic`);
  assert.ok((pbr.roughnessFactor ?? 1) >= 0.85, `${material.name} is too glossy`);
}

const validationReport = {
  schemaVersion: "2.0",
  candidateVersion: "watercolor-pipeline-v2",
  pngs: requiredPngs,
  coverage: passReport.coverage,
  exrBytes: exr.length,
  blendBytes: blendStat.size,
  glbBytes: glb.length,
  glbErrors: glbValidation.issues.numErrors,
  glbWarnings: glbValidation.issues.numWarnings,
  machineGate: "pass",
  humanVisualGate: "pending",
};
await writeFile(
  path.join(outputDirectory, "validation-report.json"),
  `${JSON.stringify(validationReport, null, 2)}\n`,
);
console.log(
  `Validated Watercolor Pipeline V2: ${requiredPngs.length} PNGs, ${glb.length} byte GLB, machine gate pass.`,
);

function parseGlbJson(buffer) {
  assert.equal(buffer.toString("ascii", 0, 4), "glTF");
  const jsonLength = buffer.readUInt32LE(12);
  const jsonType = buffer.readUInt32LE(16);
  assert.equal(jsonType, 0x4e4f534a);
  return JSON.parse(buffer.toString("utf8", 20, 20 + jsonLength).trim());
}

function toUint8Array(buffer) {
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}
