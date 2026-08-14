"""Recompose protected Blender products and geometry lines over an AI plate."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter, ImageOps


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--passes", required=True)
    parser.add_argument("--ai-image", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument(
        "--product-mode",
        choices=("exact", "harmonized"),
        default="exact",
        help="exact is the commerce audit; harmonized carries watercolor medium into product interiors",
    )
    return parser.parse_args()


def normalize(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    if image.size == size:
        return image
    return ImageOps.fit(image, size, Image.Resampling.LANCZOS, centering=(0.5, 0.5))


def interior(mask: Image.Image, radius: int = 2) -> Image.Image:
    size = radius * 2 + 1
    return mask.filter(ImageFilter.MinFilter(size)).point(lambda value: 255 if value >= 127 else 0)


def binary(mask: Image.Image) -> Image.Image:
    return mask.convert("L").point(lambda value: 255 if value >= 127 else 0)


def exact_match_ratio(left: Image.Image, right: Image.Image, mask: Image.Image) -> float:
    difference = ImageChops.difference(left.convert("RGB"), right.convert("RGB"))
    difference = ImageOps.grayscale(difference).point(lambda value: 255 if value == 0 else 0)
    masked_match = ImageChops.multiply(difference, mask)
    histogram_mask = mask.histogram()
    pixels = sum(histogram_mask[127:])
    if not pixels:
        return 0.0
    matched = sum(masked_match.histogram()[127:])
    return matched / pixels


def main() -> None:
    args = parse_args()
    pass_directory = Path(args.passes)
    base = Image.open(pass_directory / "beauty-neutral.png").convert("RGB")
    ai = normalize(Image.open(args.ai_image).convert("RGB"), base.size)
    # Blender's display transform can encode an emission-white semantic pass as
    # ~236 rather than 255. Threshold it before compositing so the commerce
    # guarantee is hard replacement, never a translucent blend.
    products = binary(Image.open(pass_directory / "mask-products.png"))

    if args.product_mode == "exact":
        # Commerce-audit output: product pixels are restored with a hard mask.
        # AI is never trusted to preserve SKU appearance by prompt alone.
        product_plate = base
    else:
        # Proposal output: the hard semantic mask still fixes the occupied
        # footprint, while a controlled amount of the registered AI plate
        # carries paper/wash character into the product interior. The exact
        # audit remains a separate artifact and is never discarded.
        product_plate = Image.blend(base, ai, 0.58)
    result = Image.composite(product_plate, ai, products)

    # Architecture and product line plates restore the authoritative silhouette
    # without replacing the styleable wall and floor washes.
    outside_products = ImageOps.invert(products)
    for name in ("line-architecture.png", "line-products.png"):
        line = Image.open(pass_directory / name).convert("RGBA")
        line.putalpha(ImageChops.multiply(line.getchannel("A"), outside_products))
        result = Image.alpha_composite(result.convert("RGBA"), line).convert("RGB")

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    result.save(output, optimize=True)

    protected_interior = interior(products, 3)
    report = {
        "schemaVersion": "2.0",
        "aiInput": str(Path(args.ai_image)),
        "base": str(pass_directory / "beauty-neutral.png"),
        "output": str(output),
        "productMode": args.product_mode,
        "productInteriorPixelMatch": round(
            exact_match_ratio(base, result, protected_interior), 6
        ),
        "geometryPolicy": (
            "exact product pixels plus authoritative exterior line overlays"
            if args.product_mode == "exact"
            else "registered watercolor blend inside the hard product mask plus authoritative exterior line overlays"
        ),
    }
    report_path = output.with_suffix(".report.json")
    report_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
