# Handstart Digital: handoff summary

## Basics
- **Repo:** `~/Documents/Sites/graduated-umbrella`. A static site (plain HTML/CSS/JS, no build step) deployed on Netlify.
- **Branch:** all work happens on `ported-pages`, which is in sync with origin and 49 commits ahead of `main`. **Never touch `main` without asking.**
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
  - magnifier beside the "Being online ≠ Being found" heading.
  - Four step mascots crossfade with the step timer, replacing the old image plate.
  - Path cards use clipboard and power-button.
  - ABCD has no mascots.
- **Services, top to bottom:**
  - **Real work vs template work** is the page's only `h1`, with the setup paragraph including the agency-ad line, the plumber mockup and a 6-item checklist.
  - **A two-card fork:** "Already paying someone?" goes to `/contact`, and "Starting fresh?" scrolls to `#work-together`.
  - **How We Can Work Together** (`h2`).
  - **The pinned 5-panel wipe stack**, unchanged.
  - **Build your handstart:**
    - Checkbox chips feed a sticky tray.
    - Picks are saved to sessionStorage `hs_selected_services` as `[{id,label,group}]`.
    - They're passed to the contact link as `?services=` slugs, and to the Cal.com popup as `notes`.
  - **What we don't do**, with glove-stop.
  - **The closing section.**
- **Contact:**
  - An optional website field, entered as plain text.
  - A hidden `services` field in the static form.
  - Removable chips for the picks.
  - A Book a call button beside Send it, which has a power-button mascot.
- **Thank-you:**
  - "High five. Got it."
  - A Book a call now button plus a Case Studies link.
  - The high-five mascot slaps in on load.
  - A **permanent noindex**, as a marked meta tag plus `X-Robots-Tag` in `_headers`.
  - An empty `hsConversion()` hook. No analytics are installed.
- **About:**
  - The stat counts up to $15M+, labeled "in annual ad spend managed, five years running".
  - bar-chart peeks over the card, which now sticks from a wrapper.
  - handshake and ribbon sit beside the narrative.
  - A power-button pull-line: "I see it, we decide it, we start it."
  - megaphone beside the ticker.
  - The closing section is Contact plus "See what we do".
- **Case Studies:**
  - podium and foam-finger in the hero.
  - Live and In progress chips.
  - clipboard on the coming-soon page.
  - Greenlife has the bar-chart in its results header, with real numbers and no TODO boxes.
- **Nav:** Services, About, Case Studies, plus the Contact button. The Difference is gone, and `/the-difference` redirects 301 to `/services#real-work`.
- **Netlify files:** `_headers` (cache rules plus the thank-you noindex) and `_redirects`.

## Redesign phase (started 2026-10-07, paused mid mascot round 1)

**Pick up here:** run the hero prompt in Midjourney with the locked glove as `--oref`, then critique the batch.

### Decided
- **Palette:** Golden hour (ink `#1D3F66`, sky `#7FB5E3`, golden `#E3A23B`, cream unchanged). Full tokens and contrast rules in the "Palette decision" section of `CLAUDE.md`. The site-wide rollout is parked until much later; live pages stay navy and amber.
- **Blob set:** Deeper earth with clay pink: terracotta `#D2694A`, olive `#7E9F6B`, plum `#9C7AB0`, clay pink `#CF7A86`.
- **Hero motion direction:** jump start (motif 5b) on HANDSTART at the landing, then the portal dive through a letter, coming out into the golden-hour cloud sky (WebGL shader from `/palette-test/`) where the hero content lives.
- **5b hands:** become the white glove mascot art once the poses exist (currently code-drawn emoji-yellow hands with back and front grip layers, so the letter sits between palm and fingers).
- **Mascot style:** Direction A, rubber-hose modernized: flat fills, one flat edge shade, even outline, no texture. Jamm (jam jar, toast) as style reference.
- **Hero (hero-bib-hand):** white cartoon glove, thumb and three fingers, face on the back of the hand, standing on two fingers mid-sprint, terracotta racing bib with a 1, golden cuff.

### Mascot round 1 progress
- **Glove: locked.** Midjourney #11 from Vary Region, cleaned with `tools/clean-line-art.py` (stitch dashes removed, outline recolored to ink, background whitened). File: `assets/mascots/incoming/glove-idle.png` (local only, gitignored).
- **Hero:** next. Prompt is in `docs/mascot-prompts.md`, section 2.
- **Jump-start poses** (reach, half, grip with green bar, release): after the hero. Section 3 of the prompts doc.
- **Lessons:** Midjourney turns the Jamm `--sref` outline black and keeps adding Mickey-style stitch dashes on the back of the glove. Fix both in cleanup with the tool, not with more rerolls. Use Subtle upscale, not Creative.

### Where things are
- `docs/mascot-prompts.md`: every prompt, round results and decisions. Add each approved image there.
- `tools/clean-line-art.py`: run on every raw Midjourney image before `tools/prepare-mascots.py`.
- `assets/mascots/incoming/_refs/` (local only): Jamm references, Gemini glove, Vary Region originals, cleaned #12 backup.
- Test pages (noindex, unlinked, committed): `/palette-test/` (palettes A, B, C, cloud shader, blob sets) and `/motif-test/` (1 fingerprint, 4 on your marks, 5 jump start, 5b jump start with hands).
- Preview site: https://deploy-preview-1--handstartdigital.netlify.app (palette page: `/palette-test/?p=c`).
- `_redirects` hides `/CLAUDE.md`, `/README.md`, `/.gitignore`, `/docs/*` and `/tools/*` (404, verified on the preview).

### Later, in order
1. Hero art, then the jump-start poses, then the remaining mascots with the hero as `--sref`.
2. Swap the 5b code hands for the glove art (images per pose, mirrored for the right hand).
3. Logo exploration in Midjourney, rebuilt as SVG.
4. Golden hour rollout across the site, blob remap in `manifest.json`, the cloud sky after the portal dive.
5. Copy rework, page by page.

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
   - The Services pinned stack, which now sits lower on the page, plus the "Starting fresh?" scroll.
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
   - "Build your handstart" is placeholder copy.
   - The About ticker is marked "test section, not final".
   - About's closing heading still has "Want in - or curious…" with a spaced hyphen.
   - The coming-soon page still has its two buttons.
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
  - Leaving ABCD only on the homepage.
- **Strongest page:** Services now argues a point instead of listing services, and the fork sends people the right way for their situation.
- **Watch for:**
  - **The AI-mascot tension:** your own checklist now calls out generic AI work. Push the Midjourney art toward a distinctive, consistent style with some hand cleanup.
  - **Scroll-dependent features:** the portal, the pinned stack and the sticky card can't be checked by screenshot, so they need a real scroll test after big changes.
  - **The noindex launch step:** easy to forget, and costly if you do.
- **Quality bar so far:** every step was screenshotted on desktop and phone, and scripts were parse-checked. Bugs caught before commit included the ticker wrapping, misplaced mascot positions, the contact chip color and the case study meta wrap.
