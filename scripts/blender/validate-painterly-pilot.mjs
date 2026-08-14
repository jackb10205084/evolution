import assert from "node:assert/strict";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import validator from "gltf-validator";

const root = path.resolve(import.meta.dirname, "../..");
const reportPath = path.join(root, "outputs/blender/painterly-v1/build-report.json");
const validationPath = path.join(root, "outputs/blender/painterly-v1/validation-report.json");
const report = JSON.parse(await readFile(reportPath, "utf8"));

assert.equal(report.candidateVersion, "painterly-lookdev-v1");
assert.equal(report.status, "lookdev-candidate-not-for-commerce");
assert.ok(report.collections.includes("Architecture_A6_Drawing_Audit"));
assert.ok(report.collections.includes("Furniture_SKU_Painterly"));
assert.ok(report.collections.includes("Lifestyle_Dressing"));
assert.ok(report.collections.includes("Original_Resident"));
assert.ok(report.humanApprovalRequired);

const blendPath = path.join(root, report.blendFile);
const renderPath = path.join(root, report.render);
const blendStat = await stat(blendPath);
assert.ok(blendStat.size > 250_000, "Generated .blend is unexpectedly small");

const png = await readFile(renderPath);
assert.equal(png.toString("ascii", 1, 4), "PNG", "Render output is not a PNG");
const renderDimensions = {
  width: png.readUInt32BE(16),
  height: png.readUInt32BE(20),
};
assert.deepEqual(renderDimensions, { width: 1440, height: 900 });

const glbReports = [];
for (const entry of report.exports) {
  const assetPath = path.join(root, entry.path);
  const buffer = await readFile(assetPath);
  const validation = await validator.validateBytes(toUint8Array(buffer), {
    uri: path.basename(assetPath),
    writeTimestamp: false,
    maxIssues: 0,
  });
  assert.equal(validation.issues.numErrors, 0, `${entry.path} has glTF errors`);

  const json = parseGlbJson(buffer);
  assert.equal(json.asset.version, "2.0");
  assert.ok(json.extensionsUsed?.includes("EXT_meshopt_compression"), `${entry.path} is missing Meshopt`);
  assert.ok(json.nodes?.length > 0, `${entry.path} has no nodes`);
  assert.ok(json.meshes?.length > 0, `${entry.path} has no meshes`);
  assert.ok(json.materials?.length > 0, `${entry.path} has no materials`);
  for (const material of json.materials) {
    const pbr = material.pbrMetallicRoughness ?? {};
    assert.equal(pbr.metallicFactor ?? 1, 0, `${entry.path}/${material.name} must be non-metallic`);
    assert.ok((pbr.roughnessFactor ?? 0) >= 0.85, `${entry.path}/${material.name} is too glossy`);
  }
  glbReports.push({
    ...entry,
    bytes: buffer.length,
    nodes: json.nodes.length,
    meshes: json.meshes.length,
    materials: json.materials.length,
    errors: validation.issues.numErrors,
    warnings: validation.issues.numWarnings,
    messages: validation.issues.messages,
  });
}

const validationReport = {
  schemaVersion: "1.0",
  candidateVersion: report.candidateVersion,
  renderDimensions,
  blendBytes: blendStat.size,
  glbReports,
  machineGate: "pass",
  humanVisualGate: "pending",
};

await mkdir(path.dirname(validationPath), { recursive: true });
await writeFile(validationPath, `${JSON.stringify(validationReport, null, 2)}\n`);
console.log(`Validated painterly pilot: ${glbReports.length} GLB files, ${renderDimensions.width}x${renderDimensions.height} render.`);

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
