# Mascot prompts (Midjourney)

Every prompt that produced approved art goes here, with the date and the image it made. Prompts that only lived in a chat have been lost before; this file is the record.

## Style and colors

- **Direction A, modernized:** rubber-hose energy (bouncy rounded shapes, bendy limbs, a classic four-digit cartoon glove) drawn as flat vector: even outline, flat fills, one shade, no texture or grain. Keep clear of Mickey, Cuphead, Pikachu and the Jamm characters.
- **Colors are Golden hour** (see `CLAUDE.md`): outline in ink `#1D3F66`, cuff in golden `#E3A23B`, shade in a soft blue-grey. Midjourney drifts on exact colors, so correct them in cleanup.
- **Blob set:** Deeper earth: terracotta `#D2694A`, olive `#7E9F6B`, plum `#9C7AB0`, clay pink `#CF7A86`. The hero's bib is terracotta.
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

## 2. Hero (hero-bib-hand)

The site's lead mascot: a white glove character with a face on the back of the hand, standing on two fingers like legs, mid-sprint, wearing a racing bib with a 1. It sits beside "Let's give your business a hand" on the homepage.

```
flat 2D vector-style cartoon illustration with a subtle 1930s rubber-hose influence, a cute white cartoon glove hand character with a friendly happy face on the back of the hand, standing upright on two of its fingers like legs and mid-sprint, leaning forward, wearing a small plain terracotta racing bib with a bold number 1, golden cuff band, white eyes with large deep ink-blue pupils and a small white crescent highlight, thick even deep ink-blue outline with rounded corners, flat solid fills, one flat soft blue-grey shade, full body, centered, plain pure white background --ar 1:1 --v 7 --oref [APPROVED GLOVE URL] --ow 150 --sref [JAMM URLS] --no shadow, ground, gradient, 3d, texture
```

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
