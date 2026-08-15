"""45° elevated finished-room preview of BH7 A6.

IKEA Kreativ VIEW language only: high-corner look-down, grouped living set,
clear circulation, catalog-true scale. Not IKEA products. Not photo materials.
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
import os

W, H = 1800, 1400
img = Image.new("RGB", (W, H), (247, 243, 238))
draw = ImageDraw.Draw(img, "RGBA")

pdf = dict(x0=146.4, y0=137.04, x1=534.84, y1=655.8)
width = 6.825
scale = width / (pdf["x1"] - pdf["x0"])
cx = (pdf["x0"] + pdf["x1"]) / 2
cy = (pdf["y0"] + pdf["y1"]) / 2


def world(x, y):
    return ((x - cx) * scale, (y - cy) * scale)


# 45° azimuth from SE (entry / bath) looking toward balcony / living,
# 45° elevation — finished-room look-down, not a 2D plan, not a GLB grid.
S = 78.0
ORIGIN = (900, 210)
INV = math.sqrt(2.0)


def iso(x, y, z):
    sx = ORIGIN[0] + (x - z) * S / INV
    sy = ORIGIN[1] + (x + z) * S / 2.0 - y * S / INV
    return (sx, sy)


def shade(rgb, k):
    return tuple(max(0, min(255, int(c * k))) for c in rgb)


def box(x0, z0, x1, z1, y0, y1, fill, edge, alpha=255):
    pts = [
        (x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1),
        (x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1),
    ]
    p = [iso(*c) for c in pts]
    faces = [
        ([p[3], p[2], p[6], p[7]], shade(fill, 0.84)),
        ([p[1], p[2], p[6], p[5]], shade(fill, 1.04)),
        ([p[4], p[5], p[6], p[7]], shade(fill, 1.14)),
    ]
    for poly, color in faces:
        draw.polygon(poly, fill=color + (alpha,))
        draw.line(poly + [poly[0]], fill=edge + (min(255, alpha),), width=1)


def fill_iso_poly(points_xz, y, fill, edge):
    top = [iso(x, y, z) for x, z in points_xz]
    draw.polygon(top, fill=fill + (255,), outline=edge)


def wash_top(x, z, w, d, y, color, alpha=70):
    """Paper-white watercolor highlight on a top face."""
    p = [
        iso(x - w / 2, y, z - d / 2),
        iso(x + w / 2, y, z - d / 2),
        iso(x + w / 2, y, z + d / 2),
        iso(x - w / 2, y, z + d / 2),
    ]
    draw.polygon(p, fill=color + (alpha,))


fp_pdf = [
    (315.12, 137.04), (534.24, 137.04), (534.24, 655.8),
    (146.4, 655.8), (146.4, 210.84), (315.12, 210.84),
]
fp = [world(*p) for p in fp_pdf]

for r, a in ((560, 26), (470, 38), (380, 20)):
    draw.ellipse(
        [ORIGIN[0] - r, ORIGIN[1] + 80, ORIGIN[0] + r + 30, ORIGIN[1] + r * 0.62 + 160],
        fill=(232, 224, 214, a),
    )

cream = (239, 228, 210)
fill_iso_poly(fp, 0.02, cream, (198, 184, 166))
for i, (x, z) in enumerate(fp):
    nx, nz = fp[(i + 1) % len(fp)]
    p0 = iso(x, 0.02, z)
    p1 = iso(nx, 0.02, nz)
    p2 = iso(nx, -0.16, nz)
    p3 = iso(x, -0.16, z)
    draw.polygon([p0, p1, p2, p3], fill=(214, 200, 182, 255))

# A6_SHELL_V3 source rects
walls = [
    ([146.4, 137.04, 184.68, 210.84], "outer", "full"),
    ([146.4, 210.84, 188.95, 219.36], "outer", "full"),
    ([315.12, 137.04, 323.64, 219.36], "outer", "full"),
    ([323.04, 137.64, 325.8, 145.08], "outer", "full"),
    ([431.28, 137.64, 448.98, 145.08], "outer", "full"),
    ([488.82, 137.64, 526.92, 145.08], "outer", "full"),
    ([526.92, 137.64, 534.24, 217.72], "outer", "cutaway"),
    ([526.92, 257.56, 534.24, 655.32], "outer", "cutaway"),
    ([493.68, 145.08, 526.32, 210.84], "outer", "full"),
    ([146.4, 219.36, 154.92, 284.52], "outer", "full"),
    ([146.4, 284.52, 154.92, 293.04], "outer", "full"),
    ([146.4, 293.04, 154.92, 647.88], "outer", "full"),
    ([146.4, 647.88, 171.96, 655.8], "outer", "cutaway"),
    ([234.36, 647.88, 443.14, 655.8], "outer", "cutaway"),
    ([482.98, 647.88, 534.24, 655.8], "outer", "cutaway"),
    ([502.2, 570.84, 526.32, 647.4], "outer", "cutaway"),
    ([435.6, 145.08, 444.12, 325.08], "part", "cutaway"),
    ([318.0, 219.36, 323.64, 222.36], "part", "cutaway"),
    ([318.0, 276.0, 323.64, 469.08], "part", "cutaway"),
    ([318.0, 516.72, 323.64, 569.4], "part", "cutaway"),
    ([323.64, 319.92, 436.2, 325.56], "part", "cutaway"),
    ([443.52, 317.64, 526.92, 325.08], "part", "cutaway"),
    ([385.08, 478.68, 526.92, 484.32], "part", "cutaway"),
    ([384.6, 478.68, 390.24, 484.32], "part", "cutaway"),
    ([384.6, 529.68, 390.24, 564.24], "part", "cutaway"),
    ([323.64, 563.76, 346.8, 569.4], "part", "cutaway"),
    ([351.36, 563.76, 437.52, 569.4], "part", "cutaway"),
    ([442.08, 563.76, 475.8, 569.4], "part", "cutaway"),
    ([346.32, 568.8, 351.96, 602.04], "part", "cutaway"),
    ([437.52, 568.8, 442.08, 591.48], "part", "cutaway"),
    ([496.56, 565.68, 501.6, 651.6], "part", "cutaway"),
    ([442.08, 586.92, 497.04, 591.48], "part", "cutaway"),
    ([475.8, 549.6, 480.36, 568.8], "part", "cutaway"),
    ([480.36, 549.6, 526.92, 555.24], "part", "cutaway"),
    ([154.92, 563.76, 262.68, 573.96], "part", "cutaway"),
    ([154.92, 573.96, 166.32, 647.4], "part", "cutaway"),
]

# p16 high-level hues only: 礦物漆 / 淺色木皮 / 繃布 / 淺色石材 / 小冰柱玻璃
mineral = (255, 248, 237)
part = (255, 242, 230)
wood_wash = (214, 196, 168)
fabric = (224, 138, 104)
stone = (186, 180, 172)
glass = (186, 214, 224)
edge = (158, 175, 202)

for rect, kind, view in walls:
    x0, y0, x1, y1 = rect
    wx0, wz0 = world(x0, y0)
    wx1, wz1 = world(x1, y1)
    h = 1.62 if view == "full" else 0.78
    color = mineral if kind == "outer" else part
    box(min(wx0, wx1), min(wz0, wz1), max(wx0, wx1), max(wz0, wz1), 0, h, color, edge)

# living slider — 小冰柱玻璃 wash, not a photo pane
a, b = world(188.95, 215.1), world(314.16, 215.1)
box(min(a[0], b[0]), min(a[1], b[1]) - 0.04, max(a[0], b[0]), max(a[1], b[1]) + 0.04,
    0.08, 1.40, glass, (184, 202, 216), 200)


def furniture(x, z, w, d, h, color, highlight=(255, 252, 246)):
    box(x - w / 2, z - d / 2, x + w / 2, z + d / 2, 0.02, h, color, (180, 168, 156))
    wash_top(x, z, w * 0.72, d * 0.55, h + 0.01, highlight, 80)


# --- 完成方案 catalog pieces (runtime initialPositions) ---
# sofa side-facing: catalog 1560 x 840 → footprint 0.84 (X) x 1.56 (Z), face spine
furniture(-1.92, -1.70, 2.50, 1.65, 0.04, (232, 196, 150), (252, 244, 228))  # rug
furniture(-2.42, -1.88, 0.84, 1.56, 0.42, fabric)  # sofa-cloud
furniture(-1.52, -1.88, 0.38, 0.38, 0.22, (242, 235, 225))  # table-pla-tb-02 coffee
furniture(-1.50, -0.95, 0.77, 0.67, 0.40, (196, 160, 110))  # chair-breeze lounge
furniture(-2.96, -2.90, 0.22, 0.22, 0.95, (241, 201, 109))  # lamp-moon
furniture(-2.20, -2.78, 0.42, 0.42, 0.85, (109, 143, 101))  # plant-olive

# painted TV-console wash ON the spine (not shelf-cabin)
box(-0.52, -2.55, -0.40, -1.20, 0.42, 0.52, (246, 242, 234), (200, 190, 178))

# FixedKitchen left-wall run + REF in 玄關 — built-in, not invented island
box(-3.22, 0.53, -2.66, 2.83, 0.02, 0.88, (246, 242, 234), (200, 190, 178))
wash_top(-2.94, 1.68, 0.50, 2.10, 0.89, stone, 90)
box(-3.22, 3.18, -2.66, 3.86, 0.02, 1.15, (244, 238, 225), (200, 190, 178))

# bed-soft catalog 1820 x 2080, headboard toward bath (+Z)
furniture(1.72, 0.30, 1.82, 2.08, 0.38, (169, 182, 202))

try:
    font = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc", 22)
    font_s = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc", 18)
    title_font = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc", 30)
    small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 15)
except Exception:
    font = font_s = title_font = small = ImageFont.load_default()

labels = [
    (-1.90, -1.70, "客廳"),
    (-2.00, 1.55, "餐廳"),
    (-2.10, 3.50, "玄關"),
    (0.70, -2.70, "多功能室"),
    (1.72, 0.20, "主臥"),
    (1.40, 2.55, "衛浴"),
]
for x, z, text in labels:
    px, py = iso(x, 0.22, z)
    draw.text((px - 30, py - 8), text, fill=(101, 88, 84, 200), font=font_s)

draw.text((56, 44), "BH7 A6  ·  45° finished-room preview", fill=(101, 88, 84), font=title_font)
draw.text((56, 86), "I1A6-01 shell  ·  sales-deck p4–p20 placement  ·  catalog mm  ·  not construction-true", fill=(129, 120, 114), font=small)
draw.text((56, 110), "watercolor = matte wash only   ·   no ACES / bloom / photo wood   ·   no invented island / wardrobe / desk", fill=(129, 120, 114), font=small)

out = "/workspace/evolution/docs/design-system/a6-preview-45.png"
os.makedirs(os.path.dirname(out), exist_ok=True)
img.save(out, "PNG", optimize=True)
print("wrote", out, img.size)

copy = "/workspace/lookdev-p1/a6-preview-45.png"
img.save(copy, "PNG", optimize=True)
print("wrote", copy, img.size)
