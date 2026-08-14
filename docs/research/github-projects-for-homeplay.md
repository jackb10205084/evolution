# 居遊所 Play Ground：GitHub 專案採用研究

研究日期：2026-08-11

## 結論

居遊所不應改採另一套完整房間規劃器。現有 React 19、React Three Fiber 9、Three.js、drei、react-three-rapier 2 技術底座可保留；最高報酬是補齊 GLB 資產處理與驗證、裝置效能分級、商品檢視，以及將探索控制器做成獨立技術試驗。視覺品質的主要瓶頸仍是目前以程式基本幾何產生家具，而不是渲染框架。

## 立即採用

| 專案 | 授權 | 用途 | 採用方式 |
|---|---|---|---|
| [donmccurdy/glTF-Transform](https://github.com/donmccurdy/glTF-Transform) | MIT | GLB/GLTF 讀寫、合併、裁剪、meshopt/Draco、WebP、KTX2 | 作為 Blender 匯出後的標準化 CLI；所有戶型與家具共用同一條 pipeline。 |
| [KhronosGroup/glTF-Validator](https://github.com/KhronosGroup/glTF-Validator) | Apache-2.0 | glTF 2.0 規格驗證與 JSON 報告 | 加入 `assets:validate` 與 CI；有 error 的資產禁止發布。 |

`@react-three/fiber`、`@react-three/drei`、`@react-three/rapier` 已在專案中，應保留並鎖定已測試的穩定版本。其中 react-three-rapier v2 對應 R3F v9 與 React 19，適合角色／世界碰撞；家具拖曳是否合法仍應由現有的 deterministic editor engine 決定，不交給物理引擎。

## 小型技術試驗

| 專案 | 授權 | 可驗證問題 | 限制 |
|---|---|---|---|
| [pmndrs/ecctrl](https://github.com/pmndrs/ecctrl) | MIT | 能否快速做出鍵盤、觸控、坡道／樓板碰撞與可愛住民的探索手感 | 只在 BH7 A6 複本做 spike；不要先把完整控制器耦合進編輯器。 |
| [pmndrs/gltfjsx](https://github.com/pmndrs/gltfjsx) | MIT | 將有命名節點的房殼、住民、少數 hero 家具轉為型別化 R3F component | 大型動態商品庫不要一 SKU 一個 React component；商品庫仍用 manifest + GLTFLoader。 |
| [pmndrs/detect-gpu](https://github.com/pmndrs/detect-gpu) | MIT | 依 GPU 能力分級後能否穩定達成桌機／平板品質差異 | 目前 README 要求 Node 24，但專案 `engines` 仍允許 Node 22.13；先驗證 vinext／Cloudflare build 或提高部署基線。其 benchmark 資料源也自 2025-12 起停止更新，不能作為唯一性能依據。 |
| [google/model-viewer](https://github.com/google/model-viewer) | Apache-2.0 | 單一 SKU 的 3D 檢視與 WebXR/AR 是否能在現有登入、商品抽屜及 iPad 流程正常運作 | 僅用於商品頁或 fallback，不用來做房間編輯器；需先驗證 web component 與 client-only hydration。 |
| [pmndrs/triplex](https://github.com/pmndrs/triplex) | 開源專案，採用前逐 package 核對 | 內部人員能否視覺化調整燈光、相機、節點與場景參數 | 只做開發工具，不嵌入消費者編輯器，也不取代 Blender。 |
| [charmlinn/blueprint3d-modern](https://github.com/charmlinn/blueprint3d-modern) | MIT | 參考牆角 graph、房間序列化、2D/3D 切換與尺寸 UI | 僅少量 commits；GLB、undo/redo、單元測試仍在 roadmap，且核心仍使用 OBJ/MTL。只能擷取想法或小段演算法，不整套導入。 |
| [ThatOpen/engine_web-ifc](https://github.com/ThatOpen/engine_web-ifc) | MPL-2.0 | 若建商提供 IFC，瀏覽器能否解析牆、門、窗與空間屬性 | BH7 現在是 PDF，不適用；只有收到正式 IFC/BIM 才啟動。 |
| [IfcOpenShell/IfcOpenShell](https://github.com/IfcOpenShell/IfcOpenShell) | LGPL/GPL 混合 | 後端將 IFC 稽核、轉換成 GLB，或與 Blender/Bonsai 流程銜接 | 需按使用的子模組逐一法務檢查；不是前端 dependency。 |

## 僅作參考

| 專案 | 原因 |
|---|---|
| [furnishup/blueprint3d](https://github.com/furnishup/blueprint3d) | 經典案例，可研究牆／角／房間資料模型，但技術年代久、依賴與 Three.js API 過時。 |
| [cvdlab/react-planner](https://github.com/cvdlab/react-planner) | 可參考 catalog、autosave、2D 平面編輯概念；採舊 ReactDOM、Redux/Immutable 架構，不符合 React 19/R3F 9。 |
| [Winston774 Stylebase](https://github.com/Winston774/Winston-10xAI-Toolspack/tree/main/weeks/2026/2026-w31-stylebase-design-inspiration-library/completed/stylebase-design-inspiration-library) | 對建立「Golden Room 參考庫、來源／授權註記、AI 分析、提示詞版本」有幫助，但不是 3D runtime。可借鑑資料模型與審核工作流，不必把整個 app 併入居遊所。 |

## 暫不採用

| 專案／方向 | 原因 |
|---|---|
| [Tencent Hunyuan3D-2](https://github.com/Tencent-Hunyuan/Hunyuan3D-2) | 社群授權而非寬鬆開源授權，含地區與規模條件；生成幾何也無法保證家具尺寸、背面、拓撲與 SKU 一致。只可做造型草稿。 |
| [microsoft/TRELLIS.2](https://github.com/microsoft/TRELLIS.2) | MIT 對試驗友善，但需大型 GPU 與後處理；生成資產仍需重拓撲、尺寸校正、碰撞器、材質統一和人工 QA。只可做早期概念探索。 |
| 任何 monolithic 開源房間編輯器 fork | 會把產品既有 `SceneSnapshotV1`、交易、商品、碰撞政策與 React 19 架構綁進別人的狀態模型，長期成本高於擷取個別演算法。 |
| AI 直接生成可販售 SKU 3D 模型 | 商品精準度、比例、材質與法律來源不可證明；不得作為正式商品真相來源。 |

## 建議導入順序

1. 建立 `raw .blend/.glb -> glTF Transform -> glTF Validator -> asset manifest -> CDN` 管線。
2. 為房殼、家具、住民分別制定 triangle、texture、draw-call、尺寸、origin、碰撞器與命名 budget。
3. 用 `detect-gpu` 加上實際首屏 FPS／載入時間做 runtime quality tier。
4. 在 BH7 A6 複本以 `ecctrl` 做角色探索 spike，不碰正式編輯狀態。
5. 用 `model-viewer` 補商品詳情／AR；編輯器仍由 R3F 負責。
6. Stylebase 的資料概念獨立做成內部 Golden Room evidence library，記錄參考圖來源、禁仿項、配色、鏡頭、材質、驗收狀態與提示詞版本。

## 可驗收的第一輪成果

- 任一不合規 GLB 在 CI 中會失敗，並輸出可讀報告。
- BH7 A6 room shell 與 10 個正式家具資產都有尺寸、origin、LOD、材質、碰撞器與授權 metadata。
- 同一場景在桌機與 iPad 自動套用不同品質，且 UI、家具尺寸和快照不變。
- 探索角色可行走、不穿牆、不推動可編輯家具；切回俯視模式後場景狀態完全一致。
- Golden Room 的構圖、色票、光照和負面規格可被逐項審核，不再只靠「感覺像不像」。
