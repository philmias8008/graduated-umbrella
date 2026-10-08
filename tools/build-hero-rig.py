#!/usr/bin/env python3
"""Turn Recraft hero SVGs into rig parts for /mascot-test/run/.

Recraft draws every outline as one ink silhouette path with the fills stacked
on top. This script recolors the art to the Golden hour palette and splits it
into reusable parts (body, eyes, shoes, fists, band), each with its own
outline: a stroked copy of its fills closes the gaps where limbs used to join,
and the silhouette is masked to the part so its thicker shaded edges survive.
Arms and legs are not taken from the art; the rig draws them as bendable
strokes.

Usage:
  python3 tools/build-hero-rig.py runner assets/mascots/incoming/_refs/hero-recraft-a2.svg
  python3 tools/build-hero-rig.py idle assets/mascots/incoming/_refs/hero-idle-recraft.svg

Writes mascot-test/run/{prefix}-parts.svg and {prefix}-original.svg.
The path indices and measurements in DRAWINGS match those two Recraft
drawings; a different drawing needs its own entry here and new anchors in
mascot-test/run/rig.js.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "mascot-test" / "run"

INK = "#1D3F66"
COLORS = {
    "#28335D": INK, "#202E5D": INK,                 # outline, pupils, mouth
    "#FBFBFA": "#FFFFFF", "WHITE": "#FFFFFF",       # glove, eye whites, soles, the "1"
    "#B6BBD1": "#A9BACD", "#B8C0D8": "#A9BACD",     # blue-grey shade
    "#E28F5C": "#E3A23B", "#E18B58": "#E3A23B",     # band and shoes: golden
    "#FBBF73": "#F0C46E", "#FAB76F": "#F0C46E",     # band stripe, toe caps: light golden
    "#BB7B68": "#B57A1E", "#B27A78": "#B57A1E", "#C98456": "#B57A1E",  # shade side: darker golden
}

OUTLINE = 8          # outline width outside the fills, 1024 space
BODY_REACH = 50      # how far the body's thick shaded edge reaches past its fills
EYE_LINE = 8

# Per drawing: path indices into the source's <path> list (1 is the ink silhouette),
# eyes measured from a render (outline centred on rx/ry; listed back to front), and
# the area the body silhouette may use, so old limb outlines never show.
DRAWINGS = {
    "runner": {
        "prefix": "hero", "id": "hr", "glove": 2,
        "body_outline": [2, 8, 17], "body_fills": [2, 3, 4, 5, 6, 8, 9, 10, 17], "mouth": [7],
        "eyes": [("r", 640, 352, 59, 77, 659, 341, 47.3), ("l", 532, 362, 71, 81, 557, 359, 48.3)],
        "body_clip": "M100 60H950V512H698V568H720V690H670V652H410V690H330V615H358V545H100Z",
        "parts": {"shoe": [16, 21, 14], "fist": [23, 25, 26, 27]},
    },
    "idle": {
        "prefix": "hero-idle", "id": "hi", "glove": 2,
        "body_outline": [2, 9, 22], "body_fills": [2, 3, 4, 5, 6, 7, 9, 10, 11, 22], "mouth": [8],
        "eyes": [("r", 640, 364, 68, 74, 667, 357, 45.1), ("l", 549, 381, 65, 77, 571, 376, 45.8)],
        # whole canvas minus holes (even-odd): left fist and arm, right fist and arm root, legs and shoes
        "body_clip": ("M0 0H1024V1024H0Z "
                      "M130 330L170 298L262 298L322 330L336 420L285 460L425 575L430 628L392 628L240 497L168 482L128 432Z "
                      "M738 268L936 268L936 476L822 476L712 580L712 512L758 470L738 470Z "
                      "M410 686L650 686L650 740L800 740L800 1000L350 1000L350 740L410 740Z"),
        # white shapes that are really background showing through (between the legs, inside
        # the left arm's bend): cut out of the silhouette so the page shows through instead
        "background": [16, 21],
        # the band is drawn again over the left arm so the arm tucks under it
        "parts": {"shoe-l": [12, 13, 24], "shoe-r": [14, 15, 28],
                  "fist-l": [19, 25, 30, 36, 35], "fist-r": [18, 26, 31, 33, 34], "band": [9, 10, 11, 22]},
        "tight": ["band"],
    },
}


def load(src):
    s = Path(src).read_text()
    s = re.sub(r"<metadata>.*?</metadata>", "", s, flags=re.S)
    paths = []
    for tag in re.findall(r"<path[^>]*/?>", s):
        d = re.search(r'\bd="([^"]*)"', tag).group(1)
        fill = re.search(r'fill="([^"]*)"', tag).group(1).upper()
        tr = re.search(r'transform="([^"]*)"', tag)
        paths.append({"d": d, "fill": COLORS.get(fill, fill), "tr": tr.group(1) if tr else ""})
    return paths


def scale_of(tr):
    m = re.match(r"scale\(([\d.]+)", tr or "")
    return float(m.group(1)) if m else 1.0


def path(p, **attrs):
    a = {"transform": p["tr"], "d": p["d"], "fill": p["fill"], **attrs}
    return "<path " + " ".join(f'{k.replace("_", "-")}="{v}"' for k, v in a.items() if v != "") + "/>"


def stroked(p, color, width_1024):
    w = width_1024 / scale_of(p["tr"])
    return path(p, fill=color, stroke=color, stroke_width=f"{w:g}", stroke_linejoin="round")


def masked_silhouette(sil, mask_id):
    # the mask goes on an untransformed group: on the path it would inherit the path's scale
    return f'<g mask="url(#{mask_id})">{path(sil)}</g>'


def build(kind, src):
    D = DRAWINGS[kind]
    k = D["id"]
    P = load(src)
    sil = P[1]
    defs, parts = [], []

    defs.append(f'<clipPath id="{k}-c-body"><path clip-rule="evenodd" d="{D["body_clip"]}"/></clipPath>')
    defs.append(f'<mask id="{k}-m-body" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">'
                f'<g clip-path="url(#{k}-c-body)">'
                + "".join(stroked(P[i], "#fff", BODY_REACH * 2) for i in D["body_outline"]) + "</g>"
                + "".join(path(P[i], fill="#000") for i in D.get("background", [])) + "</mask>")
    defs.append(f'<clipPath id="{k}-c-glove">{path(P[D["glove"]])}</clipPath>')

    body = [f'<g id="{k}-body">']
    body += [stroked(P[i], INK, OUTLINE * 2) for i in D["body_outline"]]
    body.append(masked_silhouette(sil, f"{k}-m-body"))
    body += [path(P[i]) for i in D["body_fills"] + D["mouth"]]
    # white patch over Recraft's own eyes, kept inside the glove, so a blink never reveals them
    body.append(f'<g clip-path="url(#{k}-c-glove)">' + "".join(
        f'<ellipse cx="{cx}" cy="{cy}" rx="{rx + EYE_LINE}" ry="{ry + EYE_LINE}" fill="#FFFFFF"/>'
        for _, cx, cy, rx, ry, *_ in D["eyes"]) + "</g>")
    body.append("</g>")
    parts.append("".join(body))

    for eid, cx, cy, rx, ry, px, py, pr in D["eyes"]:
        defs.append(f'<clipPath id="{k}-c-eye-{eid}"><ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}"/></clipPath>')
        parts.append(f'<ellipse id="{k}-eye-{eid}-white" cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="#FFFFFF"/>')
        parts.append(f'<circle id="{k}-pupil-{eid}" cx="{px}" cy="{py}" r="{pr}" fill="{INK}"/>')
        parts.append(f'<ellipse id="{k}-eye-{eid}-line" cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="none" '
                     f'stroke="{INK}" stroke-width="{EYE_LINE}"/>')

    for name, ids in D["parts"].items():
        reach = OUTLINE if name in D.get("tight", []) else OUTLINE + 4
        defs.append(f'<mask id="{k}-m-{name}" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">'
                    + "".join(stroked(P[i], "#fff", reach * 2) for i in ids) + "</mask>")
        g = [f'<g id="{k}-{name}">']
        g += [stroked(P[i], INK, OUTLINE * 2) for i in ids]
        g.append(masked_silhouette(sil, f"{k}-m-{name}"))
        g += [path(P[i]) for i in ids]
        g.append("</g>")
        parts.append("".join(g))

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f'{D["prefix"]}-parts.svg').write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" aria-hidden="true">'
        "<defs>" + "".join(defs) + "".join(parts) + "</defs></svg>\n")

    # the untouched drawing, recolored, for side by side comparison
    (OUT / f'{D["prefix"]}-original.svg').write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="60 40 900 920">'
        + "".join(path(p) for p in P[1:]) + "</svg>\n")
    print("wrote", OUT / f'{D["prefix"]}-parts.svg', "and", OUT / f'{D["prefix"]}-original.svg')


if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] not in DRAWINGS:
        sys.exit(__doc__)
    build(sys.argv[1], sys.argv[2])
