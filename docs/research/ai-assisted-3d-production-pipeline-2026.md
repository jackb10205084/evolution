# AI 輔助 3D 家具資產工作流（2026）

更新：2026-08-14  
範圍：居遊所 Play Ground、Blender → GLB → Three.js 互動家具庫  
來源限制：只採官方文件、官方 API、標準規格與第一方產品頁

## 決策摘要

不要讓一個 AI 從提示詞一路做到上線模型。居遊所應採「**AI 產生 draft、Blender 保存 master、確定性測試決定能否發布**」的三層責任：

```text
商品／建築權威資料
        ↓
AI：參考圖、候選網格、初始材質
        ↓
Blender：尺寸、幾何、UV、pivot、collider、GLB master
        ↓
Validator／glTF Transform／Three.js：發布 gate
```

2026 年的 Image-to-3D 已很適合縮短草模時間，但生成網格仍不是 buyable SKU 的 digital twin。可購商品的尺寸、零件、輪廓、顏色與 SKU variant 必須回到廠商資料；BH7 的牆、門、窗只能以正式圖面／CAD／BIM 為準。

首輪也不建議同時整合 Meshy、Tripo、Rodin。**先選 Meshy 做單供應商試產**，理由是它在同一官方 API 內已有 Multi-Image-to-3D、Remesh、Retexture、PBR、去除貼圖光影與 GLB 輸出，最容易量測完整流程成本。[Meshy AI integration](https://docs.meshy.ai/en/api/ai)、[Meshy Retexture API](https://docs.meshy.ai/en/api/retexture) 若 8 件 Golden Furniture 未達門檻，再用完全相同輸入與 gate 對 Tripo 或 Rodin 做替換式 bake-off；不要先建立三套 adapter 再找問題。

## 一、三條資產車道

| 車道 | 資產 | AI 的角色 | 權威來源 | 發布嚴格度 |
| --- | --- | --- | --- | --- |
| A 精準車道 | BH7 建築殼體；自有品牌核心 SKU | 建築只做 OCR／QA；家具可做候選草模與材質起稿 | 建商正式圖、CAD/BIM、廠商尺寸圖、實測、正式照片 | 最高：尺寸、silhouette、組件、材質、pivot、碰撞逐件簽核 |
| B 輔助商務車道 | 聯盟家具、次要可購品類 | Multi-image-to-3D、remesh、材質可大量使用 | 至少正式 W×D×H 與正／側照片 | 中高：bounding box、主要輪廓、品牌辨識與購買資訊正確 |
| C 場景美術車道 | 書、杯、植栽、抱枕、玩具；原創療癒住民 | 可用 Text/Image-to-3D、retexture；住民再 auto-rig | 原創美術規格、合法 reference | 以風格、效能、無侵權為主；不宣稱商品精準 |

分車道的目的，是把昂貴精修用在會影響購買信任的資產。A 車道不能為了自動化降低真實性；C 車道則不應套用 A 車道的逐毫米流程。

## 二、八階段製作與發布 gate

### 1. Intake：資料、尺寸、權利

**輸入**：`skuId`、品名、W×D×H、材質／色號 variant、尺寸圖、正式照片、圖片／商標使用權。建築另含牆厚、門窗洞口、樓高與圖面版號。

**AI 可做**：OCR、表格與照片對應、找出缺圖、資料分類。AI 讀出的尺寸只能標為候選值。

**Blender／資料規則**：場景固定 Metric，並在整條管線明文定義 1 Blender unit = 1 m；Blender 官方說 Unit System 可設 Metric，而 Unit Scale 主要影響顯示換算，物理與匯出仍要測試。[Blender Scene Units](https://docs.blender.org/manual/sr/4.0/scene_layout/scene/properties.html)

**Gate 1（確定性）**

- A/B 車道缺正式尺寸即 `source-incomplete`，不能生成後直接發布。
- 每張真實圖與 AI 推測圖有不同 provenance。
- SKU、授權、來源 hash 與版號齊全。

### 2. Reference：去背、結構圖、多視圖

**可用工具**

- Adobe Firefly Structure Reference 以 outline／depth 引導結構，Style Reference 則引導色彩與質感；兩者要分開使用。[Firefly Structure Reference](https://developer.adobe.com/firefly-services/docs/firefly-api/guides/concepts/structure-image-reference/)、[Firefly Style Reference](https://helpx.adobe.com/firefly/web/work-with-images/generate-images/reference-images-for-styling.html)
- Meshy Image-to-Image 支援 1–5 張 reference，`generate_multi_view` 可輸出多視角候選。[Meshy Image-to-Image API](https://docs.meshy.ai/en/api/image-to-image)
- Tripo 也有 Generate/Edit Multiview Image，task output 固定 front／left／back／right，可直接串 `multiview_to_model`。[Tripo Changelog](https://platform.tripo3d.ai/docs/changelog)、[Tripo Task Output](https://platform.tripo3d.ai/docs/task)

**決策**：首輪只用 Meshy 整理實拍多視圖；AI 補出的側／背面標 `inferred-reference`。水彩圖只能當 style reference，不能當幾何 reference。

**Gate 2（確定性）**

- front／side／back／3/4 確為同一物件、方位可辨、背景乾淨。
- 圖片解析度、白平衡與裁切符合 template。
- 真實視角與推測視角不得混標。

### 3. Generate：候選 3D

**首選：Meshy Multi-Image-to-3D**

Meshy 官方建議多視角使用 front、side、back、3/4，且必須是同一物件、相近光線；多圖可降低背面與側面猜測。[Meshy Image-to-3D](https://docs.meshy.ai/en/webapp/image-to-3d)

**備選但暫不整合**

- Tripo Image／Text／Multiview-to-Model；P1 支援 face limit、UV、PBR 並主打低面數結構。[Tripo Generation](https://platform.tripo3d.ai/docs/generation)
- Hyper3D Rodin 支援單圖、多圖 fuse／concat、text-to-3D、quad／triangle 與 face count。[Rodin Generation](https://developer.hyper3d.ai/api-specification/rodin-generation)
- NVIDIA GET3D 是從影像集合生成 explicit textured meshes 的研究模型；Kaolin 是 PyTorch 3D deep-learning 工具庫。兩者適合未來自建研究，不是目前逐 SKU 上傳即發布的 SaaS。[NVIDIA GET3D](https://research.nvidia.com/labs/toronto-ai/GET3D/)、[NVIDIA Kaolin](https://github.com/NVIDIAGameWorks/kaolin)

**使用界線**

- Text-to-3D：只用 C 車道概念與小物。
- Single Image-to-3D：快速草模；遮擋面皆視為猜測。
- Multi-Image-to-3D：A/B 家具唯一建議入口，但輸出仍是 draft。
- 每件只生成少量候選，依 silhouette、缺件、分件選一個；不無限抽卡。

**Gate 3（確定性＋人工選模）**

- 檔案可匯入 Blender，無明顯缺面、重複物件或錯誤類別。
- 固定正／側／背 turntable 與來源照片做 silhouette 比對。
- 只允許一個 draft 進入 master 階段；生成預覽好看不是通過條件。

### 4. Master：Blender 尺寸與幾何校正

這是 A 車道的權威關卡。

**Blender 工作**

- 依正式 W×D×H 校正，不只縮放 bounding box；修正板厚、座深、扶手、腳距、抽屜、把手與接地。
- 重新分件、對稱、倒角、法線；Apply Scale。
- root pivot 固定 bottom-center；門片／抽屜另以鉸鏈或滑軌 pivot。
- visual mesh 與低成本 collider 分離。
- 材質 variant 共用 geometry、UV 與 pivot，避免換色重生模型。

Meshy 2026 有以 vision 估計 real-world height 的 `auto_size`，但估計值不能覆蓋廠商規格。[Meshy Changelog](https://docs.meshy.ai/en/api/changelog)

**Gate 4（確定性）**

- A 車道三軸尺寸在專案公差內；B 車道 bounding box 在公差內。
- 組件數、正／側 silhouette、接地、pivot、variant 相容性通過。
- 產生唯一 `master.blend`；後續 AI 不能覆寫 master geometry。

### 5. Topology：Remesh、LOD、UV

**工具**

- Meshy Remesh 可調 topology／polycount 並輸出 GLB 等格式。[Meshy Remesh API](https://docs.meshy.ai/en/api/remesh)
- Tripo Smart LowPoly／Convert 支援 face limit 與 quad auto-retopology，作為日後替代測試。[Tripo Mesh Editing](https://platform.tripo3d.ai/docs/editing)、[Tripo Post-process](https://platform.tripo3d.ai/docs/post-process)
- Blender Remesh／Decimate 負責最後控制。Blender 官方提醒 automatic remesh 通常不會產生適合 deformation 的 topology；角色仍需要人工 retopology。[Blender Remeshing](https://docs.blender.org/manual/fi/5.0/modeling/meshes/retopology.html)、[Blender Decimate](https://docs.blender.org/manual/nb/5.0/modeling/modifiers/generate/decimate.html)

**原則**

- 靜態家具不必強求動畫用全四邊形；優先保護 silhouette、薄板、圓角、小五金、法線與 draw calls。
- 先定 UV 再做正式材質。Blender 官方建議複雜 mesh 分區 unwrap、Pack Islands、Minimize Stretch。[Blender UV Workflow](https://docs.blender.org/manual/en/dev/modeling/meshes/uv/workflows/layout.html)

**Gate 5（確定性）**

- 無 non-manifold、反法線、退化面與不可接受交疊。
- LOD0／LOD1 的 triangle 與 silhouette regression 通過。
- UV overlap／stretch、texel density、node／material 數量符合資產預算。

### 6. Material：PBR 與水彩 Web Bake

**工具**

- Adobe Substance Sampler Image-to-Material 可由照片產生 base color、normal、height、roughness，AI 模式會移除 albedo 裡的陰影與高光。[Substance Image to Material](https://experienceleague.adobe.com/en/docs/substance-3d-sampler/using/filters/tools/image-to-material)
- Meshy Retexture 可沿用原 UV 或重做 UV、生成 PBR maps；`remove_lighting` 可移除 base color 的 highlight／shadow。[Meshy Retexture API](https://docs.meshy.ai/en/api/retexture)
- Tripo Texture Model 與 Rodin Texture-only 可作日後替代。[Tripo Texture](https://platform.tripo3d.ai/docs/texture)、[Rodin Texture](https://developer.hyper3d.ai/api-specification/generate-texture)

**決策**

- 第一版用 Meshy Retexture 起稿、Blender 校色與烘焙；若實拍木紋／布料要求高，再加入 Substance Sampler。
- 每件保留兩個輸出：`audit-neutral`（商品稽核 PBR）與 `watercolor-web`（同 geometry/UV/SKU 的低彩度水彩版）。
- 照片內光影不能烘進 base color，否則 Three.js 會雙重打光。

**Gate 6（確定性＋視覺簽核）**

- Base color 無 baked lighting；color map／data map 色彩空間正確。
- UV 無漏貼／接縫破壞；PBR-neutral 固定燈光 turntable 通過。
- Watercolor 版本不得改變商品 silhouette、物件數、SKU 色彩辨識。

### 7. Rig 與 GLB Export

**Rig 只適用 C 車道住民或可動零件。** 沙發、桌椅、盆栽不需要 skeleton。

- Meshy Auto Rigging 支援 humanoid／quadruped，官方建議先 clean topology／Remesh 再 Rig。[Meshy Rigging](https://docs.meshy.ai/en/webapp/guides/3d-model/rigging)
- Tripo 官方明確警告 segmentation、completion、low-poly、quad remesh 會移除 bones、skin weights 和 animation bindings，因此所有 mesh 編輯必須在 rig 前完成。[Tripo Animation](https://platform.tripo3d.ai/docs/animation)
- 複雜原創 rig 可回 Blender Rigify 與人工權重修正。[Blender Rigify](https://docs.blender.org/manual/en/latest/addons/rigging/rigify/basics.html)

**GLB 邊界**

Khronos 定義 glTF 為 runtime asset delivery format，可表示 nodes、transforms、meshes、materials、skins 與 animations。[glTF 2.0.1](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html) Blender exporter 支援 Principled／unlit、PBR maps、skinning 等，但 quads／n-gons 會 triangulate，任意 Blender shader graph 不會原樣進網頁。[Blender glTF Export](https://docs.blender.org/manual/en/3.3/addons/import_export/scene_gltf2.html)

**Gate 7（確定性）**

- GLB 重新匯入空白 Blender 後，尺寸、方向、材質、node names 一致。
- root、scale=1、bottom-center pivot、`assetId/assetVersion/skuId` metadata 與 collider reference 齊全。
- 住民另驗 animation clip、skin weight、foot sliding；靜態家具無 rig 即通過。

### 8. Validate：壓縮、Three.js 與實機

這一步不能讓生成式 AI 代替。

- Khronos glTF Validator 依 glTF 2.0 規格檢查，提供 browser、CLI、NPM 與 VS Code 使用方式；CI 應以 ERROR 阻擋發布。[Khronos Validator](https://github.khronos.org/glTF-Validator/)
- glTF Transform 可先 `inspect` 找 geometry、texture、draw-call 問題，再做 dedup、prune、instance、simplify、Draco、Meshopt、WebP、KTX2／Basis。官方提醒一鍵 `optimize` 預設不一定適合所有場景。[glTF Transform CLI](https://gltf-transform.dev/cli)
- Three.js `GLTFLoader` 支援 Draco、KTX2/Basis、Meshopt、GPU instancing 等 extension；使用哪種壓縮，就必須配置對應 decoder。[Three.js GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader)

**Gate 8（確定性）**

- Validator 0 errors；dimensions、pivot、materials、textures、triangle、draw calls、collider 自動測試通過。
- 固定視角 screenshot regression，不能因壓縮造成輪廓／色彩顯著改變。
- Chrome／Safari／iPad 實測載入、記憶體、FPS、拖曳碰撞與 WebGL fallback。
- 通過後才由 `validated` 升為 `published`。

## 三、工具邊界：哪些結果不能當權威

| AI 結果 | 可用 | 不可用 |
| --- | --- | --- |
| Text-to-3D | C 車道小物、概念探索 | 代表可購 SKU 或 BH7 格局 |
| 單圖 Image-to-3D | 快速正面草模 | 證明背面、底部、板厚、遮擋結構 |
| AI 多視圖 | 降低草模缺面 | 取代廠商真實側／背面資料 |
| AI auto-size | 初始比例與接地 | 覆寫廠商 W×D×H |
| AI PBR／retexture | 貼圖起稿 | 證明木種、布號、色票與商品色精準 |
| Auto-remesh／low-poly | 降面、清理 draft | 保證 silhouette、薄板、UV 或 deformation |
| Auto-rig | 住民原型動作 | 複雜臉部、尾巴物理、custom rig 最終品質 |
| AI 視覺 QA | 找疑似穿模、錯色 | 取代 schema、尺寸、碰撞與 FPS 測試 |

## 四、單供應商 Golden Furniture 試產

先用 **Meshy + Blender** 完成 8 件小家庭高頻資產：三人沙發、單椅、茶几、餐桌、餐椅、電視櫃、邊櫃、床架。

每件必須留下：

```text
source/                 真實照片、尺寸圖、權利與 hash
generated/              Meshy job、模型版本、參數、draft GLB
master/asset.blend      尺寸／幾何權威
web/audit-neutral.glb
web/watercolor-web.glb
web/collider.glb
qa/turntable/
qa/validation-report.json
```

試產評估的是「**每件到發布所需人工分鐘數**」，不是第一張預覽圖：

- 生成成功率與缺面率。
- 修到正式尺寸／組件／輪廓的人工時間。
- Remesh 後 silhouette／UV 返工時間。
- 材質校正時間與商品色差。
- 最終 GLB 大小、draw calls、iPad FPS 與 validator 結果。

若 8 件中多數未達人工時間與品質門檻，再以同一 source package、同一資產與同一 gates，將 **生成階段**替換成 Tripo；仍不合格才測 Rodin。這樣 bake-off 比較的是總生產成本，而不是不同平台各自最漂亮的 demo。

## 五、建議的自動化邊界

供應商放在 adapter 後，只輸出 draft：

```ts
type GeneratedAssetCandidate = {
  provider: "meshy" | "tripo" | "rodin";
  providerModelVersion: string;
  jobId: string;
  inputHashes: string[];
  inferredViews: string[];
  outputGlb: string;
  generationParams: Record<string, unknown>;
};
```

正式場景只引用平台自己的 `assetVersion`，不能引用外部 job URL。資產狀態固定為：

```text
source-incomplete
→ reference-approved
→ generated-draft
→ geometry-approved
→ material-approved
→ web-candidate
→ validated
→ published
```

AI 最多建立 `generated-draft`；Blender 與確定性 QA 才能升到 `geometry-approved`、`validated`、`published`。外部 AI 中斷時，也必須能從 `master.blend` 重建完整、較樸素但可用的 GLB。

## 官方來源索引

- Blender：[Units](https://docs.blender.org/manual/sr/4.0/scene_layout/scene/properties.html)、[Remeshing](https://docs.blender.org/manual/fi/5.0/modeling/meshes/retopology.html)、[Decimate](https://docs.blender.org/manual/nb/5.0/modeling/modifiers/generate/decimate.html)、[UV](https://docs.blender.org/manual/en/dev/modeling/meshes/uv/workflows/layout.html)、[glTF Export](https://docs.blender.org/manual/en/3.3/addons/import_export/scene_gltf2.html)
- Meshy：[API](https://docs.meshy.ai/en/api/ai)、[Image-to-3D](https://docs.meshy.ai/en/webapp/image-to-3d)、[Remesh](https://docs.meshy.ai/en/api/remesh)、[Retexture](https://docs.meshy.ai/en/api/retexture)、[Rigging](https://docs.meshy.ai/en/webapp/guides/3d-model/rigging)
- Tripo：[Generation](https://platform.tripo3d.ai/docs/generation)、[Editing](https://platform.tripo3d.ai/docs/editing)、[Post-process](https://platform.tripo3d.ai/docs/post-process)、[Texture](https://platform.tripo3d.ai/docs/texture)、[Animation](https://platform.tripo3d.ai/docs/animation)
- Hyper3D Rodin：[Generation](https://developer.hyper3d.ai/api-specification/rodin-generation)、[Texture](https://developer.hyper3d.ai/api-specification/generate-texture)
- Adobe：[Firefly Structure Reference](https://developer.adobe.com/firefly-services/docs/firefly-api/guides/concepts/structure-image-reference/)、[Substance Image-to-Material](https://experienceleague.adobe.com/en/docs/substance-3d-sampler/using/filters/tools/image-to-material)
- NVIDIA：[GET3D](https://research.nvidia.com/labs/toronto-ai/GET3D/)、[Kaolin](https://github.com/NVIDIAGameWorks/kaolin)
- Web：[glTF 2.0.1](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)、[Khronos Validator](https://github.khronos.org/glTF-Validator/)、[glTF Transform](https://gltf-transform.dev/cli)、[Three.js GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader)
