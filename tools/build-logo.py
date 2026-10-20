#!/usr/bin/env python3
"""Build the one-line Handstart logo as SVG: HANDSTART Digital(TM), with the hand A.

Usage:
    python3 tools/build-logo.py <BricolageGrotesque variable .ttf>

The font is Google's variable Bricolage Grotesque (opsz, wdth, wght), from
https://github.com/google/fonts/tree/main/ofl/bricolagegrotesque. It is not kept in the repo.

Everything is set the way the site's CSS sets it: HANDSTART at weight 800 with -0.035em
tracking, a space, then "Digital" at weight 600 with -0.02em tracking and the trademark sign,
using the font's own kerning. The first A is the Recraft hand A from
assets/brand/handstart-a-recraft.svg, scaled to the cap height. All letters are outlined, so the
logo never depends on the font loading.

Writes assets/brand/handstart-logo.svg (ink) and assets/brand/handstart-logo-cream.svg (cream).
"""
import re
import sys
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / 'assets' / 'brand'
OPSZ = 36            # optical size the header shows it at
WORD_TRACK = -35     # -0.035em in 1000-unit em
DIGITAL_TRACK = -20  # -0.02em
DIGITAL_GAP = 120    # extra space before "Digital" (0.12em)
TM_GAP = 40
TM_SCALE = 0.5     # the trademark sign is drawn at half size, its top on the cap line
COLORS = {'handstart-logo.svg': '#1D3F66', 'handstart-logo-cream.svg': '#F7F4EE'}


def instance(path, wght):
    return instantiateVariableFont(TTFont(path), {'wght': wght, 'opsz': OPSZ, 'wdth': 100})


def kerning(font):
    """Pair kerning from the font's GPOS 'kern' feature (PairPos formats 1 and 2)."""
    gpos = font['GPOS'].table
    seen, subtables = set(), []
    for rec in gpos.FeatureList.FeatureRecord:
        if rec.FeatureTag != 'kern':
            continue
        for li in rec.Feature.LookupListIndex:
            if li in seen:
                continue
            seen.add(li)
            lookup = gpos.LookupList.Lookup[li]
            for st in lookup.SubTable:
                if lookup.LookupType == 9:
                    if st.ExtensionLookupType != 2:
                        continue
                    st = st.ExtSubTable
                elif lookup.LookupType != 2:
                    continue
                subtables.append(st)

    def kern(left, right):
        for st in subtables:
            glyphs = st.Coverage.glyphs
            if left not in glyphs:
                continue
            if st.Format == 1:
                for pvr in st.PairSet[glyphs.index(left)].PairValueRecord:
                    if pvr.SecondGlyph == right:
                        return (getattr(pvr.Value1, 'XAdvance', 0) or 0) if pvr.Value1 else 0
                continue  # pair not in this subtable: try the next one
            c1 = st.ClassDef1.classDefs.get(left, 0)
            c2 = st.ClassDef2.classDefs.get(right, 0)
            v = st.Class1Record[c1].Class2Record[c2].Value1
            return (getattr(v, 'XAdvance', 0) or 0) if v else 0
        return 0
    return kern


class Setter:
    """Lays glyphs left to right on a y-down canvas with the baseline at the cap height."""

    def __init__(self, cap):
        self.x = 0
        self.cap = cap
        self.paths = []
        self.bounds = [float('inf'), float('inf'), float('-inf'), float('-inf')]

    def _grow(self, x0, y0, x1, y1):
        b = self.bounds
        self.bounds = [min(b[0], x0), min(b[1], y0), max(b[2], x1), max(b[3], y1)]

    def glyph(self, font, name, scale=1, top=False):
        """Sets one glyph. top=True hangs it from the cap line instead of sitting on the baseline."""
        gs = font.getGlyphSet()
        bp = BoundsPen(gs)
        gs[name].draw(bp)
        base = scale * bp.bounds[3] if top else self.cap
        pen = SVGPathPen(gs)
        gs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, self.x, base)))
        d = pen.getCommands()
        if d:
            self.paths.append(f'<path d="{d}"/>')
            x0, y0, x1, y1 = bp.bounds
            self._grow(self.x + scale * x0, base - scale * y1, self.x + scale * x1, base - scale * y0)
        self.x += scale * font['hmtx'][name][0]

    def hand_a(self, cap_letter_bounds):
        src = (BRAND / 'handstart-a-recraft.svg').read_text()
        ds = re.findall(r'<path d="([^"]+)"/>', src)
        nums = [float(n) for d in ds for n in re.findall(r'-?\d+\.?\d*', d)]
        xs, ys = nums[0::2], nums[1::2]
        x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
        s = self.cap / (y1 - y0)
        lsb = cap_letter_bounds[0]
        rsb = cap_letter_bounds[1]
        tx, ty = self.x + lsb - x0 * s, -y0 * s
        for d in ds:
            self.paths.append(f'<path transform="matrix({s:.5f} 0 0 {s:.5f} {tx:.2f} {ty:.2f})" d="{d}"/>')
        w = (x1 - x0) * s
        self._grow(self.x + lsb, 0, self.x + lsb + w, self.cap)
        self.x += lsb + w + rsb


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    heavy, medium = instance(sys.argv[1], 800), instance(sys.argv[1], 600)
    kern_h, kern_m = kerning(heavy), kerning(medium)
    cmap_h, cmap_m = heavy.getBestCmap(), medium.getBestCmap()
    cap = heavy['OS/2'].sCapHeight

    # the hand A keeps the regular A's side bearings
    gs = heavy.getGlyphSet()
    a = cmap_h[ord('A')]
    bp = BoundsPen(gs)
    gs[a].draw(bp)
    a_lsb, a_rsb = bp.bounds[0], heavy['hmtx'][a][0] - bp.bounds[2]

    t = Setter(cap)
    word = 'HANDSTART'
    for i, ch in enumerate(word):
        name = cmap_h[ord(ch)]
        if i == 1:
            t.hand_a((a_lsb, a_rsb))
        else:
            t.glyph(heavy, name)
        if i + 1 < len(word):
            t.x += kern_h(name, cmap_h[ord(word[i + 1])]) + WORD_TRACK
    t.x += WORD_TRACK + heavy['hmtx'][cmap_h[ord(' ')]][0] + WORD_TRACK + DIGITAL_GAP

    word = 'Digital'
    for i, ch in enumerate(word):
        name = cmap_m[ord(ch)]
        t.glyph(medium, name)
        if i + 1 < len(word):
            t.x += kern_m(name, cmap_m[ord(word[i + 1])]) + DIGITAL_TRACK
    t.x += TM_GAP
    t.glyph(medium, cmap_m[0x2122], TM_SCALE, top=True)

    x0, y0, x1, y1 = t.bounds
    pad = 4
    vb = f'{x0 - pad:.0f} {y0 - pad:.0f} {x1 - x0 + 2 * pad:.0f} {y1 - y0 + 2 * pad:.0f}'
    body = '\n    '.join(t.paths)
    for filename, color in COLORS.items():
        (BRAND / filename).write_text(
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="Handstart Digital">\n'
            f'  <!-- built by tools/build-logo.py: Bricolage Grotesque outlines with the Recraft hand A -->\n'
            f'  <g fill="{color}">\n    {body}\n  </g>\n</svg>\n')
        print('wrote', BRAND / filename)
    print('viewBox', vb, 'aspect', round((x1 - x0 + 2 * pad) / (y1 - y0 + 2 * pad), 3))


if __name__ == '__main__':
    main()
