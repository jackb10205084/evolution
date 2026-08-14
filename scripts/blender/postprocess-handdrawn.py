"""Turn the neutral Blender beauty pass into a restrained hand-drawn plate.

This deterministic look-dev finish keeps room geometry and product silhouettes
pixel-aligned while adding paper, pigment and pencil cues that do not belong in
the authoritative web GLB.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageChops, ImageEnhance, ImageFilter, ImageOps


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output")
    parser.add_argument("--beauty-copy")
    return parser.parse_args()


def remap_noise(image: Image.Image, low: int, high: int) -> Image.Image:
    span = high - low
    return image.point(lambda value: low + round(value * span / 255))


def shifted(mask: Image.Image, x: int, y: int) -> Image.Image:
    result = Image.new("L", mask.size, 0)
    result.paste(mask, (x, y))
    return result


def main() -> None:
    args = parse_args()
    input_path = Path(args.input)
    output_path = Path(args.output) if args.output else input_path

    source = Image.open(input_path).convert("RGB")
    if args.beauty_copy:
        beauty_path = Path(args.beauty_copy)
        beauty_path.parent.mkdir(parents=True, exist_ok=True)
        if beauty_path.resolve() != input_path.resolve():
            source.save(beauty_path, quality=100)

    # Flatten the synthetic render response without yellowing neutral walls.
    art = ImageEnhance.Color(source).enhance(0.93)
    art = ImageEnhance.Contrast(art).enhance(0.96)
    art = ImageEnhance.Brightness(art).enhance(1.012)
    art = art.filter(ImageFilter.GaussianBlur(0.12))

    width, height = art.size

    # Broad pigment wash: low amplitude, large scale and neutral in hue.
    wash = Image.effect_noise((max(2, width // 10), max(2, height // 10)), 12)
    wash = wash.resize(art.size, Image.Resampling.BICUBIC)
    wash = remap_noise(wash, 249, 255)
    wash_rgb = Image.merge("RGB", (wash, wash, wash))
    art = Image.blend(art, ImageChops.multiply(art, wash_rgb), 0.13)

    # Fine paper tooth stays almost invisible at normal viewing size.
    tooth = Image.effect_noise(art.size, 7).filter(ImageFilter.GaussianBlur(0.55))
    tooth = remap_noise(tooth, 251, 255)
    tooth_rgb = Image.merge("RGB", (tooth, tooth, tooth))
    art = Image.blend(art, ImageChops.multiply(art, tooth_rgb), 0.055)

    # Difference-of-Gaussians finds real geometry and material boundaries.
    # A faint one-pixel echo avoids a perfectly vector-like contour.
    # Detect contours on the clean beauty pass so paper grain never turns into
    # dirty stippling.
    gray = ImageOps.grayscale(source)
    near = gray.filter(ImageFilter.GaussianBlur(0.72))
    far = gray.filter(ImageFilter.GaussianBlur(1.72))
    edges = ImageChops.difference(near, far)
    edges = ImageOps.autocontrast(edges, cutoff=2)
    edges = edges.point(
        lambda value: 0 if value < 28 else min(78, round((value - 28) * 0.52))
    )
    edges = edges.filter(ImageFilter.GaussianBlur(0.22))
    ghost = shifted(edges.point(lambda value: round(value * 0.12)), 1, 0)
    ink_mask = ImageChops.lighter(edges, ghost)
    ink = Image.new("RGB", art.size, "#75675f")
    art = Image.composite(ink, art, ink_mask)

    # A light ivory paper veil unifies otherwise separate 3D materials.
    veil = Image.new("RGB", art.size, "#f4f0e8")
    art = Image.blend(art, veil, 0.015)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    art.save(output_path, optimize=True)


if __name__ == "__main__":
    main()
