"""Copy the 60 zombie_zones stills into public/game/quiet/zones as 01.webp–60.webp.

Layout: 12 characters × 5 poses. Pose 1 is the unnumbered file; (2)–(5) follow.
Watching uses poses 1–3. Attack (loud) uses poses 4–5.
"""
from __future__ import annotations

import re
import shutil
from pathlib import Path

SRC = Path(__file__).resolve().parents[1] / "zombie_zones"
OUT = Path(__file__).resolve().parents[1] / "public" / "game" / "quiet" / "zones"

NAME = re.compile(r"^zombie_(\d+)(?: \((\d+)\))?\.webp$", re.I)


def pose_of(name: str) -> tuple[int, int]:
    m = NAME.match(name)
    if not m:
        raise ValueError("unexpected zone name: " + name)
    return int(m.group(1)), int(m.group(2) or 1)


def main() -> None:
    rows = [pose_of(p.name) + (p,) for p in SRC.glob("*.webp")]
    rows.sort(key=lambda r: (r[0], r[1]))
    if len(rows) != 60:
        raise SystemExit("expected 60 zone stills, found %d" % len(rows))
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.webp"):
        old.unlink()
    for i, (char, pose, src) in enumerate(rows, start=1):
        dest = OUT / ("%02d.webp" % i)
        shutil.copy2(src, dest)
        print("%s  char=%02d pose=%d" % (dest.name, char, pose))
    print("wrote", len(rows), "zones to", OUT)


if __name__ == "__main__":
    main()
