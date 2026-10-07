#!/usr/bin/env python3
"""Generate stand-in raster mascots so /mascot-test/ can exercise the raster path.

Run from the repo root:  python3 tools/make-demo-raster.py   (needs Pillow)

Writes transparent WebP files to mascot-test/demo/ in the same shape final
Midjourney art must take (see docs/mascot-svg-contract.md, "Raster mascots"):
600px square at 1x, 1200px at @2x, feet on the ground line at 84% height, no
blob or shadow. Poses: idle, happy, and idle-b (idle redrawn with a different
wobble, for data-boil). These files are test fixtures, never site art.
"""

import json
import math
import random
import zlib
from pathlib import Path

from PIL import Image, ImageDraw

NAVY = (27, 43, 75, 255)
AMBER = (200, 135, 58, 255)
CREAM = (247, 244, 238, 255)

S = 2400            # drawn at 4x of 1x, then downsampled for clean edges
GROUND = 0.84 * S
OUT = Path(__file__).resolve().parent.parent / "mascot-test" / "demo"

DEMOS = {
    "demo-bean": {"fill": AMBER, "shape": "bean", "blob": "butter"},
}


def wobbly_outline(cx, cy, rx, ry, seed, squareness=2.0, n=120):
    """Superellipse with hand-drawn radius noise. squareness 2 is an ellipse."""
    rnd = random.Random(seed)
    phase = [rnd.uniform(0, math.tau) for _ in range(3)]
    pts = []
    for i in range(n):
        t = math.tau * i / n
        c, s = math.cos(t), math.sin(t)
        e = 2.0 / squareness
        x = math.copysign(abs(c) ** e, c)
        y = math.copysign(abs(s) ** e, s)
        noise = 1 + 0.012 * math.sin(3 * t + phase[0]) + 0.008 * math.sin(7 * t + phase[1]) + 0.005 * math.sin(11 * t + phase[2])
        pts.append((cx + rx * x * noise, cy + ry * y * noise))
    return pts


def limb(d, a, b, w):
    d.line([a, b], fill=NAVY, width=w)
    for p in (a, b):
        d.ellipse([p[0] - w / 2, p[1] - w / 2, p[0] + w / 2, p[1] + w / 2], fill=NAVY)


def draw(spec, pose):
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    seed = zlib.crc32(f"{spec['shape']}-{pose == 'idle-b'}".encode())
    j = random.Random(seed)
    jitter = (lambda: j.uniform(-0.004, 0.004) * S) if pose == "idle-b" else (lambda: 0)

    cx, cy = S / 2, 0.47 * S
    rx, ry = (0.21 * S, 0.25 * S) if spec["shape"] == "bean" else (0.22 * S, 0.22 * S)
    squareness = 2.0 if spec["shape"] == "bean" else 4.5
    stroke = int(0.016 * S)
    limb_w = int(0.04 * S)
    body_bottom = cy + ry

    # legs reach the ground line
    for dx in (-0.07 * S, 0.07 * S):
        limb(d, (cx + dx + jitter(), body_bottom - 0.04 * S), (cx + dx + jitter(), GROUND - limb_w / 2), limb_w)

    # arms
    sy = cy + 0.02 * S
    if pose == "happy":
        arms = [((cx - rx * 0.92, sy), (cx - rx - 0.1 * S, sy - 0.2 * S)),
                ((cx + rx * 0.92, sy), (cx + rx + 0.1 * S, sy - 0.2 * S))]
    else:
        arms = [((cx - rx * 0.92, sy), (cx - rx - 0.08 * S + jitter(), sy + 0.15 * S + jitter())),
                ((cx + rx * 0.92, sy), (cx + rx + 0.08 * S + jitter(), sy + 0.15 * S + jitter()))]
    for a, b in arms:
        limb(d, a, b, limb_w)

    outline = wobbly_outline(cx, cy, rx, ry, seed, squareness)
    d.polygon(outline, fill=spec["fill"], outline=NAVY, width=stroke)

    ey = cy - 0.05 * S
    for dx in (-0.075 * S, 0.075 * S):
        ex = cx + dx + jitter()
        if pose == "happy":
            r = 0.04 * S
            d.arc([ex - r, ey - r * 0.6, ex + r, ey + r * 1.4], 200, 340, fill=NAVY, width=int(stroke * 1.1))
        else:
            r = 0.042 * S
            d.ellipse([ex - r, ey - r * 1.1, ex + r, ey + r * 1.1], fill=CREAM, outline=NAVY, width=int(stroke * 0.8))
            pr = 0.018 * S
            d.ellipse([ex - pr + 0.006 * S, ey - pr + 0.01 * S, ex + pr + 0.006 * S, ey + pr + 0.01 * S], fill=NAVY)

    my = cy + 0.08 * S
    if pose == "happy":
        d.chord([cx - 0.07 * S, my - 0.06 * S, cx + 0.07 * S, my + 0.07 * S], 0, 180, fill=NAVY)
    else:
        d.arc([cx - 0.06 * S + jitter(), my - 0.05 * S, cx + 0.06 * S + jitter(), my + 0.03 * S], 20, 160, fill=NAVY, width=int(stroke * 0.9))

    return img


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {}
    poses = ["idle", "happy", "idle-b"]
    for mascot_id, spec in DEMOS.items():
        for pose in poses:
            big = draw(spec, pose)
            big.resize((1200, 1200), Image.LANCZOS).save(OUT / f"{mascot_id}-{pose}@2x.webp", "WEBP", quality=88, method=6)
            big.resize((600, 600), Image.LANCZOS).save(OUT / f"{mascot_id}-{pose}.webp", "WEBP", quality=88, method=6)
        manifest[mascot_id] = {"type": "raster", "poses": poses, "blob": spec["blob"], "path": "/mascot-test/demo/"}
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Wrote {len(DEMOS) * len(poses) * 2} WebP files and manifest.json to {OUT}")


if __name__ == "__main__":
    main()
