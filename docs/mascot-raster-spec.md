# Mascot raster spec

Mascots are transparent WebP images generated in Midjourney, then cleaned up and exported to this spec. The mascot component (`assets/js/hs-mascot-loader.js` and `assets/css/hs-mascots.css`) draws the blob and the shadow and does all the motion, so the art is just the character.

For the logo or a code-built geometric character, see the optional `docs/mascot-svg-contract.md` instead.

## The image

- **Transparent WebP**, alpha channel intact. No background, no blob, no ground shadow, no drop shadow. The component draws the blob behind the character and the shadow under it.
- **Square canvas by default.** 600 x 600 px at 1x and 1200 x 1200 px at @2x. A non-square character keeps the same width (600 / 1200) and sets `ratio` (width divided by height) in the manifest.
- **Ground line at 84% of the canvas height.** The lowest point of the feet (or the base of the object) touches y = 504 px on a 600 px canvas. The component's shadow sits on that line, so a character that floats above it or sinks below it looks wrong.
- **Centered horizontally**, with at least 6% clear margin on each side so the hover wiggle does not clip at the edges.
- **Every pose of one mascot is framed identically:** same scale, same ground line, same horizontal center. Poses crossfade on top of each other, so any drift between frames shows up as a jump.
- **Colors** stay close to the brand tokens in CLAUDE.md (navy outlines, amber and amber-lt fills, cream highlights).
- Export at WebP quality 85 to 90. Aim for under 60 KB at 1x.

## Poses and file names

```
assets/mascots/final/{id}-{pose}.webp
assets/mascots/final/{id}-{pose}@2x.webp
```

| Pose | Required | Used for |
|---|---|---|
| `idle` | yes | The default, and the only pose shown under reduced motion. |
| `idle-b` | no | A second take of idle with slightly different line work. Bare `data-boil` alternates `idle` and `idle-b` at 4 fps for a hand-drawn "boil". Generate it as a near-identical variation of the idle image (same pose, same framing), not a new pose. |
| anything else (`happy`, `point`, `cheer`) | no | Hover swap and `data-pose`. The first pose in the manifest list that does not start with `idle` becomes the default hover pose. |

Pose names are lowercase and hyphenated.

## Manifest

Every mascot already has an entry in `assets/mascots/manifest.json` with its default blob. Finished art adds `type` and `poses`:

```json
{
  "magnifier": {
    "type": "raster",
    "blob": "sage",
    "poses": ["idle", "happy", "idle-b"]
  }
}
```

- `blob`: the mascot's default blob color (`terracotta`, `butter`, `sage`, `dusty-blue` or `tint`). Every id already has one. A figure's `data-blob` overrides it.
- `type`: `"raster"` for WebP art, `"svg"` for an inline SVG final (see the optional contract). Leave it out until the art exists; the placeholder shows meanwhile.
- `poses`: every pose that exists on disk, with both 1x and @2x files. Only list what exists.
- `ratio` (optional): width divided by height for non-square art. Also set `style="--hs-mascot-ratio: 0.8"` on the figure to reserve the right space before the manifest loads.
- `path` (optional): a different folder for the files. Only the test page uses this.

## Promoting art

`tools/prepare-mascots.py` does the framing and export, so raw art does not need to be sized by hand.

1. Drop raw images in `assets/mascots/incoming/`, named `{id}-{pose}.png` (or .jpg / .webp), e.g. `magnifier-idle.png`, `magnifier-happy.png`, `magnifier-idle-b.png`. Any size, either transparent or on a flat plain background. Upscale in Midjourney first so the character is at least about 1000px tall; smaller art gets enlarged and the @2x file looks soft.
2. Run `python3 tools/prepare-mascots.py` (add `--only magnifier` for one mascot, `--dry-run` to preview without writing). It removes a flat background (only background connected to the image edge, so white eyes survive), scales all poses of a mascot together, stands them on the 84% ground line centered on the feet, writes the 600px and 1200px WebPs to `final/` and sets `type` and `poses` in the manifest.
3. Read its warnings: background not flat, character touching the image edge, poses drawn at very different sizes (rerun with `--fit-each` if the character really is the same size), enlarged art.
4. Look at the preview sheet in `assets/mascots/incoming/_preview/{id}.png`: every pose should share the same size, feet and center line.
5. Open `/mascot-test/` and check the mascot in CSS mode and GSAP mode. Its badge should read "final raster".

Raw files and previews are gitignored; only `final/` and the manifest get committed. If a background is busy or the character is cut out badly, remove the background in an editor first and drop in a transparent PNG; the script then keeps the transparency as it is.

An id in the manifest whose idle pose fails to load falls back to its placeholder with a console warning. A missing extra pose only disables the hover swap or boil that needed it.
