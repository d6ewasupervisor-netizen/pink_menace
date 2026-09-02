"""Chroma-key Quiet overlay plates to PNG with alpha."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = Path(r"C:\Users\tgaut\.cursor\projects\c-Users-tgaut-pink-menace\assets")
OUT = Path(__file__).resolve().parents[1] / "public" / "game" / "quiet"


def key_keep_rgb(im: Image.Image) -> Image.Image:
    """Keep photoreal RGB. Magenta goes to alpha. Used for figures, not dirt prints."""
    arr = np.asarray(im.convert("RGB"), dtype=np.float32)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    dist = np.sqrt((r - 255.0) ** 2 + (g - 0.0) ** 2 + (b - 255.0) ** 2)
    mag = np.minimum(r, b) - g
    alpha = np.clip((dist - 50.0) / 45.0, 0.0, 1.0)
    alpha = np.where(mag > 75.0, np.minimum(alpha, 0.06), alpha)
    out = np.zeros((arr.shape[0], arr.shape[1], 4), dtype=np.uint8)
    out[:, :, 0] = np.clip(r, 0, 255).astype(np.uint8)
    out[:, :, 1] = np.clip(g, 0, 255).astype(np.uint8)
    out[:, :, 2] = np.clip(b, 0, 255).astype(np.uint8)
    out[:, :, 3] = (alpha * 255.0).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def key_rgba(im: Image.Image, hard: bool = False) -> Image.Image:
    arr = np.asarray(im.convert("RGB"), dtype=np.float32)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    dist = np.sqrt((r - 255.0) ** 2 + (g - 0.0) ** 2 + (b - 255.0) ** 2)
    # Magenta channel leftover vs green (despill)
    mag = np.minimum(r, b)
    score = mag - g
    if hard:
        # Print / silhouette: on/off alpha. Soft midtones read as apparition.
        alpha = np.where(dist < 95.0, 0.0, np.clip((dist - 70.0) / 55.0, 0.0, 1.0))
        alpha = np.where(score > 110.0, 0.0, alpha)
        alpha = np.where(alpha > 0.2, np.clip(alpha * 1.35, 0.0, 1.0), alpha)
    else:
        alpha = np.clip((dist - 70.0) / 150.0, 0.0, 1.0)
        alpha = np.where(score > 90.0, alpha * 0.15, alpha)
    alpha = np.clip(alpha, 0.0, 1.0)
    # Pull remaining pink toward the dirt color
    spill = np.clip(score / 140.0, 0.0, 1.0)
    r2 = r * (1.0 - spill * 0.85) + g * spill * 0.45
    b2 = b * (1.0 - spill * 0.85) + g * spill * 0.45
    gray = 0.22 * r2 + 0.58 * g + 0.20 * b2
    pink = np.clip((np.minimum(r2, b2) - g) / 80.0, 0.0, 1.0)
    r2 = r2 * (1.0 - pink) + gray * pink
    g2 = g * (1.0 - pink * 0.35) + gray * pink * 0.35
    b2 = b2 * (1.0 - pink) + gray * pink
    out = np.zeros((arr.shape[0], arr.shape[1], 4), dtype=np.uint8)
    out[:, :, 0] = np.clip(r2, 0, 255).astype(np.uint8)
    out[:, :, 1] = np.clip(g2, 0, 255).astype(np.uint8)
    out[:, :, 2] = np.clip(b2, 0, 255).astype(np.uint8)
    out[:, :, 3] = (alpha * 255.0).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def keep_dark_marks(im: Image.Image, luma_cut: float = 132.0) -> Image.Image:
    arr = np.asarray(im)
    luma = 0.3 * arr[:, :, 0] + 0.59 * arr[:, :, 1] + 0.11 * arr[:, :, 2]
    fade = np.clip((luma_cut - luma) / 50.0, 0.0, 1.0)
    arr = arr.copy()
    arr[:, :, 3] = (arr[:, :, 3].astype(np.float32) * fade).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def opaque_frac(im: Image.Image) -> float:
    a = np.asarray(im.split()[-1])
    return float((a > 24).mean())


def make_eyeshine() -> Image.Image:
    im = Image.new("RGBA", (1024, 1536), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    pairs = [((410, 980), (452, 982)), ((560, 1020), (598, 1018))]
    for (x1, y1), (x2, y2) in pairs:
        for x, y in ((x1, y1), (x2, y2)):
            d.ellipse((x - 7, y - 5, x + 7, y + 5), fill=(232, 180, 74, 200))
            d.ellipse((x - 3, y - 2, x + 2, y + 2), fill=(255, 230, 160, 230))
    return im.filter(ImageFilter.GaussianBlur(1.2))


def dirtify(im: Image.Image, brown: bool) -> Image.Image:
    a = np.asarray(im).astype(np.float32)
    r, g, b, al = a[:, :, 0], a[:, :, 1], a[:, :, 2], a[:, :, 3]
    gray = 0.22 * r + 0.48 * g + 0.30 * b
    if brown:
        r2, g2, b2 = gray * 1.02, gray * 0.88, gray * 0.72
    else:
        r2 = g2 = b2 = gray
    out = np.stack([r2, g2, b2, al], axis=2)
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA")


def crop_content(im: Image.Image, pad: int = 12) -> Image.Image:
    a = np.asarray(im.split()[-1])
    ys, xs = np.where(a > 24)
    if xs.size == 0:
        return im
    x0, x1 = max(0, int(xs.min()) - pad), min(im.width, int(xs.max()) + pad)
    y0, y1 = max(0, int(ys.min()) - pad), min(im.height, int(ys.max()) + pad)
    return im.crop((x0, y0, x1, y1))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    mapping = {
        "prints": "quiet-prints.png",
        "flood": "quiet-flood.png",
        "palm": "quiet-palm-print.png",
        "smear": "quiet-smear.png",
        "fog": "quiet-fog.png",
        "distant": "quiet-distant.png",
        "gait": "quiet-gait-shoulder.png",
        "herd": "quiet-herd.png",
        "contact": "quiet-contact-zombie-mirror.png",
        "eyeshine": "quiet-eyeshine.png",
    }
    for name, src_name in mapping.items():
        src = SRC / src_name
        if name in ("gait", "contact"):
            keyed = key_keep_rgb(Image.open(src))
        else:
            keyed = key_rgba(Image.open(src), hard=name == "palm")
        if name == "eyeshine" and opaque_frac(keyed) < 0.002:
            keyed = make_eyeshine()
            print(f"{name:10} synthesized (empty key)")
        elif name in ("flood", "prints"):
            keyed = keep_dark_marks(keyed)
            print(f"{name:10} opaque={opaque_frac(keyed):.2%} size={keyed.size}")
        elif name in ("distant", "gait", "herd", "contact", "palm"):
            keyed = crop_content(keyed)
            print(f"{name:10} opaque={opaque_frac(keyed):.2%} size={keyed.size}")
        else:
            print(f"{name:10} opaque={opaque_frac(keyed):.2%} size={keyed.size}")
        if name in ("prints", "flood", "palm", "fog"):
            keyed = dirtify(keyed, True)
        elif name in ("distant", "herd"):
            keyed = dirtify(keyed, False)
        if name == "palm":
            a = np.asarray(keyed).astype(np.float32)
            a[:, :, :3] *= 0.52
            keyed = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGBA")
        if name == "smear" and opaque_frac(keyed) < 0.01:
            print(f"{name:10} skipped (empty)")
            continue
        if name in ("prints", "flood", "fog") and keyed.width > 768:
            keyed = keyed.resize((768, int(keyed.height * 768 / keyed.width)), Image.Resampling.LANCZOS)
        keyed.save(OUT / f"{name}.png", optimize=True)


if __name__ == "__main__":
    main()
