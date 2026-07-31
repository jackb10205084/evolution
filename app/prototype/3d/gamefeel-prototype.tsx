"use client";

// PROTOTYPE — Three radically different game-feel directions, switchable with ?variant=.
import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Float, OrbitControls, RoundedBox } from "@react-three/drei";
import {
  ArrowRight,
  Box,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Grid3X3,
  Home,
  MousePointer2,
  PackagePlus,
  RotateCw,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import styles from "./gamefeel-prototype.module.css";

type Variant = "A" | "B" | "C";
type FurnitureId = "sofa" | "table" | "chair" | "lamp" | "plant" | "shelf";
type FurnitureState = { id: FurnitureId; x: number; z: number; rotation: number };

const variantMeta: Record<Variant, { name: string; subtitle: string }> = {
  A: { name: "Cozy Dollhouse", subtitle: "溫暖模型屋" },
  B: { name: "Smart Planner", subtitle: "精準俯視配置" },
  C: { name: "Living Story", subtitle: "角色探索生活" },
};

const initialFurniture: FurnitureState[] = [
  { id: "sofa", x: -1.7, z: 1.25, rotation: Math.PI },
  { id: "table", x: -0.2, z: 0.1, rotation: 0 },
  { id: "chair", x: 1.5, z: 0.25, rotation: -0.5 },
  { id: "lamp", x: -3.7, z: 1.95, rotation: 0 },
  { id: "plant", x: 3.75, z: -2.3, rotation: 0 },
  { id: "shelf", x: -3.8, z: -2.4, rotation: 0 },
];

const furnitureLabel: Record<FurnitureId, { name: string; price: string; emoji: string }> = {
  sofa: { name: "雲朵雙人沙發", price: "$42,800", emoji: "🛋️" },
  table: { name: "小石橢圓桌", price: "$12,800", emoji: "🪵" },
  chair: { name: "微風扶手椅", price: "$16,800", emoji: "🪑" },
  lamp: { name: "小月球立燈", price: "$7,600", emoji: "💡" },
  plant: { name: "橄欖樹植栽", price: "$3,200", emoji: "🌿" },
  shelf: { name: "小屋模組收納櫃", price: "$21,800", emoji: "🏠" },
};

export function GamefeelPrototype({ initialVariant }: { initialVariant: Variant }) {
  const router = useRouter();
  const [variant, setVariant] = useState<Variant>(initialVariant);
  const [selectedId, setSelectedId] = useState<FurnitureId>("sofa");
  const [furniture, setFurniture] = useState(initialFurniture);
  const variants: Variant[] = ["A", "B", "C"];

  const switchVariant = (direction: -1 | 1) => {
    const current = variants.indexOf(variant);
    const next = variants[(current + direction + variants.length) % variants.length];
    setVariant(next);
    router.replace(`/prototype/3d?variant=${next}`, { scroll: false });
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || (event.target instanceof HTMLElement && event.target.isContentEditable)) return;
      if (event.key === "ArrowLeft") switchVariant(-1);
      if (event.key === "ArrowRight") switchVariant(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const rotateSelected = () => {
    setFurniture((items) => items.map((item) => item.id === selectedId ? { ...item, rotation: item.rotation + Math.PI / 4 } : item));
  };

  const shared = { furniture, selectedId, onSelect: setSelectedId, onRotate: rotateSelected };

  return (
    <main className={styles.prototypeRoot}>
      {variant === "A" && <CozyDollhouseVariant {...shared} />}
      {variant === "B" && <PlannerVariant {...shared} />}
      {variant === "C" && <ExploreVariant furniture={furniture} />}
      {process.env.NODE_ENV !== "production" && (
        <nav className={styles.prototypeSwitcher} aria-label="原型版本切換">
          <button onClick={() => switchVariant(-1)} aria-label="上一個版本"><ChevronLeft /></button>
          <span><small>THROWAWAY PROTOTYPE</small><strong>{variant} — {variantMeta[variant].name}</strong><em>{variantMeta[variant].subtitle}</em></span>
          <button onClick={() => switchVariant(1)} aria-label="下一個版本"><ChevronRight /></button>
        </nav>
      )}
    </main>
  );
}

type EditVariantProps = {
  furniture: FurnitureState[];
  selectedId: FurnitureId;
  onSelect: (id: FurnitureId) => void;
  onRotate: () => void;
};

function CozyDollhouseVariant({ furniture, selectedId, onSelect, onRotate }: EditVariantProps) {
  const selected = furnitureLabel[selectedId];
  return (
    <section className={`${styles.variantShell} ${styles.cozyShell}`}>
      <header className={styles.cozyHeader}>
        <BrandMark />
        <span className={styles.prototypeTag}><Sparkles />遊戲感試作 · 不儲存</span>
        <div className={styles.cozyHeaderActions}><button><Camera />拍照</button><button className={styles.sunButton}><Sun />午後日光</button></div>
      </header>
      <div className={styles.cozyCanvas}>
        <Canvas shadows dpr={[1, 1.5]} camera={{ position: [9, 8.5, 10], fov: 34 }}>
          <color attach="background" args={["#bcded2"]} />
          <fog attach="fog" args={["#bcded2", 18, 30]} />
          <ambientLight intensity={1.25} />
          <directionalLight castShadow position={[5, 11, 7]} intensity={2.5} color="#fff1cf" shadow-mapSize={[1536, 1536]} />
          <hemisphereLight args={["#dff5ff", "#98765c", 1.1]} />
          <CozyRoom />
          <FurnitureCollection items={furniture} selectedId={selectedId} onSelect={onSelect} soft />
          <ToyAvatar position={[3, 0, 1.55]} />
          <ContactShadows position={[0, 0.02, 0]} opacity={0.34} scale={16} blur={2.7} far={7} />
          <OrbitControls makeDefault enablePan={false} minDistance={8} maxDistance={16} minPolarAngle={0.68} maxPolarAngle={1.12} target={[0, 0.7, 0]} />
        </Canvas>
        <div className={styles.roomBadge}><span>21 坪 · 兩房提案</span><strong>日光慢生活</strong></div>
        <div className={styles.happyBadge}><span>✨</span><div><small>空間心情</small><strong>舒適 92%</strong></div></div>
        <div className={styles.selectedBubble}><span>{selected.emoji}</span><div><small>已選取</small><strong>{selected.name}</strong></div><b>{selected.price}</b></div>
      </div>
      <aside className={styles.cozyInventory}>
        <div><strong>我的家具袋</strong><small>點選物件，再旋轉看看</small></div>
        <div className={styles.inventoryItems}>{(Object.keys(furnitureLabel) as FurnitureId[]).map((id) => <button className={selectedId === id ? styles.activeInventory : ""} key={id} onClick={() => onSelect(id)}><span>{furnitureLabel[id].emoji}</span><small>{furnitureLabel[id].name}</small></button>)}</div>
        <button className={styles.roundAction} onClick={onRotate}><RotateCw /><span>旋轉 45°</span></button>
      </aside>
      <div className={styles.cozyHint}><MousePointer2 />點家具選取 · 拖曳視角 · 滾輪縮放</div>
    </section>
  );
}

function PlannerVariant({ furniture, selectedId, onSelect, onRotate }: EditVariantProps) {
  const selected = furnitureLabel[selectedId];
  return (
    <section className={`${styles.variantShell} ${styles.plannerShell}`}>
      <header className={styles.plannerHeader}>
        <BrandMark />
        <div className={styles.plannerModes}><button className={styles.plannerModeActive}><Grid3X3 />俯視配置</button><button><Gamepad2 />角色探索</button></div>
        <span className={styles.budgetPill}><small>目前家具總價</small><strong>$104,000</strong><i>預算內</i></span>
        <button className={styles.plannerCta}><Check />完成配置</button>
      </header>
      <div className={styles.plannerBody}>
        <aside className={styles.plannerCatalog}>
          <span className={styles.prototypeTag}><Grid3X3 />精準配置試作</span>
          <h1>客廳家具</h1>
          <div className={styles.plannerTabs}><button className={styles.tabActive}>全部</button><button>座椅</button><button>桌几</button><button>收納</button></div>
          <div className={styles.plannerItemList}>{(Object.keys(furnitureLabel) as FurnitureId[]).map((id) => <button key={id} className={selectedId === id ? styles.plannerItemActive : ""} onClick={() => onSelect(id)}><span>{furnitureLabel[id].emoji}</span><div><strong>{furnitureLabel[id].name}</strong><small>{furnitureLabel[id].price}</small></div><PackagePlus /></button>)}</div>
        </aside>
        <div className={styles.plannerCanvas}>
          <Canvas shadows orthographic camera={{ position: [0, 12, 0.01], zoom: 62, near: 0.1, far: 50 }}>
            <color attach="background" args={["#edf0eb"]} />
            <ambientLight intensity={1.8} />
            <directionalLight castShadow position={[4, 12, 5]} intensity={2.1} />
            <PlannerFloor />
            <FurnitureCollection items={furniture} selectedId={selectedId} onSelect={onSelect} />
            <ContactShadows position={[0, 0.02, 0]} opacity={0.24} scale={14} blur={2} far={5} />
          </Canvas>
          <div className={styles.gridLegend}><span><i className={styles.gridValid} />可放置</span><span><i className={styles.gridWarning} />動線提醒</span><small>每格 25 cm</small></div>
          <div className={styles.planRoomLabel} style={{ left: "16%", top: "16%" }}><strong>客餐廳</strong><small>13.2 坪</small></div>
          <div className={styles.planRoomLabel} style={{ right: "15%", top: "16%" }}><strong>主臥</strong><small>4.8 坪</small></div>
        </div>
        <aside className={styles.plannerInspector}>
          <button className={styles.closeInspector}><X /></button>
          <span className={styles.inspectorEmoji}>{selected.emoji}</span>
          <small>PLAY GROUND 自有品牌</small>
          <h2>{selected.name}</h2>
          <strong className={styles.inspectorPrice}>{selected.price}</strong>
          <div className={styles.inspectorRule} />
          <label>擺放角度 <b>45°</b></label>
          <button className={styles.rotateWide} onClick={onRotate}><RotateCw />旋轉物件</button>
          <div className={styles.measurement}><span>W 215</span><span>D 92</span><span>H 82 cm</span></div>
          <div className={styles.trafficAdvice}><Sparkles /><span><strong>動線良好</strong><small>主要通道保留 86 cm</small></span></div>
        </aside>
      </div>
    </section>
  );
}

function ExploreVariant({ furniture }: { furniture: FurnitureState[] }) {
  return (
    <section className={`${styles.variantShell} ${styles.exploreShell}`}>
      <div className={styles.exploreCanvas}>
        <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 3.2, 7], fov: 42 }}>
          <color attach="background" args={["#99cfc5"]} />
          <fog attach="fog" args={["#99cfc5", 11, 24]} />
          <ambientLight intensity={1.1} />
          <directionalLight castShadow position={[4, 9, 6]} intensity={2.8} color="#ffe9b4" shadow-mapSize={[1536, 1536]} />
          <ExploreRoom />
          <FurnitureCollection items={furniture} selectedId={null} soft />
          <ExplorationAvatar />
          <ContactShadows position={[0, 0.02, 0]} opacity={0.36} scale={16} blur={2.5} far={7} />
        </Canvas>
      </div>
      <header className={styles.exploreHud}>
        <BrandMark />
        <span className={styles.exploreLocation}><Home /><small>遠雄樂元 · 21 坪提案</small><strong>我的日光客廳</strong></span>
        <div><button><Camera /></button><button><Sun /></button><button><Box /></button></div>
      </header>
      <div className={styles.questCard}><span>☀️</span><div><small>今日小任務</small><strong>替客廳選一張最舒服的椅子</strong></div><b>0 / 1</b></div>
      <div className={styles.proximityCard}><span>🛋️</span><div><small>靠近家具</small><strong>雲朵雙人沙發</strong><b>$42,800</b></div><button>查看商品 <ArrowRight /></button></div>
      <div className={styles.exploreControls}><div className={styles.joystick}><i /><span>WASD</span></div><span><Gamepad2 />走近家具，發現你的生活</span><button><Sparkles />開心一下</button></div>
      <span className={styles.prototypeTagFloating}><Sparkles />角色探索試作 · 不儲存</span>
    </section>
  );
}

function BrandMark() {
  return <span className={styles.brandMark}><i><Home /></i><span><strong>居遊所</strong><small>PLAY GROUND</small></span></span>;
}

function CozyRoom() {
  return (
    <group>
      <RoundedBox args={[10.6, 0.28, 7.4]} radius={0.16} smoothness={4} position={[0, -0.14, 0]} receiveShadow><meshStandardMaterial color="#d7ae78" roughness={0.82} /></RoundedBox>
      <RoundedBox args={[10.6, 3.5, 0.24]} radius={0.14} smoothness={4} position={[0, 1.68, -3.55]} receiveShadow castShadow><meshStandardMaterial color="#fff1d8" roughness={0.9} /></RoundedBox>
      <RoundedBox args={[0.24, 3.5, 7.3]} radius={0.14} smoothness={4} position={[-5.18, 1.68, 0]} receiveShadow castShadow><meshStandardMaterial color="#f6e1c6" roughness={0.9} /></RoundedBox>
      <Window position={[3.55, 1.65, -3.38]} />
      <ArchDoor position={[-5.02, 1.35, 2.15]} />
      <RoundedBox args={[3.8, 0.06, 2.45]} radius={0.22} smoothness={6} position={[-0.3, 0.03, 0.35]} receiveShadow><meshStandardMaterial color="#e9bf70" roughness={0.95} /></RoundedBox>
      <Float speed={1.3} floatIntensity={0.08}><mesh position={[4.7, 3.9, -2.8]}><sphereGeometry args={[0.34, 20, 16]} /><meshStandardMaterial color="#f7ce66" emissive="#f7ce66" emissiveIntensity={0.7} /></mesh></Float>
    </group>
  );
}

function PlannerFloor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[11, 8]} /><meshStandardMaterial color="#f7f3e9" roughness={1} /></mesh>
      <gridHelper args={[11, 44, "#9bb5a9", "#d5ded8"]} position={[0, 0.012, 0]} />
      <RoundedBox args={[10.8, 0.18, 0.18]} radius={0.05} smoothness={3} position={[0, 0.1, -3.82]}><meshStandardMaterial color="#61776e" /></RoundedBox>
      <RoundedBox args={[0.18, 0.18, 7.7]} radius={0.05} smoothness={3} position={[-5.32, 0.1, 0]}><meshStandardMaterial color="#61776e" /></RoundedBox>
      <RoundedBox args={[0.18, 0.18, 4.8]} radius={0.05} smoothness={3} position={[2.4, 0.1, -1.45]}><meshStandardMaterial color="#61776e" /></RoundedBox>
      <RoundedBox args={[3, 0.18, 0.18]} radius={0.05} smoothness={3} position={[3.85, 0.1, 0.95]}><meshStandardMaterial color="#61776e" /></RoundedBox>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.2, 0.018, 0.2]}><ringGeometry args={[2.45, 2.58, 64, 1, 0.15, 1.2]} /><meshBasicMaterial color="#eaa06e" transparent opacity={0.55} /></mesh>
    </group>
  );
}

function ExploreRoom() {
  return (
    <group>
      <RoundedBox args={[11, 0.3, 8]} radius={0.16} smoothness={4} position={[0, -0.15, 0]} receiveShadow><meshStandardMaterial color="#cfa370" roughness={0.82} /></RoundedBox>
      <RoundedBox args={[11, 3.7, 0.24]} radius={0.14} smoothness={4} position={[0, 1.72, -3.85]} receiveShadow><meshStandardMaterial color="#fff1d9" /></RoundedBox>
      <Window position={[3.4, 1.7, -3.68]} />
      <RoundedBox args={[3.8, 0.06, 2.45]} radius={0.22} smoothness={6} position={[-0.3, 0.03, 0.35]} receiveShadow><meshStandardMaterial color="#e9bf70" /></RoundedBox>
    </group>
  );
}

function Window({ position }: { position: [number, number, number] }) {
  return <group position={position}><RoundedBox args={[2.55, 2.05, 0.12]} radius={0.06} smoothness={3}><meshStandardMaterial color="#587e75" /></RoundedBox><mesh position={[0, 0, 0.07]}><planeGeometry args={[2.25, 1.76]} /><meshStandardMaterial color="#9bd8dd" emissive="#8ccad3" emissiveIntensity={0.15} /></mesh><mesh position={[0, 0, 0.15]}><boxGeometry args={[0.1, 1.75, 0.06]} /><meshStandardMaterial color="#f8ead3" /></mesh><mesh position={[0, -0.42, 0.15]}><boxGeometry args={[2.2, 0.1, 0.06]} /><meshStandardMaterial color="#f8ead3" /></mesh></group>;
}

function ArchDoor({ position }: { position: [number, number, number] }) {
  return <group position={position} rotation={[0, Math.PI / 2, 0]}><RoundedBox args={[1.55, 2.7, 0.18]} radius={0.45} smoothness={6}><meshStandardMaterial color="#bd7652" /></RoundedBox><mesh position={[0.52, 0, 0.12]}><sphereGeometry args={[0.08, 16, 12]} /><meshStandardMaterial color="#f4d06d" metalness={0.4} roughness={0.3} /></mesh></group>;
}

function FurnitureCollection({ items, selectedId, onSelect, soft = false }: { items: FurnitureState[]; selectedId: FurnitureId | null; onSelect?: (id: FurnitureId) => void; soft?: boolean }) {
  return <>{items.map((item) => <group key={item.id} position={[item.x, 0, item.z]} rotation={[0, item.rotation, 0]} onPointerDown={(event: ThreeEvent<PointerEvent>) => { event.stopPropagation(); onSelect?.(item.id); }} scale={selectedId === item.id ? 1.05 : 1}><FurnitureModel id={item.id} soft={soft} />{selectedId === item.id && <SelectionHalo />}</group>)}</>;
}

function FurnitureModel({ id, soft }: { id: FurnitureId; soft: boolean }) {
  const coral = soft ? "#df8c6c" : "#c97f62";
  const cream = soft ? "#f6dbc1" : "#ead1ba";
  const green = soft ? "#7dab91" : "#6d9980";
  switch (id) {
    case "sofa": return <group><RoundedBox args={[2.2, 0.5, 0.9]} radius={0.18} smoothness={6} position={[0, 0.38, 0]} castShadow><meshStandardMaterial color={coral} roughness={0.82} /></RoundedBox><RoundedBox args={[1.92, 0.72, 0.25]} radius={0.14} smoothness={5} position={[0, 0.84, 0.34]} rotation={[-0.1, 0, 0]} castShadow><meshStandardMaterial color={coral} /></RoundedBox>{[-0.48, 0.48].map((x) => <RoundedBox key={x} args={[0.86, 0.17, 0.58]} radius={0.12} smoothness={5} position={[x, 0.69, -0.06]} castShadow><meshStandardMaterial color={cream} /></RoundedBox>)}{[-1.02, 1.02].map((x) => <RoundedBox key={x} args={[0.22, 0.62, 0.9]} radius={0.11} smoothness={4} position={[x, 0.56, 0]} castShadow><meshStandardMaterial color={coral} /></RoundedBox>)}</group>;
    case "table": return <group><mesh castShadow position={[0, 0.48, 0]} scale={[1.2, 0.18, 0.78]}><sphereGeometry args={[0.5, 32, 18]} /><meshStandardMaterial color="#b77850" roughness={0.5} /></mesh><mesh castShadow position={[0, 0.24, 0]}><cylinderGeometry args={[0.13, 0.22, 0.46, 20]} /><meshStandardMaterial color="#87583d" /></mesh></group>;
    case "chair": return <group><RoundedBox args={[0.82, 0.24, 0.78]} radius={0.12} smoothness={5} position={[0, 0.5, 0]} castShadow><meshStandardMaterial color={green} /></RoundedBox><RoundedBox args={[0.78, 0.72, 0.2]} radius={0.14} smoothness={5} position={[0, 0.91, 0.29]} rotation={[-0.1, 0, 0]} castShadow><meshStandardMaterial color={green} /></RoundedBox>{[-0.29, 0.29].flatMap((x) => [-0.25, 0.25].map((z) => <mesh key={`${x}-${z}`} position={[x, 0.24, z]} castShadow><cylinderGeometry args={[0.045, 0.06, 0.48, 10]} /><meshStandardMaterial color="#795b45" /></mesh>))}</group>;
    case "lamp": return <group><mesh castShadow position={[0, 0.08, 0]}><cylinderGeometry args={[0.27, 0.34, 0.16, 20]} /><meshStandardMaterial color="#53766d" /></mesh><mesh castShadow position={[0, 0.84, 0]}><cylinderGeometry args={[0.045, 0.055, 1.52, 12]} /><meshStandardMaterial color="#53766d" /></mesh><Float speed={1.2} floatIntensity={0.03}><mesh position={[0, 1.65, 0]} castShadow><sphereGeometry args={[0.36, 24, 18]} /><meshStandardMaterial color="#f9db7d" emissive="#f5c85f" emissiveIntensity={0.85} /></mesh></Float><pointLight position={[0, 1.55, 0]} color="#ffd98a" intensity={2.2} distance={3} /></group>;
    case "plant": return <group><RoundedBox args={[0.66, 0.55, 0.66]} radius={0.12} smoothness={5} position={[0, 0.27, 0]} castShadow><meshStandardMaterial color="#c9835d" /></RoundedBox><mesh position={[0, 0.98, 0]} castShadow><cylinderGeometry args={[0.06, 0.09, 1.35, 9]} /><meshStandardMaterial color="#755541" /></mesh>{[[0, 1.55, 0], [-0.25, 1.28, 0.08], [0.27, 1.2, -0.08], [0.11, 1.75, 0.04]].map((p, index) => <mesh key={index} position={p as [number, number, number]} scale={[0.46, 0.58, 0.42]} castShadow><icosahedronGeometry args={[0.5, 1]} /><meshStandardMaterial color={index % 2 ? "#6c9c73" : "#82b17e"} roughness={0.9} /></mesh>)}</group>;
    case "shelf": return <group><RoundedBox args={[1.55, 1.7, 0.46]} radius={0.12} smoothness={5} position={[0, 0.85, 0]} castShadow><meshStandardMaterial color="#ba8156" /></RoundedBox>{[0.45, 0.9, 1.33].map((y) => <RoundedBox key={y} args={[1.35, 0.08, 0.5]} radius={0.03} smoothness={3} position={[0, y, -0.05]}><meshStandardMaterial color="#f0cf9b" /></RoundedBox>)}<mesh position={[0, 1.98, 0]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[1.1, 1.1, 0.45]} /><meshStandardMaterial color="#ba8156" /></mesh></group>;
  }
}

function SelectionHalo() {
  return <group><mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.05, 1.14, 48]} /><meshBasicMaterial color="#ff8a62" transparent opacity={0.85} depthWrite={false} /></mesh><Float speed={2.5} floatIntensity={0.12}><mesh position={[0, 2.25, 0]}><octahedronGeometry args={[0.16]} /><meshStandardMaterial color="#ffd760" emissive="#ffb84e" emissiveIntensity={1.2} /></mesh></Float></group>;
}

function ToyAvatar({ position }: { position: [number, number, number] }) {
  return <group position={position} rotation={[0, -0.5, 0]}><mesh castShadow position={[0, 1.34, 0]}><sphereGeometry args={[0.34, 24, 18]} /><meshStandardMaterial color="#efc19d" /></mesh><mesh castShadow position={[0, 1.57, 0.02]} scale={[1.04, 0.55, 1.02]}><sphereGeometry args={[0.36, 20, 15]} /><meshStandardMaterial color="#544038" /></mesh><RoundedBox args={[0.65, 0.76, 0.48]} radius={0.22} smoothness={5} position={[0, 0.83, 0]} castShadow><meshStandardMaterial color="#77a894" /></RoundedBox>{[-0.17, 0.17].map((x) => <RoundedBox key={x} args={[0.18, 0.52, 0.2]} radius={0.08} smoothness={4} position={[x, 0.3, 0]} castShadow><meshStandardMaterial color="#485a65" /></RoundedBox>)}{[-0.12, 0.12].map((x) => <mesh key={x} position={[x, 1.34, 0.31]}><sphereGeometry args={[0.035, 12, 8]} /><meshBasicMaterial color="#2d3937" /></mesh>)}</group>;
}

function ExplorationAvatar() {
  const ref = useRef<THREE.Group>(null);
  const keys = useRef<Record<string, boolean>>({});
  const { camera } = useThree();
  const bob = useRef(0);
  useEffect(() => {
    const down = (event: KeyboardEvent) => { keys.current[event.key.toLowerCase()] = true; };
    const up = (event: KeyboardEvent) => { keys.current[event.key.toLowerCase()] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);
  useFrame((_, delta) => {
    if (!ref.current) return;
    const x = Number(Boolean(keys.current.d)) - Number(Boolean(keys.current.a));
    const z = Number(Boolean(keys.current.s)) - Number(Boolean(keys.current.w));
    const moving = x !== 0 || z !== 0;
    if (moving) {
      const length = Math.hypot(x, z);
      ref.current.position.x = THREE.MathUtils.clamp(ref.current.position.x + x / length * delta * 2.35, -4.4, 4.4);
      ref.current.position.z = THREE.MathUtils.clamp(ref.current.position.z + z / length * delta * 2.35, -3, 2.9);
      ref.current.rotation.y = Math.atan2(x, z);
      bob.current += delta * 11;
      ref.current.position.y = Math.abs(Math.sin(bob.current)) * 0.055;
    } else ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, 0, 0.18);
    const targetPosition = new THREE.Vector3(ref.current.position.x, 3.1, ref.current.position.z + 6.1);
    camera.position.lerp(targetPosition, 1 - Math.pow(0.004, delta));
    camera.lookAt(ref.current.position.x, 0.82, ref.current.position.z - 0.9);
  });
  return <group ref={ref} position={[2.7, 0, 2.2]}><ToyAvatar position={[0, 0, 0]} /></group>;
}
