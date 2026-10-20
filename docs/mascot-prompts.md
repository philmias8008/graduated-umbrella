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

### Recraft rounds after the hero (2026-10-08)

**Rule learned:** Recraft takes style, not identity, from a reference image. Every prompt must describe the whole character first, then the pose. Settings: reference `_refs/hero-idle-ref.png`, the hero custom style, 1:1, palette `#1D3F66 #FFFFFF #A9BACD #E3A23B #F0C46E`. Character block:

```
A white cartoon glove mascot: the whole glove is the head and body, a thumb and three rounded fingers pointing up at the top, a big friendly face on the back of the hand with two large white oval eyes touching each other and big round solid dark pupils, a wide closed smile, a golden band around the bottom of the glove like a wrist cuff with a light golden stripe and a bold dark number 1. Thin bendy rubber-hose arms come out of the sides of the band, and thin rubber-hose legs come out of the bottom of the band, with chunky golden sneakers with white soles. Pose: ... Bold even thick dark outline, flat solid colors, one flat blue-grey shade on one side only, full body with plenty of space around it, plain white background.
```

- **Idle (victory pose)**, `_refs/hero-idle-recraft.svg`: asked for two thumbs up, got both fists raised; kept. Rigged, bounces at 1.3s beside the landing tagline.
- **Electricity sheet**, `_refs/bolts-recraft.svg` (16:9): six bolts and six crackle marks. Crackle mark 1 is used for the breathing corner marks and the jolt impacts; the bolts were tried as popping sparks and rejected (Aidan wants minimal, breathing, outside the letters).
- **Thumbs-up hand**, `_refs/thumbs-recraft-2.svg`: tried as a pop inside the idle, rejected (the thumbs-up belongs to the hero after the run).
- **After-run hero:** a standing two-thumbs-up batch was too stiff (the idle again with thumbs); a jump pose (`_refs/hero-hop-recraft.svg`) lost the glove until the character block was added, then was rigged with fist pumps and rejected for a calmer float. Its glove still patches the idle's (whole under the raised fist).
- **Float (chosen)**, `_refs/hero-float-recraft.svg`, pose: `floating peacefully in mid-air, completely relaxed and weightless, turned slightly to the left and looking to the left, both arms hanging loosely down at its sides ending in open relaxed white glove hands, both legs dangling limply below with the sneakers hanging toes-down and slightly apart.` Mirrored on the homepage to face the card; slow 2.4s bob, limbs trailing.

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

## Logo mark (2026-10-08)
Direction A, run in Recraft (vector or icon style, palette `#1D3F66` only, 1:1):

> Minimal flat vector logo mark, single solid color #1D3F66 on plain white background. A cartoon glove hand silhouette: rounded glove with a thumb and three fingers, held up open, with a thick wrist cuff band at the bottom. A bold number 1 is cut out of the cuff band as negative space. Simple geometric shapes, no outlines, no shading, no gradients, no texture, no text. Must read clearly at 16 pixels as a favicon. Centered, generous padding.

- Recraft drifted to purple-indigo and mostly drew four fingers. If rerunning, use "a thumb and exactly three fingers, wide gaps between them".
- **Chosen: bottom row #2** of the first batch (upright, symmetric, big rounded 1). Not used as-is: rebuilt by hand as `assets/brand/handstart-mark.svg` with a thumb and three fingers, index longer than ring (Aidan), and the 1 taken from Bricolage Grotesque ExtraBold.
- Directions B (hand plus start line) and C (H monogram from two hands) were drafted but not run.

## Logo: the hand A (2026-10-08)
The glove mark was dropped (Aidan: "not kickin it"). New direction: the A of HANDSTART with a hand as its crossbar. Recraft run in a vector style, ink only:

> A single bold capital letter A, heavy extra bold geometric sans serif, flat vector, single solid color #1D3F66 on plain white background. The triangular counter inside the A is shaped like a small open human hand with five fingers, cut out as negative space. Clean, simple, no outlines, no shading, no gradients, no texture, no other letters. Centered.

- **Chosen: top left of the batch**, a hand reaching in from the left across the A, its outline cut as a gap. Original SVG kept at `assets/mascots/incoming/_refs/hand-a-recraft.svg` (local only); cleaned site version at `assets/brand/handstart-a-recraft.svg` (background removed, ink `#1D3F66`, cropped).
- A hand-built alternative on Bricolage's own A (crossbar swapped for a handshake hand) is at `assets/brand/handstart-a.svg`. It reads well large but loses the hand sooner when small.

## Jolt pieces (2026-10-09)
For the new "comic impact" jolt. Hero custom style, palette `#1D3F66 #FFFFFF #A9BACD #E3A23B #F0C46E`, 16:9, separate pieces so the code can place, stretch and pulse them. Drop picks in `assets/mascots/incoming/_refs/`.

1. Impact stars:
> A sheet of four separate cartoon impact bursts, 1930s rubber-hose cartoon style, each a spiky comic "POW" star shape with 8 to 10 uneven chunky points, golden yellow fill with a lighter golden inner star, thick even deep ink-blue outline, flat solid fills, no text inside, each burst isolated with plenty of space between them, plain pure white background, no shadow, no gradient, no texture

2. The racing bolt:
> A sheet of three separate long horizontal cartoon lightning bolts, 1930s rubber-hose cartoon style, each bolt a chunky zig-zag running left to right with 5 or 6 sharp bends and a pointed tip on the right end, golden yellow fill with a thin lighter golden highlight down the middle, thick even deep ink-blue outline, flat solid fills, each bolt isolated with space between them, plain pure white background, no shadow, no gradient, no texture, no clouds

3. Burst lines (replace the glow):
> A sheet of twelve separate cartoon shine rays, 1930s rubber-hose cartoon title card style, each ray a single tapered stroke that is thick at one end and pointed at the other, in three lengths, golden yellow fill with thick even deep ink-blue outline, flat solid fills, arranged in loose rows with plenty of space between each ray, plain pure white background, no shadow, no gradient, no texture, no star, no sun

**Picks (2026-10-13)**, out of 8 star sheets, 16 bolt sheets and 8 ray sheets, saved in `_refs/` and split by `tools/build-hero-rig.py jolt assets/mascots/incoming/_refs` into `assets/mascots/hero/hero-jolt-parts.svg`:
- `jolt-stars-recraft.svg` (was `...impact-bursts--19 (3).svg`): the jaggedest, most "POW" set, four different bursts. Runner-up: `...impact-bursts--19.svg`, a cleaner 8-point star.
- `jolt-bolt-recraft.svg` (was `...long-horizontal-cartoon- (15).svg`): long, flat, five small bends, pointed right tip, highlight stripe. Top bolt used. Runner-up: `(5)`, chunkier with a white halo.
- `jolt-rays-recraft.svg` (was `...shine-rays--193.svg`): bold straight tapered strokes in three lengths. Recraft drew 10, not 12. Runner-up: `(5)`, already arranged in a ring but uneven.

## Handstart style (2026-10-17)

A new Recraft custom style from our own finished art, used for every mascot from now on (replaces the hero custom style, which was built from Jamm and the glove before the hero existed). Sources in `assets/mascots/incoming/_refs/style-v2/`: hero idle, float and runner (recolored) plus the jolt stars. Details and the rig prompts are in `docs/mascot-rig-spec.md`.

## Rig pilot: magnifier (2026-10-17)

Handstart style, Style match **Precise**, palette `#1D3F66 #FFFFFF #A9BACD #E3A23B #F0C46E #B57A1E` (white ticked as background), 1:1, no reference.

- **Round 1** (the object prompt in `docs/mascot-rig-spec.md`): no faces, right colors, but flat icons: thin even line, no shade side, a solid ink rim, stiff proportions.
- **Round 2, chosen** (`_refs/magnifier-recraft.svg`, the left of two):

```
A single cartoon prop on its own in a 1930s rubber-hose cartoon style: a chunky round magnifying glass standing upright with a short stubby handle pointing straight down. A thick white rim around a big pale blue-grey glass lens with one curved white glint, a short chunky golden handle that bulges slightly in the middle, with a darker golden grip band. Every white shape has a blue-grey shade band along its left edge, every golden shape has a darker golden shade along its left edge, and the outline is thicker on the shaded left side. Bold thick dark hand-drawn outline with a slight organic wobble, soft squashy bouncy proportions, flat solid colors, no gradient, no texture. It is an inanimate object with no face, no eyes, no mouth, no arms, no legs. No ground shadow, centered with plenty of space around it, plain white background.
```

- **Fix:** Recraft drew "shade along the left edge" as an offset copy behind each shape. On the white rim that reads as thickness (good); on the golden handle the copy stayed golden and read as two handles. Cleaned by hand into `_refs/magnifier-clean.svg`: ghost handle removed, the outline masked to the rim, the handle outlined from its own fills, a darker golden stripe inside its left side. The blue-grey glass (not white) was picked so the white eyes show on it.
- **For the other objects:** describe golden shading as "a narrow darker golden stripe running down its left side, drawn inside its own outline, not a copy behind it".

## Rig kit: hands sheet (2026-10-17)

Handstart style, Precise, same palette, 16:9. Chosen: the second batch (`_refs/hands-recraft.svg`); the first was thin side-on emoji hands with tube cuffs.

```
A sheet of four separate white cartoon glove hands in a 1930s rubber-hose cartoon style, each one alone with plenty of space between them: an open flat hand with the fingers together, a hand pointing with the first finger, a thumbs-up fist, and an open hand waving with the fingers spread. Each glove has a thumb and three rounded fingers and a short golden cuff with a light golden stripe. Every white shape has a blue-grey shade band along its left edge, and the outline is thicker on the shaded left side. Bold thick dark hand-drawn outline with a slight organic wobble, soft squashy proportions, flat solid colors, no gradient, no texture, no faces, no arms. Plain white background.
```

- Split into `_refs/hands-clean/hand-{open,point,thumb,wave}.svg` with the **cuffs removed** (the hero's own hands have none; his band is the cuff) and the wrist outline closed. The cuff wording can be dropped from future hand prompts.
- Pointing is the best; the thumbs-up has busy curled fingers that may blur small. Reroll it alone, cuffless and simpler, if the browser-window gag needs it.

## Rig: lightbulb (2026-10-18)

Handstart style, Precise, the 6-colour palette (white as background), 1:1, no reference. Chosen: the pear-shaped one of two (`_refs/lightbulb-recraft.svg`); the other was a round ball bulb that read less as a lightbulb.

```
A single cartoon prop on its own in a 1930s rubber-hose cartoon style: a chunky classic lightbulb standing upright with its screw base at the bottom. A big round white glass bulb, completely empty inside with no filament and no wires, with a blue-grey shade band along its left edge like a thick side. A short chunky golden screw base with three rounded ridges and a small dark rounded tip at the very bottom. The golden base is one single solid piece with a narrow darker golden stripe running down its left side, drawn inside its own outline, not a copy behind it. The outline is thicker on the shaded left side. Bold thick dark hand-drawn outline with a slight organic wobble, soft squashy bouncy proportions, flat solid colors, no gradient, no texture. It is an inanimate object with no face, no eyes, no mouth, no arms, no legs. No ground shadow, centered with plenty of space around it, plain white background.
```

- The golden base still came out with its left strip the same golden (the ghost again, milder): fixed by recolouring those three strips darker golden in `tools/build-mascot-rig.py`. Golden parts seem to need this every time; plan on the recolour.

## Rig effect marks: sound waves and rays (2026-10-18)

The code-drawn arcs and rays looked too even next to Recraft's line, so both are Recraft art now, split into pieces by `tools/build-mascot-rig.py` and popped in by the player. Handstart style, Precise, the 6-colour palette (white as background), 16:9.

```
A sheet of separate cartoon sound wave marks in a 1930s rubber-hose cartoon style, the kind drawn coming out of a shouting megaphone. Three separate sets in a row, each set is three curved crescent arcs side by side, small, medium and large, like a closing bracket, opening to the left. Each arc is a chunky tapered crescent, thicker in the middle with rounded ends, golden with a light golden highlight stripe along it and a thick dark outline. Bold thick dark hand-drawn outline with a slight organic wobble, flat solid colors, no gradient, no texture, no megaphone, no text. Plain white background with plenty of space between every mark.
```

```
A sheet of separate cartoon light ray marks in a 1930s rubber-hose cartoon style, the short lines drawn around a lightbulb that has just switched on. Twelve separate rays in two rows, each a short chunky tapered dash, slightly different lengths, some straight and some with a gentle curve, golden with a light golden highlight stripe along one side and a thick dark outline. Bold thick dark hand-drawn outline with a slight organic wobble, flat solid colors, no gradient, no texture, no lightbulb, no text. Plain white background with plenty of space between every mark.
```

- **Sound waves, chosen:** the one-row sheet of seven graduated arcs (`_refs/soundwaves-recraft.svg`), clean with no ghost slivers. The megaphone uses arcs 3, 5 and 7 (`mp-wave-1..3`), so the waves widen as they travel.
- **Rays, chosen:** the ring of ten chunky teardrops (`_refs/rays-recraft.svg`). Seven are used (`lb-ray-1..7`), each turned to point away from the glass at the rig's angles; their mixed lengths are kept.

## Rig: computer, for browser-window (2026-10-18)

Handstart style, Precise, the 6-colour palette (white as background), no reference. Monitor and keyboard 1:1.

```
A single cartoon prop on its own in a 1930s rubber-hose cartoon style: a chunky rounded retro computer monitor standing upright on a short stubby stand, front view. The monitor body is white with a blue-grey shade band along its left edge like a thick side. Its screen shows one simple browser window filling the screen: a golden top bar with three small round white dots on the left and an empty white address bar, and a big completely empty white page below it. The golden top bar is one single solid piece with a narrow darker golden stripe along its left end, drawn inside its own outline, not a copy behind it. Bold thick dark hand-drawn outline with a slight organic wobble, soft squashy bouncy proportions, flat solid colors, no gradient, no texture. It is an inanimate object with no face, no eyes, no mouth, no arms, no legs, no keyboard, no text, no icons. No ground shadow, centered with plenty of space around it, plain white background.
```

```
A single cartoon prop on its own in a 1930s rubber-hose cartoon style: a chunky rounded computer keyboard seen from the front and slightly above, wide and short, with three rows of big rounded square keys and a long space bar. The keyboard body is golden with a narrow darker golden stripe along its front edge, drawn inside its own outline, not a copy behind it; the keys are white with a small blue-grey shade on their left side. Bold thick dark hand-drawn outline with a slight organic wobble, soft squashy proportions, flat solid colors, no gradient, no texture, no letters on the keys, no text, no computer. No ground shadow, centered with plenty of space around it, plain white background.
```

Typing hand (1:1); the pick was the only one of several with exactly three fingers and long creases:

```
A single white cartoon glove hand in a 1930s rubber-hose cartoon style, seen from directly above, palm down, resting flat as if on a keyboard, fingers pointing straight up the image. A round chunky back of the hand, a short thumb sticking out to the left side, and exactly three rounded fingers pointing up, spread apart with clear gaps between them so no finger touches another. No cuff, the wrist simply ending at the bottom. Every white shape has a blue-grey shade band along its left edge, and the outline is thicker on the shaded left side. Bold thick dark hand-drawn outline with a slight organic wobble, flat solid colors, no gradient, no texture, no keyboard, no face, no arm. Plain white background with plenty of space around it.
```

- Picks: the chunky monitor with the big screen (`_refs/monitor-recraft.svg`), the keyboard with three rows of big keys (`_refs/keyboard-recraft.svg`; the many-small-keys one was too busy at mascot size), the typing hand (`_refs/typing-hand-recraft.svg`).
- **Recraft and fingers:** asked for typing frames, Recraft drew the same hand three times, or four fingers. Count the fingers on every hand result.
- A standalone thumbs-up (`_refs/thumb-recraft.svg`, sideways wrist) was generated but its wrist met the rope arm at an angle; the upright hero-round one (`_refs/thumbs-recraft-2.svg`) is in the kit instead. The thumbs-up gag is parked.

## Lightbulb gag: sunglasses (2026-10-18)

Handstart style, Precise, the 6-colour palette (white as background), 1:1. Chosen: the first of four (`_refs/sunglasses-recraft.svg`), two near-touching ovals closest to the hero's eye pair.

```
A single pair of chunky cartoon sunglasses on its own in a 1930s rubber-hose cartoon style, seen straight from the front, no arms or temples showing. Two big tall oval lenses touching each other in the middle with a tiny bridge, the lenses solid dark navy with one small curved white glint on each, and a thick golden frame around both lenses. Bold thick dark hand-drawn outline with a slight organic wobble, flat solid colors, no gradient, no texture, no face, no head. Plain white background with plenty of space around it.
```

## Rig: speech-bubble (2026-10-18)

Handstart style, Precise, the 6-colour palette (white as background), 1:1, no reference. The bubble and its tail are two generations, so the tail can wag. Asked for both in one drawing, Recraft fuses the tail into the outline; asked for "the tail of a speech bubble alone", it draws whole bubbles. Leaving the words "speech bubble" out of the tail prompt is what worked.

```
A single cartoon prop on its own in a 1930s rubber-hose cartoon style: a big chunky rounded speech bubble body with no tail, a soft rounded rectangle shape, noticeably wider than tall, about four to three, its outline a fully closed smooth shape with nothing sticking out. The bubble is white with a blue-grey shade band along its left edge like a thick side, and it is completely empty inside with no text, no dots and no lines. The outline is thicker on the shaded left side. Bold thick dark hand-drawn outline with a slight organic wobble, soft squashy bouncy proportions, flat solid colors, no gradient, no texture. It is an inanimate object with no face, no eyes, no mouth, no arms, no legs. No ground shadow, centered with plenty of space around it, plain white background.
```

```
A single cartoon shape on its own: a short chunky curved horn shape, like a fat rounded thorn or a plump comma, wide and flat across the top, curving down and to the left to a soft rounded point. Only this one shape, nothing attached to it, nothing above it. It is plain white with no shade, a closed shape with its own full outline on every side. Bold thick dark hand-drawn outline with a slight organic wobble, soft squashy bouncy proportions, flat solid colors, no gradient, no texture. It is an inanimate object with no face, no eyes, no mouth, no arms, no legs. No ground shadow, centered with plenty of space around it, plain white background.
```

- **Bubble, chosen:** the squarer one of four (`_refs/speech-bubble-recraft.svg`), about 4:3, room for big eyes plus the typing dots. Its shade band came out a dark navy-grey and is recoloured blue-grey in the build. Recraft put a 0.842 transform on every path; the build drops it and the rig works in the paths' own space.
- **Tail, chosen:** the long sweeping horn from the second run (`_refs/speech-bubble-tail-recraft.svg`), one clean outline with a cap on top. It came out with a capped top every time; the cap hides inside the bubble. Its outline was the closest to the bubble's; it is used at 0.45 and its outline thickened to match.

## Rig: finish-flag (2026-10-18)

Handstart style, Precise, the 6-colour palette (white as background), 1:1, no reference. The pole and the cloth are two generations; the rig bends the flat cloth with a wave in code.

```
A single cartoon prop on its own in a 1930s rubber-hose cartoon style: a tall chunky flagpole standing upright with no flag on it, a thick rounded white pole with a blue-grey shade band along its left edge like a thick side, a round golden ball on top, and a short chunky rounded golden base at the bottom that it stands on. The golden parts are each one single solid piece with a narrow darker golden stripe down their left side, drawn inside their own outline, not a copy behind it. The outline is thicker on the shaded left side. Bold thick dark hand-drawn outline with a slight organic wobble, soft squashy bouncy proportions, flat solid colors, no gradient, no texture. It is an inanimate object with no face, no eyes, no mouth, no arms, no legs, no flag, no cloth. No ground shadow, centered with plenty of space around it, plain white background.
```

```
A single cartoon prop on its own in a 1930s rubber-hose cartoon style: a chunky checkered flag cloth lying perfectly flat, seen straight from the front, a soft rounded rectangle noticeably wider than tall, with no folds and no wave. It is made of big chunky square tiles, only four across and three down, twelve squares in total, alternating golden and white like a checkerboard. Every square has its own thick dark outline, so the cloth looks like a grid of chunky tiles, and a thicker dark outline runs around the whole cloth. Bold thick dark hand-drawn outline with a slight organic wobble, soft squashy proportions, flat solid colors, no gradient, no texture, no pole, no stick, no text. It is an inanimate object with no face, no eyes, no mouth, no arms, no legs. No ground shadow, centered with plenty of space around it, plain white background.
```

- **Pole, chosen:** the tallest, slimmest of four (`_refs/finish-flag-pole-recraft.svg`), with a collar over a rounded foot. Its ball came with a proper darker golden stripe; only the base's left end needed recolouring.
- **Cloth, chosen:** the wide one with three rows (`_refs/finish-flag-cloth-recraft.svg`), 5 by 3 rather than the 4 by 3 asked for. An earlier ink-and-white run was dropped: the ink squares merged with the outline and read as print, every grid count was off, and a face would not read on ink squares.

## Rigs: compass, clipboard, stopwatch (2026-10-18)

Handstart style, Precise, the 6-colour palette (white as background), 1:1 (ticks 16:9), no reference. The moving parts (needle, hand, ticks) are their own generations, and their prompts avoid naming the object so Recraft does not draw the whole thing.

```
A single cartoon prop on its own in a 1930s rubber-hose cartoon style: a chunky round pocket compass seen straight from the front, a thick round golden case with a small round loop on top, and a big round white dial inside with a blue-grey shade band along its left edge like a thick side. The dial has only four small dark tick marks at the top, bottom, left and right, and is otherwise completely empty, with no needle, no letters and no numbers. The golden case is one single solid piece with a narrow darker golden stripe down its left side, drawn inside its own outline, not a copy behind it. Bold thick dark hand-drawn outline with a slight organic wobble, soft squashy bouncy proportions, flat solid colors, no gradient, no texture. It is an inanimate object with no face, no eyes, no mouth, no arms, no legs. No ground shadow, centered with plenty of space around it, plain white background.
```

```
A single cartoon shape on its own: a long thin chunky diamond-shaped pointer lying flat, pointing straight up, one half golden and the other half white, with a small round dark dot in its middle. Only this one shape, nothing around it. Bold thick dark hand-drawn outline with a slight organic wobble, flat solid colors, no gradient, no texture. It is an inanimate object with no face, no eyes, no mouth, no arms, no legs. No ground shadow, centered with plenty of space around it, plain white background.
```

```
A single cartoon prop on its own in a 1930s rubber-hose cartoon style: a chunky clipboard standing upright, front view, a golden board with soft rounded corners, a chunky rounded white clip at the top center, and a white sheet of paper on the board with a blue-grey shade band along its left edge. The top half of the paper is completely empty. The bottom half has exactly three rows, each a small empty square box on the left with one short thick line beside it. No ticks, no text, no letters. The golden board is one single solid piece with a narrow darker golden stripe down its left side, drawn inside its own outline, not a copy behind it. Bold thick dark hand-drawn outline with a slight organic wobble, soft squashy bouncy proportions, flat solid colors, no gradient, no texture. It is an inanimate object with no face, no eyes, no mouth, no arms, no legs. No ground shadow, centered with plenty of space around it, plain white background.
```

```
A sheet of separate chunky cartoon check marks in a 1930s rubber-hose cartoon style, six ticks in two rows, each a bold tapered tick shape, golden with a light golden highlight stripe along it and a thick dark outline. Bold thick dark hand-drawn outline with a slight organic wobble, flat solid colors, no gradient, no texture, no boxes, no paper, no text. Plain white background with plenty of space between every mark.
```

```
A single cartoon prop on its own in a 1930s rubber-hose cartoon style: a chunky round stopwatch seen straight from the front, a big round white body with a blue-grey shade band along its left edge like a thick side, a chunky golden push button on a short stem at the top, and a small golden side button at the top right. The face has a ring of small dark tick marks around its edge and is otherwise completely empty, with no hands, no numbers and no text. The golden buttons each have a narrow darker golden stripe down their left side, drawn inside their own outline, not a copy behind it. The outline is thicker on the shaded left side. Bold thick dark hand-drawn outline with a slight organic wobble, soft squashy bouncy proportions, flat solid colors, no gradient, no texture. It is an inanimate object with no face, no eyes, no mouth, no arms, no legs. No ground shadow, centered with plenty of space around it, plain white background.
```

```
A single cartoon shape on its own: a long thin chunky pointer arrow pointing straight up, a tapered golden bar with a rounded pointed tip and a round golden disc at its base with a small dark dot in its middle. Only this one shape, nothing around it. Bold thick dark hand-drawn outline with a slight organic wobble, flat solid colors, no gradient, no texture. It is an inanimate object with no face, no eyes, no mouth, no arms, no legs. No ground shadow, centered with plenty of space around it, plain white background.
```

- **Picks:** the compass whose case has a proper darker golden side and a shaded dial (`_refs/compass-recraft.svg`); the chunkiest needle with the curvy middle (`_refs/compass-needle-recraft.svg`, its centre line recoloured ink from a muddy olive); the clipboard with three boxes, the biggest empty top and the hinged clip (`_refs/clipboard-recraft.svg`, its white ghost strip recoloured golden); the evenly sized ticks (`_refs/ticks-recraft.svg`); the cleanest stopwatch (`_refs/stopwatch-recraft.svg`, the buttons' left ends recoloured darker golden); the thickest-lined hand (`_refs/stopwatch-hand-recraft.svg`).
- Rejected along the way: clipboards with four boxes or a line across the top, a stopwatch with a navy side, one darker golden all over.

## Rig: block, for step 3 (2026-10-18)

Replaced the stopwatch at step 3 ("Start building"); the stopwatch moved to About. Handstart style, Precise, the 6-colour palette (white as background), 1:1, no reference. One drawing: the golden stacking blocks are the same cube recoloured in the build.

```
A single cartoon prop on its own in a 1930s rubber-hose cartoon style: one chunky soft rounded toy building block cube, seen from slightly above at a three-quarter angle so its top, its front and its right side all show. The front face is white and big, the top face is white, and the right side is a blue-grey shade, each face its own shape with a dark outline between them. Plain smooth block with no studs, no bumps, no letters, no numbers, no pictures on it. Bold thick dark hand-drawn outline with a slight organic wobble, the outline thicker on the shaded side, soft squashy bouncy proportions, flat solid colors, no gradient, no texture. It is an inanimate object with no face, no eyes, no mouth, no arms, no legs. No ground shadow, centered with plenty of space around it, plain white background.
```

- **Chosen:** the chunky rounded one with a thick outline (`_refs/block-recraft.svg`); its side came out slate grey and is recoloured blue-grey. Skipped: a too-wobbly one that would not stack, and one with inset panels that read as a dice.

## Rig: power-button (2026-10-18)

Handstart style, Precise, the 6-colour palette (white as background), 1:1, no reference.

```
A single cartoon prop on its own in a 1930s rubber-hose cartoon style: a big chunky round push button seen straight from the front, a thick round golden ring base with a narrow darker golden stripe down its left side, drawn inside its own outline, not a copy behind it, and a big round white button cap sitting inside it with a blue-grey shade band along its left edge. A small chunky dark power symbol, a circle open at the top with a short line through the gap, sits near the top of the cap, leaving the rest of the cap empty. Bold thick dark hand-drawn outline with a slight organic wobble, the outline thicker on the shaded side, soft squashy bouncy proportions, flat solid colors, no gradient, no texture, no text. It is an inanimate object with no face, no eyes, no mouth, no arms, no legs. No ground shadow, centered with plenty of space around it, plain white background.
```

- Recraft read it as a dome in a ring, seen slightly from above, in most results. **Chosen:** the upright white dome standing in a golden ring (`_refs/power-button-recraft.svg`), its cap a separate piece inside the ring so it can press down. Skipped: tilted ones, a flat puck with no front for a face, an egg-cup one that read less as a button.

## Hero duo: palm side and clasp (2026-10-18)

Handstart style, Precise, the 6-colour palette (white as background), 1:1, no reference. The duo itself is the hero's existing art; these are the only new pieces.

```
A short wide chunky white cartoon mitten glove seen from the palm side, standing upright like a body, about as wide as it is tall, with a fat thumb sticking out to the right side and exactly three short chunky rounded fingers at the top leaning slightly to the left, the palm open and flat facing the viewer with two short curved crease lines. A wide thick golden band runs around the bottom, as wide as the glove itself, with a light golden stripe along its top edge, and the glove ends at the band. Only the glove and its band: no face, no eyes, no mouth, no arms, no legs, no shoes, no number. A blue-grey shade band along its left edge, the outline thicker on the shaded side. Bold thick dark hand-drawn outline with a slight organic wobble, soft squashy bouncy proportions, flat solid colors, no gradient, no texture, no text. No ground shadow, centered with plenty of space around it, plain white background.
```

```
A single cartoon prop on its own in a 1930s rubber-hose cartoon style: two small chunky white cartoon glove hands gripping each other in a handshake, seen from the side, both white with a blue-grey shade band, each with a thumb and three rounded fingers, the wrists simply ending, no cuffs, no arms. Bold thick dark hand-drawn outline with a slight organic wobble, soft squashy bouncy proportions, flat solid colors, no gradient, no texture, no text. It is an inanimate object with no face, no eyes, no mouth, no arms, no legs. No ground shadow, centered with plenty of space around it, plain white background.
```

- **Palm:** a first prompt ("a white cartoon glove seen from the palm side") came out tall and narrow or with four fingers; asking for "a short wide chunky mitten, about as wide as it is tall" with a wide band got the pick (`_refs/hero-palm-recraft.svg`): a thumb and three fingers, thumb on the right (the side it shows on when he turns over). Count the fingers: half of each batch had four.
- **Clasp:** the first of two (`_refs/clasp-recraft.svg`), short white sleeve stubs at each end where the arms join; its darker blue-grey shade is recoloured to the palette's.
- Dropped along the way: a standalone handshake prop and the hero "stop" pose (glove-stop and its Services slot are gone).

## Steps relay track (2026-10-14, not run yet)
For the "How we Handstart:" lane, where the hero runs along the line through steps 1 to 4. Right now the lane is code (a hairline with ticks, a golden trail behind him). Hero custom style, palette `#1D3F66 #FFFFFF #A9BACD #E3A23B #F0C46E`, 16:9, separate pieces so the code can repeat, stretch and place them. Drop picks in `assets/mascots/incoming/_refs/`.

1. Track pieces:
> A sheet of separate cartoon running track pieces, 1930s rubber-hose cartoon style: one long straight horizontal strip of running track with a single white lane line along it, three small numbered lane marker posts, a starting block, and a finish line post pair with a loose ribbon between them, golden and light golden fills with white details, thick even deep ink-blue outline, flat solid fills, each piece isolated with plenty of space between them, plain pure white background, no shadow, no gradient, no texture, no people, no text

2. The baton (for step 4's handoff):
> A sheet of three separate cartoon relay batons, 1930s rubber-hose cartoon style, each a short chunky cylinder with rounded ends, golden yellow fill with a light golden highlight stripe, thick even deep ink-blue outline, one level, one tilted, one with three small motion lines behind it, flat solid fills, each isolated with plenty of space, plain pure white background, no shadow, no gradient, no texture, no hands

## Case files: manila folder (2026-10-19)

Handstart style, Precise, palette with white ticked, 1:1, no reference image. Picked: top row, second from the left (`_refs/folder-recraft.svg`): the most upright, straight-on folder, clean outline, tab part of the folder, two sheets peeking out, no text. The open-folder prompt was not needed (gag "fan out" uses closed folders only).

```
A single cartoon prop on its own in a 1930s rubber-hose cartoon style: a closed manila file folder seen straight from the front, standing upright, a little wider than it is tall, light golden with a short rounded tab sticking up on the top left, the top edges of two white sheets of paper peeking out above the folder's front flap. One flat darker golden shade along its left side. Bold thick dark hand-drawn outline with a slight organic wobble, soft squashy proportions, flat solid colors, no gradient, no texture, no text, no labels. It is an inanimate object with no face, no eyes, no mouth, no arms, no legs. No ground shadow, centered with plenty of space around it, plain white background.
```
