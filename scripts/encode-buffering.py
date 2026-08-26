"""Shrink the buffering loop for a phone overlay.

Source GIF is 198px / 72 frames / ~735KB. Delivery is 128px animated WebP,
every third frame, ~58KB.
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageSequence

SIZE = 128
STEP = 3
QUALITY = 62


def encode(src: Path, dest: Path) -> None:
    im = Image.open(src)
    frames = []
    for i, frame in enumerate(ImageSequence.Iterator(im)):
        if i % STEP:
            continue
        frames.append(frame.convert("RGBA").resize((SIZE, SIZE), Image.Resampling.LANCZOS))
    if not frames:
        raise SystemExit("no frames")
    dest.parent.mkdir(parents=True, exist_ok=True)
    frames[0].save(
        dest,
        format="WEBP",
        save_all=True,
        append_images=frames[1:],
        duration=100 * STEP,
        loop=0,
        quality=QUALITY,
        method=6,
    )


def main() -> None:
    if len(sys.argv) != 3:
        sys.stderr.write("usage: encode-buffering.py <in.gif> <out.webp>\n")
        sys.exit(2)
    encode(Path(sys.argv[1]), Path(sys.argv[2]))


if __name__ == "__main__":
    main()
