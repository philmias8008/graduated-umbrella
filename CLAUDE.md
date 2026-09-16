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

Font stack (Google Fonts, loaded per-page via `<link>`):
- `--serif`: Cormorant Garamond — headings, italic emphasis
- `--sans`: Libre Franklin — body text, UI
- `--script`: Caveat — handwriting/cursive accents only

Caveat is also self-hosted as a static TTF at `assets/fonts/Caveat-SemiBold.ttf` (instantiated from Google's variable font via `fonttools`) for the homepage's draw-on animation, because opentype.js needs direct file access to glyph outlines and can't parse the woff2 that Google Fonts serves. Keep using the Google Fonts `<link>` for normal CSS text rendering; only self-host when a library needs to read outlines directly.

## No em dashes

Never use em dashes (—) anywhere: not in page copy, not in code, not in code comments, not in commit messages. Use a period, comma, or colon instead.

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
