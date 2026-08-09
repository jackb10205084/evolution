# 居遊所 Play Ground V2 Visual Contract

狀態：正式執行規格  
版本：`v2-original-cozy`  
唯一美術母版：`public/key-art/v2/09-a6-original-ultra-kawaii-mascot.png`

## 1. 參考來源優先順序

1. 建築格局與尺寸：建商核驗的 A6 正式平面圖、隔間圖與立面圖。
2. 角色、家具圓糯度、色盤、輪廓與光影：正式母版 `09`。
3. 介面配置與操作層級：核准的編輯器 wireframe 與本文件。
4. 商品造型、尺寸及顏色：SKU 商品圖與尺寸資料。

發生衝突時不得混合平均：建築看正式圖、造型看母版、UI 看 wireframe、商品辨識看 SKU。

## 2. 色彩與材質

| Token | 色值 | 用途 |
|---|---|---|
| `surface-milk` | `#fffdf8` | 卡片、面板、主要牆面 |
| `surface-vanilla` | `#fff6df` | 選取、提醒、暖色小面積 |
| `surface-cream` | `#f8ede0` | 地板、次要底色 |
| `accent-peach` | `#efac97` | 角色腮紅、柔和提示 |
| `accent-coral` | `#df8f78` | 主要 CTA、選取狀態 |
| `accent-mint` | `#a9c7a2` | 可用、預算內、家具軟墊 |
| `accent-blue` | `#b8cae1` | 建築外框、模式切換、空間層級 |
| `line-blue` | `#9eafca` | 3D 建築輪廓與 UI 細框 |
| `ink-cocoa` | `#655854` | 主要文字及低對比輪廓 |
| `ink-quiet` | `#817872` | 次要文字 |

- 大表面為霧面純色；同一物件最多使用三階相近明度。
- 木色只作桌腳、門與小面積辨識，不得成為整體背景。
- 禁止玻璃擬態、霓虹漸層、照片木紋、鏡面反射及塑膠高光。

## 3. 光影與 3D

- 固定 35–45 度正交模型屋鏡頭；預設相機由 `app/lib/visual-contract.ts` 管理。
- 採高明度中性漫射光，只允許極弱的無投影方向光協助辨識形體。
- 禁止 ACES／電影式 tone mapping、Bloom、Vignette、重 AO、深色投影、金色光束與 `ContactShadows`。
- 角色、家具與空間共用低對比暖灰棕輪廓；輪廓不可接近黑色。
- Hero Room 在 3D 畫布內的可見占比至少 75%；面板採覆蓋或可收合方式，不改變 3D 畫布尺寸。
- 正式建築殼體必須由 A6 圖面重建。本輪程式化殼體僅為互動替身，不得標記為正式圖說。

## 4. UI 元件

- `GameButton`：高度 40／48 px；圓角 14–18 px；主要按鈕為珊瑚色，避免深綠大色塊。
- `GamePanel`：牛奶白實底、1 px 粉霧藍框、22–28 px 圓角、極淡短陰影；禁止大面積模糊玻璃。
- `FurnitureCard`：商品圖、品牌、品名、價格與加入按鈕有固定順序；selected 使用香草底與珊瑚框。
- `ModeSwitch`：探索／佈置採膠囊切換；active 使用粉霧藍或薄荷，不用高對比黑底。
- `PriceBadge`／`BudgetMeter`：價格數字使用 cocoa；預算內使用 mint；超額使用 coral。
- 主要 CTA「預約賞屋」在桌面與 iPad 橫向不捲動即可看見。

## 5. 動效

- Hover／press：160–220 ms，位移不超過 2 px。
- 家具選取浮動不超過 4.5 cm；角色呼吸循環 2.8–3.4 秒。
- 禁止大型持續漂浮、強烈彈跳、鏡頭自行旋轉與造成暈動的視差。
- `prefers-reduced-motion` 時移除非必要動畫。

## 6. 驗收與退件

每次正式 UI／3D 變更必須提供相同資料、相同相機的 1440×900 與 iPad 橫向截圖。下列任一情況直接退件：

- 重新出現 ACES 電影色調、重投影、Contact Shadows、暗角或金色偏光。
- 正式畫面混入其他 Key Art 版本、現有動漫／遊戲 IP 或舊版水豚角色話術。
- UI 修改破壞家具拖曳、旋轉、價格、自動儲存、分享或預約功能。
- 未附畫面證據，或只以 build／lint 通過宣稱視覺完成。
- 未核驗 A6 正式圖面就聲稱空間為精準戶型。
