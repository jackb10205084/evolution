# `ai-parallax-landing-prompts` 使用與居遊所套用建議

> 研究日期：2026-08-11。僅查閱 [官方 GitHub repository](https://github.com/TaonyDesign/ai-parallax-landing-prompts)、README 與其中四份 Markdown 文件。

## 一句話結論

這不是可執行專案，也不是可安裝的 UI library；它是以一個 Steam Machine concept redesign 為案例的 **prompt／reference pack**。Repo 只有 `README.md` 與四份工作流文件，共 8 commits；沒有 source directory、`package.json`、requirements、lockfile、測試或 build 指令。居遊所可以採用它的「決策與驗收骨架」，但不能複製案例視覺、Steam 素材、實作成品或把生成式影片冒充真正的 3D 編輯功能。

## Repo 實際包含什麼

| 文件 | 角色 | 主要輸出 |
|---|---|---|
| [`01-brief-and-prd.md`](https://github.com/TaonyDesign/ai-parallax-landing-prompts/blob/main/01-brief-and-prd.md) | 產品經理 | `design-brief.md`、`prd.md`，含 MoSCoW、逐功能可測驗收、非目標、開放問題 |
| [`02-design-direction.md`](https://github.com/TaonyDesign/ai-parallax-landing-prompts/blob/main/02-design-direction.md) | 設計師 | 多個 wireframe 方向、合併方案、經核實的真實文案、mood board／UI 視覺方向 |
| [`03-ai-assets.md`](https://github.com/TaonyDesign/ai-parallax-landing-prompts/blob/main/03-ai-assets.md) | 素材團隊 | AI 3D GLB、爆炸拆解圖、首尾幀影片與 frame sequence；同時提供驗收規則 |
| [`04-build-and-scroll.md`](https://github.com/TaonyDesign/ai-parallax-landing-prompts/blob/main/04-build-and-scroll.md) | 前端工程師／驗收者 | 效果規格清單、React 捲動頁、影片拆幀、scroll-to-frame 與停留點 |

README 明說案例經過 26 輪「給規格 → 交付 → 驗收 → 退件」，AI 只負責降低試錯成本，最終設計仍需人工完成。這是整個 repo 比單句 prompt 更值得採用的部分。[來源：README](https://github.com/TaonyDesign/ai-parallax-landing-prompts#如何使用這份文檔)

## 安裝與執行方式

沒有安裝或執行方式。可以 clone repo 或直接閱讀 Markdown，然後把每階段的 prompt 骨架改寫給自己的 AI／設計工具；repo 本身不會產生網頁。

文件示範的外部工具包括 Claude Code、Figma／Figma API、Google Stitch、Meshy、Google Flow、Gemini、Higgsfield、ffmpeg 與 `cwebp`。範例前端技術棧寫的是 React + TypeScript + Vite + Tailwind，捲動用 GSAP ScrollTrigger + Lenis，但 repo **沒有提供 package manifest 或版本**，也沒有把這些依賴一併授權。居遊所應沿用現有 Next.js／React／R3F 專案，而不是為了跟範例一致改成 Vite。

若要重現「影片隨捲動」概念，文件只提供兩個 shell 範例：ffmpeg 拆 PNG、`cwebp` 轉 WebP，再由網頁把 scroll progress 映射至 canvas frame。它估計 10 秒、30fps 約 300 張、10–30MB，因此需要 preload 或降低幀率／寬度。[來源：Step 4](https://github.com/TaonyDesign/ai-parallax-landing-prompts/blob/main/04-build-and-scroll.md#4-3-捲動控制影片拆幀)

## 核心 prompt 與工作流

以下保留方法，不複製 Steam 案例的「血肉」。

### 1. 先決策，不先寫程式

- 要 AI 一次問一題，每題提供 2–3 個可比較選項、推薦與理由。
- 第一輪只完成 Brief；確認後才完成 PRD。
- PRD 必須有 MoSCoW、可測試驗收條件、明確非目標、仍未決的問題；禁止 AI 自行補答案。

居遊所可使用的改寫版：

```text
你是居遊所 Play Ground landing page 的產品與設計夥伴。先不要寫程式。
請一次只問一題，每題提供 2–3 個具體選項、推薦方案與理由。
第一輪只釐清：主要受眾、建案聯名層級、首要轉換、五段捲動敘事、
與 3D 編輯器的分界、低效能與 reduced-motion fallback、可用的正式素材與權利。
我確認 Design Brief 後再產 PRD。PRD 必須包含 MoSCoW、逐項可測驗收、
非目標與開放問題；沒有證據的建案、價格、家具與成效資料不得自行補寫。
```

### 2. AI 先出方向，人決定成稿

- 先要 2–3 個 wireframe，不直接要成稿。
- 合併方案時逐項說明「保留 A 的什麼、採用 C 的什麼」，並先報告合併計畫。
- 注入文案時只換文字，不動排版；找不到對應資料保持原樣，最後列出成功與未替換欄位。
- mood board 和 frame／layer 必須清楚命名，避免 AI 讀錯版本。

### 3. 素材 prompt 要描述可驗證的空間與物理條件

原 repo 的通用骨架是：物件類型與時代 → 材質／表面 → 主形體 → 部件逐項描述 → 品質與背景；部件必須寫清楚數量、形狀、位置、顏色。[來源：Step 3](https://github.com/TaonyDesign/ai-parallax-landing-prompts/blob/main/03-ai-assets.md#3-1-圖片轉-3d-模型meshy)

動畫則使用：`Scene` → `First frame` → `Sequence` → `Last frame` → `Optics` → `Lighting` → `Physics`。每一步都寫「往哪裡、速度、停在哪」，明定 rigid body、只平移／旋轉、不可變形。先製作正確首圖與尾圖，再以 frames-to-video 鎖住兩端，降低中間漂移。[來源：首尾幀錨定](https://github.com/TaonyDesign/ai-parallax-landing-prompts/blob/main/03-ai-assets.md#3-4-首尾幀錨定這一步最重要的一招)

對居遊所而言，這些規則只適合 **landing page 裝飾性短片或 Key Art**。正式戶型、可購買家具、尺寸、材質與 SKU 必須由正式圖面／GLB 驗證，不能由 prompt 生成。

### 4. 捲動是敘事時間軸，不是裝飾

- 把 scroll progress 映射到 frame 或 3D camera timeline。
- 使用非線性停留點，在每個功能節點讓畫面暫停、文案進場。
- 所有 scroll threshold、duration、frame range、easing 集中於單一 constants/config。
- 每完成一段就做連續畫面驗收；退件描述包含「哪個狀態、看到什麼錯誤、像什麼」。

## 套用到居遊所的原創版本

### Landing page 五段敘事

1. **抵達聯名建案**：由抽象模型屋外觀平滑進入 BH7 戶型；CTA 是「開始配置」。
2. **選擇戶型與生活情境**：格局保持精準，只讓日夜、窗景與氣氛轉換。
3. **家具落位**：用 3–5 件自有品牌商品依序落位，畫面同步顯示商品卡與總價；不使用虛構商品。
4. **從遊戲畫面到寫實作品**：以相同相機、格局與商品位置做 Q 版／寫實 before-after；只改光影與氣氛。
5. **預約賞屋**：房間退到模型屋比例，浮出建案聯名 CTA、時段與個資同意說明。

Landing 動畫只是故事入口。進入 `/prototype/3d` 或正式 editor 後，使用者必須得到真正可拖曳、旋轉、增刪、碰撞與儲存的 R3F 場景，不能以 frame sequence 偽裝互動。

### 視差分層

- 背景：建案窗景／城市剪影，低速移動。
- 中景：精準戶型與大型家具，移動最少以維持可信度。
- 前景：植栽、布料、商品卡與聯名 UI，移動稍快。
- 指標：前後景最大位移、模糊、景深與速度都由 visual contract 約束；平板降低層數，`prefers-reduced-motion` 顯示靜態關鍵幀。

### 建議驗收

- 所有建案文案、戶型與商品均能追溯到正式資料來源。
- scroll 任意停止時不得有家具變形、穿牆、品牌外觀漂移或背景接縫。
- 桌面與 iPad 實測；Landing frame sequence 不阻塞 3D editor 資產下載。
- LCP Hero 先提供 poster；長序列 lazy-load，失敗時仍可看到建案介紹與預約 CTA。
- 測試鍵盤、觸控、reduced motion、WebGL unavailable 與低記憶體狀態。

## 授權與安全邊界

Repo 沒有獨立 `LICENSE`。README 的文字聲明是「prompt 可取用、改寫、商用，註明出處即可」，因此可把 prompt 方法改寫後使用並標註來源；但這不是標準開源軟體授權，也不能推定涵蓋示範網站、Steam／Valve 素材、外部 AI 生成物、字型或第三方工具。[來源：README 授權聲明](https://github.com/TaonyDesign/ai-parallax-landing-prompts#授權與聲明)

必須遵守：

- 不要複製 Steam Machine 外觀、Steam 商標／文案、CRT 主機 Hero、黑底綠光配色、爆炸順序、完整頁面構圖或 demo 素材。
- 不要直接要求「動物森友會風／吉伊卡哇風」並複製角色、輪廓、UI、音效或專有美術；應使用居遊所自己的 style contract：溫暖、低多邊形、圓角比例、原創無人物生活道具。
- 建商照片與家具圖只在權利允許的服務中上傳；AI 輸出仍需來源、prompt、工具、日期、人工修訂與權利紀錄。
- Repo 範例把 Figma personal access token 直接放進指令；正式工作流 **不可這樣做**。Token 應置於環境變數／secret store，使用 read-only 最小 scope，不寫入 prompt、repo、log 或截圖，用後撤銷／輪替。
- GSAP、Lenis、Meshy、Google／Gemini／Flow、Higgsfield、Figma、字型與模型服務各有自己的使用條款與費率；repo 沒有替它們提供授權，導入前需逐項核對。
- AI 生成 GLB 只能當概念素材；正式家具需使用品牌授權的精準模型，並通過 glTF validation、尺寸、材質、效能與視覺基準測試。

## 採用決策

**Reference workflow — 採用方法，不 fork、不安裝。**

最小採用範圍是：把「先 Brief／PRD、再方向、再素材、最後分段實作驗收」寫進居遊所執行計畫；把首尾幀錨定、物理負面條件、scroll constants、連續幀 QA 與 reduced-motion fallback 納入 Landing 規格。現有 Next.js／R3F 架構、BH7 正式資料與居遊所 visual contract 維持唯一真相。

## 直接來源

- [Repo 與 README](https://github.com/TaonyDesign/ai-parallax-landing-prompts)
- [Step 1：Brief / PRD](https://github.com/TaonyDesign/ai-parallax-landing-prompts/blob/main/01-brief-and-prd.md)
- [Step 2：Design direction](https://github.com/TaonyDesign/ai-parallax-landing-prompts/blob/main/02-design-direction.md)
- [Step 3：AI assets](https://github.com/TaonyDesign/ai-parallax-landing-prompts/blob/main/03-ai-assets.md)
- [Step 4：Build and scroll](https://github.com/TaonyDesign/ai-parallax-landing-prompts/blob/main/04-build-and-scroll.md)
