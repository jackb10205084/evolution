# BH7 A6／A11 圖面套疊稽核

資料來源：`遠雄BH7樣品屋大樣圖 0718.pdf`，AutoCAD 2024 輸出，20 頁，A3。

## 稽核結論

目前 Web 3D 可作為家具配置與互動流程 Beta，但不能視為建築施工模型。PDF 本身亦註明圖紙「非完全正確比例尺、內存些微誤差」，因此正式發布前仍須以 CAD／Blender 重建模型覆核。

A6 已升級為 `A6_SHELL_V3`：I1A6-01 左圖 poche 與門窗向量重抽，門洞改切在牆段缺口（不再把衛浴門畫進實牆），窗用標註 70 cm、位置用向量。稽核疊圖切 I1A6-02 左圖，裁切範圍對齊同一物理外框。可在 3D 編輯器使用「眼睛」按鈕切換：

- 藍色圖線：PDF 家具平面圖（I1A6-02）。
- 彩色牆體與家具：目前 Web 3D runtime。
- 寬度：依圖面標註 682.5 cm 校正。
- 深度：目前按 PDF 圖面比例暫置（約 9.115 m）。圖面左右垂直尺寸鏈加總各為 915 cm，但圖上沒有單一總深標註，兩者皆待 CAD 覆核。
- 北側 130 cm 帶：左 227.5 外段為客廳陽台（220 cm 推拉門）。右陽台是 partition-multi-ac 以東的整條東側直帶（PDF 444.12–534.24 × 137.04–325.08，南緣為 partition-multi-master-right），繞多功能室呈 L：北 G15。Julian：右陽台右邊沒有開窗；圖面印有 B9 70×100，與 G11 同類，不是開口。多功能室仍在該隔間以西並接到外北牆（x≈323–436，y=137–325）。outer-ac-block 坐在陽台上。I1A6-01/02 的 partition-multi-ac 仍為連續 poche，無門。主臥東北 partition-multi-master-right 圖面為 2.5+140+2.5 組件（西固定玻璃＋東平開門）；本輪只開東門（sourceSpan 487.44–522.60，葉約 61.8 cm），西玻璃暫留實牆。140 標註是整組不是門扇。南牆入口右側至東角為實牆；圖面印有 G11 70×100，依 Julian「下方不是窗是牆」不開窗。

## A6 已追蹤的標註（I1A6-01 右圖，cm）

| 鏈 | 標註 | 加總 | 狀態 |
| --- | --- | --- | --- |
| 頂部水平 | 67.5 + 227.5 + 18.9 + 190 + 18.6 + 87.5 + 72.5 | **682.5** | 確認全寬 |
| 底部水平 | 45 + 110 + 462.5 + 67.5 | 685 | 與頂寬差 2.5 cm；可能是量測面不同，不以 685 覆寫全寬 |
| 左側垂直 | 130 + 15 + 607.5 + 18 + 129.5 + 15 | 915 | 分段加總，**不是**單一總深。607.5 只是客餐廳段 |
| 右側垂直 | 130 + 187.5 + 15 + 270 + 10 + 115 + 10 + 17.5 + 160 | 915 | 分段加總，與左側一致，仍非單一總深標註 |
| 多功能室 | 寬 190、深 187.5 | — | 室內淨尺寸 |
| 主臥 | 深 270；上寬 216／下寬 250 | — | 有牆面錯位 |
| 主衛 | 深 115、寬 240 | — | |
| 玄關 | 門 110、段 129.5、隔間牆 18 | — | |
| 天花 | CH220 / CH225 / CH235 / CH263 / CH285 / CH290 | — | 見 I1A6-06；runtime 碰撞高 2.85 m 僅互動簡化 |

## A6_SHELL_V3 牆／門精度（I1A6-01 左圖向量 + 右圖標註）

比例：6.825 m ÷ 388.44 pt（外框 146.40–534.84）。Y 用同一比例。向量與標註衝突時，**長度用標註、位置用向量**。

### 外牆

| id | 來源頁 | PDF sourceRect | 公尺（約） | 標註 cm | 備註 |
| --- | --- | --- | --- | --- | --- |
| outer-balcony-column | p.2 | [146.40, 137.04, 184.68, 210.84] | 0.673 × 1.296 | 67.5 寬 | 向量 67.3 cm，差 0.2 cm |
| outer-balcony-sill | p.2 | [146.40, 210.84, 188.95, 219.36] | 左檻至推拉門 | 7.5 檻 | 柱東緣 184.68 + 7.5 cm |
| outer-multi-left | p.2 | [315.12, 137.04, 323.64, 219.36] | 0.150 × 1.447 | 15 / 18.9 | 18.9 為頂鏈含飾面，向量約 15.0 |
| outer-multi-top-* | p.2 | y 137.64–145.08，於 325.80 / 431.28 / 448.98 / 488.82 切開 | — | 見窗 | 北牆在 70 cm 窗、115 cm 玻璃、G15 處留缺口 |
| outer-right | p.2 | [526.92, 137.64, 534.24, 655.32] | — | 東牆實牆 | I1A6-01 RE 連續 poche。Julian：右陽台右邊沒有開窗。printed B9 70×100 不是開口（與 G11 同類） |
| outer-ac-block | p.2 | [493.68, 145.08, 526.32, 210.84] | 空調外箱 | 72.5 頂鏈段；坐在右陽台上的室外機，不是獨立「空調」房間 |
| outer-left-* | p.2 | x 146.40–154.92 | 約 15 | 15 | 上／轉角／下三段 |
| outer-bottom-left-jamb | p.2 | [146.40, 647.88, 171.96, 655.80] | 左檻 | 45 外段 | 門檻向量 171.96 |
| outer-bottom-from-entry | p.2 | [234.36, 647.88, 534.24, 655.80] | — | 門 110 以西為缺口 | 入口右側至東角實牆。圖面 G11 70×100 依 Julian 標記不開窗 |
| outer-pipe-block | p.2 | [502.20, 570.84, 526.32, 647.40] | 管道間右實牆 | — | |

### 隔間

| id | 來源頁 | PDF sourceRect | 標註 cm | 備註 |
| --- | --- | --- | --- | --- |
| partition-multi-ac | p.2 | [435.60, 145.08, 444.12, 325.08] | 18.6 | 頂鏈 18.6；向量約 15.0。北端接到外北牆內緣，把多功能室與右陽台分開。poche 連續，圖上無門 |
| partition-spine-stub / upper / lower | p.2 | x 318.00–323.64；缺口 222.36–276.00、469.08–516.72 | 84（主臥門） | 多功能室門無寬標 |
| partition-multi-master-left | p.2 | [323.64, 319.92, 436.2, 325.56] | 15 | 主臥上牆西段，錯位 |
| partition-multi-master-right-west / east-jamb | p.2 | [443.52, 317.64, 487.44, 325.08]／[522.60, 317.64, 526.92, 325.08] | 2.5+140+2.5 組件 | 已切開東門 487.44–522.60。西段暫留實牆（固定玻璃未開）。140 是整組不是門扇 |
| partition-master-bath | p.2 | [385.08, 478.68, 526.92, 484.32] | 10 | |
| partition-ensuite-head / jamb | p.2 | x 384.60–390.24；缺口 484.32–529.68 | 80 | V2 把實牆畫過門洞 |
| partition-bath-top-* | p.2 | y 563.76–569.40 | 10 | 在客衛／衛浴核心牆處切開 |
| partition-guest-bath-head | p.2 | [346.32, 568.80, 351.96, 602.04] | 80 門在其下 | V2 整段連到 647，門畫在實牆上 |
| partition-bath-core / pipe-* / jog | p.2 | 見 a6-shell.ts | 10 / 17.5 | 管道間 |
| partition-entry-dining | p.2 | [154.92, 563.76, 262.68, 573.96] | 18 厚；20+100 實牆 | 167.5 為牆端到脊牆淨空 |
| partition-entry-cabinet | p.2 | [154.92, 573.96, 166.32, 647.40] | 20 | 玄關櫃 |

### 門窗

| id | 來源頁 | PDF sourceSpan | 公尺 | 標註 cm | 衝突 |
| --- | --- | --- | --- | --- | --- |
| living-balcony-door | p.2 | [188.95, 215.10, 314.16, 215.10] | 2.200 | 220 內／227.5 外 | 向量推拉扇 194.88–310.56 = 203.3 cm；長度用 220 |
| multi-north-window | p.2 | [325.80, 141.30, 365.52, 141.30] | 0.698 | 無 G 編號 | 向量 69.8 cm，外推窗扇。多功能室北窗（室內接到外牆） |
| multi-north-glass | p.2 | [365.52, 141.30, 431.28, 141.30] | 1.155 | 無 | 雙線玻璃，**不是**整面滑門 |
| g15-window | p.2 | [448.98, 141.30, 488.82, 141.30] | 0.700 | G15 70×100 | 虛線開口 444.12–493.68 = 87.1 cm；長度用 70，位置取虛線中心 |
| b9-window | — | 已刪 | — | 圖面 B9 70×100 | Julian：右陽台右邊沒有開窗。東牆改實牆，不另開窗（與 G11 同類） |
| g11-window | — | 已刪 | — | 圖面 G11 70×100 | Julian：下方不是窗是牆。南牆改實牆，不另開窗 |
| multi-entry-door | p.2 | [320.82, 222.36, 320.82, 276.00] | 0.942 | 無門寬標 | 脊牆缺口 |
| master-entry-door | p.2 | [320.82, 469.08, 320.82, 516.72] | 0.837 | 84 | 向量 83.7，差 0.3 cm |
| master-balcony-door | p.2 | [487.44, 321.36, 522.60, 321.36] | 0.618 | 140 整組 | 主臥東北橫牆東門，由下往上進右陽台。葉約 61.8 cm；140 是西玻璃＋東門整組不是門扇。sill 0、高 2.1、厚 0.13。鉸東、北開進陽台。西玻璃本輪未開 |
| ensuite-door | p.2 | [387.42, 484.32, 387.42, 529.68] | 0.797 | 80 | 向量 79.7，差 0.3 cm |
| guest-bath-door | p.2 | [349.14, 602.04, 349.14, 647.40] | 0.797 | 80 | 向量 79.7，差 0.3 cm |
| entry-door | p.2 | [171.96, 651.60, 234.36, 651.60] | 1.096 | 110 | 向量 109.6，差 0.4 cm |

### V2 相對圖面的偏移（已在 V3 修正）

| 項目 | V2 | 圖面／V3 | 偏移 |
| --- | --- | --- | --- |
| 主衛門 | y 500.00–545.50（估） | 484.32–529.68（厚線門檻） | 南偏約 27.6 cm，且畫進實牆 |
| 客衛門 | y 590.00–635.50（估） | 602.04–647.40（厚線門檻） | 北偏約 21.2 cm，且畫進實牆 |
| 客廳陽台推拉門 | x 154.9–315.1 | 188.95–314.16（柱 + 7.5 + 220） | 左緣侵入陽台柱約 59.8 cm |
| 多功能室北窗 | x 359.6–399.4（估 70） | 325.80–365.52 與 365.52–431.28 | 東偏約 59 cm；漏了 115 cm 玻璃 |
| G15 | 未獨立（被北窗取代） | 空調頂牆中心 70 cm | V2 沒有空調頂窗 |
| B9 | y 157.6–197.4（空調箱內） | 已刪（printed label，不是開口） | V2 當窗；V3 依 Julian 關窗 |
| G11 | x 450.1–489.9 | x 443.14–482.98 | 東偏約 12.2 cm |
| 玄關門檻 | 171.7 / 234.3 | 171.96 / 234.36 | 約 0.5 cm |

## A6

| 項目 | 來源 | 稽核結果 |
| --- | --- | --- |
| 建照／隔間 | p.2 `I1A6-01` | 全寬 682.5 cm 可確認。舊 3D 用 607.5 cm 當整戶深度不成立。V1 還漏了玄關隔間、陽台柱、多功能室右側隔間，並把 G15 70×100 畫成整面滑門。V2 門窗座標有估點。 |
| 家具平面 | p.3 `I1A6-02` | 客餐廳、多功能室、主臥、雙衛浴、玄關與固定櫃位置可辨識。沙發圖註 100×230，runtime 仍用目錄 1560×840，不縮家具。廚房為 C 字（東開）：北 167.5 吧台（−2.43, 0.64）、西爐台 0.65×1.21（−2.94, 1.69，爐在北半 1.54）、南迴 1.19×0.65（−2.66, 2.62）上水槽（−2.42, 2.59）與 REF（−1.72, 2.57，玄關隔間北、隔間東端）。無中島／洗衣機／第二台冰箱／凳（圖有凳無 SKU）。 |
| 天花高度 | p.7 `I1A6-06` | 可見 CH220、CH225、CH235、CH263、CH285、CH290 等多個高度；現行統一 2.85 m 僅為互動碰撞用簡化，不是施工真高。 |
| 3D 狀態 | `A6_SHELL_V3` | 外框含左陽台＋東側直帶右陽台。左陽台 220 cm 推拉門保留。右陽台＝444.12–534.24 × 137.04–325.08（南緣 partition-multi-master-right，已切開東門）；多功能室接到外北牆，已刪內北牆假門窗。outer-ac-block 在陽台上。主臥東北橫牆東門（487.44–522.60）由下往上進右陽台；西固定玻璃暫留實牆。partition-multi-ac 仍連續無門。東牆無 B9 窗、南牆無 G11 窗（Julian vs 圖面印刷）。廚房為 I1A6-02 C 字（北吧台／西爐／南水槽冰箱）。雙衛浴設備依 I1A6-02 符號放入（主衛馬桶靠 partition-bath-top；客衛馬桶對 overlay 橢圓，不在管道間）。雙衛浴東側 bay 皆為淋浴間：主衛是 240 的東 80×115；客衛是馬桶以東、管道間西側既有 poche（partition-bath-core～pipe-left，pipe-bottom 以南），不是新牆，也不是 G11／b3 開口標註。寬度 6.825 m 為確認尺寸。等比暫定深度約 9.115 m，標註鏈加總 9.15 m，兩者都待 CAD 覆核。 |

## A11

| 項目 | 來源 | 稽核結果 |
| --- | --- | --- |
| 建照／隔間 | p.13 `I1A11-00` | 正面寬度鏈 599.9 + 265.1 = 865.0 cm 可確認；戶型為多段退縮輪廓，不是單一矩形。 |
| 家具平面 | p.14 `I1A11-01` | 客餐廳、廚房、次臥、多功能室、主臥、雙衛浴與玄關位置可辨識。 |
| 天花高度 | p.18 `I1A11-05` | 可見 CH220、CH228、CH235、CH240、CH255、CH285 等多個高度；需要分區建模。 |
| 3D 狀態 | runtime | 已改為多段退縮底板，納入玄關凸出、次臥、衛浴凸出、主臥及三段前窗。正面 8.65 m 為確認尺寸；衛浴凸出後最大外框約 8.955 m，等比暫定深度約 9.548 m。 |


## A6 furniture placement (銷講簡報 p4–p20 完成方案)

World xz uses the same 6.825 m / 388.44 pt scale as `A6_SHELL_V3`. Layout follows 遠雄BH7樣品屋提案_251029銷講簡報 pages 4–20, not the 12-page business pptx and not the I1A6-02 dining-table pile. Catalog millimetres are not scaled to the sample-house notes.

| id | room | world xz (m) | source | catalog mm | note |
| --- | --- | --- | --- | --- | --- |
| sofa-cloud | 客廳 | −2.42, −1.88 | p4 / p7–p9 / p17 / p20 | 1560×840×720 | Balcony-window end of 客廳, yaw −90° so it faces the spine/TV wall. Not piled on the mid left wall. Not shrunk to 100×230. |
| table-pla-tb-02 | 客廳 | −1.52, −1.88 | p4 50×75 / p7 nesting coffee | 380×380×460 | Default coffee in front of sofa. PLA-TB-01 700 is too big for this zone. |
| chair-breeze | 客廳 | −1.50, −0.95 | p7–p9 lounge / bar-stool stand-in | 770×670×760 | Doughnut lounge beside sofa. No bar-stool SKU. |
| rug-meadow | 客廳 | −1.92, −1.70 | living group | 2500×1650×40 | Under sofa + 380 coffee. |
| lamp-moon | 客廳 | −2.96, −2.90 | p20 window light | 450×450×1550 | Living balcony-window corner. |
| plant-olive | 客廳 | −2.20, −2.78 | p20 window light | 720×720×1650 | Living window corner, inside the slider. |
| bed-soft | 主臥 | 1.72, 0.30 | p13–p14 headboard wall | 1820×2080×880 | Centered on the interior headboard wall toward bath (+Z). West door kept clear. |
| FixedKitchen / REF | 餐廳 C 字 | west (−2.94, 1.69)／south (−2.66, 2.62)／sink (−2.42, 2.59)／REF (−1.72, 2.57) | I1A6-02 C：西爐 0.65×1.21、南迴 1.19×0.65、REF ~0.70×0.75 | built-in | Cooktop on west NORTH half (1.54). Sink on south return. REF east of sink, north of 玄關隔間, east=262.68. No island / washer / second fridge / stools. |
| dining-1675 | 餐廳 | (−2.43, 0.64) | I1A6-02 167.5 × 89.4／p.2 [155.04, 407.64, 249.36, 458.28] | built-in | North bar of the kitchen C. Already correct — kept. Not catalog DME52. |
| FixedBaths 主衛 vanity | 主衛 | (1.172, 2.640) | I1A6-02 60 mark, flush to partition-bath-top | built-in | Was (1.172, 2.391) against the east pipe-shelf line y=549.6. Same 60 bay; snapped to 主衛南隔間 y=563.76. |
| FixedBaths 主衛 shower | 主衛 | (2.873, 2.118) | I1A6-02 80 east bay of 240 / 115 deep; PDF ~[481.30, 484.32, 526.92, 549.6] | built-in | Enclosed 淋浴間: 80×115 tray + low pastel glass on the west opening. Toilet/sink stay on the west 150 bay. |
| FixedBaths 主衛 toilet | 主衛 | (1.922, 2.680) | I1A6-02 90 of the 150 bay, tank on partition-bath-top | built-in | Was (1.922, 2.341) / PDF ≈(450, 530), floating mid-room against y=549.6. Now collider-flush to 主衛／客衛隔間 north face y=563.76 (z=2.940). Same X. Not the west ensuite wall, not a new bath. |
| FixedBaths 客衛 sink | 客衛 | (0.507, 3.313) | I1A6-02 west / north wall | built-in | 60 cm off west wall. Unchanged bay. |
| FixedBaths 客衛 toilet | 客衛 | (1.263, 3.410) | I1A6-01/02 oval p2 (412.5, 590.5) | built-in | Snapped to the drawing oval, north wall of 客衛, west of 管道間. Old (1.403, 3.739) was too south. Chase empty. |
| FixedBaths 客衛 shower | 客衛 | (2.261, 3.923) | I1A6-01 poche [442.08, 591.48, 496.56, 647.88] (bath-core / pipe-left / pipe-bottom / south wall) | built-in | Enclosed 淋浴間 in the east bay Julian circled (east of toilet, beside 管道間). Bay 95.7×99.1 cm from existing poche; not G11 70×100, not b3 40×65. No new wall. |
| table-dme52-1000 | — | parked (−1.70, 1.90) | removed from default | φ1000×750 | Not in the A6 完成方案. Deck uses a breakfast bar, not a meeting table. |
| table-pebble | — | parked (−1.52, −1.05) | removed from default | 700×700×380 | Too big for the 50×75 coffee. Not a second coffee. |
| shelf-cabin | — | add-spot (1.40, −2.80) | omitted | 1500×420×1650 | Too tall to stand in for the floating TV console; would read as a divider. |
| 多功能室 desk / daybed | 多功能室 | — | p10–p12 built-in | — | No matching SKU. Left empty. |
| 主臥 wardrobe | 主臥 | — | p13–p14 built-in | — | No matching SKU. Not invented. |

Sales-deck rasters live at `/workspace/lookdev-p1/sales-deck/p-04.png` … `p-20.png`. Preview: `docs/design-system/a6-preview-45.png`.

## 正式模型驗收條件

1. 取得 CAD 原檔或由建商確認的可量測 PDF。
2. 以尺寸鏈重建外輪廓、結構牆、隔間、門洞與窗洞，不以圖片像素當正式尺寸。
3. 依天花圖建立分區高度；角色碰撞牆與可視剖面牆分離。
4. 以 PDF 疊合模式逐區檢查，容許值由建商／室內設計單位確認。
5. 完成 A6、A11 各一次家具擺放、動線、門扇與報表快照驗收後才能將狀態改為 `construction-aligned`。
