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
  Redo2,
  RotateCw,
  ShoppingBag,
  Sparkles,
  Sun,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import styles from "./gamefeel-prototype.module.css";

type Variant = "A" | "B" | "C" | "D";
type FurnitureId = "sofa" | "table" | "chair" | "lamp" | "plant" | "shelf";
type FurnitureState = { id: FurnitureId; x: number; z: number; rotation: number };

const variantMeta: Record<Variant, { name: string; subtitle: string }> = {
  A: { name: "Cozy Dollhouse", subtitle: "溫暖模型屋" },
  B: { name: "Smart Planner", subtitle: "精準俯視配置" },
  C: { name: "Living Story", subtitle: "角色探索生活" },
  D: { name: "Cozy Critter Home", subtitle: "原創 Q 版生活遊戲精修" },
};

const initialFurniture: FurnitureState[] = [
  { id: "sofa", x: -1.7, z: 1.25, rotation: Math.PI },
  { id: "table", x: -0.2, z: 0.1, rotation: 0 },
  { id: "chair", x: 1.5, z: 0.25, rotation: -0.5 },
  { id: "lamp", x: -3.7, z: 1.95, rotation: 0 },
  { id: "plant", x: 3.75, z: -2.3, rotation: 0 },
  { id: "shelf", x: -3.8, z: -2.4, rotation: 0 },
];

const furnitureLabel: Record<FurnitureId, { name: string; price: string; amount: number; dimensions: string; emoji: string }> = {
  sofa: { name: "雲朵雙人沙發", price: "$42,800", amount: 42800, dimensions: "W 215 × D 92 × H 82 cm", emoji: "🛋️" },
  table: { name: "小石橢圓桌", price: "$12,800", amount: 12800, dimensions: "W 120 × D 68 × H 42 cm", emoji: "🪵" },
  chair: { name: "微風扶手椅", price: "$16,800", amount: 16800, dimensions: "W 78 × D 82 × H 80 cm", emoji: "🪑" },
  lamp: { name: "小月球立燈", price: "$7,600", amount: 7600, dimensions: "W 38 × D 38 × H 168 cm", emoji: "💡" },
  plant: { name: "橄欖樹植栽", price: "$3,200", amount: 3200, dimensions: "W 52 × D 52 × H 165 cm", emoji: "🌿" },
  shelf: { name: "小屋模組收納櫃", price: "$21,800", amount: 21800, dimensions: "W 155 × D 46 × H 198 cm", emoji: "🏠" },
};

export function GamefeelPrototype({ initialVariant }: { initialVariant: Variant }) {
  const router = useRouter();
  const [variant, setVariant] = useState<Variant>(initialVariant);
  const [selectedId, setSelectedId] = useState<FurnitureId>("sofa");
  const [furniture, setFurniture] = useState(initialFurniture);
  const variants: Variant[] = ["A", "B", "C", "D"];

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
      {variant === "D" && <CuteCritterVariant />}
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

type PlayMode = "decorate" | "walk";

function CuteCritterVariant() {
  const [mode, setMode] = useState<PlayMode>("decorate");
  const [selectedId, setSelectedId] = useState<FurnitureId>("sofa");
  const [furniture, setFurniture] = useState<FurnitureState[]>(initialFurniture);
  const [undoStack, setUndoStack] = useState<FurnitureState[][]>([]);
  const [redoStack, setRedoStack] = useState<FurnitureState[][]>([]);
  const [dragging, setDragging] = useState(false);
  const latestFurniture = useRef(furniture);
  const dragOrigin = useRef<FurnitureState[] | null>(null);
  const touchMove = useRef({ x: 0, z: 0 });

  const cloneFurniture = (items: FurnitureState[]) => items.map((item) => ({ ...item }));
  const updateFurniture = (next: FurnitureState[]) => {
    latestFurniture.current = next;
    setFurniture(next);
  };
  const commit = (next: FurnitureState[]) => {
    setUndoStack((stack) => [...stack.slice(-19), cloneFurniture(latestFurniture.current)]);
    setRedoStack([]);
    updateFurniture(next);
  };
  const moveFurniture = (id: FurnitureId, x: number, z: number) => {
    updateFurniture(latestFurniture.current.map((item) => item.id === id ? { ...item, x, z } : item));
  };
  const beginDrag = () => {
    dragOrigin.current = cloneFurniture(latestFurniture.current);
    setDragging(true);
  };
  const endDrag = () => {
    const origin = dragOrigin.current;
    if (origin && JSON.stringify(origin) !== JSON.stringify(latestFurniture.current)) {
      setUndoStack((stack) => [...stack.slice(-19), origin]);
      setRedoStack([]);
    }
    dragOrigin.current = null;
    setDragging(false);
  };
  const rotateSelected = () => commit(latestFurniture.current.map((item) => item.id === selectedId ? { ...item, rotation: item.rotation + Math.PI / 4 } : item));
  const removeSelected = () => commit(latestFurniture.current.filter((item) => item.id !== selectedId));
  const selectOrAdd = (id: FurnitureId) => {
    setSelectedId(id);
    if (!latestFurniture.current.some((item) => item.id === id)) commit([...latestFurniture.current, { id, x: 0, z: 0, rotation: 0 }]);
  };
  const undo = () => {
    const previous = undoStack.at(-1);
    if (!previous) return;
    setRedoStack((stack) => [...stack, cloneFurniture(latestFurniture.current)]);
    setUndoStack((stack) => stack.slice(0, -1));
    updateFurniture(cloneFurniture(previous));
  };
  const redo = () => {
    const next = redoStack.at(-1);
    if (!next) return;
    setUndoStack((stack) => [...stack, cloneFurniture(latestFurniture.current)]);
    setRedoStack((stack) => stack.slice(0, -1));
    updateFurniture(cloneFurniture(next));
  };
  const setTouchDirection = (x: number, z: number) => { touchMove.current = { x, z }; };
  const stopTouch = () => { touchMove.current = { x: 0, z: 0 }; };
  const selected = furnitureLabel[selectedId];
  const total = furniture.reduce((sum, item) => sum + furnitureLabel[item.id].amount, 0);

  return (
    <section className={`${styles.variantShell} ${styles.cuteShell}`}>
      <div className={styles.cuteCanvas}>
        <Canvas shadows dpr={[1, 1.5]} camera={{ position: [8.8, 7.5, 10.2], fov: 35 }}>
          <color attach="background" args={["#9ed9cd"]} />
          <fog attach="fog" args={["#9ed9cd", 17, 31]} />
          <ambientLight intensity={1.45} />
          <hemisphereLight args={["#e9fbff", "#8a6a48", 1.15]} />
          <directionalLight castShadow position={[5, 12, 7]} intensity={2.8} color="#fff1bf" shadow-mapSize={[1536, 1536]} shadow-bias={-0.0003} />
          <CuteCottageRoom />
          {mode === "decorate" ? (
            <>
              <CuteFurnitureCollection
                items={furniture}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onMove={moveFurniture}
                onDragStart={beginDrag}
                onDragEnd={endDrag}
              />
              <CapybaraIdle />
              <DecorateCameraRig />
              <OrbitControls makeDefault enabled={!dragging} enablePan={false} minDistance={8} maxDistance={15} minPolarAngle={0.63} maxPolarAngle={1.05} target={[0, 0.72, -0.15]} />
            </>
          ) : (
            <>
              <FurnitureCollection items={furniture} selectedId={null} soft />
              <CritterWalker touchMove={touchMove} />
            </>
          )}
          <RoomSparkles />
          <ContactShadows position={[0, 0.025, 0]} opacity={0.34} scale={17} blur={2.8} far={8} />
        </Canvas>
      </div>

      <header className={styles.cuteTopbar}>
        <BrandMark />
        <span className={styles.cuteLocation}><small>遠雄樂元 × 居遊所</small><strong>午後森林宅 · 21 坪</strong></span>
        <div className={styles.cuteModeSwitch} aria-label="體驗模式">
          <button className={mode === "decorate" ? styles.cuteModeActive : ""} onClick={() => setMode("decorate")}><Grid3X3 />佈置</button>
          <button className={mode === "walk" ? styles.cuteModeActive : ""} onClick={() => { setMode("walk"); setDragging(false); }}><Gamepad2 />散步</button>
        </div>
        <span className={styles.cutePrice}><small>房間家具</small><strong>${total.toLocaleString("zh-TW")}</strong></span>
        <div className={styles.cuteTopActions}><button aria-label="拍照"><Camera /></button><button aria-label="切換日光"><Sun /></button></div>
      </header>

      <div className={styles.cuteQuest}><i><Sparkles /></i><span><small>小屋心情</small><strong>暖暖入住中</strong></span><b>96</b></div>

      {mode === "decorate" ? (
        <>
          <aside className={styles.cuteInspector}>
            <span className={styles.cuteSpeechTail} />
            <div className={styles.cuteProductHero}><FurnitureToken id={selectedId} /><span>自有品牌</span></div>
            <small>目前選取</small>
            <h2>{selected.name}</h2>
            <strong>{selected.price}</strong>
            <p>{selected.dimensions}</p>
            <div className={styles.cuteInspectorActions}>
              <button onClick={rotateSelected}><RotateCw />轉 45°</button>
              <button onClick={removeSelected} disabled={!furniture.some((item) => item.id === selectedId)}><Trash2 />收起</button>
            </div>
            <button className={styles.cuteShopButton}><ShoppingBag />放入購物車</button>
          </aside>
          <div className={styles.cuteHistory}>
            <button onClick={undo} disabled={!undoStack.length} aria-label="復原"><Undo2 /></button>
            <button onClick={redo} disabled={!redoStack.length} aria-label="重做"><Redo2 /></button>
          </div>
          <div className={styles.cuteSnapHint}><MousePointer2 /><span><strong>拖曳家具到喜歡的位置</strong><small>自動吸附 25 cm · 物理碰撞驗證中</small></span><Check /></div>
        </>
      ) : (
        <>
          <div className={styles.cuteTalkBubble}><span>嗨！我是住在這裡的<strong>栗栗</strong></span><small>靠近家具就能看看價格喔！</small></div>
          <div className={styles.cuteWalkHint}><Gamepad2 /><span><strong>在新家散散步</strong><small>鍵盤 WASD 或使用方向鍵盤</small></span></div>
          <div className={styles.cuteDpad} aria-label="移動方向鍵">
            <button className={styles.dpadUp} onPointerDown={() => setTouchDirection(0, -1)} onPointerUp={stopTouch} onPointerLeave={stopTouch}>↑</button>
            <button className={styles.dpadLeft} onPointerDown={() => setTouchDirection(-1, 0)} onPointerUp={stopTouch} onPointerLeave={stopTouch}>←</button>
            <button className={styles.dpadRight} onPointerDown={() => setTouchDirection(1, 0)} onPointerUp={stopTouch} onPointerLeave={stopTouch}>→</button>
            <button className={styles.dpadDown} onPointerDown={() => setTouchDirection(0, 1)} onPointerUp={stopTouch} onPointerLeave={stopTouch}>↓</button>
          </div>
        </>
      )}

      <nav className={styles.cuteBag} aria-label="家具袋">
        <span className={styles.cuteBagTitle}><ShoppingBag /><i><strong>家具袋</strong><small>{furniture.length} / 20</small></i></span>
        <div>{(Object.keys(furnitureLabel) as FurnitureId[]).map((id) => {
          const placed = furniture.some((item) => item.id === id);
          return <button key={id} className={selectedId === id ? styles.cuteBagActive : ""} onClick={() => selectOrAdd(id)}><FurnitureToken id={id} /><small>{furnitureLabel[id].name}</small>{!placed && <b>＋</b>}</button>;
        })}</div>
      </nav>
      <span className={styles.cuteOriginalTag}><Sparkles />原創 Q 版生活模擬 · 操作原型</span>
    </section>
  );
}

function FurnitureToken({ id }: { id: FurnitureId }) {
  const tokenClass: Record<FurnitureId, string> = {
    sofa: styles.tokenSofa,
    table: styles.tokenTable,
    chair: styles.tokenChair,
    lamp: styles.tokenLamp,
    plant: styles.tokenPlant,
    shelf: styles.tokenShelf,
  };
  return <span className={`${styles.furnitureToken} ${tokenClass[id]}`} aria-hidden="true"><i /></span>;
}

function CuteFurnitureCollection({ items, selectedId, onSelect, onMove, onDragStart, onDragEnd }: {
  items: FurnitureState[];
  selectedId: FurnitureId;
  onSelect: (id: FurnitureId) => void;
  onMove: (id: FurnitureId, x: number, z: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  return <>{items.map((item) => <CuteDraggableFurniture key={item.id} item={item} selected={item.id === selectedId} onSelect={onSelect} onMove={onMove} onDragStart={onDragStart} onDragEnd={onDragEnd} />)}</>;
}

function CuteDraggableFurniture({ item, selected, onSelect, onMove, onDragStart, onDragEnd }: {
  item: FurnitureState;
  selected: boolean;
  onSelect: (id: FurnitureId) => void;
  onMove: (id: FurnitureId, x: number, z: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const dragging = useRef(false);
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const hit = useRef(new THREE.Vector3());
  const offset = useRef(new THREE.Vector2());
  const getGroundPoint = (event: ThreeEvent<PointerEvent>) => event.ray.intersectPlane(dragPlane.current, hit.current);
  const onPointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const point = getGroundPoint(event);
    if (!point) return;
    onSelect(item.id);
    dragging.current = true;
    offset.current.set(point.x - item.x, point.z - item.z);
    const target = event.nativeEvent.target;
    if (target instanceof Element) target.setPointerCapture(event.pointerId);
    onDragStart();
  };
  const onPointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return;
    event.stopPropagation();
    const point = getGroundPoint(event);
    if (!point) return;
    const snap = (value: number) => Math.round(value * 4) / 4;
    onMove(item.id, snap(THREE.MathUtils.clamp(point.x - offset.current.x, -4.35, 4.35)), snap(THREE.MathUtils.clamp(point.z - offset.current.y, -2.9, 2.75)));
  };
  const stopDragging = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return;
    event.stopPropagation();
    dragging.current = false;
    const target = event.nativeEvent.target;
    if (target instanceof Element && target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
    onDragEnd();
  };
  useFrame((state, delta) => {
    if (!ref.current) return;
    const targetScale = selected ? 1.065 : 1;
    const scale = THREE.MathUtils.damp(ref.current.scale.x, targetScale, 10, delta);
    ref.current.scale.setScalar(scale);
    ref.current.position.y = selected ? 0.018 + Math.sin(state.clock.elapsedTime * 4) * 0.012 : THREE.MathUtils.damp(ref.current.position.y, 0, 12, delta);
  });
  return (
    <group ref={ref} position={[item.x, 0, item.z]} rotation={[0, item.rotation, 0]} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={stopDragging} onPointerCancel={stopDragging}>
      <FurnitureModel id={item.id} soft />
      {selected && <SelectionHalo />}
    </group>
  );
}

function CuteCottageRoom() {
  return (
    <group>
      <RoundedBox args={[13.4, 0.25, 10.3]} radius={0.1} smoothness={5} position={[0, -0.34, 0]} receiveShadow><meshStandardMaterial color="#78b88b" roughness={0.95} /></RoundedBox>
      <RoundedBox args={[10.8, 0.35, 7.45]} radius={0.14} smoothness={5} position={[0, -0.12, -0.05]} receiveShadow><meshStandardMaterial color="#e3b777" roughness={0.82} /></RoundedBox>
      {[-4.2, -2.8, -1.4, 0, 1.4, 2.8, 4.2].map((x) => <mesh key={x} position={[x, 0.075, -0.05]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[0.025, 7]} /><meshBasicMaterial color="#b98355" transparent opacity={0.42} /></mesh>)}
      <RoundedBox args={[10.8, 3.65, 0.3]} radius={0.18} smoothness={5} position={[0, 1.69, -3.62]} receiveShadow castShadow><meshStandardMaterial color="#fff0cf" roughness={0.92} /></RoundedBox>
      <RoundedBox args={[0.3, 3.65, 7.35]} radius={0.18} smoothness={5} position={[-5.26, 1.69, -0.02]} receiveShadow castShadow><meshStandardMaterial color="#f7d9b7" roughness={0.92} /></RoundedBox>
      <RoundedBox args={[10.5, 0.18, 0.2]} radius={0.08} smoothness={4} position={[0, 0.36, -3.42]}><meshStandardMaterial color="#dda078" /></RoundedBox>
      <CuteWindow />
      <CuteWallArt />
      <RoundedBox args={[4.05, 0.06, 2.5]} radius={0.3} smoothness={7} position={[-0.3, 0.03, 0.3]} receiveShadow><meshStandardMaterial color="#f3d884" roughness={1} /></RoundedBox>
      {[[-5.7, -3.7], [-4.9, 3.4], [5.3, -3.7], [5.8, 3.25]].map(([x, z], index) => <group key={index} position={[x, -0.12, z]}><mesh receiveShadow><cylinderGeometry args={[0.28, 0.34, 0.14, 12]} /><meshStandardMaterial color="#e9d4ac" /></mesh><mesh position={[0, 0.22, 0]}><icosahedronGeometry args={[0.34, 1]} /><meshStandardMaterial color={index % 2 ? "#f6b070" : "#fff0a8"} /></mesh></group>)}
      <Float speed={0.8} floatIntensity={0.18}><group position={[5.5, 4.2, -5.2]}><mesh scale={[1.4, 0.65, 0.75]}><sphereGeometry args={[0.62, 20, 15]} /><meshStandardMaterial color="#f8ffff" transparent opacity={0.86} /></mesh><mesh position={[0.75, 0.05, 0]} scale={[0.8, 0.52, 0.62]}><sphereGeometry args={[0.62, 20, 15]} /><meshStandardMaterial color="#f8ffff" transparent opacity={0.86} /></mesh></group></Float>
    </group>
  );
}

function CuteWindow() {
  return <group position={[3.35, 1.78, -3.43]}><RoundedBox args={[2.85, 2.15, 0.16]} radius={0.12} smoothness={5}><meshStandardMaterial color="#5d8c80" /></RoundedBox><mesh position={[0, 0, 0.1]}><planeGeometry args={[2.52, 1.82]} /><meshStandardMaterial color="#96dbe4" emissive="#83d0dc" emissiveIntensity={0.18} /></mesh><mesh position={[0, 0, 0.2]}><boxGeometry args={[0.09, 1.82, 0.06]} /><meshStandardMaterial color="#fff4d9" /></mesh><mesh position={[0, -0.42, 0.2]}><boxGeometry args={[2.48, 0.09, 0.06]} /><meshStandardMaterial color="#fff4d9" /></mesh>{[-1.25, 1.25].map((x) => <RoundedBox key={x} args={[0.65, 2.35, 0.16]} radius={0.23} smoothness={6} position={[x, 0, 0.28]} rotation={[0, 0, x < 0 ? -0.08 : 0.08]}><meshStandardMaterial color="#ee927d" roughness={0.9} /></RoundedBox>)}<RoundedBox args={[3.2, 0.32, 0.22]} radius={0.13} smoothness={5} position={[0, 1.18, 0.22]}><meshStandardMaterial color="#f2bd72" /></RoundedBox></group>;
}

function CuteWallArt() {
  return <group position={[-1.7, 2.05, -3.42]}><RoundedBox args={[1.65, 1.25, 0.14]} radius={0.12} smoothness={5}><meshStandardMaterial color="#a8664d" /></RoundedBox><RoundedBox args={[1.38, 0.98, 0.08]} radius={0.09} smoothness={5} position={[0, 0, 0.09]}><meshStandardMaterial color="#fff5d9" /></RoundedBox><mesh position={[0.2, -0.12, 0.16]}><circleGeometry args={[0.35, 24]} /><meshStandardMaterial color="#efad68" /></mesh><mesh position={[-0.3, 0.16, 0.17]} rotation={[0, 0, -0.42]} scale={[0.4, 0.65, 1]}><circleGeometry args={[0.34, 20]} /><meshStandardMaterial color="#75a983" /></mesh></group>;
}

function RoomSparkles() {
  return <group>{[[-4.2, 2.3, 1.9], [4.45, 2.7, 0.3], [1.8, 2.45, -2.3]].map((position, index) => <Float key={index} speed={1.4 + index * 0.2} floatIntensity={0.2}><mesh position={position as [number, number, number]} scale={0.7 + index * 0.12}><octahedronGeometry args={[0.09]} /><meshStandardMaterial color="#fff3a2" emissive="#ffd968" emissiveIntensity={1.3} /></mesh></Float>)}</group>;
}

function CapybaraModel() {
  const eyes = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!eyes.current) return;
    const blink = Math.sin(state.clock.elapsedTime * 0.82) > 0.985 ? 0.12 : 1;
    eyes.current.scale.y = THREE.MathUtils.lerp(eyes.current.scale.y, blink, 0.45);
  });
  return (
    <group scale={0.92}>
      <mesh castShadow position={[0, 0.72, 0]} scale={[0.72, 0.88, 0.62]}><sphereGeometry args={[0.58, 28, 20]} /><meshStandardMaterial color="#a96f49" roughness={0.88} /></mesh>
      <RoundedBox args={[0.9, 0.78, 0.58]} radius={0.28} smoothness={7} position={[0, 0.65, 0.02]} castShadow><meshStandardMaterial color="#6fae91" roughness={0.86} /></RoundedBox>
      <mesh castShadow position={[0, 1.45, 0.04]} scale={[0.86, 0.78, 0.8]}><sphereGeometry args={[0.62, 32, 22]} /><meshStandardMaterial color="#bd8257" roughness={0.9} /></mesh>
      {[-0.42, 0.42].map((x) => <mesh key={x} castShadow position={[x, 1.82, 0]} scale={[0.72, 0.75, 0.68]}><sphereGeometry args={[0.2, 20, 15]} /><meshStandardMaterial color="#9a623f" /></mesh>)}
      <mesh castShadow position={[0, 1.3, 0.54]} scale={[1.05, 0.67, 0.72]}><sphereGeometry args={[0.38, 28, 19]} /><meshStandardMaterial color="#d5a273" roughness={0.92} /></mesh>
      <mesh position={[0, 1.42, 0.82]} scale={[1.2, 0.72, 0.5]}><sphereGeometry args={[0.12, 18, 12]} /><meshStandardMaterial color="#4e3b34" roughness={0.72} /></mesh>
      <group ref={eyes}>{[-0.24, 0.24].map((x) => <group key={x}><mesh position={[x, 1.57, 0.55]}><sphereGeometry args={[0.075, 16, 12]} /><meshBasicMaterial color="#413832" /></mesh><mesh position={[x - 0.018, 1.6, 0.615]}><sphereGeometry args={[0.018, 10, 8]} /><meshBasicMaterial color="#fff" /></mesh></group>)}</group>
      {[-0.38, 0.38].map((x) => <mesh key={x} position={[x, 1.35, 0.55]} scale={[1.3, 0.55, 0.35]}><sphereGeometry args={[0.12, 18, 12]} /><meshBasicMaterial color="#e98f82" transparent opacity={0.7} /></mesh>)}
      <mesh position={[0, 1.22, 0.82]}><boxGeometry args={[0.11, 0.12, 0.035]} /><meshStandardMaterial color="#fff6dc" /></mesh>
      {[-0.42, 0.42].map((x) => <mesh key={x} castShadow position={[x, 0.7, 0.16]} rotation={[0, 0, x < 0 ? -0.22 : 0.22]}><capsuleGeometry args={[0.1, 0.38, 6, 12]} /><meshStandardMaterial color="#bd8257" /></mesh>)}
      {[-0.23, 0.23].map((x) => <group key={x}><RoundedBox args={[0.22, 0.43, 0.27]} radius={0.09} smoothness={4} position={[x, 0.22, 0]} castShadow><meshStandardMaterial color="#7a9bc0" /></RoundedBox><mesh position={[x, 0.055, 0.11]} scale={[1.2, 0.55, 1.45]}><sphereGeometry args={[0.15, 16, 10]} /><meshStandardMaterial color="#704d3a" /></mesh></group>)}
      <RoundedBox args={[0.54, 0.36, 0.08]} radius={0.08} smoothness={4} position={[0, 0.72, 0.34]}><meshStandardMaterial color="#f4c870" /></RoundedBox>
    </group>
  );
}

function CapybaraIdle() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.position.y = 0.04 + Math.sin(state.clock.elapsedTime * 2.1) * 0.025;
    ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, 0.64 + Math.sin(state.clock.elapsedTime * 0.65) * 0.08, 4, delta);
  });
  return <group ref={ref} position={[3.15, 0, -0.45]}><CapybaraModel /></group>;
}

function DecorateCameraRig() {
  const { camera, size } = useThree();
  useEffect(() => {
    const distance = size.width / size.height < 1 ? 1.35 : 1;
    camera.position.set(8.8 * distance, 7.5 * distance, 10.2 * distance);
    camera.lookAt(0, 0.72, -0.15);
    camera.updateProjectionMatrix();
  }, [camera, size.height, size.width]);
  return null;
}

function CritterWalker({ touchMove }: { touchMove: { current: { x: number; z: number } } }) {
  const ref = useRef<THREE.Group>(null);
  const keys = useRef<Record<string, boolean>>({});
  const { camera } = useThree();
  const step = useRef(0);
  useEffect(() => {
    const down = (event: KeyboardEvent) => { keys.current[event.key.toLowerCase()] = true; };
    const up = (event: KeyboardEvent) => { keys.current[event.key.toLowerCase()] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);
  useFrame((_, delta) => {
    if (!ref.current) return;
    const x = THREE.MathUtils.clamp(Number(Boolean(keys.current.d)) - Number(Boolean(keys.current.a)) + touchMove.current.x, -1, 1);
    const z = THREE.MathUtils.clamp(Number(Boolean(keys.current.s)) - Number(Boolean(keys.current.w)) + touchMove.current.z, -1, 1);
    const moving = x !== 0 || z !== 0;
    if (moving) {
      const length = Math.hypot(x, z);
      ref.current.position.x = THREE.MathUtils.clamp(ref.current.position.x + x / length * delta * 2.05, -4.3, 4.3);
      ref.current.position.z = THREE.MathUtils.clamp(ref.current.position.z + z / length * delta * 2.05, -2.85, 2.65);
      ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, Math.atan2(x, z), 14, delta);
      step.current += delta * 9;
      ref.current.position.y = Math.abs(Math.sin(step.current)) * 0.055;
    } else ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, 0, 9, delta);
    const target = new THREE.Vector3(ref.current.position.x, 2.75, ref.current.position.z + 5.7);
    camera.position.lerp(target, 1 - Math.pow(0.005, delta));
    camera.lookAt(ref.current.position.x, 0.9, ref.current.position.z - 0.8);
  });
  return <group ref={ref} position={[2.8, 0, 2]}><CapybaraModel /></group>;
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
    case "shelf": return <group><RoundedBox args={[1.55, 1.7, 0.46]} radius={0.12} smoothness={5} position={[0, 0.85, 0]} castShadow><meshStandardMaterial color="#ba8156" /></RoundedBox>{[0.45, 0.9, 1.33].map((y) => <RoundedBox key={y} args={[1.35, 0.08, 0.5]} radius={0.03} smoothness={3} position={[0, y, -0.05]}><meshStandardMaterial color="#f0cf9b" /></RoundedBox>)}<RoundedBox args={[1.12, 0.18, 0.54]} radius={0.07} smoothness={4} position={[-0.4, 1.96, 0]} rotation={[0, 0, 0.55]} castShadow><meshStandardMaterial color="#a96f4d" /></RoundedBox><RoundedBox args={[1.12, 0.18, 0.54]} radius={0.07} smoothness={4} position={[0.4, 1.96, 0]} rotation={[0, 0, -0.55]} castShadow><meshStandardMaterial color="#a96f4d" /></RoundedBox></group>;
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
