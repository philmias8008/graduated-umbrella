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
  python3 tools/build-hero-rig.py bolts assets/mascots/incoming/_refs/bolts-recraft.svg
  python3 tools/build-hero-rig.py float assets/mascots/incoming/_refs/hero-float-recraft.svg
  python3 tools/build-hero-rig.py jolt assets/mascots/incoming/_refs
    (the folder holding jolt-stars-recraft.svg)

Writes assets/mascots/hero/{prefix}-parts.svg (used by assets/js/hs-hero-rig.js) and
mascot-test/run/{prefix}-original.svg (the recolored drawing, for comparison).
The path indices and measurements in DRAWINGS match those two Recraft
drawings; a different drawing needs its own entry here and new anchors in
assets/js/hs-hero-rig.js.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "mascots" / "hero"
PREVIEW = ROOT / "mascot-test" / "run"

INK = "#1D3F66"
COLORS = {
    "#28335D": INK, "#202E5D": INK,                 # outline, pupils, mouth
    "#FBFBFA": "#FFFFFF", "WHITE": "#FFFFFF",       # glove, eye whites, soles, the "1"
    "#B6BBD1": "#A9BACD", "#B8C0D8": "#A9BACD",     # blue-grey shade
    "#E28F5C": "#E3A23B", "#E18B58": "#E3A23B",     # band and shoes: golden
    "#FBBF73": "#F0C46E", "#FAB76F": "#F0C46E",     # band stripe, toe caps: light golden
    "#BB7B68": "#B57A1E", "#B27A78": "#B57A1E", "#C98456": "#B57A1E",  # shade side: darker golden
    "#1F3E62": INK, "#A9B7C9": "#A9BACD", "#E09D3E": "#E3A23B", "#EAB96A": "#F0C46E", "#B97724": "#B57A1E",  # jump drawing (patches the idle's glove)
    "#1A3E63": INK, "#A2B4C7": "#A9BACD", "#E49539": "#E3A23B", "#F0BC70": "#F0C46E", "#C07A29": "#B57A1E",  # float
    "#354B69": INK, "#E3EEF6": "#FFFFFF",
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
        "ink": [10],     # the "1" on the band
    },
    "idle": {
        "prefix": "hero-idle", "id": "hi", "glove": 2,
        "body_outline": [2, 9, 22], "body_fills": [2, 3, 4, 5, 6, 7, 9, 10, 22], "mouth": [8],
        # the left fist overlaps the glove in this drawing, so the glove was never drawn under it;
        # the hop drawing has the same glove complete there (its fist sits lower). Both gloves are
        # layered, outlines first, so the union is whole with a clean outline.
        "patch": {"src": "assets/mascots/incoming/_refs/hero-hop-recraft.svg", "outline": [2], "fills": [2, 3, 4]},
        "eyes": [("r", 640, 364, 68, 74, 667, 357, 45.1), ("l", 549, 381, 65, 77, 571, 376, 45.8)],
        # whole canvas minus holes (even-odd): left fist and arm, right fist and arm root, legs and shoes
        "body_clip": ("M0 0H1024V1024H0Z "
                      "M130 330L170 298L262 298L322 330L336 420L285 460L425 575L430 628L418 628L418 700L360 700L360 628L392 628L240 497L168 482L128 432Z "
                      "M738 268L936 268L936 476L822 476L712 580L712 512L758 470L738 470Z "
                      "M410 686L650 686L650 740L800 740L800 1000L350 1000L350 740L410 740Z"),
        # the left arm hole above also takes Recraft's thick shadow off the glove's left edge (second
        # finger, hip); it is redrawn as an ink copy of the glove, nudged left and down, behind the fills.
        # It covers the whole left edge from the first finger down through the band (the band's fills
        # are copied too, "with"), so it runs unbroken behind the arm. The hole's notch at the band
        # (418 628 to 360 700) drops Recraft's own dark nub there.
        "shadow": {"clip": "M100 170H440V720H100Z", "offset": (-15, 7), "with": [9, 10, 22], "with_offset": (-15, 0)},
        # 2026-10-19: under the lowest finger, the drawing's dark left edge ends in a knob and the palm's
        # edge starts a few units further out, so the edge hooks and its pale shade stripe steps (Aidan
        # spotted it on the thank-you hero). Redrawn smooth from x 258 to 306: the dark edge between the
        # shade line ("bd") and the outer edge, the shade stripe between the white line ("wb") and "bd",
        # and a little white above "wb"; "trim" cuts the knob off outside the new edge. The points are the
        # clean edges measured either side of the seam (1024 space).
        # 2026-10-19: where the right arm used to join, the arm hole leaves the glove's right edge squared
        # off out to x 712 just above the band (the arm covers it in the landing; the thank-you hero's arms
        # don't). Everything right of the natural edge (about 708.6) is cut away there.
        "trim": ["M708.8 520H760V577H708.8Z"],
        "smooth": [
            {"fill": INK, "x": (262, 306), "trim": (262, 286), "top": [(250, 385.2), (254, 396.8), (258, 404.0), (262, 409.8), (266, 414.6), (272, 421.2), (278, 427.0), (284, 432.0), (290, 436.3), (296, 441.0), (302, 444.4), (306, 445.6), (310, 446.9), (314, 448.2)],
             "bottom": [(246, 428.1), (250, 432.2), (254, 436.1), (258, 439.6), (262, 442.9), (270, 449.9), (278, 455.6), (286, 459.5), (290, 460.8), (294, 462.0), (298, 463.5), (302, 465.1), (306, 466.8), (310, 468.5)]},
            {"fill": "#A9BACD", "x": (282, 308), "top": [(274, 390.0), (278, 397.0), (282, 402.6), (286, 407.5), (291, 413.8), (296, 419.6), (301, 424.8), (306, 428.6), (310, 430.4), (314, 431.6), (318, 433.1)], "bottom": [(250, 385.2), (254, 396.8), (258, 404.0), (262, 409.8), (266, 414.6), (272, 421.2), (278, 427.0), (284, 432.0), (290, 436.3), (296, 441.0), (302, 444.4), (306, 445.6), (310, 446.9), (314, 448.2)]},
            {"fill": "#FFFFFF", "x": (288, 308), "top_offset": -12, "top": [(274, 390.0), (278, 397.0), (282, 402.6), (286, 407.5), (291, 413.8), (296, 419.6), (301, 424.8), (306, 428.6), (310, 430.4), (314, 431.6), (318, 433.1)], "bottom": [(274, 390.0), (278, 397.0), (282, 402.6), (286, 407.5), (291, 413.8), (296, 419.6), (301, 424.8), (306, 428.6), (310, 430.4), (314, 431.6), (318, 433.1)]},
        ],
        # white shapes that are really background showing through (between the legs, inside
        # the left arm's bend): cut out of the silhouette so the page shows through instead
        "background": [16, 21],
        # the band is drawn again over the left arm so the arm tucks under it
        "parts": {"shoe-l": [12, 13, 24], "shoe-r": [14, 15, 28],
                  "fist-l": [19, 25, 30, 36, 35], "fist-r": [18, 26, 31, 33, 34], "band": [9, 10, 22]},
        # the "1" is its own piece so a mirrored hero can flip it back to read the right way
        "number": [11],
        "tight": ["band"],
        "ink": [11],     # the "1" on the band
    },
    # the celebration after the run: floating, arms and legs hanging loose. The limbs are short
    # and drawn with the hands, so they stay as drawn pieces (arm with hand, both legs with shoes)
    # that the rig sways, rather than rig strokes.
    "float": {
        "prefix": "hero-float", "id": "hf", "glove": 2,
        "body_outline": [2, 8, 20], "body_fills": [2, 3, 4, 5, 6, 8, 9, 20], "mouth": [7],
        "number": [10],
        "eyes": [("r", 640, 294, 58, 70, 658, 287, 44.0), ("l", 542, 312, 63, 72, 562, 304, 45.5)],
        # holes (even-odd) for the left arm, the right arm and the legs, so their outlines stay with them
        "body_clip": ("M0 0H1024V1024H0Z "
                      "M295 462H430V745H295Z "
                      "M655 462H760V700H655Z "
                      "M430 628H655V700H730V990H340V745H430Z"),
        # the left arm hole cuts Recraft's thick shadow off the glove's left edge too: redrawn as in the idle
        "shadow": {"clip": "M150 300H440V720H150Z", "offset": (-15, 7), "with": [8, 9, 20], "with_offset": (-15, 0)},
        # the white between the legs is background showing through: left out of the legs and cut
        # out of their silhouette, so the sky shows there
        "cut": {"legs": [22]},
        "parts": {"arm-l": [27, 15, 16, 29, 34], "arm-r": [31, 32, 18, 19, 30, 33, 35, 36, 37],
                  "legs": [25, 24, 11, 12, 23, 13, 14, 28, 26]},
    },
    # the electricity sheet: three of the six bolts and three crackle marks, recolored as they
    # are (each piece carries its own outline). Golden fill, light golden highlight.
    "bolts": {
        "prefix": "hero-bolts", "id": "hb",
        "colors": {"#2D2D56": INK, "#2B2B50": INK, "#B9B9C8": INK, "#FCD682": "#E3A23B", "#F7F6F4": "#F0C46E"},
        "raw": {"bolt-1": [24, 25, 26, 27, 28], "bolt-2": [14, 15, 16, 17, 18], "bolt-3": [10, 11, 12, 13],
                "mark-1": [35, 37, 39], "mark-2": [36, 38, 40], "mark-3": [32, 41]},
    },
    # the comic impact jolt: the Recraft impact stars (built from a list of sheets, so more can join).
    # The stars' inner star goes light golden so it reads at a glance; Recraft's speckles are left out.
    "jolt": {
        "prefix": "hero-jolt", "id": "hj",
        "sheets": {
            "stars": {"src": "jolt-stars-recraft.svg",
                      "colors": {"#0D3863": INK, "#EAA64B": "#E3A23B"},
                      "light": [4, 9, 14, 17],
                      "raw": {"star-1": [1, 2, 3, 4], "star-2": [6, 7, 8, 9], "star-3": [11, 12, 13, 14],
                              "star-4": [15, 16, 17]}},
        },
    },
}


def load(src, extra=None):
    colors = dict(COLORS, **(extra or {}))
    s = Path(src).read_text()
    s = re.sub(r"<metadata>.*?</metadata>", "", s, flags=re.S)
    paths = []
    for tag in re.findall(r"<path[^>]*/?>", s):
        d = re.search(r'\bd="([^"]*)"', tag).group(1)
        fill = re.search(r'fill="([^"]*)"', tag).group(1).upper()
        tr = re.search(r'transform="([^"]*)"', tag)
        paths.append({"d": d, "fill": colors.get(fill, fill), "tr": tr.group(1) if tr else ""})
    return paths


def scale_of(tr):
    m = re.match(r"scale\(([\d.]+)", tr or "")
    return float(m.group(1)) if m else 1.0


def path(p, **attrs):
    a = {"transform": p["tr"], "d": p["d"], "fill": p["fill"], **attrs}
    return "<path " + " ".join(f'{k.replace("_", "-")}="{v}"' for k, v in a.items() if v != "") + "/>"


def catmull_rom(pts, x):
    """A smooth curve through (x, y) points, read at x."""
    P = sorted(pts)
    X = [p[0] for p in P]
    i = max(1, min(len(P) - 3, sum(1 for v in X if v <= x) - 1))
    (x0, y0), (x1, y1), (x2, y2), (x3, y3) = P[i - 1], P[i], P[i + 1], P[i + 2]
    t = (x - x1) / (x2 - x1)
    m1 = (y2 - y0) / (x2 - x0) * (x2 - x1)
    m2 = (y3 - y1) / (x3 - x1) * (x2 - x1)
    return ((2 * t ** 3 - 3 * t ** 2 + 1) * y1 + (t ** 3 - 2 * t ** 2 + t) * m1
            + (-2 * t ** 3 + 3 * t ** 2) * y2 + (t ** 3 - t ** 2) * m2)


def band_patch(top, bottom, x0, x1, fill, top_offset=0, n=40):
    """A filled strip between two smooth curves from x0 to x1 (1024 space, no transform)."""
    xs = [x0 + (x1 - x0) * k / (n - 1) for k in range(n)]
    up = " ".join(f"{x:.2f} {catmull_rom(top, x) + top_offset:.2f}" for x in xs)
    down = " ".join(f"{x:.2f} {catmull_rom(bottom, x):.2f}" for x in reversed(xs))
    return f'<path d="M{up} L{down}Z" fill="{fill}"/>'


def stroked(p, color, width_1024):
    w = width_1024 / scale_of(p["tr"])
    return path(p, fill=color, stroke=color, stroke_width=f"{w:g}", stroke_linejoin="round")


def masked_silhouette(sil, mask_id):
    # the mask goes on an untransformed group: on the path it would inherit the path's scale
    return f'<g mask="url(#{mask_id})">{path(sil)}</g>'


def points(p):
    k = scale_of(p["tr"])
    nums = [float(n) * k for n in re.findall(r"-?\d*\.?\d+", p["d"])]
    return list(zip(nums[0::2], nums[1::2]))


def build_sheets(kind, src_dir):
    """Several Recraft sheets into one parts file of plain recolored pieces."""
    D = DRAWINGS[kind]
    parts = []
    for sheet in D["sheets"].values():
        P = load(Path(src_dir) / sheet["src"], sheet["colors"])
        for i in sheet.get("light", []):
            P[i]["fill"] = "#F0C46E"
        for name, ids in sheet["raw"].items():
            pts = [pt for i in ids for pt in points(P[i])]
            xs, ys = [x for x, _ in pts], [y for _, y in pts]
            cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
            attrs = (f'data-cx="{cx:.1f}" data-cy="{cy:.1f}" data-w="{max(xs) - min(xs):.1f}" '
                     f'data-h="{max(ys) - min(ys):.1f}"')
            parts.append(f'<g id="{D["id"]}-{name}" {attrs}>' + "".join(path(P[i]) for i in ids) + "</g>")
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f'{D["prefix"]}-parts.svg').write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" aria-hidden="true">'
        "<defs>" + "".join(parts) + "</defs></svg>\n")
    print("wrote", OUT / f'{D["prefix"]}-parts.svg')


def build(kind, src):
    D = DRAWINGS[kind]
    if "sheets" in D:
        return build_sheets(kind, src)
    k = D["id"]
    P = load(src, D.get("colors"))
    for i in D.get("ink", []):
        P[i]["fill"] = INK
    sil = P[1]
    defs, parts = [], []

    if "body_outline" in D:
        build_body(D, P, sil, defs, parts)
    if "parts" in D:
        build_parts(D, P, sil, defs, parts)
    if "number" in D:
        xs, ys = [], []
        for i in D["number"]:
            k = scale_of(P[i]["tr"])
            nums = [float(n) * k for n in re.findall(r"-?\d*\.?\d+", P[i]["d"])]
            xs += nums[0::2]
        parts.append(f'<g id="{D["id"]}-number" data-cx="{(min(xs) + max(xs)) / 2:.1f}">'
                     + "".join(path(P[i]) for i in D["number"]) + "</g>")
    for name, ids in D.get("raw", {}).items():
        # plain recolored pieces; data-c* give the piece's centre and height in the drawing's own space
        xs, ys = [], []
        for i in ids:
            k = scale_of(P[i]["tr"])
            nums = [float(n) * k for n in re.findall(r"-?\d*\.?\d+", P[i]["d"])]
            xs += nums[0::2]; ys += nums[1::2]
        cx, cy, h = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, max(ys) - min(ys)
        # single-color marks take currentColor, so the page can tint them
        tint = name.startswith("mark")
        parts.append(f'<g id="{D["id"]}-{name}" data-cx="{cx:.1f}" data-cy="{cy:.1f}" data-h="{h:.1f}">'
                     + "".join(path(P[i], fill="currentColor") if tint else path(P[i]) for i in ids) + "</g>")
    write(D, P, defs, parts)


def build_body(D, P, sil, defs, parts):
    k = D["id"]
    defs.append(f'<clipPath id="{k}-c-body"><path clip-rule="evenodd" d="{D["body_clip"]}"/></clipPath>')
    defs.append(f'<mask id="{k}-m-body" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">'
                f'<g clip-path="url(#{k}-c-body)">'
                + "".join(stroked(P[i], "#fff", BODY_REACH * 2) for i in D["body_outline"]) + "</g>"
                + "".join(path(P[i], fill="#000") for i in D.get("background", [])) + "</mask>")
    defs.append(f'<clipPath id="{k}-c-glove">{path(P[D["glove"]])}</clipPath>')

    patch = D.get("patch")
    Q = load(ROOT / patch["src"]) if patch else []
    body = [f'<g id="{k}-body">']
    # "trim": cut away anything outside a smoothed edge (a knob in the drawing poking past it)
    trims = [sm for sm in D.get("smooth", []) if "trim" in sm]
    if trims or D.get("trim"):
        cut = "".join(D.get("trim", []))
        for sm in trims:
            a, b = sm["trim"]
            xs = [a + (b - a) * j / 39 for j in range(40)]
            edge = " ".join(f"{x:.2f} {catmull_rom(sm['bottom'], x):.2f}" for x in xs)
            cut += f"M{edge} L{b:.2f} {catmull_rom(sm['bottom'], b) + 40:.2f} L{a:.2f} {catmull_rom(sm['bottom'], a) + 40:.2f}Z"
        defs.append(f'<clipPath id="{k}-c-trim"><path clip-rule="evenodd" d="M-200 -200H1224V1224H-200Z {cut}"/></clipPath>')
        body.append(f'<g clip-path="url(#{k}-c-trim)">')
    shadow = D.get("shadow")
    if shadow:
        defs.append(f'<clipPath id="{k}-c-shadow"><path d="{shadow["clip"]}"/></clipPath>')
        dx, dy = shadow["offset"]
        gloves = [P[D["glove"]]] + [Q[i] for i in (patch["fills"][:1] if patch else [])]
        # the band's copy only moves sideways, so it never hangs below the band onto the leg
        bx, by = shadow.get("with_offset", (dx, dy))
        body.append(f'<g clip-path="url(#{k}-c-shadow)"><g transform="translate({dx} {dy})">'
                    + "".join(stroked(g, INK, OUTLINE * 2) for g in gloves) + "</g>"
                    + f'<g transform="translate({bx} {by})">'
                    + "".join(stroked(P[i], INK, OUTLINE * 2) for i in shadow.get("with", [])) + "</g></g>")
    body += [stroked(P[i], INK, OUTLINE * 2) for i in D["body_outline"]]
    body += [stroked(Q[i], INK, OUTLINE * 2) for i in (patch["outline"] if patch else [])]
    body.append(masked_silhouette(sil, f"{k}-m-body"))
    body += [path(Q[i]) for i in (patch["fills"] if patch else [])]
    body += [path(P[i]) for i in D["body_fills"] + D["mouth"]]
    # smooth over a seam in the drawing: strips that redraw its dark edge, shade stripe and white
    # along curves fitted to the clean edges either side (see "smooth" in the drawing's settings)
    for sm in D.get("smooth", []):
        body.append(band_patch(sm["top"], sm["bottom"], sm["x"][0], sm["x"][1], sm["fill"], sm.get("top_offset", 0)))
    # white patch over Recraft's own eyes, kept inside the glove, so a blink never reveals them
    body.append(f'<g clip-path="url(#{k}-c-glove)">' + "".join(
        f'<ellipse cx="{cx}" cy="{cy}" rx="{rx + EYE_LINE}" ry="{ry + EYE_LINE}" fill="#FFFFFF"/>'
        for _, cx, cy, rx, ry, *_ in D["eyes"]) + "</g>")
    if trims or D.get("trim"):
        body.append("</g>")
    body.append("</g>")
    parts.append("".join(body))

    for eid, cx, cy, rx, ry, px, py, pr in D["eyes"]:
        defs.append(f'<clipPath id="{k}-c-eye-{eid}"><ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}"/></clipPath>')
        parts.append(f'<ellipse id="{k}-eye-{eid}-white" cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="#FFFFFF"/>')
        parts.append(f'<circle id="{k}-pupil-{eid}" cx="{px}" cy="{py}" r="{pr}" fill="{INK}"/>')
        parts.append(f'<ellipse id="{k}-eye-{eid}-line" cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="none" '
                     f'stroke="{INK}" stroke-width="{EYE_LINE}"/>')



def build_parts(D, P, sil, defs, parts):
    k = D["id"]
    for name, ids in D["parts"].items():
        reach = OUTLINE if name in D.get("tight", []) else OUTLINE + 4
        defs.append(f'<mask id="{k}-m-{name}" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">'
                    + "".join(stroked(P[i], "#fff", reach * 2) for i in ids)
                    + "".join(path(P[i], fill="#000") for i in D.get("cut", {}).get(name, [])) + "</mask>")
        g = [f'<g id="{k}-{name}">']
        g += [stroked(P[i], INK, OUTLINE * 2) for i in ids]
        g.append(masked_silhouette(sil, f"{k}-m-{name}"))
        g += [path(P[i]) for i in ids]
        g.append("</g>")
        parts.append("".join(g))


def write(D, P, defs, parts):
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f'{D["prefix"]}-parts.svg').write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" aria-hidden="true">'
        "<defs>" + "".join(defs) + "".join(parts) + "</defs></svg>\n")

    # the untouched drawing, recolored, for side by side comparison
    (PREVIEW / f'{D["prefix"]}-original.svg').write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="60 40 900 920">'
        + "".join(path(p) for p in P[1:]) + "</svg>\n")
    print("wrote", OUT / f'{D["prefix"]}-parts.svg', "and", PREVIEW / f'{D["prefix"]}-original.svg')


if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] not in DRAWINGS:
        sys.exit(__doc__)
    build(sys.argv[1], sys.argv[2])
