"use client";

import dynamic from "next/dynamic";
import {
  ArrowLeft,
  ArrowRight,
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
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  ApiClientError,
  checkInBooking,
  createBooking,
  createRender,
  createShare,
  loadDesigns,
  loadRenderState,
  revokeShare,
  saveDesign as saveDesignApi,
} from "./lib/api-client";
import type { BookingSession, RenderJobRecord } from "./lib/api-client";
import { catalog, floorplans, ikeaDemoFurnitureIds, themeFurnitureIds, themes } from "./lib/catalog";
import { commercialPilot, commercialPilotProgress } from "./lib/commercial-pilot";
import type {
  BookingDraft,
  EditorMode,
  FurnitureItem,
  SceneObjectV1,
} from "./lib/domain";
import { formatCurrency } from "./lib/domain";
import { createEditorEngine, quaternionFromY, type EditorCommand, type EditorFloorplan, type EditorView } from "./lib/editor-engine";
import { proposalProject } from "./lib/project";
import { getFloorplanRuntime } from "./lib/floorplan-runtime";
import type { SceneView } from "./lib/scene-presentation";
import { HOMEPLAY_VISUAL_VERSION, homePlayVisual } from "./lib/visual-contract";

const ExperienceCanvas = dynamic(
  () => import("./components/experience-canvas").then((module) => module.ExperienceCanvas),
  { ssr: false, loading: () => <SceneLoading /> },
);

type Stage = "landing" | "login" | "avatar" | "setup" | "editor" | "gallery" | "admin";
type Modal = null | "booking" | "render" | "cart" | "share" | "menu";
type AdminView = "builder" | "platform";
type ActionState = null | "booking" | "check-in" | "render" | "share" | "revoke-share";
type ShareSession = { id: string; url: string; expiresAt: string };

const categoryLabels = {
  all: "全部",
  living: "客廳",
  dining: "餐廳",
  bedroom: "臥室",
  decor: "飾品",
} as const;

const editorFloorplans = ["bh7-a6", "bh7-a11"].map((floorplanId): EditorFloorplan => {
  const runtime = getFloorplanRuntime(floorplanId);
  if (!runtime) throw new Error(`Missing editor floorplan ${floorplanId}`);
  return {
    id: runtime.floorplanId,
    footprint: runtime.shell.footprint,
    editableBounds: runtime.shell.editableBounds,
    walls: runtime.shell.walls,
    openings: runtime.shell.openings,
    candidateSpots: runtime.candidateSpots,
  };
});

export function HomePlayApp() {
  const [stage, setStage] = useState<Stage>("landing");
  const [modal, setModal] = useState<Modal>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(1);
  const [selectedFloorplan, setSelectedFloorplan] = useState(floorplans[0].id);
  const [selectedTheme, setSelectedTheme] = useState(themes[0].id);
  const editorEngine = useMemo(() => {
    const engine = createEditorEngine({ products: catalog, floorplans: editorFloorplans });
    const initialItems = buildInitialScene(floorplans[0].id, "sunny");
    engine.load({ floorplanId: floorplans[0].id, items: initialItems, selectedId: "scene-sofa-cloud" });
    return engine;
  }, []);
  const initialEditorView = editorEngine.view();
  const [mode, setMode] = useState<EditorMode>("decorate");
  const [touchMove, setTouchMove] = useState({ x: 0, z: 0 });
  const [cameraResetNonce, setCameraResetNonce] = useState(0);
  const [auditMode, setAuditMode] = useState(false);
  const [sceneView, setSceneView] = useState<SceneView>("hero");
  const [items, setItems] = useState<SceneObjectV1[]>(initialEditorView.items);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(initialEditorView.selectedId);
  const [category, setCategory] = useState<keyof typeof categoryLabels>("all");
  const [search, setSearch] = useState("");
  const [budget, setBudget] = useState(180000);
  const [budgetEnabled, setBudgetEnabled] = useState(true);
  const [canUndo, setCanUndo] = useState(initialEditorView.canUndo);
  const [canRedo, setCanRedo] = useState(initialEditorView.canRedo);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [toast, setToast] = useState("");
  const [renderCredits, setRenderCredits] = useState(0);
  const [renderJobs, setRenderJobs] = useState<RenderJobRecord[]>([]);
  const [designId, setDesignId] = useState<string | null>(null);
  const [designReady, setDesignReady] = useState(false);
  const [bookingSession, setBookingSession] = useState<BookingSession | null>(null);
  const [shareSession, setShareSession] = useState<ShareSession | null>(null);
  const [actionState, setActionState] = useState<ActionState>(null);
  const [adminView, setAdminView] = useState<AdminView>("builder");
  const [cartOpenIds, setCartOpenIds] = useState<string[]>([]);

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
    () => catalog
      .filter((product) => {
        const matchesCategory = category === "all" || product.category === category;
        const matchesSearch = product.name.includes(search) || product.brand.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .toSorted((a, b) => Number(b.partnershipStatus === "demo") - Number(a.partnershipStatus === "demo")),
    [category, search],
  );

  const showToast = useCallback((message: string) => setToast(message), []);

  const syncEditorView = useCallback((view: EditorView) => {
    setItems(view.items);
    setSelectedItemId(view.selectedId);
    setCanUndo(view.canUndo);
    setCanRedo(view.canRedo);
  }, []);

  const runEditorCommand = useCallback((command: EditorCommand, announce = true) => {
    const result = editorEngine.dispatch(command);
    syncEditorView(result.view);
    if (announce && result.effect) showToast(result.effect.message);
    return result;
  }, [editorEngine, showToast, syncEditorView]);

  const refreshRenderState = useCallback(async () => {
    const state = await loadRenderState();
    setRenderCredits(state.balance);
    setRenderJobs(state.jobs);
    return state;
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (stage !== "editor" || !designReady) return;
    const stateTimer = window.setTimeout(() => setSaveState("saving"), 0);
    const timer = window.setTimeout(() => {
      void saveDesignApi({ floorplanId: selectedFloorplan, themeId: selectedTheme, objects: items })
        .then((saved) => {
          setDesignId(saved.id);
          setSaveState("saved");
        })
        .catch((error: unknown) => {
          setSaveState("error");
          showToast(apiMessage(error, "這次配置尚未儲存，稍後會再試"));
        });
    }, 900);
    return () => {
      window.clearTimeout(stateTimer);
      window.clearTimeout(timer);
    };
  }, [designReady, items, selectedFloorplan, selectedTheme, showToast, stage]);

  const enterExperience = async () => {
    const initialScene = buildInitialScene(selectedFloorplan, selectedTheme);
    syncEditorView(editorEngine.load({
      floorplanId: selectedFloorplan,
      items: initialScene,
      selectedId: initialScene.find((item) => item.sku === "PG-SF-001")?.id ?? initialScene[0]?.id ?? null,
    }));
    setDesignReady(false);
    setAuditMode(false);
    setSceneView("hero");
    setStage("editor");
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const [savedDesigns, renderState] = await Promise.all([loadDesigns(), loadRenderState()]);
      const saved = savedDesigns.find((entry) => entry.floorplanId === selectedFloorplan && entry.themeId === selectedTheme);
      setRenderCredits(renderState.balance);
      setRenderJobs(renderState.jobs);
      if (saved) {
        const savedObjects = (saved.snapshot.objects ?? []).map((object) => {
          const currentProduct = catalog.find((product) => product.sku === object.sku);
          return currentProduct ? { ...object, assetVersion: currentProduct.assetVersion } : object;
        });
        setDesignId(saved.id);
        const preferredSelection = savedObjects.find((object) => object.sku === "PG-SF-001")
          ?? savedObjects.find((object) => object.sku === "IKEA-195.999.18")
          ?? savedObjects[0];
        syncEditorView(editorEngine.load({ floorplanId: selectedFloorplan, items: savedObjects, selectedId: preferredSelection?.id ?? null }));
        showToast("已載入上次自動儲存的配置");
      }
    } catch (error) {
      showToast(apiMessage(error, "雲端資料暫時無法載入，本次仍可繼續編輯"));
    } finally {
      setDesignReady(true);
    }
  };

  const applyIkeaDemoSet = () => {
    const activeTheme = selectedTheme === "empty" ? "sunny" : selectedTheme;
    const next = buildSceneFromIds(selectedFloorplan, activeTheme, ikeaDemoFurnitureIds);
    runEditorCommand({ type: "replace", items: next, selectedId: "scene-ikea-saltsjobaden", recordHistory: true }, false);
    showToast(`已套用 ${floorplans.find((plan) => plan.id === selectedFloorplan)?.name ?? "此戶型"} IKEA 模擬組`);
  };

  const handleMove = (id: string, x: number, z: number) => {
    runEditorCommand({ type: "move.update", id, x, z });
  };

  const handleDragEnd = (id: string) => {
    runEditorCommand({ type: "move.end", id });
  };

  const rotateSelected = () => {
    if (!selectedItemId) return;
    runEditorCommand({ type: "rotate", id: selectedItemId });
  };

  const cycleMaterial = () => {
    if (!selectedItemId) return;
    runEditorCommand({ type: "material.next", id: selectedItemId });
  };

  const removeSelected = () => {
    if (!selectedItemId) return;
    runEditorCommand({ type: "remove", id: selectedItemId });
  };

  const addFurniture = (product: FurnitureItem) => {
    runEditorCommand({ type: "add", productId: product.id });
  };

  const undo = () => runEditorCommand({ type: "undo" }, false);

  const redo = () => runEditorCommand({ type: "redo" }, false);

  const addOwnedSceneToCart = () => {
    setCartOpenIds(sceneProducts.filter((product) => product.brandKind === "owned").map((product) => product.id));
    setModal("cart");
  };

  const persistDesignNow = async () => {
    const saved = await saveDesignApi({ floorplanId: selectedFloorplan, themeId: selectedTheme, objects: items });
    setDesignId(saved.id);
    setSaveState("saved");
    return saved.id;
  };

  const submitRender = async () => {
    if (renderCredits < 1) {
      showToast("渲染點數不足，可先購買點數包");
      return;
    }
    setActionState("render");
    try {
      const currentDesignId = designId ?? await persistDesignNow();
      await createRender({
        designId: currentDesignId,
        camera: {
          position: { x: homePlayVisual.scene.cameraPosition[0], y: homePlayVisual.scene.cameraPosition[1], z: homePlayVisual.scene.cameraPosition[2] },
          target: { x: homePlayVisual.scene.cameraTarget[0], y: homePlayVisual.scene.cameraTarget[1], z: homePlayVisual.scene.cameraTarget[2] },
          fov: 38,
        },
      }, crypto.randomUUID());
      await refreshRenderState();
      setModal(null);
      showToast("寫實作品已排入背景任務");
    } catch (error) {
      showToast(apiMessage(error, "寫實作品送出失敗，點數不會被重複扣除"));
      await refreshRenderState().catch(() => undefined);
    } finally {
      setActionState(null);
    }
  };

  const handleBookingCreate = async (form: BookingDraft) => {
    setActionState("booking");
    try {
      const currentDesignId = designId ?? await persistDesignNow();
      const booking = await createBooking({
        floorplanId: selectedFloorplan,
        designId: currentDesignId,
        form,
        configurationSummary: {
          themeId: selectedTheme,
          furnitureSkus: items.map((item) => item.sku),
          furnitureCount: items.length,
          estimatedTotalTwd: total,
        },
      }, crypto.randomUUID());
      setBookingSession(booking);
      showToast("預約已安全送出");
    } catch (error) {
      showToast(apiMessage(error, "預約送出失敗，請稍後再試"));
    } finally {
      setActionState(null);
    }
  };

  const handleCheckIn = async () => {
    if (!bookingSession) return;
    if (bookingSession.status === "checked_in") {
      showToast("此預約已完成報到，不可重複發放");
      return;
    }
    setActionState("check-in");
    try {
      await checkInBooking(bookingSession, crypto.randomUUID());
      setBookingSession({ ...bookingSession, status: "checked_in" });
      await refreshRenderState();
      showToast("現場報到完成，已發放 3 點寫實渲染");
    } catch (error) {
      showToast(apiMessage(error, "報到未完成，請由接待人員重新掃描"));
    } finally {
      setActionState(null);
    }
  };

  const handleShare = async () => {
    setActionState("share");
    try {
      let current = shareSession;
      if (!current) {
        const currentDesignId = designId ?? await persistDesignNow();
        const created = await createShare(currentDesignId, crypto.randomUUID());
        current = { id: created.id, url: `${window.location.origin}/s/${created.token}`, expiresAt: created.expiresAt };
        setShareSession(current);
      }
      await navigator.clipboard?.writeText(current.url);
      showToast("唯讀分享連結已複製");
    } catch (error) {
      showToast(apiMessage(error, "分享連結建立失敗"));
    } finally {
      setActionState(null);
    }
  };

  const handleRevokeShare = async () => {
    if (!shareSession) return;
    setActionState("revoke-share");
    try {
      await revokeShare(shareSession.id);
      setShareSession(null);
      showToast("分享連結已撤銷");
    } catch (error) {
      showToast(apiMessage(error, "分享連結撤銷失敗"));
    } finally {
      setActionState(null);
    }
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
    <main className={`editor-shell ${mode === "explore" ? "explore-mode" : "decorate-mode"}`} data-visual-version={HOMEPLAY_VISUAL_VERSION}>
      <EditorHeader
        mode={mode}
        setMode={(nextMode) => { setMode(nextMode); if (nextMode === "explore") setAuditMode(false); }}
        total={total}
        budget={budget}
        saveState={saveState}
        renderCredits={renderCredits}
        avatarIndex={selectedAvatar}
        onBack={() => setStage("setup")}
        onBooking={() => setModal("booking")}
        onShare={() => setModal("share")}
        onCart={addOwnedSceneToCart}
        onGallery={() => setStage("gallery")}
        onMenu={() => setModal("menu")}
      />

      <div className="editor-layout">
        <nav className="editor-category-rail" aria-label="家具分類">
          <span className="rail-title">家具<br />目錄</span>
          {(Object.keys(categoryLabels) as (keyof typeof categoryLabels)[]).map((key) => (
            <button key={key} className={category === key ? "active" : ""} onClick={() => setCategory(key)} aria-label={categoryLabels[key]}>
              <CategoryGlyph category={key} />
              <span>{categoryLabels[key]}</span>
            </button>
          ))}
        </nav>

        <aside className="catalog-panel">
          <div className="catalog-heading">
            <div>
              <span className="eyebrow">免費完整家具庫 · 商品模擬</span>
              <h2>把喜歡的放進家裡</h2>
            </div>
            <button className="demo-library-button" onClick={applyIkeaDemoSet} title="重新套用 IKEA A6 模擬組">
              <Sparkles size={15} />IKEA 模擬組
            </button>
            <label className="search-field">
              <Search size={17} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜尋家具、品牌" />
            </label>
            <button className="icon-button" aria-label="篩選家具"><ListFilter size={18} /></button>
          </div>
          <div className="category-tabs">
            {(Object.keys(categoryLabels) as (keyof typeof categoryLabels)[]).map((key) => (
              <button key={key} className={category === key ? "active" : ""} onClick={() => setCategory(key)}>{categoryLabels[key]}</button>
            ))}
          </div>
          <div className="catalog-list">
            {filteredCatalog.map((product) => (
              <button className="catalog-card" key={product.id} disabled={product.stock === "out_of_stock"} onClick={() => addFurniture(product)}>
                <ProductShape product={product} />
                <span className="catalog-card-copy">
                  <span className="brand-line">
                    {productPartnerLabel(product)}
                  </span>
                  <strong>{product.name}</strong>
                  <span>{formatCurrency(product.price)}{product.stock === "out_of_stock" ? " · 暫時缺貨" : ""}</span>
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
            {selectedFloorplan === commercialPilot.floorplan.id && <span className="pilot-status">Commercial Pilot · {commercialPilotProgress.ready}/{commercialPilotProgress.total} 門檻通過</span>}
            {auditMode && <span className="audit-status">PDF 圖面疊合稽核</span>}
          </div>
          <ExperienceCanvas
            floorplanId={selectedFloorplan}
            mode={mode}
            items={items}
            catalog={catalog}
            selectedId={selectedItemId}
            onSelect={(id) => runEditorCommand({ type: "select", id }, false)}
            onMove={handleMove}
            onDragEnd={handleDragEnd}
            themeId={selectedTheme}
            touchMove={touchMove}
            avatarVariant={selectedAvatar}
            cameraResetNonce={cameraResetNonce}
            auditMode={auditMode}
            sceneView={sceneView}
          />
          {mode === "decorate" && !auditMode && (
            <div className="scene-view-switch" aria-label="場景視角">
              <button className={sceneView === "hero" ? "active" : ""} onClick={() => setSceneView("hero")}>客餐廳</button>
              <button className={sceneView === "whole" ? "active" : ""} onClick={() => setSceneView("whole")}>全屋</button>
            </div>
          )}
          <div className="scene-tip">
            <MousePointer2 size={15} />
            {mode === "decorate" ? (sceneView === "hero" ? "先在客餐廳近距離佈置，也可切換全屋" : "拖曳家具移動，滾輪縮放視角") : "用 WASD 移動居民，點選家具查看"}
          </div>
          <div className="scene-tools">
            <button onClick={undo} disabled={!canUndo} aria-label="復原"><Undo2 size={18} /></button>
            <button onClick={redo} disabled={!canRedo} aria-label="重做"><Redo2 size={18} /></button>
            <span />
            <button onClick={() => { setCameraResetNonce((value) => value + 1); showToast("已將鏡頭回到最佳視角"); }} aria-label="重置視角"><Maximize2 size={18} /></button>
            <button className={auditMode ? "active" : ""} aria-pressed={auditMode} onClick={() => { setMode("decorate"); setAuditMode((value) => !value); }} aria-label="切換 PDF 圖面稽核"><Eye size={18} /></button>
          </div>
          {auditMode && <div className="scene-audit-note"><strong>PDF 圖面稽核層</strong><span>藍色圖線：原始平面圖 · 彩色牆體：目前 Web 3D</span><small>寬度依標註校正；深度按圖面比例暫置，待 CAD／Blender 正式重建確認。</small></div>}
          {mode === "explore" && <VirtualPad onMove={setTouchMove} />}
        </section>

        <aside className="detail-panel">
          {selectedProduct ? (
            <>
              <div className="detail-product-visual"><ProductShape product={selectedProduct} large /></div>
              <div className="detail-product-copy">
                <span className="brand-pill">{productPartnerLabel(selectedProduct)}</span>
                <h2>{selectedProduct.name}</h2>
                <p>{selectedProduct.size.width.toFixed(2)} × {selectedProduct.size.depth.toFixed(2)} × {selectedProduct.size.height.toFixed(2)} m</p>
                <strong className="detail-price">{formatCurrency(selectedProduct.price)}</strong>
                {selectedProduct.partnershipStatus === "demo" && (
                  <small className="product-source-note">官方尺寸與參考價更新 {selectedProduct.sourceUpdatedAt}；價格、庫存以品牌官網為準。</small>
                )}
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
                  if (selectedProduct.productUrl) {
                    window.open(selectedProduct.productUrl, "_blank", "noopener,noreferrer");
                    showToast(selectedProduct.partnershipStatus === "demo" ? "已開啟品牌官網；合作與回饋尚未啟用" : "已建立聯盟追蹤連結");
                  } else {
                    showToast("品牌連結尚未設定");
                  }
                }
              }}>
                {selectedProduct.brandKind === "owned" ? <ShoppingBag size={18} /> : <ExternalLink size={18} />}
                {selectedProduct.brandKind === "owned" ? "加入購物車" : selectedProduct.brand === "IKEA" ? "到 IKEA 查看商品" : "前往品牌官網"}
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

      {modal === "booking" && <BookingModal booking={bookingSession} busy={actionState === "booking" || actionState === "check-in"} onClose={() => setModal(null)} onComplete={handleBookingCreate} onCheckIn={handleCheckIn} />}
      {modal === "render" && <RenderModal credits={renderCredits} busy={actionState === "render"} onClose={() => setModal(null)} onSubmit={submitRender} onBuy={() => showToast("正式點數包將在綠界憑證啟用後開放；現場報到可先取得 3 點")} />}
      {modal === "cart" && <CartModal products={catalog.filter((product) => cartOpenIds.includes(product.id))} ownedTotal={ownedTotal} onClose={() => setModal(null)} onCheckout={() => showToast("已進入綠界測試結帳 Adapter")} />}
      {modal === "share" && <ShareModal share={shareSession} busy={actionState === "share" || actionState === "revoke-share"} onClose={() => setModal(null)} onCopy={handleShare} onRevoke={handleRevokeShare} />}
      {modal === "menu" && <MenuModal credits={renderCredits} designCount={designId ? 1 : 0} workCount={renderJobs.length} onClose={() => setModal(null)} onAdmin={() => { setModal(null); setStage("admin"); }} onLogout={() => { setModal(null); setStage("landing"); }} />}
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
    <main className="landing" data-visual-version={HOMEPLAY_VISUAL_VERSION}>
      <nav className="landing-nav">
        <Brand />
        <div className={`landing-links ${mobileNav ? "open" : ""}`}>
          <a href="#how">怎麼玩</a><a href="#styles">風格主題</a><a href="#project">首發提案</a>
          <button className="text-button" onClick={onAdmin}><LayoutDashboard size={16} />企業後台</button>
          <button className="nav-cta" onClick={onStart}>開始打造<ArrowRight size={16} /></button>
        </div>
        <button className="mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="開啟選單"><Menu /></button>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <span className="co-brand"><Building2 size={16} />概念提案 · {proposalProject.name} × 居遊所 Play Ground</span>
          <h1>把自然遊園<br />搬進<em>未來生活</em></h1>
          <p>以北屯 21–39 坪、兩至三房的公開規劃為起點，先用 Q 版角色走進未來家，再配置可真正購買的家具。</p>
          <div className="hero-actions">
            <button className="hero-primary" onClick={onStart}><Gamepad2 size={20} />開始打造我的家</button>
            <a href="#how" className="hero-secondary"><Eye size={19} />先看看怎麼玩</a>
          </div>
          <div className="hero-note"><span className="avatar-stack"><i /><i /><i /></span><strong>首發提案</strong> · 機捷生活 × 自然遊園 × 家具導購</div>
        </div>
        <HeroKeyArt />
      </section>

      <section className="proposal-facts" aria-label="遠雄樂元公開建案重點">
        <article><strong>21–39</strong><span>坪 · 兩至三房</span></article>
        <article><strong>29</strong><span>層 · 北屯天際</span></article>
        <article><strong>2,147</strong><span>坪 · 基地規模</span></article>
        <article><strong>25 m</strong><span>泳池 · 遊園公設</span></article>
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
        <div><span className="eyebrow">第一號概念提案</span><h2>{proposalProject.name} · 北屯機捷生活遊園</h2><p>把捷運、採光、綠意與 21–39 坪生活尺度，轉化成可以走進、配置、分享並預約的導購體驗。</p><small className="proposal-disclaimer">本頁為居遊所依公開資訊製作的未委託概念提案；戶型為坪數分帶示意，非正式銷售圖說。</small><a className="official-source" href={proposalProject.officialUrl} target="_blank" rel="noreferrer">查看建案官方資料<ExternalLink size={15} /></a></div>
        <button onClick={onStart}>體驗提案<ArrowRight /></button>
      </section>

      <footer><Brand /><p>居遊所 Play Ground · 遊戲化建案家飾導購平台</p><span>開發中版本·台灣</span></footer>
    </main>
  );
}

function HeroKeyArt() {
  return (
    <div className="hero-key-art" role="img" aria-label="居遊所原創圓糯居民與 A6 粉彩模型屋正式美術示意">
      <div className="hero-key-art-image" />
      <div className="hero-art-caption">
        <span>V2 ART DIRECTION</span>
        <strong>原創圓糯療癒模型屋</strong>
      </div>
      <div className="floating-label one"><Home size={15} />A6 生活提案</div>
      <div className="floating-label two"><ShoppingBag size={15} />可購買家具</div>
      <div className="preview-toolbar" aria-hidden="true"><span className="active"><Box size={16} /></span><span><SofaGlyph /></span><span><Palette size={16} /></span><span><Camera size={16} /></span></div>
    </div>
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
          <h1>挑一位小屋居民</h1>
          <p>原創圓糯居民會陪你在未來的家裡探索，小包顏色之後隨時都能更改。</p>
          <div className="avatar-grid">
            {outfits.map((color, index) => <button key={color} className={selected === index ? "selected" : ""} onClick={() => setSelected(index)}><AvatarFigure color={color} index={index} />{selected === index && <Check />}</button>)}
          </div>
          <button className="primary-button full large" onClick={onNext}>就讓他陪我<ArrowRight /></button>
        </div>
      </div>
    </main>
  );
}

function SetupScreen({ selectedFloorplan, setSelectedFloorplan, selectedTheme, setSelectedTheme, onBack, onEnter }: { selectedFloorplan: string; setSelectedFloorplan: (id: string) => void; selectedTheme: string; setSelectedTheme: (id: string) => void; onBack: () => void; onEnter: () => void }) {
  const selectedPlan = floorplans.find((floorplan) => floorplan.id === selectedFloorplan) ?? floorplans[0];
  const canEnter = selectedPlan.sourceStatus === "ready";
  return (
    <main className="setup-page">
      <header><Brand /><span className="setup-progress"><i className="done" /><i className="done" /><i className="active" />STEP 3 / 3</span><button className="text-button" onClick={onBack}><ArrowLeft />上一步</button></header>
      <section className="setup-content">
        <div className="setup-heading"><span className="co-brand"><Building2 size={15} />概念提案 · {proposalProject.builder} · {proposalProject.name}</span><h1>選擇有正式圖面依據的未來家。</h1><p>A6 與 A11 已依你提供的樣品屋大樣圖建立各自的可操作 3D Beta；其他戶型必須取得建商正式圖面後才開放。</p></div>
        <div className="setup-block"><div className="setup-block-title"><b>01</b><span><strong>選擇正式戶型</strong><small>不以提案示意冒充正式格局</small></span></div><div className="floorplan-grid">{floorplans.map((floorplan) => <button key={floorplan.id} className={`${selectedFloorplan === floorplan.id ? "selected " : ""}source-${floorplan.sourceStatus}`} onClick={() => setSelectedFloorplan(floorplan.id)}><FloorplanMini floorplanId={floorplan.id} accent={floorplan.accent} /><span><b className="source-status">{floorplan.sourceStatus === "ready" ? "可操作" : floorplan.sourceStatus === "indexed" ? "已索引" : "待圖面"}</b><strong>{floorplan.name}</strong><small>{floorplan.rooms}·{floorplan.area}</small><p>{floorplan.subtitle}</p></span>{selectedFloorplan === floorplan.id && <Check className="selection-check" />}</button>)}</div></div>
        <div className="setup-block"><div className="setup-block-title"><b>02</b><span><strong>選擇生活主題</strong><small>預設配置後仍可自由修改</small></span></div><div className="setup-theme-grid">{themes.map((theme) => <button key={theme.id} className={selectedTheme === theme.id ? "selected" : ""} onClick={() => setSelectedTheme(theme.id)} style={{ "--theme-a": theme.palette[0], "--theme-b": theme.palette[1], "--theme-c": theme.palette[2] } as CSSProperties}><span className="setup-theme-art"><b>{theme.emoji}</b><i /></span><strong>{theme.name}</strong><small>{theme.english}</small>{selectedTheme === theme.id && <Check className="selection-check" />}</button>)}</div></div>
        <button className="enter-experience" disabled={!canEnter} onClick={onEnter}><Gamepad2 />{canEnter ? "進入 3D 未來家" : "此戶型尚未完成 3D 建模"}<span>{selectedPlan.name}·{themes.find((theme) => theme.id === selectedTheme)?.name}</span><ArrowRight /></button>
      </section>
    </main>
  );
}

function EditorHeader({ mode, setMode, total, budget, saveState, renderCredits, avatarIndex, onBack, onBooking, onShare, onCart, onGallery, onMenu }: { mode: EditorMode; setMode: (mode: EditorMode) => void; total: number; budget: number; saveState: string; renderCredits: number; avatarIndex: number; onBack: () => void; onBooking: () => void; onShare: () => void; onCart: () => void; onGallery: () => void; onMenu: () => void }) {
  const pouchColors = ["#e07c62", "#6ea697", "#7389ba", "#d19a4f", "#8f75a8", "#53766a"];
  return <header className="editor-header"><button className="editor-back" onClick={onBack}><ArrowLeft /></button><Brand compact /><span className="header-divider" /><div className="mode-switch"><button className={mode === "explore" ? "active" : ""} onClick={() => setMode("explore")}><Gamepad2 />散步</button><button className={mode === "decorate" ? "active" : ""} onClick={() => setMode("decorate")}><MousePointer2 />佈置</button></div><div className="editor-head-spacer" /><span className={`save-state ${saveState === "error" ? "over" : ""}`}><Save size={15} />{saveState === "saved" ? "已自動儲存" : saveState === "error" ? "尚未儲存" : "儲存中…"}</span><button className="header-total"><small>目前總價</small><strong>{formatCurrency(total)}</strong><span className={total > budget ? "over" : ""}>{total > budget ? "超出預算" : "預算內"}</span></button><button className="icon-label" onClick={onGallery}><ImageIcon />作品 <b>{renderCredits}</b></button><button className="icon-label" onClick={onShare}><Share2 />分享</button><button className="icon-label" onClick={onCart}><ShoppingBag />購物車</button><button className="booking-button" onClick={onBooking}><CalendarDays />預約賞屋</button><button className="avatar-menu" onClick={onMenu}><AvatarFigure color={pouchColors[avatarIndex]} index={avatarIndex} /></button></header>;
}

function BookingModal({ booking, busy, onClose, onComplete, onCheckIn }: { booking: BookingSession | null; busy: boolean; onClose: () => void; onComplete: (form: BookingDraft) => Promise<void>; onCheckIn: () => Promise<void> }) {
  const [form, setForm] = useState<BookingDraft>({ date: "2026-08-08", slot: "14:00", name: "陳小居", phone: "0912 345 678", consent: true });
  const checkedIn = booking?.status === "checked_in";
  return <ModalShell onClose={onClose} wide>{booking ? <div className="booking-success"><div className="success-icon"><Check /></div><span className="eyebrow">概念預約流程已建立</span><h2>{new Date(booking.scheduledAt).toLocaleString("zh-TW", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</h2><p>目前資料只保存在居遊所提案環境，不會送至遠雄。正式合作接上 CRM 後，才會由建商確認預約。</p><div className="qr-card"><QrCode size={86} /><span><strong>報到碼 {booking.id.slice(-6).toUpperCase()}</strong><small>正式流程由接待人員掃描後完成報到</small></span></div><button className="primary-button full" onClick={() => void onCheckIn()} disabled={checkedIn || busy}>{checkedIn ? <><Check />已報到·發放 3 點</> : busy ? <>報到處理中…</> : <><QrCode />Alpha：模擬接待台掃碼</>}</button></div> : <div className="booking-form"><span className="eyebrow">預約賞屋 · 流程提案</span><h2>把這個家，變成真的。</h2><p>正式合作時，預約並實際到場即可免費解鎖 3 點寫實渲染。</p><div className="form-grid"><label><span>姓名</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label><span>手機</span><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><label><span>日期</span><input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label><label><span>時段</span><select value={form.slot} onChange={(event) => setForm({ ...form, slot: event.target.value })}><option>10:00</option><option>11:30</option><option>14:00</option><option>16:00</option></select></label></div><label className="consent"><input type="checkbox" checked={form.consent} onChange={(event) => setForm({ ...form, consent: event.target.checked })} /><span><strong>我了解這是概念提案，資料不會送至遠雄建設</strong><small>正式合作後，會另取得將聯絡資料與配置摘要提供給建商的明確同意。</small></span></label><button className="primary-button full large" disabled={!form.consent || !form.name || !form.phone || busy} onClick={() => void onComplete(form)}>{busy ? "安全送出中…" : <>體驗預約流程<ArrowRight /></>}</button></div>}</ModalShell>;
}

function RenderModal({ credits, busy, onClose, onSubmit, onBuy }: { credits: number; busy: boolean; onClose: () => void; onSubmit: () => Promise<void>; onBuy: () => void }) {
  return <ModalShell onClose={onClose}><div className="render-modal"><div className="render-preview"><span className="render-window" /><span className="render-sofa" /><span className="render-plant" /><b><Sparkles />AI 僅增強光影與窗景</b></div><span className="eyebrow">寫實作品</span><h2>把現在的鏡頭變成建築效果圖</h2><p>格局、家具型號與擺放位置完全保留，完成後自動放入作品庫。</p><div className="credit-line"><WalletCards /><span><small>可用渲染點數</small><strong>{credits} 點</strong></span><b>本次 -1</b></div>{credits > 0 ? <button className="primary-button full large" disabled={busy} onClick={() => void onSubmit()}><WandSparkles />{busy ? "安全扣點並排程中…" : "送出這個鏡頭"}</button> : <button className="primary-button full large" onClick={onBuy}><CreditCard />取得渲染點數</button>}<small className="render-note">失敗任務會以追加 ledger 自動退點；不會直接修改餘額。</small></div></ModalShell>;
}

function CartModal({ products, ownedTotal, onClose, onCheckout }: { products: FurnitureItem[]; ownedTotal: number; onClose: () => void; onCheckout: () => void }) {
  return <ModalShell onClose={onClose} wide><div className="cart-modal"><span className="eyebrow">自有品牌購物車</span><h2>把喜歡的配置帶回家</h2><div className="cart-list">{products.length ? products.map((product) => <div key={product.id}><ProductShape product={product} /><span><strong>{product.name}</strong><small>{product.sku}·{product.stock === "low_stock" ? "庫存不多" : "有現貨"}</small></span><b>{formatCurrency(product.price)}</b></div>) : <p>尚未加入自有品牌商品。</p>}</div><div className="cart-summary"><span><small>商品小計</small><strong>{formatCurrency(products.reduce((sum, product) => sum + product.price, 0) || ownedTotal)}</strong></span><small>聯盟商品會另以可追蹤連結開啟品牌網站。</small></div><button className="primary-button full large" onClick={onCheckout}><CreditCard />前往安全結帳</button></div></ModalShell>;
}

function ShareModal({ share, busy, onClose, onCopy, onRevoke }: { share: ShareSession | null; busy: boolean; onClose: () => void; onCopy: () => Promise<void>; onRevoke: () => Promise<void> }) {
  return <ModalShell onClose={onClose}><div className="share-modal"><div className="share-card-preview"><span>居遊所 Play Ground × {proposalProject.name} · 概念提案</span><strong>我的日光慢生活</strong><DollhousePreview /></div><h2>分享你的未來家</h2><p>作品預設為私人。連結是唯讀的，收件者可檢視商品清單，但無法修改原稿。</p>{share && <><label className="share-link-field"><span>有效至 {new Date(share.expiresAt).toLocaleDateString("zh-TW")}</span><input readOnly value={share.url} /></label></>}<button className="primary-button full" disabled={busy} onClick={() => void onCopy()}><Link2 />{busy ? "處理中…" : share ? "再次複製分享連結" : "產生並複製分享連結"}</button>{share && <button className="secondary-button full danger" disabled={busy} onClick={() => void onRevoke()}><Trash2 />撤銷這個連結</button>}<button className="secondary-button full" onClick={() => window.print()}><Download />下載社群分享圖</button></div></ModalShell>;
}

function MenuModal({ credits, designCount, workCount, onClose, onAdmin, onLogout }: { credits: number; designCount: number; workCount: number; onClose: () => void; onAdmin: () => void; onLogout: () => void }) {
  return <ModalShell onClose={onClose}><div className="menu-modal"><div className="menu-profile"><AvatarFigure color="#6ea697" index={1} /><span><strong>陳小居</strong><small>Alpha 測試帳號</small></span></div><button onClick={onAdmin}><LayoutDashboard />企業營運後台<ArrowRight /></button><button><WalletCards />渲染點數<span>{credits} 點</span></button><button><Save />我的配置<span>{designCount}</span></button><button><ImageIcon />寫實作品<span>{workCount}</span></button><button className="danger" onClick={onLogout}><LogOut />登出</button></div></ModalShell>;
}

function Gallery({ renderJobs, onBack, onNewRender }: { renderJobs: RenderJobRecord[]; onBack: () => void; onNewRender: () => void }) {
  return <main className="gallery-page"><header><button className="editor-back" onClick={onBack}><ArrowLeft /></button><Brand compact /><span /><button className="primary-button" onClick={onNewRender}><WandSparkles />產生新作品</button></header><section><span className="eyebrow">私人作品庫</span><h1>我的未來家</h1><p>所有作品預設只有你看得見，主動分享後才會建立連結。</p><div className="gallery-grid"><article className="saved-design"><div className="saved-dollhouse"><DollhousePreview /></div><span><small>3D 配置 · 概念提案</small><strong>{proposalProject.name}·日光慢生活</strong><p>7 件家具·已自動儲存</p></span><button onClick={onBack}>繼續編輯<ArrowRight /></button></article>{renderJobs.map((job) => <article className={`render-job ${job.status}`} key={job.id}><div className="render-job-visual"><span /><b>{job.status === "completed" ? <><Sparkles />寫實作品</> : job.status === "failed" ? <><X />已退還點數</> : <><Clock3 />{job.status === "queued" ? "等待渲染" : "背景處理中"}</>}</b></div><span><small>{new Date(job.createdAt).toLocaleString("zh-TW")}</small><strong>{job.status === "completed" ? "日光客廳·正式輸出" : job.status === "failed" ? "任務失敗·點數已退還" : job.status === "queued" ? "已排入寫實渲染佇列" : "正在增強光影與窗景"}</strong></span></article>)}</div></section></main>;
}

function AdminDashboard({ view, setView, onExit, onOpenExperience }: { view: AdminView; setView: (view: AdminView) => void; onExit: () => void; onOpenExperience: () => void }) {
  return <main className="admin-shell"><aside><Brand compact /><nav><button className={view === "builder" ? "active" : ""} onClick={() => setView("builder")}><Building2 />建商後台</button><button className={view === "platform" ? "active" : ""} onClick={() => setView("platform")}><LayoutDashboard />平台營運</button><span />{["建案內容", "預約名單", "3D 資產", "商品庫存", "渲染與點數", "網域與嵌入"].map((label, index) => <button key={label}><AdminIcon index={index} />{label}{index === 1 && <b>8</b>}</button>)}</nav><button className="admin-exit" onClick={onExit}><ArrowLeft />回到網站</button></aside><section className="admin-main"><header><div><span className="eyebrow">{view === "builder" ? `${proposalProject.builder} · ${proposalProject.name} · 概念提案` : "居遊所 Play Ground"}</span><h1>{view === "builder" ? "建案營運提案總覽" : "平台營運中心"}</h1></div><button className="secondary-button" onClick={onOpenExperience}><Eye />開啟消費者體驗</button></header>{view === "builder" ? <BuilderDashboard /> : <PlatformDashboard />}</section></main>;
}

function BuilderDashboard() {
  const shares = [38, 27, 21, 14];
  return <><div className="demo-data-banner">概念提案 · 以下數據與名單皆為展示資料</div><div className="stat-grid"><Stat icon={<Users />} label="匿名體驗（Demo）" value="1,284" delta="+18.4%" /><Stat icon={<CalendarDays />} label="同意預約（Demo）" value="86" delta="+12" /><Stat icon={<QrCode />} label="實際報到（Demo）" value="54" delta="62.8%" /><Stat icon={<Box />} label="3D 流量（Demo）" value="68%" delta="方案內" /></div><div className="admin-grid"><article className="chart-card"><div className="card-head"><span><strong>近 14 日體驗趨勢</strong><small>提案用匿名聚合示範</small></span><button>14 日<ChevronDown /></button></div><div className="bar-chart">{[32, 45, 39, 62, 55, 72, 68, 84, 76, 91, 88, 105, 112, 118].map((height, index) => <span key={index} style={{ height: `${height / 1.25}%` }}><i /></span>)}</div><div className="chart-labels"><span>7/18</span><span>7/22</span><span>7/26</span><span>7/31</span></div></article><article className="popular-card"><div className="card-head"><span><strong>坪數分帶偏好</strong><small>使用者進入 3D 的選擇</small></span></div>{floorplans.map((floorplan, index) => <div className="popular-row" key={floorplan.id}><FloorplanMini accent={floorplan.accent} /><span><strong>{floorplan.name}</strong><small>{shares[index]}% 體驗佔比</small></span><div><i style={{ width: `${shares[index] * 2}%` }} /></div></div>)}</article><article className="lead-card span-two"><div className="card-head"><span><strong>最新預約 · Demo</strong><small>正式版僅列出已同意分享資料的使用者</small></span><button><Download />CSV</button></div><table><thead><tr><th>姓名</th><th>意向坪數</th><th>配置主題</th><th>預約時間</th><th>狀態</th></tr></thead><tbody>{[["陳●居", "兩房 21 坪", "日光慢生活", "8/02 14:00", "待確認"], ["林●宇", "兩房 27 坪", "毛孩共居所", "8/03 11:30", "已確認"], ["許●安", "三房 39 坪", "親子成長家", "8/04 16:00", "已報到"]].map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={cell}>{index === 4 ? <span className={`status s${index}`}>{cell}</span> : cell}</td>)}</tr>)}</tbody></table></article></div></>;
}

function PlatformDashboard() {
  return <><div className="stat-grid"><Stat icon={<Building2 />} label="Pilot 戶型" value="A6" delta="客餐廳" /><Stat icon={<Store />} label="候選自有 SKU" value={String(commercialPilot.candidateOwnedSkus.length)} delta={`目標 ${commercialPilot.requiredOwnedSkuCount} 件`} /><Stat icon={<PackageCheck />} label="發布門檻" value={`${commercialPilotProgress.ready}/${commercialPilotProgress.total}`} delta="正式公開前" /><Stat icon={<LockKeyhole />} label="尚待解除" value={String(commercialPilotProgress.blocked)} delta="外部資料／串接" /></div><div className="admin-grid"><article className="pipeline-card span-two"><div className="card-head"><span><strong>A6 商業垂直切片</strong><small>未通過的門檻會阻擋正式發布</small></span><button><Eye />查看 Pilot</button></div><div className="pipeline-steps">{commercialPilot.releaseGates.map((gate, index) => <div key={gate.id} className={gate.status === "ready" ? "done" : ""}><span>{gate.status === "ready" ? <Check /> : index + 1}</span><strong>{gate.label}</strong><small>{gate.note}</small></div>)}</div></article><article className="revenue-card"><div className="card-head"><span><strong>收入引擎</strong><small>金額均為 Alpha 示意</small></span></div>{[["建案年費與用量", 46, "#e77f5f"], ["自有家具成交", 38, "#6e9f8c"], ["渲染點數", 11, "#e0b34f"], ["聯盟分潤", 5, "#7285b2"]].map(([name, percent, color]) => <div className="revenue-row" key={String(name)}><span style={{ background: String(color) }} /><strong>{name}</strong><b>{percent}%</b></div>)}</article><article className="usage-card"><div className="card-head"><span><strong>正式發布狀態</strong><small>Commercial Pilot Manifest</small></span></div><div className="usage-ring"><span><strong>{commercialPilotProgress.ready}/{commercialPilotProgress.total}</strong><small>已通過</small></span></div><div className="usage-legend"><span>戶型 <b>待 CAD</b></span><span>商品 <b>待資料包</b></span><span>付款／渲染 <b>待串接</b></span></div></article></div></>;
}

function ModalShell({ children, onClose, wide = false }: { children: ReactNode; onClose: () => void; wide?: boolean }) { return <div className="modal-backdrop" role="dialog" aria-modal="true"><div className={`modal-card ${wide ? "wide" : ""}`}><button className="modal-close" onClick={onClose} aria-label="關閉"><X /></button>{children}</div></div>; }
function SceneLoading() { return <div className="scene-loading"><div className="loading-house"><Home /></div><strong>正在搬進你的未來家…</strong><span><i /></span></div>; }
function VirtualPad({ onMove }: { onMove: (direction: { x: number; z: number }) => void }) {
  const bind = (x: number, z: number) => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => { event.currentTarget.setPointerCapture(event.pointerId); onMove({ x, z }); },
    onPointerUp: () => onMove({ x: 0, z: 0 }),
    onPointerCancel: () => onMove({ x: 0, z: 0 }),
    onPointerLeave: () => onMove({ x: 0, z: 0 }),
  });
  return <div className="virtual-pad" aria-label="居民移動方向"><button aria-label="向前" {...bind(0, -1)}>↑</button><button aria-label="向左" {...bind(-1, 0)}>←</button><button aria-label="向後" {...bind(0, 1)}>↓</button><button aria-label="向右" {...bind(1, 0)}>→</button></div>;
}
function Brand({ compact = false, centered = false }: { compact?: boolean; centered?: boolean }) { return <div className={`brand ${compact ? "compact" : ""} ${centered ? "centered" : ""}`}><span className="brand-mark"><i /><i /><i /></span><span><strong>居遊所</strong><small>Play Ground</small></span></div>; }
function AvatarFigure({ color, index }: { color: string; index: number }) { return <span className={`avatar-figure mascot-${index % 3}`} style={{ "--pouch": color } as CSSProperties}><i className="mascot-ear left" /><i className="mascot-ear right" /><i className="mascot-body"><b className="mascot-eye left" /><b className="mascot-eye right" /><b className="mascot-cheek left" /><b className="mascot-cheek right" /><b className="mascot-mouth" /><b className="mascot-strap" /><b className="mascot-pouch" /></i><i className="mascot-foot left" /><i className="mascot-foot right" /></span>; }
function CategoryGlyph({ category }: { category: keyof typeof categoryLabels }) { const glyphs = { all: "✦", living: "◜", dining: "●", bedroom: "▤", decor: "✿" }; return <b aria-hidden="true">{glyphs[category]}</b>; }
function OnboardingArt() { return <div className="onboarding-art onboarding-key-art" role="img" aria-label="原創居民的粉彩模型屋"><span>正式美術方向 · V2</span></div>; }
function FloorplanMini({ floorplanId, accent }: { floorplanId?: string; accent: string }) {
  const resolvedFloorplanId = floorplanId ?? floorplans.find((floorplan) => floorplan.accent === accent)?.id ?? "";
  const runtime = getFloorplanRuntime(resolvedFloorplanId);
  if (!runtime) return <span className="floorplan-mini pending" style={{ "--accent": accent } as CSSProperties}><span>圖面<br />待匯入</span></span>;
  const { width, depth } = runtime.shell.dimensions;
  return (
    <span className="floorplan-mini" style={{ "--accent": accent } as CSSProperties}>
      <svg viewBox={`0 0 ${width} ${depth}`} aria-label={`${resolvedFloorplanId.toUpperCase()} 戶型輪廓`}>
        <rect x="0.08" y="0.08" width={width - 0.16} height={depth - 0.16} rx="0.08" className="plan-boundary" />
        {runtime.shell.walls.filter((wall) => wall.kind !== "window").map((wall) => (
          <rect key={wall.id} x={wall.center[0] + width / 2 - wall.size[0] / 2} y={wall.center[1] + depth / 2 - wall.size[1] / 2} width={wall.size[0]} height={wall.size[1]} rx="0.025" />
        ))}
      </svg>
    </span>
  );
}
function ProductShape({ product, large = false }: { product: FurnitureItem; large?: boolean }) { return <span className={`product-shape shape-${product.shape} ${large ? "large" : ""}`} style={{ "--shape": product.color, "--shape-accent": product.accent } as CSSProperties}><i /><b /><em /></span>; }
function SofaGlyph() { return <span className="sofa-glyph" />; }
function Stat({ icon, label, value, delta }: { icon: ReactNode; label: string; value: string; delta: string }) { return <article className="stat-card"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div><b>{delta}</b></article>; }
function AdminIcon({ index }: { index: number }) { const icons = [<Home key="home" />, <CalendarDays key="calendar" />, <Box key="box" />, <PackageCheck key="package" />, <WandSparkles key="sparkles" />, <Link2 key="link" />]; return icons[index]; }

function buildInitialScene(floorplanId: string, themeId: string): SceneObjectV1[] {
  if (themeId === "empty") return [];
  const furnitureIds = themeFurnitureIds[themeId as keyof typeof themeFurnitureIds] ?? themeFurnitureIds.sunny;
  return buildSceneFromIds(floorplanId, themeId, furnitureIds);
}

function buildSceneFromIds(floorplanId: string, themeId: string, furnitureIds: readonly string[]): SceneObjectV1[] {
  const runtime = getFloorplanRuntime(floorplanId) ?? getFloorplanRuntime("bh7-a6")!;
  const materialVariant = { sunny: 0, urban: 1, family: 2, pet: 3 }[themeId] ?? 0;
  return furnitureIds.map((id) => {
    const product = catalog.find((entry) => entry.id === id)!;
    const position = runtime.initialPositions[id];
    const initialAngle = ["shelf-cabin", "ikea-kallax"].includes(id) ? -Math.PI / 2 : ["sofa-cloud", "chair-breeze", "ikea-saltsjobaden", "ikea-ekenaset"].includes(id) ? Math.PI : 0;
    return { id: `scene-${id}`, sku: product.sku, assetVersion: product.assetVersion, position: { x: position[0], y: 0, z: position[1] }, rotation: quaternionFromY(initialAngle), materialVariant };
  });
}
function productPartnerLabel(product: FurnitureItem) {
  if (product.brandKind === "owned") return "自有品牌";
  if (product.partnershipStatus === "demo") return `${product.brand} 商品模擬 · 未合作`;
  return product.cashbackRate ? `聯盟回饋 ${product.cashbackRate}%` : "聯盟品牌";
}
function apiMessage(error: unknown, fallback: string) { return error instanceof ApiClientError ? error.message : fallback; }
