"""Encode a 2:3 card still to phone-sized WebP.

Masters stay 1024x1536 PNG. Delivery is 768x1152 WebP q80 method=6 —
about 2.5x a 18rem CSS frame, ~15-40x smaller than the PNG, and smaller
than JPEG at the same visual quality on these photoreal stills.
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

WIDTH = 768
HEIGHT = 1152
QUALITY = 80


def encode(src: Path, dest: Path) -> None:
    im = Image.open(src).convert("RGB")
    if im.size != (WIDTH, HEIGHT):
        im = im.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, format="WEBP", quality=QUALITY, method=6)


def main() -> None:
    if len(sys.argv) != 3:
        sys.stderr.write("usage: encode-still.py <in.png> <out.webp>\n")
        sys.exit(2)
    encode(Path(sys.argv[1]), Path(sys.argv[2]))


if __name__ == "__main__":
    main()
