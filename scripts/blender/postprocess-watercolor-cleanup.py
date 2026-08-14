"""Reduce low-contrast generated texture while preserving watercolor line art.

The cleanup is deliberately conservative: it smooths only quiet, low-frequency
surfaces and protects edges/small object detail with a dilated luminance mask.
It does not move, repaint or regenerate room geometry.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter, ImageOps


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    source = Image.open(args.input).convert("RGB")

    # The blur removes the faint tiled/embossed residue. A difference mask
    # restores real ink edges and small product details from the source.
    quiet_surface = source.filter(ImageFilter.GaussianBlur(1.05))
    gray = ImageOps.grayscale(source)
    broad = gray.filter(ImageFilter.GaussianBlur(2.1))
    detail = ImageChops.difference(gray, broad)
    edge_mask = detail.point(lambda value: 255 if value >= 11 else 0)
    edge_mask = edge_mask.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(0.65))
    cleaned = Image.composite(source, quiet_surface, edge_mask)

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    cleaned.save(output, optimize=True)


if __name__ == "__main__":
    main()
