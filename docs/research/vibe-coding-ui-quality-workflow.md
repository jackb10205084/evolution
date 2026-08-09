# 用 AI Vibe Coding 提升 UI／UX 與 3D 成果品質：居遊所工作流研究

> 研究日期：2026-08-09  
> 適用專案：居遊所 Play Ground  
> 資料範圍：官方文件、作者本人原始貼文、原始規格與官方 repo；不以二手教學文章作為技術依據。

## 摘要結論

目前成果與預期有落差，主要不是「提示詞不夠華麗」，而是工作流少了三個必要層次：

1. **視覺意圖沒有被寫成可執行的契約。**「可愛、溫馨、有質感、像某遊戲」屬於方向，不能直接當驗收標準。AI 需要知道每一張參考圖分別負責構圖、色彩、材質或光影，以及哪些元素絕對不能改。
2. **介面、3D 資產與互動程式混在同一輪生成。**程式化幾何適合做碰撞和流程原型，不會自然成為正式美術；AI 3D 生成適合做家具與裝飾物候選，也不應負責精準戶型、尺度、門窗與碰撞規則。
3. **沒有固定的視覺回饋迴圈。**若每次只憑「看起來不夠好」重新生成整頁，模型會同時改掉多個變因，無法累積品質。應固定 viewport、資料與相機，每輪只改善一項視覺差異，並留下 before／after 截圖與可接受基準。

Andrej Karpathy 最初描述的「vibe coding」本來就帶有「看畫面、說需求、執行、貼錯誤」的即興性，且指向拋棄式週末專案；正式產品若仍用完全即興的方式，自然容易出現設計漂移。可參考他的[原始貼文](https://x.com/karpathy/status/1886192184808149383)。對居遊所更合適的做法是：**保留自然語言快速迭代，但升級為 specification-first、reference-driven、evidence-based 的 agentic development。**

## 居遊所目前不是「美感形容詞不足」，而是規格與程式互相衝突

這次直接交叉檢查了正式規格 `docs/v2-key-art-hero-room.md` 與目前執行中的 `app/components/experience-canvas.tsx`。最優先問題如下：

| 嚴重度 | 已核准規格 | 現行實作 | 結果 |
|---|---|---|---|
| P0 | 高明度漫射光、極低對比；禁止方向性金色光束、深投影、重接觸陰影與電影級寫實 | 啟用 `ACESFilmicToneMapping`、主方向光 `1.65` 且投影，另有兩盞方向光、半球光與 `ContactShadows` | 即使模型輪廓變可愛，畫面仍會顯得厚重、偏黃、塑膠或「太 3D」 |
| P0 | A6 殼體應依正式平面圖、隔間尺寸圖與立面圖重建 | `Dollhouse` 仍是程式內硬寫的簡化 L 型房間與裝飾 | 畫面無法同時滿足建案可信度與正式商品配置 |
| P0 | `public/key-art/v2/09-a6-original-ultra-kawaii-mascot.png` 是唯一正式美術母版 | 執行時仍載入既有 `mascot-resident.glb`，且色盤以木色地板與褐色陰影為主 | Key Art 是文件附件，尚未成為 runtime 的 source of truth |
| P1 | 正式資產先通過居民、沙發、茶几同場驗收，才批次擴充 | 場景已混入大量程式化家具、小物、窗景與日照效果 | 每次回饋同時牽動太多變因，難以知道究竟是哪一層不合格 |
| P1 | UI／3D 變更需要固定視角、viewport 與視覺證據 | `package.json` 有 lint、build、test，尚無正式 screenshot baseline／visual regression 指令 | agent 只能以「程式可編譯」代替「畫面已達標」 |

此外，`app/prototype/3d/gamefeel-prototype.tsx` 已明確標記為 prototype。它應繼續作為方向試驗場，但不能再直接成為正式視覺品質的基礎。正式版要另設 V2 visual gate：先驗收靜態 UI shell、A6 空間殼體與三件 hero assets，再接回完整互動。

因此下一輪不應再下「整體更可愛、更接近某遊戲」的提示，而應先做三件事：移除現行燈光與 Style Bible 的矛盾、用正式 A6 殼體替換簡化房間、建立固定截圖基準。這三項未完成前繼續生成家具，只會把風格漂移擴大。

## 第一手資料顯示，高品質團隊怎麼使用 coding agent

### 1. 先探索與計畫，再動手實作

OpenAI 團隊建議大型變更先用 Ask Mode 產生實作計畫，再切換到 Code Mode；任務最好切成約一小時或數百行程式的範圍，提示詞則像 GitHub issue 一樣附上檔案、元件、差異與可參照的既有模式。[How OpenAI uses Codex](https://openai.com/business/guides-and-resources/how-openai-uses-codex/)

Anthropic 的官方最佳實務也把流程拆成 Explore → Plan → Implement → Commit，並明確指出直接跳到實作可能會把錯誤問題解得很完整；複雜工作應先讀專案、提出計畫、由人審查，再開始改動。[Best practices for Claude Code](https://code.claude.com/docs/en/best-practices)

**套用到居遊所：**每一輪應只處理一個可展示切片，例如「A6 Hero Room 的俯視模式畫面」，不要在同一個提示中同時要求首頁、登入、角色、3D、購物車、後台與正式渲染。

### 2. 給 agent 可驗證的目標，不要只給形容詞

Anthropic 官方文件建議提供測試案例、預期輸出或設計截圖，並要求 agent 比較完成畫面與參考圖；有可驗證目標時，agent 才能自己修正。[How Claude Code works：Give Claude something to verify against](https://code.claude.com/docs/en/how-claude-code-works#give-claude-something-to-verify-against)

OpenAI 實際用 Codex 建產品時，把瀏覽器 DOM、截圖、導覽、log 與 metric 都接進 agent 環境，使它能重現問題、驗證修正並直接推理 UI 行為，而不是寫完程式就宣稱完成。[Harness engineering](https://openai.com/index/harness-engineering/)

**套用到居遊所：**「有沒有更可愛」要改寫成可觀察條件，例如：

- 主背景與大型表面的明度差不超過指定範圍，禁止重 AO、黑色投影與電影式逆光。
- 家具輪廓以圓角、低多邊形和 2–3 階明暗為主，不使用寫實木紋與高光。
- 1440×900 固定截圖中，Hero Room 在 3D 畫布內的可見占比至少 75%；家具庫與商品資訊使用可收合或覆蓋式面板，面板寬度則由核准 wireframe 鎖定。
- 主要 CTA 在不捲動時可見；家具選取、拖曳、非法擺放、儲存中、缺貨各有固定狀態。

這些數字是專案決策，不是業界唯一答案；價值在於讓每輪可以對照，而不是讓 agent 猜「質感」。

### 3. 參考圖必須分工，不能整包叫 AI「融合」

v0 官方建議使用高解析截圖；要重現整體介面就提供完整畫面，要修一個區域就緊密裁切，並用文字補充行為、流程及 edge cases。[v0 Screenshots and Files](https://v0.app/docs/screenshots)

v0 的 Design Mode 進一步把選取元件時的局部截圖連同文字指令一起送給 agent，且每次套用都形成可檢視 diff、可回復的新版本，證明「局部選取＋局部修改＋版本比較」比反覆重生整頁更可靠。[v0 Design Mode](https://v0.app/docs/design-mode)

居遊所應為每張參考圖指定唯一職責：

| 參考來源 | 只負責 | 不負責 |
|---|---|---|
| V2 第三版 Key Art | 角色圓糯度、家具圓角比例、色盤、線條 | 精準戶型、正式 UI 配置 |
| A6 正式建築圖 | 牆、門、窗、柱、房間尺寸 | 卡通材質、光影、角色 |
| 核准的編輯器 wireframe | 欄位層級、面板尺寸、CTA 位置 | 家具造型與 3D 材質 |
| 指定家具商品照／尺寸 | SKU 外觀、比例、顏色與尺寸 | 場景光影與鏡頭 |
| 一張光影樣板 | 光源方向、陰影軟硬、對比 | 構圖、模型形狀、UI |

提示詞要明說 `Reference precedence`，例如建築衝突時以正式圖為準，造型衝突時以核准 Key Art 為準。不要寫「融合以上所有圖片」，那會讓模型把不該混合的層次平均化。

### 4. 把設計系統放進 repo，讓 agent 每次看到同一套規則

v0 的 Design Systems 2.0 可以從 GitHub、實際 consumer app、Figma frame、Storybook 與文件讀入元件、props、token 和 starter app，並保存成可重複套用的 design-system skill。[v0 Design Systems 2.0](https://v0.app/docs/design-systems-2)

Tailwind 將色彩、字體、陰影、圓角與 breakpoint 等低階決策視為 design token，並透過 theme variables 使 utilities 與 CSS variable 共用同一來源。[Tailwind theme variables](https://tailwindcss.com/docs/theme)

若採用 shadcn/ui，其官方定位是「用它建立自己的元件庫」：程式碼直接進專案、介面一致、可組合，而且 agent 能讀懂與修改，不是從大量互不相容的 UI 套件拼貼。[shadcn/ui Introduction](https://ui.shadcn.com/docs)

**對居遊所的建議：**先建立小而嚴格的 HomePlay UI kit，不急著全面導入大量元件。最低集合包括：

- `GameButton`：primary／secondary／quiet／danger，固定高度與圓角。
- `GamePanel`：家具庫、商品資訊、設定面板共用同一外框、標題列與關閉行為。
- `PriceBadge`、`StockBadge`、`AffiliateBadge`。
- `FurnitureCard`：default／hover／selected／unavailable／affiliate。
- `ModeSwitch`：角色探索／俯視佈置。
- `BudgetMeter`、`Toast`、`Modal`、`Tooltip`、`EmptyState`、`Skeleton`。

所有頁面只能使用 semantic tokens，例如 `surface-cream`、`ink-cocoa`、`accent-coral`、`shadow-soft`，禁止每頁自行新增接近但不同的米色、褐色、陰影與圓角。

### 5. 視覺驗收要變成測試，不是最後才人工觀看

Storybook 將每個 story 視為元件的一個離散狀態；視覺測試會對每個 story 截圖並與已核准 baseline 比較，適合檢查 layout、color、size、contrast 等視覺回歸。[Storybook Visual Tests](https://storybook.js.org/docs/writing-tests/visual-testing)

Playwright 原生支援 `expect(page).toHaveScreenshot()`，第一次產生 baseline，後續比對差異；官方也提醒不同 OS、瀏覽器版本與硬體可能造成渲染差異，因此 baseline 與 CI 應固定環境。[Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots)

**居遊所的最小視覺測試矩陣：**

- Viewport：1440×900、1024×768、iPad 11 吋橫向。
- 畫面：聯名首頁、登入、戶型／主題、Hero Room 俯視、角色探索、商品抽屜、購物車、預約。
- 3D 狀態：載入中、已載入、選取家具、拖曳、旋轉、碰撞禁止、動線警告、超出預算、WebGL fallback。
- 測試資料固定：相同使用者、相同 SKU、相同庫存、相同 SceneSnapshot、相同相機。
- 動態內容凍結：時間、動畫、隨機 seed、遠端圖片與價格回應。

每輪交付至少要有：實際 URL、固定 viewport 截圖、參考圖、diff／差異說明、互動測試結果與仍未達標項目。沒有證據，不得只回報「已完成」。

## 建議的居遊所實作工作流

### Gate 0：鎖定單一藝術母版

已選擇的 V2 正式母版 `09-a6-original-ultra-kawaii-mascot.png` 作為**原創圓糯療癒方向**，接著必須補齊一頁 Visual Contract：

- 8–12 個核心色票與用途。
- 字體、字級、行高、數字價格樣式。
- 圓角、外框粗細、陰影、動畫速度。
- 角色與家具的比例、輪廓、材質、明暗階數。
- 允許／禁止清單：例如允許紙感與柔和接觸陰影；禁止強 AO、玻璃擬態、霓虹漸層、照片級反射、IP 角色特徵。
- 3 張 approved examples 與 3 張 rejection examples，逐張標注通過／不通過原因。

此 gate 只審視覺，不寫正式互動程式。

### Gate 1：先做可核准的 UI shell

以靜態／mock 3D 圖先完成一個固定 1440×900 的編輯器畫面，確認資訊層級、面板比例、色彩與 CTA。此時不要讓「3D 模型還不好」干擾 UI 決策，也不要碰金流、登入或後台。

驗收條件：家具庫、場景、商品資訊、模式切換、預算、儲存、分享、預約賞屋均在正確層級；三種元件狀態與響應式畫面通過後才進 Gate 2。

### Gate 2：建立 Hero Room 的精準 3D 殼體

A6 牆、門、窗、柱與固定設備由正式圖面在 Blender／CAD 邏輯中精準建立；輸出前統一座標、原點、命名與公尺尺度。glTF 規格要求線性距離以公尺表示，座標為右手系、+Y 向上；這可以成為 `SceneSnapshotV1` 與資產驗證器的客觀標準。[glTF 2.0 Coordinate System and Units](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#coordinate-system-and-units)

Blender 官方文件把 glTF 定位為 web／native runtime 傳輸格式；它會保存 mesh、PBR material、texture、camera、light 與 animation，但曲線等非 mesh 資料要先轉換，quads 與 n-gons 也會轉為 triangles。[Blender glTF 2.0](https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html)

驗收條件：尺寸誤差、門窗位置、房間邊界、鏡頭 framing 與 PDF 對照通過；此 gate 不要求家具數量完整。

### Gate 3：AI 生成家具與裝飾物候選，Blender 做正式化

Tripo 官方 API 支援 image-to-model、固定 seed、face limit、smart low poly、parts、UV、texture 與 PBR；multiview-to-model 則要求 front／left／back／right 的一致視圖，並把 P1 模型定位於低面數、遊戲與 stylized assets。[Tripo Generation](https://platform.tripo3d.ai/docs/generation)

因此正確分工是：

| 工作 | AI 3D／Tripo | Blender／資產管線 | 前端程式 |
|---|---:|---:|---:|
| 家具造型候選、裝飾物 | 主責 | QA／修正 | 不負責 |
| 精準建築格局與尺寸 | 不採用 | 主責 | 只讀取 |
| 拓樸、pivot、scale、UV、材質統一 | 初稿 | 主責 | 驗證 |
| LOD、壓縮、命名、版本 | 可輔助 | 主責 | 載入／切換 |
| 碰撞器、擋門、房間邊界 | 不負責 | 可輸出 proxy | 主責規則 |
| 拖曳、旋轉、undo／redo、價格 | 不負責 | 不負責 | 主責 |

Rapier 明確把 collider 定義為防止物體互相穿透的幾何形狀，並提醒 dynamic rigid body 不宜直接使用 triangle mesh collider，非凸物件應考慮 convex decomposition／compound shape。[Rapier Colliders](https://rapier.rs/docs/user_guides/javascript/colliders/)

正式資產流程建議一次只處理一種家具 archetype：

1. 從核准 Key Art 或商品照製作乾淨、無場景、正交感的四視圖。
2. 用同一 seed、同一 face budget 生成 3 個候選，不整批盲目產生。
3. 先審 silhouette 與比例；不合格就停，不花 texture／refine 點數。
4. 合格模型進 Blender：套用 transform、修法線、定 pivot、依 SKU 尺寸縮放、重做統一 toon 材質、建立簡化 collider 與 LOD。
5. 以 GLB 輸出並在 Three.js 的官方 `GLTFLoader` 實際測載；若使用 Draco、KTX2 或 Meshopt，必須設定相應 loader／decoder。[Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)
6. 在固定 Hero Room 鏡頭中與 Key Art 並排驗收，通過後才批次做同系列家具。

Tripo 的價格按生成、texture quality 與後處理計點，因此「幾何先審、材質後做」也能避免把額度浪費在輪廓錯誤的模型。[Tripo Pricing & Billing](https://platform.tripo3d.ai/docs/billing)

### Gate 4：把真實 3D 接回互動，再逐一開功能

建議的垂直切片順序：

1. A6 客餐廳殼體＋1 張沙發＋1 張茶几＋1 盞燈。
2. 俯視模式拖曳、90°／自由旋轉、合法／非法擺放。
3. 家具卡、商品抽屜、價格與選取同步。
4. 角色探索模式與靠近商品提示。
5. 自動儲存、分享、預約賞屋。
6. 擴充家具庫、其他房間與其他戶型。

每增加一層就重新跑固定截圖、互動與效能測試。不要等所有家具與功能完成後才第一次審美術。

## 居遊所可直接使用的提示詞模板

### A. 探索／稽核提示詞（不改程式）

```text
先不要修改任何檔案。請以產品設計師、遊戲 UI art director 與前端工程師三種角度，
檢查目前 [URL／route] 與相關程式。

目標使用者：購屋前、在桌面或 iPad 規劃 A6 戶型家具並預約賞屋的消費者。
核心任務：進入編輯器後 30 秒內理解如何選家具、拖曳、看總價及預約賞屋。

請先讀：
- [Visual Contract 路徑]
- [核准 Key Art 路徑]
- [UI wireframe 路徑]
- [SceneSnapshot／domain spec 路徑]

輸出：
1. 現況截圖與 viewport。
2. 依「資訊層級、視覺一致、互動可理解、3D framing、響應式」分類問題。
3. 每項問題附畫面證據、嚴重度與最小修正方式。
4. 提出只涵蓋一個垂直切片的實作計畫。
5. 等我核准計畫，不要寫程式。
```

### B. 視覺契約提示詞

```text
請根據附件建立「居遊所原創圓糯療癒」Visual Contract，不要寫頁面程式。

Reference precedence：
1. 建築與尺寸：[A6 正式圖]
2. 角色、家具圓糯度、色盤、輪廓：[核准 Key Art]
3. 介面配置：[核准 wireframe]
4. 光影：[光影樣板，只參考光影]

請輸出可直接實作的 design tokens：色彩用途、字級、spacing、radius、border、shadow、
animation duration/easing；再定義 Button、Panel、FurnitureCard、Badge、ModeSwitch 的所有狀態。

必須：高明度、低對比、柔和漫射、2–3 階卡通明暗、可辨識的可購買家具。
禁止：強 AO、長投影、電影式逆光、玻璃擬態、霓虹漸層、照片級反射、
任何現有動漫／遊戲角色的五官、輪廓、標誌或專有 UI。

最後提供「通過／不通過」檢核表，使另一個 coding agent 能機械式自查。
```

### C. 單一畫面實作提示詞

```text
只實作 A6 Hero Room 的 1440×900 俯視佈置畫面，不改登入、首頁、後台或資料模型。

來源優先順序：
- layout：[wireframe]
- visual tokens：[Visual Contract]
- 3D framing：[核准 Hero Room 截圖]
- 元件：只能重用 [HomePlay UI kit 路徑]

必須保留：現有家具拖曳、旋轉、選取、價格計算和自動儲存行為。
本輪只改：資訊層級、面板比例、色彩、圓角、陰影與 3D camera framing。
禁止：新增功能、改 domain type、改商品資料、替換 3D 資產。

完成定義：
1. 在 1440×900、1024×768、iPad 橫向截圖。
2. 與基準圖並排，逐項列出差異。
3. 執行 lint、build、相關互動測試。
4. 若任何 acceptance criterion 未達成，繼續修正；不要只宣稱完成。
```

### D. 視覺校正提示詞（每輪只動一個變因）

```text
這不是重新設計，只是針對目前畫面的單一視覺校正。

保留：DOM 結構、元件位置、文字、3D 相機、家具與所有互動。
只改：光影。

把 directional/golden lighting 改成高明度、近無影的柔和漫射日光；
降低 ambient occlusion、shadow opacity 與明暗跨度；保留可讀的接觸陰影，
禁止 bloom、vignette、長投影及暖黃色偏色。

完成後在相同資料、相同相機、相同 1440×900 viewport 重新截圖，
輸出 before／after，並列出實際改動的 token 或燈光參數。不要動其他項目。
```

### E. Tripo 家具資產提示詞基底

```text
Original stylized game-ready [furniture type], isolated single object, centered,
clean readable silhouette, rounded chunky proportions, softly beveled edges,
low-poly but intentional topology, high-key pastel colors, matte painted surface,
minimal material variation, no dramatic lighting, no cast shadow, no floor,
no room background, no text, no logo, no character, no extra props,
front facing +Z, upright +Y, complete object visible from all sides.

Preserve product proportions from the supplied dimension sheet:
width [x] m, depth [y] m, height [z] m.

Style constraints: use the supplied original HomePlay style reference only for
roundness, palette and material treatment; do not reproduce any existing IP.
```

實際生成時應優先提供一致四視圖，而不是只靠文字；Tripo 的 multiview 規格本身也要求固定的 front／left／back／right 順序與一致物件。[Tripo Multiview to Model](https://platform.tripo3d.ai/docs/generation#multiview-to-model)

## 建議放進 `AGENTS.md` 的內容

`AGENTS.md` 是給 coding agent 的專案 README，可記錄 setup、測試、coding convention、安全注意事項；大型 monorepo 可使用較近的巢狀檔覆蓋規則。[AGENTS.md open specification](https://agents.md/)

但 OpenAI 的實際經驗是不要把它寫成千頁百科全書：短 `AGENTS.md` 應作為目錄，詳細內容放在版本化的 `docs/`；巨大的單檔會吃掉 context、失去優先順序並快速腐化。[Harness engineering：repository knowledge](https://openai.com/index/harness-engineering/)

居遊所根目錄的 `AGENTS.md` 建議只放：

- 一句產品目的與第一轉換目標（預約賞屋）。
- 核准 Visual Contract、domain spec、SceneSnapshot、3D asset spec 的路徑。
- `npm run dev`、`lint`、`build`、`test` 與視覺測試指令。
- 「正式 UI 只能使用 HomePlay tokens／components」。
- 「AI 3D 不生成精準建築殼體；所有 GLB 以公尺、+Y up、+Z front」。
- 「提交 UI 變更必附固定 viewport 截圖；3D 變更附固定 camera 截圖與 FPS／載入資料」。
- 「不使用現有動漫／遊戲 IP 的角色、圖示、介面與音效」。
- 連到較深入文件，而非複製整份規格。

## 建議的第一個兩週修正週期

### 第 1–2 天：建立基準，不改大量程式

- 固定目前首頁、角色、編輯器的三個 viewport 截圖。
- 完成 Visual Contract、approved／rejected board 與 UI wireframe。
- 將正式母版 `09` 從一張好看的圖拆成 token、元件狀態與 3D style bible。

### 第 3–5 天：UI shell 垂直切片

- 先用核准 Hero Room mock 圖做編輯器 UI shell。
- 建立最小 HomePlay UI kit 與 Storybook states。
- 人工審核 1440×900 和 iPad 橫向；不通過就只改 UI，不碰 3D。

### 第 6–9 天：Hero Room 與三件正式資產

- 精準建立 A6 客餐廳殼體。
- 只生成沙發、茶几、立燈三個 asset archetype。
- Blender 統一 silhouette、尺寸、pivot、材質、LOD、collider，輸出 GLB。
- 在固定相機中與 Key Art 並排驗收。

### 第 10–12 天：互動閉環

- 接回拖曳、旋轉、碰撞禁止、商品資訊與即時總價。
- 建立 Playwright 的核心路徑與固定 screenshot baseline。
- 測試 Safari／Chrome 桌面與 iPad 橫向。

### 第 13–14 天：只做 polish 與證據

- 不增加功能；只處理 spacing、層級、光影、載入與互動回饋。
- 錄製一段「選家具 → 擺放 → 看價格 → 預約賞屋」短片。
- 以核准門檻判斷是否擴充家具庫，沒有通過就不批次花 Tripo 點數。

## 最後判斷

要更接近預期，不是再找一句萬能提示詞，而是讓 agent 每次都能回答四件事：

1. **唯一真相在哪裡？**——Visual Contract、正式圖、wireframe、domain spec。
2. **這輪只改什麼？**——一個畫面、一個垂直切片或一個視覺變因。
3. **怎麼知道真的更好？**——固定截圖、可操作狀態、測試、效能與差異證據。
4. **哪一段由誰負責？**——AI 3D 產候選、Blender 正式化、程式負責規則與互動。

這套做法會比「一次要求整站更可愛、更有質感」慢一點進入第一輪程式修改，但會大幅減少整頁重做、畫風漂移與 3D 額度浪費；一旦 tokens、元件、資產規格與視覺 baseline 建立好，後續頁面與戶型的生成速度才會真正累積。
