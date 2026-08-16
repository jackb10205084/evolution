"use client";

import { Canvas, ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, useGLTF, useTexture } from "@react-three/drei";
import { CuboidCollider, Physics, RigidBody } from "@react-three/rapier";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import type { EditorMode, FurnitureItem, SceneObjectV1 } from "../lib/domain";
import { getFloorplanRuntime, resolveFloorplanPlacement, type FloorplanOpening, type FloorplanWallSegment } from "../lib/floorplan-runtime";
import { getScenePresentation, type ScenePresentation, type SceneView } from "../lib/scene-presentation";
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
  sceneView: SceneView;
};

const roomPalette: Record<string, { wall: string; floor: string; accent: string; sky: string; sunlight: string }> = {
  sunny: { wall: "#fff8ed", floor: "#efe4d2", accent: "#a9c7a2", sky: "#cfe3ed", sunlight: "#fff0c9" },
  urban: { wall: "#f5f1ec", floor: "#d9cfbf", accent: "#b5bfd3", sky: "#d7e2eb", sunlight: "#f4e7d8" },
  family: { wall: "#fff3e7", floor: "#efd6c2", accent: "#a7c8d0", sky: "#d2e7ed", sunlight: "#ffe4ac" },
  pet: { wall: "#f4f7ec", floor: "#d9dfc9", accent: "#a6c69d", sky: "#d5e5df", sunlight: "#f7e9bd" },
  empty: { wall: "#faf5ed", floor: "#e7dac9", accent: "#b9c7c3", sky: "#dce6e8", sunlight: "#f5ead1" },
};

const toonGradient = createToonGradient();

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

const mascotAssetPath = "/assets/hero-room/mascot-resident.glb?v=lookdev-3";

export function ExperienceCanvas(props: Props) {
  const palette = roomPalette[props.themeId] ?? roomPalette.sunny;
  const presentation = useMemo(
    () => getScenePresentation(props.floorplanId, props.sceneView, props.auditMode),
    [props.auditMode, props.floorplanId, props.sceneView],
  );

  useEffect(() => {
    props.catalog.forEach((product) => useGLTF.preload(resolveProductAssetPath(product)));
  }, [props.catalog]);

  return (
    <Canvas
      orthographic
      dpr={[1, 1.75]}
      camera={{ position: [...presentation.camera.position], rotation: [...homePlayVisual.scene.cameraRotation], zoom: presentation.camera.zoom, near: 0.1, far: 80 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping }}
      onPointerMissed={() => props.onSelect(null)}
    >
      <color attach="background" args={[homePlayVisual.scene.background]} />
      <ambientLight intensity={0.6} color="#fffdf8" />
      <hemisphereLight args={["#fff8ee", "#d4c8c0", 0.7]} />
      <directionalLight position={[6.5, 10, 7.5]} intensity={0.92} color="#fff4e0" />
      <directionalLight position={[-5, 5, -3]} intensity={0.28} color="#d7e4f0" />

      <Physics gravity={[0, -9.81, 0]} timeStep="vary">
        <FloorplanStage palette={palette} mode={props.mode} floorplanId={props.floorplanId} presentation={presentation} />
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

        {presentation.residentAnchor && (
          <MascotResident floorplanId={props.floorplanId} mode={props.mode} touchMove={props.touchMove} variant={props.avatarVariant} anchor={presentation.residentAnchor} />
        )}
      </Physics>
      <WatercolorOutlineComposer selectedId={props.selectedId} />
      <CameraControls mode={props.mode} resetNonce={props.cameraResetNonce} presentation={presentation} />
    </Canvas>
  );
}

function WatercolorOutlineComposer({ selectedId }: { selectedId: string | null }) {
  const { gl, scene, camera, size } = useThree();
  const pipeline = useMemo(() => {
    const composer = new EffectComposer(gl);
    const renderPass = new RenderPass(scene, camera);
    const roomOutline = new OutlinePass(new THREE.Vector2(1, 1), scene, camera);
    roomOutline.visibleEdgeColor.set(homePlayVisual.scene.outline);
    roomOutline.hiddenEdgeColor.set(homePlayVisual.scene.background);
    roomOutline.edgeStrength = 0.34;
    roomOutline.edgeGlow = 0;
    roomOutline.edgeThickness = 0.4;
    roomOutline.pulsePeriod = 0;

    const objectOutline = new OutlinePass(new THREE.Vector2(1, 1), scene, camera);
    objectOutline.visibleEdgeColor.set(homePlayVisual.scene.objectOutline);
    objectOutline.hiddenEdgeColor.set(homePlayVisual.scene.background);
    objectOutline.edgeStrength = 1.05;
    objectOutline.edgeGlow = 0;
    objectOutline.edgeThickness = 0.78;
    objectOutline.pulsePeriod = 0;

    const selectedOutline = new OutlinePass(new THREE.Vector2(1, 1), scene, camera);
    selectedOutline.visibleEdgeColor.set(homePlayVisual.color.coral);
    selectedOutline.hiddenEdgeColor.set(homePlayVisual.color.peach);
    selectedOutline.edgeStrength = 1.65;
    selectedOutline.edgeGlow = 0;
    selectedOutline.edgeThickness = 0.95;
    selectedOutline.pulsePeriod = 0;

    composer.addPass(renderPass);
    composer.addPass(roomOutline);
    composer.addPass(objectOutline);
    composer.addPass(selectedOutline);
    composer.addPass(new OutputPass());
    return { composer, roomOutline, objectOutline, selectedOutline };
  }, [camera, gl, scene]);
  const pipelineRef = useRef(pipeline);

  useLayoutEffect(() => {
    pipelineRef.current = pipeline;
  }, [pipeline]);

  useEffect(() => {
    const current = pipelineRef.current;
    current.composer.setPixelRatio(Math.min(gl.getPixelRatio(), 1.5));
    current.composer.setSize(size.width, size.height);
    current.roomOutline.setSize(size.width, size.height);
    current.objectOutline.setSize(size.width, size.height);
    current.selectedOutline.setSize(size.width, size.height);
  }, [gl, size.height, size.width]);

  useEffect(() => () => pipeline.composer.dispose(), [pipeline]);
  useFrame(() => {
    const current = pipelineRef.current;
    const shell: THREE.Object3D[] = [];
    const toys: THREE.Object3D[] = [];
    scene.traverse((child) => {
      if (child.name === "HP_SHELL") shell.push(child);
      if (child.name.startsWith("HP_SCENE_ITEM__") || child.name === "HP_MASCOT") toys.push(child);
    });
    current.roomOutline.selectedObjects = shell.length ? shell : [scene];
    current.objectOutline.selectedObjects = toys;
    const selected = selectedId ? scene.getObjectByName(`HP_SCENE_ITEM__${selectedId}`) : null;
    current.selectedOutline.selectedObjects = selected ? [selected] : [];
    current.composer.render();
  }, 1);
  return null;
}

function CameraControls({ mode, resetNonce, presentation }: { mode: EditorMode; resetNonce: number; presentation: ScenePresentation }) {
  const getThree = useThree((state) => state.get);
  const cameraZoom = presentation.camera.zoom;

  useLayoutEffect(() => {
    if (mode !== "decorate") return;
    const camera = getThree().camera;
    camera.position.set(...presentation.camera.position);
    camera.up.set(0, 1, 0);
    camera.lookAt(...presentation.camera.target);
    if (camera instanceof THREE.OrthographicCamera) camera.zoom = cameraZoom;
    camera.updateProjectionMatrix();
  }, [cameraZoom, getThree, mode, presentation.camera.position, presentation.camera.target, resetNonce]);

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

function FloorplanStage({ palette, mode, floorplanId, presentation }: { palette: (typeof roomPalette)[string]; mode: EditorMode; floorplanId: string; presentation: ScenePresentation }) {
  const runtime = getFloorplanRuntime(floorplanId) ?? getFloorplanRuntime("bh7-a6")!;

  return (
    <group name="HP_SHELL" data-floorplan-id={floorplanId}>
      <FloorplanColliders floorplanId={runtime.floorplanId} />
      {presentation.renderer === "audit" ? (
        <AuditFloorplan floorplanId={runtime.floorplanId} palette={palette} mode={mode} />
      ) : (
        <PresentationFloorplan floorplanId={runtime.floorplanId} palette={palette} mode={mode} />
      )}
    </group>
  );
}

function FloorplanColliders({ floorplanId }: { floorplanId: "bh7-a6" | "bh7-a11" }) {
  const { dimensions, walls, collisionWalls } = getFloorplanRuntime(floorplanId)!.shell;
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[dimensions.width / 2, 0.09, dimensions.depth / 2]} position={[0, -0.09, 0]} />
      {[...collisionWalls, ...walls.filter((wall) => wall.kind === "partition")].map((wall) => (
        <CuboidCollider
          key={`collision-${wall.id}`}
          args={[wall.size[0] / 2, wall.height / 2, wall.size[1] / 2]}
          position={[wall.center[0], wall.height / 2, wall.center[1]]}
          rotation={[0, wall.rotationY ?? 0, 0]}
        />
      ))}
    </RigidBody>
  );
}

function AuditFloorplan({ floorplanId, palette, mode }: { floorplanId: "bh7-a6" | "bh7-a11"; palette: (typeof roomPalette)[string]; mode: EditorMode }) {
  const { footprint, walls, openings } = getFloorplanRuntime(floorplanId)!.shell;
  return (
    <group data-renderer="audit">
      <FloorSlab footprint={footprint} floorColor={palette.floor} auditMode />
      <BlueprintOverlay floorplanId={floorplanId} />
      {walls.map((wall) => <ShellWall key={wall.id} wall={wall} wallColor={palette.wall} mode={mode} auditMode />)}
      {openings.map((opening) => <ShellOpening key={opening.id} opening={opening} mode={mode} wallColor={palette.wall} skyColor={palette.sky} auditMode />)}
    </group>
  );
}

function PresentationFloorplan({ floorplanId, palette, mode }: { floorplanId: "bh7-a6" | "bh7-a11"; palette: (typeof roomPalette)[string]; mode: EditorMode }) {
  const { footprint, walls, openings } = getFloorplanRuntime(floorplanId)!.shell;
  return (
    <group data-renderer="presentation">
      <FloorSlab footprint={footprint} floorColor={palette.floor} auditMode={false} />
      {walls.map((wall) => <ShellWall key={wall.id} wall={wall} wallColor={palette.wall} mode={mode} auditMode={false} />)}
      {openings.map((opening) => <ShellOpening key={opening.id} opening={opening} mode={mode} wallColor={palette.wall} skyColor={palette.sky} auditMode={false} />)}
      <FixedKitchen floorplanId={floorplanId} />
      {floorplanId === "bh7-a6" && <FixedBaths />}
      {mode === "decorate" && <WallDecor floorplanId={floorplanId} accent={palette.accent} />}
    </group>
  );
}

// 固定牆面裝飾：掛畫與時鐘（僅在佈置模式的高牆上顯示）
function WallDecor({ floorplanId, accent }: { floorplanId: "bh7-a6" | "bh7-a11"; accent: string }) {
  if (floorplanId !== "bh7-a6") return null;
  const wallX = -3.24; // A6 客廳左外牆室內面（I1A6-01）
  return (
    <group>
      {/* 拱形掛畫 */}
      <group position={[wallX, 1.56, -2.15]} rotation={[0, Math.PI / 2, 0]}>
        <RoundedBox args={[0.52, 0.68, 0.045]} radius={0.02} smoothness={3}>
          <meshBasicMaterial color="#fffdf8" toneMapped={false} />
        </RoundedBox>
        <RoundedBox position={[0, -0.075, 0.006]} args={[0.3, 0.36, 0.045]} radius={0.018} smoothness={3}>
          <meshBasicMaterial color={accent} toneMapped={false} />
        </RoundedBox>
        <mesh position={[0, 0.105, 0.006]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.045, 24, 1, false, 0, Math.PI]} />
          <meshBasicMaterial color={accent} toneMapped={false} />
        </mesh>
      </group>
      {/* 圓與山丘掛畫 */}
      <group position={[wallX, 1.5, -1.6]} rotation={[0, Math.PI / 2, 0]}>
        <RoundedBox args={[0.44, 0.56, 0.045]} radius={0.02} smoothness={3}>
          <meshBasicMaterial color="#fffdf8" toneMapped={false} />
        </RoundedBox>
        <mesh position={[0, 0.08, 0.026]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.085, 0.085, 0.012, 24]} />
          <meshBasicMaterial color={homePlayVisual.color.peach} toneMapped={false} />
        </mesh>
        <RoundedBox position={[0, -0.14, 0.026]} args={[0.3, 0.1, 0.012]} radius={0.045} smoothness={3}>
          <meshBasicMaterial color="#d9c6a8" toneMapped={false} />
        </RoundedBox>
      </group>
      {/* 掛鐘（層架上方） */}
      <group position={[wallX, 1.82, -0.45]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.17, 0.17, 0.04, 28]} />
          <meshBasicMaterial color="#fffdf8" toneMapped={false} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.145, 0.145, 0.046, 28]} />
          <meshBasicMaterial color="#fbf6ec" toneMapped={false} />
        </mesh>
      </group>
      <group position={[wallX + 0.028, 1.82, -0.45]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0.045, 0]}>
          <boxGeometry args={[0.016, 0.09, 0.008]} />
          <meshBasicMaterial color={homePlayVisual.color.cocoa} toneMapped={false} />
        </mesh>
        <mesh position={[0.032, 0, 0]}>
          <boxGeometry args={[0.064, 0.014, 0.008]} />
          <meshBasicMaterial color={homePlayVisual.color.cocoa} toneMapped={false} />
        </mesh>
      </group>
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
  const shape = useMemo(() => {
    const result = new THREE.Shape();
    footprint.forEach(([x, z], index) => {
      if (index === 0) result.moveTo(x, -z);
      else result.lineTo(x, -z);
    });
    result.closePath();
    return result;
  }, [footprint]);

  const geometry = useMemo(() => {
    const result = new THREE.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: false, curveSegments: 2 });
    result.computeVertexNormals();
    return result;
  }, [shape]);

  const topGeometry = useMemo(() => new THREE.ShapeGeometry(shape), [shape]);
  const plankTexture = usePlankTexture(floorColor);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => topGeometry.dispose(), [topGeometry]);

  return (
    <group>
      <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]}>
        <meshBasicMaterial color={floorColor} toneMapped={false} transparent={auditMode} opacity={auditMode ? 0.46 : 1} />
      </mesh>
      {!auditMode && (
        <mesh geometry={topGeometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
          <meshBasicMaterial map={plankTexture} toneMapped={false} />
        </mesh>
      )}
      <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.24, 0]} scale={[1.012, 1.012, 1]}>
        <meshBasicMaterial color={floorEdge} toneMapped={false} />
      </mesh>
    </group>
  );
}

// 平塗式拼板地板：純色階、無照片木紋，符合 v2 視覺契約
function usePlankTexture(floorColor: string) {
  return useMemo(() => {
    const tileMeters = 1.28;
    const size = 256;
    const plankRows = 8;
    const rowHeight = size / plankRows;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d")!;
    const base = new THREE.Color(floorColor);
    const tints = [
      `#${base.clone().getHexString()}`,
      `#${base.clone().lerp(new THREE.Color("#ffffff"), 0.05).getHexString()}`,
      `#${base.clone().lerp(new THREE.Color("#a98d6d"), 0.06).getHexString()}`,
    ];
    const seam = `#${base.clone().lerp(new THREE.Color("#8a7460"), 0.26).getHexString()}`;
    for (let row = 0; row < plankRows; row += 1) {
      const y = row * rowHeight;
      const offset = (row % 2) * (size / 2);
      for (let column = -1; column < 2; column += 1) {
        const x = column * size + offset;
        context.fillStyle = tints[(row * 3 + column + 6) % 3];
        context.fillRect(x, y, size, rowHeight);
        context.fillStyle = seam;
        context.globalAlpha = 0.42;
        context.fillRect(x, y, 1.6, rowHeight);
        context.globalAlpha = 1;
      }
      context.fillStyle = seam;
      context.globalAlpha = 0.5;
      context.fillRect(0, y, size, 1.4);
      context.globalAlpha = 1;
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1 / tileMeters, 1 / tileMeters);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }, [floorColor]);
}

function ShellWall({ wall, wallColor, mode, auditMode }: { wall: FloorplanWallSegment; wallColor: string; mode: EditorMode; auditMode: boolean }) {
  const color = wall.kind === "window" ? "#e1edf0" : wall.kind === "partition" ? "#fff2e6" : wallColor;
  const displayHeight = auditMode
    ? 0.2
    : wall.view === "full"
      ? (mode === "decorate" ? 2.06 : Math.min(wall.height, 2.2))
      : mode === "decorate"
        ? (wall.kind === "partition" ? 0.94 : 0.9)
        : (wall.kind === "partition" ? 0.38 : 0.3);
  const showBaseboard = !auditMode && displayHeight > 0.5;
  return (
    <group position={[wall.center[0], 0, wall.center[1]]} rotation={[0, wall.rotationY ?? 0, 0]}>
      <RoundedBox position={[0, displayHeight / 2, 0]} args={[wall.size[0], displayHeight, wall.size[1]]} radius={0.045} smoothness={4}>
        <meshBasicMaterial color={color} toneMapped={false} />
      </RoundedBox>
      {showBaseboard && (
        <RoundedBox position={[0, 0.055, 0]} args={[wall.size[0] + 0.018, 0.11, wall.size[1] + 0.03]} radius={0.018} smoothness={3}>
          <meshBasicMaterial color="#eee1cd" toneMapped={false} />
        </RoundedBox>
      )}
      <RoundedBox position={[0, displayHeight + 0.025, 0]} args={[wall.size[0] + 0.025, 0.05, wall.size[1] + 0.025]} radius={0.024} smoothness={3}>
        <meshBasicMaterial color={auditMode ? homePlayVisual.color.blueLine : "#d1ddec"} toneMapped={false} />
      </RoundedBox>
    </group>
  );
}

function ShellOpening({ opening, mode, wallColor, skyColor, auditMode }: { opening: FloorplanOpening; mode: EditorMode; wallColor: string; skyColor: string; auditMode: boolean }) {
  if (opening.type === "door") {
    // 門扇高度跟隨剖牆高度，避免在低牆上出現懸空的整片門板（散步模式破圖主因）
    const doorHeight = auditMode ? 0.18 : mode === "decorate" ? 0.7 : 0.68;
    return (
      <group position={[opening.center[0], 0, opening.center[1]]} rotation={[0, opening.rotationY, 0]}>
        <RoundedBox position={[0, 0.025, 0]} args={[opening.width, 0.05, opening.wallThickness + 0.035]} radius={0.018} smoothness={3}>
          <meshBasicMaterial color="#f5c7ab" toneMapped={false} />
        </RoundedBox>
        {!auditMode && (
          <group position={[-opening.width / 2, 0, 0]} rotation={[0, -0.52, 0]}>
            <RoundedBox position={[opening.width / 2, doorHeight / 2, 0]} args={[opening.width, doorHeight, 0.055]} radius={0.035} smoothness={4}>
              <meshToonMaterial color="#f5cfaa" gradientMap={toonGradient} toneMapped={false} />
            </RoundedBox>
            <mesh position={[opening.width * 0.83, doorHeight * 0.74, 0.045]}>
              <sphereGeometry args={[0.035, 12, 8]} />
              <meshBasicMaterial color="#b78768" />
            </mesh>
          </group>
        )}
      </group>
    );
  }

  const visibleHeight = auditMode ? 0.18 : Math.min(opening.height, mode === "decorate" ? 1.96 : 2.08);
  const sill = auditMode ? 0.02 : opening.sill;
  const glassWidth = Math.max(0.18, opening.width - 0.06);
  const glassHeight = Math.max(0.12, visibleHeight - 0.06);
  const panelCount = Math.max(2, Math.round(opening.width / 0.78));
  const isWideGlass = !auditMode && opening.type === "sliding-door" && opening.width > 1.4;
  return (
    <group position={[opening.center[0], 0, opening.center[1]]} rotation={[0, opening.rotationY, 0]}>
      {sill > 0.06 && <RoundedBox position={[0, sill / 2, 0]} args={[opening.width, sill, opening.wallThickness]} radius={0.035} smoothness={4}>
        <meshBasicMaterial color={wallColor} toneMapped={false} />
      </RoundedBox>}
      {/* 白色外框 */}
      {!auditMode && (
        <RoundedBox position={[0, sill + visibleHeight / 2, -0.006]} args={[opening.width + 0.06, visibleHeight + 0.05, 0.028]} radius={0.02} smoothness={3}>
          <meshBasicMaterial color="#fffdf8" toneMapped={false} />
        </RoundedBox>
      )}
      {/* 玻璃（天空） */}
      <RoundedBox position={[0, sill + visibleHeight / 2, 0]} args={[glassWidth, glassHeight, 0.035]} radius={0.03} smoothness={3}>
        <meshBasicMaterial color={skyColor} transparent opacity={0.6} />
      </RoundedBox>
      {/* 窗外遠景綠意（置於玻璃後方，避免共面閃爍） */}
      {!auditMode && (
        <RoundedBox position={[0, sill + glassHeight * 0.2, -0.012]} args={[glassWidth - 0.05, Math.max(0.1, glassHeight * 0.32), 0.026]} radius={0.024} smoothness={3}>
          <meshBasicMaterial color="#cddec7" transparent opacity={0.75} />
        </RoundedBox>
      )}
      {/* 窗櫺 */}
      {Array.from({ length: panelCount - 1 }, (_, index) => {
        const x = -opening.width / 2 + (opening.width / panelCount) * (index + 1);
        return (
          <mesh key={`mullion-${index}`} position={[x, sill + visibleHeight / 2, 0.03]}>
            <boxGeometry args={[0.045, Math.max(0.1, visibleHeight - 0.05), 0.05]} />
            <meshBasicMaterial color="#fffdf8" toneMapped={false} />
          </mesh>
        );
      })}
      {!auditMode && visibleHeight > 1.2 && (
        <mesh position={[0, sill + visibleHeight * 0.72, 0.03]}>
          <boxGeometry args={[Math.max(0.1, opening.width - 0.04), 0.045, 0.05]} />
          <meshBasicMaterial color="#fffdf8" toneMapped={false} />
        </mesh>
      )}
      {/* 窗簾（大面落地窗，室內側） */}
      {isWideGlass && (
        <group position={[0, 0, opening.wallThickness / 2 + 0.1]}>
          <mesh position={[0, sill + visibleHeight + 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.022, 0.022, opening.width + 0.34, 10]} />
            <meshBasicMaterial color="#c9a37a" toneMapped={false} />
          </mesh>
          {[-1, 1].map((side) => (
            <group key={`curtain-${side}`} position={[side * (opening.width / 2 - 0.17), 0, 0]}>
              <RoundedBox position={[0, sill + visibleHeight / 2 + 0.02, 0]} args={[0.4, visibleHeight + 0.02, 0.13]} radius={0.055} smoothness={4}>
                <meshToonMaterial color="#fbf8f1" gradientMap={toonGradient} toneMapped={false} />
              </RoundedBox>
              <RoundedBox position={[side * 0.08, sill + visibleHeight * 0.52, 0.015]} args={[0.22, visibleHeight * 0.86, 0.125]} radius={0.05} smoothness={4}>
                <meshToonMaterial color="#f1ece1" gradientMap={toonGradient} toneMapped={false} />
              </RoundedBox>
            </group>
          ))}
        </group>
      )}
      <RoundedBox position={[0, sill + visibleHeight + 0.02, 0]} args={[opening.width + 0.02, 0.065, opening.wallThickness + 0.02]} radius={0.025} smoothness={3}>
        <meshBasicMaterial color={homePlayVisual.color.blueLine} />
      </RoundedBox>
    </group>
  );
}

function FixedKitchen({ floorplanId }: { floorplanId: "bh7-a6" | "bh7-a11" }) {
  const position: [number, number, number] = floorplanId === "bh7-a11" ? [-2.35, 0, -2.78] : [-2.94, 0, 1.68];
  const rotation: [number, number, number] = floorplanId === "bh7-a11" ? [0, Math.PI / 2, 0] : [0, 0, 0];
  return (
    <group position={position} rotation={rotation}>
      {/* 固定廚具碰撞體：散步模式不可穿越 */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[0.34, 0.5, 1.2]} position={[0.02, 0.5, 0]} />
        <CuboidCollider args={[0.33, 0.9, 0.34]} position={[0, 0.9, floorplanId === "bh7-a6" ? 1.82 : -1.52]} />
      </RigidBody>
      {/* 下櫃本體與踢腳（白門板，參考樣品屋） */}
      <RoundedBox position={[0, 0.46, 0]} args={[0.58, 0.78, 2.3]} radius={0.05} smoothness={4}>
        <meshToonMaterial color="#f6f2ea" gradientMap={toonGradient} toneMapped={false} />
      </RoundedBox>
      <RoundedBox position={[0.01, 0.06, 0]} args={[0.54, 0.12, 2.24]} radius={0.03} smoothness={3}>
        <meshBasicMaterial color="#ddd6ca" toneMapped={false} />
      </RoundedBox>
      {/* 灰色石英檯面 */}
      <RoundedBox position={[0.03, 0.88, 0]} args={[0.66, 0.07, 2.4]} radius={0.032} smoothness={4}>
        <meshToonMaterial color="#b6b1a8" gradientMap={toonGradient} toneMapped={false} />
      </RoundedBox>
      {/* 白色門板與橫向把手 */}
      {[-0.76, 0, 0.76].map((z) => (
        <group key={`door-${z}`}>
          <RoundedBox position={[0.3, 0.45, z]} args={[0.025, 0.6, 0.62]} radius={0.012} smoothness={3}>
            <meshToonMaterial color="#fbf8f2" gradientMap={toonGradient} toneMapped={false} />
          </RoundedBox>
          <RoundedBox position={[0.325, 0.66, z]} args={[0.022, 0.035, 0.24]} radius={0.01} smoothness={3}>
            <meshBasicMaterial color="#b9c2cb" toneMapped={false} />
          </RoundedBox>
        </group>
      ))}
      {/* 水槽與龍頭 */}
      <RoundedBox position={[0.05, 0.918, -0.62]} args={[0.42, 0.028, 0.52]} radius={0.014} smoothness={3}>
        <meshBasicMaterial color="#dde6ea" toneMapped={false} />
      </RoundedBox>
      <mesh position={[-0.17, 1.0, -0.62]}>
        <cylinderGeometry args={[0.021, 0.026, 0.2, 12]} />
        <meshBasicMaterial color="#9fb4c4" toneMapped={false} />
      </mesh>
      <mesh position={[-0.1, 1.09, -0.62]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 0.17, 10]} />
        <meshBasicMaterial color="#9fb4c4" toneMapped={false} />
      </mesh>
      {/* 黑色玻璃爐台（IH 爐） */}
      <RoundedBox position={[0.05, 0.918, 0.62]} args={[0.44, 0.024, 0.56]} radius={0.014} smoothness={3}>
        <meshBasicMaterial color="#7c766f" toneMapped={false} />
      </RoundedBox>
      {[0.44, 0.8].map((z) => (
        <mesh key={`burner-${z}`} position={[0.05, 0.936, z]}>
          <cylinderGeometry args={[0.085, 0.085, 0.014, 24]} />
          <meshBasicMaterial color="#655854" toneMapped={false} />
        </mesh>
      ))}
      {/* 抽油煙機（煙囪型，參考樣品屋） */}
      <RoundedBox position={[-0.02, 1.62, 0.62]} args={[0.5, 0.09, 0.6]} radius={0.02} smoothness={3}>
        <meshToonMaterial color="#ccd3d9" gradientMap={toonGradient} toneMapped={false} />
      </RoundedBox>
      <RoundedBox position={[-0.1, 1.95, 0.62]} args={[0.26, 0.58, 0.3]} radius={0.02} smoothness={3}>
        <meshToonMaterial color="#d6dce1" gradientMap={toonGradient} toneMapped={false} />
      </RoundedBox>
      {/* 檯面小物：陶鍋與砧板 */}
      <mesh position={[0.05, 0.95, 0.08]}>
        <cylinderGeometry args={[0.085, 0.095, 0.09, 20]} />
        <meshToonMaterial color="#df8f78" gradientMap={toonGradient} toneMapped={false} />
      </mesh>
      <mesh position={[0.05, 1.0, 0.08]}>
        <sphereGeometry args={[0.088, 20, 12]} />
        <meshToonMaterial color="#e8a58d" gradientMap={toonGradient} toneMapped={false} />
      </mesh>
      <RoundedBox position={[0.04, 0.93, -0.24]} args={[0.3, 0.02, 0.2]} radius={0.01} smoothness={3} rotation={[0, 0.2, 0]}>
        <meshToonMaterial color="#d9b58c" gradientMap={toonGradient} toneMapped={false} />
      </RoundedBox>
      {/* 淺灰背牆板 */}
      <RoundedBox position={[-0.275, 1.2, 0]} args={[0.03, 0.58, 2.3]} radius={0.014} smoothness={3}>
        <meshBasicMaterial color="#eceeed" toneMapped={false} />
      </RoundedBox>
      {/* 白色吊櫃＋上方木質收邊 */}
      <RoundedBox position={[-0.13, 1.76, -0.35]} args={[0.34, 0.56, 1.35]} radius={0.04} smoothness={4}>
        <meshToonMaterial color="#f6f2ea" gradientMap={toonGradient} toneMapped={false} />
      </RoundedBox>
      {[-0.86, -0.42, 0.02].map((z) => (
        <RoundedBox key={`upper-door-${z}`} position={[0.045, 1.76, z + 0.28]} args={[0.02, 0.5, 0.42]} radius={0.01} smoothness={3}>
          <meshToonMaterial color="#fbf8f2" gradientMap={toonGradient} toneMapped={false} />
        </RoundedBox>
      ))}
      <RoundedBox position={[-0.1, 2.12, -0.35]} args={[0.42, 0.16, 1.44]} radius={0.03} smoothness={3}>
        <meshToonMaterial color="#dcb98e" gradientMap={toonGradient} toneMapped={false} />
      </RoundedBox>
      {/* 冰箱：A6 在玄關（I1A6-02 REF），A11 維持廚具端 */}
      <group position={[0, 0, floorplanId === "bh7-a6" ? 1.82 : -1.52]}>
        <RoundedBox position={[0, 0.9, 0]} args={[0.64, 1.78, 0.66]} radius={0.12} smoothness={5}>
          <meshToonMaterial color="#f4eee1" gradientMap={toonGradient} toneMapped={false} />
        </RoundedBox>
        <mesh position={[0.31, 1.26, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.014, 0.014, 0.6]} />
          <meshBasicMaterial color="#e3dccb" toneMapped={false} />
        </mesh>
        {[1.44, 0.98].map((y) => (
          <group key={`fridge-handle-${y}`}>
            <RoundedBox position={[0.33, y, 0.18]} args={[0.035, 0.2, 0.045]} radius={0.016} smoothness={3}>
              <meshBasicMaterial color="#c4ccd3" toneMapped={false} />
            </RoundedBox>
          </group>
        ))}
      </group>
      {/* I1A6-02 167.5 dining built-in: west wall +167.5, 89.4 deep, north of the 120 cook/sink run. Not catalog DME52. */}
      {floorplanId === "bh7-a6" && (
        <group position={[0.515, 0, -1.037]}>
          <RigidBody type="fixed" colliders={false}>
            <CuboidCollider args={[0.838, 0.38, 0.447]} position={[0, 0.38, 0]} />
          </RigidBody>
          <RoundedBox position={[0, 0.37, 0]} args={[1.675, 0.7, 0.894]} radius={0.08} smoothness={4}>
            <meshToonMaterial color="#f3e6d4" gradientMap={toonGradient} toneMapped={false} />
          </RoundedBox>
          <RoundedBox position={[0, 0.735, 0]} args={[1.7, 0.06, 0.92]} radius={0.03} smoothness={4}>
            <meshToonMaterial color="#e8d4bc" gradientMap={toonGradient} toneMapped={false} />
          </RoundedBox>
        </group>
      )}
    </group>
  );
}

function PorcelainToilet({ rotationY = 0 }: { rotationY?: number }) {
  return (
    <group rotation={[0, rotationY, 0]}>
      <RoundedBox position={[0, 0.2, 0.02]} args={[0.38, 0.4, 0.52]} radius={0.12} smoothness={5}>
        <meshToonMaterial color="#f7f3ec" gradientMap={toonGradient} toneMapped={false} />
      </RoundedBox>
      <mesh position={[0, 0.42, -0.02]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.18, 0.08, 20]} />
        <meshToonMaterial color="#fffdf8" gradientMap={toonGradient} toneMapped={false} />
      </mesh>
      <RoundedBox position={[0, 0.58, 0.16]} args={[0.36, 0.36, 0.14]} radius={0.08} smoothness={4}>
        <meshToonMaterial color="#f4efe6" gradientMap={toonGradient} toneMapped={false} />
      </RoundedBox>
    </group>
  );
}

function PorcelainBasin() {
  return (
    <group>
      <RoundedBox position={[0, 0.42, 0]} args={[1.075, 0.78, 0.6]} radius={0.08} smoothness={4}>
        <meshToonMaterial color="#f6f2ea" gradientMap={toonGradient} toneMapped={false} />
      </RoundedBox>
      <RoundedBox position={[0, 0.82, 0.02]} args={[0.42, 0.06, 0.36]} radius={0.03} smoothness={3}>
        <meshBasicMaterial color="#e7eef1" toneMapped={false} />
      </RoundedBox>
      <mesh position={[0, 0.96, -0.16]}>
        <cylinderGeometry args={[0.018, 0.022, 0.16, 10]} />
        <meshBasicMaterial color="#c4b6a6" toneMapped={false} />
      </mesh>
    </group>
  );
}

function FixedBaths() {
  // World xz from I1A6-02 bays via A6_SHELL_V3 point() (6.825 m / 388.44 pt).
  // 主衛 interior x 390.24–526.92 (240 cm), y 484.32–549.6 (115 cm).
  // West→east inside 主衛: 150 wet + 10 partition + 80 toilet. Vanity 107.5×60 sits in the 150 bay.
  // 客衛 interior x 351.96–437.52 (150 cm), y 569.4–647.88. Sink west, toilet east. 管道間 empty.
  return (
    <group>
      {/* 主衛 vanity 107.5×60 against north of the 150 bay */}
      <group position={[1.409, 0, 1.844]}>
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[0.538, 0.42, 0.3]} position={[0, 0.42, 0]} />
        </RigidBody>
        <PorcelainBasin />
      </group>
      {/* 主衛 shower tray 150×115 */}
      <group position={[1.622, 0, 2.118]}>
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[0.75, 0.06, 0.575]} position={[0, 0.06, 0]} />
        </RigidBody>
        <RoundedBox position={[0, 0.03, 0]} args={[1.5, 0.06, 1.15]} radius={0.04} smoothness={3}>
          <meshToonMaterial color="#eef2f3" gradientMap={toonGradient} toneMapped={false} />
        </RoundedBox>
        <RoundedBox position={[0.72, 0.95, 0]} args={[0.04, 1.9, 1.12]} radius={0.02} smoothness={3}>
          <meshBasicMaterial color="#d7e3e8" transparent opacity={0.35} toneMapped={false} />
        </RoundedBox>
      </group>
      {/* 主衛 toilet in the 80 cm east bay */}
      <group position={[2.873, 0, 1.994]}>
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[0.2, 0.4, 0.26]} position={[0, 0.4, 0]} />
        </RigidBody>
        <PorcelainToilet />
      </group>
      {/* 客衛 sink, 60 cm off the west wall */}
      <group position={[0.499, 0, 3.339]}>
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[0.3, 0.42, 0.28]} position={[0, 0.42, 0]} />
        </RigidBody>
        <group scale={[0.56, 1, 0.85]}>
          <PorcelainBasin />
        </group>
      </group>
      {/* 客衛 toilet, east bay of the 150 cm room */}
      <group position={[1.403, 0, 3.739]}>
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[0.2, 0.4, 0.26]} position={[0, 0.4, 0]} />
        </RigidBody>
        <PorcelainToilet rotationY={Math.PI} />
      </group>
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
        <meshBasicMaterial color="#cbaea1" transparent opacity={selected ? 0.14 : 0.085} depthWrite={false} toneMapped={false} />
      </mesh>
      <group
        ref={visualRef}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
      >
        <group name={`HP_SCENE_ITEM__${sceneItem.id}`}>
          <FurnitureModel product={product} variant={sceneItem.materialVariant} selected={selected} />
        </group>
        {selected && <SelectionFootprint width={product.size.width} depth={product.size.depth} />}
      </group>
    </RigidBody>
  );
}

function FurnitureModel({ product, variant, selected }: { product: FurnitureItem; variant: number; selected: boolean }) {
  const themeTints = ["#fff7e9", "#78828b", "#f2c995", "#9fbaa0"];
  const tintAmount = [0.24, 0.15, 0.2, 0.2][variant] ?? 0.24;
  const baseSource = variant === 1 ? product.accent : product.color;
  const accentSource = variant === 1 ? product.color : product.accent;
  const base = `#${new THREE.Color(baseSource).lerp(new THREE.Color(themeTints[variant] ?? themeTints[0]), tintAmount).getHexString()}`;
  const accent = `#${new THREE.Color(accentSource).lerp(new THREE.Color(themeTints[variant] ?? themeTints[0]), tintAmount * 0.72).getHexString()}`;
  const assetPath = resolveProductAssetPath(product);
  const { scene } = useGLTF(assetPath);
  const asset = useMemo(() => cloneAsToon(scene, (role, source) => {
    if (role === "leafLight") return `#${new THREE.Color(base).lerp(new THREE.Color("#f4edcf"), 0.28).getHexString()}`;
    if (role === "legs") return source;
    if (role === "wood" && ["sofa", "chair"].includes(product.shape)) return source;
    if (["primary", "wood", "frame", "shade", "leaf"].includes(role)) return base;
    if (["cream", "accent", "edge", "pot", "metal", "mattress", "blanket"].includes(role)) return accent;
    return source;
  }, selected), [accent, base, product.shape, scene, selected]);

  return <primitive object={asset} />;
}

function cloneAsToon(sourceScene: THREE.Group, resolveColor: (role: string, source: string) => string, selected: boolean, flat = false) {
  const clone = sourceScene.clone(true);
  const meshes: THREE.Mesh[] = [];
  clone.traverse((child) => { if (child instanceof THREE.Mesh) meshes.push(child); });
  meshes.forEach((child) => {
    const original = (Array.isArray(child.material) ? child.material[0] : child.material) as THREE.MeshStandardMaterial;
    const role = original.name || child.name;
    const source = original.color ? `#${original.color.getHexString()}` : "#f3e6d2";
    const color = resolveColor(role, source);
    const displayColor = new THREE.Color(color).lerp(new THREE.Color("#fff8ef"), selected ? 0.06 : 0);
    const map = original.map ?? null;
    child.material = flat
      ? new THREE.MeshBasicMaterial({ color: displayColor, map, toneMapped: false })
      : new THREE.MeshToonMaterial({
          color: displayColor,
          map,
          gradientMap: toonGradient,
          toneMapped: false,
          emissive: new THREE.Color("#000000"),
          emissiveIntensity: 0,
        });
    child.userData.homeplayToonSurface = true;
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

function MascotResident({ floorplanId, mode, touchMove, variant, anchor }: { floorplanId: string; mode: EditorMode; touchMove: { x: number; z: number }; variant: number; anchor: readonly [number, number] }) {
  const ref = useRef<THREE.Group>(null);
  const runtime = getFloorplanRuntime(floorplanId) ?? getFloorplanRuntime("bh7-a6")!;
  const keys = useRef<Record<string, boolean>>({});
  const facing = useRef(0.65);
  const pouchColors = ["#e07c62", "#6ea697", "#7389ba", "#d19a4f", "#8f75a8", "#53766a"];
  const pouch = pouchColors[variant % pouchColors.length];
  const { scene } = useGLTF(mascotAssetPath);
  const mascot = useMemo(() => cloneAsToon(scene, (role, source) => role === "pouch" ? pouch : source, false), [pouch, scene]);

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
    const bounce = moving
      ? Math.abs(Math.sin(clock.elapsedTime * 8.2))
      : (Math.sin(clock.elapsedTime * (Math.PI * 2 / 3.1)) + 1) / 2;
    ref.current.position.y = bounce * (moving ? 0.065 : 0.024);
    const baseScale = mode === "explore" ? 0.8 : 0.74;
    ref.current.scale.set(baseScale * (1 + bounce * 0.014), baseScale * (1 - bounce * 0.018), baseScale * (1 + bounce * 0.014));
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
    const desiredCamera = new THREE.Vector3(ref.current.position.x + 4.6, 5.2, ref.current.position.z + 5.8);
    camera.position.lerp(desiredCamera, Math.min(1, delta * 3.2));
    camera.lookAt(ref.current.position.x - 0.22, 0.4, ref.current.position.z - 0.22);
    if (camera instanceof THREE.OrthographicCamera) {
      camera.zoom = THREE.MathUtils.damp(camera.zoom, runtime.cameraZoom * 1.72, 4.5, delta);
      camera.updateProjectionMatrix();
    }
  });

  return (
    <group ref={ref} position={[mode === "explore" ? runtime.mascotStart[0] : anchor[0], 0, mode === "explore" ? runtime.mascotStart[1] : anchor[1]]} rotation={[0, 0.65, 0]} scale={mode === "explore" ? 0.8 : 0.74}>
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.7, 0.42, 1]}>
        <circleGeometry args={[0.5, 32]} />
        <meshBasicMaterial color="#cfb7ac" transparent opacity={0.1} depthWrite={false} toneMapped={false} />
      </mesh>
      <group name="HP_MASCOT">
        <primitive object={mascot} />
      </group>
    </group>
  );
}

function quaternionToY(q: { x: number; y: number; z: number; w: number }) {
  return Math.atan2(2 * (q.w * q.y + q.x * q.z), 1 - 2 * (q.y * q.y + q.z * q.z));
}

function createToonGradient() {
  const gradient = new THREE.DataTexture(
    Uint8Array.from([
      176, 168, 180, 255,
      214, 198, 188, 255,
      242, 228, 212, 255,
      255, 250, 244, 255,
    ]),
    4,
    1,
    THREE.RGBAFormat,
  );
  gradient.magFilter = THREE.NearestFilter;
  gradient.minFilter = THREE.NearestFilter;
  gradient.generateMipmaps = false;
  if ("NoColorSpace" in THREE) gradient.colorSpace = THREE.NoColorSpace;
  gradient.needsUpdate = true;
  return gradient;
}

function resolveProductAssetPath(product: FurnitureItem) {
  const assetPath = product.assetPath ?? heroAssetPaths[product.shape];
  return `${assetPath}?v=${encodeURIComponent(product.assetVersion)}`;
}

useGLTF.preload(mascotAssetPath);
