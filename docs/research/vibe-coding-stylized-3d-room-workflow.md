# AI Vibe Coding：可操作、可拖曳、風格一致的可愛卡通 3D 房間工作流

> 研究範圍：一般人或小團隊，如何用 AI 輔助完成「可操作、可拖曳家具、可商用擴充」的卡通 3D 房間網頁。本文只採 Blender、Three.js／React Three Fiber 生態、glTF Transform、Meshy、Tripo、Spline 的官方文件或一手專案資料。

## 結論先行

要把目前的 3D 從「功能雛形」提升成可上線的可愛居家遊戲，最穩定的方法不是再換一組形容詞，也不是讓 AI 一次生成整間房，而是採用以下混合管線：

1. 先鎖定一張通過的 Hero Room Key Art，並把畫風拆成可測量的「風格聖經」。
2. 戶型、牆面、門窗、尺寸與可行走區由 Blender 依正式圖面精準建立，不交給生成式 AI 猜測。
3. 沙發、桌椅、燈具、植栽等可見資產逐件生成；每件使用相同風格參考、多視角圖片與固定 seed，再產生少量候選。
4. 所有生成模型必須進 Blender 統一比例、輪廓、材質、UV、pivot、命名、LOD 與碰撞器。AI 產物不是可直接上線的成品。
5. 匯出 GLB 後用 glTF Transform 做可重複的檢查、壓縮與發布關卡。
6. R3F／Three.js 只負責真正的編輯器互動、商品狀態、碰撞驗證、儲存與效能降級；不要把產品狀態綁死在視覺製作工具中。
7. 以固定場景快照、固定相機與固定渲染設定做視覺回歸。每次 AI 或程式改動，都必須與已核准的基準圖比較。

一句話概括：**AI 負責加速資產草模與重複工作；Blender 負責美術統一；R3F 負責產品行為；固定截圖負責阻止畫風漂移。**

## 為什麼目前的 vibe coding 容易只做到「能動，但沒有質感」

「做成更 Q、更像居家遊戲」對模型與程式代理來說不是規格。這類提示缺少輪廓、比例、材質、光影、相機、顏色與互動狀態的邊界，所以每一次生成都可能在不同方向上變動。另一方面，程序化 primitive 很適合驗證拖曳與碰撞，但若把方塊、圓柱和預設 PBR 材質直接當正式畫面，就會留下工程 demo 的觀感。

官方工具本身也支持這個判斷：Spline 的 AI 3D 指南建議一次聚焦**單一物件**，並指出不要求高精度、偏有機的造型通常比銳利精準的物件更適合生成；這等於明確排除了「一次生成精準整間住宅」作為正式管線。[Spline AI 3D Generation](https://docs.spline.design/spline-ai/ai-3d-generation)

因此，vibe coding 必須從「一句自然語言直接改整個專案」改成「有基準、有素材規格、有驗收圖的短循環」。

## 三種建置策略比較

| 策略 | 初稿速度 | 尺寸／格局精準 | 可編輯性 | 畫風一致性 | 主要商用品質風險 | 建議用途 |
| --- | --- | --- | --- | --- | --- | --- |
| 整間房 AI 生成 | 最快 | 低 | 低 | 低到中 | 尺寸猜測、家具黏成一體、背面缺失、物件不可獨立選購、重建碰撞與語意成本高 | Key Art、氣氛探索、提案圖；不作正式場景來源 |
| 逐件資產 AI 生成 | 中 | 中，經校正後可高 | 高 | 中到高 | 每件比例、拓撲、材質仍可能漂移，必須集中清理 | **正式可見家具與生活用品的主力方法** |
| 程序化 primitive | 快 | 高 | 最高 | 高，但容易陽春 | 最容易帶出 demo 感；輪廓與材質缺乏角色 | 精準房殼、碰撞器、導覽網格、灰盒測試 |

建議正式採「程序化／人工精準房殼＋逐件 AI 家具＋人工或腳本化統一」的混合方案。整間 AI 房間只作視覺目標，不進商品、碰撞與訂單資料鏈。

Meshy 與 Tripo 都提供多視角輸入、低多邊形或 remesh、種子與貼圖控制，適合做逐件資產工廠；Spline 則更適合快速探索場景構圖或瀏覽器概念稿。[Meshy Image to 3D](https://docs.meshy.ai/en/webapp/image-to-3d) [Tripo Generation](https://platform.tripo3d.ai/docs/generation) [Spline code export](https://docs.spline.design/exporting-your-scene/web/exporting-as-code)

## 先建立「風格聖經」，再開始產模型

風格聖經不是 moodboard 的別名，而是所有人與 AI 都必須遵守的產線規格。第一版至少要包含：

| 項目 | 必須鎖定的內容 | 居遊所建議起始值 |
| --- | --- | --- |
| 原創定位 | 可愛、療癒、生活化，但不複製既有角色、介面、標誌或專有造型 | 「原創台灣居家玩具屋」；不放人類或既有 IP 角色 |
| 輪廓 | 圓角大小、直線／曲線比例、家具腳粗細、把手和靠墊的誇張程度 | 厚、圓、低重心；避免薄片、尖角與寫實五金 |
| 比例 | 牆高、門寬、家具厚度是否可誇張，以及不可改動的商品尺寸 | 房屋與商品 footprint 精準；坐墊、把手、邊角可視覺放大 |
| 幾何 | 面數層級、倒角方式、硬邊／柔邊、背面與底面是否完整 | 低到中多邊形、輪廓優先、所有可旋轉家具須有完整背面 |
| 材質 | 每類物件可用的 shader、roughness 範圍、紋理密度、是否允許高光 | 霧面、低對比、少量手繪細節；禁止預設塑膠亮面感 |
| 色彩 | 主色、輔色、中性色、警示色與同時出現的飽和色數量 | 奶油白、燕麥、鼠尾草綠、淡杏、木色；每個畫面只留 1 個小面積高彩度重點 |
| 光影 | 主光角度、陰影硬度、環境光比例、AO 強度、曝光 | 高亮柔光、陰影淺、接觸陰影短；不要電影式重陰影 |
| 相機 | 俯視模式投影、角度、zoom；探索模式 FOV、眼高 | 佈置模式固定等角／近似正交；探索模式保留溫和透視 |
| 資產規格 | 單位、軸向、pivot、命名、LOD、材質槽、碰撞器 | 公尺；pivot 在落地中心；每 SKU 有可見模型與簡化碰撞器 |
| 拒絕樣本 | 何謂太寫實、太低幼、太亮、太暗、太像工程 demo | 每種問題至少留一張「禁止」圖，並寫明原因 |

Blender 可把場景設為 Metric；glTF 匯出會轉為 glTF 的 `+Y up` 慣例，所以軸向與單位必須在匯出規格中固定，而不是讓每位製作者自行理解。[Blender Scene Units](https://docs.blender.org/manual/en/4.0/scene_layout/scene/properties.html) [Blender glTF 2.0](https://docs.blender.org/manual/en/3.3/addons/import_export/scene_gltf2.html)

### Style Bible 不能只寫文字

至少要同時保存以下四個 artefact：

1. 一張核准的 Hero Room 全景。
2. 同一房間的固定俯視、探索與商品選取三張基準畫面。
3. 三件 Golden Assets：沙發、邊桌、立燈，代表大／中／細長物件的正式品質。
4. 一份機器可讀設定，例如 `visual-style.json`，記錄 palette、相機、燈光、tone mapping、材質名稱與資產上限。

沒有 Golden Assets 前，不要大量生成 100 件家具；否則會把錯誤風格規模化。

## 建議的正式資產工作流

### 1. 戶型與房殼：只做精準建模

- 依正式建築圖在 Blender 建牆、柱、門窗、地坪與固定設備。
- 把「可見房殼」「不可穿越碰撞」「可行走區」「家具允許區」拆成不同物件或資料層。
- 房殼先以簡單統一材質完成，等家具風格核准後再套用正式材質；不要一開始追逐燈光特效。
- 所有尺寸與商品 footprint 都以真實公尺保留，Q 版只改可見輪廓，不改空間判斷資料。

### 2. 家具參考圖：同一個視覺母版

每一件資產先準備乾淨的正面或 3/4 圖；重要家具補正、側、背面。Meshy 官方文件指出，多視角能提升側面與背面的準確度並減少模型猜測，而且所有圖片應該是同一物件、相近光線。[Meshy Image to 3D](https://docs.meshy.ai/en/webapp/image-to-3d)

若缺少同風格參考，可先用同一張 Style Reference 產生各家具的參考圖。Meshy 建議持續重用同一張參考圖，讓色彩、紋理、光線與整體美感保持一致。[Meshy Creating Images](https://help.meshy.ai/en/articles/12005614-creating-images)

### 3. AI 逐件產生，而非一次產房間

推薦順序：

1. 先產無貼圖或簡單貼圖的幾何。
2. 同一 SKU 只產 2–3 個候選，選定輪廓後停止抽卡。
3. 幾何定稿後才做 PBR／風格貼圖。
4. 保存工具版本、prompt、參考圖、seed 與生成參數，確保可重現。

Meshy API 支援 1–4 張同物件不同角度的圖、獨立控制是否生成貼圖、remesh 與 GLB 輸出；關閉 image enhancement 還可降低輸入外觀被改寫的程度。[Meshy Multi-Image to 3D API](https://docs.meshy.ai/en/api/multi-image-to-3d)

Tripo 同樣提供 multiview、seed、face limit、smart low poly 與分件控制；其 multiview 指定正、左、後、右順序，且至少需兩張一致物件圖片。Tripo 也把低多邊形與貼圖拆成可控制階段，適合建立可重複的資產配方。[Tripo Generation](https://platform.tripo3d.ai/docs/generation) [Tripo Texture](https://platform.tripo3d.ai/docs/texture)

### 4. Blender 清理與風格統一

每件 AI 模型都必須通過以下清單：

- 修正實際尺寸、旋轉與落地高度，套用 transforms。
- 把 pivot 放在落地中心；壁掛、桌上物另用明確 anchor。
- 清除破面、重疊面、漂浮碎片、非流形幾何與不可見內層。
- 修正法線與 shading；統一倒角半徑和輪廓語言。
- 重新整理 UV、貼圖尺寸與材質槽；相同材質盡量共用。
- 為背面、抽屜內側或可旋轉後可見區補齊模型。
- 建立 LOD0／LOD1／LOD2；Decimate 可降低生成模型面數並盡量保留外觀，但必須人工檢視輪廓與 UV。[Blender Decimate Modifier](https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/decimate.html)
- 建立獨立的簡化碰撞器，不以高面數可見網格直接做即時碰撞。
- 用 SKU、版本與部件語意命名；避免 `Cube.001` 類名稱進入正式資產。

Blender glTF 匯出支援常用 PBR 材質，也支援 `KHR_materials_unlit` 類型；GLB 可把 mesh、材質與貼圖封裝為單一檔案。這讓「霧面卡通 PBR」與「不受光 UI／標記物」可以在同一格式中發布。[Blender glTF 2.0](https://docs.blender.org/manual/en/3.3/addons/import_export/scene_gltf2.html)

### 5. 碰撞器：從外觀模型拆開

Rapier 的 R3F 整合可自動建立 cuboid、ball、trimesh、hull 碰撞器，也支援手動 compound colliders；官方說明指出，複雜物件適合用較簡單的複合形狀兼顧效能，並可用 debug 模式直接檢查碰撞器。[react-three-rapier](https://github.com/pmndrs/react-three-rapier)

對居遊所的具體規則：

- 櫃子、桌子、床：2–6 個 cuboid 組合。
- 圓桌、圓凳：cylinder／hull；避免 trimesh 當動態碰撞器。
- 房牆與門框：靜態簡化 mesh 或 cuboid 組合。
- 飾品：若不影響配置合法性，可只有點選 bounding box，不參與物理。
- 可見模型、商品 footprint 與碰撞器三者分離，但共用同一資產版本。

### 6. GLB 發布關卡

glTF Transform 適合用在 Blender 之後：它不是美術建模工具，而是以可重複程式流程讀取、檢查、編輯與輸出 glTF。官方 CLI 提供 `inspect`、`optimize`、dedup、prune、Meshopt／Draco 與 WebP／KTX2 壓縮等能力。[glTF Transform](https://github.com/donmccurdy/glTF-Transform)

建議每個 GLB 自動執行：

1. `inspect`：記錄 triangle、vertex、texture、material 與 draw-call 風險。
2. schema 檢查：必要 node、SKU metadata、LOD、碰撞器是否齊全。
3. dedup／prune：移除重複與未引用資源。
4. texture resize／WebP 或 KTX2：依裝置策略壓縮。
5. Meshopt 或 Draco：以實機載入時間和解碼成本決定，不盲目全開。
6. 產出資產報告與縮圖；未過上限或視覺檢查不得發布。

起始效能上限可以先當內部 guardrail，而不是永遠不變的真理：大型主家具 LOD0 約 8k–20k triangles、一般家具 3k–10k、小物 0.5k–4k，並各有至少一個遠距 LOD。Meshy 的 web viewer 指南也把 5k–20k 多邊形列為常見起點，但最終仍應用目標 iPad 實測調整。[Meshy Remesh Guide](https://docs.meshy.ai/en/webapp/guides/3d-model/remesh)

## Three.js／R3F 編輯器的正式做法

### 載入與資產重用

Three.js `GLTFLoader` 支援 glTF 2.0、Draco、Meshopt、KTX2 與 `KHR_materials_unlit` 等常用擴充，適合作為正式 GLB 載入層。[Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)

R3F 官方效能指南建議重用 geometry／material；`useLoader` 會快取同一 URL。它也提醒每個 mesh 都是一個 draw call，應盡量控制在數百以下，重複小物改用 instancing，並可用 `<Detailed />` 依距離切換 LOD。[R3F Scaling Performance](https://github.com/pmndrs/react-three-fiber/blob/master/docs/advanced/scaling-performance.mdx)

### 選取、拖曳、旋轉與提交

- R3F 的 mesh 可直接宣告 pointer、click、wheel 等事件，事件包含交點、距離與物件資料，足以建立「點家具看商品」流程。[R3F Events](https://github.com/pmndrs/react-three-fiber/blob/master/docs/API/events.mdx)
- Drei `DragControls` 支援拖曳、軸向鎖定、邊界與 start／drag／end callback；適合家具平面拖曳。[Drei DragControls](https://drei.docs.pmnd.rs/gizmos/drag-controls)
- Three.js `TransformControls` 支援 translate／rotate／scale、平移與旋轉 snap、local／world space 和邊界；Drei 包裝器會在操作 gizmo 時暫停 OrbitControls，避免相機與家具同時移動。[Three.js TransformControls](https://threejs.org/docs/pages/TransformControls.html) [Drei TransformControls](https://drei.docs.pmnd.rs/gizmos/transform-controls)

建議狀態流程：

```text
pointer down
  → 建立暫時 transform
  → 拖曳時只做輕量 footprint／房界預覽
  → pointer up 時跑完整碰撞與門區驗證
      → 合法：提交 SceneCommand、寫入 undo stack、自動儲存
      → 非法：回到最後合法位置並顯示原因
```

渲染物件不要自己成為唯一資料來源。正式狀態應存在 `SceneSnapshot`／`SceneCommand`，Three object 只是狀態的投影，才能穩定復原、重做、分享、加購物車與送渲染。

### 移動時降級，停止後恢復

R3F 可用 `frameloop="demand"` 讓靜止場景只在必要時重繪；PerformanceMonitor 可以依實際 FPS 調整 DPR 或特效。官方指南也示範在移動中暫時降低陰影、後處理和 AO，停止後再恢復。[R3F Scaling Performance](https://github.com/pmndrs/react-three-fiber/blob/master/docs/advanced/scaling-performance.mdx)

這對本案很重要：拖家具時應優先保持 30／60 FPS，不要為了重 AO 讓互動卡頓；而且既定視覺方向本來就應是明亮柔和，不需要重陰影支撐質感。

## 固定相機視覺回歸：防止 AI 每次都把風格改掉

### 必須固定的變數

- 場景快照與所有 `assetVersion`。
- 相機種類、position、target、zoom／FOV、near／far。
- viewport、device pixel ratio、背景色。
- `outputColorSpace`、tone mapping、exposure、shadow map、燈光位置與強度。
- 動畫時間、隨機 seed、材質參數與環境貼圖版本。
- 測試瀏覽器與 WebGL 能力層級。

俯視佈置模式可使用 OrthographicCamera，因為物體尺寸不隨相機距離改變，更容易建立穩定的構圖與回歸基準。[Three.js OrthographicCamera](https://threejs.org/docs/pages/OrthographicCamera.html)

Three.js 渲染器提供 `outputColorSpace`、tone mapping 與 `renderer.info` 等設定／統計；色彩管理文件說明工作空間與顯示輸出色域的轉換，若自製 ShaderMaterial 還必須自行處理輸出色彩轉換。這些設定不固定，即使模型沒變，截圖也會看起來不同。[Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html) [Three.js Color Management](https://threejs.org/manual/en/color-management.html)

### 每次合併前至少截五個狀態

1. `hero-overview`：固定俯視全景，檢查整體畫風與構圖。
2. `explore-eye-level`：固定探索視角，檢查比例與材質。
3. `item-selected`：沙發被選取，檢查 outline、gizmo 與商品面板遮擋。
4. `drag-valid`：家具移到合法位置，檢查拖曳回饋。
5. `drag-invalid`：家具碰牆／擋門，檢查錯誤回饋與回彈。

測試順序應先等待字型、GLB、貼圖與 shader 編譯完成，再截固定尺寸圖片。差異分兩層判定：

- 像素差異：阻止意外改變光影、相機、材質與構圖。
- 人工藝術審查：判斷變更是否更可愛、是否符合品牌；像素測試無法替代審美決策。

每次核准的視覺改版都要同步更新 Style Bible、Golden Assets 與基準圖，不能只更新一張首頁截圖。

## Spline、Meshy、Tripo、Blender、R3F 各自該做什麼

| 工具 | 最適合 | 不應承擔 |
| --- | --- | --- |
| Spline | 快速構圖、視覺探索、簡單網頁 3D demo、給非 3D 人員調整場景 | 精準戶型、可購物 SKU 的最終拓撲、完整商業編輯器狀態 |
| Meshy／Tripo | 單件家具／小物草模、多視角建模、remesh、貼圖候選 | 一次生成完整可配置住宅、免 QA 的正式資產 |
| Blender | 精準房殼、模型清理、統一輪廓和材質、LOD、碰撞器、GLB 輸出 | 網站交易、帳號、多人或儲存狀態 |
| glTF Transform | 自動檢查、壓縮、去重與發布報告 | 主觀美術修型 |
| Three.js／R3F | 正式互動編輯器、選取拖曳、商品狀態、快照、碰撞、效能層級 | 代替 DCC 工具清理每件模型 |

Spline 能匯出 Vanilla JS、Three.js、React、Next.js 與 R3F，但其文件指出動畫／事件支援會依匯出類型不同；因此它適合做驗證構圖的 prototype，不宜成為居遊所所有商品與交易狀態的唯一來源。[Spline code export](https://docs.spline.design/exporting-your-scene/web/exporting-as-code)

Spline 的 Performance Panel 會檢查物件、clone、polygon、material、light、effect 與 texture 等指標，官方也建議重用材質與 image asset、減少物件與燈光、以 component instance 取代大量複製。即使用 Spline 做 prototype，也要遵守同一套效能紀律。[Spline Optimization](https://docs.spline.design/exporting-your-scene/how-to-optimize-your-scene)

## 可直接交給 AI 的提示詞

以下提示詞刻意不用任何既有動畫或遊戲名稱。商業產品應描述可觀察的視覺特徵，而不是要求複製特定 IP。

### A. 單件家具參考圖

```text
任務：為「居遊所 Play Ground」製作一張可用於 image-to-3D 的單件家具參考圖。

物件：雙人布沙發，實際尺寸 W168 × D86 × H78 cm。
原創風格：溫暖、療癒、玩具屋感；厚實圓角、低重心、微誇張坐墊；簡化但仍可辨識為可購買商品。
材質：霧面燕麥色織物、淺木色短腳，低高光，不要寫實纖維噪點。
造型規則：輪廓完整、左右近似對稱、底部落地清楚、背面必須合理；不要角色、眼睛、文字、品牌標誌或場景背景。
鏡頭：3/4 正面，85 mm 商品攝影感，物件置中，完整不裁切。
照明：高亮柔光，淺而短的接觸陰影，純色淺米背景。
輸出：同一物件的正面、左側、背面、右側；比例、顏色與光線一致。
```

### B. Image-to-3D／Multiview 產生

```text
使用四張同一沙發的正、左、後、右參考圖建立單一 3D 物件。
首要目標：忠實保留外輪廓、坐墊分件、扶手厚度、短木腳與真實 footprint。
風格規則：圓潤低多邊形、輪廓乾淨、表面霧面、沒有雕刻小噪點。
幾何規則：背面與底部完整；坐墊不可黏成模糊團塊；不可增加圖片中不存在的枕頭、花紋、五金或角色元素。
本階段優先幾何，不要生成複雜貼圖。使用固定 seed 2417，產生 3 個候選。
```

工具中的 face limit、smart low poly、seed、style image、是否貼圖等參數要另外存成 recipe，不應只依賴 prompt。[Tripo Generation](https://platform.tripo3d.ai/docs/generation) [Tripo Texture](https://platform.tripo3d.ai/docs/texture)

### C. Blender 清理任務

```text
只處理指定的 sofa-source.glb，輸出 sofa-SKU123-v1.blend 與 sofa-SKU123-v1.glb；不要修改其他資產。

驗收規格：
1. Scene 使用公尺，實際包圍盒為 1.68 × 0.86 × 0.78 m；Blender 內落地面為 Z=0，匯出 glTF／Three.js 後為 Y=0。
2. 套用 transform，pivot 位於落地 footprint 中心。
3. 移除漂浮碎片、內層重疊面、非流形幾何，修正 normals。
4. 依 Golden Asset 的倒角、霧面材質和色票統一；不得改變 footprint。
5. 產出 LOD0／LOD1／LOD2，保留輪廓與 UV；建立 4 個 cuboid 的簡化 compound collider。
6. node 與 material 依命名規格；在 custom properties 寫入 sku、assetVersion、dimensions。
7. 匯出前生成檢查報告；若任何規格無法自動判定，停止並列出人工檢查項目，不要自行猜測。
```

### D. R3F 編輯器切片

```text
以現有 SceneSnapshotV1 為唯一狀態來源，實作「俯視佈置模式的單件家具選取、X/Z 平面拖曳與 15 度旋轉」。

邊界：
- 不改首頁、商品 API、登入與現有配色。
- 使用既有 GLB，不以 primitive 替代正式模型。
- pointer down 只建立暫時 transform；pointer up 才提交 SceneCommand。
- 拖曳時鎖定 Y；若 footprint 出界或碰撞，顯示紅色預覽但不提交。
- 合法才寫入 undo stack 與 autosave。
- 操作 gizmo 時停用相機 controls。

驗收：
- 點沙發後顯示 selection outline 與商品抽屜。
- 拖曳合法位置後重載，transform 完全一致。
- 碰牆、重疊、擋門三種情況不可儲存。
- 產出 item-selected、drag-valid、drag-invalid 三張固定相機截圖，與基準比較。
- 桌面測試 60 FPS，iPad profile 測試 30 FPS；若不達標，先列 renderer.info 與資產統計再調整。
```

### E. 視覺精修任務

```text
目標不是重做功能，而是讓目前 Hero Room 符合 visual-style.json 與 approved-hero.png。

本輪只能調整：燈光、背景色、材質 roughness／palette、接觸陰影、相機構圖。
不得調整：戶型尺寸、家具 transform、商品 SKU、碰撞器、面板資訊架構。

逐項比對：
1. 畫面是否高亮柔和，暗部仍可辨識材質？
2. 是否存在過重 AO、塑膠高光或灰黑陰影？
3. 家具是否維持 Golden Assets 的圓角、低重心與色彩比例？
4. 俯視鏡頭是否能同時看懂房間和選取物件？

完成後回報前後截圖、改動參數與仍未達標項目；不要用「更可愛」作為完成說明。
```

## 小團隊可執行的 6 週收斂流程

### 第 1 週：只定畫風

- 做 3 個原創方向的 Hero Room 2D Key Art。
- 每個方向都用同一戶型、同一家具清單和同一鏡頭，避免把構圖差異誤判為畫風差異。
- 只選一個方向，建立 Style Bible、三件 Golden Assets 與拒絕樣本。

### 第 2 週：先做一個房間、三件家具

- 精準建立客廳房殼。
- 完成沙發、邊桌、立燈的完整 AI → Blender → GLB 流程。
- 在桌機與 iPad 檢查輪廓、材質、選取與旋轉後的背面。

### 第 3 週：完成 Hero Room 垂直切片

- 只整合約 10 件正式資產。
- 完成選取、拖曳、旋轉、碰撞、商品抽屜與儲存。
- 建立五張固定相機基準圖；沒有通過視覺審查，不擴充家具庫。

### 第 4 週：建立資產工廠

- 固定 Meshy／Tripo recipe、Blender template、命名與 glTF Transform 發布命令。
- 批次 20–30 件生活日用品；每批先抽查 5 件，錯誤超標就停線修 recipe。
- 建立資產狀態：generated、cleanup、art-approved、technical-approved、published。

### 第 5 週：效能與裝置層級

- 量測 draw calls、triangles、textures、GLB 大小與首次互動時間。
- 加入 LOD、instancing、on-demand rendering 與移動中降級。
- 對 Safari／iPad 做真機驗證；不用桌面 GPU 的結果推測平板品質。

### 第 6 週：視覺回歸與營運化

- 把固定截圖納入每次合併檢查。
- 變更 Style Bible 必須由同一位美術決策者核准。
- 每個生成資產保存來源、prompt、seed、工具版本、編修紀錄、授權與 SKU 關聯。
- 只有 `art-approved + technical-approved` 的資產能被建案 manifest 引用。

## 明確的停止條件

下列任一成立，就不應繼續靠 prompt 抽卡：

- 同一物件生成 3 次仍無法保留正確輪廓或背面。
- 需要高精度直線、薄板、門片間隙或真實五金。
- AI 產物清理時間已超過人工低模重建時間。
- 多件家具各自好看，但放在一起仍像來自不同遊戲。
- 為了掩蓋模型品質而不斷加重 AO、景深、陰影或 bloom。

遇到以上情況，應回到 Golden Asset 或 Blender 手工／程序化重建，不是增加更多風格形容詞。

## 對居遊所的最後建議

近期不要再同時改首頁、UI、光影、房型、家具模型與互動。先凍結功能，完成一個「BH7 客廳 Hero Room」垂直切片：1 個精準房殼、10 件可購買家具、5 個可購買生活小物、完整拖曳／旋轉／碰撞、兩種相機與五張回歸圖。

驗收順序固定為：

1. 沒有 UI 的純場景是否已達到可愛、溫馨、統一？
2. 加入互動提示後是否仍像同一個世界，而不是工程 overlay？
3. 拖曳是否合法、流暢、可復原？
4. 商品資訊是否清楚，但沒有破壞玩具屋沉浸感？
5. iPad 是否仍保持可操作的幀率與載入時間？

只有這個垂直切片通過，才將同一配方擴展到其他房間與完整家具庫。這會比持續要求 AI「更像某個作品、更 Q 一點」更慢一週，但能避免後續每件資產重做，並真正把美感變成可維護、可測試、可量產的系統。

## 一手來源

- [Blender：Scene Units](https://docs.blender.org/manual/en/4.0/scene_layout/scene/properties.html)
- [Blender：glTF 2.0 import/export](https://docs.blender.org/manual/en/3.3/addons/import_export/scene_gltf2.html)
- [Blender：Decimate Modifier](https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/decimate.html)
- [Three.js：GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)
- [Three.js：TransformControls](https://threejs.org/docs/pages/TransformControls.html)
- [Three.js：OrthographicCamera](https://threejs.org/docs/pages/OrthographicCamera.html)
- [Three.js：WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html)
- [Three.js：Color Management](https://threejs.org/manual/en/color-management.html)
- [React Three Fiber：Events](https://github.com/pmndrs/react-three-fiber/blob/master/docs/API/events.mdx)
- [React Three Fiber：Scaling performance](https://github.com/pmndrs/react-three-fiber/blob/master/docs/advanced/scaling-performance.mdx)
- [Drei：DragControls](https://drei.docs.pmnd.rs/gizmos/drag-controls)
- [Drei：TransformControls](https://drei.docs.pmnd.rs/gizmos/transform-controls)
- [react-three-rapier](https://github.com/pmndrs/react-three-rapier)
- [glTF Transform](https://github.com/donmccurdy/glTF-Transform)
- [Meshy：Image to 3D](https://docs.meshy.ai/en/webapp/image-to-3d)
- [Meshy：Multi-Image to 3D API](https://docs.meshy.ai/en/api/multi-image-to-3d)
- [Meshy：Creating images with a style reference](https://help.meshy.ai/en/articles/12005614-creating-images)
- [Meshy：Remesh](https://docs.meshy.ai/en/api/remesh)
- [Tripo：Generation](https://platform.tripo3d.ai/docs/generation)
- [Tripo：Editing](https://platform.tripo3d.ai/docs/editing)
- [Tripo：Texture](https://platform.tripo3d.ai/docs/texture)
- [Spline：AI 3D Generation](https://docs.spline.design/spline-ai/ai-3d-generation)
- [Spline：Optimization](https://docs.spline.design/exporting-your-scene/how-to-optimize-your-scene)
- [Spline：Code export](https://docs.spline.design/exporting-your-scene/web/exporting-as-code)
