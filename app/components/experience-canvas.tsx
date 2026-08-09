"use client";

import { Canvas, ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, useGLTF, useTexture } from "@react-three/drei";
import { CuboidCollider, Physics, RigidBody } from "@react-three/rapier";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { EditorMode, FurnitureItem, SceneObjectV1 } from "../lib/domain";
import { getFloorplanRuntime, resolveFloorplanPlacement, type FloorplanOpening, type FloorplanWallSegment } from "../lib/floorplan-runtime";
import { homePlayVisual } from "../lib/visual-contract";

type Props = {
  floorplanId: string;
  mode: EditorMode;
  items: SceneObjectV1[];
  catalog: FurnitureItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, z: number) => void;
  onDragEnd: (id: string) => void;
  themeId: string;
  touchMove: { x: number; z: number };
  avatarVariant: number;
  cameraResetNonce: number;
  auditMode: boolean;
};

const roomPalette: Record<string, { wall: string; floor: string; accent: string; sky: string; sunlight: string }> = {
  sunny: { wall: "#f4e3cd", floor: "#dfbd95", accent: "#8eae8e", sky: "#bdd9e1", sunlight: "#f6dfb7" },
  urban: { wall: "#dedbd4", floor: "#c7baa8", accent: "#c98576", sky: "#c1d0dc", sunlight: "#ead9c2" },
  family: { wall: "#f1d9ba", floor: "#dfa98f", accent: "#8fb5c0", sky: "#c0dde4", sunlight: "#f2d79f" },
  pet: { wall: "#dce5d2", floor: "#bacbac", accent: "#83a978", sky: "#bfd8d0", sunlight: "#e9dcae" },
  empty: { wall: "#eee1ce", floor: "#d2c3af", accent: "#9cad9f", sky: "#cad9de", sunlight: "#eee0c3" },
};

const heroAssetPaths: Record<FurnitureItem["shape"], string> = {
  sofa: "/assets/hero-room/sofa-soft.glb",
  table: "/assets/hero-room/table-pebble.glb",
  chair: "/assets/hero-room/chair-breeze.glb",
  lamp: "/assets/hero-room/lamp-moon.glb",
  plant: "/assets/hero-room/plant-olive.glb",
  rug: "/assets/hero-room/rug-meadow.glb",
  shelf: "/assets/hero-room/shelf-cabin.glb",
  bed: "/assets/hero-room/bed-soft.glb",
};

const mascotAssetPath = "/assets/hero-room/mascot-resident.glb";

export function ExperienceCanvas(props: Props) {
  const palette = roomPalette[props.themeId] ?? roomPalette.sunny;
  const runtime = getFloorplanRuntime(props.floorplanId) ?? getFloorplanRuntime("bh7-a6")!;

  useEffect(() => {
    props.catalog.forEach((product) => useGLTF.preload(product.assetPath ?? heroAssetPaths[product.shape]));
  }, [props.catalog]);

  return (
    <Canvas
      orthographic
      dpr={[1, 1.75]}
      camera={{ position: [...homePlayVisual.scene.cameraPosition], rotation: [...homePlayVisual.scene.cameraRotation], zoom: runtime.cameraZoom, near: 0.1, far: 80 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping }}
      onPointerMissed={() => props.onSelect(null)}
    >
      <color attach="background" args={[homePlayVisual.scene.background]} />
      <ambientLight intensity={0.78} color="#fff8ef" />
      <hemisphereLight args={["#fffaf1", "#cad9ce", 0.42]} />
      <directionalLight position={[7, 11, 8]} intensity={0.62} color="#fff2df" />

      <Physics gravity={[0, -9.81, 0]} timeStep="vary">
        <Dollhouse palette={palette} mode={props.mode} floorplanId={props.floorplanId} auditMode={props.auditMode} />
        {props.items.map((sceneItem) => {
          const product = props.catalog.find((item) => item.sku === sceneItem.sku);
          if (!product) return null;
          return (
            <Furniture
              key={sceneItem.id}
              sceneItem={sceneItem}
              product={product}
              selected={props.selectedId === sceneItem.id}
              interactive={props.mode === "decorate"}
              onSelect={props.onSelect}
              onMove={props.onMove}
              onDragEnd={props.onDragEnd}
            />
          );
        })}

        {props.mode === "explore" && (
          <MascotResident floorplanId={props.floorplanId} mode={props.mode} touchMove={props.touchMove} variant={props.avatarVariant} />
        )}
      </Physics>
      <CameraControls floorplanId={props.floorplanId} mode={props.mode} resetNonce={props.cameraResetNonce} auditMode={props.auditMode} />
    </Canvas>
  );
}

function CameraControls({ floorplanId, mode, resetNonce, auditMode }: { floorplanId: string; mode: EditorMode; resetNonce: number; auditMode: boolean }) {
  const getThree = useThree((state) => state.get);
  const runtime = getFloorplanRuntime(floorplanId) ?? getFloorplanRuntime("bh7-a6")!;
  const cameraZoom = auditMode ? runtime.audit.cameraZoom : runtime.cameraZoom;

  useLayoutEffect(() => {
    if (mode !== "decorate") return;
    const camera = getThree().camera;
    camera.position.set(...homePlayVisual.scene.cameraPosition);
    camera.up.set(0, 1, 0);
    camera.lookAt(...homePlayVisual.scene.cameraTarget);
    if (camera instanceof THREE.OrthographicCamera) camera.zoom = cameraZoom;
    camera.updateProjectionMatrix();
  }, [cameraZoom, floorplanId, getThree, mode, resetNonce]);

  useEffect(() => {
    if (mode !== "decorate") return;
    const { camera, gl } = getThree();
    const canvas = gl.domElement;
    const handleWheel = (event: WheelEvent) => {
      if (!(camera instanceof THREE.OrthographicCamera)) return;
      event.preventDefault();
      const scale = Math.exp(-event.deltaY * 0.0012);
      camera.zoom = THREE.MathUtils.clamp(camera.zoom * scale, cameraZoom * 0.64, cameraZoom * 1.36);
      camera.updateProjectionMatrix();
    };
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [cameraZoom, getThree, mode]);

  return null;
}

function Dollhouse({ palette, mode, floorplanId, auditMode }: { palette: (typeof roomPalette)[string]; mode: EditorMode; floorplanId: string; auditMode: boolean }) {
  const runtime = getFloorplanRuntime(floorplanId) ?? getFloorplanRuntime("bh7-a6")!;
  const { dimensions, footprint, walls, collisionWalls, openings } = runtime.shell;

  return (
    <group data-floorplan-id={floorplanId}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[dimensions.width / 2, 0.09, dimensions.depth / 2]} position={[0, -0.09, 0]} />
        {collisionWalls.map((wall) => (
          <CuboidCollider
            key={wall.id}
            args={[wall.size[0] / 2, wall.height / 2, wall.size[1] / 2]}
            position={[wall.center[0], wall.height / 2, wall.center[1]]}
            rotation={[0, wall.rotationY ?? 0, 0]}
          />
        ))}
        {walls.filter((wall) => wall.kind === "partition").map((wall) => (
          <CuboidCollider
            key={`collision-${wall.id}`}
            args={[wall.size[0] / 2, wall.height / 2, wall.size[1] / 2]}
            position={[wall.center[0], wall.height / 2, wall.center[1]]}
            rotation={[0, wall.rotationY ?? 0, 0]}
          />
        ))}
      </RigidBody>

      <FloorSlab footprint={footprint} floorColor={palette.floor} auditMode={auditMode} />

      {auditMode && <BlueprintOverlay floorplanId={runtime.floorplanId} />}
      {walls.map((wall) => <ShellWall key={wall.id} wall={wall} wallColor={palette.wall} mode={mode} auditMode={auditMode} />)}
      {openings.map((opening) => <ShellOpening key={opening.id} opening={opening} mode={mode} wallColor={palette.wall} skyColor={palette.sky} auditMode={auditMode} />)}
      <FixedKitchen floorplanId={runtime.floorplanId} />
    </group>
  );
}

function BlueprintOverlay({ floorplanId }: { floorplanId: "bh7-a6" | "bh7-a11" }) {
  const runtime = getFloorplanRuntime(floorplanId)!;
  const texture = useTexture(runtime.audit.overlayPath);

  return (
    <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
      <planeGeometry args={[runtime.audit.overlayDimensions[0], runtime.audit.overlayDimensions[1]]} />
      <meshBasicMaterial map={texture} transparent opacity={0.82} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

function FloorSlab({ footprint, floorColor, auditMode }: { footprint: readonly (readonly [number, number])[]; floorColor: string; auditMode: boolean }) {
  const floorEdge = `#${new THREE.Color(floorColor).lerp(new THREE.Color(homePlayVisual.color.blue), 0.18).getHexString()}`;
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    footprint.forEach(([x, z], index) => {
      if (index === 0) shape.moveTo(x, -z);
      else shape.lineTo(x, -z);
    });
    shape.closePath();
    const result = new THREE.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: false, curveSegments: 2 });
    result.computeVertexNormals();
    return result;
  }, [footprint]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group>
      <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]}>
        <meshBasicMaterial color={floorColor} toneMapped={false} transparent={auditMode} opacity={auditMode ? 0.46 : 1} />
      </mesh>
      <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.24, 0]} scale={[1.012, 1.012, 1]}>
        <meshBasicMaterial color={floorEdge} toneMapped={false} />
      </mesh>
    </group>
  );
}

function ShellWall({ wall, wallColor, mode, auditMode }: { wall: FloorplanWallSegment; wallColor: string; mode: EditorMode; auditMode: boolean }) {
  const color = wall.kind === "window" ? "#cfdee2" : wall.kind === "partition" ? "#eadfd2" : wallColor;
  const isStructuralMass = Math.min(wall.size[0], wall.size[1]) > 0.3;
  const cutawayHeight = mode === "decorate" ? (wall.kind === "partition" ? 0.46 : 0.34) : (wall.kind === "partition" ? 0.42 : 0.34);
  const displayHeight = auditMode
    ? 0.2
    : wall.view === "full"
      ? (mode === "decorate" ? 1.48 : wall.height)
      : Math.min(wall.height, cutawayHeight);
  return (
    <group position={[wall.center[0], 0, wall.center[1]]} rotation={[0, wall.rotationY ?? 0, 0]}>
      <RoundedBox position={[0, displayHeight / 2, 0]} args={[wall.size[0], displayHeight, wall.size[1]]} radius={0.045} smoothness={4}>
        <meshBasicMaterial color={color} toneMapped={false} />
      </RoundedBox>
      <RoundedBox position={[0, displayHeight + 0.035, 0]} args={[wall.size[0] + 0.025, 0.07, wall.size[1] + 0.025]} radius={0.028} smoothness={3}>
        <meshBasicMaterial color={isStructuralMass ? color : homePlayVisual.color.blueLine} />
      </RoundedBox>
    </group>
  );
}

function ShellOpening({ opening, mode, wallColor, skyColor, auditMode }: { opening: FloorplanOpening; mode: EditorMode; wallColor: string; skyColor: string; auditMode: boolean }) {
  if (opening.type === "door") {
    const doorHeight = auditMode ? 0.18 : mode === "decorate" ? 0.7 : Math.min(opening.height, 2.1);
    return (
      <group position={[opening.center[0], 0, opening.center[1]]} rotation={[0, opening.rotationY, 0]}>
        <RoundedBox position={[0, 0.025, 0]} args={[opening.width, 0.05, opening.wallThickness + 0.035]} radius={0.018} smoothness={3}>
          <meshBasicMaterial color="#f5c7ab" toneMapped={false} />
        </RoundedBox>
        {!auditMode && (
          <group position={[-opening.width / 2, 0, 0]} rotation={[0, -0.78, 0]}>
            <RoundedBox position={[opening.width / 2, doorHeight / 2, 0]} args={[opening.width, doorHeight, 0.055]} radius={0.035} smoothness={4}>
              <meshToonMaterial color="#edc6a8" emissive="#edc6a8" emissiveIntensity={0.22} />
            </RoundedBox>
            <mesh position={[opening.width * 0.83, doorHeight * 0.56, 0.045]}>
              <sphereGeometry args={[0.035, 12, 8]} />
              <meshBasicMaterial color="#b78768" />
            </mesh>
          </group>
        )}
      </group>
    );
  }

  const visibleHeight = auditMode ? 0.18 : mode === "decorate" ? Math.min(opening.height, 1.05) : opening.height;
  const sill = auditMode ? 0.02 : opening.sill;
  return (
    <group position={[opening.center[0], 0, opening.center[1]]} rotation={[0, opening.rotationY, 0]}>
      {sill > 0.06 && <RoundedBox position={[0, sill / 2, 0]} args={[opening.width, sill, opening.wallThickness]} radius={0.035} smoothness={4}>
        <meshBasicMaterial color={wallColor} toneMapped={false} />
      </RoundedBox>}
      <RoundedBox position={[0, sill + visibleHeight / 2, 0]} args={[Math.max(0.18, opening.width - 0.06), Math.max(0.12, visibleHeight - 0.06), 0.035]} radius={0.03} smoothness={3}>
        <meshBasicMaterial color={skyColor} transparent opacity={0.58} />
      </RoundedBox>
      <mesh position={[0, sill + visibleHeight / 2, 0.035]}>
        <boxGeometry args={[0.04, Math.max(0.1, visibleHeight - 0.08), 0.04]} />
        <meshBasicMaterial color="#fffdf8" />
      </mesh>
      <RoundedBox position={[0, sill + visibleHeight + 0.02, 0]} args={[opening.width + 0.02, 0.065, opening.wallThickness + 0.02]} radius={0.025} smoothness={3}>
        <meshBasicMaterial color={homePlayVisual.color.blueLine} />
      </RoundedBox>
    </group>
  );
}

function FixedKitchen({ floorplanId }: { floorplanId: "bh7-a6" | "bh7-a11" }) {
  const position: [number, number, number] = floorplanId === "bh7-a11" ? [-2.35, 0, -2.78] : [-2.93, 0, 2.55];
  const rotation: [number, number, number] = floorplanId === "bh7-a11" ? [0, Math.PI / 2, 0] : [0, 0, 0];
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox position={[0, 0.42, 0]} args={[0.52, 0.84, 2.2]} radius={0.07} smoothness={4}>
        <meshBasicMaterial color="#fff0d7" toneMapped={false} />
      </RoundedBox>
      <RoundedBox position={[0.03, 0.88, 0]} args={[0.58, 0.08, 2.25]} radius={0.035} smoothness={3}>
        <meshBasicMaterial color="#efbfa0" toneMapped={false} />
      </RoundedBox>
      {[-0.72, 0, 0.72].map((z) => (
        <mesh key={z} position={[0.305, 0.43, z]}>
          <boxGeometry args={[0.018, 0.65, 0.02]} />
          <meshBasicMaterial color="#dfb8a0" />
        </mesh>
      ))}
    </group>
  );
}

function Furniture({
  sceneItem,
  product,
  selected,
  interactive,
  onSelect,
  onMove,
  onDragEnd,
}: {
  sceneItem: SceneObjectV1;
  product: FurnitureItem;
  selected: boolean;
  interactive: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, z: number) => void;
  onDragEnd: (id: string) => void;
}) {
  const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const dragPoint = useMemo(() => new THREE.Vector3(), []);
  const dragging = useRef(false);
  const visualRef = useRef<THREE.Group>(null);
  const targetScale = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  const rotationY = quaternionToY(sceneItem.rotation);

  useFrame(({ clock }, delta) => {
    if (!visualRef.current) return;
    const lifted = dragging.current ? 0.13 : selected ? 0.045 + Math.sin(clock.elapsedTime * 3.4) * 0.008 : 0;
    visualRef.current.position.y = THREE.MathUtils.damp(visualRef.current.position.y, lifted, 13, delta);
    const scale = dragging.current ? 1.045 : selected ? 1.026 : 1;
    targetScale.setScalar(scale);
    visualRef.current.scale.lerp(targetScale, Math.min(1, delta * 12));
    visualRef.current.rotation.z = THREE.MathUtils.damp(visualRef.current.rotation.z, dragging.current ? -0.018 : 0, 12, delta);
  });

  const pointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onSelect(sceneItem.id);
    if (!interactive) return;
    dragging.current = true;
    (event.target as Element).setPointerCapture?.(event.pointerId);
    document.body.classList.add("is-dragging-3d");
  };

  const pointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!interactive || !dragging.current) return;
    event.stopPropagation();
    if (event.ray.intersectPlane(dragPlane, dragPoint)) {
      onMove(sceneItem.id, dragPoint.x, dragPoint.z);
    }
  };

  const pointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return;
    dragging.current = false;
    (event.target as Element).releasePointerCapture?.(event.pointerId);
    document.body.classList.remove("is-dragging-3d");
    onDragEnd(sceneItem.id);
  };

  return (
    <RigidBody
      type="kinematicPosition"
      colliders={false}
      position={[sceneItem.position.x, 0, sceneItem.position.z]}
      rotation={[0, rotationY, 0]}
    >
      <CuboidCollider
        args={[product.size.width / 2, Math.max(0.04, product.size.height / 2), product.size.depth / 2]}
        position={[0, Math.max(0.04, product.size.height / 2), 0]}
      />
      <mesh position={[0, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[product.size.width * 0.72, product.size.depth * 0.68, 1]}>
        <circleGeometry args={[0.5, 28]} />
        <meshBasicMaterial color="#6f625c" transparent opacity={selected ? 0.12 : 0.075} depthWrite={false} />
      </mesh>
      <group
        ref={visualRef}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
      >
        <FurnitureModel product={product} variant={sceneItem.materialVariant} selected={selected} />
        {selected && <SelectionFootprint width={product.size.width} depth={product.size.depth} />}
      </group>
    </RigidBody>
  );
}

function FurnitureModel({ product, variant, selected }: { product: FurnitureItem; variant: number; selected: boolean }) {
  const themeTints = ["#fff7e9", "#78828b", "#f2c995", "#9fbaa0"];
  const tintAmount = [0.04, 0.15, 0.17, 0.18][variant] ?? 0.04;
  const baseSource = variant === 1 ? product.accent : product.color;
  const accentSource = variant === 1 ? product.color : product.accent;
  const base = `#${new THREE.Color(baseSource).lerp(new THREE.Color(themeTints[variant] ?? themeTints[0]), tintAmount).getHexString()}`;
  const accent = `#${new THREE.Color(accentSource).lerp(new THREE.Color(themeTints[variant] ?? themeTints[0]), tintAmount * 0.72).getHexString()}`;
  const assetPath = product.assetPath ?? heroAssetPaths[product.shape];
  const { scene } = useGLTF(assetPath);
  const asset = useMemo(() => cloneAsToon(scene, (role, source) => {
    if (role === "leafLight") return `#${new THREE.Color(base).lerp(new THREE.Color("#f4edcf"), 0.28).getHexString()}`;
    if (role === "wood" && ["sofa", "chair"].includes(product.shape)) return source;
    if (["primary", "wood", "frame", "shade", "leaf"].includes(role)) return base;
    if (["cream", "accent", "edge", "pot", "metal", "mattress", "blanket"].includes(role)) return accent;
    return source;
  }, selected), [accent, base, product.shape, scene, selected]);

  return <primitive object={asset} />;
}

function cloneAsToon(sourceScene: THREE.Group, resolveColor: (role: string, source: string) => string, selected: boolean, withOutline = true) {
  const clone = sourceScene.clone(true);
  const meshes: THREE.Mesh[] = [];
  clone.traverse((child) => { if (child instanceof THREE.Mesh) meshes.push(child); });
  meshes.forEach((child) => {
    const original = (Array.isArray(child.material) ? child.material[0] : child.material) as THREE.Material & { color?: THREE.Color };
    const role = original.name || child.name;
    const source = original.color ? `#${original.color.getHexString()}` : "#f3e6d2";
    const color = resolveColor(role, source);
    const displayColor = new THREE.Color(color).lerp(new THREE.Color("#fff8ef"), selected ? 0.06 : 0);
    child.material = new THREE.MeshToonMaterial({
      color: displayColor,
      emissive: displayColor.clone().lerp(new THREE.Color("#fff8ef"), 0.08),
      emissiveIntensity: 0.28,
      toneMapped: false,
    });
    if (withOutline) {
      const seamLines = new THREE.LineSegments(
        new THREE.EdgesGeometry(child.geometry, 34),
        new THREE.LineBasicMaterial({ color: homePlayVisual.scene.outline, transparent: true, opacity: selected ? 0.2 : 0.075, depthWrite: false, toneMapped: false }),
      );
      seamLines.renderOrder = 2;
      child.add(seamLines);
    }
  });
  return clone;
}

function SelectionFootprint({ width, depth }: { width: number; depth: number }) {
  const w = width + 0.24;
  const d = depth + 0.24;
  return (
    <group position={[0, 0.028, 0]}>
      <RoundedBox args={[w, 0.024, d]} radius={0.01} smoothness={4}>
        <meshBasicMaterial color="#85c99a" transparent opacity={0.2} depthWrite={false} />
      </RoundedBox>
      {[
        [-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2],
      ].map(([x, z], index) => (
        <mesh key={index} position={[x, 0.035, z]}>
          <sphereGeometry args={[0.055, 14, 10]} />
          <meshBasicMaterial color="#4f9f68" />
        </mesh>
      ))}
    </group>
  );
}

function MascotResident({ floorplanId, mode, touchMove, variant }: { floorplanId: string; mode: EditorMode; touchMove: { x: number; z: number }; variant: number }) {
  const ref = useRef<THREE.Group>(null);
  const runtime = getFloorplanRuntime(floorplanId) ?? getFloorplanRuntime("bh7-a6")!;
  const keys = useRef<Record<string, boolean>>({});
  const facing = useRef(0.65);
  const pouchColors = ["#e07c62", "#6ea697", "#7389ba", "#d19a4f", "#8f75a8", "#53766a"];
  const pouch = pouchColors[variant % pouchColors.length];
  const { scene } = useGLTF(mascotAssetPath);
  const mascot = useMemo(() => cloneAsToon(scene, (role, source) => role === "pouch" ? pouch : source, false, false), [pouch, scene]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => { keys.current[event.key.toLowerCase()] = true; };
    const up = (event: KeyboardEvent) => { keys.current[event.key.toLowerCase()] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useFrame(({ camera, clock }, delta) => {
    if (!ref.current) return;
    const direction = new THREE.Vector2(
      (keys.current.d || keys.current.arrowright ? 1 : 0) - (keys.current.a || keys.current.arrowleft ? 1 : 0) + touchMove.x,
      (keys.current.s || keys.current.arrowdown ? 1 : 0) - (keys.current.w || keys.current.arrowup ? 1 : 0) + touchMove.z,
    );
    const moving = mode === "explore" && direction.lengthSq() > 0;
    const bounceSpeed = moving ? 8.2 : 2.4;
    const bounce = Math.abs(Math.sin(clock.elapsedTime * bounceSpeed));
    ref.current.position.y = bounce * (moving ? 0.07 : 0.028);
    const baseScale = mode === "explore" ? 0.92 : 0.86;
    ref.current.scale.set(baseScale * (1 + bounce * 0.018), baseScale * (1 - bounce * 0.022), baseScale * (1 + bounce * 0.018));
    ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, moving ? Math.sin(clock.elapsedTime * 8.2) * 0.035 : 0, Math.min(1, delta * 8));
    if (mode !== "explore") return;
    if (direction.lengthSq() > 0) {
      direction.normalize();
      const speed = 2.25 * delta;
      const placement = resolveFloorplanPlacement(floorplanId, {
        x: ref.current.position.x + direction.x * speed,
        z: ref.current.position.z + direction.y * speed,
      }, { width: 0.34, depth: 0.34 });
      if (!placement.blocked) {
        ref.current.position.x = placement.x;
        ref.current.position.z = placement.z;
      }
      facing.current = Math.atan2(direction.x, direction.y);
      ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, facing.current, Math.min(1, delta * 10));
    }
    const desiredCamera = new THREE.Vector3(ref.current.position.x + 5.7, 6.2, ref.current.position.z + 7.1);
    camera.position.lerp(desiredCamera, Math.min(1, delta * 3.2));
    camera.lookAt(ref.current.position.x - 0.35, 0.32, ref.current.position.z - 0.35);
    if (camera instanceof THREE.OrthographicCamera) {
      camera.zoom = THREE.MathUtils.damp(camera.zoom, runtime.cameraZoom * 1.4, 4.5, delta);
      camera.updateProjectionMatrix();
    }
  });

  return (
    <group ref={ref} position={[runtime.mascotStart[0], 0, runtime.mascotStart[1]]} rotation={[0, 0.65, 0]} scale={mode === "explore" ? 0.92 : 0.86}>
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.7, 0.42, 1]}>
        <circleGeometry args={[0.5, 32]} />
        <meshBasicMaterial color="#9f8d85" transparent opacity={0.07} depthWrite={false} />
      </mesh>
      <primitive object={mascot} />
    </group>
  );
}

function quaternionToY(q: { x: number; y: number; z: number; w: number }) {
  return Math.atan2(2 * (q.w * q.y + q.x * q.z), 1 - 2 * (q.y * q.y + q.z * q.z));
}

Object.values(heroAssetPaths).forEach((assetPath) => useGLTF.preload(assetPath));
useGLTF.preload(mascotAssetPath);
