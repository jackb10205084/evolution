# 降低 AI 圖片過度飽和、橘黃偏色、強對比與塑膠高光的提示詞方法

> 適用範圍：居遊所 Play Ground 的 2.5D 療癒居家場景、Hero Room、Key Art，以及對現有圖片進行色彩／材質風格修正。本文優先採 OpenAI、Google Imagen 與 Adobe Firefly 官方文件；帶有「本文推論」的段落，是根據官方控制維度整理出的實務做法。

## 結論先行

只在 prompt 裡加「低飽和、不要太黃」通常不穩定。較可靠的做法是把視覺目標拆成六個彼此獨立的控制軸：

1. **固有色／色票**：牆、木材、織品、植栽分別是什麼顏色，各占畫面多少。
2. **白平衡／色偏**：白牆是否保持中性，暖意來自物件固有色，而非全畫面橘黃濾鏡。
3. **光線／對比**：光源大小、方向、陰影軟硬、暗部是否保留細節。
4. **材質／高光**：霧面、roughness 感、反射形狀，以及哪些物件才允許亮面。
5. **相機／構圖**：2.5D、俯視角、景深與畫面比例；避免電影鏡頭語彙誤導色彩與光影。
6. **後製／排除項**：明確排除 HDR、teal-orange、bloom、heavy AO、crushed blacks 等現象。

最重要的一句是：**「溫馨」由奶油白、燕麥、淺木、鼠尾草綠和生活物件表達；光線維持中性日光，不能用橘黃白平衡代替溫馨。**

OpenAI 官方建議用清楚、具體的光線描述，例如「左側窗戶的柔和自然光」，而不是「漂亮的光」；編修時則明列改什麼、哪些必須保持不變。[OpenAI Academy：Creating images with ChatGPT](https://openai.com/academy/image-generation/)

## 1. 為什麼只寫「低飽和」不穩定

### 1.1 「低飽和」只控制一個抽象結果，沒有指定形成方式

同樣看起來低飽和，可能來自完全不同的畫面：

- 物件固有色本來就是低彩度。
- 全畫面疊灰色濾鏡。
- 暗部很深、亮部很亮，只有中間調低彩度。
- 暖黃白平衡讓藍綠被壓掉。
- 高光過曝，造成表面看似褪色。

因此模型即使遵守「low saturation」，也可能仍產生黃牆、橘木頭、黑陰影與強反光。Google Imagen 的官方提示指南將主體、背景、風格、相機、光線、材質與畫面比例分開示範，代表這些屬性需要個別描述，而不能只靠一個總結形容詞控制。[Google Imagen：Prompt and image attribute guide](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/img-gen-prompt-guide)

### 1.2 prompt 常同時含有相反訊號

以下詞彙很常被當作「高級感」，但會推動畫面往本案不想要的方向：

| 常見詞 | 可能帶來的副作用 | 居遊所替代說法 |
| --- | --- | --- |
| `warm lighting` | 全畫面橘黃、白牆不白 | `neutral daylight white balance; warmth comes from beige textiles and light wood` |
| `golden hour` | 黃橘色偏、長陰影、戲劇性 | `soft diffused daytime window light` |
| `cinematic`／`movie still` | 強對比、暗角、景深、戲劇光 | `clean 2.5D game environment, readable UI-friendly lighting` |
| `dramatic lighting` | 深黑陰影、輪廓光、局部過曝 | `high-key soft light, open shadows, gentle contrast` |
| `HDR`／`4K HDR` | 局部對比、銳化與高光感加重 | `clean edges, restrained contrast, preserved highlight detail` |
| `glossy 3D render` | 塑膠高光、漆面家具 | `matte painted surfaces, broad dim highlights, high roughness appearance` |
| `cozy` 單獨使用 | 模型可能把 cozy 翻譯成壁爐、燭光或黃燈 | 指定低彩度色票、日光、布料、淺木與生活小物 |

Adobe 的官方指南把 cinematic 描述為 dramatic lighting、lens flare 與 high contrast；Google 的指南則把 golden hour、dramatic lighting、HDR 等列為能明顯改變輸出的修飾詞。雖然 Adobe 的該段文件以影片為例，這些仍是生成模型中應避免混用的視覺語彙。[Adobe Firefly：Writing effective prompts for video](https://helpx.adobe.com/firefly/web/work-with-audio-and-video/work-with-video/writing-effective-text-prompts-for-video-generation.html) [Google Imagen：Prompt and image attribute guide](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/img-gen-prompt-guide)

### 1.3 模型可能重寫 prompt，且生成需要迭代

使用 OpenAI Responses API 的 image generation tool 時，主模型會自動修訂 prompt，API 會回傳 `revised_prompt`。如果原始 prompt 寫「cozy」，修訂後可能增加 warm、heartwarming 等詞；正式產線應保存並檢查 `revised_prompt`，不是只記錄自己送出的文字。[OpenAI API：Image generation](https://developers.openai.com/api/docs/guides/image-generation)

Google 與 OpenAI 都建議透過小幅、逐項的迭代收斂結果。OpenAI 特別建議一次調整一個元素，並重複最重要的限制以減少漂移。[OpenAI Academy：Creating images with ChatGPT](https://openai.com/academy/image-generation/) [Google Imagen：Prompt and image attribute guide](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/img-gen-prompt-guide)

### 1.4 本文推論：生成模型不等於校色工具

Hex、Kelvin、比例可以幫模型理解方向，但不能保證像色彩管理軟體一樣精確。若品牌色或商品顏色必須準確，應同時提供核准的色票／style reference，並在輸出後以取樣與人工審查驗證；商品本體需要像素級正確時，應採遮罩編修或把原始商品像素重新合成，而不是讓 style transfer 重畫整件商品。

Adobe 明確說明 style reference 會影響色彩、紋理、光線和其他風格特質，且重複使用同一張 reference 有助品牌一致性；這比每次只重打「low saturation」可靠。[Adobe Firefly：Style reference images](https://helpx.adobe.com/firefly/web/work-with-images/generate-images/reference-images-for-styling.html)

## 2. 可控制的提示詞維度

### 2.1 Prompt 結構

建議固定以下順序，讓每次生成都能逐欄比較：

```text
[用途與內容]
[畫面風格與幾何]
[構圖與相機]
[固有色／色票與面積比例]
[白平衡]
[光線與明暗對比]
[材質與高光]
[後製與清晰度]
[必須保留／排除項]
```

Google 建議從 subject、context/background、style 開始，再加入相機位置、光線、鏡頭、材質與比例；OpenAI 則強調 purpose、subject、setting、visual style，以及必要的 framing、lighting 和 constraints。[Google Imagen：Prompt and image attribute guide](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/img-gen-prompt-guide) [OpenAI Academy：Creating images with ChatGPT](https://openai.com/academy/image-generation/)

### 2.2 色票與面積比例

不要只說 pastel 或 muted；同時定義「哪些顏色、放在哪裡、占多少」。居遊所可先用以下起始色票：

| 角色 | sRGB 參考色 | 畫面占比 | 用途 |
| --- | --- | --- | --- |
| 主中性色 | `#F3EFE6` | 約 55–65% | 牆面、大片背景、淺色櫃體 |
| 燕麥／淺木 | `#D7C2A3` | 約 20–25% | 地板、桌面、家具腳 |
| 鼠尾草綠 | `#A9B79E` | 約 8–12% | 沙發、植栽、織品 |
| 淡杏粉 | `#D9A995` | 約 3–6% | 靠墊、花器、小面積焦點 |
| 中性深灰綠 | `#6F786E` | 小於 5% | 輪廓、把手、文字附近對比 |

可在 prompt 中寫：

```text
Use an approximately 60/25/10/5 color distribution: warm off-white, pale natural wood, muted sage green, and dusty apricot accents. Keep every color close in value and chroma; use dark color only for small readable details.
```

Google 官方示範了 duotone 可直接指定兩個顏色，也提供 aspect ratio 的獨立參數；實務上應在 API／UI 設定真正的比例，不只把 `16:9` 寫進 prompt。[Google Imagen：Prompt and image attribute guide](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/img-gen-prompt-guide)

若需要更穩定，將上述色票畫成一張無漸層色卡，與一張核准的 Hero Room 一起作 style reference。OpenAI 建議多張參考圖時保持數量少，並明確說明每張圖的用途。[OpenAI Academy：Creating images with ChatGPT](https://openai.com/academy/image-generation/)

### 2.3 白平衡：把「暖意」與「偏黃」拆開

推薦描述：

```text
Neutral daylight white balance. White walls stay neutral ivory rather than yellow. Neutral gray shadows. Warmth comes only from light wood, oatmeal textiles, and dusty-apricot accents, not from amber lighting or a warm color filter.
```

中文：

```text
中性日光白平衡；白牆維持中性象牙白，不呈黃色；陰影為中性淺灰。溫暖感只來自淺木、燕麥色布料與淡杏色小物，不來自琥珀燈光或全畫面暖色濾鏡。
```

若工具能理解攝影語彙，可加 `approximately 5000–5500K neutral daylight`，但把它視為意圖提示，不是可量測保證。更可靠的錨點仍是「白牆不能黃、陰影為中性灰」與 reference image。

### 2.4 光線與明暗對比

推薦正面描述：

- `high-key soft diffused daylight`
- `large window light from the upper left`
- `gentle ambient fill`
- `open, readable shadows with visible detail`
- `short, soft contact shadows`
- `protected highlight detail`
- `gentle value transitions`

需要避免的描述：

- `golden hour`
- `dramatic light`
- `hard rim light`
- `low-key lighting`
- `deep shadows`
- `film noir`
- `spotlight`

Adobe Firefly 把 Muted color、Pastel color、Cool／Warm tone 與 Backlighting、Dramatic、Harsh、Studio light 等拆成不同控制項，證明「色調」與「光線」不應混成一個 cozy 形容詞。[Adobe Firefly：Effects for generated images](https://helpx.adobe.com/firefly/web/work-with-images/generate-images/effects-for-generated-images.html)

### 2.5 材質與塑膠高光

不要只寫 `not plastic`；先告訴模型正確材質應如何反光：

```text
Matte painted wood and soft woven fabric, high-roughness appearance, broad and dim highlights, no sharp specular hotspots. Ceramic objects may have one restrained soft highlight; all other furniture remains matte.
```

中文：

```text
霧面烤漆木與柔軟織布，呈現高粗糙度觀感；高光寬、柔、暗，不出現尖銳鏡面亮點。只有陶瓷小物可有一處克制的柔和高光，其餘家具維持霧面。
```

「made of／材質」是 Google Imagen 官方列出的進階提示維度；應逐類寫出木材、布料、陶瓷，而不是把所有物件籠統稱作 3D render。[Google Imagen：Prompt and image attribute guide](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/img-gen-prompt-guide)

### 2.6 相機與畫面語言

居遊所 Key Art 建議：

- `2.5D isometric game-room view`
- `elevated three-quarter camera`
- `near-orthographic projection`
- `deep focus, every furniture item readable`
- `clean silhouettes and generous spacing`
- `16:9 landscape composition for a web hero`

避免：`cinematic lens`、`anamorphic`、`shallow depth of field`、`bokeh`、`dutch angle`、`lens flare`。這些不但容易帶入電影色調，也會讓可購買家具失焦或變形。

## 3. 正面提示詞與負面約束應如何搭配

### 3.1 原則：先寫替代方案，再寫排除清單

有效配對例：

```text
Positive: neutral daylight, muted sage and oatmeal palette, open soft shadows, matte furniture.
Exclude: amber cast, oversaturated colors, dramatic contrast, sharp glossy reflections.
```

無效或不完整例：

```text
low saturation, not yellow, not too 3D
```

OpenAI 官方一般提示原則建議不要只說「不要什麼」，還要說「改成什麼」；圖片指南也強調對 layout、texture、materials、light 使用具體語句。[OpenAI Help：Prompt engineering best practices](https://help.openai.com/en/articles/6654000-how-to-use-advanced-prompt-engineering) [OpenAI Academy：Creating images with ChatGPT](https://openai.com/academy/image-generation/)

### 3.2 可直接使用的 Negative block

若工具有獨立 negative prompt 欄位，放入名詞／形容詞清單：

```text
oversaturated colors, neon colors, orange cast, yellow cast, amber filter, golden-hour grading, teal-and-orange color grade, high contrast, crushed blacks, clipped highlights, dramatic lighting, hard rim light, harsh shadows, heavy ambient occlusion, glossy plastic, lacquered furniture, sharp specular hotspots, wet surfaces, bloom, lens flare, HDR look, cinematic movie still, vignette, shallow depth of field, bokeh, photorealistic rendering
```

Google 對支援 negative prompt 的 Imagen 版本建議直接列出不想看到的內容，例如 `wall, frame`，而非寫 `no wall` 或 `don't show wall`。[Google Imagen：Prompt and image attribute guide](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/img-gen-prompt-guide)

重要版本限制：Google 已將 negative prompt 視為舊功能；官方文件指出 `imagen-3.0-generate-002` 及之後版本不提供此功能。使用這些模型或 OpenAI GPT Image 時，把排除項放在主 prompt 的 `Avoid / Exclude` 區段，不能假設 API 有 `negative_prompt` 參數。[Google Imagen：Omit content using a negative prompt](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/omit-content-using-a-negative-prompt)

### 3.3 不要讓排除清單喧賓奪主

排除項控制「不要出現什麼」，正面 prompt 決定「應該出現什麼」。如果 negative block 很長而正面視覺規格只有 `cute room`，模型仍缺乏可靠目標。建議正面規格至少涵蓋 palette、white balance、lighting、materials 和 camera，negative block 只處理常見失敗。

## 4. 居遊所 2.5D 場景可直接複製的中英文 Prompt

### 4.1 中文完整版：從零生成 Hero Room

```text
用途：為「居遊所 Play Ground」製作一張可作為網站 Hero Room 與 3D 場景美術基準的原創 2.5D 居家遊戲畫面。

內容：一間明亮的小宅客廳與餐區，包含一張雙人布沙發、圓角茶几、低矮電視櫃、雙人餐桌、落地燈、地毯、植栽、收納籃與少量可購買的生活日用品。所有物件分離、輪廓清楚、可辨識且具合理使用尺度；不要人物或既有角色。

風格與幾何：原創、療癒、親切的玩具屋式 2.5D 遊戲美術。家具低重心、厚實圓角、簡化低多邊形輪廓，細節克制但不像方塊草模。可愛感來自比例、圓角與生活細節，不使用臉、眼睛或既有 IP 特徵。

相機與構圖：抬高的三分之四俯視角，近似正交投影，深景深，所有家具保持清晰。房間輪廓完整，物件之間留有可讀空隙，適合 16:9 網站橫幅。

色票：全畫面低至中低彩度，約 60% 中性奶油白 #F3EFE6、25% 燕麥與淺木 #D7C2A3、10% 鼠尾草綠 #A9B79E、5% 淡杏粉 #D9A995；深色只用於少量輪廓與把手。顏色柔和但不灰髒。

白平衡：中性日光白平衡，約 5000–5500K 的觀感。白牆維持中性象牙白，不呈橘黃；陰影為中性淺灰。溫暖感只來自淺木、燕麥布料與淡杏色小物，不來自黃色燈光或暖色濾鏡。

光線：左上方大窗戶的高亮柔和漫射日光，均勻環境補光，明暗反差溫和。陰影短、淺、柔，接觸位置仍有足夠立體感；暗部保留材質細節，亮部不過曝。

材質：霧面烤漆木、柔軟織布、天然淺木與少量陶瓷。整體呈高粗糙度觀感，高光寬、柔、暗；只有陶瓷小物可有一處克制的柔和高光。不要塑膠亮面或濕亮表面。

後製：乾淨柔和的遊戲畫面，克制的局部對比，沒有電影調色。避免過度飽和、霓虹色、橘黃偏色、琥珀濾鏡、黃昏金色光、teal-orange、深黑陰影、過曝高光、強輪廓光、重 AO、銳利塑膠高光、HDR、bloom、lens flare、暗角、淺景深與散景。
```

### 4.2 English full prompt: Hero Room generation

```text
Purpose: create an original 2.5D home-decor game scene for “HomePlay Play Ground”, suitable both as a website hero room and as the approved visual target for the interactive 3D scene.

Content: a bright compact living and dining room with one two-seat fabric sofa, a rounded coffee table, low TV cabinet, small dining table for two, floor lamp, rug, plants, storage basket, and a restrained set of purchasable everyday household objects. Keep every object separate, readable, and plausibly scaled. No people and no existing characters.

Style and geometry: an original, soothing, friendly toy-house 2.5D game aesthetic. Low, chunky furniture with generous rounded corners and clean simplified low-poly silhouettes. Add restrained crafted details so the room does not look like a primitive blockout. Cuteness comes from proportion, rounded forms, and domestic details—never from faces, eyes, or recognizable IP traits.

Camera and composition: elevated three-quarter view, near-orthographic projection, deep focus, every furniture item readable. Show the full room boundary with clear spacing between objects. Compose for a 16:9 website hero.

Palette: low to moderately low chroma throughout. Use approximately 60% neutral creamy off-white #F3EFE6, 25% oatmeal and pale natural wood #D7C2A3, 10% muted sage #A9B79E, and 5% dusty apricot #D9A995. Reserve dark color only for tiny outlines and hardware. Soft and clean, never muddy gray.

White balance: neutral daylight white balance, approximately a 5000–5500K appearance. White walls remain neutral ivory, never orange or yellow; shadows stay light neutral gray. Warmth comes only from pale wood, oatmeal textiles, and dusty-apricot accents—not from amber light or a warm global filter.

Lighting: high-key soft diffused daylight from a large upper-left window, with gentle even ambient fill and restrained contrast. Shadows are short, pale, and soft, with enough contact shadow to ground objects. Preserve texture detail in shadows and highlights.

Materials: matte painted wood, soft woven fabric, pale natural wood, and a small amount of ceramic. High-roughness appearance with broad, dim, soft highlights. Only ceramic accessories may carry one restrained soft highlight. No glossy plastic or wet-looking surfaces.

Finish: a clean, soft, UI-friendly game scene with restrained local contrast and no cinematic color grade. Avoid oversaturated or neon colors, orange/yellow cast, amber filters, golden-hour grading, teal-and-orange grading, crushed blacks, clipped highlights, dramatic rim light, heavy ambient occlusion, sharp plastic speculars, HDR look, bloom, lens flare, vignette, shallow depth of field, and bokeh.
```

### 4.3 短版修正 prompt：結果太黃、太重、太亮面時

```text
Keep the same room, camera, layout, furniture, object count, shapes, and proportions. Change only the color grade, lighting balance, and material response.

Use neutral daylight white balance so the white walls read as neutral ivory, not yellow. Keep the palette muted: creamy off-white, pale wood, oatmeal, sage, and dusty apricot. Use high-key diffused daylight, open light-gray shadows, restrained contrast, and preserved highlight detail. Make wood and fabric matte with broad dim highlights; remove sharp plastic-looking reflections.

Warmth must come from wood and textiles, not an amber filter. Exclude orange/yellow cast, golden-hour grading, teal-orange grading, dramatic contrast, crushed blacks, clipped highlights, heavy AO, glossy plastic, bloom, lens flare, and cinematic color grading. Keep everything else exactly the same.
```

## 5. 編修既有圖片時的 invariant 寫法

### 5.1 最可靠的格式

把 prompt 拆成五個有標題的區塊：

```text
EDIT ONLY
PRESERVE EXACTLY
TARGET COLOR / LIGHT / MATERIAL
DO NOT INTRODUCE
VALIDATION
```

OpenAI 官方明確建議編修時寫出「Change only X. Keep everything else exactly the same」，並採小步、單一元素的修正。[OpenAI Academy：Creating images with ChatGPT](https://openai.com/academy/image-generation/)

### 5.2 中文 invariant prompt

```text
只修改：整體白平衡、光線反差、陰影密度，以及材質的鏡面高光強度。

必須完全保留：原圖的畫面比例、相機位置與角度、透視、房間輪廓、牆門窗位置、所有家具與生活物件的數量、種類、位置、旋轉、大小、外輪廓、商品造型、圖案、標誌、文字、遮擋關係與裁切。不得新增、刪除、替換或移動任何物件。

目標：改為中性日光白平衡；白牆保持中性象牙白，陰影為淺中性灰。保留奶油白、燕麥、淺木、鼠尾草綠與淡杏色的相對關係。光線高亮柔和、反差克制，暗部可讀、亮部不過曝。布料與木材呈霧面，高光寬、柔、暗，不呈塑膠感。

不得引入：橘黃濾鏡、黃昏金色光、teal-orange、深黑陰影、強輪廓光、重 AO、塑膠亮面、濕亮表面、bloom、lens flare、暗角、淺景深、散景、新的光源、新裝飾或任何角色。

完成前逐項確認：家具數量及 transform 不變；門窗和房型不變；商品顏色關係與標誌不變；改動只發生在白平衡、光線反差、陰影與高光反應。其餘全部與原圖完全相同。
```

### 5.3 English invariant prompt

```text
EDIT ONLY:
Adjust the global white balance, lighting contrast, shadow density, and the intensity/shape of material specular highlights.

PRESERVE EXACTLY:
Keep the original aspect ratio, camera position and angle, perspective, room outline, walls, doors, windows, object count, object identity, furniture positions, rotations, sizes, silhouettes, product geometry, patterns, logos, text, occlusion order, and crop. Do not add, remove, replace, move, resize, or redesign any object.

TARGET COLOR / LIGHT / MATERIAL:
Use neutral daylight white balance. White walls remain neutral ivory and shadows remain light neutral gray. Preserve the relative product-color relationships among creamy off-white, oatmeal, pale wood, muted sage, and dusty apricot. Use high-key diffused light, restrained contrast, readable shadow detail, and protected highlights. Fabric and wood are matte with broad, dim, soft highlights—never glossy plastic.

DO NOT INTRODUCE:
Orange or yellow filter, golden-hour light, teal-and-orange grading, crushed blacks, clipped highlights, dramatic rim light, heavy AO, glossy plastic, wet surfaces, bloom, lens flare, vignette, shallow depth of field, bokeh, new light sources, new decorations, text, or characters.

VALIDATION:
Before finishing, verify that all furniture counts and transforms, architectural geometry, product color relationships, logos, and text are unchanged. Only white balance, lighting contrast, shadow density, and material highlight response may differ. Keep everything else exactly the same.
```

### 5.4 兩張參考圖的寫法

若有「原始場景」和「核准風格圖」，明確分工：

```text
Image 1 is the immutable structure and product source. Preserve its exact composition, camera, room geometry, furniture, transforms, product silhouettes, colors, logos, and text.

Image 2 is a style reference only. Transfer only its restrained palette, neutral daylight balance, soft high-key contrast, shallow neutral-gray shadows, and matte material response to Image 1. Do not transfer objects, composition, camera, architecture, patterns, or decorations from Image 2.

Change only color grading, lighting balance, shadow density, and material highlight response. Keep everything else from Image 1 exactly the same.
```

OpenAI 官方建議參考圖數量保持精簡，並以 `Image 1`、`Image 2` 清楚說明各自用途；Adobe 也把 Composition reference 與 Style reference 分成兩種不同控制，前者依輪廓與深度維持構圖，後者控制風格、色彩、紋理與光線。[OpenAI Academy：Creating images with ChatGPT](https://openai.com/academy/image-generation/) [Adobe Firefly：Match image composition to reference](https://helpx.adobe.com/firefly/web/work-with-images/generate-images/match-image-composition-to-reference-image.html) [Adobe Firefly：Style reference images](https://helpx.adobe.com/firefly/web/work-with-images/generate-images/reference-images-for-styling.html)

### 5.5 編修工具設定

#### OpenAI GPT Image

- 使用 edit 而不是重新從文字生成。
- `gpt-image-2` 對所有圖片輸入自動採高 fidelity；其他提供 `input_fidelity` 的 GPT Image 模型，若要保留輸入細節，應設定為 `high`。[OpenAI API：Image input fidelity](https://developers.openai.com/api/docs/guides/image-generation#image-input-fidelity)
- 若只有背景、窗景或光影區域要改，使用 mask 縮小重畫範圍；Image API 支援上傳 image 和 mask 做局部編修。[OpenAI API：Image generation](https://developers.openai.com/api/docs/guides/image-generation)
- 使用 Responses API 時保存 `revised_prompt`，確認系統沒有重新加入 cinematic、warm glow 或 golden-hour 類詞。

#### Adobe Firefly

- 原圖放 Composition reference，調高 adherence／strength 以維持 outline 和 depth。
- 核准色彩圖放 Style reference；不要把同一張圖的「構圖」與「風格」目的混寫。
- Color and tone 選 `Muted color` 或 `Pastel color`；避免 `Golden`、`Vibrant colors`、`Warm tone`。
- Lighting 避免 `Dramatic light`、`Harsh light`、`Golden hour`；先測試 `Studio light` 或不加預設，再由 prompt 指定 soft diffused daylight。[Adobe Firefly：Effects for generated images](https://helpx.adobe.com/firefly/web/work-with-images/generate-images/effects-for-generated-images.html)

#### Google Imagen

- 使用支援 image editing／customization 的模型時，把 style transfer 寫成 `Transform the subject in image [1] to have the style of ... The image shows ...`，並具體展開 palette、light、material。[Google Imagen：Instruct customization](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/instruct-customization)
- 若構圖必須不變，不要只使用 style customization 期待它同時精準保留商品、角度與構圖。Google 官方將某些「保留構圖又轉風格／把產品放到不同場景並指定精確動畫式光色」列為非預期或低品質案例；應使用遮罩、controlled customization 或分區處理。[Google Imagen：Style customization](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/style-customization)

## 6. 建議工作流

### Step 1：先做失敗診斷，不直接重生

用固定欄位標記現圖：

```text
Saturation: acceptable / too high / muddy
White balance: neutral / yellow / orange / green
Contrast: gentle / crushed shadows / clipped highlights
Material: matte / glossy-plastic / wet
Lighting: soft / dramatic / hard rim / heavy AO
Composition drift: none / minor / unacceptable
Product drift: none / minor / unacceptable
```

每輪只解一至兩個問題。例如第一輪只修白平衡與對比；第二輪才修材質高光。OpenAI 官方建議小幅、針對性修改以維持一致性。[OpenAI Academy：Creating images with ChatGPT](https://openai.com/academy/image-generation/)

### Step 2：建立一張核准的 neutral style reference

這張圖必須具備：

- 真正中性的白牆與淺灰陰影。
- 核准色票及 60/25/10/5 面積關係。
- 霧面木材／布料與克制陶瓷高光。
- 高亮柔光，但沒有 golden-hour、bloom 或 heavy AO。
- 不含強烈角色或會被錯誤轉移的特殊物件。

### Step 3：固定模型、尺寸、比例與 seed

- 同一輪比較必須使用相同模型、quality、size／aspect ratio、seed（若工具支援）、reference 和 reference strength。
- 實際 aspect ratio 用 API／UI 參數設定，prompt 只描述構圖意圖。
- 一次產 3–4 張候選，只改一個 prompt 維度。
- 保存原 prompt、revised prompt、negative block、模型版本與設定。

### Step 4：先保構圖，再轉風格

1. 原圖作 structure/composition source。
2. 核准圖作 style source。
3. invariant prompt 限定只改 color/light/material。
4. 商品、標誌或 UI 需要完全正確時，用 mask 保護或在最後重合成原始像素。

### Step 5：建立可量測驗收

不要只問「看起來有沒有比較舒服」。每張圖至少檢查：

- 白牆平均是否仍接近中性，而非 R 明顯高於 G/B 的黃橘偏色。
- 深色區是否仍有可辨識材質，不出現大片純黑。
- 高光是否只落在允許亮面的陶瓷／玻璃，木材與布料沒有尖銳白點。
- 核准色票是否仍維持相對關係。
- 家具數量、位置、輪廓、商品圖案和標誌是否完全不變。
- 與固定 reference 並排時，是否仍屬同一套視覺系統。

## 7. 快速排錯對照表

| 現象 | 不建議只加 | 應改寫成 |
| --- | --- | --- |
| 全圖太黃 | `less yellow` | `neutral daylight white balance; white walls remain neutral ivory; warmth only from wood and textiles` |
| 色彩太豔 | `low saturation` | 具名 4–5 色色票＋面積比例＋`low-to-moderately-low chroma` |
| 陰影太黑 | `brighter` | `high-key diffused light; open light-gray shadows; visible detail in dark areas` |
| 家具像塑膠 | `not plastic` | `matte woven fabric and painted wood; broad dim soft highlights; high-roughness appearance` |
| 太像電影劇照 | `more game-like` | `near-orthographic 2.5D game-room view; deep focus; UI-friendly readable lighting; no cinematic grade` |
| 太扁、沒有立體感 | `more 3D` | `short soft contact shadows; gentle occlusion only at contact points; clean rounded silhouette` |
| Edit 後家具移位 | 重講完整新場景 | `Change only X; preserve exact camera, layout, geometry, object count and every transform; keep everything else exactly the same` |

## 一手來源

- [OpenAI Academy：Creating images with ChatGPT](https://openai.com/academy/image-generation/)
- [OpenAI API：Image generation](https://developers.openai.com/api/docs/guides/image-generation)
- [OpenAI Help：Prompt engineering best practices](https://help.openai.com/en/articles/6654000-how-to-use-advanced-prompt-engineering)
- [Google Imagen：Prompt and image attribute guide](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/img-gen-prompt-guide)
- [Google Imagen：Omit content using a negative prompt](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/omit-content-using-a-negative-prompt)
- [Google Imagen：Instruct customization](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/instruct-customization)
- [Google Imagen：Style customization](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/style-customization)
- [Adobe Firefly：Writing effective text prompts](https://helpx.adobe.com/firefly/web/work-with-images/generate-images/writing-effective-text-prompts.html)
- [Adobe Firefly：Effects for generated images](https://helpx.adobe.com/firefly/web/work-with-images/generate-images/effects-for-generated-images.html)
- [Adobe Firefly：Style reference images](https://helpx.adobe.com/firefly/web/work-with-images/generate-images/reference-images-for-styling.html)
- [Adobe Firefly：Match image composition to reference](https://helpx.adobe.com/firefly/web/work-with-images/generate-images/match-image-composition-to-reference-image.html)
- [Adobe Firefly：Writing effective prompts for video](https://helpx.adobe.com/firefly/web/work-with-audio-and-video/work-with-video/writing-effective-text-prompts-for-video-generation.html)
