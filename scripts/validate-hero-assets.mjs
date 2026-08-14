import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import validator from "gltf-validator";
import * as THREE from "three";

const assetDirectory = path.resolve("public/assets/hero-room");
const reportDirectory = path.resolve("outputs/gltf-validation");
const manifest = JSON.parse(await readFile(path.join(assetDirectory, "manifest.json"), "utf8"));
const requiredAssets = [
  "sofa-soft.glb",
  "table-pebble.glb",
  "ikea-saltsjobaden.glb",
  "ikea-borgeby.glb",
  "mascot-resident.glb",
];

assert.equal(manifest.version, 2);
assert.equal(manifest.visualContractVersion, "v2-original-cozy");
assert.equal(manifest.units, "meter");
assert.equal(manifest.upAxis, "Y");
assert.equal(manifest.pipeline.optimizer, "@gltf-transform/cli");
assert.equal(manifest.pipeline.compression, "meshopt");
assert.equal(manifest.pipeline.validator, "Khronos glTF Validator");
requiredAssets.forEach((file) => assert.ok(manifest.assets.includes(file), `${file} missing from manifest`));

await mkdir(reportDirectory, { recursive: true });
const reports = [];
for (const file of manifest.assets) {
  const buffer = await readFile(path.join(assetDirectory, file));
  const specReport = await validator.validateBytes(toUint8Array(buffer), {
    uri: file,
    writeTimestamp: false,
    maxIssues: 0,
  });
  await writeFile(
    path.join(reportDirectory, `${file}.json`),
    `${JSON.stringify(specReport, null, 2)}\n`,
  );
  assert.equal(specReport.issues.numErrors, 0, `${file} failed Khronos glTF validation`);
  assert.equal(specReport.issues.numWarnings, 0, `${file} has Khronos glTF warnings`);

  const gltf = parseGlb(buffer, file);
  assert.match(gltf.asset.generator, /glTF-Transform v4\./);
  assert.ok(gltf.extensionsUsed?.includes("EXT_meshopt_compression"), `${file} is not Meshopt-compressed`);
  assert.ok(gltf.nodes.length > 0, `${file} has no nodes`);
  assert.ok(gltf.materials.length > 0, `${file} has no materials`);
  gltf.materials.forEach((material) => {
    assert.equal(material.pbrMetallicRoughness.metallicFactor, 0, `${file}/${material.name} must be non-metallic`);
    assert.ok(material.pbrMetallicRoughness.roughnessFactor >= 0.85, `${file}/${material.name} is too glossy`);
  });

  const bounds = calculateBounds(gltf);
  const size = bounds.getSize(new THREE.Vector3());
  assert.ok(bounds.min.y >= -0.03, `${file} falls below floor origin (${bounds.min.y})`);
  assert.ok(bounds.min.y <= 0.08, `${file} does not sit on the floor (${bounds.min.y})`);
  assert.ok(Math.max(size.x, size.y, size.z) <= 3.5, `${file} is outside the meter-scale asset envelope`);
  assert.ok(Math.min(size.x, size.y, size.z) > 0.005, `${file} has a collapsed dimension`);

  const triangles = gltf.meshes.reduce((total, mesh) => total + mesh.primitives.reduce((meshTotal, primitive) => {
    const indexAccessor = gltf.accessors[primitive.indices];
    return meshTotal + indexAccessor.count / 3;
  }, 0), 0);
  assert.ok(triangles <= 100_000, `${file} exceeds the 100k triangle budget`);
  reports.push({
    file,
    triangles: Math.round(triangles),
    size: size.toArray().map((value) => Number(value.toFixed(3))),
    specInfos: specReport.issues.numInfos,
  });
}

console.log(`Validated ${reports.length} V2 hero-room GLB assets with Khronos glTF Validator.`);
for (const report of reports) console.log(`${report.file}: ${report.triangles} tris · ${report.size.join(" × ")} m · ${report.specInfos} spec infos`);

function parseGlb(buffer, file) {
  assert.equal(buffer.readUInt32LE(0), 0x46546c67, `${file} has invalid GLB magic`);
  assert.equal(buffer.readUInt32LE(4), 2, `${file} is not GLB v2`);
  assert.equal(buffer.readUInt32LE(8), buffer.length, `${file} has invalid byte length`);
  const jsonLength = buffer.readUInt32LE(12);
  assert.equal(buffer.readUInt32LE(16), 0x4e4f534a, `${file} has no JSON chunk`);
  return JSON.parse(buffer.subarray(20, 20 + jsonLength).toString("utf8").trim());
}

function calculateBounds(gltf) {
  const result = new THREE.Box3();
  for (const node of gltf.nodes) {
    if (node.mesh === undefined) continue;
    const position = new THREE.Vector3(...(node.translation ?? [0, 0, 0]));
    const rotation = new THREE.Quaternion(...(node.rotation ?? [0, 0, 0, 1]));
    const scale = new THREE.Vector3(...(node.scale ?? [1, 1, 1]));
    const matrix = new THREE.Matrix4().compose(position, rotation, scale);
    for (const primitive of gltf.meshes[node.mesh].primitives) {
      const accessor = gltf.accessors[primitive.attributes.POSITION];
      const min = accessor.min.map((value) => decodeAccessorComponent(value, accessor));
      const max = accessor.max.map((value) => decodeAccessorComponent(value, accessor));
      for (const x of [min[0], max[0]]) for (const y of [min[1], max[1]]) for (const z of [min[2], max[2]]) {
        result.expandByPoint(new THREE.Vector3(x, y, z).applyMatrix4(matrix));
      }
    }
  }
  return result;
}

function toUint8Array(buffer) {
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

function decodeAccessorComponent(value, accessor) {
  if (!accessor.normalized) return value;
  switch (accessor.componentType) {
    case 5120: return Math.max(value / 127, -1); // BYTE
    case 5121: return value / 255; // UNSIGNED_BYTE
    case 5122: return Math.max(value / 32767, -1); // SHORT
    case 5123: return value / 65535; // UNSIGNED_SHORT
    default: throw new Error(`Unsupported normalized accessor component type: ${accessor.componentType}`);
  }
}
