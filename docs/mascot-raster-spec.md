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

1. Drop the cleaned exports in `assets/mascots/incoming/`.
2. Check them against this spec: transparent, ground line at 84%, consistent framing across poses, 1x and @2x both present, file names match.
3. Move them to `assets/mascots/final/`.
4. Add `type` and `poses` to the mascot's existing manifest entry.
5. Open `/mascot-test/` and check the mascot in CSS mode and GSAP mode. Its badge should read "final raster". Add the id to the test page's raster section (or temporarily to `DEMO_IDS`) to see every pose, blob color and boil.

An id in the manifest whose idle pose fails to load falls back to its placeholder with a console warning. A missing extra pose only disables the hover swap or boil that needed it.
