"use client";

import dynamic from "next/dynamic";
import {
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  Box,
  Building2,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  Gamepad2,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  Link2,
  ListFilter,
  LockKeyhole,
  LogOut,
  Maximize2,
  Menu,
  MousePointer2,
  PackageCheck,
  Palette,
  PawPrint,
  Plus,
  QrCode,
  Redo2,
  RotateCw,
  Save,
  Search,
  Share2,
  ShoppingBag,
  Sparkles,
  Store,
  Trash2,
  Undo2,
  Users,
  WalletCards,
  WandSparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { catalog, floorplans, initialFurnitureIds, themes } from "./lib/catalog";
import type {
  BookingDraft,
  EditorMode,
  FurnitureItem,
  RenderLedgerEntry,
  SceneObjectV1,
} from "./lib/domain";
import { formatCurrency } from "./lib/domain";

const ExperienceCanvas = dynamic(
  () => import("./components/experience-canvas").then((module) => module.ExperienceCanvas),
  { ssr: false, loading: () => <SceneLoading /> },
);

type Stage = "landing" | "login" | "avatar" | "setup" | "editor" | "gallery" | "admin";
type Modal = null | "booking" | "render" | "cart" | "share" | "menu";
type AdminView = "builder" | "platform";

const initialPositions: Record<string, [number, number]> = {
  "rug-meadow": [0.1, 0.1],
  "sofa-cloud": [-0.2, 1.25],
  "table-pebble": [0.15, -0.05],
  "chair-breeze": [2.05, 0.4],
  "lamp-moon": [-2.15, 1.65],
  "plant-olive": [3.95, -2.45],
  "shelf-cabin": [-3.8, -2.9],
};

const categoryLabels = {
  all: "全部",
  living: "客廳",
  dining: "餐廳",
  bedroom: "臥室",
  decor: "飾品",
} as const;

export function HomePlayApp() {
  const [stage, setStage] = useState<Stage>("landing");
  const [modal, setModal] = useState<Modal>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(1);
  const [selectedFloorplan, setSelectedFloorplan] = useState(floorplans[0].id);
  const [selectedTheme, setSelectedTheme] = useState(themes[0].id);
  const [mode, setMode] = useState<EditorMode>("decorate");
  const [items, setItems] = useState<SceneObjectV1[]>(() => buildInitialScene("sunny"));
  const [selectedItemId, setSelectedItemId] = useState<string | null>("scene-sofa-cloud");
  const [category, setCategory] = useState<keyof typeof categoryLabels>("all");
  const [search, setSearch] = useState("");
  const [budget, setBudget] = useState(180000);
  const [budgetEnabled, setBudgetEnabled] = useState(true);
  const [undoStack, setUndoStack] = useState<SceneObjectV1[][]>([]);
  const [redoStack, setRedoStack] = useState<SceneObjectV1[][]>([]);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [toast, setToast] = useState("");
  const [renderCredits, setRenderCredits] = useState(0);
  const [, setRenderLedger] = useState<RenderLedgerEntry[]>([]);
  const [renderJobs, setRenderJobs] = useState<{ id: string; status: "processing" | "complete"; createdAt: string }[]>([]);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [adminView, setAdminView] = useState<AdminView>("builder");
  const [cartOpenIds, setCartOpenIds] = useState<string[]>([]);
  const dragStart = useRef<SceneObjectV1[] | null>(null);

  const selectedProduct = useMemo(() => {
    const sceneItem = items.find((item) => item.id === selectedItemId);
    return sceneItem ? catalog.find((product) => product.sku === sceneItem.sku) ?? null : null;
  }, [items, selectedItemId]);

  const sceneProducts = useMemo(
    () => items.map((sceneItem) => catalog.find((product) => product.sku === sceneItem.sku)).filter(Boolean) as FurnitureItem[],
    [items],
  );

  const total = sceneProducts.reduce((sum, product) => sum + product.price, 0);
  const ownedTotal = sceneProducts.filter((product) => product.brandKind === "owned").reduce((sum, product) => sum + product.price, 0);

  const filteredCatalog = useMemo(
    () => catalog.filter((product) => {
      const matchesCategory = category === "all" || product.category === category;
      const matchesSearch = product.name.includes(search) || product.brand.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    }),
    [category, search],
  );

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (stage !== "editor") return;
    const stateTimer = window.setTimeout(() => setSaveState("saving"), 0);
    const timer = window.setTimeout(() => {
      setSaveState("saved");
      void fetch("/api/designs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ floorplanId: selectedFloorplan, themeId: selectedTheme, objects: items }),
      }).catch(() => undefined);
    }, 900);
    return () => {
      window.clearTimeout(stateTimer);
      window.clearTimeout(timer);
    };
  }, [items, selectedFloorplan, selectedTheme, stage]);

  const showToast = useCallback((message: string) => setToast(message), []);

  const enterExperience = () => {
    setItems(buildInitialScene(selectedTheme));
    setUndoStack([]);
    setRedoStack([]);
    setSelectedItemId(selectedTheme === "empty" ? null : "scene-sofa-cloud");
    setStage("editor");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const commit = (next: SceneObjectV1[]) => {
    setUndoStack((stack) => [...stack.slice(-39), cloneItems(items)]);
    setRedoStack([]);
    setItems(next);
  };

  const handleMove = (id: string, x: number, z: number) => {
    if (!dragStart.current) dragStart.current = cloneItems(items);
    const current = items.find((item) => item.id === id);
    if (!current) return;
    const product = catalog.find((entry) => entry.sku === current.sku);
    if (!product) return;
    const clampedX = clamp(x, -4.75 + product.size.width / 2, 4.75 - product.size.width / 2);
    const clampedZ = clamp(z, -3.1 + product.size.depth / 2, 3.1 - product.size.depth / 2);
    if (collides(id, clampedX, clampedZ, product, items)) {
      showToast("這裡會與其他家具重疊");
      return;
    }
    setItems((currentItems) => currentItems.map((item) => item.id === id ? { ...item, position: { ...item.position, x: clampedX, z: clampedZ } } : item));
  };

  const handleDragEnd = () => {
    if (dragStart.current) {
      setUndoStack((stack) => [...stack.slice(-39), dragStart.current!]);
      setRedoStack([]);
      dragStart.current = null;
    }
    const selected = items.find((item) => item.id === selectedItemId);
    if (selected && selected.position.x > 3.2 && selected.position.z > 1.45) {
      showToast("這個位置可能影響主要動線，但你仍可保留");
    }
  };

  const rotateSelected = () => {
    if (!selectedItemId) return;
    commit(items.map((item) => item.id === selectedItemId ? { ...item, rotation: quaternionFromY(quaternionToY(item.rotation) + Math.PI / 4) } : item));
  };

  const cycleMaterial = () => {
    if (!selectedItemId) return;
    commit(items.map((item) => item.id === selectedItemId ? { ...item, materialVariant: item.materialVariant + 1 } : item));
  };

  const removeSelected = () => {
    if (!selectedItemId) return;
    commit(items.filter((item) => item.id !== selectedItemId));
    setSelectedItemId(null);
    showToast("已從房間移除");
  };

  const addFurniture = (product: FurnitureItem) => {
    if (product.stock === "out_of_stock") return;
    const spot = findOpenSpot(product, items);
    if (!spot) {
      showToast("房間沒有足夠空間，請先移動其他家具");
      return;
    }
    const item: SceneObjectV1 = {
      id: `scene-${product.id}-${crypto.randomUUID()}`,
      sku: product.sku,
      assetVersion: product.assetVersion,
      position: { x: spot[0], y: 0, z: spot[1] },
      rotation: quaternionFromY(0),
      materialVariant: 0,
    };
    commit([...items, item]);
    setSelectedItemId(item.id);
    showToast(`${product.name} 已放入房間`);
  };

  const undo = () => {
    const previous = undoStack.at(-1);
    if (!previous) return;
    setRedoStack((stack) => [...stack, cloneItems(items)]);
    setItems(previous);
    setUndoStack((stack) => stack.slice(0, -1));
  };

  const redo = () => {
    const next = redoStack.at(-1);
    if (!next) return;
    setUndoStack((stack) => [...stack, cloneItems(items)]);
    setItems(next);
    setRedoStack((stack) => stack.slice(0, -1));
  };

  const addOwnedSceneToCart = () => {
    setCartOpenIds(sceneProducts.filter((product) => product.brandKind === "owned").map((product) => product.id));
    setModal("cart");
  };

  const submitRender = () => {
    if (renderCredits < 1) {
      showToast("渲染點數不足，可先購買點數包");
      return;
    }
    setRenderCredits((credits) => credits - 1);
    setRenderLedger((ledger) => [{ id: crypto.randomUUID(), delta: -1, reason: "render_charge", createdAt: new Date().toISOString() }, ...ledger]);
    const id = crypto.randomUUID();
    setRenderJobs((jobs) => [{ id, status: "processing", createdAt: new Date().toISOString() }, ...jobs]);
    setModal(null);
    showToast("寫實作品正在背景製作");
    window.setTimeout(() => setRenderJobs((jobs) => jobs.map((job) => job.id === id ? { ...job, status: "complete" } : job)), 4600);
  };

  const grantCheckInCredits = () => {
    if (checkedIn) {
      showToast("此預約已完成報到，不可重複發放");
      return;
    }
    setCheckedIn(true);
    setRenderCredits((credits) => credits + 3);
    setRenderLedger((ledger) => [{ id: crypto.randomUUID(), delta: 3, reason: "check_in_grant", createdAt: new Date().toISOString() }, ...ledger]);
    showToast("現場報到完成，已發放 3 點寫實渲染");
  };

  if (stage === "landing") {
    return <Landing onStart={() => setStage("login")} onAdmin={() => setStage("admin")} mobileNav={mobileNav} setMobileNav={setMobileNav} />;
  }

  if (stage === "login") {
    return <LoginScreen onBack={() => setStage("landing")} onLogin={() => setStage("avatar")} />;
  }

  if (stage === "avatar") {
    return <AvatarScreen selected={selectedAvatar} setSelected={setSelectedAvatar} onBack={() => setStage("login")} onNext={() => setStage("setup")} />;
  }

  if (stage === "setup") {
    return (
      <SetupScreen
        selectedFloorplan={selectedFloorplan}
        setSelectedFloorplan={setSelectedFloorplan}
        selectedTheme={selectedTheme}
        setSelectedTheme={setSelectedTheme}
        onBack={() => setStage("avatar")}
        onEnter={enterExperience}
      />
    );
  }

  if (stage === "admin") {
    return <AdminDashboard view={adminView} setView={setAdminView} onExit={() => setStage("landing")} onOpenExperience={() => setStage("editor")} />;
  }

  if (stage === "gallery") {
    return <Gallery renderJobs={renderJobs} onBack={() => setStage("editor")} onNewRender={() => setModal("render")} />;
  }

  return (
    <main className="editor-shell">
      <EditorHeader
        mode={mode}
        setMode={setMode}
        total={total}
        budget={budget}
        saveState={saveState}
        renderCredits={renderCredits}
        onBack={() => setStage("setup")}
        onBooking={() => setModal("booking")}
        onShare={() => setModal("share")}
        onCart={addOwnedSceneToCart}
        onGallery={() => setStage("gallery")}
        onMenu={() => setModal("menu")}
      />

      <div className="editor-layout">
        <aside className="catalog-panel">
          <div className="catalog-heading">
            <div>
              <span className="eyebrow">完整家具庫</span>
              <h2>放進你的家</h2>
            </div>
            <button className="icon-button"><ListFilter size={18} /></button>
          </div>
          <label className="search-field">
            <Search size={17} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜尋家具、品牌" />
          </label>
          <div className="category-tabs">
            {(Object.keys(categoryLabels) as (keyof typeof categoryLabels)[]).map((key) => (
              <button key={key} className={category === key ? "active" : ""} onClick={() => setCategory(key)}>{categoryLabels[key]}</button>
            ))}
          </div>
          <div className="catalog-list">
            {filteredCatalog.map((product) => (
              <button className="catalog-card" key={product.id} onClick={() => addFurniture(product)}>
                <ProductShape product={product} />
                <span className="catalog-card-copy">
                  <span className="brand-line">
                    {product.brandKind === "owned" ? "自有品牌" : `聯盟回饋 ${product.cashbackRate}%`}
                  </span>
                  <strong>{product.name}</strong>
                  <span>{formatCurrency(product.price)}</span>
                </span>
                <Plus size={18} className="add-icon" />
              </button>
            ))}
          </div>
        </aside>

        <section className="scene-panel">
          <div className="scene-status-bar">
            <span><span className="live-dot" />{floorplans.find((floorplan) => floorplan.id === selectedFloorplan)?.name}</span>
            <span>{themes.find((theme) => theme.id === selectedTheme)?.name}</span>
          </div>
          <ExperienceCanvas
            mode={mode}
            items={items}
            catalog={catalog}
            selectedId={selectedItemId}
            onSelect={setSelectedItemId}
            onMove={handleMove}
            onDragEnd={handleDragEnd}
            themeId={selectedTheme}
          />
          <div className="scene-tip">
            <MousePointer2 size={15} />
            {mode === "decorate" ? "拖曳家具移動，滾輪縮放視角" : "用 WASD 移動角色，點選家具查看"}
          </div>
          <div className="scene-tools">
            <button onClick={undo} disabled={!undoStack.length} aria-label="復原"><Undo2 size={18} /></button>
            <button onClick={redo} disabled={!redoStack.length} aria-label="重做"><Redo2 size={18} /></button>
            <span />
            <button onClick={() => showToast("已將鏡頭回到最佳視角")} aria-label="重置視角"><Maximize2 size={18} /></button>
          </div>
          {mode === "explore" && <VirtualPad />}
        </section>

        <aside className="detail-panel">
          {selectedProduct ? (
            <>
              <div className="detail-product-visual"><ProductShape product={selectedProduct} large /></div>
              <div className="detail-product-copy">
                <span className="brand-pill">{selectedProduct.brandKind === "owned" ? "Play Ground 自有品牌" : `聯盟品牌·${selectedProduct.cashbackRate}% 回饋`}</span>
                <h2>{selectedProduct.name}</h2>
                <p>{selectedProduct.size.width.toFixed(2)} × {selectedProduct.size.depth.toFixed(2)} × {selectedProduct.size.height.toFixed(2)} m</p>
                <strong className="detail-price">{formatCurrency(selectedProduct.price)}</strong>
              </div>
              <div className="material-row">
                <span>材質配色</span>
                <button style={{ background: selectedProduct.color }} onClick={cycleMaterial} aria-label="切換材質" />
                <button style={{ background: selectedProduct.accent }} onClick={cycleMaterial} aria-label="切換材質" />
                <button className="swatch-more" onClick={cycleMaterial}>+2</button>
              </div>
              <div className="object-actions">
                <button onClick={rotateSelected}><RotateCw size={17} />旋轉 45°</button>
                <button className="danger" onClick={removeSelected}><Trash2 size={17} />移除</button>
              </div>
              <button className="primary-button full" onClick={() => {
                if (selectedProduct.brandKind === "owned") {
                  setCartOpenIds((ids) => [...new Set([...ids, selectedProduct.id])]);
                  setModal("cart");
                } else {
                  showToast("已建立聯盟追蹤連結");
                }
              }}>
                {selectedProduct.brandKind === "owned" ? <ShoppingBag size={18} /> : <ExternalLink size={18} />}
                {selectedProduct.brandKind === "owned" ? "加入購物車" : "前往品牌官網"}
              </button>
            </>
          ) : (
            <div className="empty-detail">
              <Box size={34} />
              <h2>選一件家具</h2>
              <p>點選場景裡的物件，就能查看尺寸、價格與材質。</p>
            </div>
          )}
          <div className="budget-card">
            <div className="budget-card-title">
              <span><CircleDollarSign size={17} />家具預算</span>
              <label className="switch"><input type="checkbox" checked={budgetEnabled} onChange={(event) => setBudgetEnabled(event.target.checked)} /><span /></label>
            </div>
            {budgetEnabled && (
              <>
                <div className="budget-numbers"><strong>{formatCurrency(total)}</strong><span>/ {formatCurrency(budget)}</span></div>
                <div className="progress"><span style={{ width: `${Math.min(100, total / budget * 100)}%` }} /></div>
                <input className="budget-range" type="range" min="80000" max="500000" step="10000" value={budget} onChange={(event) => setBudget(Number(event.target.value))} />
                <small className={total > budget ? "over" : ""}>{total > budget ? `超出預算 ${formatCurrency(total - budget)}` : `尚有 ${formatCurrency(budget - total)} 可規劃`}</small>
              </>
            )}
          </div>
        </aside>
      </div>

      {modal === "booking" && <BookingModal complete={bookingComplete} checkedIn={checkedIn} onClose={() => setModal(null)} onComplete={() => setBookingComplete(true)} onCheckIn={grantCheckInCredits} />}
      {modal === "render" && <RenderModal credits={renderCredits} onClose={() => setModal(null)} onSubmit={submitRender} onBuy={() => { setRenderCredits((value) => value + 5); setRenderLedger((ledger) => [{ id: crypto.randomUUID(), delta: 5, reason: "purchase", createdAt: new Date().toISOString() }, ...ledger]); showToast("測試點數包已入帳"); }} />}
      {modal === "cart" && <CartModal products={catalog.filter((product) => cartOpenIds.includes(product.id))} ownedTotal={ownedTotal} onClose={() => setModal(null)} onCheckout={() => showToast("已進入綠界測試結帳 Adapter")} />}
      {modal === "share" && <ShareModal onClose={() => setModal(null)} onCopy={async () => { await navigator.clipboard?.writeText(window.location.href); showToast("分享連結已複製"); }} />}
      {modal === "menu" && <MenuModal onClose={() => setModal(null)} onAdmin={() => { setModal(null); setStage("admin"); }} onLogout={() => { setModal(null); setStage("landing"); }} />}
      {toast && <div className="toast"><Check size={17} />{toast}</div>}

      <button className="floating-render" onClick={() => setModal("render")}>
        <WandSparkles size={19} />
        <span>產生寫實圖</span>
        <b>{renderCredits} 點</b>
      </button>
    </main>
  );
}

function Landing({ onStart, onAdmin, mobileNav, setMobileNav }: { onStart: () => void; onAdmin: () => void; mobileNav: boolean; setMobileNav: (value: boolean) => void }) {
  return (
    <main className="landing">
      <nav className="landing-nav">
        <Brand />
        <div className={`landing-links ${mobileNav ? "open" : ""}`}>
          <a href="#how">怎麼玩</a><a href="#styles">風格主題</a><a href="#project">合作建案</a>
          <button className="text-button" onClick={onAdmin}><LayoutDashboard size={16} />企業後台</button>
          <button className="nav-cta" onClick={onStart}>開始打造<ArrowRight size={16} /></button>
        </div>
        <button className="mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="開啟選單"><Menu /></button>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <span className="co-brand"><Building2 size={16} />森沐建設 × 居遊所 Play Ground</span>
          <h1>先住進你的<br /><em>未來生活</em></h1>
          <p>選一個格局、布置喜歡的家具，再讓你的 Q 版角色走進去。從想像一個家，到真正來看它。</p>
          <div className="hero-actions">
            <button className="hero-primary" onClick={onStart}><Gamepad2 size={20} />開始打造我的家</button>
            <a href="#how" className="hero-secondary"><Eye size={19} />先看看怎麼玩</a>
          </div>
          <div className="hero-note"><span className="avatar-stack"><i /><i /><i /></span><strong>1,284</strong> 個未來的家正在被打造</div>
        </div>
        <DollhousePreview />
      </section>

      <section className="value-strip" id="how">
        <div><span>01</span><Gamepad2 /><strong>像玩遊戲一樣</strong><p>角色探索與俯視佈置，一鍵切換。</p></div>
        <div><span>02</span><Palette /><strong>放進真實家具</strong><p>尺寸、材質、價格與庫存都對得上。</p></div>
        <div><span>03</span><CalendarDays /><strong>帶著作品賞屋</strong><p>預約後現場開啟 3 張寫實圖。</p></div>
      </section>

      <section className="themes-section" id="styles">
        <div className="section-heading"><span className="eyebrow">四種未來·一個屬於你的家</span><h2>今天想住進哪種生活？</h2></div>
        <div className="theme-showcase">
          {themes.slice(0, 4).map((theme) => (
            <button key={theme.id} onClick={onStart}>
              <span className="theme-art" style={{ background: `linear-gradient(145deg, ${theme.palette[0]}, ${theme.palette[1]})` }}>
                <i style={{ background: theme.palette[2] }} />
                <b>{theme.emoji}</b>
              </span>
              <strong>{theme.name}</strong><small>{theme.english}</small><p>{theme.description}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="project-banner" id="project">
        <div><span className="eyebrow">首發合作建案</span><h2>河岸青·讓光走進每一個房間</h2><p>三種主力戶型全數上線，從 26.8 坪兩房到 42.2 坪景觀三房。</p></div>
        <button onClick={onStart}>玩這個建案<ArrowRight /></button>
      </section>

      <footer><Brand /><p>居遊所 Play Ground · 遊戲化建案家飾導購平台</p><span>開發中版本·台灣</span></footer>
    </main>
  );
}

function DollhousePreview() {
  return (
    <div className="dollhouse-preview" aria-label="Q 版未來居家預覽">
      <div className="sun-orb" />
      <div className="floating-label one"><PawPrint size={15} />毛孩友善</div>
      <div className="floating-label two"><ShoppingBag size={15} />7 件家具</div>
      <div className="room-box">
        <div className="room-wall back"><span className="window" /></div>
        <div className="room-wall side" />
        <div className="room-floor">
          <span className="mini-rug" />
          <span className="mini-sofa"><i /><i /></span>
          <span className="mini-table" />
          <span className="mini-chair" />
          <span className="mini-plant"><i /></span>
          <span className="mini-avatar"><i /></span>
        </div>
      </div>
      <div className="preview-toolbar"><span className="active"><Box size={16} /></span><span><SofaGlyph /></span><span><Palette size={16} /></span><span><Camera size={16} /></span></div>
    </div>
  );
}

function LoginScreen({ onBack, onLogin }: { onBack: () => void; onLogin: () => void }) {
  return (
    <main className="onboarding-page">
      <button className="back-button" onClick={onBack}><ArrowLeft />回到建案</button>
      <div className="onboarding-card login-card">
        <Brand centered />
        <span className="step-badge">STEP 1 / 3</span>
        <h1>歡迎回到你的未來家</h1>
        <p>登入後才能進入 3D 體驗，你的配置、作品與點數都會安全保存。</p>
        <div className="social-buttons">
          <button onClick={onLogin}><span className="google-g">G</span>使用 Google 繼續</button>
          <button onClick={onLogin}><span className="apple-mark"></span>使用 Apple 繼續</button>
          <button onClick={onLogin} className="line"><span>LINE</span>使用 LINE 繼續</button>
        </div>
        <small className="alpha-note"><LockKeyhole size={14} />Alpha 測試環境：目前使用可替換的登入 Adapter，不會向社群帳號發送內容。</small>
        <p className="legal-copy">繼續即表示你同意《使用條款》與《隱私權政策》；預約前不會將個人資料提供給建商。</p>
      </div>
      <OnboardingArt />
    </main>
  );
}

function AvatarScreen({ selected, setSelected, onBack, onNext }: { selected: number; setSelected: (value: number) => void; onBack: () => void; onNext: () => void }) {
  const outfits = ["#e07c62", "#6ea697", "#7389ba", "#d19a4f", "#8f75a8", "#53766a"];
  return (
    <main className="onboarding-page avatar-page">
      <button className="back-button" onClick={onBack}><ArrowLeft />上一步</button>
      <div className="avatar-layout">
        <div className="avatar-preview-large"><AvatarFigure color={outfits[selected]} index={selected} /><span className="avatar-shadow" /></div>
        <div className="onboarding-card avatar-card">
          <span className="step-badge">STEP 2 / 3</span>
          <h1>挑一個今天的你</h1>
          <p>輕量角色會陪你在未來的家裡探索。之後隨時都能更改。</p>
          <div className="avatar-grid">
            {outfits.map((color, index) => <button key={color} className={selected === index ? "selected" : ""} onClick={() => setSelected(index)}><AvatarFigure color={color} index={index} />{selected === index && <Check />}</button>)}
          </div>
          <button className="primary-button full large" onClick={onNext}>就是這個我<ArrowRight /></button>
        </div>
      </div>
    </main>
  );
}

function SetupScreen({ selectedFloorplan, setSelectedFloorplan, selectedTheme, setSelectedTheme, onBack, onEnter }: { selectedFloorplan: string; setSelectedFloorplan: (id: string) => void; selectedTheme: string; setSelectedTheme: (id: string) => void; onBack: () => void; onEnter: () => void }) {
  return (
    <main className="setup-page">
      <header><Brand /><span className="setup-progress"><i className="done" /><i className="done" /><i className="active" />STEP 3 / 3</span><button className="text-button" onClick={onBack}><ArrowLeft />上一步</button></header>
      <section className="setup-content">
        <div className="setup-heading"><span className="co-brand"><Building2 size={15} />森沐建設·河岸青</span><h1>選一個格局，先住進去看看。</h1><p>所有戶型都來自正式建築圖面，家具比例與實品一致。</p></div>
        <div className="setup-block"><div className="setup-block-title"><b>01</b><span><strong>選擇戶型</strong><small>三種主力格局</small></span></div><div className="floorplan-grid">{floorplans.map((floorplan) => <button key={floorplan.id} className={selectedFloorplan === floorplan.id ? "selected" : ""} onClick={() => setSelectedFloorplan(floorplan.id)}><FloorplanMini accent={floorplan.accent} /><span><strong>{floorplan.name}</strong><small>{floorplan.rooms}·{floorplan.area}</small><p>{floorplan.subtitle}</p></span>{selectedFloorplan === floorplan.id && <Check className="selection-check" />}</button>)}</div></div>
        <div className="setup-block"><div className="setup-block-title"><b>02</b><span><strong>選擇生活主題</strong><small>預設配置後仍可自由修改</small></span></div><div className="setup-theme-grid">{themes.map((theme) => <button key={theme.id} className={selectedTheme === theme.id ? "selected" : ""} onClick={() => setSelectedTheme(theme.id)} style={{ "--theme-a": theme.palette[0], "--theme-b": theme.palette[1], "--theme-c": theme.palette[2] } as CSSProperties}><span className="setup-theme-art"><b>{theme.emoji}</b><i /></span><strong>{theme.name}</strong><small>{theme.english}</small>{selectedTheme === theme.id && <Check className="selection-check" />}</button>)}</div></div>
        <button className="enter-experience" onClick={onEnter}><Gamepad2 />進入 3D 未來家<span>{floorplans.find((floorplan) => floorplan.id === selectedFloorplan)?.name}·{themes.find((theme) => theme.id === selectedTheme)?.name}</span><ArrowRight /></button>
      </section>
    </main>
  );
}

function EditorHeader({ mode, setMode, total, budget, saveState, renderCredits, onBack, onBooking, onShare, onCart, onGallery, onMenu }: { mode: EditorMode; setMode: (mode: EditorMode) => void; total: number; budget: number; saveState: string; renderCredits: number; onBack: () => void; onBooking: () => void; onShare: () => void; onCart: () => void; onGallery: () => void; onMenu: () => void }) {
  return <header className="editor-header"><button className="editor-back" onClick={onBack}><ArrowLeft /></button><Brand compact /><span className="header-divider" /><div className="mode-switch"><button className={mode === "explore" ? "active" : ""} onClick={() => setMode("explore")}><Gamepad2 />探索</button><button className={mode === "decorate" ? "active" : ""} onClick={() => setMode("decorate")}><MousePointer2 />佈置</button></div><div className="editor-head-spacer" /><span className="save-state"><Save size={15} />{saveState === "saved" ? "已自動儲存" : "儲存中…"}</span><button className="header-total"><small>目前總價</small><strong>{formatCurrency(total)}</strong><span className={total > budget ? "over" : ""}>{total > budget ? "超出預算" : "預算內"}</span></button><button className="icon-label" onClick={onGallery}><ImageIcon />作品 <b>{renderCredits}</b></button><button className="icon-label" onClick={onShare}><Share2 />分享</button><button className="icon-label" onClick={onCart}><ShoppingBag />購物車</button><button className="booking-button" onClick={onBooking}><CalendarDays />預約賞屋</button><button className="avatar-menu" onClick={onMenu}><AvatarFigure color="#6ea697" index={1} /></button></header>;
}

function BookingModal({ complete, checkedIn, onClose, onComplete, onCheckIn }: { complete: boolean; checkedIn: boolean; onClose: () => void; onComplete: () => void; onCheckIn: () => void }) {
  const [form, setForm] = useState<BookingDraft>({ date: "2026-08-08", slot: "14:00", name: "陳小居", phone: "0912 345 678", consent: true });
  return <ModalShell onClose={onClose} wide>{complete ? <div className="booking-success"><div className="success-icon"><Check /></div><span className="eyebrow">預約已送出</span><h2>8 月 8 日·下午 2:00</h2><p>森沐建設將與你確認。現場報到後，帳號會免費解鎖 3 張寫實渲染。</p><div className="qr-card"><QrCode size={86} /><span><strong>報到碼 PG-2808</strong><small>接待人員掃描後即完成報到</small></span></div><button className="primary-button full" onClick={onCheckIn} disabled={checkedIn}>{checkedIn ? <><Check />已報到·發放 3 點</> : <><QrCode />模擬現場報到</>}</button></div> : <div className="booking-form"><span className="eyebrow">預約賞屋</span><h2>把這個家，變成真的。</h2><p>預約並實際到場後，即可免費解鎖 3 點寫實渲染。</p><div className="form-grid"><label><span>姓名</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label><span>手機</span><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><label><span>日期</span><input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label><label><span>時段</span><select value={form.slot} onChange={(event) => setForm({ ...form, slot: event.target.value })}><option>10:00</option><option>11:30</option><option>14:00</option><option>16:00</option></select></label></div><label className="consent"><input type="checkbox" checked={form.consent} onChange={(event) => setForm({ ...form, consent: event.target.checked })} /><span><strong>我同意將本次聯絡資料、意向戶型與配置摘要提供給森沐建設</strong><small>私人作品、購物車與點數不會被分享。</small></span></label><button className="primary-button full large" disabled={!form.consent || !form.name || !form.phone} onClick={onComplete}>確認預約<ArrowRight /></button></div>}</ModalShell>;
}

function RenderModal({ credits, onClose, onSubmit, onBuy }: { credits: number; onClose: () => void; onSubmit: () => void; onBuy: () => void }) {
  return <ModalShell onClose={onClose}><div className="render-modal"><div className="render-preview"><span className="render-window" /><span className="render-sofa" /><span className="render-plant" /><b><Sparkles />AI 僅增強光影與窗景</b></div><span className="eyebrow">寫實作品</span><h2>把現在的鏡頭變成建築效果圖</h2><p>格局、家具型號與擺放位置完全保留，完成後自動放入作品庫。</p><div className="credit-line"><WalletCards /><span><small>可用渲染點數</small><strong>{credits} 點</strong></span><b>本次 -1</b></div>{credits > 0 ? <button className="primary-button full large" onClick={onSubmit}><WandSparkles />送出這個鏡頭</button> : <button className="primary-button full large" onClick={onBuy}><CreditCard />購買測試點數包·5 點</button>}<small className="render-note">失敗任務會自動退還點數，正式金額由營運後台設定。</small></div></ModalShell>;
}

function CartModal({ products, ownedTotal, onClose, onCheckout }: { products: FurnitureItem[]; ownedTotal: number; onClose: () => void; onCheckout: () => void }) {
  return <ModalShell onClose={onClose} wide><div className="cart-modal"><span className="eyebrow">自有品牌購物車</span><h2>把喜歡的配置帶回家</h2><div className="cart-list">{products.length ? products.map((product) => <div key={product.id}><ProductShape product={product} /><span><strong>{product.name}</strong><small>{product.sku}·{product.stock === "low_stock" ? "庫存不多" : "有現貨"}</small></span><b>{formatCurrency(product.price)}</b></div>) : <p>尚未加入自有品牌商品。</p>}</div><div className="cart-summary"><span><small>商品小計</small><strong>{formatCurrency(products.reduce((sum, product) => sum + product.price, 0) || ownedTotal)}</strong></span><small>聯盟商品會另以可追蹤連結開啟品牌網站。</small></div><button className="primary-button full large" onClick={onCheckout}><CreditCard />前往安全結帳</button></div></ModalShell>;
}

function ShareModal({ onClose, onCopy }: { onClose: () => void; onCopy: () => void }) {
  return <ModalShell onClose={onClose}><div className="share-modal"><div className="share-card-preview"><span>居遊所 Play Ground × 河岸青</span><strong>我的日光慢生活</strong><DollhousePreview /></div><h2>分享你的未來家</h2><p>作品預設為私人。產生連結後，收件者可檢視商品清單，但無法修改原稿。</p><button className="primary-button full" onClick={onCopy}><Link2 />產生並複製分享連結</button><button className="secondary-button full" onClick={() => window.print()}><Download />下載社群分享圖</button></div></ModalShell>;
}

function MenuModal({ onClose, onAdmin, onLogout }: { onClose: () => void; onAdmin: () => void; onLogout: () => void }) {
  return <ModalShell onClose={onClose}><div className="menu-modal"><div className="menu-profile"><AvatarFigure color="#6ea697" index={1} /><span><strong>陳小居</strong><small>Alpha 測試帳號</small></span></div><button onClick={onAdmin}><LayoutDashboard />企業營運後台<ArrowRight /></button><button><WalletCards />點數與回饋錢包<span>0 點</span></button><button><Save />我的配置<span>1</span></button><button><ImageIcon />寫實作品<span>0</span></button><button className="danger" onClick={onLogout}><LogOut />登出</button></div></ModalShell>;
}

function Gallery({ renderJobs, onBack, onNewRender }: { renderJobs: { id: string; status: "processing" | "complete"; createdAt: string }[]; onBack: () => void; onNewRender: () => void }) {
  return <main className="gallery-page"><header><button className="editor-back" onClick={onBack}><ArrowLeft /></button><Brand compact /><span /><button className="primary-button" onClick={onNewRender}><WandSparkles />產生新作品</button></header><section><span className="eyebrow">私人作品庫</span><h1>我的未來家</h1><p>所有作品預設只有你看得見，主動分享後才會建立連結。</p><div className="gallery-grid"><article className="saved-design"><div className="saved-dollhouse"><DollhousePreview /></div><span><small>3D 配置</small><strong>日光慢生活·A2 兩房</strong><p>7 件家具·已自動儲存</p></span><button onClick={onBack}>繼續編輯<ArrowRight /></button></article>{renderJobs.map((job) => <article className={`render-job ${job.status}`} key={job.id}><div className="render-job-visual"><span /><b>{job.status === "processing" ? <><Clock3 />背景處理中</> : <><Sparkles />寫實作品</>}</b></div><span><small>{new Date(job.createdAt).toLocaleString("zh-TW")}</small><strong>{job.status === "processing" ? "正在增強光影與窗景" : "日光客廳·正式輸出"}</strong></span></article>)}</div></section></main>;
}

function AdminDashboard({ view, setView, onExit, onOpenExperience }: { view: AdminView; setView: (view: AdminView) => void; onExit: () => void; onOpenExperience: () => void }) {
  return <main className="admin-shell"><aside><Brand compact /><nav><button className={view === "builder" ? "active" : ""} onClick={() => setView("builder")}><Building2 />建商後台</button><button className={view === "platform" ? "active" : ""} onClick={() => setView("platform")}><LayoutDashboard />平台營運</button><span />{["建案內容", "預約名單", "3D 資產", "商品庫存", "渲染與點數", "網域與嵌入"].map((label, index) => <button key={label}><AdminIcon index={index} />{label}{index === 1 && <b>8</b>}</button>)}</nav><button className="admin-exit" onClick={onExit}><ArrowLeft />回到網站</button></aside><section className="admin-main"><header><div><span className="eyebrow">{view === "builder" ? "森沐建設·河岸青" : "居遊所 Play Ground"}</span><h1>{view === "builder" ? "建案營運總覽" : "平台營運中心"}</h1></div><button className="secondary-button" onClick={onOpenExperience}><Eye />開啟消費者體驗</button></header>{view === "builder" ? <BuilderDashboard /> : <PlatformDashboard />}</section></main>;
}

function BuilderDashboard() {
  return <><div className="stat-grid"><Stat icon={<Users />} label="本月匿名體驗" value="1,284" delta="+18.4%" /><Stat icon={<CalendarDays />} label="已同意預約" value="86" delta="+12" /><Stat icon={<QrCode />} label="實際報到" value="54" delta="62.8%" /><Stat icon={<Box />} label="本月 3D 流量" value="68%" delta="方案內" /></div><div className="admin-grid"><article className="chart-card"><div className="card-head"><span><strong>近 14 日體驗趨勢</strong><small>僅顯示匿名聚合資料</small></span><button>14 日<ChevronDown /></button></div><div className="bar-chart">{[32, 45, 39, 62, 55, 72, 68, 84, 76, 91, 88, 105, 112, 118].map((height, index) => <span key={index} style={{ height: `${height / 1.25}%` }}><i /></span>)}</div><div className="chart-labels"><span>7/18</span><span>7/22</span><span>7/26</span><span>7/31</span></div></article><article className="popular-card"><div className="card-head"><span><strong>熱門戶型</strong><small>使用者進入 3D 的選擇</small></span></div>{floorplans.map((floorplan, index) => <div className="popular-row" key={floorplan.id}><FloorplanMini accent={floorplan.accent} /><span><strong>{floorplan.name}</strong><small>{[46, 34, 20][index]}% 體驗佔比</small></span><div><i style={{ width: `${[92, 68, 40][index]}%` }} /></div></div>)}</article><article className="lead-card span-two"><div className="card-head"><span><strong>最新預約</strong><small>僅列出已同意分享資料的使用者</small></span><button><Download />CSV</button></div><table><thead><tr><th>姓名</th><th>意向戶型</th><th>配置主題</th><th>預約時間</th><th>狀態</th></tr></thead><tbody>{[["陳●居", "A2 日光兩房", "日光慢生活", "8/02 14:00", "待確認"], ["林●宇", "B1 輕盈三房", "毛孩共居所", "8/03 11:30", "已確認"], ["許●安", "C3 景觀三房", "親子成長家", "8/04 16:00", "已報到"]].map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={cell}>{index === 4 ? <span className={`status s${index}`}>{cell}</span> : cell}</td>)}</tr>)}</tbody></table></article></div></>;
}

function PlatformDashboard() {
  return <><div className="stat-grid"><Stat icon={<Building2 />} label="啟用中建案" value="01" delta="Alpha" /><Stat icon={<Store />} label="自有品牌 SKU" value="168" delta="96% 有貨" /><Stat icon={<WandSparkles />} label="本月渲染任務" value="326" delta="98.7% 成功" /><Stat icon={<BadgePercent />} label="聯盟點擊" value="742" delta="V1 追蹤" /></div><div className="admin-grid"><article className="pipeline-card span-two"><div className="card-head"><span><strong>3D 資產發布管線</strong><small>正式圖面、Q 版資產、渲染資產與碰撞驗證</small></span><button><Plus />新增資產</button></div><div className="pipeline-steps">{[["圖面導入", "3 戶型", true], ["Q 版網格", "146 資產", true], ["渲染材質", "138 通過", true], ["碰撞／導覽網格", "8 待處理", false], ["建案發布", "v0.8 Alpha", false]].map(([title, subtitle, done], index) => <div key={String(title)} className={done ? "done" : ""}><span>{done ? <Check /> : index + 1}</span><strong>{title}</strong><small>{subtitle}</small></div>)}</div></article><article className="revenue-card"><div className="card-head"><span><strong>收入引擎</strong><small>金額均為 Alpha 示意</small></span></div>{[["建案年費與用量", 46, "#e77f5f"], ["自有家具成交", 38, "#6e9f8c"], ["渲染點數", 11, "#e0b34f"], ["聯盟分潤", 5, "#7285b2"]].map(([name, percent, color]) => <div className="revenue-row" key={String(name)}><span style={{ background: String(color) }} /><strong>{name}</strong><b>{percent}%</b></div>)}</article><article className="usage-card"><div className="card-head"><span><strong>方案用量</strong><small>固定年費＋基本用量</small></span></div><div className="usage-ring"><span><strong>68%</strong><small>本月</small></span></div><div className="usage-legend"><span>3D 流量 <b>4.8 TB</b></span><span>配置儲存 <b>12.6k</b></span><span>現場贈送渲染 <b>162</b></span></div></article></div></>;
}

function ModalShell({ children, onClose, wide = false }: { children: ReactNode; onClose: () => void; wide?: boolean }) { return <div className="modal-backdrop" role="dialog" aria-modal="true"><div className={`modal-card ${wide ? "wide" : ""}`}><button className="modal-close" onClick={onClose} aria-label="關閉"><X /></button>{children}</div></div>; }
function SceneLoading() { return <div className="scene-loading"><div className="loading-house"><Home /></div><strong>正在搬進你的未來家…</strong><span><i /></span></div>; }
function VirtualPad() { return <div className="virtual-pad"><button>↑</button><button>←</button><button>↓</button><button>→</button></div>; }
function Brand({ compact = false, centered = false }: { compact?: boolean; centered?: boolean }) { return <div className={`brand ${compact ? "compact" : ""} ${centered ? "centered" : ""}`}><span className="brand-mark"><i /><i /><i /></span><span><strong>居遊所</strong><small>Play Ground</small></span></div>; }
function AvatarFigure({ color, index }: { color: string; index: number }) { return <span className={`avatar-figure hair-${index % 3}`}><i className="hair" style={{ background: ["#5f4234", "#292c32", "#9a633d"][index % 3] }} /><i className="head" /><i className="body" style={{ background: color }} /><i className="leg left" /><i className="leg right" /></span>; }
function OnboardingArt() { return <div className="onboarding-art"><span className="art-cloud a" /><span className="art-cloud b" /><div className="onboarding-room"><span className="art-sofa" /><span className="art-lamp" /><span className="art-plant" /><span className="art-avatar"><AvatarFigure color="#6ea697" index={1} /></span></div></div>; }
function FloorplanMini({ accent }: { accent: string }) { return <span className="floorplan-mini" style={{ "--accent": accent } as CSSProperties}><i className="room-a" /><i className="room-b" /><i className="room-c" /><i className="door" /></span>; }
function ProductShape({ product, large = false }: { product: FurnitureItem; large?: boolean }) { return <span className={`product-shape shape-${product.shape} ${large ? "large" : ""}`} style={{ "--shape": product.color, "--shape-accent": product.accent } as CSSProperties}><i /><b /><em /></span>; }
function SofaGlyph() { return <span className="sofa-glyph" />; }
function Stat({ icon, label, value, delta }: { icon: ReactNode; label: string; value: string; delta: string }) { return <article className="stat-card"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div><b>{delta}</b></article>; }
function AdminIcon({ index }: { index: number }) { const icons = [<Home key="home" />, <CalendarDays key="calendar" />, <Box key="box" />, <PackageCheck key="package" />, <WandSparkles key="sparkles" />, <Link2 key="link" />]; return icons[index]; }

function buildInitialScene(themeId: string): SceneObjectV1[] {
  if (themeId === "empty") return [];
  return initialFurnitureIds.map((id) => {
    const product = catalog.find((entry) => entry.id === id)!;
    const position = initialPositions[id];
    return { id: `scene-${id}`, sku: product.sku, assetVersion: product.assetVersion, position: { x: position[0], y: 0, z: position[1] }, rotation: quaternionFromY(id === "sofa-cloud" ? Math.PI : 0), materialVariant: themeId === "urban" ? 1 : 0 };
  });
}
function cloneItems(items: SceneObjectV1[]) { return structuredClone(items); }
function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
function quaternionFromY(angle: number) { return { x: 0, y: Math.sin(angle / 2), z: 0, w: Math.cos(angle / 2) }; }
function quaternionToY(q: { x: number; y: number; z: number; w: number }) { return Math.atan2(2 * (q.w * q.y + q.x * q.z), 1 - 2 * (q.y * q.y + q.z * q.z)); }
function collides(id: string, x: number, z: number, product: FurnitureItem, items: SceneObjectV1[]) { return items.some((item) => { if (item.id === id) return false; const other = catalog.find((entry) => entry.sku === item.sku); if (!other) return false; const padding = 0.08; return Math.abs(x - item.position.x) < (product.size.width + other.size.width) / 2 - padding && Math.abs(z - item.position.z) < (product.size.depth + other.size.depth) / 2 - padding; }); }
function findOpenSpot(product: FurnitureItem, items: SceneObjectV1[]): [number, number] | null { const spots: [number, number][] = [[2.8, -1.5], [-2.8, -1.5], [3, 1.8], [-3, 1.8], [0, -2.4], [0, 2.35], [2.5, 0]]; return spots.find(([x, z]) => !collides("new", x, z, product, items)) ?? null; }
