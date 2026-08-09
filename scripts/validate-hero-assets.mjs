import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import * as THREE from "three";

const assetDirectory = path.resolve("public/assets/hero-room");
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
requiredAssets.forEach((file) => assert.ok(manifest.assets.includes(file), `${file} missing from manifest`));

const reports = [];
for (const file of manifest.assets) {
  const buffer = await readFile(path.join(assetDirectory, file));
  const gltf = parseGlb(buffer, file);
  assert.match(gltf.asset.generator, /HomePlay v2-original-cozy/);
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
  reports.push({ file, triangles: Math.round(triangles), size: size.toArray().map((value) => Number(value.toFixed(3))) });
}

console.log(`Validated ${reports.length} V2 hero-room GLB assets.`);
for (const report of reports) console.log(`${report.file}: ${report.triangles} tris · ${report.size.join(" × ")} m`);

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
      const min = accessor.min;
      const max = accessor.max;
      for (const x of [min[0], max[0]]) for (const y of [min[1], max[1]]) for (const z of [min[2], max[2]]) {
        result.expandByPoint(new THREE.Vector3(x, y, z).applyMatrix4(matrix));
      }
    }
  }
  return result;
}
