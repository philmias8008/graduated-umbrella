# Mascot SVG authoring contract

**Optional, for the logo and any code-built geometric characters.** Mascots are raster by default: see `docs/mascot-raster-spec.md`. Use this contract only when a character is built as vector shapes and needs individually animated parts (blinking eyes, waving arms).

An SVG that follows this contract gets blink, arm wave and the GSAP cursor glance on top of the shared bob, wiggle and reveal. The placeholders in `assets/mascots/placeholder/` follow it and are the reference files.

## File and canvas

- One file per mascot: `assets/mascots/final/{id}.svg`, with `"type": "svg"` in `assets/mascots/manifest.json`.
- `viewBox="0 0 200 200"`. No `width` or `height` attributes (the loader strips them anyway).
- Feet on the ground line at y = 168 (84% of the height, the same line raster art uses), centered horizontally, about 12 units of margin on every side so the wiggle and arm waves are not clipped.
- **No blob and no shadow.** The component draws both, as it does for raster art.
- Plain SVG shapes and paths only. No embedded raster images, no `<text>` (outline any lettering), no `<script>`, no `<foreignObject>`, no external references.

## Colors

Brand tokens from CLAUDE.md only:

| Token | Hex | Typical use |
|---|---|---|
| navy | `#1B2B4B` | outlines, pupils, limbs |
| amber | `#C8873A` | main body fill |
| amber-lt | `#e0a558` | highlights, secondary fills |
| cream | `#F7F4EE` | eye whites, light fills |
| slate | `#3f4a5a` | optional shading |
| tint | `#EFEAE0` | optional soft fills |

## Layers

Top-level children of the `<svg>` are groups (`<g>`) with these exact ids, in this stacking order (first is drawn at the back). Only include the layers the character actually has.

| Layer id | Contents | Pivot (transform origin) | Animated by |
|---|---|---|---|
| `leg-l` | Left leg (viewer's left) | top center (hip) | |
| `leg-r` | Right leg | top center (hip) | |
| `arm-l` | Left arm, viewer's left | **top-right corner of its bounding box** (shoulder) | hover wave, GSAP reveal |
| `arm-r` | Right arm, viewer's right | **top-left corner of its bounding box** (shoulder) | hover wave, GSAP reveal and wave |
| `body` | Main shape, including the prop itself | bottom center | |
| `eyes` | Eye whites only | center | blink, GSAP reveal |
| `pupils` | Pupils only, separate from the whites | center | blink, GSAP reveal, GSAP cursor glance |
| `mouth` | Mouth | center | GSAP reveal |
| `marks` | Motion lines, sparkles, sweat drops | center | |

The whole SVG bobs, wiggles and pops as one piece, like raster art. The layers add motion on top of that.

Rules that make the pivots work:

- **Pivots come from each group's bounding box**, because the CSS uses `transform-box: fill-box`. For `arm-l` nothing may extend above or to the right of the shoulder point; for `arm-r`, nothing above or to the left.
- **Eyes and pupils are separate groups** so blink squashes both and the pupils can move alone.
- **No transforms on layer groups.** Flatten or apply transforms on export. The animations set `translate`, `scale` and `rotate` on the groups and would fight an existing `transform` attribute.

## Ids and styles

- The layer ids above are the only ids that carry meaning. The loader converts them to `data-layer` attributes so the same mascot can appear twice on a page.
- Other ids (gradients, clip paths, masks) are allowed. The loader prefixes them per instance and rewrites `url(#...)` and `href="#..."` references.
- **No `<style>` blocks and no `class` styling.** Inlined SVG style rules apply to the whole page. Export with presentation attributes. The loader logs a console warning if it finds a `<style>` block.

## Export settings

- **Illustrator:** File > Export > Export As > SVG. Styling: Presentation Attributes. Font: Convert to Outlines. Images: none. Object IDs: Layer Names. Minify off, Responsive on.
- **Figma:** name the groups with the layer ids, export as SVG with "Include id attribute" and "Outline text" checked.

## Promoting art

1. Drop the export in `assets/mascots/incoming/{id}.svg` and check it against this contract.
2. Move it to `assets/mascots/final/{id}.svg`.
3. Add `"{id}": { "type": "svg" }` to `assets/mascots/manifest.json`.
4. Check it on `/mascot-test/` in CSS mode and GSAP mode. The badge should read "final svg".
