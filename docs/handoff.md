# Handstart Digital: handoff summary

## Basics
- **Repo:** `~/Documents/Sites/graduated-umbrella`. A static site (plain HTML/CSS/JS, no build step) deployed on Netlify.
- **Branch:** the redesign lives on the local branch `landing-v2`, **uncommitted and offline: no commits, merges or pushes until Aidan says** (see "Redesign phase"). `ported-pages` (the Netlify preview branch) has one unpushed commit, `41ef00c`. **Never touch `main` without asking.**
- **Read `CLAUDE.md` first.** It's in the repo, so a new Claude Code chat loads it automatically. It now holds almost everything below: brand tokens, accent tokens, page structure, mascot system, homepage, Services, About and Case Studies slots, the Netlify Forms fields, the noindex rule and how the redirect works.
- **Git identity:** Aidan Paggao <philmias8008@gmail.com>.
- **Contact details used on the site:**
  - Email: `contact@handstartdigital.com`.
  - Cal.com: `data-cal-link="aidanpaggao/15min"`, namespace `15min`.

## Standing rules
- **Em dashes:** none, anywhere: copy, code, comments, docs or commits.
- **Comments:** no generic ones like `<!-- header -->`. Only comments that explain something non-obvious.
- **Homepage motion:** CSS or vanilla JS only. GSAP, Lenis and ScrollTrigger must never load there.
- **Reduced motion:** every animation needs a fallback that shows a still state.
- **Workflow:** show a short plan before editing, and summarize changed files after. Commit and push to `ported-pages` once the user approves.
- **"De-AI" copy:** no "not X, we Y" patterns or groups of three abstract nouns. Deliver each rewrite as a labeled version.
- **Preview link:**
  - Run `python3 -m http.server 8000 --bind 127.0.0.1` and share http://localhost:8000/. Don't publish an Artifact for it.
  - Background commands stop after 2 hours.
  - For phone testing, the user runs the server themselves on `0.0.0.0` and uses `192.168.1.154:8000`.
- **Inline-script check:** after any copy edit, check inline scripts still parse with `osascript -l JavaScript` and `new Function(...)`. Node isn't installed.

## Tool quirks on this machine
- **`grep` is actually ugrep.** `-Z` doesn't behave as expected, and zsh doesn't split `$var` file lists into separate words. Use Python for multi-file edits.
- **Screenshots:** headless **Firefox** works and Brave doesn't.
  - For a faithful still, add an image from a deliberately slow local server, so the screenshot waits until the page's fetches finish.
  - A Firefox profile with `ui.prefersReducedMotion=1` shows the homepage portal content laid out statically.
  - Lenis blocks `scrollIntoView`, so take tall screenshots instead.
- **Python:** Pillow (with WebP support), numpy and scipy are available.

## What was done (commits since `f525505`)
| Commit | Change |
|---|---|
| `ff4c1b5` | No-website ad bullet (made during the previous session) |
| `1953248` | Mascot system and build rules added to CLAUDE.md |
| `a4506eb` | **Mascot system**: raster-first, blob accent tokens |
| `f0950e0` | Generic comments removed site-wide; `_headers` cache rules |
| `ebfb17f` | Homepage mascot slots |
| `5025223` + `6c4972d` | Services "Build your handstart" section; noindex added to Services |
| `3d692df` | Contact form rework and thank-you page |
| `4e4db8e` | `--amber-light` renamed to `--amber-lt` on 9 pages |
| `3cbc47e` | About page: stat, mascots, closing section |
| `4ccd621` | Case studies: mascots, status chips, Greenlife +512% corrected to +500% |
| `e511dd9` | The Difference folded into Services; page deleted; `_redirects` added |
| `a6278a6` + `d4c044a` | Services now opens with "Real work vs template work"; ABCD removed from Services |
| `061cd46` | `tools/prepare-mascots.py` |

## How the mascot system works
- **Markup:** `<figure class="hs-mascot" data-mascot="ID" data-state="idle|hover|reveal|static">`. Use a `<span>` instead of `<figure>` inside `<p>`, `<h1>` or `<button>`.
- **Optional attributes:** `data-blob`, `data-pose`, `data-hover-pose`, `data-boil`, `data-eager` and `data-label`.
- **Files:**
  - `assets/css/hs-mascots.css` holds the states plus the accent tokens: terracotta `#E08E72`, sage `#A3B899`, dusty-blue `#8FA6C9` and butter `#E8B96A`.
  - `assets/js/hs-mascot-loader.js` is vanilla and homepage-safe.
  - `assets/js/hs-mascots.js` is the GSAP upgrade, used on Services and About only.
- **Manifest:** `assets/mascots/manifest.json` gives every id a default `blob`. Finished art adds `type: "raster"` and `poses`. Ids without a type show their SVG placeholder.
- **There are 21 ids:** the original 20 plus `speech-bubble`.
- **Docs:** `docs/mascot-raster-spec.md` is the main spec. `docs/mascot-svg-contract.md` is optional, for the logo or geometric characters.
- **Art pipeline:** drop raw `{id}-{pose}.png` files in `assets/mascots/incoming/` (gitignored), then run `python3 tools/prepare-mascots.py` (flags: `--only`, `--dry-run`, `--fit-each`, `--tolerance`). It writes 600px and 1200px WebPs to `final/`, updates the manifest and saves previews to `incoming/_preview/`.
- **Dev page:** `/mascot-test/`, plus `?gsap` for the GSAP version. Its demo art lives in `mascot-test/demo/`.

## Page state
- **Homepage:**
  - hero-bib-hand beside the portal tagline, desktop and tablet only.
  - Four step rigs crossfade with the step timer: compass, clipboard, block, finish-flag (each plays its gag as its step appears; the flag celebrates when the runner reaches the end).
  - Path cards use clipboard (animated, `data-still="rest"`) and power-button, both rigs.
  - Four pillar mascots in "What do you get?" (browser-window, magnifier, megaphone, lightbulb), then all four together in its finale.
- **Services, top to bottom:**
  - **Real work vs template work** is the page's only `h1`, with the setup paragraph including the agency-ad line, the plumber mockup and a 6-item checklist.
  - **A two-card fork:** "Already paying someone?" goes to `/contact`, and "Starting fresh?" scrolls to `#work-together`.
  - **How We Can Work Together** (`h2`).
  - **The pinned 5-panel wipe stack**, unchanged.
  - **Build your handstart:**
    - Checkbox chips feed a sticky tray.
    - Picks are saved to sessionStorage `hs_selected_services` as `[{id,label,group}]`.
    - They're passed to the contact link as `?services=` slugs, and to the Cal.com popup as `notes`.
  - **What we don't do**, no mascot (glove-stop dropped 2026-10-18).
  - **The closing section.**
- **Contact:**
  - An optional website field, entered as plain text.
  - A hidden `services` field in the static form.
  - Removable chips for the picks.
  - A Book a call button beside Send it, which has the power-button rig (hovering the button switches it on).
- **Thank-you:**
  - "Got it." then "I read every message myself. Expect a reply today or within two business days. Don't want to wait? Book a call instead." (2026-10-19)
  - A "15 Min Call" button (the standard arrow button, opens Cal.com, 2026-10-19) plus a Case Studies link.
  - The hero (`hero-thumbs`) pops in on load: two thumbs-up at his chest, arms from the band's sides into the wrists on the hands' outer sides, looking at you, his own shadow under both shoes, gag off. Finished in code on 2026-10-19 (the Recraft redraw was dropped).
  - A **permanent noindex**, as a marked meta tag plus `X-Robots-Tag` in `_headers`.
  - An empty `hsConversion()` hook. No analytics are installed.
- **About:**
  - The stat counts up to $15M+, labeled "in annual ad spend managed, five years running".
  - The credentials card sticks from a wrapper (its bar-chart peek was dropped).
  - No mascots beside the narrative (handshake and ribbon dropped).
  - A power-button pull-line: "I see it, we decide it, we start it."
  - stopwatch beside the ticker.
  - The closing section is Contact plus "See what I do".
- **Case Studies:**
  - One bar-chart slot in the hero (placeholder until the art is built; podium and foam-finger dropped, a podium ranks the work).
  - Live and In progress chips.
  - The coming-soon page and Greenlife have no mascots (and don't load the mascot files). Greenlife's results have real numbers and no TODO boxes.
- **Nav:** Services, About, Case Studies, plus the Contact button. The Difference is gone, and `/the-difference` redirects 301 to `/services#real-work`.
- **Netlify files:** `_headers` (cache rules plus the thank-you noindex) and `_redirects`.

## Redesign phase: the new homepage landing (2026-10-07 to 2026-10-16)

**Pick up here (2026-10-19):** all redesign work is on the local branch `landing-v2`, **uncommitted and offline** (Aidan: no commits, merges or pushes until he says; never push to Netlify). Mascots are Jamm-style rigs (spec: `docs/mascot-rig-spec.md`; every prompt and pick: `docs/mascot-prompts.md`; player `assets/js/hs-mascot-rig.js`; build `tools/build-mascot-rig.py`; dev pages `/mascot-test/rig/?m=<id>` and `/mascot-test/rig/crowd/`). **FIRST, before anything else: finish the thank-you hero.** He is `hero-thumbs` on `contact/thank-you/`: his victory-pose drawing posed by the code into two thumbs-up, pupils centred to look at you, no gag (blink and breath). Aidan asked for a Recraft version: **the same hero facing the viewer, one thumb up by his chest and one raised high** (prompt in "Prompts still to run" below). Ask Aidan whether he ran it, help him pick (count fingers, readable 1, matches the hero, faces the viewer), then use the drawing as it is for a still with only the eyes split out to blink, and swap it in. **Then:** the bar chart for the Case Studies hero (prompt below; three separate bars, they regrow in the gag). **Done 2026-10-18 and 19:** speech-bubble (Services Retention panel), finish-flag (homepage step 4, cued by the runner), compass / clipboard / block (homepage steps 1 to 3; step 2 copy now "Make your list"), stopwatch (About ticker, replaced the megaphone), power-button with arms pressing its own button (homepage "Already know" card, About pull-line, Contact "Send it"), rig-drawn shadows for the block and flag, no blobs anywhere, `data-still="rest"`, `data-gag-cue`, `data-first-gag`. **Dropped:** ribbon, glove-stop and its Services slot, podium, foam-finger, the About handshake; the bar-chart left About and Greenlife; individual case study pages have no mascots. **Parked:** the two-hero high-five and handshake (dev page only; they need a hero drawn facing left and one in profile, see "Artist brief" in the spec). Start by restarting both preview servers and giving him both links (check the IP, it moves).

### Rig lessons (2026-10-17 and 18)
- **Recraft:** describe the whole object, say "inanimate object with no face, no eyes, no mouth, no arms, no legs", ask for the hero's shading in words ("a blue-grey shade band along its left edge, the outline thicker on the shaded side"). Golden parts almost always come back with a golden "ghost" copy or strip where the darker golden shade should be: plan to recolour it in `build-mascot-rig.py` rather than reroll. **Count fingers on every hand:** Recraft drifts to four fingers, and it cannot vary frames on one sheet (it draws the same pose three times).
- **Aidan's preferences:** limbless characters (the magnifier lost its arms, the megaphone its mouth); each rig needs its own idle and eye movement (pogo, waddle, sway with darting eyes, typing) and its own gag; eyes keep their size (no squints or squeezes); keyboard keys stay still; typing at one steady pace; anything code-drawn that should look hand-made (rays, waves) becomes Recraft art. Iterate on the dev page, live, not with mockups.
- **Cache:** every change to `hs-mascot-rig.js` needs `RIG_SRC` in `hs-mascot-loader.js` and the loader links on the 6 pages that load it bumped (now `?v=20261019k`), and the dev page `mascot-test/rig/` its own script tag.
- **Screenshots:** headless Firefox with the slow-image trick; `?m=<id>&p=<0..1>` on the dev page freezes any gag moment; a profile with `ui.prefersReducedMotion=1` shows every page's stills.

- **More lessons (2026-10-18 and 19):** moving parts work best as their own Recraft generation (the bubble's tail, the flag's cloth, needles, hands), and their prompts should not name the object they belong to (asked for "the tail of a speech bubble", Recraft draws the whole bubble). Recraft cannot draw the hero facing left as a right glove or in profile; anything needing those is parked for an artist. Swapping one drawing for another mid-motion (fists to a clasp) always shows: design around it (the handshake starts clasped). Aidan judges at full speed on the dev page: show frozen frames for checking, but expect motion notes back.

### Prompts still to run (2026-10-19)

All: Handstart style, Precise, palette `#1D3F66 #FFFFFF #A9BACD #E3A23B #F0C46E #B57A1E` (white ticked as background), 1:1, no reference image.

**1. The thank-you hero (do this first).** Used as drawn, for a still; only the eyes get split out to blink.
```
A white cartoon glove mascot: the whole glove is the head and body, a thumb and three rounded fingers pointing up at the top, a big friendly face on the back of the hand with two large white oval eyes touching each other and big round solid dark pupils, a wide closed smile, a golden band around the bottom of the glove like a wrist cuff with a light golden stripe and a bold dark number 1. Thin bendy rubber-hose arms come out of the sides of the band, and thin rubber-hose legs come out of the bottom of the band, with chunky golden sneakers with white soles. Pose: standing facing the viewer straight on, feet planted apart, looking straight at the viewer with the pupils in the middle of the eyes, one arm bent with a white glove hand giving a thumbs-up held in front of its chest, the other arm raised high above with another white glove hand giving a thumbs-up, a big happy smile. Bold even thick dark outline, flat solid colors, one flat blue-grey shade on one side only, full body with plenty of space around it, plain white background.
```
Check: a thumb plus three fingers on every hand, a readable 1, his look (touching eyes, closed smile, golden sneakers), facing the viewer.

**2. The bar chart (Case Studies hero).**
```
A single cartoon prop on its own in a 1930s rubber-hose cartoon style: a chunky bar chart made of three separate thick rounded bars standing side by side on a short flat white base, with small gaps between the bars so each bar has its own full outline. The bars rise from left to right, short, medium and tall: the short one white, the medium one light golden, the tall one golden. The tall bar is noticeably wide. Each bar has a narrow darker stripe down its left side, drawn inside its own outline, not a copy behind it. Bold thick dark hand-drawn outline with a slight organic wobble, soft squashy bouncy proportions, flat solid colors, no gradient, no texture, no axis lines, no numbers, no text. It is an inanimate object with no face, no eyes, no mouth, no arms, no legs. No ground shadow, centered with plenty of space around it, plain white background.
```
Plan: face on the tall bar; idle a small sway; gag the bars drop and regrow one by one, the tall one popping up with a grin.

### Branch and uncommitted work
- `ported-pages` has commit `41ef00c` (hero rig, idle rig, landing test page, docs), not pushed. `landing-v2` was branched from it; **everything since is uncommitted on `landing-v2`**.
- **Aidan still has to delete these by hand** (the auto-mode classifier blocked it): `git rm assets/steps/*.png style.css main.js logo.png hero-logo.png && rm "Handstart Digital - Services-4.html"`.

### Decided
- **Palette:** Golden hour (ink `#1D3F66`, sky `#7FB5E3`, golden `#E3A23B`, light golden `#F0C46E`, cream). Homepage now; the other pages stay navy and amber until the rollout. Golden is never text on cream.
- **Blob set:** terracotta `#D2694A`, olive `#7E9F6B`, plum `#9C7AB0`, clay pink `#CF7A86` (homepage `:root` override; `manifest.json` at rollout).
- **Heading font: Bricolage Grotesque** on the homepage (`--display`; 800 with -0.035em tracking, smaller titles 700, former italic lines upright 600). Cormorant is gone from `index.html`; the other pages switch at rollout. Body stays Libre Franklin, accents Caveat. Compared on `/font-test/`.
- **Logo: one line, "HANDSTART Digital™"** in Bricolage (HANDSTART 800, Digital 600), the first A replaced by the **Recraft hand A** (a hand reaching across the letter). Letters outlined. Files in `assets/brand/`: `handstart-logo.svg` (ink), `handstart-logo-cream.svg`, `handstart-a-recraft.svg` (the A alone), `favicon.svg`; plus `/favicon.ico` and `/apple-touch-icon.png` at the root. Built by `tools/build-logo.py <Bricolage variable ttf>` (font from google/fonts, not in the repo). Earlier directions (glove marks, natural hand, hand A on Bricolage's A) are kept as files in `assets/brand/` but dropped.
- **Hero art is Recraft SVG** (not Midjourney). Aidan has plenty of Recraft credits: offer generations freely with ready prompts. For the character: spell out the whole character first, then `Pose: ...`; use the hero custom style (a saved Recraft style) and the palette `#1D3F66 #FFFFFF #A9BACD #E3A23B #F0C46E`. Don't use the hero as an image reference (Recraft redraws the glove).
- **Jolt (2026-10-09, trimmed 2026-10-13): just the bump.** The fists land with Recraft impact stars, the word wobbles, the letters switch on, the fists hold, then pull back. The bolt, glow, shine rays and sparks were all tried and dropped.
- **Removed:** the homepage services ticker (phrases kept in `docs/copy-bank.md`), the four breathing corner marks, the old portal ride.

### The landing as built
1. **Pre-scroll:** cream page held at the top. The logo top left (same size and spot as the header logo, so the hand-off is seamless; "Boutique Digital Marketing" right on desktop, under it on phones). Big HANDSTART in Libre Franklin Black, ink outlines, **its first A is the hand A**. The word is 92% of the screen width on phones, 78% on desktop.
2. **Jolt (just the bump):** arms with the hero's fists reach in (`ARMS_IN` 0.35 to 0.75s); **impact** at 0.75s: Recraft stars `hj-star-1/3` pop behind the fists, every letter switches on at once (filling with the live cloud sky), and the word wobbles and settles (`IMPACT` to 1.3s, `SHAKE_HZ` 9, a decaying sine rather than random jitter). The fists hold still until `ARMS_OUT` (1.6 to 1.95s). `lightTo(x)` can still sweep the letters on left to right if wanted.
3. **Live word:** the letters just stay lit with the sky. Shine rays, comic sparks and the racing bolt were all tried on 2026-10-13 and dropped by Aidan: the jolt is only the bump.
4. **Idle:** the hero pops in beside "Let's give your business a hand."; "Start scrolling" fades in.
5. **Run** on first scroll/tap/key: squash, pop, exponential run; the wipe follows him into the sky section; then the header fades in.
6. **After the run:** `#top` on the cloud sky: "Don't drift into a template." in cream, one line at every width (font size is the room between the gutters / 12.2; Bricolage is about 11.7em wide at phone sizes), then the cream card ("You built your business to be one of a kind." / "The way you appear online deserves the same care: not a generic template, but a hand-built plan for how people find you, choose you and remember you."; 2026-10-16, older versions in `docs/copy-bank.md`), the **Build your handstart** button to the top of `/services` (so people scroll the whole page) with the handwritten services cycling beside it; the floating hero beside the card.
7. **"Stop drifting. Start building." (`#what-you-get`, 2026-10-14; heading renamed 2026-10-15 and 16; outcome lines De-AI'd 2026-10-16, old ones in `docs/copy-bank.md`):** the homepage's services preview. Aidan didn't want a pinned screen: it's a normal scroll. Desktop: the title sticks on the left while four pillars (Websites & Shopify, Search, Marketing, Strategy; mascot, outcome line, tags) come in one by one lower down the page (each shows while its top is above 78% of the screen, so scrolling back up hides the ones ahead again); a golden bar beside them fills with how far the list has been read. The finale comes in last: the four mascots pop in a row, "It's me, start to finish." Then "And a whole lot more..." (60 items, tumbling in once reached: every Services chip, the homepage extras, and the pieces inside those services; Aidan to prune any he doesn't offer), "Don't see it? Ask me." and **See what I do**. Reduced motion or no JS: everything shows. CSS `.wyg-*` in `index.html`, script just above the Find Your Gaps assessment. Aidan keeps the single "See what I do" button here as is.
- **Sky (`hs-sky.js`):** every cloud repeats sideways and downward, rows nudged so the letters sit between two, the drift starts 12s in (desktop 1.3x speed). Narrow canvases (width/height under 0.5) zoom out (`u_zoom`, about 0.31 on a phone) for a mini desktop sky, 1.6x drift. Tuned with a numpy port of the shader (scratch only, not in the repo); headless Firefox can't run WebGL, so check on a real phone.
- **Idle hero shadow (2026-10-13):** the arm hole in the idle body (`body_clip`) used to cut Recraft's thick ink shadow off the glove's left edge (second finger, hip). `build-hero-rig.py` now redraws it there (`"shadow"` in the idle entry: an ink copy of the glove nudged left and down, clipped to the left edge from the first finger down through the band, so it runs unbroken behind the arm; the band's copy only moves sideways (`with_offset`) so it doesn't hang onto the leg; Recraft's dark nub at the band's left end is cut out). The floating hero (after the run) has the same fix (`"shadow"` in the float entry, starting at y 300). Alternative Aidan saw for the idle: nub trimmed with no band shadow (drop `"with"` and end the clip at y 645).
- **Float hero leg gap (2026-10-14):** the white between the floating hero's legs was Recraft background. `build-hero-rig.py` leaves it out of the legs and cuts it from their silhouette (`"cut": {"legs": [22]}` in the float entry), so the sky and clouds show through. The idle's own leg gap was already handled by `"background"`.
- **Reduced motion:** no lock, still frames. **No JS:** plain ink HANDSTART, sky gradient below.
- **Header logo** fills its space (`.hs-header-logo`: up to 445px on desktop, everything left of the menu button on phones); **footer logo** up to 560px.
- **Cache:** the `hs-landing.js`, `hs-sky.js` and `hs-hero-rig.js` script links carry `?v=` tags. **Bump them whenever those files change**, or phones keep the old copy (this bit Aidan once: his phone showed a plain A).

### Files to know
- `index.html`: the homepage (landing markup and CSS, tokens, header/footer logo, favicon links, script version tags).
- `assets/js/hs-landing.js`: the landing sequence. Timings at the top (`ARMS_IN`, `IMPACT`, `ARMS_OUT`, `HERO_IN`, `CUE_IN`, `SHAKE_HZ`); `drawArms`, `drawImpacts` (the stars), `lightTo`/`lettersOn`; the hand A loader (`HAND_A_URL`, `placeHand`).
- `assets/js/hs-sky.js`: the cloud shader (zoom, repeat, drift).
- `assets/js/hs-hero-rig.js` and `assets/mascots/hero/*.svg`: the hero rigs and parts. `tools/build-hero-rig.py {runner|idle|float|bolts|jolt} <svg or _refs folder>` splits Recraft sources (in the local-only `assets/mascots/incoming/_refs/`) into parts. The `jolt` mode (takes the `_refs` folder) builds `hero-jolt-parts.svg` from `jolt-stars-recraft.svg` (`jolt-bolt-recraft.svg` and `jolt-rays-recraft.svg` stay in `_refs`, unused). `hero-bolts-parts.svg` (old crackle marks and small bolts) is no longer loaded. The `"shadow"` entries in the idle and float drawings redraw the shadow the arm holes cut away (see "Idle hero shadow" above).
- `assets/brand/` and `tools/build-logo.py`: the logo system. `/logo-test/` shows it.
- `docs/mascot-prompts.md`: every Recraft prompt and pick, including "Logo: the hand A" and "Jolt pieces".
- `docs/copy-bank.md`: removed phrases kept for later.

### Open items, in order
1. **Bump tuning** (optional, only if Aidan asks): how long the fists hold (`ARMS_OUT`), wobble strength and speed (`SHAKE_HZ`), star size (`drawImpacts`).
2. **Homepage vision (2026-10-14), next:** Aidan reviews the new `#top` and "What do you get?". Agreed direction: drifting vs. direction is the landing's (maybe the site's) thread, used as a motif not a slogan (landing, B in ABCD, maybe the closer, e.g. "Pick a direction"); one interaction type per section (landing watch/scroll, `#top` read, What do you get scroll, Steps tap/autoplay, Where do you want to start choose); avoid template-agency words (get found, grow your business, scale, elevate, unlock, results-driven, next level). Ideas still open: a repeated Build your handstart CTA band after the steps (Dialed style), Greenlife as a single animated case-study card, the hero joining the What do you get finale. Aidan's name and photo stay on About.
- **About ticker (2026-10-14):** "Based on daily averages, my guess for today on how many:" rotates every 15s through websites launched (252,000/day, the widely cited figure; Siteefy's 2026 estimate is about 546,600), ads pushed live (5,000,000/day, the unsourced "Facebook processes 5M+ new ads a day" blog figure; no platform publishes one) and social posts made (600,000,000/day, a conservative sum of dated platform figures: X about 500M, Instagram about 95M, TikTok about 23M uploads; no reliable global total exists). Values come from seconds since local midnight, re-rendered every 5s. Change them in `COUNTS` in `about/index.html`.
- **Landing notes (2026-10-14, reworked 2026-10-16):** after the bump, two tilted Caveat notes draw on above the word, each followed by a small hand-drawn arrow curling down to its word: "a human hand" (up left, -6°, arrow lands on the N) and "a head start" (up right, +5°, arrow lifted off the A). The old braces are gone. `NOTES` (`side`, `tilt`, `nudge`, `lift`), `NOTE_DRAW`, `ARROW_DRAW` at the top of `hs-landing.js`; `layoutNotes`/`drawNotes`. Glyphs come from `assets/fonts/Caveat-SemiBold.ttf` via opentype.js; they shrink to clear the logo bar on short screens and are skipped if there's no room or no font. Reduced motion shows them finished.
- **Steps relay (2026-10-14):** the steps' coloured bar is now a lane: the hero's run rig (`[data-steps-runner]`) runs along the line through each step's 10s, a golden trail behind him, ticks where each step starts, step labels below. His leg cycle speeds up every step (`RUN_EASY` to `RUN_HARD`); his ground pace is steady. Clicking a step pops him in at that step's start and restarts its timer. Rig only animates while the lane is on screen. Reduced motion: he stands at the active step's start. Recraft prompts for track art and a baton are in `docs/mascot-prompts.md` ("Steps relay track"), not run yet.
- **Sky flash fix (2026-10-14):** phones showed black frames in the cloud sky while scrolling: `#top` used `100dvh`, so the canvas resized whenever the toolbar slid, and a resize clears WebGL until the next draw. `#top` is now `100svh` only, and `hs-sky.js` redraws right after every resize.
- **Golden hour on every page (2026-10-15):** About, Services, Case Studies (+ Greenlife, soon), Contact (+ thank-you), Privacy and Terms now match the homepage: Golden hour tokens (old `--navy`/`--amber` names alias the new colors, `--accent-dk` #B57A1E added), Bricolage headings (800/-0.035em for big, 700/-0.02em small, old italic lines upright 600; `--serif` is an alias of `--display`), Cormorant removed, favicon links, sky header with the SVG logo and cream Contact button, cream SVG footer logo, old hex colors swept (#1B2B4B, #C8873A, #e0a558, #5a6472, their rgba forms). Golden text on cream became ink labels with a golden dot (eyebrows, kickers, tags), ink (the typed service labels on Services) or `--accent-dk` (Greenlife stat numbers, "After" label); hovers, borders and golden on ink stayed. Blobs: `hs-mascots.css` has the new set (`plum`, `clay-pink`; `dusty-blue`/`butter` alias them), `manifest.json` remapped, the homepage's local override removed; the loader now revalidates the manifest, and `hs-mascots.css` / `hs-mascot-loader.js` links carry `?v=20261015a`. Case Studies chips: live light sage `#A9C29A`, in progress light golden. The per-page PNG logos are now unused (could be deleted with the other leftovers).
- **Voice (2026-10-15):** the site speaks as one person: "I/me/my", not "we/us/our" (Privacy and Terms excepted). The inclusive "we" (you and me together) stays: "Where shall we begin?", "How we can work together", "if we're a fit", "for both of us", "I see it, we decide it, we start it.", "our projects", "before we make ours", Greenlife's "as we explore".
- **Headings renamed (2026-10-15, again 2026-10-16):** the steps heading is now "How we Handstart:" (one line on phones), "Where do you want to start?" is now "Where shall we begin?" (too many "start"s on the page), and the services preview is "Stop drifting. Start building." Aidan wants fewer repeats of "handstart" and "start".
- **Landing on short windows:** the word drops just enough to keep room above it for the notes (`noteRoom` in `layout()`); normal heights are unchanged.
- **Landing notes timing:** they start at 1.3s and the run waits for them (an early desktop scroll used to send him off before they were drawn).
- **About ticker width:** the number's box is reserved at the widest value any count reaches (`600,000,000`), so the megaphone never moves.
3. ~~Shopify on Services~~ done 2026-10-16 ("Shopify & E-commerce Stores", slug `shopify-ecommerce-stores`, under Web Design & Development).
4. **Mascots (next, see Pick up here: the thank-you hero first, then the bar chart):** 2026-10-19 state in the spec's tier table. History: map every slot and pose the site needs, then generate the rest in Recraft in the hero's style. Placeholders still show their names under the art (e.g. "clipboard"). **2026-10-17:** tiers decided and the rig plan written in `docs/mascot-rig-spec.md`: six Jamm-style rigs (the four pillars, also on the Services panels; speech-bubble; finish-flag, which replaces `baton` at step 4), simple SVG elsewhere, stills for repeats. Pilot is the magnifier. **Built 2026-10-17:** `tools/build-mascot-rig.py {kit|magnifier}` writes `assets/mascots/rig/kit-parts.svg` (the hero's shoe and fist, four cuffless kit hands) and `magnifier-parts.svg`; `assets/js/hs-mascot-rig.js` is the player (eyes, mouth and hose limbs in code, shared clock, on-screen only, hover or tap plays the gag, reduced motion rests); dev page `/mascot-test/rig/` (`?p=0.5` freezes the gag). **Wired in 2026-10-17:** manifest `magnifier` is `"type": "rig"`; the loader loads the rig script on demand; it animates in the homepage Search pillar and the Services Search panel, and shows its still (the gag at 0.5) in the homepage finale row and Services "How to spot template work". Finale row and Services tray copies are now `data-state="static"`. `hs-mascots.css`, the loader and `hs-mascots.js` links bumped to `?v=20261017a`. **Lightbulb rig (2026-10-18):** built and wired the same way (Strategy pillar and Services panel animate; finale row and tray show the still); the dev page switches characters with `?m=lightbulb`. Loader links now `?v=20261018a`, its `RIG_SRC` `?v=20261018a`. **Megaphone rig (2026-10-18):** built and wired (Marketing pillar, Services panel and About ticker animate; finale row and tray show the still). The lightbulb's rays and the megaphone's sound waves are now Recraft pieces (`_refs/rays-recraft.svg`, `_refs/soundwaves-recraft.svg`). Loader links and `RIG_SRC` at `?v=20261018b`. **Computer rig, `browser-window` (2026-10-18):** built and wired (Websites & Shopify pillar and Services panel animate; finale row and tray show the still), so all four homepage pillars are rigs. No blobs on the homepage or Services; mascot sizes up about 1.3 to 1.5 times site-wide. Loader links and `RIG_SRC` at `?v=20261018c`. A thumbs-up gag was tried and parked (the upright kit hand `mk-hand-thumbup` is ready). Next: speech-bubble, then finish-flag. New Recraft style "Handstart" (sources in `_refs/style-v2/`).
5. ~~Golden hour rollout~~ done 2026-10-15; reviewed by Aidan 2026-10-15 ("everything looks great").
6. ~~Copy rework~~ essentially done 2026-10-16.
7. **Still open from before:** prune the 60-item "And a whole lot more" list; track and baton art for the steps lane (prompts in `docs/mascot-prompts.md`); ideas: Greenlife as an animated case card, the hero joining the services finale.

### Done 2026-10-15 and 16 (this session)
- **Home nav link** on all 10 pages (header, mobile menu, footer), left of Services, to `/#top`. Any homepage URL with a hash (`/#top`, `/#assessment`) skips the landing: the head script adds `hs-skip-landing` (CSS hides the cover) and `hs-landing.js` runs `startSkip()` (header shown, floating hero mounted). The logo still goes to `/` and plays the landing.
- **Homepage "Where shall we begin?":** two clickable rows in one white box (mascot, "Not sure yet" / "Already know", then an ink link with a golden underline: "Find your gaps →" to the quiz, "Build your handstart →" to the top of `/services` (was `/services#build` until 2026-10-19)). Hover/tap tints the row, slides in a golden left bar and nudges the arrow; touch taps wait 350ms. Ids `findGaps` / `whatWeDo` keep their scripts. No body copy (Aidan's call).
- **Button names:** "Find My Gaps" is "Find Your Gaps"; every "What I Do" / "See what I do" pointing at Services is now **Build your handstart** (quiz results, About and Case Studies closers, case studies), except the single "See what I do" in the homepage services preview. **Rule:** Build your handstart sits left, Contact right, and every Build your handstart (plus Services' Latest Work) has the arrow animation.
- **Case studies:** pages close with Build your handstart (top of `/services`) plus Contact, never the quiz (also in `CLAUDE.md`). Listing titles: "Five stars in person, but a question mark online", "A packed shop floor, and nothing online", "Building a marketing arm from the ground up"; service lines in sentence case; locations removed from the labels.
- **Services rebuilt (2026-10-16):** opening "So, what are we working on?" (h1), the typed search pill, a lede for both new and fixing visitors, then the call to action set apart in Bricolage with a golden left bar. `#build` holds five panels (mascot, question, De-AI'd pitch on the left; group eyebrow and **pill-chip checkboxes** on the right, no per-service descriptions, Aidan's call), a sticky **"My handstart" bar** (`.hs-minibar`: count, picked names on desktop, "Review ↓" to `#my-handstart`), then the full tray. The pinned wipe stack and the separate picker cards are gone (nothing listed twice). Then "How to spot template work" (`#real-work`, h2, fork cards removed: "Already paying someone?" was a legal worry), "What I don't do" (no scroll wipe now: `data-reveal` opts it out), closing ("See the work I've already done, or tell me what you need and I'll show you how I'd do it."). The picker script reads labels from `data-label` and group names from `data-group-name`; storage, `?services=` and Cal.com notes are unchanged. A pre-rebuild copy was saved in the session scratchpad only.

### Testing notes
- Servers (Claude starts them in the background; they stop when the session ends): `python3 -m http.server 8000 --bind 127.0.0.1` for the Mac, `python3 -m http.server 8080 --bind 0.0.0.0` for the phone at `http://192.168.1.154:8080/` (the IP moves between .154 and .251) (check the IP with `ipconfig getifaddr en0`). Aidan asks for "the phone link".
- Headless Firefox screenshots fire at the load event, before the landing's fetches finish. Make a temporary copy of the page with a 1px image from a tiny local server that sleeps about 3s, so the screenshot waits. Delete the copy afterwards.
- **Freeze a moment of the landing:** in a temporary copy of `hs-landing.js`, swap `tick` for a loop that calls `step()` with fake 1/60s frames up to `?at=<seconds>`, and point the page copy at it. Use copies with new file names: Firefox may reuse a cached `hs-landing.js` otherwise.
- **Catch errors:** add a `window.onerror` overlay to the page copy (headless shows no console). A broken landing shows just the header on cream.
- **Close-up of a still hero:** a temporary root page with an `<svg viewBox="90 80 900 920">` (idle) or `"60 40 900 920"` (float), loading `hs-hero-rig.js` and calling `HeroRig.mount(svg, {}, 'rest', 'idle')` (float: `{blink:false, mirror:true}`, `'rest'`, `'float'`) after `HeroRig.ready`. Delete it afterwards.
- To see `#top` and below, remove the cover in the copy (`[data-landing-cover]{display:none}` and `#top{min-height:0}`) and use a tall window.

## Deploy checks on the preview (2026-10-07)
Preview URL: https://deploy-preview-1--handstartdigital.netlify.app (Netlify adds `X-Robots-Tag: noindex` to every deploy preview).
- Passed: `/the-difference` returns a 301 to `/services#real-work` with the fragment kept. `_headers` is applied (fonts get the immutable rule, `hs-motion.js` gets must-revalidate). `/CLAUDE.md`, `/docs/*` and `/tools/*` return 404.
- Can't be confirmed on a preview: the thank-you `X-Robots-Tag`, because the preview adds that header to every page. Check it on the production URL once something deploys there.
- Still manual: the Netlify Forms test submission and the scroll tests.

## Open items / verify after the next Netlify deploy
1. **Redirect:** `curl -sI https://<site>/the-difference` should show a 301 to `/services#real-work`. If the `#real-work` is dropped, switch the destination to `/services`.
2. **Cache headers:** `curl -sI https://<site>/assets/js/hs-motion.js` should show the always-revalidate rule.
3. **Thank-you header:** `curl -sI https://<site>/contact/thank-you/` should include `X-Robots-Tag`.
4. **Netlify Forms:** send a test submission and confirm the `website` and `services` fields show up in the dashboard.
5. **Manual scroll tests:**
   - The homepage portal ride, with the hero mascot fading out on desktop and phone.
   - The Services picker: the sticky "My handstart" bar on a real phone (the pinned stack and "Starting fresh?" fork are gone).
   - The About sticky card, with the bar-chart staying clear of the header.
6. **At launch:**
   - Remove noindex from every page **except** thank-you.
   - Leave thank-you out of any sitemap.
   - Don't add a robots.txt Disallow for it.
7. **Unused files** that could be deleted, with the user's OK:
   - `assets/steps/step-1..4-*.png` and the two `doodle-*.png` files.
   - The legacy `style.css`, `main.js`, `logo.png` and `hero-logo.png`.
   - The untracked `Handstart Digital - Services-4.html`.
8. **Copy left as is or pending:**
   - The About ticker is marked "test section, not final".
   - About's closing heading still has "Want in - or curious…" with a spaced hyphen.
   - On phones, the case study meta line wraps with a stray dot (it already did before this session).
9. **Mascot and logo generation (the current phase):**
   - The flow: Claude chat for prompts, Midjourney for images, Kling only to make `idle`/`idle-b` boil frames or social posts (not video on the site), then back here for the prep script.
   - Two hero-bib-hand prompts were drafted: Direction A (retro rubber-hose ink) and Direction B (mid-century screenprint). Lock one character, then use it as the style and character reference for the rest.
   - The logo should be explored in Midjourney, then **rebuilt as an SVG**.

## Things a new chat won't have
- **Your Netlify site URL.** It's needed for the `curl` checks.
- **The rest of the step prompts from Claude chat**, if any are left. The original handoff's "Open items" list was a duplicate of the timeline, so it never came through.
- **The Midjourney results and which direction won.**
- **The two hero-bib-hand prompts:** paste them from this chat if you want them reused word for word.

## Commentary
- **Good decisions:**
  - Going raster-first with the blob and shadow drawn in code.
  - Building the system before any page work, so every page shares one consistent system.
  - Keeping GSAP off the homepage.
  - Folding The Difference into a sharper opener for Services.
  - Leaving ABCD only on the homepage. (Moved to About on 2026-10-14, before the spend ticker.)
- **Strongest page:** Services now argues a point instead of listing services, and the fork sends people the right way for their situation.
- **Watch for:**
  - **The AI-mascot tension:** your own checklist now calls out generic AI work. Push the Midjourney art toward a distinctive, consistent style with some hand cleanup.
  - **Scroll-dependent features:** the portal, the pinned stack and the sticky card can't be checked by screenshot, so they need a real scroll test after big changes.
  - **The noindex launch step:** easy to forget, and costly if you do.
- **Quality bar so far:** every step was screenshotted on desktop and phone, and scripts were parse-checked. Bugs caught before commit included the ticker wrapping, misplaced mascot positions, the contact chip color and the case study meta wrap.
