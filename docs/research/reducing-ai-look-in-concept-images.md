# 降低意象圖「AI 感」：官方方法與居遊所工作流

更新：2026-08-13

## 結論

降低 AI 感的關鍵不是繼續疊加 `masterpiece`、`beautiful` 或更多 negative prompt，而是把「構圖、媒材、色彩、局部修正」拆開控制。對居遊所而言，最穩定的方法是：先用正確的 BH7／Blender 底圖鎖定幾何，再以單一真水彩參考圖控制媒材，最後用局部編修逐項處理顏色、紋理和物件錯誤。

## 官方資料交叉結論

1. OpenAI 建議用清楚的層級描述場景、主體、細節與限制，編修時明列「要改什麼」及「必須保留什麼」，且每輪聚焦一項變化。Image API 也支援輸入圖、遮罩與高輸入保真度，適合保留格局和家具再做局部風格化。  
   來源：[OpenAI Image Generation Guide](https://developers.openai.com/api/docs/guides/image-generation)、[OpenAI GPT Image Prompting Guide](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide)

2. Adobe Firefly 把 Composition Reference 和 Style Reference 分開：前者控制輪廓與深度，後者控制色彩、媒材、紋理與光線；兩者都有獨立 Strength。這比單靠一段長提示詞更適合鎖住戶型與水彩風格。  
   來源：[Composition Reference](https://helpx.adobe.com/firefly/web/work-with-images/generate-images/match-image-composition-to-reference-image.html)、[Style Reference](https://helpx.adobe.com/firefly/web/work-with-images/generate-images/reference-images-for-styling.html)、[Writing Effective Prompts](https://helpx.adobe.com/au/firefly/web/work-with-images/generate-images/writing-effective-text-prompts.html)

3. Midjourney 官方建議 Style Reference 提示詞保持簡單，避免互相衝突的風格描述；`--sw` 控制風格參考強度，`--raw` 與較低 `--stylize` 可減少模型預設美術化。  
   來源：[Style Reference](https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference)、[Raw Mode](https://docs.midjourney.com/hc/en-us/articles/32634113811853-Raw)、[Stylize](https://docs.midjourney.com/hc/en-us/articles/32196176868109-Stylize)

4. Google Imagen 建議以「主體＋情境／背景＋風格」組織提示詞，構圖與風格參考分開處理；固定 seed 可用於可靠的 A/B 測試。官方也提醒複雜 prompt 使用自動 prompt enhancement 可能產生不理想結果，此時應關閉 enhancement。  
   來源：[Imagen Prompt Guide](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/img-gen-prompt-guide)、[Generate Images](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/generate-images)、[Deterministic Images](https://cloud.google.com/vertex-ai/generative-ai/docs/image/generate-deterministic-images)

5. 真水彩不是全畫面均勻紙紋或規律排線，而是透明淡洗、紙白留白、濕畫法軟邊、局部積色／潮線與少量乾筆斷痕。這些現象應該只在適當區域出現。  
   來源：[The Met：Watercolor Materials and Techniques](https://www.metmuseum.org/perspectives/materials-and-techniques-drawing-watercolor)、[V&A：What is watercolour?](https://www.vam.ac.uk/articles/what-is-watercolour)

## 居遊所目前畫面的 AI 感來源

- 每個表面都有相近密度的細紋，像統一套上濾鏡。
- 家具、小物、植物和牆面完成度一樣高，沒有視覺主次。
- 輪廓同樣清楚、同樣平滑，缺少局部軟邊與筆觸變化。
- 所有物件過度完整、對稱、乾淨，缺少可控的不規則。
- 「watercolor texture」若只作為抽象關鍵詞，模型容易生成重複紙紋或色鉛筆狀排線。
- 負面詞很多，但正面沒有明定顏料如何落在紙上，因此模型仍用預設 3D／插畫美術補完。

## 建議工作流

1. **鎖構圖**：用 BH7 正確格局的 Blender clay render／線稿作 Composition Reference。門窗、牆體、家具尺寸與鏡頭不交給文字模型猜。
2. **鎖媒材**：另選一張有合法使用權、真正符合目標的水彩作品作 Style Reference；不要同一張參考圖同時負責格局與風格。
3. **先做媒材測試**：只生成空間、沙發、茶几與一株植物，通過水彩規則後才增加全屋生活用品。
4. **控制模型自由度**：風格強度從低到中開始，降低 visual intensity／stylize；不要一次要求「水彩＋卡通＋黏土＋3D＋繪本＋動漫」。
5. **固定 seed 做 A/B**：每輪只改一個變數，例如只改飽和度、只改紙紋、只改輪廓，才能知道是哪個詞造成結果變化。
6. **局部編修，不整張重生**：用 mask 修窗景、牆面洗色、局部紋理或家具錯誤；每次重申格局、家具、數量、位置及鏡頭保持不變。
7. **最後重合成**：正式商業圖應把精準的家具與格局區域重新合成，AI 只負責氣氛、筆觸、植栽與窗景等非精準區域。

## 建議提示詞

```text
以輸入的 BH7 Blender 構圖為不可變更的幾何底圖：牆體、門窗、家具數量、尺寸、位置與 35–40 度近正交鏡頭完全保持不變。

原創台灣小家庭的客餐廳，2.5D 模型屋構圖。媒材為透明水彩在冷壓棉紙上：背景與牆面是大面積安靜淡洗；窗邊只有少量濕畫法暈染；家具使用薄層罩染；只在少數物件下緣出現自然顏料積邊；亮部直接保留紙白。使用細薄梅灰水彩墨線，輪廓有輕微手勢變化，局部邊緣溶入淡洗。

低彩度粉霧藍、淡貝殼粉、灰鼠尾草綠與漂白淺木；中低對比、柔和中性晨光、短而淺的帶色陰影。保留大面積沒有紋理的安靜區域；細節集中在沙發、茶几與少數生活用品，遠處與次要物件降低完成度。

只改變媒材、色彩與光線，不增刪物件、不改變建築與家具外形。

排除：色鉛筆、規律排線、全畫面均勻紙紋、重複壓紋、每個表面同樣複雜、所有輪廓同樣銳利、塑膠高光、濕亮表面、HDR、bloom、電影調色、全畫面暖黃、過度飽和、深黑陰影、重 AO、物件變形、額外家具。
```

## 參數起點（實務建議，非官方固定值）

- Midjourney：先試 `--raw --s 25–75 --sw 75–150`，一次只改一個參數。
- Firefly：Composition Strength 高；Style Strength 低至中；Visual intensity 低至中。
- OpenAI：以上一張通過構圖的圖作輸入，使用高 input fidelity；用遮罩逐區修改，避免整張重生。
- Imagen：複雜 prompt 關閉 prompt enhancement，固定 seed 產生 4 張候選做盲選。

## 驗收門檻

- 放大後不應看到全畫面同一種重複紋理。
- 至少 30–40% 畫面是安靜淡洗或紙白，不被細節填滿。
- 主體、次要家具、背景的邊緣清晰度與完成度應有三個層級。
- 建築與家具精準區域不得因風格化而變形。
- 拿掉 UI 後仍像一張有媒材邏輯的水彩插畫，而不是 3D 圖套水彩濾鏡。
