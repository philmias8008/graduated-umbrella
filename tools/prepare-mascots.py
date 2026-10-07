#!/usr/bin/env python3
"""Turn raw mascot art into site-ready files.

Run from the repo root:  python3 tools/prepare-mascots.py [--only ID] [--dry-run]

Input: raw images in assets/mascots/incoming/, named {id}-{pose}.png (or .jpg,
.jpeg, .webp), e.g. magnifier-idle.png, magnifier-happy.png, magnifier-idle-b.png.
Any size. Either already transparent, or on a flat plain background.

For each mascot id it:
  1. removes a flat background (skipped when the image already has transparency);
  2. finds the character and scales every pose of that mascot by the same
     amount, so the character stays the same size from pose to pose;
  3. stands it on the shared ground line at 84% of the canvas height, centered
     on its feet, so poses line up when they crossfade or boil;
  4. writes {id}-{pose}.webp (600px) and {id}-{pose}@2x.webp (1200px) to
     assets/mascots/final/;
  5. sets type "raster" and the pose list in assets/mascots/manifest.json,
     keeping the mascot's default blob;
  6. saves a preview sheet per mascot to assets/mascots/incoming/_preview/.

See docs/mascot-raster-spec.md for what good input looks like. Raw files and
previews stay out of git (see .gitignore); only the final WebPs are committed.
"""

import argparse
import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
CANVAS_2X = 1200
GROUND = 0.84          # feet touch this fraction of the canvas height
TOP_ROOM = 0.12        # clear space above the tallest pose, so some blob shows around the character
SIDE_ROOM = 0.08       # clear space on each side, room for the hover wiggle
TINT = (239, 234, 224)
NAVY = (27, 43, 75)
EXTS = (".png", ".jpg", ".jpeg", ".webp")
NAME_RE = re.compile(r"^([a-z0-9]+(?:-[a-z0-9]+)*?)-(idle(?:-[a-z0-9]+)?|[a-z0-9]+(?:-[a-z0-9]+)*)$")


def parse_name(stem, known_ids):
    """Split 'piggy-bank-idle-b' into ('piggy-bank', 'idle-b') using the known ids first."""
    for mid in sorted(known_ids, key=len, reverse=True):
        if stem.startswith(mid + "-") and len(stem) > len(mid) + 1:
            return mid, stem[len(mid) + 1:]
    m = NAME_RE.match(stem)
    return (m.group(1), m.group(2)) if m else (None, None)


def remove_flat_background(rgb, tolerance):
    """Alpha for an opaque image on a flat background.

    Background = pixels close to the border color that are connected to the image
    edge, so a white eye or highlight inside the character is never cut out. The
    boundary gets a soft ramp and the background color is pulled out of the edge
    pixels, so there is no halo when the mascot sits on a colored blob.
    """
    h, w, _ = rgb.shape
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]]).astype(np.float32)
    bg = np.median(border, axis=0)
    spread = float(np.percentile(np.linalg.norm(border - bg, axis=1), 90))

    dist = np.linalg.norm(rgb.astype(np.float32) - bg, axis=2)
    candidate = dist < tolerance
    labels, _ = ndimage.label(candidate)
    edge_labels = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    edge_labels = edge_labels[edge_labels != 0]
    background = np.isin(labels, edge_labels)

    # Soft edge: inside a 2px band around the background, alpha ramps with color distance.
    near = ndimage.binary_dilation(background, iterations=2) & ~background
    alpha = np.where(background, 0.0, 1.0).astype(np.float32)
    ramp = np.clip((dist - tolerance * 0.5) / (tolerance * 1.5), 0.0, 1.0)
    alpha[near] = np.maximum(ramp[near], 0.0)

    out = rgb.astype(np.float32)
    a = alpha[..., None]
    edge = (a > 0.02) & (a < 0.98)
    unmixed = (out - (1 - a) * bg) / np.maximum(a, 0.02)
    out = np.where(edge, np.clip(unmixed, 0, 255), out)
    return out.astype(np.uint8), (alpha * 255).astype(np.uint8), bg, spread


def load_rgba(path, tolerance, notes):
    im = Image.open(path)
    im.load()
    has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
    if has_alpha:
        rgba = np.array(im.convert("RGBA"))
        if (rgba[..., 3] < 250).mean() > 0.02:
            notes.append("already transparent, background kept as is")
            return rgba
    rgb = np.array(im.convert("RGB"))
    rgb_out, alpha, bg, spread = remove_flat_background(rgb, tolerance)
    if spread > tolerance * 0.6:
        notes.append("WARNING background is not flat (border varies by %.0f); cut it out in an editor first" % spread)
    notes.append("removed background rgb(%d,%d,%d)" % tuple(int(c) for c in bg))
    return np.dstack([rgb_out, alpha])


def character_box(rgba):
    mask = rgba[..., 3] > 24
    ys, xs = np.nonzero(mask)
    if not len(ys):
        return None
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def feet_center_x(rgba, box):
    """Horizontal center of the lowest 12% of the character: a steadier anchor than the
    full box, which shifts when an arm is raised."""
    x0, y0, x1, y1 = box
    band_top = int(y1 - max(2, (y1 - y0) * 0.12))
    xs = np.nonzero(rgba[band_top:y1, x0:x1, 3] > 24)[1]
    return x0 + (xs.mean() if len(xs) else (x1 - x0) / 2)


def place(rgba, box, scale, anchor_x):
    """Crop to the character, scale, and stand it on the ground line of a 2x canvas."""
    x0, y0, x1, y1 = box
    crop = Image.fromarray(np.ascontiguousarray(rgba[y0:y1, x0:x1]))
    nw, nh = max(1, round((x1 - x0) * scale)), max(1, round((y1 - y0) * scale))
    crop = crop.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS_2X, CANVAS_2X), (0, 0, 0, 0))
    left = round(CANVAS_2X / 2 - (anchor_x - x0) * scale)
    top = round(CANVAS_2X * GROUND - nh)
    canvas.alpha_composite(crop, (left, top))
    clipped = left < 0 or left + nw > CANVAS_2X or top < 0
    return canvas, clipped


def order_poses(poses):
    """idle first, then other poses (the first becomes the default hover pose), boil frames last."""
    rest = sorted(p for p in poses if p != "idle" and not p.startswith("idle-"))
    boil = sorted(p for p in poses if p.startswith("idle-"))
    return (["idle"] if "idle" in poses else []) + rest + boil


def preview_sheet(mid, frames, path):
    cell = 300
    sheet = Image.new("RGB", (cell * len(frames), cell + 34), (247, 244, 238))
    draw = ImageDraw.Draw(sheet)
    for i, (pose, img) in enumerate(frames):
        tile = Image.new("RGBA", (cell, cell), TINT + (255,))
        tile.alpha_composite(img.resize((cell, cell), Image.LANCZOS))
        g = round(cell * GROUND)
        ImageDraw.Draw(tile).line([(0, g), (cell, g)], fill=NAVY + (90,), width=1)
        sheet.paste(tile.convert("RGB"), (i * cell, 0))
        draw.text((i * cell + 8, cell + 10), "%s-%s" % (mid, pose), fill=NAVY)
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path)


def write_manifest(path, data):
    lines = ["  %s: %s" % (json.dumps(k), json.dumps(v)) for k, v in data.items()]
    path.write_text("{\n" + ",\n".join(lines) + "\n}\n")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--only", help="process just this mascot id")
    ap.add_argument("--dry-run", action="store_true", help="report and preview, write nothing to final/ or the manifest")
    ap.add_argument("--tolerance", type=float, default=38.0, help="how far from the background color still counts as background (default 38)")
    ap.add_argument("--fit-each", action="store_true", help="scale each pose on its own instead of sharing one scale per mascot (use when raw poses were generated at different sizes)")
    ap.add_argument("--incoming", default=str(ROOT / "assets/mascots/incoming"))
    ap.add_argument("--out", default=str(ROOT / "assets/mascots/final"))
    ap.add_argument("--manifest", default=str(ROOT / "assets/mascots/manifest.json"))
    args = ap.parse_args()

    incoming, out, manifest_path = Path(args.incoming), Path(args.out), Path(args.manifest)
    manifest = json.loads(manifest_path.read_text())

    groups = {}
    for f in sorted(incoming.iterdir()) if incoming.exists() else []:
        if f.suffix.lower() not in EXTS or f.name.startswith("."):
            continue
        mid, pose = parse_name(f.stem.lower(), manifest.keys())
        if not mid:
            print("skip %s: name it {id}-{pose}, e.g. magnifier-idle.png" % f.name)
            continue
        if args.only and mid != args.only:
            continue
        groups.setdefault(mid, {})[pose] = f

    if not groups:
        print("Nothing to do: no raw images found in %s" % incoming)
        return 0

    problems = 0
    for mid, files in groups.items():
        print("\n%s" % mid)
        if mid not in manifest:
            print("  ERROR unknown id (not in manifest.json). Check the spelling or add the id first.")
            problems += 1
            continue
        if "idle" not in files:
            print("  ERROR no idle pose (%s-idle.png). Every raster mascot needs one." % mid)
            problems += 1
            continue

        loaded = {}
        for pose, f in files.items():
            notes = []
            rgba = load_rgba(f, args.tolerance, notes)
            box = character_box(rgba)
            if box is None:
                print("  %-10s ERROR nothing left after background removal" % pose)
                problems += 1
                continue
            h, w = rgba.shape[:2]
            x0, y0, x1, y1 = box
            if x0 <= 1 or y0 <= 1 or x1 >= w - 1 or y1 >= h - 1:
                notes.append("WARNING character touches the image edge, it may be cropped in the source")
            loaded[pose] = (rgba, box, notes)

        if "idle" not in loaded:
            continue

        avail_h = CANVAS_2X * (GROUND - TOP_ROOM)
        avail_w = CANVAS_2X * (1 - 2 * SIDE_ROOM)

        def fit(box):
            x0, y0, x1, y1 = box
            return min(avail_h / (y1 - y0), avail_w / (x1 - x0))

        shared = min(fit(b) for _, b, _ in loaded.values())

        # Raw poses from separate generations often come out at different sizes; a shared
        # scale then keeps those differences. Flag it when the drawn area differs a lot.
        if not args.fit_each:
            areas = {p: int((r[..., 3] > 24).sum()) for p, (r, _, _) in loaded.items()}
            base = areas["idle"]
            for p, a in areas.items():
                if p != "idle" and (a / base > 1.6 or base / a > 1.6):
                    loaded[p][2].append("WARNING drawn %.1fx the size of idle in the source; if the character really is the same size, rerun with --fit-each" % (a / base))
        frames = []
        for pose in order_poses(loaded.keys()):
            rgba, box, notes = loaded[pose]
            scale = fit(box) if args.fit_each else shared
            canvas, clipped = place(rgba, box, scale, feet_center_x(rgba, box))
            if scale > 1.05:
                notes.append("note: enlarged %.2fx, so the @2x file will look soft; upscale in Midjourney before exporting" % scale)
            if clipped:
                notes.append("WARNING pose runs off the canvas; try --fit-each")
            frames.append((pose, canvas))
            print("  %-10s %4dx%-4d -> scale %.2f  %s" % (pose, box[2] - box[0], box[3] - box[1], scale, "; ".join(notes)))
            if any(n.startswith("WARNING") for n in notes):
                problems += 1
            if not args.dry_run:
                out.mkdir(parents=True, exist_ok=True)
                canvas.save(out / ("%s-%s@2x.webp" % (mid, pose)), "WEBP", quality=88, method=6)
                canvas.resize((CANVAS_2X // 2, CANVAS_2X // 2), Image.LANCZOS).save(out / ("%s-%s.webp" % (mid, pose)), "WEBP", quality=88, method=6)

        preview = incoming / "_preview" / ("%s.png" % mid)
        preview_sheet(mid, frames, preview)
        shown = preview.relative_to(ROOT) if preview.is_relative_to(ROOT) else preview
        print("  preview: %s" % shown)

        poses = [p for p, _ in frames]
        if any(p.startswith("idle-") for p in poses):
            print("  boil frames: %s (use data-boil)" % ", ".join(p for p in poses if p.startswith("idle")))
        if not args.dry_run:
            entry = manifest[mid]
            entry["type"] = "raster"
            entry["poses"] = poses
            manifest[mid] = entry

    if not args.dry_run:
        write_manifest(manifest_path, manifest)
        print("\nmanifest updated: %s" % manifest_path)
    print("\n%s" % ("Done with %d warning(s) or error(s) above." % problems if problems else "Done, no problems."))
    print("Check every mascot on /mascot-test/ before committing.")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
