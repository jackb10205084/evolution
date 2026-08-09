# 居遊所 Play Ground

建案聯名 × 遊戲化居家配置 × 家具電商的可操作 Internal Alpha。第一號提案以「遠雄樂元」官方公開資料為背景，串起登入前導、角色選擇、坪數分帶／主題、雙模式 3D 編輯器、預約賞屋、現場報到、渲染點數、購物車、分享、作品庫，以及建商／平台後台。

這是未受建商委託的概念提案，不代表遠雄建設與居遊所已有合作關係。公開資料目前僅揭露約 21–39 坪、兩至三房；站內 21／27／31／39 坪配置為體驗分帶，不是正式戶別或銷售圖說。正式發布前必須由建商提供並核驗所有建築圖面。

## 啟動

```bash
npm ci
npm run dev
```

驗證正式產物：

```bash
npm test
```

## Alpha 可操作範圍

- 聯名建案首頁、三種社群登入入口與輕量角色自訂。
- 4 個坪數提案分帶、4 個生活主題與空屋模式。
- React Three Fiber 3D 模型屋；角色探索／俯視佈置模式。
- 家具增刪、拖曳、45° 旋轉、材質切換、復原／重做、物理邊界與重疊禁止、動線提醒。
- 自有／聯盟家具區分、預算持續計算、平台購物車與聯盟導購提示。
- D1 自動儲存與重載、預約同意、一次性報到 QR、一次性 3 點贈送、原子扣點、失敗退點及私人作品庫流程。
- 可撤銷且限時的唯讀分享連結；分享頁不允許修改原稿。
- 建商匿名統計／同意後名單，以及平台資產、用量與收入引擎總覽。
- D1 schema、版本化 `SceneSnapshotV1` 儲存與 `/api/v1/experience/manifest` 公開介面。

## 模組與 Adapter 邊界

畫面已用可替換 Adapter 呈現 Google／Apple／LINE、綠界、CRM Webhook、聯盟歸因與寫實渲染工作。此倉庫不內含正式業者憑證，也不會把測試互動包裝成真實外部交易。

- `SceneModule`：`app/components/experience-canvas.tsx`、`app/lib/domain.ts`
- `EditorEngine Module`：`app/lib/editor-engine.ts`，集中處理旋轉後碰撞、門口淨空、地毯疊放、復原／重做與動線警告
- `CatalogModule`：`app/lib/catalog.ts` 與 manifest API
- `ProjectPublishingModule`：建案、戶型、主題與 D1 schema
- `BookingModule`：`/api/bookings`、同意紀錄、Webhook outbox、冪等報到與 append-only ledger
- `RenderModule`：原子扣點、append-only `render_ledger`、`render_jobs` 與受密鑰保護的 Worker callback seam
- `SharingModule`：限時 token、雜湊保存、唯讀頁與撤銷
- `AffiliateModule`、`CommerceModule`：資料模型與 Alpha 介面已就位，正式連線由 Adapter 加入

`tests/durable-workflows.test.mjs` 以 Miniflare 與真實 D1 migration 驗證配置重載、預約重送、重複報到、點數耗盡、失敗退點、分享重送與撤銷。

`public/assets/commercial-pilot/manifest.json` 是 A6 商業垂直切片的發布來源。`npm run pilot:audit` 顯示真實門檻進度；`npm run pilot:release` 在戶型、商品、付款或渲染仍是替身資料時會阻擋發布。

## 正式串接前置條件

1. Cognito user pool，以及 Google、Apple Developer Organization／Services ID／私鑰、LINE Login channel。
2. 綠界商店代號、HashKey／HashIV、ReturnURL 與電子發票測試／正式環境。
3. 建商 CRM webhook endpoint 與 HMAC secret。
4. 遠雄樂元所有正式建築圖、戶型代碼、GLB、材質、碰撞器及導覽網格；資產驗證通過後才能發布。
5. 東京區 Batch／Blender GPU 與 Nova Canvas 的去識別化渲染工作流。

商業價格、點數包、回饋率、用量額度與有效期皆應由營運後台管理，不應寫死在產品程式。
