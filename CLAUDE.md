# Handstart Digital site

Static marketing site for Handstart Digital, deployed via Netlify. Plain HTML/CSS/JS, no build step, no framework.

## Branch safety

- **Never touch `main` without explicit confirmation first.** All work happens on `ported-pages` (or another feature branch); commit and push there.
- Before any destructive git operation (reset, checkout that discards changes, force-push), run `git status` and confirm with the user.

## Brand colors and fonts

Defined as CSS custom properties in each page's own `:root` block (no shared stylesheet, repeated per file):

```css
--navy: #1B2B4B;      /* primary dark, backgrounds/headings */
--amber: #C8873A;     /* accent, CTAs, links */
--amber-lt: #e0a558;  /* lighter accent variant */
--cream: #F7F4EE;     /* light background */
--slate: #3f4a5a;
--body: #5a6472;       /* body text on light backgrounds */
--hairline: #D6CFC2;   /* borders/dividers */
--tint: #EFEAE0;
--muted: #c3ccda;      /* muted text on dark backgrounds */
```

Accent tokens for mascot blobs (defined in `assets/css/hs-mascots.css`; `--tint` above stays the neutral):

```css
--terracotta: #E08E72;
--sage: #A3B899;
--dusty-blue: #8FA6C9;
--butter: #E8B96A;
```

Font stack (Google Fonts, loaded per-page via `<link>`):
- `--serif`: Cormorant Garamond: headings, italic emphasis
- `--sans`: Libre Franklin: body text, UI
- `--script`: Caveat: handwriting/cursive accents only

Caveat is also self-hosted as a static TTF at `assets/fonts/Caveat-SemiBold.ttf` (instantiated from Google's variable font via `fonttools`) for the homepage's draw-on animation, because opentype.js needs direct file access to glyph outlines and can't parse the woff2 that Google Fonts serves. Keep using the Google Fonts `<link>` for normal CSS text rendering; only self-host when a library needs to read outlines directly.

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
the-difference/index.html
index.html   <- homepage, root level
```

Each page folder keeps its own self-contained `assets/` subfolder (e.g. `about/assets/handstart-logo-header.png`) with copies of the header/footer logos, rather than referencing a shared root path. The homepage is the exception: it pulls its logos from the root-level `assets/` folder. Follow whichever pattern matches the file you're editing; don't consolidate them into a shared path without asking.

## Other standing conventions

- **`<meta name="robots" content="noindex">`** is present on every current page (site isn't live/indexed yet). Keep it on new pages unless told the site has launched.
- **Title tag pattern**: `<title>Page Name | Handstart Digital</title>` for every page except the homepage, which is bare `Handstart Digital`.
- **Contact form** uses Netlify Forms (`data-netlify="true"`, `netlify-honeypot="bot-field"`, hidden `form-name` input) with an explicit `action="/contact/thank-you/"` redirect to `contact/thank-you/index.html`. No backend or JS form handling.
- **External scripts**: pin to an exact CDN version (e.g. `opentype.js@1.3.4` from cdnjs) rather than a floating `@latest` tag.
- **Legacy root files** (`style.css`, `main.js`, `logo.png`, `hero-logo.png`) are leftovers from an earlier version of the site and are not referenced by any current page. Don't assume they're live; don't build on them without checking first.
- Git identity for this repo is set locally to `Aidan Paggao <philmias8008@gmail.com>`.

## Mascot system and build rules

Rules for all future work:

- **No em dashes** anywhere in code, copy, comments, or docs (see "No em dashes" above).
- **Homepage stays library-free for motion.** Lenis, GSAP, and ScrollTrigger must never load on the homepage. Homepage animation is CSS or vanilla JS only. (opentype.js for the handwriting draw-on is a font parser, not a motion library.)
- **Reduced motion.** Every animation needs a `prefers-reduced-motion` fallback that shows a static state.
- **No generic HTML comments** like `<!-- header -->`. Remove existing ones when you touch a file. Use specific comments only when they explain a non-obvious decision.
- **Brand tokens** stay as defined in "Brand colors and fonts" above. Fonts: Cormorant Garamond, Libre Franklin, Caveat.
- **Workflow.** Before editing, show a short plan. After editing, summarize what changed and which files.

### Using mascots

- Mascots are raster by default: transparent WebP from Midjourney, spec in `docs/mascot-raster-spec.md`. `docs/mascot-svg-contract.md` is optional, for the logo and any code-built geometric characters.
- Markup: `<figure class="hs-mascot" data-mascot="magnifier" data-state="idle" data-blob="amber"></figure>`.
  - `data-state`: `idle`, `hover` (held on, for demos), `reveal` (pops in on scroll), `static`. Use `idle` or `reveal` on real pages; real hover triggers the hover state.
  - `data-blob`: `terracotta`, `butter`, `sage`, `dusty-blue`, `tint`, `amber`, or `none`. Optional: every mascot has a default blob in `manifest.json`, and `data-blob` on the figure overrides it. There is no navy blob.
  - Optional: `data-pose`, `data-hover-pose`, `data-boil` (4 fps two-pose swap), `data-eager` (above the fold), `data-label` (alt text; otherwise decorative).
- Inside phrasing-only elements (`<p>`, `<h1>` to `<h6>`, `<button>`) use `<span class="hs-mascot" ...>` instead of `<figure>`, which is invalid there. The loader and CSS work on any tag.
- The component draws the blob and shadow. Never bake them into art.
- Size with `--hs-mascot-size` (defaults to 100% width). `aspect-ratio` reserves the space before art arrives, so there is no layout shift.
- Every page that shows a mascot loads `/assets/css/hs-mascots.css` and `/assets/js/hs-mascot-loader.js` (both homepage-safe). Pages that already load GSAP may also load `/assets/js/hs-mascots.js` after GSAP and ScrollTrigger. Never on the homepage.
- Homepage slots: hero-bib-hand beside the portal tagline (desktop and tablet only, no room on phones), magnifier beside the "Being online / Being found" heading, compass / clipboard / stopwatch / baton crossfading with the four steps, clipboard and power-button on the two path cards. The ABCD panels deliberately have no mascots.
- `assets/mascots/manifest.json` lists every mascot with its default `blob`. Finished art adds `type` and `poses` (optional `ratio`). An entry without a `type` shows its SVG placeholder from `assets/mascots/placeholder/` (regenerate with `python3 tools/make-mascot-placeholders.py`). Raw art goes in `incoming/`, checked art in `final/`.
- `/mascot-test/` is a dev-only page showing every mascot in every state, in CSS mode and `?gsap` mode, plus demo raster characters from `mascot-test/demo/` (regenerate with `python3 tools/make-demo-raster.py`). It is not linked from the site.
