"""Create deterministic line and protection passes from Blender semantic masks."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont, ImageOps


INK = (92, 86, 98)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", required=True)
    return parser.parse_args()


def binary_mask(path: Path) -> Image.Image:
    image = Image.open(path).convert("RGB")
    gray = ImageOps.grayscale(image)
    return gray.point(lambda value: 255 if value >= 127 else 0)


def outline(mask: Image.Image, radius: int) -> Image.Image:
    size = radius * 2 + 1
    outer = mask.filter(ImageFilter.MaxFilter(size))
    inner = mask.filter(ImageFilter.MinFilter(size))
    return ImageChops.subtract(outer, inner)


def colored_line(mask: Image.Image, opacity: float) -> Image.Image:
    alpha = mask.point(lambda value: round(value * opacity))
    result = Image.new("RGBA", mask.size, (*INK, 0))
    result.putalpha(alpha)
    return result


def coverage(mask: Image.Image) -> float:
    histogram = mask.histogram()
    lit = sum(count for value, count in enumerate(histogram) if value >= 127)
    return lit / (mask.width * mask.height)


def labeled_tile(image: Image.Image, label: str, size: tuple[int, int]) -> Image.Image:
    tile = Image.new("RGB", size, "#f6f3ee")
    preview = image.convert("RGBA")
    preview.thumbnail((size[0], size[1] - 30), Image.Resampling.LANCZOS)
    x = (size[0] - preview.width) // 2
    y = 24 + (size[1] - 30 - preview.height) // 2
    tile.paste(preview.convert("RGB"), (x, y))
    ImageDraw.Draw(tile).text((10, 7), label, fill="#5c5662", font=ImageFont.load_default())
    return tile


def main() -> None:
    args = parse_args()
    directory = Path(args.input_dir)
    architecture = binary_mask(directory / "mask-architecture.png")
    products = binary_mask(directory / "mask-products.png")
    lifestyle = binary_mask(directory / "mask-lifestyle.png")

    architecture_edge = outline(architecture, 1)
    product_edge = outline(products, 1)
    lifestyle_edge = outline(lifestyle, 1)

    line_architecture = colored_line(architecture_edge, 0.30)
    line_products = colored_line(product_edge, 0.22)
    line_lifestyle = colored_line(lifestyle_edge, 0.15)
    line_architecture.save(directory / "line-architecture.png", optimize=True)
    line_products.save(directory / "line-products.png", optimize=True)
    line_lifestyle.save(directory / "line-lifestyle.png", optimize=True)

    protected_products = products.filter(ImageFilter.MaxFilter(3))
    protected_geometry_edges = architecture_edge.filter(ImageFilter.MaxFilter(3))
    protected = ImageChops.lighter(protected_products, protected_geometry_edges)
    styleable = ImageOps.invert(protected)
    protected.save(directory / "mask-protected.png", optimize=True)
    styleable.save(directory / "mask-styleable.png", optimize=True)

    beauty = Image.open(directory / "beauty-neutral.png").convert("RGB")
    tiles = [
        labeled_tile(beauty, "Beauty neutral", (720, 450)),
        labeled_tile(architecture, "Architecture mask", (720, 450)),
        labeled_tile(products, "Products mask", (720, 450)),
        labeled_tile(lifestyle, "Lifestyle mask", (720, 450)),
        labeled_tile(line_architecture, "Architecture line", (720, 450)),
        labeled_tile(protected, "Protected mask", (720, 450)),
    ]
    contact = Image.new("RGB", (1440, 1350), "#f6f3ee")
    for index, tile in enumerate(tiles):
        contact.paste(tile, ((index % 2) * 720, (index // 2) * 450))
    contact.save(directory / "pass-contact-sheet.png", optimize=True)

    report = {
        "schemaVersion": "2.0",
        "dimensions": [beauty.width, beauty.height],
        "coverage": {
            "architecture": round(coverage(architecture), 6),
            "products": round(coverage(products), 6),
            "lifestyle": round(coverage(lifestyle), 6),
            "protected": round(coverage(protected), 6),
            "styleable": round(coverage(styleable), 6),
        },
        "lineContract": {
            "architectureRadiusPx": 1,
            "productsRadiusPx": 1,
            "lifestyleRadiusPx": 1,
            "ink": "#5c5662",
        },
    }
    (directory / "pass-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
