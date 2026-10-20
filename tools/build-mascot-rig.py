#!/usr/bin/env python3
"""Build parts files for the rigged mascots (docs/mascot-rig-spec.md).

Recraft draws each object with no face and no limbs: one ink silhouette path for
every outline, fill paths on top. This script recolors and splits the object into
named parts, and builds the shared kit (the hero's shoe and fist, the cleaned hands).
The player, assets/js/hs-mascot-rig.js, adds eyes, mouth and rubber-hose limbs.

Usage:
  python3 tools/build-mascot-rig.py kit
  python3 tools/build-mascot-rig.py magnifier
  python3 tools/build-mascot-rig.py lightbulb
  python3 tools/build-mascot-rig.py megaphone
  python3 tools/build-mascot-rig.py computer
  python3 tools/build-mascot-rig.py speech-bubble
  python3 tools/build-mascot-rig.py finish-flag
  python3 tools/build-mascot-rig.py {compass|clipboard|stopwatch|block|power-button|duo}

Sources live in the local-only assets/mascots/incoming/_refs/. Output goes to
assets/mascots/rig/{id}-parts.svg. Path indices in OBJECTS match the chosen Recraft
drawing; a new drawing needs a new entry.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REFS = ROOT / "assets" / "mascots" / "incoming" / "_refs"
OUT = ROOT / "assets" / "mascots" / "rig"

INK = "#1D3F66"
WHITE = "#FFFFFF"
SHADE = "#A9BACD"
GLASS = "#C2CDD9"
GOLD = "#E3A23B"
GOLD_DK = "#B57A1E"

OUTLINE = 44  # stroke width that rebuilds an outline from a part's own fills, source units
HAND_OUTLINE = 76  # the kit hands' outline, hands-sheet units (they are drawn at about 0.46)


def paths_of(svg_text):
    svg_text = re.sub(r"<metadata>.*?</metadata>", "", svg_text, flags=re.S)
    out = {}
    for i, tag in enumerate(re.findall(r"<path[^>]*>", svg_text), 1):
        out[i] = re.search(r' d="([^"]+)"', tag).group(1)
    return out


def element(text, tag, ident):
    """The full element with this id, nested tags of the same name included."""
    start = text.index(f'<{tag} id="{ident}"')
    depth, i = 0, start
    pat = re.compile(rf"<{tag}\b|</{tag}>")
    for m in pat.finditer(text, start):
        depth += 1 if m.group(0).startswith(f"<{tag}") else -1
        if depth == 0:
            return text[start:m.end()]
    raise ValueError(ident)


def bbox(d):
    nums = [float(x) for x in re.findall(r"-?\d+\.?\d*", d)]
    xs, ys = nums[0::2], nums[1::2]
    return min(xs), min(ys), max(xs), max(ys)


# Hands: cleaned sheet pieces (see docs/mascot-prompts.md, "Rig kit: hands sheet").
# silhouette index, fill indices, cuff stripe index, in hands-recraft.svg (2688 x 1536 space).
# The cuffs are left out, but the stripe marks the middle of the wrist: the arm's pivot.
HANDS = {
    "open": (2, [3, 4, 5, 6, 7], 9),
    "point": (18, [19, 20, 21], 23),
    "thumb": (24, [25, 26, 27], 29),
    "wave": (10, [11, 12, 13, 14, 15], 17),
}


def build_kit():
    hero = (ROOT / "assets" / "mascots" / "hero" / "hero-parts.svg").read_text()
    defs, parts = [], []
    for name in ("shoe", "fist"):
        defs.append(element(hero, "mask", f"hr-m-{name}").replace("hr-", "mk-"))
        parts.append(element(hero, "g", f"hr-{name}").replace("hr-", "mk-"))

    src = (REFS / "hands-recraft.svg").read_text()
    P = paths_of(src)
    fills = dict((i, c.replace("white", WHITE)) for i, c in
                 enumerate(re.findall(r'<path[^>]*fill="([^"]+)"', re.sub(r"<metadata>.*?</metadata>", "", src, flags=re.S)), 1))
    for name, (sil, fs, stripe) in HANDS.items():
        whites = [i for i in fs if fills[i] == WHITE]
        mid = f"mk-m-hand-{name}"
        defs.append(f'<mask id="{mid}" maskUnits="userSpaceOnUse" x="0" y="0" width="2688" height="1536">'
                    '<rect width="2688" height="1536" fill="black"/>'
                    + "".join(f'<path d="{P[i]}" fill="white" stroke="white" stroke-width="{OUTLINE}" stroke-linejoin="round"/>' for i in whites)
                    + "</mask>")
        x0, y0, x1, y1 = bbox(P[stripe])
        # hands are drawn at about half size, so their outline is rebuilt heavier to match the arms
        parts.append(f'<g id="mk-hand-{name}" data-wx="{(x0 + x1) / 2:.0f}" data-wy="{(y0 + y1) / 2:.0f}">'
                     + "".join(f'<path d="{P[i]}" fill="{INK}" stroke="{INK}" stroke-width="{HAND_OUTLINE}" stroke-linejoin="round"/>' for i in whites)
                     + f'<path d="{P[sil]}" fill="{INK}" mask="url(#{mid})"/>'
                     + "".join(f'<path d="{P[i]}" fill="{fills[i]}"/>' for i in fs) + "</g>")
    # the thumbs-up: the hero-round drawing (thumbs-recraft-2.svg, 2048 space), upright with its
    # wrist at the bottom so a rubber-hose arm can run straight up into it. Recoloured from the
    # pre-palette ink and shade. data-k scales it to sit with the other hands.
    T = paths_of((REFS / "thumbs-recraft-2.svg").read_text())
    k = 0.54
    parts.append(f'<g id="mk-hand-thumbup" data-wx="1150" data-wy="1975" data-k="{k}">'
                 + "".join(f'<path d="{T[i]}" fill="{INK}" stroke="{INK}" stroke-width="{HAND_OUTLINE / k:.0f}" stroke-linejoin="round"/>' for i in (3, 6, 7, 9, 10))
                 + f'<path d="{T[2]}" fill="{INK}"/>'
                 + "".join(f'<path d="{T[i]}" fill="{c}"/>' for i, c in ((3, WHITE), (4, SHADE), (5, SHADE), (6, WHITE), (7, WHITE), (8, SHADE), (9, WHITE), (10, WHITE)))
                 + "</g>")
    # the same thumbs-up without its shade, to sit with the hero's own unshaded fists (hero-thumbs).
    # Its arms join the wrist on the hand's outer side, so the stub at the bottom (path 10) is cut
    # off: the hand is clipped along a curve from the bottom finger to the palm's edge, and a new
    # outline is drawn along that curve so the fist's bottom is round and clean.
    cut = "M900 1872Q1190 1880 1418 1786"
    defs.append('<clipPath id="mk-c-thumbflat"><path d="M0 0H2048V2048H1418V1786Q1190 1880 900 1872V2048H0Z"/></clipPath>')
    parts.append(f'<g id="mk-hand-thumbflat" data-wx="1150" data-wy="1975" data-k="{k}">'
                 + '<g clip-path="url(#mk-c-thumbflat)">'
                 + "".join(f'<path d="{T[i]}" fill="{INK}" stroke="{INK}" stroke-width="{HAND_OUTLINE / k:.0f}" stroke-linejoin="round"/>' for i in (3, 6, 7, 9))
                 + f'<path d="{T[2]}" fill="{INK}"/>'
                 + "".join(f'<path d="{T[i]}" fill="{WHITE}"/>' for i in range(3, 10)) + "</g>"
                 + f'<path d="{cut}" fill="none" stroke="{INK}" stroke-width="66" stroke-linecap="round"/>'
                 + "</g>")
    # the typing hand (typing-hand-recraft.svg, 2048 space): seen from above, palm down, fingers
    # up the image. Cut into a palm (with the thumb) and three fingers along the creases, so each
    # finger can squash toward its knuckle on its own. Fingers reach under the palm, which is
    # drawn over them, so no gap opens. data-px/py is each finger's knuckle.
    H = paths_of((REFS / "typing-hand-recraft.svg").read_text())
    k = 0.46
    cuts = {
        "f1": ("M560 300H950V520L1030 1015L845 1110L845 1180H560Z", (930, 1070)),
        "f2": ("M950 300H1195V1080H1030V1015L950 520Z", (1112, 1015)),
        "f3": ("M1195 300H1520V1140H1195Z", (1262, 1045)),
        "palm": ("M300 1110H845L1030 1015H1195L1330 1075H1520V1700H300Z", None),
    }
    body = (f'<path d="{H[3]}" fill="{INK}" stroke="{INK}" stroke-width="{HAND_OUTLINE / k:.0f}" stroke-linejoin="round"/>'
            f'<path d="{H[2]}" fill="{INK}"/><path d="{H[3]}" fill="{WHITE}"/>'
            + "".join(f'<path d="{H[i]}" fill="{SHADE}"/>' for i in (4, 5, 6, 7, 8)))
    parts.append(f'<g id="mk-type-body">{body}</g>')
    for name, (clip, knuckle) in cuts.items():
        defs.append(f'<clipPath id="mk-c-type-{name}"><path d="{clip}"/></clipPath>')
        at = f' data-px="{knuckle[0]}" data-py="{knuckle[1]}"' if knuckle else ""
        parts.append(f'<g id="mk-type-{name}"{at}><g clip-path="url(#mk-c-type-{name})"><use href="#mk-type-body"/></g></g>')
    parts.append(f'<g id="mk-type" data-wx="1100" data-wy="1560" data-k="{k}"></g>')
    write("kit", defs, parts)


# Objects: path indices into the chosen Recraft drawing (2048 space).
OBJECTS = {
    "magnifier": {
        "src": "magnifier-recraft.svg", "id": "mg",
        "silhouette": 2,
        # the rim keeps the silhouette, masked to its own fills so the ghost handle's outline goes
        "rim_mask": [3, 8, 11],
        "rim": [(3, WHITE), (8, SHADE), (11, SHADE), (4, INK), (5, GLASS)],
        "glass": 5, "glint": 6,
        # Recraft drew the handle twice (a golden copy behind, 10 and 13): only the front is kept
        "handle": [7, 9, 12], "handle_shade": (900, 1180, 120, 620),
    },
    "lightbulb": {
        "src": "lightbulb-recraft.svg", "id": "lb", "plain": True,
        "silhouette": 2, "face": 3,
        # 8 to 10 are the base's left strips: Recraft left them golden, they are its shade side
        "fills": [(3, WHITE), (4, SHADE), (5, GOLD), (6, GOLD), (7, GOLD), (8, GOLD_DK), (9, GOLD_DK), (10, GOLD_DK)],
        # switched on: the glass glows light golden, its shade side golden
        "lit": [(3, "#F0C46E"), (4, GOLD)],
        # seven of the ten rays in rays-recraft.svg (outline, fill, highlight), drawn as a ring
        "marks": {"src": "rays-recraft.svg", "name": "ray", "centre": (1013, 1022),
                  "pieces": [(17, 18, 19), (5, 6, 7), (23, 24, 25), (2, 3, 4), (8, 9, 10), (26, 27, 28), (11, 12, 13)]},
        # the gag's sunglasses (sunglasses-recraft.svg): outline, golden frame, dark lenses, glints
        "props": [("shades", "sunglasses-recraft.svg", [(2, INK), (3, GOLD), (4, INK), (5, WHITE), (6, INK), (7, WHITE)])],
    },
    "megaphone": {
        "src": "megaphone-recraft.svg", "id": "mp", "plain": True,
        "silhouette": 2, "face": 3,
        # 14 is the cone's bottom strip, its shade side, left golden by Recraft; 13 an off-white sliver
        "fills": [(3, GOLD), (4, WHITE), (5, WHITE), (6, INK), (7, SHADE), (8, WHITE), (9, SHADE),
                  (10, GOLD), (11, WHITE), (12, GOLD_DK), (13, WHITE), (14, GOLD_DK), (15, WHITE)],
        # three of the seven arcs in soundwaves-recraft.svg, small to large (outline, fill, highlight)
        "marks": {"src": "soundwaves-recraft.svg", "name": "wave",
                  "pieces": [(14, 15, 16), (8, 9, 10), (5, 6, 7)]},
    },
}


def build_plain(name, O):
    """A drawing that needs no surgery: the silhouette plus recolored fills as one body part,
    an optional "lit" copy of some fills in other colors (faded in by the player), and a clip
    for the face."""
    P = paths_of((REFS / O["src"]).read_text())
    k = O["id"]
    defs = [f'<clipPath id="{k}-c-face"><path d="{P[O["face"]]}"/></clipPath>']
    parts = [f'<g id="{k}-body"><path d="{P[O["silhouette"]]}" fill="{INK}"/>'
             + "".join(f'<path d="{P[i]}" fill="{c}"/>' for i, c in O["fills"]) + "</g>"]
    if "lit" in O:
        parts.append(f'<g id="{k}-lit">' + "".join(f'<path d="{P[i]}" fill="{c}"/>' for i, c in O["lit"]) + "</g>")
    if "marks" in O:
        parts += build_marks(k, O["marks"])
    for pid, src, fills in O.get("props", []):
        # a prop from its own sheet (the lightbulb's sunglasses); data-cx/cy is its middle
        Q = paths_of((REFS / src).read_text())
        x0, y0, x1, y1 = bbox(Q[fills[0][0]])
        parts.append(f'<g id="{k}-{pid}" data-cx="{(x0 + x1) / 2:.0f}" data-cy="{(y0 + y1) / 2:.0f}">'
                     + "".join(f'<path d="{Q[i]}" fill="{c}"/>' for i, c in fills) + "</g>")
    write(name, defs, parts)


def build_marks(k, M):
    """Effect marks (sound waves, rays) from a Recraft sheet: each piece is an ink outline, a golden
    fill and a highlight. data-cx/cy is the piece's middle; data-a the way it points, measured
    from M["centre"] (the middle of the ring it was drawn in), so the player can turn it."""
    import math
    P = paths_of((REFS / M["src"]).read_text())
    out = []
    for n, (ink, gold, hi) in enumerate(M["pieces"], 1):
        x0, y0, x1, y1 = bbox(P[ink])
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        a = ""
        if "centre" in M:
            a = f' data-a="{math.degrees(math.atan2(cy - M["centre"][1], cx - M["centre"][0])):.1f}"'
        out.append(f'<g id="{k}-{M["name"]}-{n}" data-cx="{cx:.0f}" data-cy="{cy:.0f}" data-h="{y1 - y0:.0f}"{a}>'
                   f'<path d="{P[ink]}" fill="{INK}"/><path d="{P[gold]}" fill="{GOLD}"/><path d="{P[hi]}" fill="#F0C46E"/></g>')
    return out


def build_computer():
    """The browser-window character: the monitor (monitor-recraft.svg) and, as its own pieces,
    the keyboard (keyboard-recraft.svg) with every key separate so it can press down."""
    M = paths_of((REFS / "monitor-recraft.svg").read_text())
    K = paths_of((REFS / "keyboard-recraft.svg").read_text())
    # monitor: 16 and 17 (stand shade, side thickness) came out an off-palette navy
    fills = [(3, WHITE), (4, INK), (5, WHITE), (6, GOLD), (7, INK), (8, WHITE), (9, INK), (10, WHITE),
             (11, INK), (12, WHITE), (13, INK), (14, WHITE), (15, WHITE), (16, SHADE), (17, SHADE)]
    defs = ['<clipPath id="pc-c-face"><path d="' + M[5] + '"/></clipPath>',
            '<clipPath id="pc-c-bar"><path d="' + M[8] + '"/></clipPath>']
    parts = ['<g id="pc-body"><path d="' + M[2] + '" fill="' + INK + '"/>'
             + "".join(f'<path d="{M[i]}" fill="{c}"/>' for i, c in fills) + "</g>",
             f'<path id="pc-lit" d="{M[5]}" fill="#F0C46E"/>']
    # keyboard: 70 is the front strip, its shade side, left golden by Recraft
    parts.append(f'<g id="kb-body"><path d="{K[2]}" fill="{INK}"/><path d="{K[3]}" fill="{GOLD}"/>'
                 f'<path d="{K[70]}" fill="{GOLD_DK}"/></g>')
    for n, i in enumerate(range(4, 70, 3), 1):
        x0, y0, x1, y1 = bbox(K[i])
        parts.append(f'<g id="kb-key-{n}" data-cx="{(x0 + x1) / 2:.0f}" data-cy="{(y0 + y1) / 2:.0f}">'
                     f'<path d="{K[i]}" fill="{INK}"/><path d="{K[i + 1]}" fill="{WHITE}"/><path d="{K[i + 2]}" fill="{SHADE}"/></g>')
    write("computer", defs, parts)


def build_speech_bubble():
    """The speech bubble (speech-bubble-recraft.svg) and its tail (speech-bubble-tail-recraft.svg),
    drawn as separate pieces so the tail can wag. The player layers both inks under both whites,
    so the two outlines merge where the tail's neck crosses the bubble's edge. The bubble keeps
    its own path space (Recraft put a 0.842 transform on every path; it is dropped here)."""
    B = paths_of((REFS / "speech-bubble-recraft.svg").read_text())
    T = paths_of((REFS / "speech-bubble-tail-recraft.svg").read_text())
    # the tail is drawn much bigger than it is used: its outline (about 35 there) is thickened so
    # that at scale k it matches the bubble's (about 32)
    k = 0.45
    grow = 2 * (32 / k - 35)
    defs = [f'<clipPath id="sb-c-face"><path d="{B[3]}"/></clipPath>']
    parts = [
        f'<path id="sb-ink" d="{B[2]}" fill="{INK}"/>',
        # 5 and 6: the white curl over the top of the shade band and an off-white sliver beside it
        f'<g id="sb-white"><path d="{B[3]}" fill="{WHITE}"/><path d="{B[5]}" fill="{WHITE}"/><path d="{B[6]}" fill="{WHITE}"/></g>',
        # 4: the shade band, drawn a dark navy-grey by Recraft
        f'<path id="sb-shade" d="{B[4]}" fill="{SHADE}"/>',
        # data-px/py: the middle of the tail's neck, just under its cap (the pivot for the wag)
        f'<path id="sb-tail-ink" d="{T[2]}" fill="{INK}" stroke="{INK}" stroke-width="{grow:.0f}" stroke-linejoin="round"'
        f' data-px="1035" data-py="683" data-k="{k}"/>',
        f'<path id="sb-tail-white" d="{T[3]}" fill="{WHITE}"/>',
    ]
    write("speech-bubble", defs, parts)


def build_finish_flag():
    """The finish flag: the pole (finish-flag-pole-recraft.svg) and, as its own piece, the flat
    checkered cloth (finish-flag-cloth-recraft.svg), which the player bends with a travelling wave
    point by point, so it flutters but keeps Recraft's line. Two of the hero's impact stars
    (hero-jolt-parts.svg) come along for the gag."""
    P = paths_of((REFS / "finish-flag-pole-recraft.svg").read_text())
    C = paths_of((REFS / "finish-flag-cloth-recraft.svg").read_text())
    # 9 is the base's left end, its shade side, left golden by Recraft
    fills = [(3, WHITE), (4, SHADE), (5, GOLD), (6, GOLD), (7, GOLD), (8, GOLD_DK), (9, GOLD_DK)]
    parts = [f'<g id="ff-pole"><path d="{P[2]}" fill="{INK}"/>' + "".join(f'<path d="{P[i]}" fill="{c}"/>' for i, c in fills) + "</g>"]
    # the cloth: its ink silhouette and fifteen tiles, golden and white
    src = re.sub(r"<metadata>.*?</metadata>", "", (REFS / "finish-flag-cloth-recraft.svg").read_text(), flags=re.S)
    colors = re.findall(r'<path[^>]*fill="([^"]+)"', src)
    parts.append('<g id="ff-cloth">' + "".join(
        f'<path d="{C[i]}" fill="{INK if colors[i - 1] == INK else GOLD if colors[i - 1] == GOLD else WHITE}"/>'
        for i in range(2, len(C) + 1)) + "</g>")
    jolt = (ROOT / "assets" / "mascots" / "hero" / "hero-jolt-parts.svg").read_text()
    for n, s in ((1, 1), (2, 3)):
        parts.append(element(jolt, "g", f"hj-star-{s}").replace(f'id="hj-star-{s}"', f'id="ff-star-{n}"'))
    write("finish-flag", [], parts)


def paint(P, items):
    """Paths from one drawing: (index, colour) or (index, colour, outline stroke)."""
    out = ""
    for it in items:
        i, c = it[0], it[1]
        stroke = f' stroke="{c}" stroke-width="{it[2]:.0f}" stroke-linejoin="round"' if len(it) > 2 else ""
        out += f'<path d="{P[i]}" fill="{c}"{stroke}/>'
    return out


def pointer(k, pid, P, items, pivot, outline):
    """A part that turns about a pivot (the compass needle, the stopwatch hand), drawn much bigger
    than it is used: its silhouette (items[0]) is thickened so its outline comes out at `outline`
    stage units at scale k. data-px/py: the pivot, data-k: the scale."""
    x0, y0, x1, y1 = bbox(P[items[0][0]])
    own = min(abs(x0 - bbox(P[items[1][0]])[0]), 40)   # its own outline, about
    grow = max(0, 2 * (outline / k - own))
    first = (items[0][0], items[0][1], grow)
    return (f'<g id="{pid}" data-px="{pivot[0]}" data-py="{pivot[1]}" data-k="{k}">'
            + paint(P, [first] + items[1:]) + "</g>")


RAYS = {"src": "rays-recraft.svg", "name": "ray", "centre": (1013, 1022),
        "pieces": [(17, 18, 19), (5, 6, 7), (23, 24, 25), (2, 3, 4), (8, 9, 10), (26, 27, 28), (11, 12, 13)]}


def build_compass():
    """Step 1: the compass (compass-recraft.svg) and its needle (compass-needle-recraft.svg), which
    spins on the dial behind the eyes."""
    P = paths_of((REFS / "compass-recraft.svg").read_text())
    N = paths_of((REFS / "compass-needle-recraft.svg").read_text())
    defs = [f'<clipPath id="cp-c-face"><path d="{P[5]}"/></clipPath>']
    parts = [f'<g id="cp-body">' + paint(P, [(2, INK), (3, GOLD), (4, INK), (5, WHITE), (6, SHADE), (7, SHADE),
                                             (8, GOLD_DK), (9, GOLD), (10, WHITE), (11, GOLD)]) + "</g>"]
    # 4 and 6 (the centre line) came out a muddy olive, the slivers beside it off-white
    parts.append(pointer(0.5, "cp-needle", N, [(2, INK), (3, GOLD), (4, INK), (5, GOLD), (6, INK), (7, GOLD),
                                                 (8, WHITE), (9, WHITE), (10, WHITE), (11, WHITE)], (1024, 1022), 20))
    parts += build_marks("cp", RAYS)
    write("compass", defs, parts)


def build_clipboard():
    """Step 2: the clipboard (clipboard-recraft.svg) with three empty boxes, and six Recraft ticks
    (ticks-recraft.svg) the player pops into them."""
    P = paths_of((REFS / "clipboard-recraft.svg").read_text())
    defs = [f'<clipPath id="cb-c-face"><path d="{P[3]}"/></clipPath>']
    # 15 and 16: a white ghost strip along the board's bottom right, recoloured golden
    fills = [(3, WHITE), (4, SHADE)] + [(i, INK if i % 2 else WHITE) for i in range(5, 11)] + [
        (11, INK), (12, INK), (13, INK), (14, GOLD), (15, GOLD), (16, GOLD), (17, WHITE), (18, SHADE),
        (19, INK), (20, WHITE), (21, GOLD_DK), (22, WHITE), (23, WHITE), (24, SHADE)]
    parts = [f'<g id="cb-body"><path d="{P[2]}" fill="{INK}"/>' + paint(P, fills) + "</g>"]
    parts += build_marks("cb", {"src": "ticks-recraft.svg", "name": "tick",
                                "pieces": [(2, 3, 4), (6, 7, 8), (10, 11, 12)]})
    write("clipboard", defs, parts)


def build_stopwatch():
    """Step 3: the stopwatch (stopwatch-recraft.svg) and its hand (stopwatch-hand-recraft.svg). The
    top button is cut from the one outline with a clip so it can press down."""
    P = paths_of((REFS / "stopwatch-recraft.svg").read_text())
    H = paths_of((REFS / "stopwatch-hand-recraft.svg").read_text())
    # 55: the top button's left end and 58 the side button's, their shade sides, left golden
    fills = [(3, WHITE)] + [(i, INK) for i in range(4, 52)] + [
        (52, GOLD), (53, SHADE), (54, GOLD), (55, GOLD_DK), (56, GOLD), (57, GOLD), (58, GOLD_DK), (59, GOLD), (60, GOLD)]
    cut = "M830 270H1230V566H830Z"
    defs = [f'<clipPath id="sw-c-face"><path d="{P[3]}"/></clipPath>',
            f'<clipPath id="sw-c-button"><path d="{cut}"/></clipPath>',
            f'<mask id="sw-m-body" maskUnits="userSpaceOnUse" x="0" y="0" width="2048" height="2048">'
            f'<rect width="2048" height="2048" fill="white"/><path d="{cut}" fill="black"/></mask>']
    parts = [f'<g id="sw-body"><g mask="url(#sw-m-body)"><path d="{P[2]}" fill="{INK}"/>'
             + paint(P, [f for f in fills if f[0] not in (52, 55)]) + "</g></g>",
             f'<g id="sw-button" clip-path="url(#sw-c-button)"><path d="{P[2]}" fill="{INK}"/>'
             + paint(P, [(52, GOLD), (55, GOLD_DK)]) + "</g>",
             pointer(0.32, "sw-hand", H, [(2, INK), (3, GOLD), (5, GOLD), (4, INK)], (1023, 1523), 20)]
    parts += build_marks("sw", RAYS)
    write("stopwatch", defs, parts)


def build_object(name):
    if name in STEP_BUILDS:
        return STEP_BUILDS[name]()
    if name == "computer":
        return build_computer()
    if name == "speech-bubble":
        return build_speech_bubble()
    if name == "finish-flag":
        return build_finish_flag()
    O = OBJECTS[name]
    if O.get("plain"):
        return build_plain(name, O)
    P = paths_of((REFS / O["src"]).read_text())
    k = O["id"]
    defs = [
        f'<mask id="{k}-m-rim" maskUnits="userSpaceOnUse" x="0" y="0" width="2048" height="2048">'
        '<rect width="2048" height="2048" fill="black"/>'
        + "".join(f'<path d="{P[i]}" fill="white" stroke="white" stroke-width="70" stroke-linejoin="round"/>' for i in O["rim_mask"])
        + "</mask>",
        f'<clipPath id="{k}-c-glass"><path d="{P[O["glass"]]}"/></clipPath>',
        f'<clipPath id="{k}-c-handle">' + "".join(f'<path d="{P[i]}"/>' for i in O["handle"]) + "</clipPath>",
    ]
    x, y, w, h = O["handle_shade"]
    parts = [
        f'<g id="{k}-handle">'
        + "".join(f'<path d="{P[i]}" fill="{INK}" stroke="{INK}" stroke-width="{OUTLINE}" stroke-linejoin="round"/>' for i in O["handle"])
        + "".join(f'<path d="{P[i]}" fill="{GOLD}"/>' for i in O["handle"])
        + f'<g clip-path="url(#{k}-c-handle)"><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{GOLD_DK}"/></g></g>',
        f'<g id="{k}-rim"><path d="{P[O["silhouette"]]}" fill="{INK}" mask="url(#{k}-m-rim)"/>'
        + "".join(f'<path d="{P[i]}" fill="{c}"/>' for i, c in O["rim"]) + "</g>",
        f'<path id="{k}-glint" d="{P[O["glint"]]}" fill="{WHITE}"/>',
    ]
    write(name, defs, parts)


def write(name, defs, parts):
    OUT.mkdir(parents=True, exist_ok=True)
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" aria-hidden="true"><defs>'
           + "".join(defs) + "".join(parts) + "</defs></svg>\n")
    (OUT / f"{name}-parts.svg").write_text(svg)
    print(f"wrote assets/mascots/rig/{name}-parts.svg ({len(svg) // 1024} KB)")


def build_block():
    """Step 3: the building block (block-recraft.svg), a cube in three-quarter view: the white
    block that wears the face, and a golden copy that stacks on its head. The side came out a
    slate grey. data-bx/by: the middle of the bottom face (where it stands on the block under
    it), data-tx/ty the middle of its top face (where the next one lands)."""
    P = paths_of((REFS / "block-recraft.svg").read_text())
    at = ' data-bx="1044" data-by="1525" data-tx="1044" data-ty="655"'
    defs = [f'<clipPath id="bk-c-face"><path d="{P[3]}"/></clipPath>']
    parts = [f'<g id="bk-white"{at}>' + paint(P, [(2, INK), (3, WHITE), (4, SHADE), (5, WHITE)]) + "</g>",
             f'<g id="bk-gold"{at}>' + paint(P, [(2, INK), (3, GOLD), (4, GOLD_DK), (5, "#F0C46E")]) + "</g>"]
    write("block", defs, parts)


def build_power_button():
    """The power button (power-button-recraft.svg): a flat white cap with the power symbol on
    top, sitting in a tall golden base that wears the face. The one ink outline is split with
    masks into the cap's (pb-cap) and the base's (pb-base); the base is drawn over the cap so the
    cap presses down behind the ring's top. pb-lit is the symbol in golden, faded in. (The dome
    version it replaced is _refs/power-button-dome-recraft.svg.)"""
    P = paths_of((REFS / "power-button-recraft.svg").read_text())
    def mask(mid, idx):
        return (f'<mask id="{mid}" maskUnits="userSpaceOnUse" x="0" y="0" width="2048" height="2048">'
                '<rect width="2048" height="2048" fill="black"/>'
                + "".join(f'<path d="{P[i]}" fill="white" stroke="white" stroke-width="70" stroke-linejoin="round"/>' for i in idx)
                + "</mask>")
    defs = [mask("pb-m-cap", [4, 8, 12]), mask("pb-m-base", [3, 10, 11])]
    parts = [
        # 9: an off-white sliver at the cap's right edge
        f'<g id="pb-cap"><path d="{P[2]}" fill="{INK}" mask="url(#pb-m-cap)"/>'
        + paint(P, [(4, WHITE), (5, SHADE), (8, WHITE), (9, WHITE), (12, SHADE), (6, INK), (7, INK)]) + "</g>",
        f'<g id="pb-lit">' + paint(P, [(6, GOLD), (7, GOLD)]) + "</g>",
        # 11: the base's left end, its shade side, left golden by Recraft
        f'<g id="pb-base"><path d="{P[2]}" fill="{INK}" mask="url(#pb-m-base)"/>'
        + paint(P, [(3, GOLD), (10, GOLD), (11, GOLD_DK)]) + "</g>",
    ]
    parts += build_marks("pb", RAYS)
    write("power-button", defs, parts)


def build_duo():
    """The hero duo (high-five on the thank-you page, handshake on About): two copies of the
    running hero. Copies his body and its mask and clips from hero-parts.svg (1024 space; his
    shoe and fist are already in the kit), adds his palm side (hero-palm-recraft.svg) fitted
    to his body's box, the clasp (clasp-recraft.svg) and two impact stars."""
    hero = (ROOT / "assets" / "mascots" / "hero" / "hero-parts.svg").read_text()
    defs = [element(hero, "mask", "hr-m-body").replace("hr-", "du-"),
            element(hero, "clipPath", "hr-c-body").replace("hr-", "du-"),
            element(hero, "clipPath", "hr-c-glove").replace("hr-", "du-")]
    parts = [element(hero, "g", "hr-body").replace("hr-", "du-")]
    # the right-hand hero is his real right glove too (thumb, fingers and the 1 the right way
    # round), not a mirror: the same body with its face moved to the left half so he faces left.
    # The old face is whited out inside the glove (clipped to its fills, so the outline stays),
    # and his smile (path 7 of the runner drawing) is moved across and mirrored. The code draws
    # his eyes at the new spot (data-ex/ey).
    R = paths_of((ROOT / "mascot-test" / "run" / "hero-original.svg").read_text())
    # In the drawing his eyes stood in for his right edge, so that stretch of outline is drawn
    # new (EDGE, from the end of the finger to where the edge resumes below the eyes) and the
    # patch is shaped to it, so no white spills outside the glove.
    EDGE = "M634 238C668 262 688 300 693 360L697 424"
    # starts below the third finger's crease (the old eyes began at about y 275)
    PATCH = "M430 264H606L634 238C668 262 688 300 693 360L686 532H430Z"
    # the old right eye bulged past this edge; that ink is cut away so only the new line shows
    defs.append('<mask id="du-m-lcut" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">'
                '<rect width="1024" height="1024" fill="white"/>'
                '<path d="M634 238C668 262 688 300 693 360L697 424H780V200H640Z" fill="black"/></mask>')
    face = (405, 360)   # toward the thumb side, which is his front when he faces left
    # facing left, his light comes from the other side: the blue-grey bands down his left (3 to 6
    # of the runner drawing) go white, and a band of the same width runs down his right edge
    # instead: his glove's white (2) and the face patch, less the same shapes moved 40 left, so
    # only a strip along the right edge is left; his crease lines show through as before.
    inner = (f'<path transform="scale(0.5 0.5)" d="{R[2]}"/><path d="{PATCH}"/>')
    defs.append('<mask id="du-m-rshade" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">'
                f'<g fill="white" stroke="white" stroke-width="24">{inner}</g>'
                f'<g fill="black" stroke="black" stroke-width="24" transform="translate(-40 0)">{inner}</g></mask>')
    parts.append(f'<g id="du-body-l" data-ex="{face[0]}" data-ey="{face[1]}"><use href="#du-body" mask="url(#du-m-lcut)"/>'
                 + "".join(f'<path transform="scale(0.5 0.5)" d="{R[i]}" fill="{WHITE}"/>' for i in (3, 4, 5, 6))
                 + f'<path d="{PATCH}" fill="{WHITE}"/>'
                 f'<g mask="url(#du-m-rshade)" fill="{SHADE}"><path transform="scale(0.5 0.5)" d="{R[2]}"/><path d="{PATCH}"/></g>'
                 f'<path d="{EDGE}" fill="none" stroke="{INK}" stroke-width="10" stroke-linecap="round"/>'
                 # the smile, mirrored about its own middle (x 540) and moved so it sits right of
                 # the new eyes, as it sat left of the old ones
                 f'<g transform="translate({face[0] + 46 - 540} 0) translate(540 0) scale(-1 1) translate(-540 0)">'
                 f'<path transform="scale(0.5 0.5)" d="{R[7]}" fill="{INK}"/></g></g>')
    # the palm: its band lined up on his (centre x 527, bottom y 675), scaled to his body's size
    # (it is a little taller, so it is squashed a touch). Drawn as Recraft drew it: the body flips
    # with a negative scale, which puts the thumb on the inside, toward the other hero
    P = paths_of((REFS / "hero-palm-recraft.svg").read_text())
    sx, sy = 0.56, 0.47
    parts.append(f'<g id="du-palm" transform="translate(527 675) scale({sx} {sy}) translate(-1028 -1644)">'
                 + paint(P, [(2, INK), (3, WHITE), (4, SHADE), (5, SHADE), (6, SHADE), (7, INK), (8, INK),
                             (9, GOLD), (10, "#F0C46E")]) + "</g>")
    # the clasp: its two sleeve ends are where the arms join (data-lx/ly, data-rx/ry)
    C = paths_of((REFS / "clasp-recraft.svg").read_text())
    shade = [4, 5, 6, 7, 10, 11, 13, 15, 17, 19]
    # it is used at about 0.115, where Recraft's outline (about 17) would be a hairline next to the
    # hero's fists (about 8 in his space), so the silhouette is thickened to match. Its shade strips
    # between the fingers are thin enough at that size to read as lines, so they go ink like the
    # fists' lines rather than a lighter blue-grey.
    k, grow = 0.115, 2 * (8 / 0.115 - 17)
    parts.append('<g id="du-clasp" data-lx="420" data-ly="1010" data-rx="1650" data-ry="960">'
                 + paint(C, [(2, INK, grow)] + [(i, INK if i in shade else WHITE) for i in range(3, 20)]) + "</g>")
    jolt = (ROOT / "assets" / "mascots" / "hero" / "hero-jolt-parts.svg").read_text()
    for n, s in ((1, 1), (2, 3)):
        parts.append(element(jolt, "g", f"hj-star-{s}").replace(f'id="hj-star-{s}"', f'id="du-star-{n}"'))
    write("duo", defs, parts)


def build_case_files():
    """Case Studies: one manila folder (folder-recraft.svg), drawn several times by the player as a
    floating stack in front of the magnifier. It is drawn at about 0.4, so every line is redrawn
    heavier: the silhouette and each fill's edge stroked in ink over the fills. data-cx/by: the
    middle of its bottom edge (it flips about it)."""
    P = paths_of((REFS / "folder-recraft.svg").read_text())
    x0, y0, x1, y1 = bbox(P[2])
    w = 40
    # 3 the front and tab, 4 the papers, 6 the back cover's edge down the left (darker); 5 a sliver, left out
    fills = [(3, GOLD), (4, WHITE), (6, GOLD_DK)]
    parts = [f'<g id="cf-folder" data-cx="{(x0 + x1) / 2:.0f}" data-by="{y1:.0f}">'
             + f'<path d="{P[2]}" fill="{INK}" stroke="{INK}" stroke-width="{w}" stroke-linejoin="round"/>'
             + paint(P, fills)
             + "".join(f'<path d="{P[i]}" fill="none" stroke="{INK}" stroke-width="{w * 0.6:.0f}" stroke-linejoin="round"/>' for i, _ in fills)
             + "</g>"]
    write("case-files", [], parts)


STEP_BUILDS = {"case-files": build_case_files, "duo": build_duo, "power-button": build_power_button, "compass": build_compass, "clipboard": build_clipboard, "stopwatch": build_stopwatch, "block": build_block}


if __name__ == "__main__":
    what = sys.argv[1] if len(sys.argv) > 1 else ""
    if what == "kit":
        build_kit()
    elif what in OBJECTS or what in ("computer", "speech-bubble", "finish-flag") or what in STEP_BUILDS:
        build_object(what)
    else:
        sys.exit(__doc__)
