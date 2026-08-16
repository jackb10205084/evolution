/**
 * Deterministic hero-room GLB builder for v2-original-cozy.
 * P1 SKUs use catalog-true silhouettes (real product parts, 圓糯 edges only).
 * Remaining hero set-dressing keeps the previous chubby watercolor language.
 * Materials: matte pastel PBR (metallic 0, roughness 0.96) plus a paper-white
 * watercolor wash texture multiplied in the web MeshToonMaterial path.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";
import path from "node:path";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { fitToEnvelope, p1Assets } from "./p1-sku-builders.mjs";

const outputDir = path.resolve("public/assets/hero-room");
await mkdir(outputDir, { recursive: true });

const blob = (width, height, depth, segments = 28) => {
  const geometry = new THREE.SphereGeometry(0.5, segments, Math.max(16, Math.round(segments * 0.72)));
  geometry.scale(width, height, depth);
  return geometry;
};

const chubby = (width, height, depth, radiusRatio = 0.34, segments = 7) => {
  const radius = Math.min(width, height, depth) * radiusRatio * 0.5;
  const geometry = new RoundedBoxGeometry(
    width,
    height,
    depth,
    segments,
    Math.min(radius, width / 2 - 0.002, height / 2 - 0.002, depth / 2 - 0.002),
  );
  return plump(geometry, 0.18);
};

const peg = (top, bottom, height, segments = 16) => new THREE.CylinderGeometry(top, bottom, height, segments);

const lathe = (profile, segments = 32) =>
  new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), segments);

const pebbleTop = (radius, thickness, segments = 48) =>
  lathe([
    [0, 0],
    [radius * 0.9, 0],
    [radius, thickness * 0.28],
    [radius * 0.97, thickness * 0.78],
    [radius * 0.84, thickness],
    [0, thickness],
  ], segments);

const mushroomShade = (bottom, top, height, segments = 32) =>
  lathe([
    [top * 0.14, 0],
    [bottom, height * 0.1],
    [bottom * 0.94, height * 0.48],
    [top, height * 0.9],
    [top * 0.22, height],
    [0.012, height],
  ], segments);

const flowerPot = (top, bottom, height, segments = 28) =>
  lathe([
    [bottom * 0.62, 0],
    [bottom, height * 0.08],
    [top * 0.9, height * 0.78],
    [top, height * 0.86],
    [top * 0.78, height * 0.93],
    [top * 0.7, height],
    [0.01, height],
  ], segments);

const scallopedOval = (width, depth, height, lobes = 14, amp = 0.028) => {
  const shape = new THREE.Shape();
  const segments = 96;
  for (let index = 0; index <= segments; index += 1) {
    const theta = (index / segments) * Math.PI * 2;
    const radius = 1 + amp * Math.sin(theta * lobes);
    const x = Math.cos(theta) * width * 0.5 * radius;
    const y = Math.sin(theta) * depth * 0.5 * radius;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelThickness: height * 0.28,
    bevelSize: Math.min(0.018, width * 0.012),
    bevelSegments: 2,
    curveSegments: 6,
  });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
};

function plump(geometry, amount = 0.12) {
  const position = geometry.getAttribute("position");
  geometry.computeBoundingBox();
  const center = geometry.boundingBox.getCenter(new THREE.Vector3());
  const size = geometry.boundingBox.getSize(new THREE.Vector3());
  const vertex = new THREE.Vector3();
  const hx = Math.max(size.x * 0.5, 1e-6);
  const hy = Math.max(size.y * 0.5, 1e-6);
  const hz = Math.max(size.z * 0.5, 1e-6);
  const power = 2.3;
  for (let index = 0; index < position.count; index += 1) {
    vertex.fromBufferAttribute(position, index);
    const nx = (vertex.x - center.x) / hx;
    const ny = (vertex.y - center.y) / hy;
    const nz = (vertex.z - center.z) / hz;
    const superRadius = Math.pow(Math.abs(nx) ** power + Math.abs(ny) ** power + Math.abs(nz) ** power, 1 / power);
    if (superRadius < 1e-6) continue;
    const inflate = 1 + amount * (1 - superRadius) * 0.24;
    const corner = Math.abs(nx) * Math.abs(ny) + Math.abs(ny) * Math.abs(nz) + Math.abs(nz) * Math.abs(nx);
    const pull = 1 - amount * 0.14 * Math.min(1, corner);
    position.setXYZ(
      index,
      center.x + (vertex.x - center.x) * inflate * pull,
      center.y + (vertex.y - center.y) * inflate * pull,
      center.z + (vertex.z - center.z) * inflate * pull,
    );
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function crc32(buffer) {
  let crc = ~0;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

function pngChunk(type, data) {
  const chunk = Buffer.alloc(8 + data.length + 4);
  chunk.writeUInt32BE(data.length, 0);
  chunk.write(type, 4, 4, "ascii");
  data.copy(chunk, 8);
  const checksum = crc32(chunk.subarray(4, 8 + data.length));
  chunk.writeUInt32BE(checksum, 8 + data.length);
  return chunk;
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    rgba.copy(raw, row + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function watercolorWash(seed, size = 96) {
  const random = (() => {
    let state = seed >>> 0 || 1;
    return () => {
      state = Math.imul(state, 1664525) + 1013904223 >>> 0;
      return state / 4294967296;
    };
  })();
  const blobs = Array.from({ length: 8 }, () => ({
    x: random() * size,
    y: random() * size,
    radius: (0.18 + random() * 0.38) * size,
    luma: (random() - 0.5) * 0.11,
    warm: (random() - 0.5) * 0.045,
    cool: (random() - 0.5) * 0.03,
  }));
  const rgba = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let luma = 0.965;
      let warm = 0;
      let cool = 0;
      for (const blobSpec of blobs) {
        const dx = x - blobSpec.x;
        const dy = y - blobSpec.y;
        const falloff = Math.max(0, 1 - Math.hypot(dx, dy) / blobSpec.radius);
        const wash = falloff * falloff * (3 - 2 * falloff);
        luma += blobSpec.luma * wash;
        warm += blobSpec.warm * wash;
        cool += blobSpec.cool * wash;
        const ring = Math.abs(Math.hypot(dx, dy) / blobSpec.radius - 0.78);
        if (ring < 0.08) luma -= (1 - ring / 0.08) * 0.018;
      }
      const edge = Math.min(x, y, size - 1 - x, size - 1 - y) / (size * 0.12);
      if (edge < 1) luma -= (1 - edge) * (1 - edge) * 0.07;
      const grain = (random() - 0.5) * 0.025;
      luma = Math.min(1, Math.max(0.84, luma + grain));
      const index = (y * size + x) * 4;
      rgba[index] = Math.round(Math.min(255, (luma + warm) * 255));
      rgba[index + 1] = Math.round(Math.min(255, (luma + warm * 0.35 - cool * 0.15) * 250));
      rgba[index + 2] = Math.round(Math.min(255, (luma - warm * 0.2 + cool) * 242));
      rgba[index + 3] = 255;
    }
  }
  return encodePng(size, size, rgba);
}

const dressingAssets = [
  {
    file: "rug-meadow.glb",
    colors: { primary: "#e0bd7e", accent: "#f3dfb4" },
    build(add) {
      add(scallopedOval(2.48, 1.62, 0.018, 16, 0.03), "primary", [0, 0.0, 0]);
      add(scallopedOval(2.12, 1.34, 0.01, 16, 0.02), "accent", [0, 0.028, 0]);
    },
  },
  {
    file: "lamp-moon.glb",
    colors: { metal: "#668479", shade: "#f7d889", glow: "#fff2bd" },
    build(add) {
      add(blob(0.42, 0.12, 0.42, 22), "metal", [0, 0.06, 0]);
      add(peg(0.03, 0.038, 1.18, 16), "metal", [0, 0.68, 0]);
      add(mushroomShade(0.23, 0.13, 0.34, 32), "shade", [0, 1.22, 0]);
      add(blob(0.2, 0.2, 0.2, 20), "glow", [0, 1.3, 0]);
      add(blob(0.08, 0.08, 0.08, 14), "metal", [0, 1.52, 0]);
    },
  },
  {
    file: "plant-olive.glb",
    colors: { pot: "#cf8f69", trunk: "#8a654d", leaf: "#7f9f70", leafLight: "#a8bb83" },
    build(add) {
      add(flowerPot(0.24, 0.33, 0.4, 28), "pot", [0, 0, 0]);
      add(peg(0.042, 0.06, 0.82, 12), "trunk", [0, 0.8, 0]);
      add(peg(0.024, 0.034, 0.42, 10), "trunk", [-0.08, 1.1, 0], [0, 0, -0.48]);
      add(peg(0.024, 0.034, 0.4, 10), "trunk", [0.08, 1.16, -0.02], [0, 0, 0.5]);
      add(peg(0.02, 0.03, 0.36, 10), "trunk", [0, 1.22, 0.05], [0.42, 0, 0.08]);
      const leaves = [
        [-0.2, 1.02, 0.04, -0.7], [-0.12, 1.2, 0.1, -0.38], [-0.24, 1.3, -0.05, -0.86],
        [0.19, 1.08, 0.07, 0.72], [0.13, 1.28, -0.08, 0.44], [0.24, 1.36, 0.03, 0.9],
        [-0.1, 1.42, 0.08, -0.36], [0.09, 1.48, 0.04, 0.4], [0, 1.58, -0.02, 0.06],
        [-0.18, 1.52, -0.07, -0.66], [0.18, 1.55, 0.05, 0.66], [0.02, 1.34, 0.16, 0.12],
      ];
      leaves.forEach(([x, y, z, rz], index) => add(blob(0.28, 0.1, 0.2, 18), index % 3 === 1 ? "leafLight" : "leaf", [x, y, z], [0.2, 0.15, rz]));
    },
  },
  {
    file: "shelf-cabin.glb",
    colors: { wood: "#bd946c", cream: "#f3ddbd", coral: "#d99178", sage: "#8fac9b", yellow: "#e1bf6f" },
    build(add) {
      add(chubby(0.16, 1.38, 0.4, 0.36, 6), "wood", [-0.66, 0.72, 0]);
      add(chubby(0.16, 1.38, 0.4, 0.36, 6), "wood", [0.66, 0.72, 0]);
      add(chubby(1.48, 0.16, 0.4, 0.36, 6), "wood", [0, 0.08, 0]);
      add(chubby(1.26, 1.22, 0.08, 0.22, 5), "cream", [0, 0.74, 0.16]);
      for (const y of [0.44, 0.84, 1.24]) add(chubby(1.32, 0.11, 0.38, 0.42, 5), "wood", [0, y, 0]);
      add(chubby(0.86, 0.16, 0.44, 0.4, 5), "wood", [-0.34, 1.48, 0], [0, 0, 0.2]);
      add(chubby(0.86, 0.16, 0.44, 0.4, 5), "wood", [0.34, 1.48, 0], [0, 0, -0.2]);
      add(blob(0.2, 0.28, 0.1, 14), "coral", [-0.4, 0.6, -0.16]);
      add(blob(0.2, 0.34, 0.1, 14), "sage", [-0.12, 1.02, -0.16]);
      add(blob(0.22, 0.24, 0.1, 14), "yellow", [0.34, 1.34, -0.16]);
    },
  },
  {
    file: "bed-soft.glb",
    colors: { frame: "#a9b7ca", mattress: "#f5e9d6", pillow: "#fff7e9", blanket: "#dca38e" },
    build(add) {
      add(chubby(1.8, 0.36, 2.04, 0.3, 6), "frame", [0, 0.24, 0]);
      add(blob(1.68, 0.24, 1.88, 28), "mattress", [0, 0.52, -0.02]);
      add(blob(1.76, 0.72, 0.28, 24), "frame", [0, 0.52, 0.9]);
      add(blob(0.72, 0.2, 0.48, 20), "pillow", [-0.4, 0.7, 0.5], [0.12, 0, 0.08]);
      add(blob(0.72, 0.2, 0.48, 20), "pillow", [0.4, 0.7, 0.5], [0.12, 0, -0.08]);
      add(blob(1.58, 0.12, 0.86, 22), "blanket", [0, 0.66, -0.42], [0.04, 0.06, 0]);
    },
  },
  {
    file: "ikea-saltsjobaden.glb",
    colors: { primary: "#d9d0c4", cream: "#eee6db", wood: "#a47750", accent: "#c1a889" },
    build(add) {
      add(blob(1.54, 0.32, 0.76, 30), "primary", [0, 0.34, 0]);
      add(blob(1.46, 0.46, 0.24, 26), "primary", [0, 0.66, 0.28], [-0.16, 0, 0]);
      add(blob(0.22, 0.46, 0.76, 22), "primary", [-0.72, 0.46, 0]);
      add(blob(0.22, 0.46, 0.76, 22), "primary", [0.72, 0.46, 0]);
      add(blob(0.68, 0.14, 0.56, 20), "cream", [-0.34, 0.52, -0.06]);
      add(blob(0.68, 0.14, 0.56, 20), "cream", [0.34, 0.52, -0.06]);
      add(blob(0.62, 0.3, 0.16, 18), "cream", [-0.34, 0.7, 0.22], [-0.12, 0, 0.04]);
      add(blob(0.62, 0.3, 0.16, 18), "cream", [0.34, 0.7, 0.22], [-0.12, 0, -0.04]);
      for (const x of [-0.58, 0.58]) for (const z of [-0.26, 0.26]) add(peg(0.032, 0.042, 0.16, 12), "wood", [x, 0.08, z], [z * 0.14, 0, -x * 0.05]);
    },
  },
  {
    file: "ikea-borgeby.glb",
    colors: { wood: "#c69a6c", edge: "#e7cba4" },
    build(add) {
      add(pebbleTop(0.35, 0.09, 48), "wood", [0, 0.33, 0]);
      add(pebbleTop(0.32, 0.06, 40), "edge", [0, 0, 0]);
      for (const angle of [-0.85, 0.85, Math.PI]) {
        const x = Math.sin(angle) * 0.24;
        const z = Math.cos(angle) * 0.24;
        add(peg(0.028, 0.04, 0.32, 14), "wood", [x, 0.16, z], [Math.sin(angle) * 0.08, 0, Math.cos(angle) * 0.08]);
      }
    },
  },
  {
    file: "ikea-ekenaset.glb",
    colors: { primary: "#e7ddcc", cream: "#f4ecdf", wood: "#684735" },
    build(add) {
      add(blob(0.54, 0.14, 0.56, 22), "cream", [0, 0.44, -0.02]);
      add(blob(0.5, 0.34, 0.16, 22), "primary", [0, 0.64, 0.24], [-0.16, 0, 0]);
      for (const x of [-0.27, 0.27]) {
        add(peg(0.03, 0.038, 0.64, 12), "wood", [x, 0.34, 0.24], [-0.08, 0, -x * 0.08]);
        add(peg(0.03, 0.038, 0.42, 12), "wood", [x, 0.22, -0.24], [0.06, 0, -x * 0.08]);
        add(chubby(0.06, 0.06, 0.6, 0.48, 4), "wood", [x, 0.58, 0], [-0.04, 0, 0]);
      }
      add(chubby(0.56, 0.06, 0.06, 0.48, 4), "wood", [0, 0.76, 0.27]);
      add(chubby(0.56, 0.06, 0.06, 0.48, 4), "wood", [0, 0.36, 0.3]);
    },
  },
  {
    file: "ikea-stoense.glb",
    colors: { primary: "#d8c5aa", accent: "#eee0ca" },
    build(add) {
      add(chubby(1.33, 0.018, 1.95, 0.55, 8), "primary", [0, 0.009, 0]);
      add(chubby(1.25, 0.008, 1.87, 0.55, 8), "accent", [0, 0.021, 0]);
    },
  },
  {
    file: "ikea-lauters.glb",
    colors: { wood: "#b68a5e", cream: "#f2eadc", glow: "#fff1bc" },
    build(add) {
      for (const angle of [0, Math.PI * 2 / 3, Math.PI * 4 / 3]) {
        const x = Math.sin(angle) * 0.2;
        const z = Math.cos(angle) * 0.2;
        add(peg(0.028, 0.04, 0.9, 14), "wood", [x, 0.45, z], [Math.sin(angle) * 0.2, 0, -Math.cos(angle) * 0.2]);
      }
      add(peg(0.026, 0.032, 0.58, 12), "wood", [0, 0.92, 0]);
      add(mushroomShade(0.3, 0.2, 0.32, 36), "cream", [0, 1.2, 0]);
      add(blob(0.18, 0.18, 0.18, 18), "glow", [0, 1.28, 0]);
    },
  },
  {
    file: "ikea-fejka-fig.glb",
    colors: { pot: "#b97854", trunk: "#795b45", leaf: "#718c65", leafLight: "#98aa78" },
    build(add) {
      add(flowerPot(0.21, 0.28, 0.36, 26), "pot", [0, 0, 0]);
      add(peg(0.042, 0.065, 1.0, 12), "trunk", [0, 0.82, 0]);
      const branches = [[-0.14, 1.14, -0.52], [0.13, 1.22, 0.52], [-0.08, 1.36, -0.34], [0.09, 1.44, 0.3]];
      branches.forEach(([x, y, rz]) => add(peg(0.02, 0.032, 0.46, 10), "trunk", [x * 0.45, y, 0], [0, 0, rz]));
      const leaves = [
        [-0.28, 1.02, 0.04], [-0.18, 1.18, 0.12], [-0.32, 1.32, -0.04], [0.26, 1.08, 0.08],
        [0.2, 1.26, -0.12], [0.32, 1.38, 0.04], [-0.18, 1.44, 0.08], [0.16, 1.52, 0.04],
        [0, 1.64, -0.02], [-0.3, 1.56, -0.08], [0.3, 1.58, 0.08], [0.02, 1.34, 0.2],
      ];
      leaves.forEach(([x, y, z], index) => add(blob(0.3, 0.1, 0.22, 16), index % 3 === 1 ? "leafLight" : "leaf", [x, y, z], [0.18, 0.12, x * 1.5]));
    },
  },
  {
    file: "ikea-kallax.glb",
    colors: { primary: "#f0eee8", accent: "#c8a87a", cream: "#e6d8c3" },
    build(add) {
      add(chubby(0.09, 1.115, 0.39, 0.28, 6), "primary", [-0.338, 0.558, 0]);
      add(chubby(0.09, 1.115, 0.39, 0.28, 6), "primary", [0.338, 0.558, 0]);
      add(chubby(0.765, 0.09, 0.39, 0.28, 6), "primary", [0, 0.045, 0]);
      add(chubby(0.765, 0.09, 0.39, 0.28, 6), "primary", [0, 1.07, 0]);
      for (const y of [0.382, 0.732]) add(chubby(0.69, 0.075, 0.38, 0.32, 5), "primary", [0, y, 0]);
      add(chubby(0.075, 1.0, 0.38, 0.32, 5), "primary", [0, 0.555, 0]);
      add(chubby(0.3, 0.28, 0.33, 0.26, 5), "accent", [-0.172, 0.2, -0.012]);
      add(chubby(0.3, 0.28, 0.33, 0.26, 5), "cream", [0.172, 0.545, -0.012]);
    },
  },
  {
    file: "mascot-resident.glb",
    colors: { fur: "#fff8e9", ear: "#f1dfc8", arm: "#fff8e9", foot: "#efddc4", tail: "#f5e8d5", eye: "#4a4540", eyeHighlight: "#fffdf7", cheek: "#f3b8aa", mouth: "#76584c", pouch: "#e88971" },
    build(add) {
      add(blob(1.08, 1.04, 0.96, 36), "fur", [0, 0.62, 0.02]);
      add(blob(0.86, 0.66, 0.8, 28), "fur", [0, 0.4, 0.04]);
      add(blob(0.22, 0.2, 0.2, 18), "ear", [-0.34, 1.14, -0.02], [0, 0, 0.18]);
      add(blob(0.22, 0.2, 0.2, 18), "ear", [0.34, 1.14, -0.02], [0, 0, -0.18]);
      add(blob(0.18, 0.18, 0.16, 14), "ear", [-0.34, 1.14, 0.04]);
      add(blob(0.18, 0.18, 0.16, 14), "ear", [0.34, 1.14, 0.04]);
      add(blob(0.2, 0.3, 0.2, 18), "arm", [-0.48, 0.5, 0.08], [0, 0, -0.42]);
      add(blob(0.2, 0.3, 0.2, 18), "arm", [0.48, 0.5, 0.08], [0, 0, 0.42]);
      add(blob(0.09, 0.1, 0.06, 14), "eye", [-0.18, 0.8, 0.5]);
      add(blob(0.09, 0.1, 0.06, 14), "eye", [0.18, 0.8, 0.5]);
      add(blob(0.028, 0.03, 0.02, 10), "eyeHighlight", [-0.16, 0.84, 0.54]);
      add(blob(0.028, 0.03, 0.02, 10), "eyeHighlight", [0.2, 0.84, 0.54]);
      add(blob(0.24, 0.12, 0.08, 16), "cheek", [-0.32, 0.66, 0.46]);
      add(blob(0.24, 0.12, 0.08, 16), "cheek", [0.32, 0.66, 0.46]);
      add(blob(0.07, 0.05, 0.04, 12), "mouth", [-0.03, 0.68, 0.53], [0, 0, 0.45]);
      add(blob(0.07, 0.05, 0.04, 12), "mouth", [0.03, 0.68, 0.53], [0, 0, -0.45]);
      add(blob(0.36, 0.22, 0.42, 20), "foot", [-0.24, 0.12, 0.06]);
      add(blob(0.36, 0.22, 0.42, 20), "foot", [0.24, 0.12, 0.06]);
      add(blob(0.24, 0.22, 0.24, 16), "tail", [0.46, 0.4, -0.34]);
      add(blob(0.16, 0.16, 0.12, 14), "pouch", [0.2, 0.62, 0.48]);
      add(blob(0.42, 0.32, 0.18, 18), "pouch", [-0.08, 0.42, 0.56]);
    },
  },
];

const p1Files = new Set(p1Assets.map((asset) => asset.file));
const assets = [
  ...p1Assets,
  ...dressingAssets.filter((asset) => !p1Files.has(asset.file)),
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
    generatedBy: "HomePlay P1 SKU watercolor GLB builder",
    pipeline: {
      optimizer: "@gltf-transform/cli",
      compression: "meshopt",
      validator: "Khronos glTF Validator",
      preservesNamedMaterials: true,
      simplifiesGeometry: false,
    },
    lookdev: {
      shapeLanguage: "sku-silhouette-round-nuo",
      albedo: "watercolor-wash",
      shading: "web-toon-unlit",
    },
    p1Skus: p1Assets.map(({ file, catalogId, envelope }) => ({ file, catalogId, envelope })),
    assets: assets.map(({ file }) => file),
  }, null, 2),
);

function ensureUv(geometry) {
  if (geometry.getAttribute("uv")) return;
  geometry.computeBoundingBox();
  const min = geometry.boundingBox.min;
  const size = geometry.boundingBox.getSize(new THREE.Vector3());
  const position = geometry.getAttribute("position");
  const uv = new Float32Array(position.count * 2);
  for (let index = 0; index < position.count; index += 1) {
    uv[index * 2] = size.x > 1e-6 ? (position.getX(index) - min.x) / size.x : 0;
    uv[index * 2 + 1] = size.y > 1e-6 ? (position.getY(index) - min.y) / size.y : 0;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

async function createGlb({ file, colors, build, envelope, doubleSided = false }) {
  const nodes = [];
  const meshes = [];
  const images = [];
  const textures = [];
  const samplers = [{ magFilter: 9729, minFilter: 9729, wrapS: 10497, wrapT: 10497 }];
  const materials = [];
  const materialIndexes = new Map();
  const bufferViews = [];
  const accessors = [];
  const chunks = [];
  let byteOffset = 0;

  const append = (buffer, target) => {
    const padding = (4 - (buffer.length % 4)) % 4;
    const view = bufferViews.length;
    const viewDef = { buffer: 0, byteOffset, byteLength: buffer.length };
    if (target) viewDef.target = target;
    bufferViews.push(viewDef);
    chunks.push(buffer, Buffer.alloc(padding));
    byteOffset += buffer.length + padding;
    return view;
  };

  Object.entries(colors).forEach(([name, color]) => {
    const png = watercolorWash(hashString(`${file}:${name}`));
    const imageIndex = images.length;
    images.push({ mimeType: "image/png", bufferView: append(png) });
    textures.push({ sampler: 0, source: imageIndex, name: `${name}Wash` });
    materialIndexes.set(name, materials.length);
    materials.push({
      name,
      doubleSided: Boolean(envelope) || doubleSided,
      pbrMetallicRoughness: {
        baseColorFactor: [...new THREE.Color(color).toArray(), 1],
        baseColorTexture: { index: imageIndex },
        metallicFactor: 0,
        roughnessFactor: 0.96,
      },
    });
  });

  const add = (geometry, materialName, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) => {
    if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
    ensureUv(geometry);
    geometry.computeBoundingBox();
    const positions = Float32Array.from(geometry.getAttribute("position").array);
    const normals = Float32Array.from(geometry.getAttribute("normal").array);
    const uvs = Float32Array.from(geometry.getAttribute("uv").array);
    const sourceIndex = geometry.index?.array ?? Uint32Array.from({ length: geometry.getAttribute("position").count }, (_, index) => index);
    const IndexArray = geometry.getAttribute("position").count < 65535 ? Uint16Array : Uint32Array;
    const indices = IndexArray.from(sourceIndex);
    const positionView = append(Buffer.from(positions.buffer), 34962);
    const normalView = append(Buffer.from(normals.buffer), 34962);
    const uvView = append(Buffer.from(uvs.buffer), 34962);
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
    const uvAccessor = accessors.length;
    accessors.push({ bufferView: uvView, componentType: 5126, count: uvs.length / 2, type: "VEC2" });
    const indexAccessor = accessors.length;
    accessors.push({ bufferView: indexView, componentType: indices.BYTES_PER_ELEMENT === 2 ? 5123 : 5125, count: indices.length, type: "SCALAR" });
    const meshIndex = meshes.length;
    meshes.push({
      name: materialName,
      primitives: [{
        attributes: { POSITION: positionAccessor, NORMAL: normalAccessor, TEXCOORD_0: uvAccessor },
        indices: indexAccessor,
        material: materialIndexes.get(materialName),
      }],
    });
    const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation));
    nodes.push({ mesh: meshIndex, name: materialName, translation: position, rotation: quaternion.toArray(), scale });
  };

  if (envelope) {
    const parts = [];
    build((geometry, materialName, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) => {
      parts.push({ geometry, materialName, position, rotation, scale });
    });
    for (const part of fitToEnvelope(parts, envelope)) {
      add(part.geometry, part.materialName, part.position, part.rotation, part.scale);
    }
  } else {
    build(add);
  }
  const binary = Buffer.concat(chunks);
  const gltf = {
    asset: { version: "2.0", generator: "HomePlay v2-original-cozy P1 SKU builder" },
    scene: 0,
    scenes: [{ nodes: nodes.map((_, index) => index) }],
    nodes,
    meshes,
    materials,
    textures,
    images,
    samplers,
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
