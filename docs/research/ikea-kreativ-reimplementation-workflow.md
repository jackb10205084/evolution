# IKEA Kreativ 公開能力與居遊所獨立重建工作流

> 研究日期：2026-08-12。這是產品與工程研究，不是法律意見。資料以 IKEA 官方產品說明，以及 Three.js、React Three Fiber、Khronos glTF、Rapier 的官方文件為主。本文不逆向、解包或複製 IKEA 的私有程式、API、模型、影像或品牌表現。

## 結論

居遊所可以合法風險較低地**獨立實作同類型的瀏覽器家具配置能力**，但應複製「問題與能力類別」，不能複製 IKEA 的品牌表現、資產、畫面、文案、操作細節或私有演算法。

最適合居遊所的範圍不是重做 IKEA 的照片擦除或 LiDAR 掃描，而是：以建商正式圖面建立精準空屋，載入有正式尺寸與 SKU 的 GLB 家具，提供選取、拖曳、旋轉、替換、碰撞、儲存、分享、購物與預約。這與現有 Next.js／R3F／Rapier 架構一致，也直接服務建案聯名與家具交易。

## IKEA 官方公開能力

IKEA 官方將 Kreativ 描述為三種入口：[自己的空間、3D room builder、50+ virtual showrooms](https://www.ikea.com/us/en/customer-service/knowledge/articles/b548fdg1-8c6f-448e-97c5-6f78e114c504.html)。公開可確認的能力包括：

- 在 app 拍攝廣角房間，或在 LiDAR 裝置進行 full room scan；web 可手動輸入房間尺寸建立 3D room。擷取只能從 app 開始，但相同帳號可在 web 繼續設計。[官方掃描說明](https://www.ikea.com/us/en/customer-service/knowledge/articles/e86d70g6-3673-4306-b373-20f7cg7fd5ed.html)、[app / web 差異](https://www.ikea.com/us/en/customer-service/knowledge/articles/a6fd8d36-b079-46bd-af63-e429217eff4d.html)
- 照片／廣角模式可選取黃框物件逐件擦除、Hide All／Show All；full room scan 直接從空房開始。[官方 Eraser 說明](https://www.ikea.com/us/en/customer-service/knowledge/articles/6226432c-c257-4d49-bf04-cede16cae5c5.html)
- 商品以等比例加入空間，可新增、移動、旋轉、替換；部分表面可放配件，部分牆面可掛畫。[官方功能表](https://support.home-design.ikea.com/hc/en-ie/articles/360038999793-What-can-I-design-in-my-space)
- 使用者可從預製空房或已佈置 showroom 開始，儲存版本、分享；web 支援 remix 編輯連結，app 分享則以檢視為主。[官方產品說明](https://www.ikea.com/us/en/customer-service/knowledge/articles/b548fdg1-8c6f-448e-97c5-6f78e114c504.html)
- 可將單件或整個 room 的商品加入購物車。部分品類如 textiles、部分 ceiling-mounted items 與完整 kitchen design 尚未涵蓋。[IKEA 官方說明](https://www.ikea.com/es/en/customer-service/knowledge/articles/cdec354g-edc2-4gf9-gcb3-c90bb9g761b7.html)
- 儲存需要登入，而且官方說明目前不是自動儲存；可 Save a Copy 建立另一版本。[官方儲存說明](https://www.ikea.com/us/en/customer-service/knowledge/articles/ad2fc851-b8c3-4eee-94f4-12740d2b0282.html)

這些資料只能證明公開功能與使用流程，不能證明它使用哪個 renderer、scene graph、AI model、深度估測、遮擋、光照匹配、資料表或碰撞算法。Ingka 公開資料只在高層次表示它結合 spatial computing、machine learning 與 3D mixed reality；這不足以重建內部技術。[Ingka FY22 報告](https://www.ingka.com/static/ingka-group-our-progress-fy22-better-homes.pdf)

## 黑箱觀察邊界

### 可以觀察並寫成自己的規格

- 公開頁面可見的任務流程、資訊架構、狀態名稱與功能是否存在。
- 在自己的正常帳號與測試資料下，記錄點擊／拖曳／旋轉／替換／儲存／分享的前置條件、結果、錯誤與空狀態。
- 用自有家具尺寸建立測試案例，觀察畫面可理解性、控制回饋與使用者是否知道下一步；不記錄或擷取 IKEA 商品資產。
- 測量自己瀏覽器看到的載入時間、frame rate、request 數量與傳輸量，作為效能目標；只記統計，不下載或重用對方資源。
- 檢查鍵盤焦點、觸控、縮放、reduced-motion、WebGL unavailable 等公開行為。
- 將觀察寫成中性的 capability matrix，例如「選取商品後顯示尺寸／價格」；不寫其 DOM、class name、內部 endpoint 或 bundle 實作。

### 不應做或複製

- 不繞過登入、地區、robots、rate limit、DRM、簽名 URL 或其他技術限制。
- 不反編譯、解混淆、de-minify、重放 undocumented API、抓取 catalog、下載 3D model／材質／圖片或建立 IKEA 資料鏡像。
- 不複製 IKEA 商標、產品攝影、模型、文案、icon、聲音、配色、layout、microcopy、動畫節奏或具有識別性的整體 trade dress。
- 不照抄其 error text、推薦邏輯、房間模板、curated showroom 或商品組合。
- 不聲稱與 IKEA 合作、相容或獲得授權；測試畫面不得進公開提案素材。

建議採 **clean-room**：觀察者只交付不含程式碼、API、資產與品牌細節的行為規格；實作者只看該規格與公開標準，使用居遊所／建商／品牌自有素材重新設計。實際公開前再由台灣法務檢查商標、著作權、營業秘密、網站條款與競爭法風險。

## 可獨立重建的技術架構

```text
Project / Floorplan Manifest
        │
        ├─ Room Shell: polygon, walls, openings, support surfaces, nav mesh
        ├─ Catalog: SKU, exact dimensions, variants, price/stock, assetVersion
        └─ SceneSnapshot: camera + immutable placement commands
                         │
                  Scene / Editor Engine
          ┌──────────────┼──────────────┐
          │              │              │
     R3F renderer   Rapier/query    Commerce/booking
     GLB/KTX2/LOD   hard blocks     cart/share/save
          │              │              │
          └──── client capability + telemetry ────┘
```

技術選擇：

- **React 19 + R3F v9**：沿用現有 declarative scene；Canvas 保持 client boundary。R3F 官方建議共用 geometry/material、控制 draw calls、按需 rendering 並使用 performance scaling。[R3F scaling performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)、[R3F performance pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls)
- **Three.js GLTFLoader**：以 glTF/GLB 作商品交付格式；官方 loader 支援 Draco、Meshopt、KTX2、WebP、instancing 等 extension，但壓縮 decoder 需明確設定，bitmap 也需正確 dispose。[Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)
- **glTF pipeline**：發布前用 [Khronos glTF-Validator](https://github.com/KhronosGroup/glTF-Validator) 與 [glTF Transform](https://github.com/donmccurdy/glTF-Transform) 進行 inspect、prune、dedup、meshopt、texture resize／KTX2；glTF 2.0 spec 是交換格式的唯一標準來源。[glTF 2.0 specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)
- **Rapier**：物理錯誤以 solid colliders 阻擋；門區、走道、表面與互動區可用 sensor。拖曳 preview 用 shape intersection／shape cast，不需要讓所有家具參與完整 dynamic simulation。[Rapier colliders](https://rapier.rs/docs/user_guides/javascript/colliders/)、[scene queries](https://rapier.rs/docs/user_guides/javascript/scene_queries/)、[sensor colliders](https://rapier.rs/docs/user_guides/javascript/collider_type/)
- **Transform interaction**：Three.js TransformControls 有 translate／rotate、bounds 與 snapping，但居遊所應以自己的 command engine 持有真相，gizmo 只是 input adapter。[Three.js TransformControls](https://threejs.org/docs/pages/TransformControls.html)
- **Persistence**：server 只接受 schema-valid、assetVersion 可解析、通過 hard validation 的 snapshot；save、share、cart 使用同一份 snapshot，不從 renderer 反推資料。

### 暫不重建 IKEA 的部分

- LiDAR capture、photogrammetry、room segmentation、深度估測、image inpainting／Eraser。
- 以照片自動推導精準尺寸、遮擋、光照、陰影與既有物件關係。
- IKEA showroom、推薦、catalog 或其商品行為規則。

居遊所已有建商正式圖面，手動掃描反而會降低精度。若日後需要自宅照片體驗，先做「上傳照片 + 人工校準牆寬 + 裝飾性 overlay」的獨立 prototype；不得把估算結果混入正式 SceneSnapshot 或購買尺寸判定。

## 對現有專案的具體模組調整

現有 [`package.json`](../../package.json) 已包含 React 19、Three.js、R3F v9、Drei 與 React Three Rapier v2，無需換技術棧。

### 保留並深化

1. **`SceneSnapshotV1`** — [`domain.ts`](../../app/lib/domain.ts)

   現有公尺、四元數、SKU、`assetVersion` 與 camera 是正確核心。下一版只新增可選欄位：`parentSurfaceId`、`anchorId`、`placementKind`、`variantId`、`catalogVersion`、`warningsAccepted`。不要把 Three Object3D JSON 當資料格式。

2. **`EditorEngine`** — [`editor-engine.ts`](../../app/lib/editor-engine.ts)

   現有 command、oriented-rectangle collision、門區、牆、undo/redo、硬阻擋與動線 warning 可直接延伸。新增：`duplicate`、`swapSku`、`move.preview`／`move.commit`、`placeOnSurface`、`mountToWall`；所有操作仍回傳 `EditorResult`，UI 不複製規則。

   第一版地面家具維持 2D oriented rectangle 是合理的；只有層架、桌上配件、壁畫等垂直／支撐關係才進 Rapier 3D query。不要為了「更像 IKEA」把所有 furniture 改成 dynamic rigid body。

3. **`FloorplanRuntime`** — [`floorplan-runtime.ts`](../../app/lib/floorplan-runtime.ts)

   加入穩定的 wall/opening/support-surface IDs、碰撞器版本、測量來源與 validation report。正式圖面與 runtime polygon 的對照報告是發布 gate。

4. **`ExperienceCanvas`** — [`experience-canvas.tsx`](../../app/components/experience-canvas.tsx)

   降為 presentation + input adapter：raycast 選取、drag plane、camera controls、gizmo、hover highlight。它只派送 command，不直接改 snapshot、價格或 collision 規則。

5. **`CatalogModule`** — [`catalog.ts`](../../app/lib/catalog.ts)

   每個 variant 要有精準尺寸、pivot／floor anchor、可支撐面、wall anchor、GLB/KTX2/LOD 路徑、collider asset、rights/source 與 updatedAt。商品卡與場景物件以 SKU/variant 關聯，不以 model filename 關聯。

### 建議新增的深模組

- `AssetValidationModule`：GLB schema、單位／座標、bounds 對商品尺寸、pivot、材質、貼圖預算、LOD、collider、thumbnail；不合格禁止發布。
- `PlacementPolicyModule`：hard blocks、soft warnings、support-surface／wall rules，供 editor、save API、share、render worker 共用。
- `ClientCapabilityModule`：WebGL/GPU/touch/memory 分級，輸出畫質 preset；不把裝置偵測散在 component。
- `DesignVersionModule`：autosave draft、explicit named save、Save a Copy、read-only share；維持 idempotency 與 immutable revisions。
- `CatalogSceneBridge`：商品 drawer、scene selection、價格／庫存、swap candidate、cart line 共用同一 SKU variant mapping。

## Vibe coding 分階段工作流

每個階段只交付一條可完整驗收的 vertical slice。提示詞固定包含：既有檔案、唯一資料真相、允許修改範圍、禁止事項、驗收案例與效能預算。

### Phase 0 — 行為規格與 baseline（1–2 天）

- 建立中性 capability matrix：select、add、move、rotate、remove、duplicate、swap、undo/redo、save、share、cart。
- 以現有 A6 一個戶型、6 件正式 SKU 建立 Golden SceneSnapshot 與固定相機截圖。
- 明寫非目標：scan、erase、multi-user、AI room reconstruction。

提示詞範本：

```text
先讀 domain.ts、editor-engine.ts、floorplan-runtime.ts 與現有測試，不要改程式。
輸出本階段的狀態機、command/event 表、hard invariants、soft warnings、
Golden Snapshot、桌面/iPad 驗收與明確非目標。未知資料列為 open question，不可猜。
```

### Phase 1 — 可玩的精準空屋（3–5 天）

- 空屋 shell、俯視 camera、raycast select、drag preview、45° rotate、remove、undo/redo。
- 物理錯誤不能 commit；warning 可 commit。
- 只用 primitive／已驗證的 6 個 GLB，不先追求完整 catalog。

### Phase 2 — 商品體驗（4–7 天）

- 分類、search、商品 drawer、add、duplicate、swap、variant、總價與庫存狀態。
- 每個場景 item 都能回到單一 SKU/variant；out-of-stock 舊配置可看但不能新加。
- 加入桌上／牆上商品前，先完成 support-surface 與 anchor schema。

### Phase 3 — 儲存、分享與商務閉環（4–7 天）

- autosave draft、named save、Save a Copy、read-only share。
- selected scene items 產生 cart lines；affiliate 商品只產 signed redirect，不混成平台訂單。
- Snapshot round-trip 後位置、rotation、variant、camera 必須相同。

### Phase 4 — 美術與效能（5–10 天）

- glTF Transform + Validator、自動 bounds/尺寸檢查、Meshopt/KTX2、LOD、thumbnail。
- GPU preset 控制 DPR、shadow、AO、reflection、vegetation／small props。
- 先優化下載、draw calls、貼圖記憶體，再加後處理；美感問題不得只靠 bloom／重陰影掩蓋。

### Phase 5 — 角色探索與正式發佈（5–10 天）

- Rapier kinematic character、nav/collider、接近家具顯示商品，與 decorate mode 共用 snapshot。
- 完成 booking、check-in、render、share、commerce E2E 與資料隔離。
- WebGL fallback 仍能看 catalog、收藏與預約。

每次 coding prompt 都要求：先跑既有測試；只改指定模組；新增失敗測試再實作；完成後回報 changed files、截圖／連續操作錄影、效能數字與已知風險。一次只處理一個 interaction，避免 AI 同時改 scene、UI、catalog 與 API 而失去可驗證性。

## 驗收標準

### 功能正確性

- Golden Snapshot save → reload 深度相等；schema version 與 assetVersion 不能遺失。
- 穿牆、超出 polygon、家具重疊、擋門不得 commit；動線 warning 可由使用者確認後保存。
- drag 中 preview 與 release 後 commit 使用同一 PlacementPolicy；server save 再驗一次。
- add／duplicate／swap／undo／redo／Save a Copy 的結果皆可重放為 command sequence。
- 任一物件選取後，SKU、variant、尺寸、價格與庫存與 catalog 一致。
- share viewer 不能修改原稿；cart line 可追溯 snapshot item ID。

### 視覺與互動

- 桌面 60 FPS、iPad 30 FPS；標準場景首次可操作不超過既定 8 秒。
- 指標物件在固定 Golden cameras 下通過 screenshot diff；色彩、材質與比例不能因 AI 或壓縮漂移。
- mouse、trackpad、touch 均可 select／drag／rotate；camera gesture 與 object drag 不互搶。
- hover／selected／invalid／warning 四種狀態可辨識，且不是只靠顏色。
- reduced-motion、keyboard focus、WebGL fallback 與低 GPU preset 有獨立測試。

### 資產

- GLB 通過 Khronos Validator；世界單位為公尺，pivot、up axis、bounds、尺寸與 catalog 一致。
- 每個 asset 有 polygon、material、texture、draw-call、decoded VRAM budgets；超標自動降 LOD 或阻擋發布。
- 產品外觀、品牌、來源與授權有稽核紀錄；AI 草模不能進 production catalog。

## 主要風險與控制

| 風險 | 控制 |
|---|---|
| 做得像 IKEA 造成品牌／表現複製 | clean-room spec、居遊所 design system、自有文案與 assets、上線前法務 review |
| vibe coding 只產生漂亮 demo，破壞 domain invariants | command engine 唯一真相、test-first vertical slices、server revalidation |
| 3D asset 好看但尺寸不準 | catalog bounds gate、固定單位／pivot、CAD／SKU 尺寸對照 |
| Rapier 與 renderer 狀態分裂 | snapshot → engine → presentation 單向資料流；不從 Object3D 回寫業務資料 |
| glTF／texture 導致 iPad crash | KTX2/LOD、asset budgets、dispose、GPU preset、實機 memory soak test |
| scan／erase 範圍失控 | 明列 V1 非目標；另立有資料權利、同意、刪除與精度標示的 R&D track |
| 分享或 autosave 覆蓋原稿 | immutable revision、Save a Copy、read-only token、idempotency key |
| 生成式美術改動商品外觀 | 商品／格局保護區像素與 geometry 不變；AI 只改氣氛層 |

## 最終採用決策

- **Adopt now**：公開能力分類、room/template → catalog → placement → save/share → cart 的產品閉環。
- **Implement independently**：使用 Next.js、R3F、glTF、Rapier 與現有 SceneSnapshot／EditorEngine，建立居遊所自己的 interaction design。
- **Defer**：照片擦除、LiDAR scan、automatic room reconstruction、lighting match。
- **Reject**：任何 IKEA asset/API/code 抓取、外觀臨摹、推薦邏輯複製或宣稱相容。

## 主要一手來源

- IKEA：[What is IKEA Kreativ?](https://www.ikea.com/us/en/customer-service/knowledge/articles/b548fdg1-8c6f-448e-97c5-6f78e114c504.html)、[How to scan](https://www.ikea.com/us/en/customer-service/knowledge/articles/e86d70g6-3673-4306-b373-20f7cg7fd5ed.html)、[App vs web](https://www.ikea.com/us/en/customer-service/knowledge/articles/a6fd8d36-b079-46bd-af63-e429217eff4d.html)、[Eraser](https://www.ikea.com/us/en/customer-service/knowledge/articles/6226432c-c257-4d49-bf04-cede16cae5c5.html)、[Save designs](https://www.ikea.com/us/en/customer-service/knowledge/articles/ad2fc851-b8c3-4eee-94f4-12740d2b0282.html)
- Three.js：[GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)、[TransformControls](https://threejs.org/docs/pages/TransformControls.html)
- R3F：[Scaling performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)、[Performance pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls)、[Loading models](https://r3f.docs.pmnd.rs/tutorials/loading-models)
- Khronos：[glTF 2.0 spec](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)、[glTF Validator](https://github.com/KhronosGroup/glTF-Validator)
- Rapier：[Colliders](https://rapier.rs/docs/user_guides/javascript/colliders/)、[Scene queries](https://rapier.rs/docs/user_guides/javascript/scene_queries/)、[Character controller](https://rapier.rs/docs/user_guides/javascript/character_controller/)
