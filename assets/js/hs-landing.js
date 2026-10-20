/* Homepage landing: HANDSTART gets jolted on, its letters fill with the cloud sky, the hero
   pops in beside the tagline, and the first scroll sends him running off to the right while
   a wipe follows his back and opens the sky section underneath. Vanilla JS, homepage-safe.
   Needs hs-hero-rig.js (and hs-sky.js for the clouds). Without motion, the cover stays in
   the page flow above the sky section and nothing animates. */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1D3F66', WHITE = '#FFFFFF';

  // intro timeline, seconds from start
  // the fists land at IMPACT[0] and the letters switch on; the fists hold still while the bump plays out
  var ARMS_IN = [0.35, 0.75], IMPACT = [0.75, 1.3], ARMS_OUT = [1.6, 1.95], HERO_IN = 1.75, CUE_IN = 2.25;
  var SHAKE_HZ = 9;
  // the name explained: two tilted Caveat notes draw on above the word as soon as the wobble settles,
  // each followed by a small arrow curling down to its half of the word (side: which end the arrow leaves from).
  // nudge and lift (fractions of the letter size) move each arrow's tip so the two don't look identical.
  // The run waits for them, so an early scroll (a desktop trackpad) can't wipe them away unseen.
  var NOTES = [{ text: 'a human hand', chars: [0, 3], at: 1.3, side: 1, tilt: -6, nudge: 0.14, lift: 0 },
               { text: 'a head start', chars: [4, 8], at: 1.9, side: -1, tilt: 5, nudge: 0, lift: 0.07 }];
  var NOTE_DRAW = 1.0, ARROW_DRAW = 0.35;

  // run: crouch, pop, then a short hold and an exponential build to a sprint
  var SQUASH = 0.22, PUFF = 0.45, HOLD = 0.2, RAMP = 0.9, TAU = 0.8, BOOST = 0.8, MIN_PERIOD = 0.16;
  var SLOW = { period: 1.0, stride: 135, lift: 100, bob: 11, lean: 5 };
  var FAST = { period: 0.3, stride: 230, lift: 190, bob: 22, lean: 16 };
  var VIEW_W = 900;          // both rigs use a 900-wide viewBox

  var landing = document.querySelector('[data-landing]');
  if (!landing) return;
  var cover = landing.querySelector('[data-landing-cover]');
  var word = cover.querySelector('[data-landing-word]');
  var jolt = cover.querySelector('[data-landing-jolt]');
  var line = cover.querySelector('[data-landing-line]');
  var heroBox = cover.querySelector('[data-landing-hero]');
  var idleSvg = heroBox.querySelector('[data-landing-idle]');
  var runSvg = heroBox.querySelector('[data-landing-run]');
  var cue = cover.querySelector('[data-landing-cue]');
  var reveal = Array.prototype.slice.call(landing.querySelectorAll('[data-landing-reveal]'));
  var header = document.getElementById('siteHeader');
  var canvas = landing.querySelector('[data-landing-sky]');
  var celebrate = landing.querySelector('[data-celebrate]');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp01(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }
  function easeOut(t) { return 1 - (1 - t) * (1 - t); }
  function span(t, r) { return clamp01((t - r[0]) / (r[1] - r[0])); }
  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  if (canvas && window.HsSky) window.HsSky(canvas);

  // ---------- the word: a cream cover with HANDSTART cut out as windows onto the sky ----------
  var W = 0, H = 0, geo = {};
  var mask = el('mask', { id: 'hsWordMask', maskUnits: 'userSpaceOnUse', x: 0, y: 0 });
  var defs = el('defs', {}, word); defs.appendChild(mask);
  var maskRect = el('rect', { fill: '#fff' }, mask);
  // the letters are windows only where they're lit: the lit layer is clipped to everything left of
  // litX (all or nothing for now; lightTo can sweep them on left to right)
  var litClip = el('clipPath', { id: 'hsLitClip', clipPathUnits: 'userSpaceOnUse' });
  var litRect = el('rect', { x: 0, y: 0, width: 0, height: 0 }, litClip);
  defs.appendChild(litClip);
  var litGroup = el('g', { 'clip-path': 'url(#hsLitClip)' }, mask);
  var hole = el('text', { fill: '#000', 'text-anchor': 'middle' }, litGroup);
  var paper = el('rect', { fill: 'var(--cream)', mask: 'url(#hsWordMask)' }, word);
  var outline = el('text', { fill: 'none', stroke: INK, 'stroke-linejoin': 'round', 'text-anchor': 'middle' }, word);
  var sparks = el('g', { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, word);
  [hole, outline].forEach(function (t) {
    t.textContent = 'HANDSTART';
    t.setAttribute('font-family', "'Libre Franklin', Arial, sans-serif");
    t.setAttribute('font-weight', '900');
  });

  // the first A is the logo's hand A, drawn in each of the three layers in place of the letter.
  // If the file doesn't load, the plain A stays.
  var HAND_A_URL = '/assets/brand/handstart-a-recraft.svg';
  var hand = null;
  var handReady = fetch(HAND_A_URL).then(function (r) { return r.ok ? r.text() : Promise.reject(); }).then(function (src) {
    var doc = new DOMParser().parseFromString(src, 'image/svg+xml');
    var vb = doc.documentElement.getAttribute('viewBox').split(/\s+/).map(Number);
    var ds = Array.prototype.map.call(doc.querySelectorAll('path'), function (p) { return p.getAttribute('d'); });
    // each layer is an outer group (filter, mask, opacity, all in screen space) around an inner
    // group that carries the scale, so blurs and stroke widths aren't scaled down with the art
    function group(parent, outerAttrs, innerAttrs, before) {
      var outer = el('g', outerAttrs);
      parent.insertBefore(outer, before || null);
      var inner = el('g', innerAttrs, outer);
      ds.forEach(function (d) {
        var path = el('path', { d: d }, inner);
        if (innerAttrs.stroke) path.setAttribute('vector-effect', 'non-scaling-stroke');
      });
      return { outer: outer, inner: inner };
    }
    // the outline is drawn on the outside of the shapes only: the hand and the A stay sky-filled
    // and the thin gaps between them close up into ink lines
    var outside = el('mask', { id: 'hsHandOutside', maskUnits: 'userSpaceOnUse', x: 0, y: 0 }, defs);
    var outsideRect = el('rect', { fill: '#fff' }, outside);
    hand = {
      box: vb,
      hole: group(litGroup, {}, { fill: '#000' }),
      outline: group(word, { mask: 'url(#hsHandOutside)' }, { fill: 'none', stroke: INK, 'stroke-linejoin': 'round' }, sparks),
      outside: group(outside, {}, { fill: '#000' }),
      outsideRect: outsideRect,
      outsideMask: outside
    };
    // blank the letter A in the text layers, keeping its space
    [[hole, 'fill'], [outline, 'stroke']].forEach(function (pair) {
      var t = pair[0], a = document.createElementNS(NS, 'tspan');
      t.textContent = 'H';
      a.textContent = 'A';
      a.setAttribute(pair[1], 'none');
      t.appendChild(a);
      t.appendChild(document.createTextNode('NDSTART'));
    });
  }).catch(function () { hand = null; });

  // cap height of Libre Franklin Black per 100px, measured once the font is in
  var capPer100 = 72;
  function measureCap() {
    var ctx = document.createElement('canvas').getContext('2d');
    ctx.font = "900 100px 'Libre Franklin'";
    var m = ctx.measureText('H');
    if (m.actualBoundingBoxAscent) capPer100 = m.actualBoundingBoxAscent;
  }

  function placeHand(size) {
    if (!hand) return;
    var start = outline.getStartPositionOfChar(1).x, end = outline.getEndPositionOfChar(1).x;
    var baseline = +outline.getAttribute('y');
    var cap = capPer100 * size / 100, k = cap / hand.box[3];
    var x = (start + end) / 2 - hand.box[2] * k / 2;
    var t = 'translate(' + x.toFixed(1) + ' ' + (baseline - cap).toFixed(1) + ') scale(' + k.toFixed(5) + ') translate(' +
      (-hand.box[0]) + ' ' + (-hand.box[1]) + ')';
    [hand.hole, hand.outline, hand.outside].forEach(function (g) { g.inner.setAttribute('transform', t); });
    [hand.outsideRect, hand.outsideMask].forEach(function (n) { n.setAttribute('width', W); n.setAttribute('height', H); });
    // twice the letters' stroke, half of it hidden inside the shapes: the same visible weight
    hand.outline.inner.setAttribute('stroke-width', (2 * outline.getAttribute('stroke-width')).toFixed(1));
  }

  function layout() {
    var r = cover.getBoundingClientRect();
    W = r.width; H = r.height;
    // the cream overhangs the screen by 40px all round, so the impact shake never shows a sliver of sky at the edges
    [maskRect, paper].forEach(function (n) {
      n.setAttribute('x', -40); n.setAttribute('y', -40);
      n.setAttribute('width', W + 80); n.setAttribute('height', H + 80);
    });
    litRect.setAttribute('height', H);
    if (litX > 0) litRect.setAttribute('width', Math.min(litX, W).toFixed(1));
    mask.setAttribute('x', -40); mask.setAttribute('y', -40);
    mask.setAttribute('width', W + 80); mask.setAttribute('height', H + 80);
    hole.setAttribute('font-size', 100);
    var per100 = hole.getComputedTextLength() || 600;
    // narrower on wide screens so the fists fit beside the word
    var size = Math.min(W * (W < 640 ? 0.92 : 0.78) / per100 * 100, H * 0.24);
    var baseline = H * (W < 640 ? 0.36 : 0.42);
    // short windows: drop the word just enough to keep room above it for the handwritten notes
    var bar = cover.querySelector('[data-hs-landing-top]');
    var barBottom = bar ? bar.getBoundingClientRect().bottom - r.top : 0;
    var noteRoom = Math.max(56, size * 0.56);
    baseline = Math.max(baseline, barBottom + noteRoom + size * 0.72);
    [hole, outline].forEach(function (t) {
      t.setAttribute('font-size', size.toFixed(1));
      t.setAttribute('x', (W / 2).toFixed(1));
      t.setAttribute('y', baseline.toFixed(1));
    });
    outline.setAttribute('stroke-width', Math.max(2, size * 0.035).toFixed(1));
    placeHand(size);
    var textW = per100 * size / 100;
    geo = { size: size, left: W / 2 - textW / 2, right: W / 2 + textW / 2,
            top: baseline - size * 0.72, mid: baseline - size * 0.36, bottom: baseline };
    cover.style.setProperty('--word-bottom', (baseline + size * 0.08).toFixed(1) + 'px');
    jolt.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    layoutNotes();
    drawNotes(notesT);
  }
  // lights the letters up to x (px from the left); 0 is all off, Infinity all on at any width
  var litX = 0;
  function lightTo(x) {
    litX = x;
    litRect.setAttribute('width', Math.max(0, Math.min(x, W)).toFixed(1));
  }
  function lettersOn(on) { lightTo(on ? Infinity : 0); }

  // Recraft jolt pieces (hero-jolt-parts.svg, loaded into the page by hs-hero-rig.js)
  var STARS = ['hj-star-1', 'hj-star-3'];
  function piece(id) {
    var g = document.getElementById(id), p = { id: id };
    ['cx', 'cy', 'w', 'h'].forEach(function (k) { p[k] = +g.getAttribute('data-' + k); });
    return p;
  }
  // place a sheet piece centred at (x, y), height px tall, turned by rot degrees
  function placePiece(node, p, x, y, px, rot) {
    var k = px / p.h;
    node.setAttribute('href', '#' + p.id);
    node.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + rot.toFixed(1) +
      ') scale(' + k.toFixed(4) + ') translate(' + (-p.cx) + ' ' + (-p.cy) + ')');
  }
  function easeOutBack(t) { var c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }

  // ---------- the name, explained: a tilted handwritten note over HAND and over START, each with an arrow ----------
  // Glyph outlines come from the self-hosted Caveat via opentype.js (loaded by the page), drawn
  // stroke by stroke and then filled, like the page's other handwriting. No font, no notes.
  var notesG = el('g', { fill: 'none', stroke: INK, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, word);
  var noteFont = null, notes = [], notesT = 0;
  if (typeof opentype !== 'undefined') {
    opentype.load('/assets/fonts/Caveat-SemiBold.ttf', function (err, f) {
      if (err || !f) return;
      noteFont = f;
      if (W) { layoutNotes(); drawNotes(notesT); }
    });
  }
  function layoutNotes() {
    while (notesG.firstChild) notesG.removeChild(notesG.firstChild);
    notes = [];
    if (!noteFont || !geo.size) return;
    var bar = cover.querySelector('[data-hs-landing-top]');
    var barBottom = bar ? bar.getBoundingClientRect().bottom - cover.getBoundingClientRect().top : 0;
    var tipY = geo.top - geo.size * 0.05;
    var fs = Math.max(20, Math.min(40, geo.size * 0.24));
    // the tilted note plus its arrow stand about 2 note-heights above the tip; shrink to fit under
    // the logo bar on short screens, and drop them if there's no room at all
    fs = Math.min(fs, (tipY - barBottom - 8) / 2);
    if (fs < 15) return;
    var baseline = tipY - fs * 0.9;
    notesG.setAttribute('stroke-width', Math.max(1.6, fs * 0.07).toFixed(2));
    NOTES.forEach(function (n) {
      var xm = (outline.getStartPositionOfChar(n.chars[0]).x + outline.getEndPositionOfChar(n.chars[1]).x) / 2;
      var w = noteFont.getAdvanceWidth(n.text, fs), out = fs * 0.15, reach = fs * 0.65;
      // the note sits off to one side so its arrow can leave from the inner end and curl down onto the word
      var cx = xm - n.side * (w / 2 + reach);
      cx = Math.max(w / 2 + 8, Math.min(W - w / 2 - 8, cx));
      var cy = baseline - fs * 0.35, a = n.tilt * Math.PI / 180;
      var g = el('g', { transform: 'rotate(' + n.tilt + ' ' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ')' }, notesG);
      var glyphs = noteFont.getPath(n.text, cx - w / 2, baseline, fs).toPathData(2);
      var fill = el('path', { d: glyphs, fill: INK, stroke: 'none', opacity: 0 }, g);
      var strokes = glyphs.split(/(?=M)/).filter(function (s) { return s.trim(); }).map(function (cd) {
        return el('path', { d: cd, 'stroke-width': (fs * 0.035).toFixed(2) }, g);
      });
      // the arrow starts just past the inner end of the note, turned with it
      var dx = n.side * (w / 2 + out), dy = baseline - fs * 0.25 - cy;
      var sx = cx + dx * Math.cos(a) - dy * Math.sin(a), sy = cy + dx * Math.sin(a) + dy * Math.cos(a);
      var aim = xm + n.nudge * geo.size;
      var tx = n.side > 0 ? Math.max(aim, sx + fs * 0.35) : Math.min(aim, sx - fs * 0.35), ty = tipY - n.lift * geo.size;
      // leaves the note sideways and arrives pointing straight down
      var shaft = el('path', { d: 'M' + sx.toFixed(1) + ' ' + sy.toFixed(1) + 'Q' + tx.toFixed(1) + ' ' + sy.toFixed(1) +
        ' ' + tx.toFixed(1) + ' ' + ty.toFixed(1) }, notesG);
      var hl = fs * 0.28, hx = hl * 0.6, hy = hl * 0.8;
      var head = el('path', { d: 'M' + (tx - hx).toFixed(1) + ' ' + (ty - hy).toFixed(1) + 'L' + tx.toFixed(1) + ' ' +
        ty.toFixed(1) + 'L' + (tx + hx).toFixed(1) + ' ' + (ty - hy).toFixed(1) }, notesG);
      notes.push({ at: n.at, fill: fill, strokes: strokes, lens: strokes.map(function (s) { return s.getTotalLength(); }),
                   shaft: shaft, shaftLen: shaft.getTotalLength(), head: head, headLen: head.getTotalLength() });
    });
  }
  function dashIn(path, len, k) {
    path.setAttribute('stroke-dasharray', len.toFixed(1));
    path.setAttribute('stroke-dashoffset', (len * (1 - k)).toFixed(1));
  }
  // time is the landing clock (seconds); Infinity shows them finished
  function drawNotes(time) {
    notesT = time;
    notes.forEach(function (n) {
      // pen strokes start one after another and overlap, then the solid letters fade in under them
      var kt = clamp01((time - n.at) / NOTE_DRAW), count = n.strokes.length;
      n.strokes.forEach(function (s, i) { dashIn(s, n.lens[i], clamp01((kt - i / count * 0.7) / 0.3)); });
      n.fill.setAttribute('opacity', clamp01((kt - 0.72) / 0.28).toFixed(2));
      // then the arrow: shaft first, the head flicks on at the end
      var ka = clamp01((time - n.at - NOTE_DRAW) / ARROW_DRAW);
      dashIn(n.shaft, n.shaftLen, easeOut(clamp01(ka / 0.75)));
      dashIn(n.head, n.headLen, clamp01((ka - 0.75) / 0.25));
    });
  }
  function notesDone(time) { return !notes.length || time > NOTES[NOTES.length - 1].at + NOTE_DRAW + ARROW_DRAW; }

  // ---------- the hero ----------
  var idle = null, runner = null;

  // ---------- jolt: arms reach in from both sides, fists bump the word, stars pop ----------
  var armL = limbPair(), armR = limbPair();
  function limbPair() {
    var g = el('g', { fill: 'none', 'stroke-linecap': 'round' }, jolt);
    return { g: g, ink: el('path', { stroke: INK }, g), core: el('path', { stroke: WHITE }, g) };
  }
  // stars behind the fists
  var impacts = [el('use', {}, jolt), el('use', {}, jolt)];
  var fistL = el('use', { href: '#hr-fist' }, jolt);
  var fistR = el('use', { href: '#hr-fist' }, jolt);

  function drawArms(reach) {
    // reach 0 is fully off screen, 1 is touching the word
    var s = geo.size / 260, fist = 105 * s, y = geo.mid;
    var lx = lerp(-fist * 1.6, geo.left - fist * 0.35, reach);
    var rx = lerp(W + fist * 1.6, geo.right + fist * 0.35, reach);
    var w = 18 * s, lw = 7.5 * s;
    [[armL, -fist * 3, lx - fist * 0.45], [armR, W + fist * 3, rx + fist * 0.45]].forEach(function (a) {
      var d = 'M' + a[1].toFixed(1) + ' ' + (y + fist * 0.9).toFixed(1) + 'Q' + ((a[1] + a[2]) / 2).toFixed(1) + ' ' +
        (y + fist * 0.9).toFixed(1) + ' ' + a[2].toFixed(1) + ' ' + (y + fist * 0.15).toFixed(1);
      a[0].ink.setAttribute('d', d); a[0].core.setAttribute('d', d);
      a[0].ink.setAttribute('stroke-width', (w + lw * 2).toFixed(1));
      a[0].core.setAttribute('stroke-width', w.toFixed(1));
    });
    // fist art points up-right at -23.5 degrees around its wrist (797, 497); turn it to point at the word
    fistL.setAttribute('transform', 'translate(' + (lx - fist * 0.45) + ' ' + (y + fist * 0.15) + ') scale(' + s + ') rotate(23.5) translate(-797 -497)');
    fistR.setAttribute('transform', 'translate(' + (rx + fist * 0.45) + ' ' + (y + fist * 0.15) + ') scale(' + (-s) + ' ' + s + ') rotate(23.5) translate(-797 -497)');
    return [[lx + fist * 0.2, y], [rx - fist * 0.2, y]];
  }

  // impact: a burst pops at each fist and fades, k runs 0 to 1 across IMPACT (negative hides them)
  function drawImpacts(tips, k) {
    impacts.forEach(function (n, side) {
      n.style.display = k < 0 ? 'none' : '';
      if (k < 0) return;
      var s = geo.size / 260, tip = tips[side];
      var px = 165 * s * (0.4 + 0.75 * easeOutBack(Math.min(1, k * 2.2)));
      placePiece(n, piece(STARS[side]), tip[0] + (side ? 1 : -1) * 10 * s, tip[1] - 6 * s, px, (side ? 14 : -14) + k * (side ? 25 : -25));
      n.setAttribute('opacity', (1 - Math.pow(k, 3)).toFixed(2));
    });
  }

  // ---------- run ----------
  var puff, puffs = [];
  function makePuff() {
    puff = el('svg', { viewBox: '60 40 900 920', class: 'hs-landing-puff', 'aria-hidden': 'true' });
    [[330, 880, 52], [420, 900, 64], [520, 905, 72], [620, 900, 62], [710, 880, 50], [470, 840, 44], [600, 845, 46]]
      .forEach(function (c) {
        var n = el('circle', { cx: c[0], cy: c[1], r: c[2], fill: 'var(--cream)', stroke: INK, 'stroke-width': 8 }, puff);
        puffs.push({ n: n, r: c[2], cx: c[0] });
      });
    puff.style.visibility = 'hidden';
    heroBox.appendChild(puff);
  }

  // ---------- state ----------
  var phase = 'intro', t = 0, pt = 0, u = 0, ru = 0.1, x = 0, last, queued = false, tips = [[0, 0], [0, 0]];

  function lock(on) {
    document.documentElement.classList.toggle('hs-landing-locked', on);
    var opts = { passive: false };
    var fn = on ? 'addEventListener' : 'removeEventListener';
    window[fn]('wheel', intent, opts);
    window[fn]('touchmove', intent, opts);
    window[fn]('keydown', key);
  }
  function intent(e) { if (e.cancelable) e.preventDefault(); go(); }
  function key(e) {
    if (['ArrowDown', 'PageDown', 'End', ' ', 'Spacebar'].indexOf(e.key) === -1) return;
    e.preventDefault(); go();
  }
  function go() {
    if (phase === 'intro' || (phase === 'ready' && !notesDone(t))) { queued = true; return; }
    if (phase === 'ready') { phase = 'squash'; pt = 0; cue.style.opacity = '0'; }
  }

  function setClip(x0) {
    // cover keeps what is right of the edge; the sky section's content shows left of it
    cover.style.clipPath = 'inset(0 0 0 ' + Math.max(0, x0).toFixed(1) + 'px)';
    var cr = cover.getBoundingClientRect();
    reveal.forEach(function (n) {
      var r = n.getBoundingClientRect();
      var keep = x0 + cr.left - r.left;
      n.style.clipPath = 'inset(0 ' + Math.max(0, r.width - keep).toFixed(1) + 'px 0 0)';
    });
  }

  function finish() {
    phase = 'done';
    cover.style.display = 'none';
    reveal.forEach(function (n) { n.style.clipPath = ''; });
    if (header) { header.style.opacity = ''; header.style.pointerEvents = ''; }
    landing.setAttribute('data-landing-done', '');
    lock(false);
    // he pops back in, celebrating beside the card he just revealed
    if (celebrate) {
      HeroRig.mount(celebrate.querySelector('svg'), { mirror: true }, 'run', 'float');
      celebrate.classList.add('is-in');
    }
  }

  // one frame; returns false once the landing is finished
  function step(now) {
    if (phase === 'done') return false;
    if (last === undefined) last = now;
    var dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
    t += dt;

    if (phase === 'intro') {
      var reach = easeOut(span(t, ARMS_IN)) * (1 - easeOut(span(t, ARMS_OUT)));
      tips = drawArms(reach);
      // impact: bursts at the fists and a heavy wobble that dies away (SHAKE_HZ back and forths a second)
      var hitting = t >= IMPACT[0] && t < IMPACT[1], hit = span(t, IMPACT);
      drawImpacts(tips, hitting ? hit : -1);
      if (hitting) {
        var amp = 6 * (geo.size / 260) * (1 - hit) * (1 - hit), ph = (t - IMPACT[0]) * SHAKE_HZ * 2 * Math.PI;
        word.style.transform = 'translate(' + (amp * Math.sin(ph)).toFixed(1) + 'px,' + (amp * 0.5 * Math.sin(ph * 1.3 + 1)).toFixed(1) + 'px)';
      } else word.style.transform = '';
      if (t >= IMPACT[0] && litX !== Infinity) lettersOn(true);
      var hi = clamp01((t - HERO_IN) / 0.35);
      line.style.opacity = hi.toFixed(2);
      heroBox.style.transform = hi < 1 ? 'scale(' + (0.6 + 0.4 * easeOut(hi)).toFixed(3) + ')' : '';
      if (t >= CUE_IN) {
        cue.style.opacity = '1';
        jolt.style.display = 'none';
        phase = 'ready';
        if (queued) go();
      }
    }

    if (!notesDone(notesT)) drawNotes(t);
    if (phase === 'ready' && queued && notesDone(t)) { queued = false; go(); }

    if (phase === 'intro' || phase === 'ready' || phase === 'squash') {
      u = (u + dt / idle.o.period) % 1;
      idle.pose(u, t);
    }

    if (phase === 'squash') {
      pt += dt;
      var sq = easeOut(Math.min(1, pt / SQUASH));
      idleSvg.style.transform = 'scale(' + (1 + 0.1 * sq) + ',' + (1 - 0.18 * sq) + ')';
      if (pt >= SQUASH) {
        phase = 'run'; pt = 0;
        idleSvg.style.visibility = 'hidden';
        runSvg.style.visibility = '';
        puff.style.visibility = '';
      }
    }

    if (phase === 'run') {
      pt += dt;
      var k = heroBox.getBoundingClientRect().width / VIEW_W;
      var pop = Math.min(1, pt / 0.15);
      runSvg.style.transform = 'scale(' + lerp(0.92, 1, pop) + ',' + lerp(1.12, 1, pop) + ')';
      var pp = Math.min(1, pt / PUFF);
      puff.style.opacity = String(1 - pp);
      puff.style.transform = 'translateX(' + (-x) + 'px)';
      puffs.forEach(function (c) {
        c.n.setAttribute('r', (c.r * (0.4 + 0.9 * easeOut(pp))).toFixed(1));
        c.n.setAttribute('cx', (c.cx + (c.cx - 520) * 0.5 * pp).toFixed(1));
      });
      if (pp >= 1) puff.style.visibility = 'hidden';

      var tt = Math.max(0, pt - HOLD);
      var r = Math.min(1, (Math.exp(tt / TAU) - 1) / (Math.exp(RAMP / TAU) - 1));
      var o = {};
      for (var key in SLOW) o[key] = lerp(SLOW[key], FAST[key], r);
      if (tt > RAMP) o.period = Math.max(MIN_PERIOD, o.period / Math.exp((tt - RAMP) / BOOST));
      runner.set(o);
      ru = (ru + dt / o.period) % 1;
      runner.pose(ru, t);
      // ground speed matches the stride so the planted foot doesn't slide
      x += 3.8 * o.stride * k / o.period * dt;
      heroBox.style.transform = 'translateX(' + x.toFixed(1) + 'px)';

      var cr = cover.getBoundingClientRect(), hr = heroBox.getBoundingClientRect();
      var back = hr.left - cr.left + hr.width * 0.3;
      setClip(back * Math.min(1, pt / 0.5));
      if (hr.left - cr.left > cr.width + 4) { setClip(cr.width); finish(); return false; }
    }
    return true;
  }
  function tick(now) { if (step(now)) requestAnimationFrame(tick); }
  function startMotion() {
    landing.setAttribute('data-landing', 'motion');
    if (header) { header.style.opacity = '0'; header.style.pointerEvents = 'none'; }
    lock(true);
    layout();
    lettersOn(false);
    line.style.opacity = '0';
    reveal.forEach(function (n) { n.style.clipPath = 'inset(0 100% 0 0)'; });
    idle = HeroRig.mount(idleSvg, {}, 'frame', 'idle');
    runner = HeroRig.mount(runSvg, {}, 'frame');
    runSvg.style.visibility = 'hidden';
    makePuff();
    cue.addEventListener('click', go);
    new ResizeObserver(layout).observe(cover);
    requestAnimationFrame(tick);
  }

  function startStill() {
    landing.setAttribute('data-landing', 'still');
    notesT = Infinity;
    layout();
    lettersOn(true);
    jolt.style.display = 'none';
    var still = HeroRig.mount(idleSvg, {}, 'rest', 'idle');
    still.rest();
    runSvg.style.display = 'none';
    cue.style.display = 'none';
    if (celebrate) HeroRig.mount(celebrate.querySelector('svg'), { blink: false, mirror: true }, 'rest', 'float');
    new ResizeObserver(layout).observe(cover);
  }

  // arrived from a link to a homepage section (/#top, /#assessment): no landing, the hero already floating
  function startSkip() {
    landing.setAttribute('data-landing', 'skip');
    cover.style.display = 'none';
    landing.setAttribute('data-landing-done', '');
    if (celebrate) {
      HeroRig.mount(celebrate.querySelector('svg'), reduce ? { blink: false, mirror: true } : { mirror: true },
        reduce ? 'rest' : 'run', 'float');
      celebrate.classList.add('is-in');
    }
  }
  if (document.documentElement.classList.contains('hs-skip-landing')) {
    HeroRig.ready.then(startSkip);
    return;
  }

  var fonts = document.fonts && document.fonts.load
    ? document.fonts.load("900 100px 'Libre Franklin'").catch(function () {}) : Promise.resolve();
  Promise.all([fonts, HeroRig.ready, handReady]).then(function () {
    measureCap();
    if (reduce) startStill(); else startMotion();
  }, function () { landing.setAttribute('data-landing', 'fallback'); });
})();
