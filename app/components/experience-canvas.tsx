"use client";

import { Canvas, ThreeEvent, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { CuboidCollider, Physics, RigidBody } from "@react-three/rapier";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { EditorMode, FurnitureItem, SceneObjectV1 } from "../lib/domain";

type Props = {
  mode: EditorMode;
  items: SceneObjectV1[];
  catalog: FurnitureItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, z: number) => void;
  onDragEnd: () => void;
  themeId: string;
};

const roomPalette: Record<string, { wall: string; floor: string; accent: string }> = {
  sunny: { wall: "#f8ebd5", floor: "#c99863", accent: "#8ba58f" },
  urban: { wall: "#d7d4cc", floor: "#77685a", accent: "#d97c5f" },
  family: { wall: "#f5e2b5", floor: "#b5855f", accent: "#79aebb" },
  pet: { wall: "#e2eadc", floor: "#ad8057", accent: "#789b79" },
  empty: { wall: "#f3eee5", floor: "#bc9a77", accent: "#a8a198" },
};

export function ExperienceCanvas(props: Props) {
  const palette = roomPalette[props.themeId] ?? roomPalette.sunny;

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [8.8, 8.4, 10.2], fov: 38, near: 0.1, far: 80 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onPointerMissed={() => props.onSelect(null)}
    >
      <color attach="background" args={["#d9e8e2"]} />
      <fog attach="fog" args={["#d9e8e2", 18, 32]} />
      <ambientLight intensity={1.7} />
      <directionalLight
        castShadow
        position={[6, 11, 5]}
        intensity={2.2}
        color="#fff5df"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <hemisphereLight args={["#cfe6ff", "#9f805e", 1.25]} />

      <Physics gravity={[0, -9.81, 0]} timeStep="vary">
        <Dollhouse palette={palette} />
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

        <Avatar mode={props.mode} accent={palette.accent} />
      </Physics>
      <ContactShadows position={[0, 0.015, 0]} opacity={0.3} scale={17} blur={2.7} far={8} />
      <OrbitControls
        makeDefault
        enabled
        enableDamping
        dampingFactor={0.08}
        minDistance={6.5}
        maxDistance={18}
        minPolarAngle={0.5}
        maxPolarAngle={1.28}
        target={[0, 0.8, 0]}
        enablePan={props.mode === "decorate"}
      />
      <Environment preset="apartment" environmentIntensity={0.45} />
    </Canvas>
  );
}

function Dollhouse({ palette }: { palette: { wall: string; floor: string; accent: string } }) {
  return (
    <group>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[5.3, 0.09, 3.7]} position={[0, -0.09, 0]} />
        <CuboidCollider args={[5.3, 1.625, 0.09]} position={[0, 1.6, -3.58]} />
        <CuboidCollider args={[0.09, 1.625, 3.675]} position={[-5.2, 1.6, 0]} />
      </RigidBody>
      <mesh receiveShadow position={[0, -0.09, 0]}>
        <boxGeometry args={[10.6, 0.18, 7.4]} />
        <meshStandardMaterial color={palette.floor} roughness={0.88} />
      </mesh>
      <mesh receiveShadow castShadow position={[0, 1.6, -3.58]}>
        <boxGeometry args={[10.6, 3.25, 0.18]} />
        <meshStandardMaterial color={palette.wall} roughness={0.95} />
      </mesh>
      <mesh receiveShadow castShadow position={[-5.2, 1.6, 0]}>
        <boxGeometry args={[0.18, 3.25, 7.35]} />
        <meshStandardMaterial color={palette.wall} roughness={0.95} />
      </mesh>
      <mesh castShadow receiveShadow position={[4.2, 0.95, -3.42]}>
        <boxGeometry args={[2.1, 1.8, 0.16]} />
        <meshStandardMaterial color="#afd6df" roughness={0.25} metalness={0.03} />
      </mesh>
      <mesh position={[4.2, 2.2, -3.3]}>
        <boxGeometry args={[2.35, 0.13, 0.18]} />
        <meshStandardMaterial color={palette.accent} />
      </mesh>
      <mesh position={[3.05, 1.6, -3.3]}>
        <boxGeometry args={[0.13, 3, 0.18]} />
        <meshStandardMaterial color={palette.accent} />
      </mesh>
      <mesh position={[5.28, 1.6, -3.3]}>
        <boxGeometry args={[0.13, 3, 0.18]} />
        <meshStandardMaterial color={palette.accent} />
      </mesh>
      <mesh castShadow position={[-5.05, 1.1, 2.35]}>
        <boxGeometry args={[0.14, 2.2, 1.65]} />
        <meshStandardMaterial color="#c58258" />
      </mesh>
      <mesh position={[0, -0.175, 0]}>
        <boxGeometry args={[11.1, 0.12, 7.9]} />
        <meshStandardMaterial color="#735b49" roughness={1} />
      </mesh>
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
  onDragEnd: () => void;
}) {
  const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const dragPoint = useMemo(() => new THREE.Vector3(), []);
  const dragging = useRef(false);
  const rotationY = quaternionToY(sceneItem.rotation);

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
    onDragEnd();
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
      <group
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={pointerUp}
      scale={selected ? 1.025 : 1}
      >
        <FurnitureModel product={product} variant={sceneItem.materialVariant} selected={selected} />
        {selected && (
          <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[Math.max(product.size.width, product.size.depth) * 0.56, Math.max(product.size.width, product.size.depth) * 0.62, 48]} />
            <meshBasicMaterial color="#ff8b5e" transparent opacity={0.8} depthWrite={false} />
          </mesh>
        )}
      </group>
    </RigidBody>
  );
}

function FurnitureModel({ product, variant, selected }: { product: FurnitureItem; variant: number; selected: boolean }) {
  const base = variant % 2 === 0 ? product.color : product.accent;
  const accent = variant % 2 === 0 ? product.accent : product.color;
  const glow = selected ? "#ffb08f" : "#000000";
  const material = (color: string, roughness = 0.78) => (
    <meshStandardMaterial color={color} roughness={roughness} emissive={glow} emissiveIntensity={selected ? 0.12 : 0} />
  );

  switch (product.shape) {
    case "sofa":
      return (
        <group>
          <mesh castShadow receiveShadow position={[0, 0.38, 0]}>{box([2.12, 0.38, 0.88])}{material(base)}</mesh>
          <mesh castShadow position={[0, 0.82, 0.35]} rotation={[-0.12, 0, 0]}>{box([1.82, 0.62, 0.25])}{material(base)}</mesh>
          <mesh castShadow position={[-1.01, 0.55, 0]}>{box([0.18, 0.52, 0.88])}{material(accent)}</mesh>
          <mesh castShadow position={[1.01, 0.55, 0]}>{box([0.18, 0.52, 0.88])}{material(accent)}</mesh>
          <mesh castShadow position={[-0.48, 0.61, -0.12]}>{box([0.86, 0.14, 0.52])}{material(accent)}</mesh>
          <mesh castShadow position={[0.48, 0.61, -0.12]}>{box([0.86, 0.14, 0.52])}{material(accent)}</mesh>
        </group>
      );
    case "table":
      return (
        <group>
          <mesh castShadow position={[0, 0.38, 0]} scale={[1.1, 0.16, 0.72]}>{sphere(32)}{material(base, 0.55)}</mesh>
          <mesh castShadow position={[0, 0.19, 0]}>{cylinder([0.14, 0.22, 0.35, 16])}{material(accent)}</mesh>
        </group>
      );
    case "chair":
      return (
        <group>
          <mesh castShadow position={[0, 0.45, 0]}>{box([0.7, 0.18, 0.7])}{material(base)}</mesh>
          <mesh castShadow position={[0, 0.83, 0.27]} rotation={[-0.12, 0, 0]}>{box([0.68, 0.62, 0.18])}{material(base)}</mesh>
          {[-0.26, 0.26].flatMap((x) => [-0.25, 0.25].map((z) => (
            <mesh castShadow key={`${x}-${z}`} position={[x, 0.22, z]}>{cylinder([0.035, 0.045, 0.45, 8])}{material(accent)}</mesh>
          )))}
        </group>
      );
    case "lamp":
      return (
        <group>
          <mesh castShadow position={[0, 0.05, 0]}>{cylinder([0.25, 0.29, 0.1, 20])}{material(accent)}</mesh>
          <mesh castShadow position={[0, 0.78, 0]}>{cylinder([0.035, 0.045, 1.48, 12])}{material(accent, 0.4)}</mesh>
          <mesh castShadow position={[0, 1.48, 0]}>{sphere(24)}<meshStandardMaterial color={base} emissive={base} emissiveIntensity={1.2} roughness={0.3} /></mesh>
          <pointLight position={[0, 1.48, 0]} color={base} intensity={2.2} distance={3.2} />
        </group>
      );
    case "plant":
      return (
        <group>
          <mesh castShadow position={[0, 0.22, 0]}>{cylinder([0.28, 0.2, 0.45, 12])}{material(accent)}</mesh>
          <mesh castShadow position={[0, 0.85, 0]}>{cylinder([0.055, 0.075, 1.1, 8])}{material("#765844")}</mesh>
          {[[0, 1.38, 0], [-0.22, 1.12, 0.1], [0.24, 1.05, -0.06], [0.1, 1.58, 0.05]].map((p, index) => (
            <mesh castShadow position={p as [number, number, number]} scale={[0.42, 0.55, 0.38]} key={index}>
              <icosahedronGeometry args={[0.5, 1]} />{material(base)}
            </mesh>
          ))}
        </group>
      );
    case "rug":
      return <mesh receiveShadow position={[0, 0.025, 0]}>{box([2.5, 0.045, 1.65])}{material(base, 1)}</mesh>;
    case "shelf":
      return (
        <group>
          <mesh castShadow position={[0, 0.82, 0]}>{box([1.5, 1.64, 0.38])}{material(base)}</mesh>
          {[0.42, 0.84, 1.25].map((y) => <mesh key={y} position={[0, y, -0.205]}>{box([1.34, 0.05, 0.05])}{material(accent)}</mesh>)}
          {[-0.42, 0.1, 0.48].map((x, index) => <mesh key={x} position={[x, 0.46 + index * 0.25, -0.24]}>{box([0.26, 0.34, 0.08])}{material(["#e7c873", "#8db8ad", "#dd8d78"][index])}</mesh>)}
        </group>
      );
    case "bed":
      return (
        <group>
          <mesh castShadow position={[0, 0.32, 0]}>{box([1.82, 0.42, 2.08])}{material(accent)}</mesh>
          <mesh castShadow position={[0, 0.58, 0]}>{box([1.7, 0.18, 1.95])}{material(base)}</mesh>
          <mesh castShadow position={[0, 0.88, 0.94]}>{box([1.82, 0.82, 0.18])}{material(accent)}</mesh>
          <mesh castShadow position={[-0.43, 0.72, 0.55]}>{box([0.72, 0.18, 0.5])}{material("#f1e7d8")}</mesh>
          <mesh castShadow position={[0.43, 0.72, 0.55]}>{box([0.72, 0.18, 0.5])}{material("#f1e7d8")}</mesh>
        </group>
      );
  }
}

function Avatar({ mode, accent }: { mode: EditorMode; accent: string }) {
  const ref = useRef<THREE.Group>(null);
  const keys = useRef<Record<string, boolean>>({});

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

  useFrame((_, delta) => {
    if (!ref.current || mode !== "explore") return;
    const speed = 2.2 * delta;
    if (keys.current.w || keys.current.arrowup) ref.current.position.z -= speed;
    if (keys.current.s || keys.current.arrowdown) ref.current.position.z += speed;
    if (keys.current.a || keys.current.arrowleft) ref.current.position.x -= speed;
    if (keys.current.d || keys.current.arrowright) ref.current.position.x += speed;
    ref.current.position.x = THREE.MathUtils.clamp(ref.current.position.x, -4.5, 4.5);
    ref.current.position.z = THREE.MathUtils.clamp(ref.current.position.z, -3, 3);
  });

  return (
    <group ref={ref} position={[3.4, 0, 1.8]} visible={mode === "explore"}>
      <mesh castShadow position={[0, 1.27, 0]}><sphereGeometry args={[0.25, 20, 16]} /><meshStandardMaterial color="#f2c6a4" /></mesh>
      <mesh castShadow position={[0, 0.85, 0]}><capsuleGeometry args={[0.24, 0.48, 6, 12]} /><meshStandardMaterial color={accent} /></mesh>
      <mesh castShadow position={[-0.12, 0.35, 0]}><capsuleGeometry args={[0.07, 0.35, 4, 8]} /><meshStandardMaterial color="#4d5a65" /></mesh>
      <mesh castShadow position={[0.12, 0.35, 0]}><capsuleGeometry args={[0.07, 0.35, 4, 8]} /><meshStandardMaterial color="#4d5a65" /></mesh>
      <mesh castShadow position={[0, 1.45, 0]} scale={[1, 0.55, 1]}><sphereGeometry args={[0.27, 16, 12]} /><meshStandardMaterial color="#704b37" /></mesh>
    </group>
  );
}

function box(args: [number, number, number]) {
  return <boxGeometry args={args} />;
}

function sphere(segments: number) {
  return <sphereGeometry args={[0.5, segments, Math.max(12, segments / 2)]} />;
}

function cylinder(args: [number, number, number, number]) {
  return <cylinderGeometry args={args} />;
}

function quaternionToY(q: { x: number; y: number; z: number; w: number }) {
  return Math.atan2(2 * (q.w * q.y + q.x * q.z), 1 - 2 * (q.y * q.y + q.z * q.z));
}
