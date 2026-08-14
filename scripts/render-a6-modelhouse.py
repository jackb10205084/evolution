"""Isometric model-house schematic of BH7 A6. High-level cute-game traits only."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math

W, H = 1600, 1200
img = Image.new("RGB", (W, H), (247, 243, 238))
draw = ImageDraw.Draw(img, "RGBA")

# same pdfBounds / scale as A6_SHELL_V2
pdf = dict(x0=146.4, y0=137.04, x1=534.84, y1=655.8)
width = 6.825
scale = width / (pdf["x1"] - pdf["x0"])
depth = (pdf["y1"] - pdf["y0"]) * scale
cx = (pdf["x0"] + pdf["x1"]) / 2
cy = (pdf["y0"] + pdf["y1"]) / 2

def world(x, y):
    return ((x - cx) * scale, (y - cy) * scale)

# isometric: x right, z down-right, y up
ISO_X = 38.0
ISO_Y = 22.0
ORIGIN = (820, 430)

def iso(x, y, z):
    # x right, z toward entrance (+z), y up
    sx = ORIGIN[0] + (x - z) * ISO_X
    sy = ORIGIN[1] + (x + z) * ISO_Y - y * 46
    return (sx, sy)

def box(x0, z0, x1, z1, y0, y1, fill, edge, alpha=255):
    # 8 corners
    pts = [
        (x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1),
        (x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1),
    ]
    p = [iso(*c) for c in pts]
    faces = [
        ([p[3], p[2], p[6], p[7]], shade(fill, 0.86)),  # +z
        ([p[1], p[2], p[6], p[5]], shade(fill, 1.06)),  # +x
        ([p[4], p[5], p[6], p[7]], shade(fill, 1.16)),  # top
    ]
    for poly, color in faces:
        draw.polygon(poly, fill=color + (alpha,))
        draw.line(poly + [poly[0]], fill=edge + (min(255, alpha),), width=1)

def shade(rgb, k):
    return tuple(max(0, min(255, int(c * k))) for c in rgb)

# footprint polygon in world xz
fp_pdf = [
    (315.72, 137.04), (534.24, 137.04), (534.24, 655.8),
    (146.4, 655.8), (146.4, 211.32), (315.72, 211.32),
]
fp = [world(*p) for p in fp_pdf]

# floor as extruded slab via trapezoids along edges — fill by tessellating fan
def fill_iso_poly(points_xz, y, fill, edge):
    top = [iso(x, y, z) for x, z in points_xz]
    draw.polygon(top, fill=fill + (255,), outline=edge)

# soft ground blob
for r, a in ((520, 28), (440, 40), (360, 22)):
    draw.ellipse([ORIGIN[0]-r, ORIGIN[1]+40, ORIGIN[0]+r+40, ORIGIN[1]+r*0.55+80],
                 fill=(232, 224, 214, a))

# floor
cream = (239, 228, 210)
fill_iso_poly(fp, 0.02, cream, (198, 184, 166))
# slightly thicker slab edge
for i, (x, z) in enumerate(fp):
    nx, nz = fp[(i + 1) % len(fp)]
    p0 = iso(x, 0.02, z); p1 = iso(nx, 0.02, nz)
    p2 = iso(nx, -0.16, nz); p3 = iso(x, -0.16, z)
    draw.polygon([p0, p1, p2, p3], fill=(214, 200, 182, 255))

# walls from V2 source rects (kind, view -> height)
walls = [
    # outer
    ([146.4, 137.04, 184.68, 210.84], "outer", "full"),
    ([323.04, 137.64, 526.92, 145.08], "outer", "full"),
    ([315.72, 137.64, 323.04, 218.76], "outer", "full"),
    ([526.92, 137.64, 534.24, 655.32], "outer", "cutaway"),
    ([502.2, 145.56, 526.32, 210.84], "outer", "full"),
    ([147.0, 219.36, 154.92, 284.52], "outer", "full"),
    ([146.4, 284.52, 154.92, 293.04], "outer", "full"),
    ([147.0, 293.04, 154.32, 647.88], "outer", "full"),
    ([147.0, 647.88, 171.7, 655.32], "outer", "cutaway"),
    ([234.3, 647.88, 526.92, 655.32], "outer", "cutaway"),
    ([502.2, 570.84, 526.32, 647.4], "outer", "cutaway"),
    # partitions
    ([436.2, 145.08, 443.52, 325.08], "part", "cutaway"),
    ([318.0, 219.36, 323.64, 222.36], "part", "cutaway"),
    ([318.0, 276.0, 323.64, 469.08], "part", "cutaway"),
    ([318.0, 516.72, 323.64, 569.4], "part", "cutaway"),
    ([323.64, 319.92, 436.2, 325.56], "part", "cutaway"),
    ([443.52, 317.64, 526.92, 325.08], "part", "cutaway"),
    ([385.08, 479.28, 526.92, 484.32], "part", "cutaway"),
    ([385.08, 479.28, 389.64, 564.24], "part", "cutaway"),
    ([323.64, 564.24, 346.8, 569.4], "part", "cutaway"),
    ([351.36, 564.24, 437.52, 569.4], "part", "cutaway"),
    ([442.08, 564.24, 475.8, 568.8], "part", "cutaway"),
    ([346.8, 568.8, 351.36, 647.88], "part", "cutaway"),
    ([437.52, 568.8, 442.08, 591.48], "part", "cutaway"),
    ([496.56, 565.68, 501.6, 651.6], "part", "cutaway"),
    ([442.08, 586.92, 497.04, 591.48], "part", "cutaway"),
    ([475.8, 550.08, 480.36, 568.8], "part", "cutaway"),
    ([154.92, 563.76, 262.68, 573.96], "part", "cutaway"),
    ([154.92, 573.96, 166.32, 647.4], "part", "cutaway"),
]

milk = (255, 248, 237)
part = (255, 242, 230)
for rect, kind, view in walls:
    x0, y0, x1, y1 = rect
    wx0, wz0 = world(x0, y0)
    wx1, wz1 = world(x1, y1)
    h = 1.55 if view == "full" else 0.72
    color = milk if kind == "outer" else part
    box(min(wx0, wx1), min(wz0, wz1), max(wx0, wx1), max(wz0, wz1), 0, h, color, (158, 175, 202))

# glass strips
def glass(x0, z0, x1, z1):
    box(x0, z0, x1, z1, 0.08, 1.35, (186, 214, 224), (184, 202, 216), 210)

# living sliding door
a, b = world(154.9, 215.1), world(315.1, 215.1)
glass(min(a[0], b[0]), min(a[1], b[1]) - 0.04, max(a[0], b[0]), max(a[1], b[1]) + 0.04)

# furniture — catalog sizes, I1A6-02 rooms. Cute blocks, not SKU copies of a Pinterest room.
def furniture(x, z, w, d, h, color):
    box(x - w/2, z - d/2, x + w/2, z + d/2, 0.02, h, color, (180, 168, 156))

# 客廳
furniture(-1.85, -1.55, 2.20, 1.40, 0.04, (232, 196, 150))  # rug
furniture(-1.85, -0.88, 1.56, 0.84, 0.42, (224, 138, 104))  # sofa catalog 1560x840
furniture(-1.85, -1.88, 0.70, 0.70, 0.22, (242, 235, 225))  # table
furniture(-0.92, -2.18, 0.77, 0.67, 0.40, (196, 160, 110))  # chair
furniture(-2.72, -1.28, 0.22, 0.22, 0.95, (241, 201, 109))  # lamp
furniture(-2.78, -2.58, 0.42, 0.42, 0.85, (109, 143, 101))  # plant
furniture(-2.95, 0.12, 0.42, 1.20, 0.95, (188, 139, 95))    # shelf

# 餐廳
furniture(-1.68, 1.38, 0.70, 0.70, 0.38, (196, 160, 122))

# kitchen run along 餐廳 left wall
box(-3.22, 0.70, -2.66, 2.55, 0.02, 0.88, (246, 242, 234), (200, 190, 178))
# REF in 玄關
box(-2.62, 3.20, -1.98, 3.82, 0.02, 1.15, (244, 238, 225), (200, 190, 178))

# 主臥 bed catalog 1820x2080
furniture(1.82, 0.08, 1.82, 1.70, 0.38, (169, 182, 202))
# 多功能室 shelf
furniture(0.72, -2.52, 0.76, 0.39, 0.70, (240, 238, 232))

# room labels
try:
    font = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc", 22)
    font_s = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc", 17)
except Exception:
    font = ImageFont.load_default()
    font_s = font

labels = [
    (-1.85, -1.6, "客廳"),
    (-1.70, 1.35, "餐廳"),
    (-2.10, 3.55, "玄關"),
    (0.70, -2.6, "多功能室"),
    (1.85, 0.15, "主臥"),
    (1.40, 2.55, "衛浴"),
]
for x, z, text in labels:
    px, py = iso(x, 0.2, z)
    draw.text((px - 28, py - 8), text, fill=(101, 88, 84, 210), font=font_s)

# title
try:
    title_font = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc", 28)
    small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 15)
except Exception:
    title_font = font
    small = font_s
draw.text((64, 48), "BH7 A6  ·  isometric model-house", fill=(101, 88, 84), font=title_font)
draw.text((64, 88), "I1A6-01 shell  ·  I1A6-02 room positions  ·  catalog mm  ·  not construction-true", fill=(129, 120, 114), font=small)
draw.text((64, 112), "watercolor = wash albedo only   ·   no ACES / bloom / photo wood", fill=(129, 120, 114), font=small)

out = "/workspace/evolution/docs/design-system/a6-isometric-modelhouse.png"
img.save(out, "PNG", optimize=True)
print("wrote", out, img.size)
