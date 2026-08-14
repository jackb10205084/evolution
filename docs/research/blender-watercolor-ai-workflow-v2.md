# 居遊所 Blender × AI 水彩工作流 V2 研究

更新：2026-08-14  
範圍：BH7 A6 Golden Room、Blender 5.2、網站即時 3D

## 結論

可行，但必須分成兩條產品管線：

1. **離線 Golden Room／付費效果圖**：Blender 提供不可變更的幾何、商品與遮罩；AI 只修改被允許的媒材、窗景、植栽氣氛與光線；最後重新合成 Blender 的建築與商品保護層。
2. **網站即時 3D**：不能每一幀呼叫 AI。水彩感需要轉換成可攜的烘焙貼圖、柔和 toon lighting 與穩定的螢幕空間輪廓，再以 GLB 送到 Three.js。

V5 圖可以作為「媒材與色彩 north star」，但不能作為格局資料或網站材質本身。

## 官方能力依據

- Blender 正交攝影機使物件尺寸不因遠近改變，適合固定 2.5D 模型屋視角。[Blender Cameras](https://docs.blender.org/manual/en/2.92/render/cameras.html)
- Freestyle 可分別控制 Stroke、Color、Alpha、Thickness、Geometry 與 Texture；Grease Pencil Line Art 可依 Scene、Collection 或 Object 產生線條，適合將建築、商品、生活小物分為不同線級。[Freestyle Line Style](https://docs.blender.org/manual/en/3.0/render/freestyle/parameter_editor/line_style/introduction.html)、[Grease Pencil Line Art](https://docs.blender.org/manual/de/5.0/grease_pencil/modifiers/generate/line_art.html)
- Blender render passes、AOV 與 Cryptomatte 可輸出可選取的物件／材質遮罩；Cryptomatte 邊緣有抗鋸齒並處理透明度，適合保護建築及商品。[Blender Render Passes](https://docs.blender.org/manual/es/4.2/render/layers/passes.html)、[Cryptomatte](https://docs.blender.org/manual/fr/3.1/compositing/types/matte/cryptomatte.html)
- Blender 可把 procedural textures、AO、soft shadow、diffuse color 等烘焙到 UV 貼圖；glTF/GLB 支援 base color、metallic/roughness、AO、normal、emissive 以及 `KHR_materials_unlit`，但不會攜帶任意 Blender shader graph。[Render Baking](https://docs.blender.org/manual/ka/4.5/render/cycles/baking.html)、[Blender glTF Export](https://docs.blender.org/manual/en/3.3/addons/import_export/scene_gltf2.html)、[glTF 2.0 Specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)
- Blender 官方指出 Standard 常用於 NPR；Khronos PBR Neutral 適合在中性光下維持 PBR 商品 base color。兩者應分成「美術輸出」與「商品稽核輸出」，不能混成一張。[Blender Color Management](https://docs.blender.org/manual/en/latest/render/color_management.html)
- OpenAI 支援編修輸入圖與遮罩，`gpt-image-2` 會高保真處理輸入圖；但官方也說 mask 是提示性引導，不保證完全遵照遮罩形狀，所以商業輸出仍必須做確定性的保護層重合成。[OpenAI Image Generation](https://developers.openai.com/api/docs/guides/image-generation)、[GPT Image Prompting Guide](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide)
- Three.js 有 `MeshToonMaterial` 相容的 `ToonOutlinePassNode` 與選取物件用的 `OutlinePass`；其後製採 render target 與 pass 串接，適合將全場景美術輪廓和商品選取輪廓分開。[ToonOutlinePassNode](https://threejs.org/docs/pages/ToonOutlinePassNode.html)、[OutlinePass](https://threejs.org/docs/pages/OutlinePass.html)、[Three.js Post Processing](https://threejs.org/manual/en/post-processing.html)
- Three.js 要求顏色貼圖標為 sRGB、非顏色資料保持 NoColorSpace，最終輸出做正確的色彩空間轉換，否則很容易再次出現過暖或過濃。[Three.js Color Management](https://threejs.org/manual/en/color-management.html)

## 現有專案的具體問題

### 1. 所有材質共用同一種假紙紋

`scripts/blender/build-painterly-pilot.py::make_material()` 對所有材質加入：

- `Noise Texture`，Scale 118
- `Bump`，Strength 0.028
- 節點甚至仍命名為 `HP_PencilGrain`

這讓牆、木頭、布、冰箱與小物產生同樣頻率的表面起伏，正是 V5 前「整張套濾鏡」的來源。應完整移除，不是只降低 Strength。

### 2. 後製再次全畫面疊噪點

`scripts/blender/postprocess-handdrawn.py` 同時建立 broad wash noise 與 full-resolution paper tooth，再套到全畫面。這沒有材質、物件或視覺主次資訊，因此即使數值很低，也會讓所有表面呈現相同的數位紋理。

應改成由 Blender AOV／Cryptomatte 控制的局部處理：

- 牆與背景：大面積低頻 wash，70–90% 區域保持安靜。
- 布料：極低強度、不重複的明度變化。
- 木材：商品可辨識的淡木色紋理，不加紙張 bump。
- 冰箱、金屬、玻璃：不加入紙紋，只保留柔和受控高光。

### 3. 輪廓只有單一線級

目前 Freestyle 全場景只有一組 `1.55 px` 線條。應改成三層：

| 類別 | 2× render 建議線寬 | 透明度 | 行為 |
| --- | ---: | ---: | --- |
| 建築外框／主要切面 | 2.2–2.6 px | 0.55–0.65 | 最穩定、少量手勢變化 |
| 可購家具輪廓 | 1.6–2.0 px | 0.48–0.58 | 保留商品辨識 |
| 小物／背景 | 0.9–1.3 px | 0.25–0.42 | 可局部中斷或淡出 |

最後以 2× 解析度渲染再縮小，線條比直接在 1440×900 輸出更細緻。Freestyle Spatial Noise 只可極低幅度用在線條，不可變成物件輪廓漂移。[Freestyle Spatial Noise](https://docs.blender.org/manual/vi/2.80/render/freestyle/parameter_editor/line_style/modifiers/geometry/spatial_noise.html)

### 4. 網站對每個 mesh 分別做放大外框

`cloneAsToon()` 對每個子 mesh 建立 `BackSide` silhouette 並放大 `1.028`，同時對每個 mesh 建立 `EdgesGeometry`。這會造成：

- 內部零件也有粗外框，畫面像組裝玩具。
- 線寬跟物件尺度與 mesh 拆分方式相關，不是穩定畫面像素。
- 小家具過粗、大家具不一致。

應把「美術輪廓」移到全場景的 screen-space toon outline，只把 OutlinePass 用於被選取商品。商品內部結構線應由少量 authored seam／貼圖決定。

### 5. 目前 Blender 場景仍是 primitive proxy

提示詞與水彩貼圖無法修復方塊沙發、簡化椅子、空間稀疏及錯誤生活構圖。必須先讓沙發、餐桌椅、櫃體等核心商品通過尺寸、輪廓與倒角驗收，再做水彩 look-dev。

## V2 離線 Golden Room 管線

```text
BH7 PDF／SceneSnapshotV1／SKU 尺寸
                ↓
     Blender authoritative scene
                ↓
  Beauty + Line + Depth + Normal + AOV
  + Cryptomatte(建築／商品／小物／背景)
                ↓
     AI 僅編修允許的區域
                ↓
 Blender 商品與建築保護層重合成
                ↓
   Golden Room／付費寫實或水彩作品
```

### Blender 固定輸出

每個固定鏡頭輸出同尺寸的：

- `beauty-neutral.png`：乾淨高明度 beauty，無紙紋。
- `line-architecture.png`
- `line-products.png`
- `line-props.png`
- `crypto.exr`：多層 EXR，含 Architecture、FurnitureProducts、Lifestyle、Background。
- `depth.exr`、`normal.exr`
- `mask-protected.png`：建築＋可購商品，向外膨脹 1–2 px。
- `mask-styleable.png`：牆面洗色、窗景、背景、部分布料及生活氣氛。

### AI 編修規則

- 輸入 Image 1：Blender beauty。
- 輸入 Image 2：單一合法水彩媒材參考，只負責媒材。
- 遮罩：只開放 `mask-styleable`。
- Prompt 每輪只修改一類：先媒材、再色彩、再局部光線。
- 每輪重申「change only X；preserve camera, geometry, layout, product silhouette and object count」。
- AI 完成後，使用 `mask-protected` 把 Blender 商品／建築像素與獨立線稿重新合成回來。

## V2 網站即時 3D 管線

AI 生成圖不能直接成為自由旋轉、拖曳的 3D。網站需要近似同一美術語言：

1. 核心家具 UV unwrap，依商品類別共用 1K／2K atlas。
2. Blender 烘焙水彩式 base-color variation；紋理要 object-space／UV-space 固定，不能是 screen-space 全畫面噪點。
3. `metallic = 0`、`roughness = 0.88–0.98`，僅陶瓷與少量金屬有局部受控高光。
4. 大部分家具使用低對比 3-band toon；牆與大面可採 `KHR_materials_unlit` 或極弱光照，避免滑動的 3D 高光。
5. 全場景使用 screen-space toon outline；選取狀態再疊一個獨立綠色 OutlinePass。
6. 紙張感只允許非常低強度、固定螢幕比例的單層 overlay，且不可影響商品顏色、選取和截圖驗收。
7. 保留現有正交攝影機與 Rapier 碰撞；材質表現不得改動 SceneSnapshot 或 collider。
8. GLB 輸出後驗證材質、尺寸、pivot、貼圖色彩空間、triangle budget 與不同裝置 FPS。

## 建議程式切片

### Slice 1：先證明 Blender 畫面（單鏡頭）

- 移除全材質 Noise/Bump 與全畫面 paper tooth。
- 加入三組 Collection 線級。
- 輸出 beauty、line、Cryptomatte、protected/styleable masks。
- 只使用沙發、茶几、餐桌椅與一組櫃體完成固定鏡頭。
- 驗收與 V5 並排：構圖精準度、亮度、色域、輪廓、安靜區域。

### Slice 2：AI 局部水彩＋確定性重合成

- 建立一個可重複執行的 manifest，紀錄輸入 hash、prompt version、seed／job id、模型與輸出檔。
- AI 只編修 styleable mask。
- 以 protected mask 重合成商品與建築，再做像素一致性測試。

### Slice 3：網站材質

- 為通過的 4–6 件核心家具烘焙 atlas。
- 移除 `cloneAsToon()` 的 per-mesh 放大 silhouette。
- 導入全場景 toon outline 與獨立 selected outline。
- 做桌面 60 FPS／iPad 30 FPS 與固定視角 screenshot regression。

## 驗收標準

- 格局／家具保護區與 Blender base 在容許 anti-alias fringe 外像素一致。
- 放大後沒有全畫面同頻率 paper noise。
- 建築、商品、生活小物有三種線級，不是所有輪廓同樣清楚。
- 至少 35% 畫面為安靜淡洗或無顯著紋理區。
- 網站旋轉鏡頭時，水彩紋理固定在物件 UV 上，不在表面滑動。
- 商品顏色在 Blender PBR-neutral audit、GLB viewer 與網站截圖間維持可接受差異。
- AI 失敗或服務中斷時，仍能輸出完整可用的 Blender 水彩近似版。

## 建議決策

下一步不要再整張生成新的 Golden Room。先製作 **Watercolor Pipeline V2 技術樣板**：同一個 A6 固定鏡頭輸出 Blender beauty、三層線稿、四類 Cryptomatte 與一張局部 AI 水彩合成圖。這個樣板通過，才擴充全房間和完整家具庫。

## 2026-08-14 實作結果

技術樣板已落地，並把「提案美術」與「商務稽核」拆成兩張輸出：

- `audit-whole-floorplan.png`：全戶型稽核鏡頭，不拿來評斷 Golden Room 構圖。
- `beauty-neutral.png`：以客餐廳、廚房商品群世界座標置中的 1440×900 正交 Blender plate。
- `mask-architecture/products/lifestyle.png`、三層 line pass、protected/styleable mask、EXR 與 GLB。
- `watercolor-commerce-audit.png`：商品內部像素與 Blender plate 100% 一致。
- `watercolor-harmonized-proposal.png`：硬遮罩固定商品占位，內部以註冊後水彩 plate 做受控混合，供提案審美使用。

可重跑命令：

```bash
npm run blender:watercolor:v2:reuse
python3 scripts/blender/composite-watercolor-v2.py \
  --passes outputs/blender/watercolor-pipeline-v2 \
  --ai-image outputs/blender/watercolor-pipeline-v2/ai-watercolor-candidate.png \
  --product-mode exact \
  --output outputs/blender/watercolor-pipeline-v2/watercolor-commerce-audit.png
python3 scripts/blender/composite-watercolor-v2.py \
  --passes outputs/blender/watercolor-pipeline-v2 \
  --ai-image outputs/blender/watercolor-pipeline-v2/ai-watercolor-candidate.png \
  --product-mode harmonized \
  --output outputs/blender/watercolor-pipeline-v2/watercolor-harmonized-proposal.png
npm run blender:watercolor:v2:composites:validate
```

網站即時 3D 已移除 `cloneAsToon()` 的逐 mesh `BackSide` 膨脹外框與 `EdgesGeometry` 接縫，改為全房間低對比 screen-space `OutlinePass`，選取家具另用珊瑚色 pass。拖曳、Rapier 碰撞、正交相機與 SceneSnapshot 不變。

目前仍不可宣稱正式商用資產完成：A6 runtime shell 尚待 CAD／Blender 尺寸回歸，8 件自有真實 SKU 仍缺六視圖、材質與廠商核准尺寸包；本次產物的狀態是可重現的技術／美術樣板。
