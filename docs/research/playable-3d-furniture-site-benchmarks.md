# 可遊玩 3D 家具網站：案例、難度與居遊所落地路線

> 研究日期：2026-08-11。案例能力以各產品官方頁面與官方技術文件為準；團隊、時程與難度屬依居遊所現況做出的工程估算，不是各廠商報價。

## 結論

做出「一間可以拖放家具的 3D 房間」不算困難；做出可商用、尺寸可信、平板流暢、能接商品價格庫存、可以儲存分享與購買的產品，屬中高難度；做到 IKEA Kreativ／Planner 5D 的廣度，則是多年期平台工程。

居遊所目前不是從零開始：已經有 React Three Fiber 原型、編輯指令、旋轉／撤銷／重做，以及超出房間、穿牆、擋門和家具重疊的驗證。主要瓶頸是家具仍由程式化基本幾何生成，缺乏正式 Blender 資產管線、品質分級、LOD、材質規範與商品級驗證。

建議第一個商業垂直切片只做 BH7 A6、一個客餐廳、20 件正式家具、俯視佈置與簡化探索、儲存／分享／預約；通過後才增加戶型和 SKU。

## 官方案例

### 1. IKEA Kreativ：最接近「配置後直接購買」

IKEA 官方說明可從自有房間或 50+ 預設 showroom 開始，加入、移除、交換、移動商品，儲存、分享並購買；網頁可手動輸入房間尺寸，支援 LiDAR 的 App 可掃描 3D 房間，商品以等比例呈現。

- 參考重點：商品導購、空屋／預設風格起點、設計儲存與分享。
- 不宜第一版追隨：自動房間掃描、數千商品與多平台同步。
- 官方來源：[IKEA Kreativ 說明](https://www.ikea.com/us/en/customer-service/knowledge/articles/b548fdg1-8c6f-448e-97c5-6f78e114c504.html)、[IKEA 日本官方介紹](https://www.ikea.com/jp/ja/newsroom/corporate-news/20240213-kreativ-pubdff9cc30/)

### 2. Roomle Rubens：最接近家具品牌 B2B／B2C 商務底座

Roomle 官方列出網站嵌入、即時 3D、材質／參數配置、App-less AR、價格服務、BOM、電商 API，以及 ERP／CRM／CAD-CAM 整合；也支援由低至高多邊形的混合資產品質。

- 參考重點：SKU、材質 variant、即時計價、訂購資料與外部系統 seam。
- 對居遊所的意義：3D 場景不能只存模型檔，必須可追溯到 SKU、版本、價格和有效組合。
- 官方來源：[Roomle Rubens Configurator](https://www.roomle.com/configurator/)、[Roomle 官方文件](https://docs.roomle.com/rubens/rubens-products/rubens-configurator)

### 3. Planner 5D：新手可理解的空間編輯流程

Planner 5D 官方流程是建立戶型、門窗，從目錄拖放家具，再切換 3D、儲存與分享；支援 Web、iOS、Android、Windows 與 macOS。

- 參考重點：2D／3D 分工、目錄分類、拖放與低學習門檻。
- 官方來源：[Planner 5D Room Planner](https://planner5d.com/user/use/room-planner-tool)

### 4. Homestyler：大目錄與由圖面生成可編輯 3D

Homestyler 官方宣稱可把 2D floor plan 或 sketch 轉為可編輯 3D，並提供大量品牌家具模型與拖放配置；其產品也涵蓋 AI 建模、材質、渲染與展示。

- 參考重點：戶型匯入、龐大資產後台、渲染工作流。
- 風險提醒：目錄規模是多年資料營運成果，不應列為居遊所第一版目標。
- 官方來源：[Homestyler](https://www.homestyler.com/)、[About Homestyler](https://resources.homestyler.com/about/)

### 5. HomeByMe：配置、角色走訪、品牌商品與購物清單

HomeByMe 官方提供 2D 設計、3D 裝修、品牌商品目錄、4K 圖片、線上分享，並可用 avatar 走訪；企業版可用等比例商品並輸出含價格與尺寸的 Shopping List。

- 參考重點：角色探索不是主編輯器，而是檢驗配置的第二視角；購物清單應由同一份場景快照產生。
- 官方來源：[HomeByMe](https://home.by.me/en/)、[How it works](https://home.by.me/en/how-it-works/)、[Pro features](https://home.by.me/en/pro-features/)

### 6. Coohom／Floorplanner：快速提案、渲染與分享

Coohom 官方將流程濃縮為上傳戶型、3D 配置、4K 渲染與分享連結；Floorplanner 則把 2D／3D 編輯與渲染分開計量。

- 參考重點：即時編輯採輕量材質；寫實圖在背景任務中另外生成。
- 官方來源：[Coohom All-in-one](https://www.coohom.com/all-in-one-software)、[Floorplanner Basic](https://floorplanner.com/basic)

### 7. The Sims 4／Happy Home Paradise：遊戲手感參考，不是商務架構

EA 官方 Build Mode 包含物件選取、45 度旋轉、自由旋轉、格線／自由擺放與 styled rooms；Nintendo 的 Happy Home Paradise 以客戶需求、指定家具、空間設計、作品集與分享形成遊戲循環。

- 參考重點：選取回饋、預覽狀態、吸附／自由模式、情境任務、完成後作品。
- 法務原則：只研究互動原理，不複製角色、介面、音效或專有美術。
- 官方來源：[The Sims 4 Build Mode](https://www.ea.com/en/games/the-sims/the-sims-4/new-player-hub/build-mode)、[EA 旋轉操作](https://help.ea.com/en/articles/the-sims/the-sims-4/how-to-rotate-sims-4/)、[Nintendo Happy Home Paradise](https://www.nintendo.com/en-gb/Games/Nintendo-Switch-games/Animal-Crossing-New-Horizons-1438623.html)

## 三級難度估算

| 等級 | 範圍 | 難度 | 專職團隊 | 合理時程 |
| --- | --- | --- | --- | --- |
| A：可展示垂直切片 | 1 戶型、1 房間、20–40 家具、拖放／旋轉／刪除、簡單碰撞、儲存、分享 | 中 | 3–5 人 | 8–12 週 |
| B：單一建案商業試營運 | 所有戶型、100–250 SKU、雙模式、正式尺寸、預約、購物車、背景渲染、iPad QA、後台 | 高 | 6–9 人 | 6–9 個月 |
| C：IKEA／Planner 5D 級平台 | 多建案／多租戶、數千 SKU、房間掃描、自動佈置、AR、完整 ERP、全球裝置相容 | 極高 | 12–25+ 人 | 18–36+ 個月 |

估算假設：正式圖面與商品尺寸可取得、團隊專職、不包含大規模自動掃描研發。若每件家具都需從照片重建，時程取決於資產產能而非前端工程。

## 真正困難的模組

1. **精準空間真值**：牆、柱、梁、門窗、門扇開啟與可編輯區域必須來自正式圖面，不能由效果圖反推。
2. **家具資產管線**：每個 SKU 要有公尺尺度、正確 pivot、材質 variant、碰撞器、縮圖、LOD、版本與商品對應。
3. **直接操作**：游標／觸控射線、拖放平面、吸附、旋轉、複製、撤銷重做、合法／非法預覽與相機手勢會彼此競爭。
4. **規則與碰撞**：物理錯誤需禁止；生活動線需警告；牆掛、桌上物與地毯還需要不同放置規則。
5. **Web 效能**：需要 GLB、紋理壓縮、共用材質、instancing、LOD、漸進載入、動態 DPR 與裝置降級。R3F 官方建議把 draw call 控制在數百量級、使用 instancing／LOD／巢狀載入與效能監控。
6. **商品一致性**：場景快照、分享、購物車與渲染必須引用同一 SKU variant 和 asset version。
7. **商業可靠性**：自動儲存、冪等付款／報到／扣點、庫存變化、分享權限、瀏覽器恢復與稽核都不是 3D demo 會自然具備的能力。

技術來源：[Khronos glTF](https://www.khronos.org/gltf/)、[R3F Scaling Performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)、[Three.js Loading glTF](https://threejs.org/manual/en/load-gltf.html)、[Rapier Character Controller](https://rapier.rs/docs/user_guides/javascript/character_controller/)

## 居遊所建議架構

將產品拆成四層，避免「可愛」與「精準」互相傷害：

1. **Metric truth layer**：BH7 公尺制格局、門窗、商品真實尺寸、碰撞器。
2. **Game presentation layer**：原創圓潤 GLB、固定色盤、toon／NPR 材質、柔光、選取動畫與音效。
3. **Commerce layer**：SKU、價格、庫存、購物車、聯盟連結與預約摘要。
4. **Render layer**：同一 `SceneSnapshot` 送背景 Blender；即時場景不背負照片級渲染成本。

glTF／GLB 是適合網路傳輸的 runtime 格式；Khronos 說明其目標是降低檔案大小與執行時解包成本。Three.js 官方也提醒互動資產必須在製作時處理正確 origin、scale 與 scene graph，否則執行時操作會持續出問題。

## 90 天建議

### 第 1–2 週：鎖定真值與美術合約

- 只選 BH7 A6 客餐廳。
- 把 PDF 的牆、門、窗、柱轉成核准公尺資料。
- 定義一份 Blender asset contract：單位、pivot、命名、面數、材質槽、碰撞器、LOD、輸出驗證。
- 先核准 3 件 hero furniture：沙發、餐桌、單椅。

### 第 3–6 週：商業品質垂直切片

- 製作 20 件真正由 Blender authoring 的家具，不再用球／圓柱拼接。
- 完成滑鼠及 iPad 的拖放、合法預覽、吸附、旋轉、撤銷重做。
- 保留現有 `editor-engine` 作為規則核心。
- 設定固定正交相機、材質與燈光，不讓每個資產自己決定畫風。

### 第 7–10 週：導購閉環

- 每個 3D asset 綁 SKU、價格、庫存、商品頁與替代品。
- 完成儲存、唯讀分享、配置摘要與預約賞屋。
- 固定鏡頭截圖；寫實渲染先用測試 adapter。

### 第 11–12 週：裝置與門檻驗收

- Chrome、Safari、Edge、iPad 實機。
- 首次可操作時間、FPS、draw calls、GPU memory、快照一致性。
- 物理錯誤不得保存；動線警告可保存。
- 只有通過核准的 GLB 才能進正式目錄。

## AI 可以與不可以代替什麼

### AI 適合

- Key art、色票與材質方向探索。
- Blender Python 腳本、批次命名、匯出、LOD／縮圖與驗證自動化。
- 初步 mesh／texture 草稿、商品分類、metadata 與測試案例。
- 比對 PDF、場景快照和渲染輸出的 QA 輔助。

### AI 不應單獨簽核

- 建築尺寸、牆門窗位置與法規／動線正確性。
- 商品幾何、品牌外觀、材質色與 SKU variant 的最終一致性。
- 拓撲、UV、pivot、碰撞器與跨裝置效能。
- 全資產畫風一致性與商用授權。

結論不是「AI 做不到」，而是 AI 應負責提速與機械化；正式圖面、商品真值和美術品質仍需明確規格與人工驗收。
