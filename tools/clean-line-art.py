"""Clean Midjourney line art before tools/prepare-mascots.py.

Usage: python3 tools/clean-line-art.py raw.png cleaned.png

- Removes stray marks: dark strokes that do not touch the main outline
  (Midjourney keeps adding Mickey-style stitch dashes to the glove).
  Lines joined to the outline, like the thumb crease, are kept.
- Recolors the near-black outline to the brand ink #1D3F66.
- Sets the background that touches the image edge to pure white, so the
  prep script's flat-background removal gets a clean edge.
"""
import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
src, out = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert('RGB')).astype(float)
L = im.mean(axis=2)
dark = L < 110
lab, n = ndi.label(dark, structure=np.ones((3,3)))
sizes = ndi.sum(dark, lab, range(1, n+1))
keep = np.zeros(n+1, bool)
# The outline is one big connected stroke (plus the cuff); stitch dashes are small islands
big = sorted(range(1, n+1), key=lambda i: -sizes[i-1])
for i in big:
    if sizes[i-1] > 0.08 * sizes[big[0]-1]: keep[i] = True
marks = (~keep[lab]) & dark
print('components', n, 'removed', int((~keep[1:]).sum()), 'sizes', sorted(int(s) for s, k in zip(sizes, keep[1:]) if not k))
grown = ndi.binary_dilation(marks, iterations=4)
ring = ndi.binary_dilation(grown, iterations=4) & ~grown & ~dark
fill = np.median(im[ring], axis=0)
im[grown] = fill
# Outline to ink: shift colors toward ink in proportion to how dark they are
line = np.array([12, 20, 35.]); ink = np.array([0x1D, 0x3F, 0x66], float)
L = im.mean(axis=2)
w = np.clip((200 - L) / (200 - line.mean()), 0, 1)[..., None]
im = im + (ink - line) * w
# Background: pure white where it is near-white and connected to the border
nearw = im.mean(axis=2) > 236
bl, _ = ndi.label(nearw)
edge = set(np.unique(np.concatenate([bl[0], bl[-1], bl[:, 0], bl[:, -1]]))) - {0}
bg = np.isin(bl, list(edge))
im[bg] = 255
Image.fromarray(np.clip(im, 0, 255).astype(np.uint8)).save(out)
