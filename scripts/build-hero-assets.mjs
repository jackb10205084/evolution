import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const outputDir = path.resolve("public/assets/hero-room");
await mkdir(outputDir, { recursive: true });

const rounded = (width, height, depth, radius = 0.08, segments = 5) =>
  new RoundedBoxGeometry(width, height, depth, segments, Math.min(radius, width / 2, height / 2, depth / 2));
const sphere = (segments = 28) => new THREE.SphereGeometry(0.5, segments, Math.max(16, Math.round(segments * 0.72)));
const cylinder = (top, bottom, height, segments = 24) => new THREE.CylinderGeometry(top, bottom, height, segments);

const assets = [
  {
    file: "sofa-soft.glb",
    colors: { primary: "#f4eadb", cream: "#fffaf1", accent: "#a9c7b3", wood: "#ae8464" },
    build(add) {
      add(rounded(2.08, 0.34, 0.88, 0.16), "primary", [0, 0.31, 0]);
      add(sphere(30), "primary", [-0.62, 0.69, 0.29], [-0.08, 0, 0], [0.76, 0.52, 0.24]);
      add(sphere(30), "primary", [0, 0.75, 0.31], [-0.08, 0, 0], [0.8, 0.57, 0.25]);
      add(sphere(30), "primary", [0.62, 0.69, 0.29], [-0.08, 0, 0], [0.76, 0.52, 0.24]);
      add(sphere(28), "primary", [-0.96, 0.46, 0], [0, 0, 0], [0.25, 0.48, 0.5]);
      add(sphere(28), "primary", [0.96, 0.46, 0], [0, 0, 0], [0.25, 0.48, 0.5]);
      add(rounded(0.89, 0.18, 0.62, 0.085), "cream", [-0.46, 0.58, -0.1], [0.015, 0, 0.015]);
      add(rounded(0.89, 0.18, 0.62, 0.085), "cream", [0.46, 0.58, -0.1], [0.015, 0, -0.015]);
      add(rounded(0.43, 0.31, 0.14, 0.065), "accent", [0.47, 0.75, 0.16], [0.04, 0, -0.09]);
      for (const x of [-0.78, 0.78]) for (const z of [-0.28, 0.28]) add(cylinder(0.035, 0.045, 0.16, 12), "wood", [x, 0.08, z]);
    },
  },
  {
    file: "chair-breeze.glb",
    colors: { primary: "#8fb4a8", cream: "#f6e6c9", wood: "#9c7657" },
    build(add) {
      add(rounded(0.74, 0.22, 0.72, 0.11), "cream", [0, 0.43, 0]);
      add(sphere(28), "primary", [0, 0.66, 0.27], [-0.09, 0, 0], [0.72, 0.52, 0.2]);
      add(sphere(24), "primary", [-0.35, 0.56, 0], [0, 0, 0], [0.13, 0.22, 0.5]);
      add(sphere(24), "primary", [0.35, 0.56, 0], [0, 0, 0], [0.13, 0.22, 0.5]);
      for (const x of [-0.28, 0.28]) for (const z of [-0.25, 0.25]) add(cylinder(0.032, 0.045, 0.42, 12), "wood", [x, 0.21, z], [z * 0.12, 0, -x * 0.12]);
    },
  },
  {
    file: "table-pebble.glb",
    colors: { wood: "#b98c64", edge: "#d9b58c" },
    build(add) {
      add(cylinder(0.5, 0.52, 0.13, 56), "wood", [0, 0.36, 0], [0, 0, 0], [1.08, 1, 0.7]);
      add(cylinder(0.14, 0.18, 0.28, 24), "edge", [0, 0.17, 0]);
      add(cylinder(0.31, 0.36, 0.07, 32), "wood", [0, 0.035, 0], [0, 0, 0], [1, 1, 0.78]);
    },
  },
  {
    file: "rug-meadow.glb",
    colors: { primary: "#e0bd7e", accent: "#f3dfb4" },
    build(add) {
      add(cylinder(0.5, 0.5, 0.04, 64), "primary", [0, 0.02, 0], [0, 0, 0], [2.5, 1, 1.65]);
      add(cylinder(0.5, 0.5, 0.008, 64), "accent", [0, 0.044, 0], [0, 0, 0], [2.18, 1, 1.38]);
    },
  },
  {
    file: "lamp-moon.glb",
    colors: { metal: "#668479", shade: "#f7d889", glow: "#fff2bd" },
    build(add) {
      add(cylinder(0.18, 0.22, 0.1, 28), "metal", [0, 0.05, 0]);
      add(cylinder(0.028, 0.035, 1.24, 16), "metal", [0, 0.69, 0]);
      add(cylinder(0.12, 0.22, 0.34, 32), "shade", [0, 1.36, 0]);
      add(sphere(22), "glow", [0, 1.31, 0], [0, 0, 0], [0.18, 0.18, 0.18]);
      add(cylinder(0.04, 0.04, 0.12, 16), "metal", [0, 1.51, 0]);
    },
  },
  {
    file: "plant-olive.glb",
    colors: { pot: "#cf8f69", trunk: "#8a654d", leaf: "#7f9f70", leafLight: "#a8bb83" },
    build(add) {
      add(cylinder(0.23, 0.34, 0.42, 24), "pot", [0, 0.21, 0]);
      add(cylinder(0.045, 0.065, 0.88, 12), "trunk", [0, 0.82, 0]);
      add(cylinder(0.025, 0.036, 0.46, 10), "trunk", [-0.075, 1.12, 0], [0, 0, -0.52]);
      add(cylinder(0.025, 0.036, 0.43, 10), "trunk", [0.08, 1.18, -0.015], [0, 0, 0.54]);
      add(cylinder(0.022, 0.032, 0.38, 10), "trunk", [0, 1.25, 0.05], [0.46, 0, 0.08]);
      const leaves = [
        [-0.19, 1.02, 0.03, -0.72], [-0.11, 1.18, 0.09, -0.42], [-0.23, 1.27, -0.05, -0.88],
        [0.18, 1.08, 0.06, 0.74], [0.12, 1.26, -0.08, 0.45], [0.235, 1.34, 0.02, 0.92],
        [-0.09, 1.4, 0.08, -0.4], [0.08, 1.46, 0.03, 0.42], [0, 1.56, -0.03, 0.05],
        [-0.17, 1.5, -0.07, -0.68], [0.17, 1.53, 0.05, 0.68],
      ];
      leaves.forEach(([x, y, z, rz], index) => add(sphere(20), index % 3 === 1 ? "leafLight" : "leaf", [x, y, z], [0, 0, rz], [0.24, 0.18, 0.16]));
    },
  },
  {
    file: "shelf-cabin.glb",
    colors: { wood: "#bd946c", cream: "#f3ddbd", coral: "#d99178", sage: "#8fac9b", yellow: "#e1bf6f" },
    build(add) {
      add(rounded(0.13, 1.38, 0.4, 0.045), "wood", [-0.675, 0.72, 0]);
      add(rounded(0.13, 1.38, 0.4, 0.045), "wood", [0.675, 0.72, 0]);
      add(rounded(1.48, 0.13, 0.4, 0.045), "wood", [0, 0.075, 0]);
      add(rounded(1.28, 1.24, 0.055, 0.02), "cream", [0, 0.73, 0.17]);
      for (const y of [0.43, 0.83, 1.23]) add(rounded(1.32, 0.07, 0.38, 0.022), "wood", [0, y, 0]);
      add(rounded(0.82, 0.13, 0.44, 0.045), "wood", [-0.37, 1.49, 0], [0, 0, 0.18]);
      add(rounded(0.82, 0.13, 0.44, 0.045), "wood", [0.37, 1.49, 0], [0, 0, -0.18]);
      add(rounded(0.2, 0.3, 0.09, 0.025), "coral", [-0.42, 0.61, -0.2], [0, 0, -0.05]);
      add(rounded(0.21, 0.38, 0.09, 0.025), "sage", [-0.14, 1.03, -0.2], [0, 0, 0.06]);
      add(rounded(0.22, 0.27, 0.09, 0.025), "yellow", [0.35, 1.37, -0.2], [0, 0, -0.04]);
    },
  },
  {
    file: "bed-soft.glb",
    colors: { frame: "#a9b7ca", mattress: "#f5e9d6", pillow: "#fff7e9", blanket: "#dca38e" },
    build(add) {
      add(rounded(1.82, 0.38, 2.06, 0.09), "frame", [0, 0.25, 0]);
      add(rounded(1.7, 0.22, 1.92, 0.1), "mattress", [0, 0.54, -0.02]);
      add(rounded(1.82, 0.78, 0.18, 0.08), "frame", [0, 0.49, 0.94]);
      add(rounded(0.7, 0.16, 0.46, 0.08), "pillow", [-0.4, 0.72, 0.52], [0.02, 0, 0.04]);
      add(rounded(0.7, 0.16, 0.46, 0.08), "pillow", [0.4, 0.72, 0.52], [0.02, 0, -0.04]);
      add(rounded(1.62, 0.08, 0.8, 0.035), "blanket", [0, 0.69, -0.47]);
    },
  },
  {
    file: "ikea-saltsjobaden.glb",
    colors: { primary: "#d9d0c4", cream: "#eee6db", wood: "#a47750", accent: "#c1a889" },
    build(add) {
      add(rounded(1.58, 0.28, 0.78, 0.09), "primary", [0, 0.34, 0]);
      add(rounded(1.5, 0.42, 0.17, 0.075), "primary", [0, 0.66, 0.31], [-0.07, 0, 0]);
      add(rounded(0.13, 0.46, 0.8, 0.06), "primary", [-0.755, 0.47, 0]);
      add(rounded(0.13, 0.46, 0.8, 0.06), "primary", [0.755, 0.47, 0]);
      add(rounded(0.69, 0.13, 0.58, 0.055), "cream", [-0.36, 0.53, -0.07]);
      add(rounded(0.69, 0.13, 0.58, 0.055), "cream", [0.36, 0.53, -0.07]);
      add(rounded(0.66, 0.34, 0.14, 0.055), "cream", [-0.36, 0.72, 0.24], [-0.08, 0, 0.015]);
      add(rounded(0.66, 0.34, 0.14, 0.055), "cream", [0.36, 0.72, 0.24], [-0.08, 0, -0.015]);
      for (const x of [-0.62, 0.62]) for (const z of [-0.28, 0.28]) add(cylinder(0.027, 0.035, 0.16, 12), "wood", [x, 0.08, z], [z * 0.16, 0, -x * 0.06]);
    },
  },
  {
    file: "ikea-borgeby.glb",
    colors: { wood: "#c69a6c", edge: "#e7cba4" },
    build(add) {
      add(cylinder(0.35, 0.35, 0.075, 48), "wood", [0, 0.382, 0]);
      add(cylinder(0.31, 0.31, 0.05, 48), "edge", [0, 0.105, 0]);
      for (const angle of [-0.85, 0.85, Math.PI]) {
        const x = Math.sin(angle) * 0.25;
        const z = Math.cos(angle) * 0.25;
        add(rounded(0.08, 0.29, 0.13, 0.035), "wood", [x, 0.245, z], [0, angle, Math.sin(angle) * 0.08]);
      }
    },
  },
  {
    file: "ikea-ekenaset.glb",
    colors: { primary: "#e7ddcc", cream: "#f4ecdf", wood: "#684735" },
    build(add) {
      add(rounded(0.53, 0.13, 0.57, 0.05), "cream", [0, 0.43, -0.02]);
      add(rounded(0.5, 0.35, 0.12, 0.05), "primary", [0, 0.62, 0.25], [-0.1, 0, 0]);
      for (const x of [-0.285, 0.285]) {
        add(cylinder(0.027, 0.034, 0.67, 12), "wood", [x, 0.34, 0.24], [-0.08, 0, -x * 0.09]);
        add(cylinder(0.027, 0.034, 0.45, 12), "wood", [x, 0.225, -0.25], [0.06, 0, -x * 0.1]);
        add(rounded(0.055, 0.055, 0.62, 0.022), "wood", [x, 0.58, -0.01], [-0.04, 0, 0]);
      }
      add(rounded(0.58, 0.06, 0.06, 0.024), "wood", [0, 0.76, 0.28]);
      add(rounded(0.58, 0.06, 0.06, 0.024), "wood", [0, 0.36, 0.31]);
    },
  },
  {
    file: "ikea-stoense.glb",
    colors: { primary: "#d8c5aa", accent: "#eee0ca" },
    build(add) {
      add(rounded(1.33, 0.018, 1.95, 0.09, 7), "primary", [0, 0.009, 0]);
      add(rounded(1.25, 0.006, 1.87, 0.08, 7), "accent", [0, 0.021, 0]);
    },
  },
  {
    file: "ikea-lauters.glb",
    colors: { wood: "#b68a5e", cream: "#f2eadc", glow: "#fff1bc" },
    build(add) {
      for (const angle of [0, Math.PI * 2 / 3, Math.PI * 4 / 3]) {
        const x = Math.sin(angle) * 0.2;
        const z = Math.cos(angle) * 0.2;
        add(cylinder(0.025, 0.035, 0.92, 12), "wood", [x, 0.46, z], [Math.sin(angle) * 0.23, 0, -Math.cos(angle) * 0.23]);
      }
      add(cylinder(0.024, 0.03, 0.62, 12), "wood", [0, 0.93, 0]);
      add(cylinder(0.22, 0.36, 0.34, 36), "cream", [0, 1.33, 0]);
      add(sphere(20), "glow", [0, 1.28, 0], [0, 0, 0], [0.16, 0.16, 0.16]);
    },
  },
  {
    file: "ikea-fejka-fig.glb",
    colors: { pot: "#b97854", trunk: "#795b45", leaf: "#718c65", leafLight: "#98aa78" },
    build(add) {
      add(cylinder(0.2, 0.29, 0.38, 24), "pot", [0, 0.19, 0]);
      add(cylinder(0.045, 0.07, 1.04, 12), "trunk", [0, 0.83, 0]);
      const branches = [[-0.14, 1.15, -0.58], [0.13, 1.24, 0.55], [-0.08, 1.37, -0.38], [0.09, 1.46, 0.32]];
      branches.forEach(([x, y, rz]) => add(cylinder(0.022, 0.035, 0.48, 10), "trunk", [x * 0.45, y, 0], [0, 0, rz]));
      const leaves = [
        [-0.28, 1.02, 0.04], [-0.17, 1.17, 0.13], [-0.33, 1.3, -0.04], [0.25, 1.08, 0.09],
        [0.19, 1.24, -0.12], [0.32, 1.37, 0.03], [-0.18, 1.43, 0.09], [0.16, 1.5, 0.04],
        [0, 1.62, -0.02], [-0.3, 1.55, -0.08], [0.3, 1.57, 0.08], [0.02, 1.34, 0.2],
      ];
      leaves.forEach(([x, y, z], index) => add(sphere(18), index % 3 === 1 ? "leafLight" : "leaf", [x, y, z], [0, 0, x * 1.7], [0.27, 0.19, 0.17]));
    },
  },
  {
    file: "ikea-kallax.glb",
    colors: { primary: "#f0eee8", accent: "#c8a87a", cream: "#e6d8c3" },
    build(add) {
      add(rounded(0.075, 1.115, 0.39, 0.018), "primary", [-0.345, 0.558, 0]);
      add(rounded(0.075, 1.115, 0.39, 0.018), "primary", [0.345, 0.558, 0]);
      add(rounded(0.765, 0.075, 0.39, 0.018), "primary", [0, 0.038, 0]);
      add(rounded(0.765, 0.075, 0.39, 0.018), "primary", [0, 1.077, 0]);
      for (const y of [0.382, 0.732]) add(rounded(0.69, 0.055, 0.38, 0.014), "primary", [0, y, 0]);
      add(rounded(0.055, 1.0, 0.38, 0.014), "primary", [0, 0.555, 0]);
      add(rounded(0.285, 0.27, 0.33, 0.03), "accent", [-0.172, 0.2, -0.015]);
      add(rounded(0.285, 0.27, 0.33, 0.03), "cream", [0.172, 0.545, -0.015]);
    },
  },
  {
    file: "mascot-resident.glb",
    colors: { fur: "#fff8e9", ear: "#f1dfc8", arm: "#fff8e9", foot: "#efddc4", tail: "#f5e8d5", eye: "#4a4540", eyeHighlight: "#fffdf7", cheek: "#f3b8aa", mouth: "#76584c", pouch: "#e88971" },
    build(add) {
      add(sphere(36), "fur", [0, 0.7, 0], [0, 0, 0], [1.04, 1.12, 0.84]);
      add(sphere(24), "fur", [-0.24, 1.19, 0.01], [0, 0, 0], [0.34, 0.29, 0.3]);
      add(sphere(24), "fur", [0, 1.26, 0.01], [0, 0, 0], [0.38, 0.3, 0.31]);
      add(sphere(24), "fur", [0.24, 1.19, 0.01], [0, 0, 0], [0.34, 0.29, 0.3]);
      add(sphere(22), "ear", [-0.37, 1.2, -0.02], [0, 0, 0], [0.2, 0.19, 0.2]);
      add(sphere(22), "ear", [0.37, 1.2, -0.02], [0, 0, 0], [0.2, 0.19, 0.2]);
      add(sphere(18), "arm", [-0.47, 0.57, 0.05], [0, 0, -0.35], [0.2, 0.34, 0.2]);
      add(sphere(18), "arm", [0.47, 0.57, 0.05], [0, 0, 0.35], [0.2, 0.34, 0.2]);
      add(sphere(16), "eye", [-0.2, 0.87, 0.56], [0, 0, 0], [0.095, 0.11, 0.065]);
      add(sphere(16), "eye", [0.2, 0.87, 0.56], [0, 0, 0], [0.095, 0.11, 0.065]);
      add(sphere(12), "eyeHighlight", [-0.176, 0.91, 0.618], [0, 0, 0], [0.026, 0.03, 0.018]);
      add(sphere(12), "eyeHighlight", [0.224, 0.91, 0.618], [0, 0, 0], [0.026, 0.03, 0.018]);
      add(sphere(18), "cheek", [-0.34, 0.7, 0.52], [0, 0, 0], [0.26, 0.12, 0.08]);
      add(sphere(18), "cheek", [0.34, 0.7, 0.52], [0, 0, 0], [0.26, 0.12, 0.08]);
      add(sphere(16), "mouth", [0, 0.74, 0.585], [0, 0, 0], [0.085, 0.07, 0.05]);
      add(rounded(0.045, 0.085, 0.022, 0.011), "mouth", [0, 0.67, 0.588]);
      add(sphere(20), "foot", [-0.25, 0.12, 0.03], [0, 0, 0], [0.34, 0.22, 0.42]);
      add(sphere(20), "foot", [0.25, 0.12, 0.03], [0, 0, 0], [0.34, 0.22, 0.42]);
      add(sphere(18), "tail", [0.49, 0.48, -0.33], [0, 0, 0], [0.22, 0.22, 0.22]);
      add(rounded(0.13, 0.9, 0.06, 0.025), "pouch", [0.18, 0.55, 0.56], [0, 0, -0.28]);
      add(rounded(0.44, 0.35, 0.16, 0.06), "pouch", [-0.12, 0.43, 0.64]);
    },
  },
];

for (const asset of assets) {
  await createGlb(asset);
}

await writeFile(
  path.join(outputDir, "manifest.json"),
  JSON.stringify({
    version: 2,
    visualContractVersion: "v2-original-cozy",
    style: "high-key-pastel-dollhouse",
    units: "meter",
    upAxis: "Y",
    generatedBy: "HomePlay deterministic GLB builder",
    assets: assets.map(({ file }) => file),
  }, null, 2),
);

async function createGlb({ file, colors, build }) {
  const nodes = [];
  const meshes = [];
  const materials = Object.entries(colors).map(([name, color]) => ({
    name,
    doubleSided: false,
    pbrMetallicRoughness: {
      baseColorFactor: [...new THREE.Color(color).toArray(), 1],
      metallicFactor: 0,
      roughnessFactor: 0.96,
    },
  }));
  const materialIndexes = new Map(Object.keys(colors).map((name, index) => [name, index]));
  const bufferViews = [];
  const accessors = [];
  const chunks = [];
  let byteOffset = 0;

  const append = (buffer, target) => {
    const padding = (4 - (buffer.length % 4)) % 4;
    const view = bufferViews.length;
    bufferViews.push({ buffer: 0, byteOffset, byteLength: buffer.length, target });
    chunks.push(buffer, Buffer.alloc(padding));
    byteOffset += buffer.length + padding;
    return view;
  };

  const add = (geometry, materialName, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) => {
    if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    const positions = Float32Array.from(geometry.getAttribute("position").array);
    const normals = Float32Array.from(geometry.getAttribute("normal").array);
    const sourceIndex = geometry.index?.array ?? Uint32Array.from({ length: geometry.getAttribute("position").count }, (_, index) => index);
    const IndexArray = geometry.getAttribute("position").count < 65535 ? Uint16Array : Uint32Array;
    const indices = IndexArray.from(sourceIndex);
    const positionView = append(Buffer.from(positions.buffer), 34962);
    const normalView = append(Buffer.from(normals.buffer), 34962);
    const indexView = append(Buffer.from(indices.buffer), 34963);
    const positionAccessor = accessors.length;
    accessors.push({
      bufferView: positionView,
      componentType: 5126,
      count: positions.length / 3,
      type: "VEC3",
      min: geometry.boundingBox.min.toArray(),
      max: geometry.boundingBox.max.toArray(),
    });
    const normalAccessor = accessors.length;
    accessors.push({ bufferView: normalView, componentType: 5126, count: normals.length / 3, type: "VEC3" });
    const indexAccessor = accessors.length;
    accessors.push({ bufferView: indexView, componentType: indices.BYTES_PER_ELEMENT === 2 ? 5123 : 5125, count: indices.length, type: "SCALAR" });
    const meshIndex = meshes.length;
    meshes.push({ name: materialName, primitives: [{ attributes: { POSITION: positionAccessor, NORMAL: normalAccessor }, indices: indexAccessor, material: materialIndexes.get(materialName) }] });
    const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation));
    nodes.push({ mesh: meshIndex, name: materialName, translation: position, rotation: quaternion.toArray(), scale });
  };

  build(add);
  const binary = Buffer.concat(chunks);
  const gltf = {
    asset: { version: "2.0", generator: "HomePlay v2-original-cozy asset builder" },
    scene: 0,
    scenes: [{ nodes: nodes.map((_, index) => index) }],
    nodes,
    meshes,
    materials,
    accessors,
    bufferViews,
    buffers: [{ byteLength: binary.length }],
  };
  const json = Buffer.from(JSON.stringify(gltf));
  const jsonPadding = (4 - (json.length % 4)) % 4;
  const paddedJson = Buffer.concat([json, Buffer.alloc(jsonPadding, 0x20)]);
  const binPadding = (4 - (binary.length % 4)) % 4;
  const paddedBin = Buffer.concat([binary, Buffer.alloc(binPadding)]);
  const totalLength = 12 + 8 + paddedJson.length + 8 + paddedBin.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(paddedJson.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(paddedBin.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  await writeFile(path.join(outputDir, file), Buffer.concat([header, jsonHeader, paddedJson, binHeader, paddedBin]));
}
