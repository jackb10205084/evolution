import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { deflateSync } from "node:zlib";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
import * as THREE from "three";

const assetDirectory = path.resolve("public/assets/hero-room");
const outputPath = path.resolve("docs/design-system/lookdev-cute-3d-contact.png");
const files = [
  "sofa-soft.glb",
  "chair-breeze.glb",
  "table-pebble.glb",
  "hp-a475-ar-pla-tb-02.glb",
  "hp-a213-dme52-b00ddf.glb",
  "hp-a213-dme52-0d4db8.glb",
];

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder });
const tile = 420;
const cols = 3;
const rows = 2;
const pad = 18;
const sheetWidth = cols * tile + pad * 2;
const sheetHeight = rows * tile + pad * 2 + 36;
const background = [247, 243, 238];
const pixels = Buffer.alloc(sheetWidth * sheetHeight * 4, 255);
fillRect(pixels, sheetWidth, sheetHeight, 0, 0, sheetWidth, sheetHeight, background);

const camera = new THREE.Object3D();
camera.position.set(7.4, 9.8, 9.4);
camera.up.set(0, 1, 0);
camera.lookAt(0, 0.46, 0);
camera.updateMatrixWorld();
const view = camera.matrixWorld.clone().invert();
const light = new THREE.Vector3(0.48, 0.86, 0.38).normalize();
const ramp = [
  [176 / 255, 168 / 255, 180 / 255],
  [214 / 255, 198 / 255, 188 / 255],
  [242 / 255, 228 / 255, 212 / 255],
  [255 / 255, 250 / 255, 244 / 255],
];

for (const [index, file] of files.entries()) {
  const document = await io.read(path.join(assetDirectory, file));
  const triangles = collectTriangles(document);
  const col = index % cols;
  const row = Math.floor(index / cols);
  const ox = pad + col * tile;
  const oy = pad + 28 + row * tile;
  renderTile(pixels, sheetWidth, sheetHeight, ox, oy, tile, triangles);
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, encodePng(sheetWidth, sheetHeight, pixels));
console.log(`Wrote ${outputPath}`);

function collectTriangles(document) {
  const triangles = [];
  const walk = (node, parent) => {
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(...(node.getTranslation() ?? [0, 0, 0])),
      new THREE.Quaternion(...(node.getRotation() ?? [0, 0, 0, 1])),
      new THREE.Vector3(...(node.getScale() ?? [1, 1, 1])),
    );
    matrix.premultiply(parent);
    const mesh = node.getMesh();
    if (mesh) {
      const normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix);
      for (const primitive of mesh.listPrimitives()) {
        const position = primitive.getAttribute("POSITION");
        const normal = primitive.getAttribute("NORMAL");
        const indices = primitive.getIndices();
        const material = primitive.getMaterial();
        const factor = material?.getBaseColorFactor() ?? [1, 1, 1, 1];
        const count = indices ? indices.getCount() : position.getCount();
        const readIndex = (value) => (indices ? indices.getScalar(value) : value);
        for (let i = 0; i < count; i += 3) {
          const a = readIndex(i);
          const b = readIndex(i + 1);
          const c = readIndex(i + 2);
          triangles.push({
            a: new THREE.Vector3().fromArray(position.getElement(a, [])).applyMatrix4(matrix),
            b: new THREE.Vector3().fromArray(position.getElement(b, [])).applyMatrix4(matrix),
            c: new THREE.Vector3().fromArray(position.getElement(c, [])).applyMatrix4(matrix),
            n: new THREE.Vector3().fromArray((normal ?? position).getElement(a, [])).applyMatrix3(normalMatrix).normalize(),
            color: factor,
          });
        }
      }
    }
    for (const child of node.listChildren()) walk(child, matrix);
  };
  for (const scene of document.getRoot().listScenes()) {
    for (const node of scene.listChildren()) walk(node, new THREE.Matrix4());
  }
  return triangles;
}

function renderTile(rgba, width, height, ox, oy, size, triangles) {
  fillRect(rgba, width, height, ox, oy, size, size, [252, 248, 242]);
  const projected = triangles.map((triangle) => ({
    ...triangle,
    pa: project(triangle.a),
    pb: project(triangle.b),
    pc: project(triangle.c),
  }));
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const triangle of projected) {
    for (const point of [triangle.pa, triangle.pb, triangle.pc]) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
  }
  const span = Math.max(maxX - minX, maxY - minY, 0.001);
  const scale = (size * 0.78) / span;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const depth = new Float32Array(size * size).fill(-Infinity);
  for (const triangle of projected) {
    const a = toPixel(triangle.pa, cx, cy, scale, size);
    const b = toPixel(triangle.pb, cx, cy, scale, size);
    const c = toPixel(triangle.pc, cx, cy, scale, size);
    const z = (triangle.pa.z + triangle.pb.z + triangle.pc.z) / 3;
    const shade = shadeColor(triangle.color, triangle.n);
    raster(rgba, depth, width, height, ox, oy, size, a, b, c, z, shade);
  }
}

function project(point) {
  const viewPoint = point.clone().applyMatrix4(view);
  return viewPoint;
}

function toPixel(point, cx, cy, scale, size) {
  return {
    x: (point.x - cx) * scale + size / 2,
    y: -(point.y - cy) * scale + size / 2,
  };
}

function shadeColor(factor, normal) {
  const ndotl = Math.max(0, normal.dot(light));
  const band = ramp[Math.min(3, Math.floor(ndotl * 4))];
  const mix = 0.32;
  return [
    Math.round((factor[0] * (1 - mix) + factor[0] * band[0] * mix) * 255),
    Math.round((factor[1] * (1 - mix) + factor[1] * band[1] * mix) * 255),
    Math.round((factor[2] * (1 - mix) + factor[2] * band[2] * mix) * 255),
  ];
}

function raster(rgba, depth, width, height, ox, oy, size, a, b, c, z, color) {
  const minX = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x)));
  const maxX = Math.min(size - 1, Math.ceil(Math.max(a.x, b.x, c.x)));
  const minY = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y)));
  const maxY = Math.min(size - 1, Math.ceil(Math.max(a.y, b.y, c.y)));
  const area = edge(a, b, c);
  if (Math.abs(area) < 1e-6) return;
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const p = { x: x + 0.5, y: y + 0.5 };
      const w0 = edge(b, c, p) / area;
      const w1 = edge(c, a, p) / area;
      const w2 = edge(a, b, p) / area;
      const inside = (w0 >= 0 && w1 >= 0 && w2 >= 0) || (w0 <= 0 && w1 <= 0 && w2 <= 0);
      if (!inside) continue;
      const index = y * size + x;
      if (z < depth[index]) continue;
      depth[index] = z;
      const px = ((oy + y) * width + (ox + x)) * 4;
      rgba[px] = color[0];
      rgba[px + 1] = color[1];
      rgba[px + 2] = color[2];
      rgba[px + 3] = 255;
    }
  }
}

function edge(a, b, c) {
  return (c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x);
}

function fillRect(rgba, width, height, x, y, w, h, color) {
  for (let py = y; py < y + h; py += 1) {
    for (let px = x; px < x + w; px += 1) {
      if (px < 0 || py < 0 || px >= width || py >= height) continue;
      const index = (py * width + px) * 4;
      rgba[index] = color[0];
      rgba[index + 1] = color[1];
      rgba[index + 2] = color[2];
      rgba[index + 3] = 255;
    }
  }
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
  chunk.writeUInt32BE(crc32(chunk.subarray(4, 8 + data.length)), 8 + data.length);
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
