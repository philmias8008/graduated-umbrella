# Handstart Digital: handoff summary

## Basics
- **Repo:** `~/Documents/Sites/graduated-umbrella`. A static site (plain HTML/CSS/JS, no build step) deployed on Netlify.
- **Branch:** all work happens on `ported-pages`, which is in sync with origin and 40 commits ahead of `main`. **Never touch `main` without asking.**
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

## Redesign phase (started 2026-10-07)
- **Palette:** Golden hour is decided; see the "Palette decision" section in `CLAUDE.md`. The site-wide rollout is parked until much later.
- **Test pages** (uncommitted when this was written): `/palette-test/` and `/motif-test/`.
- **Hero motion direction:** jump start (motif 5b) at the landing, then the portal dive, coming out into the cloud sky with the hero content.
- **5b hands:** currently code-drawn emoji-yellow hands with front and back grip layers. Decided: they become the white glove mascot art (the same character as hero-bib-hand) once the Midjourney poses exist.
- **Blob set:** Deeper earth with clay pink (terracotta, olive, plum, clay pink). Hex values in `CLAUDE.md`.
- **Mascot style:** Direction A (rubber-hose), modernized: flat fills, one shade, even outline, no texture.
- **Prompts:** `docs/mascot-prompts.md`. Jamm style references (jam jar and toast) are saved locally in `assets/mascots/incoming/_refs/` (gitignored).
- **Next:** run Midjourney round 1 (bib is terracotta) (glove, hero, jump-start poses).
- **Verify after deploy:** `curl -sI https://<site>/docs/handoff.md` and `/CLAUDE.md` should return 404 (hidden by `_redirects`). There is no custom 404 page, so Netlify shows its default one.

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
