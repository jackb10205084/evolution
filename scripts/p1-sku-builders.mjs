/**
 * P1 SKU builders: catalog-true silhouettes with watercolor materials.
 * Round (圓糯) edges only — envelope W/D/H stays at catalog millimeters.
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { readFileSync } from "node:fs";

const envelopes = JSON.parse(readFileSync(new URL("./p1-sku-envelopes.json", import.meta.url), "utf8"));

const mm = (value) => value / 1000;

export const P1_SKUS = envelopes.skus;

function softBox(width, height, depth, radius = 0.012, segments = 5) {
  const r = Math.min(radius, width / 2 - 0.001, height / 2 - 0.001, depth / 2 - 0.001);
  return new RoundedBoxGeometry(width, height, depth, segments, Math.max(0.001, r));
}

function lathe(profile, segments = 48) {
  return new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), segments);
}

function roundDisk(radius, thickness, segments = 64) {
  const lip = Math.min(0.01, thickness * 0.32, radius * 0.04);
  return lathe([
    [0, 0],
    [radius - lip, 0],
    [radius, lip],
    [radius, thickness - lip],
    [radius - lip, thickness],
    [0, thickness],
  ], segments);
}

function roundedPolygon(points, radii) {
  const shape = new THREE.Shape();
  const count = points.length;
  const corners = [];
  for (let index = 0; index < count; index += 1) {
    const prev = points[(index + count - 1) % count];
    const curr = points[index];
    const next = points[(index + 1) % count];
    const incoming = new THREE.Vector2(curr[0] - prev[0], curr[1] - prev[1]);
    const outgoing = new THREE.Vector2(next[0] - curr[0], next[1] - curr[1]);
    const maxRadius = Math.min(incoming.length(), outgoing.length()) * 0.49;
    const radius = Math.min(Array.isArray(radii) ? radii[index] : radii, maxRadius);
    incoming.normalize();
    outgoing.normalize();
    corners.push({
      p1: new THREE.Vector2(curr[0] - incoming.x * radius, curr[1] - incoming.y * radius),
      p2: new THREE.Vector2(curr[0] + outgoing.x * radius, curr[1] + outgoing.y * radius),
      curr,
    });
  }
  shape.moveTo(corners[0].p1.x, corners[0].p1.y);
  for (let index = 0; index < count; index += 1) {
    const corner = corners[index];
    if (index > 0) shape.lineTo(corner.p1.x, corner.p1.y);
    shape.quadraticCurveTo(corner.curr[0], corner.curr[1], corner.p2.x, corner.p2.y);
  }
  shape.closePath();
  return shape;
}

function ellipsePath(cx, cy, rx, ry, clockwise = true, segments = 48) {
  const hole = new THREE.Path();
  for (let index = 0; index <= segments; index += 1) {
    const theta = (index / segments) * Math.PI * 2 * (clockwise ? -1 : 1);
    const x = cx + Math.cos(theta) * rx;
    const y = cy + Math.sin(theta) * ry;
    if (index === 0) hole.moveTo(x, y);
    else hole.lineTo(x, y);
  }
  return hole;
}

function extrudeVertical(shape, height, bevel = 0.006) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 20,
  });
  // Shape is X (width) / Y (depth). Extrude +Z then spin so +Z becomes +Y, Z preserved.
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, height, 0);
  return geometry;
}

function xPanel(width, height, thickness, cut, bevel = 0.005) {
  const hw = width / 2;
  const shape = roundedPolygon(
    [
      [-hw, 0],
      [hw, 0],
      [hw, height],
      [-hw, height],
    ],
    0.016,
  );
  if (cut === "crescent") {
    // TB-01: upward crescents in each wing's top half, curving toward the spine.
    for (const side of [-1, 1]) {
      shape.holes.push(ellipsePath(side * width * 0.22, height * 0.92, width * 0.18, height * 0.38));
    }
  } else if (cut === "bowl") {
    // TB-02: one large central void that reads as a bowl / parabolic cutout.
    shape.holes.push(ellipsePath(0, height * 0.5, width * 0.28, height * 0.36));
  }
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 24,
  });
  geometry.translate(0, 0, -thickness / 2);
  return geometry;
}

function addSplayedLeg(add, material, attach, foot, radiusAttach, radiusFoot) {
  const from = new THREE.Vector3(...attach);
  const to = new THREE.Vector3(...foot);
  const mid = from.clone().add(to).multiplyScalar(0.5);
  const dir = to.clone().sub(from);
  const length = dir.length();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  const euler = new THREE.Euler().setFromQuaternion(quaternion);
  // Local +Y points toward the foot, so radiusTop is the floor end.
  add(new THREE.CylinderGeometry(radiusFoot, radiusAttach, length, 14), material, mid.toArray(), [euler.x, euler.y, euler.z]);
}

export function fitToEnvelope(parts, envelope) {
  const box = new THREE.Box3();
  const baked = parts.map((part) => {
    const geometry = part.geometry.clone();
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(...(part.position ?? [0, 0, 0])),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...(part.rotation ?? [0, 0, 0]))),
      new THREE.Vector3(...(part.scale ?? [1, 1, 1])),
    );
    geometry.applyMatrix4(matrix);
    geometry.computeBoundingBox();
    box.union(geometry.boundingBox);
    return { geometry, materialName: part.materialName };
  });
  const size = box.getSize(new THREE.Vector3());
  if (size.x < 1e-6 || size.y < 1e-6 || size.z < 1e-6) {
    throw new Error("P1 SKU collapsed while fitting envelope");
  }
  const center = box.getCenter(new THREE.Vector3());
  const fit = new THREE.Matrix4()
    .makeScale(envelope.width / size.x, envelope.height / size.y, envelope.depth / size.z)
    .multiply(new THREE.Matrix4().makeTranslation(-center.x, -box.min.y, -center.z));
  return baked.map((part) => {
    part.geometry.applyMatrix4(fit);
    part.geometry.computeBoundingBox();
    part.geometry.computeVertexNormals();
    return {
      geometry: part.geometry,
      materialName: part.materialName,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    };
  });
}

function buildSofa(add) {
  const width = mm(1560);
  const depth = mm(840);
  const height = mm(720);
  const arm = 0.145;
  const back = 0.155;
  const legH = 0.15;
  const railH = 0.016;
  const railY = legH;
  const shellBottom = legH + railH * 0.35;
  const shellH = height - shellBottom;
  const hw = width / 2;
  const hd = depth / 2;
  const pill = 0.068;

  const shell = roundedPolygon(
    [
      [-hw, -hd],
      [-hw, hd],
      [hw, hd],
      [hw, -hd],
      [hw - arm, -hd],
      [hw - arm, hd - back],
      [-hw + arm, hd - back],
      [-hw + arm, -hd],
    ],
    [pill, 0.04, 0.04, pill, pill * 0.7, 0.04, 0.04, pill * 0.7],
  );
  const shellGeom = extrudeVertical(shell, shellH, 0.012);
  add(shellGeom, "primary", [0, shellBottom, 0]);

  const cushionW = width - arm * 2 - 0.012;
  const cushionD = depth - back - 0.02;
  const cushionH = 0.175;
  add(
    softBox(cushionW, cushionH, cushionD, 0.055, 6),
    "cream",
    [0, shellBottom + cushionH * 0.52, -back * 0.28],
  );

  const leg = 0.018;
  const insetX = hw - 0.07;
  const insetZ = hd - 0.08;
  for (const x of [-insetX, insetX]) {
    for (const z of [-insetZ, insetZ]) {
      add(softBox(leg, legH, leg, 0.002, 2), "legs", [x, legH / 2, z]);
      add(softBox(0.028, 0.012, 0.012, 0.002, 2), "legs", [x + Math.sign(x) * -0.012, railY + 0.004, z]);
    }
  }
  add(softBox(width - 0.16, railH, 0.014, 0.003, 2), "legs", [0, railY, -insetZ]);
  add(softBox(width - 0.16, railH, 0.014, 0.003, 2), "legs", [0, railY, insetZ]);
  add(softBox(0.014, railH, depth - 0.18, 0.003, 2), "legs", [-insetX, railY, 0]);
  add(softBox(0.014, railH, depth - 0.18, 0.003, 2), "legs", [insetX, railY, 0]);
}

function buildDoughnutChair(add) {
  const width = mm(770);
  const depth = mm(670);
  const height = mm(760);
  const hubH = 0.055;
  add(new THREE.CylinderGeometry(0.055, 0.06, hubH, 20), "legs", [0, hubH / 2, 0]);
  add(new THREE.CylinderGeometry(0.028, 0.032, 0.22, 16), "legs", [0, 0.16, 0]);

  const armH = 0.012;
  const armW = 0.042;
  const reachX = width * 0.42;
  const reachZ = depth * 0.4;
  for (const [len, rotY] of [[reachX * 2, 0], [reachZ * 2, Math.PI / 2]]) {
    add(softBox(len, armH, armW, 0.006, 4), "legs", [0, 0.012, 0], [0, rotY, 0]);
  }
  for (const angle of [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2]) {
    const isX = angle % Math.PI === 0;
    const reach = isX ? reachX : reachZ;
    const x = Math.sin(angle) * reach;
    const z = Math.cos(angle) * reach;
    add(new THREE.CylinderGeometry(0.012, 0.014, 0.016, 10), "legs", [x, 0.008, z]);
  }

  const shellW = width * 0.98;
  const shellD = depth * 0.92;
  const shellH = 0.38;
  const recline = -0.18;
  add(softBox(shellW, shellH, shellD, 0.09, 7), "primary", [0, 0.48, 0.02], [recline, 0, 0]);
  add(
    softBox(shellW * 0.78, 0.05, shellD * 0.62, 0.04, 5),
    "cream",
    [0, 0.545, -0.02],
    [recline * 0.85, 0, 0],
  );
  add(
    softBox(shellW * 0.9, 0.22, 0.09, 0.05, 5),
    "primary",
    [0, 0.62, shellD * 0.28],
    [recline - 0.08, 0, 0],
  );
}

function buildRoundXTable(add, diameter, height, cut, topT) {
  const panelH = height - topT + 0.004;
  const panelT = Math.min(0.02, diameter * 0.032);
  add(roundDisk(diameter / 2, topT, 64), "primary", [0, height - topT, 0]);
  add(xPanel(diameter * 0.96, panelH, panelT, cut), "cream", [0, 0, 0]);
  add(xPanel(diameter * 0.96, panelH, panelT, cut), "cream", [0, 0, 0], [0, Math.PI / 2, 0]);
}

function buildMeetingTable(add, diameter, height) {
  const topT = 0.032;
  add(roundDisk(diameter / 2, topT, 64), "primary", [0, height - topT, 0]);
  const attachY = height - topT - 0.002;
  const attachR = diameter * 0.13;
  const footR = diameter * 0.36;
  const rAttach = 0.026;
  const rFoot = 0.014;
  for (let index = 0; index < 3; index += 1) {
    const angle = (index * Math.PI * 2) / 3 + Math.PI / 6;
    addSplayedLeg(
      add,
      "cream",
      [Math.sin(angle) * attachR, attachY, Math.cos(angle) * attachR],
      [Math.sin(angle) * footR, 0.006, Math.cos(angle) * footR],
      rAttach,
      rFoot,
    );
    add(
      new THREE.CylinderGeometry(0.016, 0.018, 0.012, 12),
      "cream",
      [Math.sin(angle) * footR, 0.006, Math.cos(angle) * footR],
    );
  }
}

export const p1Assets = [
  {
    file: "sofa-soft.glb",
    catalogId: "HP-A475-AR-MEL-SO-02-C1AA23",
    envelope: { width: mm(1560), depth: mm(840), height: mm(720) },
    colors: { primary: "#e08a68", cream: "#efb091", legs: "#3a3532" },
    build: buildSofa,
  },
  {
    file: "chair-breeze.glb",
    catalogId: "HP-A475-AR-DON-LO-01-04C7E8",
    envelope: { width: mm(770), depth: mm(670), height: mm(760) },
    colors: { primary: "#c4a06e", cream: "#d8bc93", legs: "#c9c6c0" },
    build: buildDoughnutChair,
  },
  {
    file: "table-pebble.glb",
    catalogId: "HP-A475-AR-PLA-TB-01-93B567",
    envelope: { width: mm(700), depth: mm(700), height: mm(380) },
    colors: { primary: "#f2ebe1", cream: "#ebe3d6" },
    build: (add) => buildRoundXTable(add, mm(700), mm(380), "crescent", 0.038),
  },
  {
    file: "hp-a475-ar-pla-tb-02.glb",
    catalogId: "HP-A475-AR-PLA-TB-02-9D2ADC",
    envelope: { width: mm(380), depth: mm(380), height: mm(460) },
    colors: { primary: "#7ea8aa", cream: "#6f9a9c" },
    build: (add) => buildRoundXTable(add, mm(380), mm(460), "bowl", 0.028),
  },
  {
    file: "hp-a213-dme52-b00ddf.glb",
    catalogId: "HP-A213-DME52-B00DDF",
    envelope: { width: mm(1000), depth: mm(1000), height: mm(750) },
    colors: { primary: "#c4a07a", cream: "#cfcbc4" },
    build: (add) => buildMeetingTable(add, mm(1000), mm(750)),
  },
  {
    file: "hp-a213-dme52-0d4db8.glb",
    catalogId: "HP-A213-DME52-0D4DB8",
    envelope: { width: mm(800), depth: mm(800), height: mm(750) },
    colors: { primary: "#c4a07a", cream: "#cfcbc4" },
    build: (add) => buildMeetingTable(add, mm(800), mm(750)),
  },
];
