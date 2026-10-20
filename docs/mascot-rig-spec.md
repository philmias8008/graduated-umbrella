# Mascot rig spec (2026-10-17)

How the six fully animated mascots are drawn, split and played. The approach follows Jamm (jamm.co): each character is a set of parts on a short loop, with an idle and one gag. Jamm uses After Effects and Lottie; we do the same in plain JS, the way the hero already works, so it stays homepage-safe.

## Tiers (decided 2026-10-17)

Recraft cost is per character, not per appearance: every showing reuses the same drawing.

| Tier | Characters | Where it animates |
|---|---|---|
| **Rig** (this spec) | browser-window, magnifier, megaphone, lightbulb | Homepage "Stop drifting. Start building." and the Services panels |
| | speech-bubble (built 2026-10-18) | Services panel 5 |
| | finish-flag (replaces `baton`, built 2026-10-18) | Homepage step 4, where the steps-lane hero runs to |
| | compass, clipboard, block (added and built 2026-10-18) | Homepage steps 1 to 3; clipboard also on Services and the coming-soon page |
| | stopwatch (built for step 3, moved 2026-10-18) | About, beside the daily-counts ticker |
| | power-button (built 2026-10-18) | Homepage "Already know" path card, About pull-line, Contact "Send it" button |
| **Rig** (2026-10-19) | case-files | The Case Studies hero, beside the "Latest Work" heading: the magnifier sifting a floating stack of manila folders (`CASE_FILES`). It replaced the bar-chart, dropped because it looked too close to Google Analytics (the podium and foam finger were dropped too: a podium ranks the work; the individual case study pages have no mascots) |
| **Hero thumbs-up** (2026-10-19) | hero-thumbs | The thank-you page: the victory drawing posed into two thumbs-up by his chest, gag off for now (`HERO_THUMBS`); `hero-cheer` (`HERO_CHEER`, the cheering version) is on the dev page |
| **Hero duo, parked** (2026-10-19) | high-five, handshake | Dev page only, until there is art for them (see "Artist brief") |
| **Dropped** (2026-10-18) | ribbon | Not drawn: About was getting crowded (the bar-chart left About too, but keeps its Greenlife slot) |
| **Still** | any of the above | Homepage finale row, Services tray copies, the magnifier in "How to spot template work", any second showing on a page |

The baton prop in "Steps relay track" (`docs/mascot-prompts.md`) is dropped with it. `piggy-bank`, `bullseye` and `green-flag` have no slots and are not drawn.

## The approach: Recraft draws the object, the rig adds the character

Every rigged mascot is an **object with no face and no limbs**, drawn by Recraft. The rig adds the parts that make it a member of the hero's family, from a shared kit:

- **Eyes:** the hero's two touching ovals with clipped round pupils (`hr-eye-*` in `assets/mascots/hero/hero-parts.svg`), scaled per character. Blink and glance come free.
- **Mouth:** drawn in code as an ink curve, so it can change shape: closed smile (rest), open "o" (surprise), wide open smile without teeth (celebration only, as decided for the hero).
- **Arms and legs:** rubber-hose strokes from `hs-hero-rig.js` (`hose()`), the same core and line widths as the hero, scaled.
- **Hands and feet:** the hero's white fists and golden sneakers. An open hand and a pointing hand join the kit (one Recraft sheet, see "Prompts").
- **Effect marks:** speed lines, sound arcs, rays, sparkles: ink or golden strokes drawn on with `stroke-dashoffset`, plus the Recraft impact stars (`hj-star-*`) for big moments.

Why: an object alone is one or two clean shapes, so splitting it is trivial (the hero needed per-path surgery because limbs, face and body were one drawing). The face and limbs are identical across all six and the hero, so the family reads at a glance. A new pose never needs a new generation.

**Fallback:** if a pasted face looks stuck on for a character, generate that one with a face and split the eyes out as for the hero (`eyes` entries in `tools/build-hero-rig.py`).

## Canvas and files

- Every rig works in a **1024 square**, ground line at y 860 (84%, the same line raster mascots stand on), centered, with room above for arcs and rays. The loader's blob and shadow sit behind as usual: **never draw them in the art.**
- `tools/build-mascot-rig.py {id} <recraft svg>`: recolors to the palette (as `build-hero-rig.py` does), splits the object into its named parts, writes `assets/mascots/rig/{id}-parts.svg`, and renders `assets/mascots/rig/{id}-still.svg`, a flat drawing of the rest pose for the still tier, reduced motion and no-JS.
- `assets/js/hs-mascot-rig.js`: one player for every rigged mascot. Plain JS, no libraries. Each character is a small definition: anchor points (eye spot, shoulders, hips), its parts, and its timeline.
- `manifest.json`: `"type": "rig"`. The existing loader mounts the rig in rig slots and the still SVG when the slot is `data-state="static"`, so markup changes are just the state attribute.

## Playback rules

- **Loop like Jamm:** about 5s per loop; about 3.5s of idle (breathe, blink, small glance), then one gag of about 1.5s, then settle back to rest. Each instance starts at a random point so a row never moves in sync.
- **Hover (pointer) or tap** plays the gag right away, then the loop carries on.
- **Shadows (2026-10-18):** most rigs use the loader's CSS shadow on the shared ground line. A rig whose footing is elsewhere draws its own inside its SVG (`ownShadow: true` plus a `shadow` spot; the `Shadow` helper), and the loader's is hidden for it. The sun is overhead: the shadow sits right under whatever touches the ground and shrinks and fades as it lifts off. The finish flag has one under its base only (the cloth is in the air). The block has one under its footprint, and the golden block landing beside it gets one that grows and darkens as it falls; the top block has none.
- **Only on screen:** one shared `requestAnimationFrame` drives every rig, and an IntersectionObserver pauses those off screen. Hidden tabs stop.
- **Reduced motion:** the rest pose, no loop, no hover gag.
- **No JS:** the still SVG.
- **Homepage:** the pillars arrive one at a time, so each one plays its gag once on arrival, then loops.
- **Services:** all five panels loop. The tray copies are stills.

## The six characters

Parts listed are what Recraft must draw as separate shapes. Everything else comes from the kit.

### magnifier (Search) · olive blob · pilot

- **Object:** a round magnifying glass, a thick white rim with a blue-grey thickness side, pale blue-grey glass with one curved white glint, a golden handle with a darker golden grip band and shade stripe. Upright, handle down. Art: `_refs/magnifier-recraft.svg` (prompt in `docs/mascot-prompts.md`).
- **Parts:** `rim+glass` (one), `glint`, `handle`.
- **Character (as built, 2026-10-17):** no arms, no legs, no shoe: it bounces on the end of its handle with a small squash on landing. The hero's eyes sit **inside the lens** at 2.2 times the hero's size, with a code-drawn mouth below, all clipped to the glass.
- **Idle:** bounces, blinks; the eyes drift left, then sweep back and reach the middle just as the gag starts (the scan is timed to the gag).
- **Gag "found it" (1.8s, about every 1.8s):** leans in (grows and tilts), squints, then the eyes pop and ride up while the mouth opens to an "o", and the glint slides off and sweeps back across the glass. The eyes stay centred throughout.
- **Still:** the gag frozen at its middle (`still: 0.5`): eyes popped, mouth open.

### megaphone (Marketing) · terracotta blob · built 2026-10-18

- **Object:** a side-on megaphone pointing right: golden cone with a white highlight along the top and a darker golden shade strip along the bottom (recoloured from Recraft's golden ghost), a golden back knob with its own darker shade, a white rim around a blue-grey bell, a white pistol-grip handle. Art: `_refs/megaphone-recraft.svg`.
- **Parts:** `mp-body`, `mp-c-face` (the cone), `mp-wave-1..3` (arcs 3, 5 and 7 of `_refs/soundwaves-recraft.svg`).
- **Character:** no limbs and **no mouth** (the bell is its mouth). Hero eyes at 2.3 times on the wide part of the cone.
- **Idle:** no hop: it sways on its handle (`sway: { period: 2.6, angle: 4 }`) with a small breathing swell. Its pupils dart between spots (`darts`), each move taking `dartMove` 0.22s and holding 0.8 to 1.4s. 0.45s before the shout they go to the middle and it blinks twice.
- **Gag "shout" (1.9s):** rears back, then lunges forward while three Recraft sound waves pop out of the bell one after another, travel and fade. Eyes stay fully open.
- **Still:** mid-shout, waves out (`still: 0.5`).

### lightbulb (Strategy) · clay pink blob · built 2026-10-18

- **Object:** a classic pear-shaped lightbulb: white glass with a blue-grey shade side running into the neck, a golden screw base of three ridges with a darker golden shade side, a small ink tip. No filament (the face goes on the glass). Art: `_refs/lightbulb-recraft.svg`; Recraft's base strips came out golden and are recolored to darker golden in the build (no ghost surgery needed).
- **Parts:** `lb-body` (the whole drawing), `lb-lit` (the glass light golden, its shade golden, faded in by the player), `lb-c-face` (the glass, the face clip).
- **Character:** no limbs. Hero eyes at 2.4 times on the glass, code mouth below.
- **Idle:** a waddle: lower, slower hops (`hop: { period: 1.25, height: 45, rock: 6 }`), each tipping about 6 degrees the opposite way to the last. The pupils rest a little left and up (`lookRest`), glide to the true middle of the eye over the last 0.6s, and the gag starts as they arrive.
- **Gag "too bright" (2.6s, reworked 2026-10-18 so it differs from the magnifier):** two flickers, it switches on (glass glows, a jump and stretch, seven Recraft rays pop out), then Recraft sunglasses (`lb-shades`, from `_refs/sunglasses-recraft.svg`) snap on over its eyes (popping in from a touch too big) and it smirks (a one-sided code mouth); the eyes switch off under the shades so they never show between the lenses; then the shades snap off and it dims.
- **Still:** lit, rays out, shades on, smirking (`still: 0.66`).

### browser-window (Websites & Shopify) · plum blob · built 2026-10-18 as a computer

- **Changed from the plan:** a computer typing at its keyboard instead of a bare window (Aidan's idea): it reads instantly as "websites", and as the one character with hands it varies the limbless set.
- **Art:** the monitor (`_refs/monitor-recraft.svg`: white body, golden browser bar with dots and address bar, white stand; its off-palette navy side and stand shade recoloured to blue-grey), the keyboard (`_refs/keyboard-recraft.svg`: golden body, 22 separate keys; its front strip recoloured darker golden), the typing hand (`_refs/typing-hand-recraft.svg`). Built by `tools/build-mascot-rig.py computer` (and `kit` for the hand).
- **Typing hands:** one Recraft hand seen from above, palm down, thumb and three fingers, cut along its creases into a palm (with the thumb) and three fingers (`mk-type-*`). Each finger squashes toward its knuckle on its own rhythm (2.4 to 3.7 taps a second), the way Jamm's typing hands move each finger separately. The right-hand drawing is used as is on the left and mirrored on the right, so both thumbs sit inside. Arms stay still; the keys stay still.
- **Keyboard:** Recraft drew the space bar at the front; the key layout is moved front to back (`keyRows`) so the space bar sits by the monitor, with the body and its front edge left as drawn.
- **Idle:** typing at one steady pace, the monitor bobbing a touch. Eyes watch the hands, drifting, and glance up every few seconds.
- **Gag "launch" (2.6s):** a golden loading bar fills the address bar (Recraft's own bar; only a flat fill moves) while the eyes follow it, then the screen flashes and glows light golden, the eyes pop and it breaks into a wide open grin (the celebration mouth, no teeth; the other two do the "o"). Typing never speeds up or stops.
- **Tried and parked:** a thumbs-up at the end (the upright hero-round hand, `mk-hand-thumbup` in the kit), point/fist flipping for typing, and finger frames from Recraft (it kept drawing four fingers).
- **Still:** screen lit, bar full, grinning (`still: 0.76`).

### speech-bubble (Services panel 5, Retention & General Presence) · plum blob · built 2026-10-18

- **Object:** a rounded cartoon speech bubble, white with a blue-grey shade band down its left side, and its tail at the bottom left. The two pieces were drawn in separate generations: `_refs/speech-bubble-recraft.svg` and `_refs/speech-bubble-tail-recraft.svg` (prompts in `docs/mascot-prompts.md`). Built by `tools/build-mascot-rig.py speech-bubble`.
- **Parts:** `sb-ink`, `sb-white`, `sb-shade` and `sb-c-face` (the bubble), plus `sb-tail-ink` and `sb-tail-white`. The player layers both inks under both whites. The tail's capped top sits inside the bubble, so where its neck crosses the bubble's bottom edge the white covers the line and the two outlines merge, at any wag angle.
- **Character:** no limbs, which drops the planned arms to match the rest of the set. Hero eyes at 2.9 times and a code mouth. It floats a little above the ground line.
- **Idle:** a slow float (`float: { period: 2.6, height: 38 }`) with a slight tilt and breath. The tail wags gently. The pupils go back and forth between two spots (`chat`), like someone following a conversation, then come to the middle 0.5s before the gag.
- **Gag "typing" (3s):**
  1. The face slides aside and shrinks a little.
  2. Three ink dots pop in and bounce in turn: the typing indicator. The eyes watch them.
  3. The dots gather and pop into a golden "!", with a jolt, a tail flick, the eyes popping and a small "o" mouth.
  4. The "!" rises out over the top of the bubble and fades, while the face slides back chattering (the mouth flaps open and shut).

  The "!" is drawn in code for now, ink outlined and golden; a Recraft one can replace it.
- **Still:** typing, with the face aside and the dots out (`still: 0.4`).

### finish-flag (homepage step 4, replaces baton) · olive blob · built 2026-10-18

- **Changed from the plan:** Recraft draws the cloth too, not code, so it keeps the hand-drawn line. The checks are **golden and white**, each square outlined, not ink and white: ink squares merged into the outline and looked printed, and an ink mouth would vanish on them.
- **Object:** a white pole with a blue-grey shade band, a golden ball on top and a golden collar and base (`_refs/finish-flag-pole-recraft.svg`; the base's left end is recoloured darker golden), and a flat checkered cloth of 5 by 3 outlined tiles (`_refs/finish-flag-cloth-recraft.svg`). Prompts in `docs/mascot-prompts.md`. Built by `tools/build-mascot-rig.py finish-flag`, which also copies two of the hero's impact stars (`hj-star-1`, `hj-star-3`) in as `ff-star-1/2`.
- **Parts:** `ff-pole`, `ff-cloth` (its silhouette and fifteen tiles), `ff-star-1/2`.
- **The wave:** the player copies the cloth's paths and rewrites every point every frame (`FINISH_FLAG.bend`). A travelling sine lifts and drops each point, growing from nothing at the pole to full at the free end, and pulls the free end in a little as it bends. The cloth sits behind the pole, so the join never shows.
- **Character:** no limbs (the planned arm and legs dropped to match the set). Hero eyes at 1.85 times and a code mouth, placed on the cloth and carried by the wave, tipping with its slope.
- **Idle:** the cloth flutters and the pole sways a touch. Its eyes look left down the track, where the runner comes from, glancing back every few seconds.
- **Gag "finish" (2.2s):** a crouch, then a jump. The cloth whips hard and fast, two impact stars pop off its free end, and the eyes pop over a wide grin.
- **Cue:** the slot carries `data-gag-cue`, so the loader mounts it with its own timer off (`{ idle: 0 }`). The homepage steps script calls its `gag()` `FINISH_LEAD` (450ms) before the runner reaches the end of the lane, so the stars pop as he arrives, and holds step 4 `FINISH_HOLD` (1.6s) longer before looping back to step 1. Hover or tap also plays it.
- **Still:** mid-whip, stars out, grinning (`still: 0.36`).

### compass, clipboard, stopwatch (homepage steps 1 to 3) · built 2026-10-18

Added to the rig tier so the four steps are a matched set. Same recipe: Recraft objects with no face or limbs, moving parts as their own generations (prompts and picks in `docs/mascot-prompts.md`), built by `tools/build-mascot-rig.py {compass|clipboard|stopwatch}`. All limbless. Each plays its gag once 350ms after its step fades in (`updateStepMascot` in the homepage steps script), then idles on its own timer; the finish flag keeps its runner cue.

- **compass (step 1, "Get your bearings"):** a golden pocket compass (`cp-body`) with a Recraft needle (`cp-needle`, outline thickened, turning on the dial behind the eyes). Idle: it turns this way and that, searching; the needle swings after it on a wobbly spring; the eyes follow the needle's tip. Gag "found it" (2.4s): the needle spins two turns, slowing, the eyes going round with it and the mouth an "o"; it snaps to a heading with a wobble, the lightbulb's Recraft rays pop, it jumps, the eyes pop. Still: settled, rays out (`still: 0.72`).
- **clipboard (step 2, "Make your list", renamed from "Set your direction" 2026-10-18):** a golden board, white paper with three empty boxes (`cb-body`; the board's white ghost strip recoloured golden), face on the paper's top half, three Recraft ticks (`cb-tick-1..3`). Idle: a gentle rock; the eyes read along each row, then down. Gag "all set" (2.6s): a tick pops into each box in turn, leaning out of it like a hand-drawn one, with a nudge each, the eyes snapping to each box; then a proud hop and a grin. Still: all ticked, grinning (`still: 0.74`). The homepage "Not sure yet" path-card copy animates too (Aidan, 2026-10-18, to match the moving power button beside it), with `data-still="rest"` so reduced motion shows the unticked list.
- **block (step 3, "Start building", replaced the stopwatch the same day):** a cube in three-quarter view (`_refs/block-recraft.svg`): `bk-white` wears the face on its front, `bk-gold` is the same drawing recoloured (golden front, light golden top, darker golden side); the slate side Recraft drew is recoloured blue-grey. Each carries the middle of its bottom face and of its top face (`data-bx/by`, `data-tx/ty`) so blocks sit beside and on top of each other. Idle: a jelly wobble, squashing and leaning, the eyes glancing up now and then. Gag "build" (3.2s, reworked the same day so it builds rather than balances): two golden blocks the same size fall into place, one flush beside it (covering its shaded side) and one on top across both, making a small pyramid. Each landing squashes what it lands on, and the eyes jolt but never squint. The whole build slides left as it starts so the pyramid ends up centred. The pyramid gives a proud hop and it grins; then the two golden blocks pop away, the top one first, and it slides back. Placement uses the cube's edges measured from the drawing (`across` along the bottom of the front face, `up`). Still: the pyramid built, grinning (`still: 0.6`).
- **stopwatch (built for step 3, now on About beside the ticker):** a white stopwatch with golden buttons (`sw-body`); the top button is cut from the one outline with a clip (`sw-button`) so it can press down; a Recraft hand (`sw-hand`) behind the eyes. Idle: the hand ticks round a quarter-hour every half second, each step landing with an overshoot, the body twitching on the tick; the eyes follow the hand's tip. Gag "go!" (2.2s): the eyes look up at the button, it presses down, the stopwatch jumps, the hand whips one full turn, rays pop, the mouth an "o". Still: button down, rays out (`still: 0.42`).

### power-button · built 2026-10-18, reworked the same day with arms

- **Object:** a flat white cap with the power symbol on top, in a tall golden base (`_refs/power-button-recraft.svg`). The first version was a dome whose face sat on the cap, so pressing its own button meant poking its face; that drawing is kept as `_refs/power-button-dome-recraft.svg`. Built by `tools/build-mascot-rig.py power-button`: the one ink outline is split with masks into the cap's (`pb-cap`) and the base's (`pb-base`), and the base is drawn over the cap so the cap presses down behind the ring's top. `pb-lit` is the symbol in golden. Rays are the shared Recraft rays.
- **Character:** the face on the golden base (hero eyes at 1.35 times, code mouth); rubber-hose arms from the base's sides with the hero's fists, and the kit's pointing hand (at 0.85) for the press. No legs.
- **Idle:** on standby, arms hanging and swinging a little, the cap breathing, the eyes darting side to side.
- **Gag "switch on" (2.4s):** it looks up, its right arm arcs up round its side and over the cap, the pointing finger jabs the button and the cap presses down; the cap springs up as the symbol lights golden, rays pop, its eyes pop and it grins, pumping its left fist twice; the arm comes back down.
- **Contact:** inside the "Send it" button at 40px with `data-gag-cue`: it idles, and hovering, focusing or tapping the button switches it on (a small script on the page).
- **Still:** finger on the button, lit, rays out, fist up, grinning (`still: 0.5`).

### the hero duo: high-five and handshake · built 2026-10-18, parked 2026-10-19

**Parked:** Aidan, 2026-10-19: without hand-drawn art the duo can't get where it needs to be. The handshake needs a second hero who is a true right glove facing left (the mirror makes the 1 read backwards and swaps his thumb and fingers; moving his face across in code was close but not right), and the high-five reads best from the side, which needs him in profile. The code and parts stay (`makeDuo`, `duo-parts.svg`, dev page `?m=high-five`, `?m=handshake`); the thank-you page shows the hero cheering on his own instead, and About has no mascot beside paragraph 1.

**Hero thumbs-up (`hero-thumbs`, the thank-you page since 2026-10-19):** `HERO_THUMBS`, the same victory drawing posed by the code into a two thumbs-up held at his chest, the hands resting on the band (Aidan's reference: fists in front of the chest, thumbs up). The arms come out of the sides of his band, near its top (tucked under it, as on the floating hero), swing out to an elbow and come back in sideways into each hand's wrist. **On the thumbs-up drawing the wrist is the rounded heel on the hand's outer side** (`SIDE`, about 1690, 1290 in its space), not the stub at the bottom: the left hand takes its arm from the left, the right from the right. The code places each hand so that point lands on `wristL`/`wristR`, and the hose ends a little inside it so the hand covers its end. Tried and rejected: hoses coming up from below into the bottom stub (reads as going under the fist), arms starting high on the body, and tilting the hand past about 20 degrees (he points at his own face). Hands are `mk-hand-thumbflat`, the kit's Recraft thumbs-up with its shade painted white to match his unshaded fists and the wrist stub at its bottom cut off along a curve with a new outline (`mk-c-thumbflat`), so the fist bottoms are clean like his own (left one mirrored), at 0.17. Clean-up (2026-10-19, from Aidan's review): the shared victory drawing (`tools/build-hero-rig.py` idle settings) now smooths the seam under the lowest finger (`smooth`: the dark edge, shade stripe and white redrawn along fitted curves, and the knob trimmed off) and trims the squared-off edge left by the right arm's hole above the band (`trim`); the homepage hero's arms cover both spots anyway, so it looks the same. For the thank-you pose only, the legs are drawn over the shoes so their rounded ends hide the drawing's lumpy collars, and the right leg ends at `ankleR` (586, 780) to cover the right collar's lip. Idle: blink and a slow breath. **Gag off for now** (`noGag`, 2026-10-19): the thumbs-pump, wink and stars code is kept for later.

**Hero cheer (`hero-cheer`, dev page):** `HERO_CHEER`, his victory-pose drawing from the homepage landing (`assets/mascots/hero/hero-idle-parts.svg`, loaded straight from the hero folder; a rig's `parts` may now be a list, and it also loads `hero-jolt-parts.svg` for the stars), both fists up and standing planted, with his landing idle ported from `hs-hero-rig.js`: a bounce with the fists punching up. Gag "cheer" (2.2s): a crouch, a jump with the fists punching high and spreading, a landing impact star beside each fist at the top, a squashy landing. `data-first-gag="0.9"` plays it right after the page's pop-in. (A first version used the running body from the duo standing still; its bowed legs and forward lean read as half-crouching, so it was replaced.) `makeDuo('solo')` is still in the code, unused.

- **What it is:** two copies of the running hero facing each other, the right one mirrored (`makeDuo` in `hs-mascot-rig.js`, ids `high-five` and `handshake`). `tools/build-mascot-rig.py duo` copies his body with its mask and clips from `hero-parts.svg` (1024 space; his shoe and fist are in the kit) and adds: his palm side (`du-palm`, from `_refs/hero-palm-recraft.svg`, its band lined up on his, scaled to his body; drawn as Recraft drew it, so after the flip the thumbs are on the outsides), the clasp (`du-clasp`, `_refs/clasp-recraft.svg`, with its sleeve ends as data) and two impact stars. Limbs are rubber hoses at his own widths; eyes the shared code eyes at scale 1 on his eye spot.
- **Idle:** each bounces a little on its own beat, swinging its arms, glancing at the other and at you.
- **High-five (thank-you page, 2.6s):** a crouch, a jump toward each other with the legs tucked and arms flung up; mid-air the bodies flip (a negative x scale through zero) to the palm side, so the faces vanish; a whole-body slap with impact stars and a squash; a flip back; a landing. The page pops it in with its CSS slap, then `data-first-gag="0.9"` plays the high-five straight after.
- **Handshake (About):** they are mid-handshake from the first frame, so the clasp never has to swap in (fists-to-clasp swaps were tried several ways and always showed). Idle: a slow friendly pump, both bobbing along. Gag "won't let go" (3.2s): the shake speeds up and grows until their feet leave the ground and their eyes pop, one huge pump hops them both, they land out of sync (bobbing opposite ways) and look at each other, then fall back into the calm shake. The clasp rides their average lift with the shake on top; the pump's phase is integrated so its speed can change smoothly. The clasp's outline is thickened in the build to the fists' weight and its finger lines are ink.
- **The right-hand hero is a true right glove,** not a mirror (Aidan, 2026-10-19: a mirror made the 1 read backwards and swapped his thumb and fingers). Inside his mirrored frame the body is flipped back and uses `du-body-l`: his own body with the old face whited out, the stretch of right edge the eyes used to form drawn in, his smile moved across and mirrored, and the code eyes at `data-ex/ey` toward the thumb side, so he faces left. The ink the old eye bulged past his edge is masked away (`du-m-lcut`). His shading is mirrored too: the blue-grey bands down his left go white and a band runs down his right edge instead (his glove's white less the same shape moved 40 left, `du-m-rshade`). His shoulders and hips swap sides to match, his hands rest at the same offsets from his own shoulders (so his arms hang and curve like the left hero's, mirrored), and his pupils look the mirrored way. A Recraft left-facing hero was tried and failed (it kept drawing him facing right, or mirrored).
- **Shadows:** its own, one under each hero's feet, shrinking as he jumps.
- **Stills:** the slap with stars (high-five), the clasp mid-pump (handshake).

## Artist brief: what the duo needs (2026-10-19)

Two drawings of the hero would unlock the parked duo. Both should match his existing look exactly (`mascot-test/run/hero-original.svg`, the Handstart style): the same glove, band with the 1, golden sneakers, ink weight and blue-grey shade. Only the body is used (glove and band); arms, legs, shoes and eyes are drawn by the rig, so the limbs in the drawing can be anything, as long as they don't cross the band.

1. **The hero facing left, as a right glove.** Seen from the back like now (thumb on the left), but with his face on the left half of the glove and his fingers leaning left, his shade band down his right edge, and the 1 reading the right way round. Recraft couldn't draw this: it kept facing him right or mirroring him. For the handshake and any scene with two heroes.
2. **The hero in side profile.** The glove seen exactly from the side, fingers together pointing up, thumb flat along the front, palm side facing right, the band seen from the side. No face (it is on the back of the hand). For the high-five: two of him jump, turn to profile and slap palm to palm.

Deliver as SVG with flat fills (outline as one ink shape under the fills, as Recraft does), on a 1024 square like his runner drawing.

## Prompts

Settings for every rig prompt: the **Handstart style**, palette `#1D3F66 #FFFFFF #A9BACD #E3A23B #F0C46E`, 1:1, no image reference (add `_refs/hero-idle-ref.png` only if a batch drifts in line weight).

**Handstart style (2026-10-17):** a new Recraft custom style built from our own finished art instead of Jamm. It replaces the hero custom style (made 2026-10-07 from the two Jamm images and the glove, before the hero existed). Sources, rendered on white at 1200px in `assets/mascots/incoming/_refs/style-v2/`: `hero-idle.png`, `hero-float.png`, `hero-run.png` (the recolored drawings from `mascot-test/run/*-original.svg`) and `jolt-stars.png` (the Recraft stars recolored to the palette). `hand-a.png` was rendered but left out: it is mostly a solid ink letter, which would teach heavy solid fills. A style learns rendering, not content, so the hero's face and limbs in the sources do not force faces onto objects; the prompt decides that.

Object block (fill in the object description from the character above):

```
A single cartoon object on its own: [OBJECT]. It is an inanimate object with no face, no eyes, no mouth, no arms, no legs and no hands. Front view, upright, simple chunky rounded shapes. Bold even thick dark outline on every shape, flat solid colors, one flat blue-grey shade on one side only, no texture, no gradient, no ground shadow, centered with plenty of space around it, plain white background.
```

Hands sheet for the kit (16:9), run once:

```
A sheet of four separate white cartoon glove hands with a thumb and three rounded fingers and a short golden cuff with a light golden stripe, each one alone with space between them: an open flat hand with the fingers together, a hand pointing with the first finger, a thumbs-up fist, and an open hand waving with the fingers spread. Bold even thick dark outline, flat solid colors, one flat blue-grey shade on one side only, no faces, no arms, plain white background.
```

The style still learned from a character, so expect Recraft to add faces or limbs. If it does, move "no face, no eyes, no mouth, no arms, no legs" to the very front and repeat "inanimate object". Record every pick in `docs/mascot-prompts.md` as usual.

## Order of work

1. **Pilot: magnifier.** Generate the object and the hands sheet, build `build-mascot-rig.py` and `hs-mascot-rig.js` around it, check it on a dev page, then in its homepage and Services slots. This settles the kit's scales, line weights and the timeline format.
2. **Then:** lightbulb, megaphone, browser-window, speech-bubble.
3. **finish-flag last:** it needs the cloth code and a hook from the steps lane.
4. **Simple SVG tier** afterwards, with its own prompts (faces and limbs drawn by Recraft, no splitting).

## Open questions

- Blob for finish-flag: olive here (the sage token); clay pink was baton's.
- Whether the four pillar mascots in the homepage finale row stay still (agreed) or play one shared cheer when the row lands.

**Case files (`case-files`, the Case Studies hero since 2026-10-19):** `CASE_FILES`, the magnifier (his own parts, `magnifier-parts.svg`) with four copies of one Recraft manila folder (`_refs/folder-recraft.svg`, built by `tools/build-mascot-rig.py case-files` into `cf-folder`: its outline and every fill edge redrawn heavier, since it is drawn at 0.42; the back cover's left edge in darker golden). He has no arms, so the folders float beside him, to his right (our left) by the bottom of his lens, on their own slow bob, and do not hop with him. Each folder leans its top toward him (11 degrees) and is narrowed to 0.86 wide, so it reads as turned to face him (`turn`), and his pupils look down and across at them (`lookAt`; the eyes' pupils sit up and right by default, so it takes a big offset). First version had the stack in front of his lens: Aidan wanted it to his side so it does not block him. Idle "sifting": every 1.2s the front folder flips down toward you (squashing about its bottom edge, `data-by`), moves to the back while it is flat and pops up behind the others, so the reorder never shows; the rest shuffle forward and his eyes dip with each flip. Gag "fan out" (2.6s, on hover or tap and about every 4.5s): the stack spreads into a fan like a hand of cards (back folder on the left, front on the right and on top), his eyes scan across it and each folder lifts and grows a touch as he looks at it, then it folds back into the stack. The sift's own clock stops during the gag, so the stack comes back as it left. The still is the fan mid-scan. Placement: `slots`, `fan` and `fileK` at the top of `CASE_FILES`.
