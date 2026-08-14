# Stylebase 對「居遊所 Play Ground」的適用性評估

> 評估日期：2026-08-11。研究對象為 Winston774/Winston-10xAI-Toolspack 中 `2026-w31-stylebase-design-inspiration-library` 的完成版；判斷以該專案 README、PRODUCT、package、schema、database 與 license 為一手依據。

## 結論

**建議採用，但只作為內部設計治理工具，採「窄幅 fork」；不要把它直接併進消費者網站，也不要期待它改善 3D mesh 本身。**

對居遊所的適配度：

| 面向 | 幫助程度 | 判斷 |
| --- | ---: | --- |
| 視覺參考整理 | 9/10 | 能集中保存參考圖、來源、權利備註、標籤、收藏與版本 |
| 畫風一致性 | 8/10 | Visual DNA、色票、材質、avoid、Prompt Kit 很吻合目前問題 |
| AI 圖像提示工作流 | 8/10 | 可生成 image prompt、UI brief、design tokens、negative constraints |
| 網站 UI 實作 | 5/10 | 能產生 brief，不會直接產出或驗證正式 Next.js UI |
| 3D 家具資產 | 2/10 | 只分析圖片，不懂 GLB 拓撲、UV、pivot、碰撞器或 LOD |
| BH7 格局精準度 | 0/10 | 不處理 PDF，也不能驗證牆門窗尺寸 |
| 電商／預約／渲染平台 | 0/10 | 沒有 SKU、價格、庫存、訂單、帳號或雲端多租戶能力 |

它最能解決的不是「怎麼做 3D」，而是居遊所過去反覆發生的這些問題：

- 參考圖、生成圖、淘汰圖和提示詞散落在對話與資料夾。
- 「可愛」「日式」「低 AI 色感」沒有被轉成可查詢、可審核的視覺規格。
- 每輪生成只看單張感覺，缺少核准版本、禁止項與權利來源。
- 網站 UI、Key Art、即時 3D 和 Blender 渲染沒有共用一份 Visual Contract。

## 它實際是什麼

Stylebase 是 local-first 的視覺參考資料庫：將 JPG、PNG、WebP、GIF 匯入本機資料夾，以 SHA-256 去重並建立 SQLite／FTS5 索引；使用者主動送交 Codex 後，AI 產生可編輯的視覺分析與 Prompt Kit。服務只綁 `127.0.0.1`，圖片和資料庫預設留在本機。

官方 README：

- [Stylebase README](https://github.com/Winston774/Winston-10xAI-Toolspack/tree/main/weeks/2026/2026-w31-stylebase-design-inspiration-library/completed/stylebase-design-inspiration-library#readme)
- [PRODUCT.md](https://github.com/Winston774/Winston-10xAI-Toolspack/blob/main/weeks/2026/2026-w31-stylebase-design-inspiration-library/completed/stylebase-design-inspiration-library/PRODUCT.md)

### 技術特性

- Node.js ESM，小型本機 HTTP 服務。
- 使用 Node 內建 `node:sqlite`，沒有第三方 npm dependency。
- SQLite tables 包含 assets、analyses、jobs、collections 與 FTS5 搜尋。
- 分析結果保留 provider、model、version、raw JSON、current version 與工作狀態。
- Codex 工作預設單工、一次性 session、read-only sandbox、嚴格 JSON Schema。
- 提供 node:test、自動語法檢查、smoke test 與 release validation。

來源：

- [package.json](https://github.com/Winston774/Winston-10xAI-Toolspack/blob/main/weeks/2026/2026-w31-stylebase-design-inspiration-library/completed/stylebase-design-inspiration-library/package.json)
- [db.mjs](https://github.com/Winston774/Winston-10xAI-Toolspack/blob/main/weeks/2026/2026-w31-stylebase-design-inspiration-library/completed/stylebase-design-inspiration-library/src/db.mjs)
- [analysis-schema.mjs](https://github.com/Winston774/Winston-10xAI-Toolspack/blob/main/weeks/2026/2026-w31-stylebase-design-inspiration-library/completed/stylebase-design-inspiration-library/src/analysis-schema.mjs)

## 對居遊所特別有用的資料結構

它的 `stylebase-visual-v1` schema 已包含：

- `visualDNA`：設計譜系、構圖、網格、階層、密度、留白與節奏。
- `color`：色彩模式、溫度、飽和度、對比，以及最多八個含 HEX／角色／占比的色票。
- `typography`、`imagery`、`materials`、`components`、`interactionSignals`。
- `whyItWorks`、`implementationRecipe`、`avoid`、`tags`。
- 四種提示詞：`imageGeneration`、`uiImplementation`、`designTokens`、`negative`。
- `confidence` 及人工修正流程。

這與居遊所目前需要的「中性白平衡、低彩度窄色域、35–40 度相機、低牆模型屋、霧面材質、禁止電影光影／塑膠高光」高度吻合。

## 建議怎麼用

### 1. 作為獨立內部工具

不要把 Stylebase server、SQLite 或 Codex CLI 呼叫加入公開 Next.js 網站。建議放在獨立工具目錄或獨立 repo，例如：

```text
homeplay-stylebase/
  library/
  data/
  exports/

10_居遊所_PlayGround/
  docs/design-system/
  public/key-art/
  public/assets/
```

Stylebase 負責研究與核准；居遊所 repo 只接收已核准的 JSON／Markdown／圖片輸出。

### 2. 建立居遊所 Collections

- `Golden Room — Approved`
- `Golden Room — Rejected AI Color`
- `BH7 Spatial Composition`
- `2.5D Camera and Cutaway`
- `Furniture Silhouette and Proportion`
- `Matte Materials and Lighting`
- `Editor UI and Selection Feedback`
- `Original Resident — IP Safe`

拒絕案例與核准案例都要保存。拒絕圖的價值是把「為什麼不通過」變成可重複使用的 negative constraints。

### 3. 延伸 schema，而不是推翻原 schema

建議新增 `homeplay` 區塊：

```json
{
  "approvalState": "candidate | approved | rejected | superseded",
  "referencePurpose": "key-art | ui | room | furniture | material | animation",
  "targetMode": "decorate | explore | render",
  "ipRisk": "low | review | blocked",
  "cameraContract": {
    "projection": "near-orthographic",
    "elevationDegrees": 38,
    "wallTreatment": "cutaway-low-wall"
  },
  "styleContractVersion": "homeplay-v1",
  "reviewNotes": [],
  "supersedes": null
}
```

另外增加：

- `sourceRightsStatus`：unknown／reference-only／licensed／owned。
- `productTruthRequired`：是否禁止 AI 改動商品外觀。
- `geometryNotes`：只作人工描述，不當作 GLB 驗證結果。
- `approvedBy`、`approvedAt`、`reviewRound`。

### 4. 匯出正式 Visual Contract

Stylebase 分析不是最終規格。需由人核准後輸出：

- `homeplay-visual-contract.json`
- `homeplay-imagegen-prompt.md`
- `homeplay-negative-constraints.md`
- `homeplay-ui-tokens.json`
- `homeplay-blender-lookdev.md`

網站、ImageGen 與 Blender 都引用同一版號，才能避免畫風漂移。

## 它不能解決的事情

1. **不會建立可用 GLB**：圖片分析不能代替 Blender 建模、retopology、UV、材質槽、pivot、collision proxy、LOD 或 glTF export。
2. **不會驗證 BH7**：第一版不處理 PDF；即使把 PDF 轉成圖片，也只能描述像素，不能成為公尺制建築真值。
3. **不會自動判斷 IP 安全**：repo 明確要求 AI 不猜作者、品牌、來源與授權。權利狀態仍需人處理。
4. **不會保證生成一致**：Prompt Kit 是起點；仍需固定參考圖、模型版本、seed／設定與人工驗收。
5. **不是團隊 DAM**：第一版單機單人、沒有帳號、權限、雲端同步或多人審核。
6. **不是公開產品後台**：沒有租戶、SKU、價格、庫存、訂單或使用者資料隔離。

## 成熟度與風險

### 優點

- 程式與文件採 MIT License，可使用、修改與散布，但須保留版權與授權聲明。
- 無第三方 npm dependency，供應鏈面積小。
- 明確 local-first、manual opt-in、read-only agent 與 schema validation。
- 原圖與 AI 結論分開，允許人修正，方向健康。
- 有測試、smoke 與 release validation，不只是 UI mockup。

### 風險

- 這是 2026-W31 的 v1.0 課程／學員開源版，仍是很新的單人本機工具，不等於成熟企業 DAM。
- 官方驗證環境是 Windows 10／11、Node.js 24+；目前居遊所開發機是 macOS，Node v22.22.3，不能直接符合 engines 條件。
- 使用 `node:sqlite`，官方 README 也註記可能出現 ExperimentalWarning。
- 第一版沒有影片、PDF、雲端同步、備份排程、多人審批與 API export。
- 匯入的圖片不受 MIT 覆蓋；參考圖的著作權、上傳 AI 的權利與公開使用仍需逐筆確認。

授權來源：[MIT LICENSE](https://github.com/Winston774/Winston-10xAI-Toolspack/blob/main/weeks/2026/2026-w31-stylebase-design-inspiration-library/completed/stylebase-design-inspiration-library/LICENSE)

## Adopt／Fork／Reference 判斷

### 最終建議：Narrow Fork

不建議只看概念後自己重寫，因為 SHA-256 去重、SQLite/FTS、分析版本、queue、schema 與 release validation 已有實際價值；也不建議原封不動併入網站，因為平台、Node 版本與單機假設不同。

建議步驟：

1. Fork 並保留 MIT notice。
2. 升級本機或專用容器至 Node 24，在 macOS 跑完整 `npm run validate`。
3. 不動原本 library／analysis 深層模組，先新增 HomePlay schema extension 與 exporter。
4. 匯入 20–30 張現有核准／淘汰圖片進行小規模驗證。
5. 人工校正 AI 結果，確認真的能區分「中性柔光」與「橘黃 AI 色感」。
6. 只有通過試驗後，才把它納入正式美術審核 SOP。

### 工作量推估

- Mac／Node 24 驗證與基本啟動：0.5–1 天。
- HomePlay schema、Collections 與 exporter：2–4 天。
- 匯入既有素材、權利整理與第一輪人工校正：2–5 天。
- 合計約 1–2 週即可判斷是否值得長期保留。

## 最小試驗成功條件

用同一批資料測試：

- 3 張通過的 Golden Room。
- 5 張因顏色過重、牆太高、塑膠感或幾何方塊被拒絕的圖。
- 5 張 UI／遊戲配置參考。
- 5 張家具輪廓與生活用品參考。

驗收：

- 能在 30 秒內找到指定視覺特徵的參考。
- 分析能正確區分色彩、構圖、材質與互動，不把 IP 名稱當設計規格。
- 產出的 negative prompt 能覆蓋已知失敗。
- 人工核准後能穩定輸出同版號 Visual Contract。
- 原圖來源與 rights note 不遺失。

若這五項成立，Stylebase 對居遊所的價值會大於它的維護成本。
