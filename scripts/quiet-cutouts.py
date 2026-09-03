"""Extract standing-walker cutouts from the 60 zone stills.

Most zone stills are full scenes (interiors, hordes, trucks). Those stay
in /quiet/zones/ for glass. Only tall isolated figures go in /quiet/cutouts/
for roadside and chase overlays.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image
from rembg import remove

SRC = Path(__file__).resolve().parents[1] / "public" / "game" / "quiet" / "zones"
OUT = Path(__file__).resolve().parents[1] / "public" / "game" / "quiet" / "cutouts"

# Full-body walkers that survive rembg without taking a truck or a face close-up.
KEEP = {"52", "56", "57", "58", "59", "60"}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.png"):
        old.unlink()
    kept = 0
    for p in sorted(SRC.glob("*.webp")):
        if p.stem not in KEEP:
            continue
        cut = remove(Image.open(p).convert("RGBA"))
        a = np.asarray(cut.split()[-1])
        ys, xs = np.where(a > 28)
        if xs.size < 80:
            print("empty", p.name)
            continue
        pad = 6
        cut = cut.crop(
            (
                max(0, int(xs.min()) - pad),
                max(0, int(ys.min()) - pad),
                min(cut.width, int(xs.max()) + pad),
                min(cut.height, int(ys.max()) + pad),
            )
        )
        cut.save(OUT / (p.stem + ".png"), optimize=True)
        kept += 1
        print("kept", p.stem, cut.size)
    print("wrote", kept, "cutouts")


if __name__ == "__main__":
    main()
