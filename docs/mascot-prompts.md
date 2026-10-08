# Mascot prompts (Midjourney)

Every prompt that produced approved art goes here, with the date and the image it made. Prompts that only lived in a chat have been lost before; this file is the record.

## Style and colors

- **Direction A, modernized:** rubber-hose energy (bouncy rounded shapes, bendy limbs, a classic four-digit cartoon glove) drawn as flat vector: even outline, flat fills, one shade, no texture or grain. Keep clear of Mickey, Cuphead, Pikachu and the Jamm characters.
- **Colors are Golden hour** (see `CLAUDE.md`): outline in ink `#1D3F66`, cuff in golden `#E3A23B`, shade in a soft blue-grey. Midjourney drifts on exact colors, so correct them in cleanup.
- **Blob set:** Deeper earth: terracotta `#D2694A`, olive `#7E9F6B`, plum `#9C7AB0`, clay pink `#CF7A86`. Blobs only: the hero wears core brand colors (see "Hero, Recraft round" below).
- **The jump-start hands (motif 5b) are the white glove**, the same character as the hero, not the emoji-yellow hands in the current test code.
- **References:** `[JAMM URLS]` is the two Jamm (jamm.co) mascots, the jam jar and the toast. Local copies (gitignored, never deployed) are in `assets/mascots/incoming/_refs/`. Upload both to Midjourney and use them as `--sref`, for linework and shading only. What they bring:
  - an even, medium-weight outline in a dark plum-navy rather than black, which sits close to our ink
  - flat fills with a solid dark "thickness" side (the lid rim, the toast crust) instead of soft shading
  - big eyes with dark pupils and a white crescent, and a wide toothy grin
  - rubber-hose limbs with white four-finger gloves and chunky shoes
- **Resemblance watch:** Jamm characters already wear white cartoon gloves, and our hero is a white glove. Expect Midjourney to borrow their glove shape. Fine for line quality, but the hero must not read as a Jamm hand.

## Workflow

1. Glove first.
2. The hero from the approved glove with `--oref`.
3. Every other character with the approved hero as `--sref` only (not `--oref`). `--oref` is reused only within one character, for its poses.
4. Bring each 4-image batch back to Claude for critique and prompt rewrites.
5. Save every approved image with its exact prompt in this file.

**Review checklist:** even outline weight, readable eyes, glove silhouette clear when squinting, no resemblance to Mickey, Pikachu or Jamm characters. For pose sets also: the cuff lands in the same spot and the glove is the same size in every pose.

## 1. Glove

```
flat 2D vector-style cartoon illustration with a subtle 1930s rubber-hose influence, a single white cartoon glove hand raised in a friendly ready pose, classic cartoon glove with a thumb and three fingers, bouncy rounded shapes, small golden cuff band at the wrist, thick even deep ink-blue outline with rounded corners, flat solid fills, one flat soft blue-grey shade, bold and simple, readable at small size, no face, centered, plain pure white background --ar 1:1 --v 7 --sref [JAMM URLS] --no shadow, ground, gradient, 3d, text, texture
```

### Glove, round 1 results (2026-10-07)

- **With Jamm `--sref`:** best linework (chunky, bouncy, confident), but every image came out as a peace sign, the outline went black instead of ink-blue, and two had Mickey's three stitch lines on the back (one had a cuff button). Fails the Mickey check.
- **Without `--sref`:** right colors, but stock-clipart feel: thin, timid lines, soft near-gradient shading, scattered poses.
- **Gemini alternative:** closest to the spec (ink-blue line, flat white fill, one flat edge shade, golden cuff, thumb plus three fingers, no Mickey cues) but generic and emoji-like, and it shows the palm, not the back of the hand. Saved locally as `assets/mascots/incoming/_refs/gemini-glove.png`.
- **Decision:** not locked. Round 2 combines them: Gemini glove as `--oref` for shape, Jamm as `--sref` at reduced weight for line quality.

### Glove, round 2

```
flat 2D vector-style cartoon illustration with a subtle 1930s rubber-hose influence, a single white cartoon glove hand, open hand raised with all fingers up and slightly spread in a friendly wave, back of the hand facing the viewer, classic cartoon glove with a thumb and three fingers, plain smooth glove with no stitching lines and no buttons, bouncy rounded shapes, short golden cuff band at the wrist, thick even deep ink-blue outline with rounded corners, flat solid white fill, one flat blue-grey shade along one edge, bold and simple, readable at small size, no face, centered, plain pure white background --ar 1:1 --v 7 --oref [GEMINI GLOVE URL] --ow 60 --sref [JAMM URLS] --sw 60 --no shadow, ground, gradient, 3d, text, texture, peace sign, stitching, button, black outline
```

Adjust if needed: outline still black, lower `--sw` to 30. Results copying the Gemini glove, raise `--ow` or drop it. Wrong pose, move the pose phrase to the very front.

### Glove, round 2 results (2026-10-07)

- Pose fixed (open waves), rubber-hose bounce kept, flat edge shade and golden cuffs good.
- Still off: outline near-black instead of ink-blue; marks on the back of the hand read as Mickey stitches (#2, #4) or accidental faces (#3, #1); most have four fingers plus a thumb.
- **Pick: #2** (strongest silhouette, cleanest cuff). Fix it instead of rerolling: upscale, then Vary Region on the back of the hand only with `white cartoon glove, completely plain smooth back of the hand, no lines, no creases, no marks --no stitching, creases, wrinkles, face, lines`.
- **Outline color is fixed in cleanup**, not in prompts: recolor near-black outline pixels to ink `#1D3F66`.
- **Finger count stays a thumb and three fingers.** (An earlier note here switched to four fingers based on a misread thumbnail; the upscaled #2 has a thumb and three fingers.) The Mickey read comes mainly from back stitching and a white rolled cuff, which the plain back and golden cuff remove.
- **Upscaled #2 (Subtle) review:** five marks on the back (three dashes, a crease, a dash into the cuff) and a messy overlapping join where the thumb meets the first finger. One Vary Region selection over the back of the hand and that join: `white cartoon glove, completely plain smooth back of the hand, no lines, no creases, no marks, clean single outline where the thumb meets the finger --no stitching, creases, wrinkles, face, lines`. Cleanup also handles the off-white speckled background and the near-black outline.
- Once #2 is clean it is the locked glove and the `--oref` for the hero and the jump-start poses.

### Glove, Vary Region results and cleanup (2026-10-07)

- Vary Region did not remove the back-of-hand dashes in any of the four results; Midjourney keeps adding them. #13 and #14 also have a notched thumb joint.
- **Chosen glove: #11** (Aidan's pick over #12). Same character, with a straighter thumb joint and a closed outline at the cuff.
- Cleaned with `tools/clean-line-art.py`: the three dashes removed, outline recolored to ink, background pure white. The thumb crease is kept because it is structure, not stitching.
- Files (local, gitignored): `assets/mascots/incoming/glove-idle.png` (cleaned #11), the cleaned #12 as `_refs/glove-12-clean.png`, originals in `_refs/glove-vary-11..14.png`.
- **Cuff recolored to palette tokens:** fill `#EDC65D` to `--accent-lt` `#F0C46E`, shade `#C1A456` (olive) to `--accent` `#E3A23B`. Light golden fill with a golden shade, the same pair the hero's band stripe uses. Pre-recolor version kept as `_refs/glove-idle-v1.png`. Cuff colors for every glove pose and character: fill `#F0C46E`, shade `#E3A23B`.

## 2. Hero (hero-bib-hand)

The site's lead mascot: a white glove character with a face on the back of the hand, on a small rubber-hose runner's body (arms, legs, sneakers), mid-sprint, wearing a racing bib with a 1. (Originally briefed as standing on two of its own fingers; round 1 changed the direction, see below.) It sits beside "Let's give your business a hand" on the homepage.

```
flat 2D vector-style cartoon illustration with a subtle 1930s rubber-hose influence, a cute white cartoon glove hand character with a friendly happy face on the back of the hand, standing upright on two of its fingers like legs and mid-sprint, leaning forward, wearing a small plain terracotta racing bib with a bold number 1, golden cuff band, white eyes with large deep ink-blue pupils and a small white crescent highlight, thick even deep ink-blue outline with rounded corners, flat solid fills, one flat soft blue-grey shade, full body, centered, plain pure white background --ar 1:1 --v 7 --oref [APPROVED GLOVE URL] --ow 150 --sref [JAMM URLS] --no shadow, ground, gradient, 3d, texture
```

### Hero, round 1 results (2026-10-07)

Run with the recolored glove as `--oref` (`--ow 150`) and both Jamm images as `--sref`.

- **None did the brief literally.** Instead of standing on two of its own fingers, every result made the glove a head on a small rubber-hose body with arms, legs and sneakers (the body comes from the Jamm `--sref`).
- **#1:** best face (warm smile), white and on-model, but standing still, thumb plus four fingers, and its hands are gloves wearing gloves.
- **#2:** grey fill, no mouth, reads as a sock puppet. Rejected.
- **#3:** most personality, but grey, cluttered and the most Jamm-like. Rejected.
- **#4:** actually sprinting, clean silhouette, white, even linework, golden collar on the bib. Missing a mouth.
- All four: terracotta drifted to clay pink, a ground shadow despite `--no shadow`, scratchy Jamm line. Recolor and shadow are cleanup fixes.
- **Decision: Option A (Aidan's call).** The hero is a glove head on a little runner's body, building on #4. The alternative (glove flipped upside down, running on two fingers) was dropped. Next: upscale #4 (Subtle), then Vary Region on the lower face to add a wide friendly smile, and check the finger count on the upscale.

### Hero, Midjourney patching (2026-10-07)

Pass 1 (body), pass 1b (terracotta sneakers) and pass 2 (face: white eyes, black pupils, closed smile) on #4 worked step by step, but the upscale's smudgy line kept coming back and needed heavy raster cleanup (`_refs/hero-clean-wip.png`). Paused in favour of Recraft. Decision kept from this round: **no teeth** (they blur at mascot size and are a Jamm trait); an open-mouth smile without teeth is reserved for a celebration pose.

### Hero, Recraft round (2026-10-07)

**Switched the hero to Recraft** for native SVG: clean even lines, exact hex colors, and parts that can be rigged for a real running cycle (Aidan's call: do it properly, even if it takes more work).

- Custom style from `_refs/jamm-jar.png`, `_refs/jamm-toast.png` and `incoming/glove-idle.png`, vector illustration, 1:1.
- Prompt:

```
A cheerful cartoon mascot: a white cartoon glove with a thumb and three fingers as the head and body, running mid-sprint and leaning forward. A big friendly face on the back of the hand: two large white oval eyes touching each other, each with a thick outline and a big round solid pupil, and a wide closed curved smile. A small terracotta racing bib with a bold white number 1, a golden collar band where the glove meets the bib. Thin bendy rubber-hose arms ending in round white fists, rubber-hose legs in chunky terracotta sneakers with white soles. Bold, even, thick outline on every shape, flat solid colors, one flat blue-grey shade on one side only, simple clean shapes, full body, centered on a plain white background.
```

- **Chosen: result A** (`_refs/hero-recraft-a2.svg`, the higher-quality run; `hero-recraft-a.svg` is the first run, same drawing). The band works as both the glove's wrist and the race bib, the limbs are thin rubber-hose tubes straight out of the band, thumb plus three fingers, closed smile. Result B was rejected (teal sticker outline, teeth, Jamm-style offset shadow).
- SVG structure: one ink silhouette path draws every outline, crease and both pupils; 30 fill paths sit on top. The mouth is its own path.
- **Colors (decided): core brand colors, not terracotta.** Ink `#1D3F66` outline and pupils, white `#FFFFFF` glove, blue-grey `#A9BACD` shade, golden `#E3A23B` band and shoes, light golden `#F0C46E` band stripe, darker golden `#B57A1E` for the shoe and band shade side (proposed token `--accent-dk`). Chosen over Recraft's orange, ink shoes and a light golden bib because golden pops hardest on the sky and matches the cloud shader's sun glow. Open question: white or ink "1" at small sizes.
- **Next:** rebuild as a rig. Body, face and shoes keep Recraft's drawing with their own outlines; arms and legs become rubber-hose strokes that bend; pupils become separate circles; then a vanilla JS run cycle on a dev page. Layers per `docs/mascot-svg-contract.md`.

## 3. Jump-start hands (motif 5b)

One hand only; the code mirrors it for the other side. Every pose shares the same framing so the code can swap them without the hand jumping. Each prompt ends with the shared tail below, where `[SHARED]` appears.

Shared tail:

```
, viewed from the back of the hand, wrist cuff touching the bottom center of the frame, hand pointing straight up, same scale in every image, white cartoon glove with a thumb and three fingers, golden cuff band, thick even deep ink-blue outline, flat solid fills, one flat soft blue-grey shade, no face, plain pure white background --ar 1:1 --v 7 --oref [APPROVED GLOVE URL] --ow 150 --sref [JAMM URLS] --no shadow, ground, gradient, 3d, text, texture, motion lines
```

| Pose | Prompt start (then `[SHARED]`) |
|---|---|
| `reach` | `flat 2D vector-style cartoon illustration, a white cartoon glove reaching upward with fingers spread wide open, eager` |
| `half` | `flat 2D vector-style cartoon illustration, a white cartoon glove with fingers curled halfway closed, about to grab something` |
| `grip` | `flat 2D vector-style cartoon illustration, a white cartoon glove tightly gripping a thick vertical bright green bar, fingers wrapped around the front of the bar, thumb wrapped over the fingers, the bar runs off the top and bottom edges of the frame, knuckles squeezed with effort` |
| `release` | `flat 2D vector-style cartoon illustration, a white cartoon glove springing open after letting go, fingers splayed and slightly bent back` |

- **Grip layers:** the bright green bar is there to be cut out. Removing it leaves `grip-back` (the hand behind the bar) and `grip-front` (the fingers in front), which line up exactly. The code draws the back layer under the letter and the front layer over it.
- **Optional variant:** add `with a small determined face on the back of the hand, gritted teeth` to the grip pose to make it the hero character doing the jump start. Try it once and compare; it may compete with the HANDSTART moment.

## Original round 1 prompts (navy and amber, kept for reference)

From the earlier chat, before the Golden hour palette:

```
flat 2D vector-style cartoon illustration, a single white cartoon glove hand raised in a friendly ready pose, classic cartoon glove with a thumb and three fingers, small amber cuff band at the wrist, thick even dark navy outline with rounded corners, flat solid fills, one flat soft grey shade, bold and simple, readable at small size, no face, centered, plain pure white background --ar 1:1 --v 7 --sref [JAMM URLS] --no shadow, ground, gradient, 3d, text, texture
```

```
flat 2D vector-style cartoon illustration, a cute white cartoon glove hand character with a friendly happy face on the back of the hand, standing upright on two of its fingers like legs and mid-sprint, leaning forward, wearing a small plain terracotta racing bib with a bold number 1, amber cuff band, white eyes with large dark navy pupils and a small white crescent highlight, thick even dark navy outline with rounded corners, flat solid fills, one flat soft grey shade, full body, centered, plain pure white background --ar 1:1 --v 7 --oref [APPROVED GLOVE URL] --ow 150 --sref [JAMM URLS] --no shadow, ground, gradient, 3d, texture
```

## Approved

None yet.
