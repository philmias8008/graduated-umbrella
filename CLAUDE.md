# Handstart Digital site

Static marketing site for Handstart Digital, deployed via Netlify. Plain HTML/CSS/JS, no build step, no framework.

**Current status, open items and what to verify: read `docs/handoff.md` at the start of every session.** Refresh it at the end of a session when things change.

**"Handoff routine":** when Aidan says it, update `docs/handoff.md` to the current state, then give him in chat: a summary of what the next chat needs to know, the files it must review (and why), any prompts he still has to run, the next steps in order, and a ready-to-paste opening message for the next chat.

## Branch safety

- **Never touch `main` without explicit confirmation first.** All work happens on `ported-pages` (or another feature branch).
- **Current hold (from 2026-10-08):** the redesign stays offline as uncommitted changes on the local branch `landing-v2`. Don't commit, merge into `ported-pages` (the Netlify preview branch) or push until Aidan says so.
- Before any destructive git operation (reset, checkout that discards changes, force-push), run `git status` and confirm with the user.

## Palette: Golden hour (decided 2026-10-07; homepage 2026-10-08; every page 2026-10-15)

Every page uses the Golden hour palette (chosen on `/palette-test/`, palette C). Tokens live in each page's own `:root` block (no shared stylesheet, repeated per file). The old names still exist and point at the new colors, so older inline styles follow: `--navy` is `var(--ink)`, `--amber` is `var(--accent)`, `--amber-lt` is `var(--accent-lt)`.

```css
--ink: #1D3F66;         /* text, headings, button faces, footer (old --navy) */
--sky: #7FB5E3;         /* surface color: header, bands, hero */
--sky-top: #3F7DC0;     /* cloud shader gradient, top */
--sky-bottom: #9DCAEE;  /* cloud shader gradient, bottom */
--accent: #E3A23B;      /* golden (old --amber) */
--accent-lt: #F0C46E;   /* light golden (old --amber-lt) */
--accent-dk: #B57A1E;   /* darker golden, the only golden that may be text on cream, and only large or bold */
--body: #4B5868;        /* paragraph text on cream */
--cream: #F7F4EE;       /* light background; also the cloud color */
--slate: #3f4a5a;
--hairline: #D6CFC2;    /* borders/dividers */
--tint: #EFEAE0;
--muted: #c3ccda;       /* muted text on dark backgrounds */
```

- Ink on cream 9.8:1, body on cream 6.6:1, ink on sky 4.9:1, ink on golden 4.9:1. All pass for body text.
- Golden is never text on cream (2.0:1). Use it for fills, underlines, hovers, dots and glows. Links are ink with a golden underline. Small labels (eyebrows, kickers, tags) are ink with a small golden dot before them, like the homepage's path-card kickers. Golden text is fine on ink.
- Header on every page: a sky band (`rgba(29,63,102,0.18)` bottom border), the SVG logo, the golden Contact button, sky mobile menu with ink links.
- **Arrow buttons (`hs-next-btn`, every page, 2026-10-19):** golden face with navy label and arrows (navy on golden passes; cream on golden would not), black block behind at rest, cream block on hover (every page, every background; 2026-10-19, Aidan liked it) with the chasing arrows flashing cream. `--reverse` now matches the default.
- In the cloud section, keep paragraph text in the lower, lighter part of the sky or on a cream card. The deep top (`--sky-top`) only supports large headings.
- Homepage motion (built): the HANDSTART landing (fist-bump jolt, letters fill with the live cloud sky), the hero's run wipes into the cloud-sky `#top` section. The old portal dive is gone. Opening the homepage with any section hash (`/#top`, `/#assessment`) skips the landing (the head script adds `hs-skip-landing`, `hs-landing.js` runs `startSkip()`): every page's Home nav link (header, mobile menu, footer) points to `/#top`, while the logo still goes to `/` and plays it. The cloud shader is `assets/js/hs-sky.js`; its sun glow takes its tint from `--accent`. Details in `docs/handoff.md`.

Accent tokens for mascot blobs (defined once in `assets/css/hs-mascots.css`; `--tint` above stays the neutral):

```css
--terracotta: #D2694A;
--sage: #7E9F6B;        /* olive */
--plum: #9C7AB0;
--clay-pink: #CF7A86;
```

`dusty-blue` and `butter` were retired on 2026-10-15: `manifest.json` now uses `plum` and `clay-pink`, and the two old names survive only as aliases (for test pages and old markup). The `amber` blob is golden. `hs-mascots.css` and `hs-mascot-loader.js` links carry `?v=` tags: bump them when those files change.

Font stack (self-hosted since 2026-10-19: every page links `/assets/css/hs-fonts.css`, which serves the woff2 files in `assets/fonts/`, and preloads the Libre Franklin and Bricolage Latin files; no page contacts Google Fonts):
- `--display`: **Bricolage Grotesque** (every page since 2026-10-15): headings at 800 with tight tracking (about -0.035em), smaller titles at 700 (-0.02em), former italic lines upright at 600. It has no italic, so don't fake one. Also the logo wordmark. Compared on `/font-test/` (dev-only).
- `--serif`: retired. Cormorant Garamond is gone from every page; the token stays as an alias for `--display` so nothing breaks, but use `--display` in new code.
- `--sans`: Libre Franklin: body text, UI
- `--script`: Caveat: handwriting/cursive accents only

Caveat is also self-hosted as a static TTF at `assets/fonts/Caveat-SemiBold.ttf` (instantiated from Google's variable font via `fonttools`) for the homepage's draw-on animation, because opentype.js needs direct file access to glyph outlines and can't parse the woff2 that Google Fonts serves. Normal text uses the self-hosted woff2 files in `hs-fonts.css`; the TTF exists only because opentype.js needs it. opentype.js itself is self-hosted too (`assets/js/opentype.min.js`, 1.3.4).

## No em dashes

Never use em dashes (—) anywhere: not in page copy, not in code, not in code comments, not in docs, not in commit messages. Use a period, comma, or colon instead.

## URL structure: folder-per-page, clean URLs

Every route is a folder with its own `index.html`, so URLs are clean (`/about`, not `/about.html`):

```
about/index.html
case-studies/index.html
case-studies/greenlife-sembalun/index.html
case-studies/soon/index.html
contact/index.html
contact/thank-you/index.html
privacy/index.html
services/index.html
terms/index.html
index.html   <- homepage, root level
```

**Logo (decided 2026-10-08, homepage first):** one line, "HANDSTART Digital™" in Bricolage Grotesque (HANDSTART 800, Digital 600), with the first A replaced by the Recraft hand A (a hand reaching across the letter). Files: `assets/brand/handstart-logo.svg` (ink) and `handstart-logo-cream.svg` (for ink backgrounds), all letters outlined. Rebuild with `python3 tools/build-logo.py <Bricolage variable ttf>`. The hand A alone is `assets/brand/handstart-a-recraft.svg`. Every page uses these SVGs (header `class="hs-header-logo"`, footer the cream one).

Each page folder keeps its own `assets/` subfolder for page images (e.g. `about/assets/aidan.jpg`). Logos are the exception: since the 2026-10-15 rollout every page pulls them from the root `assets/brand/` folder. The old per-page `handstart-logo-header.png` / `-footer.png` copies are unused now.

## Other standing conventions

- **Voice: first person singular.** Handstart is one person, so site copy says "I/me/my", not "we/us/our" (Privacy and Terms are the exception). Keep an inclusive "we" only where it means you and me together ("Where shall we begin?", "How we can work together").
- **`<meta name="robots" content="noindex">`** is present on every current page (site isn't live/indexed yet). Keep it on new pages unless told the site has launched. At launch, remove it everywhere **except `contact/thank-you/`**, which is permanently noindex (its tag is marked with a comment, and `_headers` also sends `X-Robots-Tag: noindex` for it). If a sitemap is ever added, leave `/contact/thank-you/` out of it. Do not add a robots.txt `Disallow` for it: that would stop crawlers from seeing the noindex.
- **Title tag pattern**: `<title>Page Name | Handstart Digital</title>` for every page except the homepage, which is bare `Handstart Digital`.
- **Contact form** uses Netlify Forms (`data-netlify="true"`, `netlify-honeypot="bot-field"`, hidden `form-name` input) with an explicit `action="/contact/thank-you/"` redirect to `contact/thank-you/index.html`. No backend or JS form handling. Every field Netlify should capture must exist in the static HTML (including the hidden `services` field, which JS only fills in). Fields: name, email, website (optional, plain text so "mybiz.com" passes), services (hidden), message.
- **Analytics:** none installed. `hsConversion()` on the thank-you page is an empty hook called on load; wire tracking there if it is ever added.
- **External scripts**: prefer self-hosting (fonts and opentype.js are, since 2026-10-19). If a CDN is ever needed, pin an exact version rather than a floating `@latest` tag, and add the provider to the privacy policy.
- **Cal.com** (Contact, thank-you, Services): its embed script loads on the first click of a `[data-cal-link]` button, which opens the booking pop-up itself; nothing contacts Cal.com before that.
- **Legacy root files** (`style.css`, `main.js`, `logo.png`, `hero-logo.png`) are leftovers from an earlier version of the site and are not referenced by any current page. Don't assume they're live; don't build on them without checking first.
- Git identity for this repo is set locally to `Aidan Paggao <philmias8008@gmail.com>`.

## Mascot system and build rules

Rules for all future work:

- **No em dashes** anywhere in code, copy, comments, or docs (see "No em dashes" above).
- **Phrases removed from the site** (like the homepage services ticker) are kept in `docs/copy-bank.md`.
- **Homepage stays library-free for motion.** Lenis, GSAP, and ScrollTrigger must never load on the homepage. Homepage animation is CSS or vanilla JS only. (opentype.js for the handwriting draw-on is a font parser, not a motion library.)
- **Reduced motion.** Every animation needs a `prefers-reduced-motion` fallback that shows a static state.
- **No generic HTML comments** like `<!-- header -->`. Remove existing ones when you touch a file. Use specific comments only when they explain a non-obvious decision.
- **Brand tokens** stay as defined in "Palette: Golden hour" above. Fonts: Bricolage Grotesque, Libre Franklin, Caveat.
- **Workflow.** Before editing, show a short plan. After editing, summarize what changed and which files.

### The hero (SVG, rigged in code)

- The hero glove is Recraft SVG art, split into parts and animated in code. Recraft replaced Midjourney: native SVG, exact colors. The remaining mascots will follow in Recraft in the hero's style.
- `assets/js/hs-hero-rig.js`: `HeroRig.mount(svg, opts, mode, kind)`, kind `run`, `idle` or `float`; mode `run` animates, `rest` and `frame` hold still. Parts live in `assets/mascots/hero/`; rebuild them with `tools/build-hero-rig.py {runner|idle|float|bolts} <source svg>` (or `jolt <_refs folder>` for the landing's impact stars) (sources in the local-only `assets/mascots/incoming/_refs/`).
- `assets/js/hs-landing.js` runs the homepage landing sequence (timings at the top). `/mascot-test/run/` is the dev test page for the rigs.
- Recraft prompts: always spell out the whole character first, then `Pose: ...`. See `docs/mascot-prompts.md`.

### Using mascots (placeholder and raster system)

- The other mascots still use the older system: transparent WebP, spec in `docs/mascot-raster-spec.md`, with SVG placeholders until art exists. `docs/mascot-svg-contract.md` is optional, for the logo and any code-built geometric characters.
- Markup: `<figure class="hs-mascot" data-mascot="magnifier" data-state="idle" data-blob="amber"></figure>`.
  - `data-state`: `idle`, `hover` (held on, for demos), `reveal` (pops in on scroll), `static`. Use `idle` or `reveal` on real pages; real hover triggers the hover state.
  - `data-blob`: `terracotta`, `sage`, `plum`, `clay-pink`, `tint`, `amber`, or `none` (`butter` and `dusty-blue` are retired aliases). Optional and dev-only now: without it the loader sets `none`, so the site shows no blobs. There is no navy blob.
  - Optional: `data-pose`, `data-hover-pose`, `data-boil` (4 fps two-pose swap), `data-eager` (above the fold), `data-label` (alt text; otherwise decorative).
- Inside phrasing-only elements (`<p>`, `<h1>` to `<h6>`, `<button>`) use `<span class="hs-mascot" ...>` instead of `<figure>`, which is invalid there. The loader and CSS work on any tag.
- The component draws the blob and shadow. Never bake them into art.
- Size with `--hs-mascot-size` (defaults to 100% width). `aspect-ratio` reserves the space before art arrives, so there is no layout shift.
- Every page that shows a mascot loads `/assets/css/hs-mascots.css` and `/assets/js/hs-mascot-loader.js` (both homepage-safe). Pages that already load GSAP may also load `/assets/js/hs-mascots.js` after GSAP and ScrollTrigger. Never on the homepage.
- **No blobs anywhere (2026-10-18):** Aidan dropped them site-wide. The loader gives every mascot `data-blob="none"` unless its figure asks for a colour (only the dev pages do); the manifest's blob colours are unused. Mascots sit freely on the page. Mascot sizes went up about 1.3 to 1.5 times site-wide on 2026-10-18, and the homepage services-preview title and pillar names came down to make room.
- Homepage slots: the rigged hero in the landing (idle, run) and floating beside the `#top` card (not through this loader), the four pillar mascots in "What do you get?" (browser-window, magnifier, megaphone, lightbulb), compass / clipboard / block / finish-flag crossfading with the four steps, all rigs (the first three play their gag as their step fades in; the finish-flag rig celebrates when the lane's runner reaches the end: `data-gag-cue` turns off its own timer and the steps script calls its gag), clipboard and power-button on the two path cards. The ABCD panels deliberately have no mascots.
- The Difference page is gone: its content is the Services page's "How to spot template work" section (`#real-work`, an h2 after the picker), and `_redirects` sends `/the-difference` there with a 301. It is not in any nav.
- Services order (rebuilt 2026-10-16): the opening ("Here's what I build.", the page's only `h1`, with the typed search pill and a "Find your gaps" link to `/#assessment`), then `#build`: five service panels that are also the picker (question, pitch, and every service as a tappable row with a one-line explanation; the intro column is sticky on desktop) with the floating "My handstart" bar riding along the bottom, then the full tray (`#my-handstart`: Book a call, Send a message), How to spot template work, What I don't do, closing. Nothing is listed twice: the old pinned problem stack and separate build cards are gone. Services has no ABCD block; ABCD ("Why work with us") lives on About only.
- Services slots: lightbulb, browser-window, magnifier, megaphone and speech-bubble on the five service panels (plus mini copies in the tray), magnifier and clipboard in "How to spot template work". Services loads the GSAP enhancement (`hs-mascots.js`).
- "What I don't do" on Services has no mascot (glove-stop dropped 2026-10-18).
- About slots (bar-chart and ribbon dropped 2026-10-18 so the page isn't crowded, the handshake on 2026-10-19; the credentials card keeps its `.hs-cred-wrap` sticky wrapper): power-button beside the "I see it, we decide it, we start it." pull-line, stopwatch hanging off the left of the daily-counts ticker (it replaced the megaphone on 2026-10-18, ticking along with the counts). About loads the GSAP enhancement.
- Case study pages (Greenlife, the coming-soon page and every future one) close with **Build your handstart** (to the top of `/services`) plus Contact, not the homepage assessment.
- Case Studies slots (2026-10-19): one case-files rig beside the "Latest Work" heading, the magnifier sifting floating manila folders (the bar-chart was dropped as too close to Google Analytics; the podium and foam finger too: a podium ranks the work). The individual case study pages (Greenlife, the coming-soon page) have no mascots and don't load the mascot files. Ledger entries carry a status chip (`hs-status--live` light sage `#A9C29A`, `hs-status--progress` light golden) above the title.
- "Build your handstart" picks are saved to sessionStorage `hs_selected_services` as `[{id, label, group}]`, passed to the contact link as `?services=` (comma-separated slugs, since some labels contain commas), and sent to Cal.com as `notes`. The contact page prefills its message from `?services=`.
- **Rigged mascots** (`"type": "rig"`, decided 2026-10-17, spec in `docs/mascot-rig-spec.md`): Recraft draws the object with no face or limbs; `tools/build-mascot-rig.py` splits it into `assets/mascots/rig/{id}-parts.svg`; `assets/js/hs-mascot-rig.js` (vanilla, homepage-safe, loaded by the loader only when a page has a rig) adds the eyes, mouth and limbs and plays an idle plus a gag. `data-state="static"` shows the rig's still. Rigs: magnifier (Search pillar, Services Search panel), lightbulb (Strategy pillar, Services Strategy panel) megaphone (Marketing pillar, Services Marketing panel), all limbless, and browser-window, a computer typing at its keyboard (Websites & Shopify pillar, Services panel), and speech-bubble (Services Retention panel; a separate Recraft tail that wags, typing-dots gag), finish-flag (homepage step 4; a Recraft cloth bent by a travelling wave in code), the hero on the thank-you page (`hero-thumbs`: his victory-pose drawing from the homepage landing posed by the code into two thumbs-up by his chest, arms coming out of the band's sides and looping back in sideways to the wrist on the outer side of the kit's unshaded Recraft thumbs-up hand, a blink and a slow breath, gag off for now; `hero-cheer`, the same drawing bouncing with fists up then jumping with stars, is on the dev page; the two-hero high-five and handshake are parked on the dev page until there is art, see the artist brief in the spec), power-button (homepage "Already know" card, About pull-line, Contact "Send it" button, where hovering the button switches it on), compass, clipboard and block (homepage steps 1 to 3, the block building a small pyramid with two golden blocks that fall into place; clipboard also on Services and the coming-soon page, animated on the homepage "Not sure yet" path card too, beside the moving power button; its `data-still="rest"` gives reduced motion the unticked rest rather than the all-ticked gag), and stopwatch (built for step 3, now beside the About ticker), each with its own idle and eye movement; their effect marks (rays, sound waves) are Recraft art, not code strokes. Still slots: the homepage finale row, the Services tray copies, the magnifier in "How to spot template work". Dev page `/mascot-test/rig/`. The loader's `RIG_SRC` carries a `?v=` tag: bump it when `hs-mascot-rig.js` changes.
- `assets/mascots/manifest.json` lists every mascot with its default `blob`. Finished art adds `type` and `poses` (optional `ratio`). An entry without a `type` shows its SVG placeholder from `assets/mascots/placeholder/` (regenerate with `python3 tools/make-mascot-placeholders.py`). Raw art goes in `incoming/`, checked art in `final/`.
- Final raster art goes through `python3 tools/prepare-mascots.py`: raw `{id}-{pose}.png` files in `assets/mascots/incoming/` (gitignored) come out as framed 600/1200px WebPs in `final/` with the manifest updated. Steps and warnings are in `docs/mascot-raster-spec.md`.
- `/palette-test/` (palettes, cloud shader, blob options) and `/motif-test/` (fingerprint, on your marks, jump start, jump start with hands) are dev-only ideation pages, noindex and unlinked. Keep them for reference during the redesign.
- Mascot prompts (Recraft now, Midjourney before) live in `docs/mascot-prompts.md`. Add every approved prompt there with its result.
- `/mascot-test/` is a dev-only page showing every mascot in every state, in CSS mode and `?gsap` mode, plus demo raster characters from `mascot-test/demo/` (regenerate with `python3 tools/make-demo-raster.py`). It is not linked from the site.
