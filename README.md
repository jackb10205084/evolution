# 居遊所 Play Ground

建案聯名 × 遊戲化居家配置 × 家具電商的可操作 Internal Alpha。這個版本以「河岸青」示範建案串起登入前導、角色選擇、戶型／主題、雙模式 3D 編輯器、預約賞屋、現場報到、渲染點數、購物車、分享、作品庫，以及建商／平台後台。

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
- 3 個戶型、4 個生活主題與空屋模式。
- React Three Fiber 3D 模型屋；角色探索／俯視佈置模式。
- 家具增刪、拖曳、45° 旋轉、材質切換、復原／重做、物理邊界與重疊禁止、動線提醒。
- 自有／聯盟家具區分、預算持續計算、平台購物車與聯盟導購提示。
- 預約同意、報到 QR 模擬、一次性 3 點贈送、渲染提交與私人作品庫流程。
- 建商匿名統計／同意後名單，以及平台資產、用量與收入引擎總覽。
- D1 schema、版本化 `SceneSnapshotV1` 儲存與 `/api/v1/experience/manifest` 公開介面。

## 模組與 Adapter 邊界

畫面已用可替換 Adapter 呈現 Google／Apple／LINE、綠界、CRM Webhook、聯盟歸因與寫實渲染工作。此倉庫不內含正式業者憑證，也不會把測試互動包裝成真實外部交易。

- `SceneModule`：`app/components/experience-canvas.tsx`、`app/lib/domain.ts`
- `CatalogModule`：`app/lib/catalog.ts` 與 manifest API
- `ProjectPublishingModule`：建案、戶型、主題與 D1 schema
- `BookingModule`：`/api/bookings`、同意紀錄、Webhook outbox、報到 ledger schema
- `RenderModule`：append-only `render_ledger` 與 `render_jobs`
- `SharingModule`、`AffiliateModule`、`CommerceModule`：資料模型與 Alpha 介面已就位，正式連線由 Adapter 加入

## 正式串接前置條件

1. Cognito user pool，以及 Google、Apple Developer Organization／Services ID／私鑰、LINE Login channel。
2. 綠界商店代號、HashKey／HashIV、ReturnURL 與電子發票測試／正式環境。
3. 建商 CRM webhook endpoint 與 HMAC secret。
4. 正式建築圖、GLB、材質、碰撞器及導覽網格；資產驗證通過後才能發布。
5. 東京區 Batch／Blender GPU 與 Nova Canvas 的去識別化渲染工作流。

商業價格、點數包、回饋率、用量額度與有效期皆應由營運後台管理，不應寫死在產品程式。
