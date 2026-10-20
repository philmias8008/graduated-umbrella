/* Mascot rigs: the Jamm-style animated mascots (docs/mascot-rig-spec.md). Vanilla JS, no
   libraries, so it is homepage-safe. Recraft draws each object with no face or limbs
   (assets/mascots/rig/{id}-parts.svg, built by tools/build-mascot-rig.py); this file adds the
   hero's eyes, a mouth, rubber-hose limbs, the hero's shoe and fist and the kit hands
   (kit-parts.svg), then plays an idle loop with a gag every few seconds. Load with data-base
   pointing at the parts if they are not in /assets/mascots/rig/. */
(function () {
  'use strict';

  var BASE = (document.currentScript && document.currentScript.dataset.base) || '/assets/mascots/rig/';
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1D3F66';
  var WHITE = '#FFFFFF';
  var uid = 0;

  // hero art anchors (hero 1024 space), from hs-hero-rig.js
  var SHOE_ANKLE = [700, 782];
  var FIST_WRIST = [797, 497], FIST_ANGLE = -23.5;
  // the hero's eyes around their shared centre: [dx, dy, rx, ry, pupil dx, pupil dy, pupil r]
  var EYES = { r: [54, -5, 59, 77, 19, -11, 47.3], l: [-54, 5, 71, 81, 25, -3, 48.3] };
  var EYE_LINE = 8;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }
  function smooth(t) { t = clamp(t); return t * t * (3 - 2 * t); }
  function span(p, a, b) { return smooth((p - a) / (b - a)); }
  function back(t) { t = clamp(t); var c = 2.2; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  function angle(a, b) { return Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI; }

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function use(id, parent) { return el('use', { href: '#' + id }, parent); }

  // rubber hose: a quadratic curve from a to b that bows to one side to keep its length near len
  function hose(a, b, len, side) {
    var dx = b[0] - a[0], dy = b[1] - a[1], c = Math.hypot(dx, dy) || 1;
    var sag = len > c ? Math.sqrt(3 * c * (len - c) / 8) : 0;
    var nx = -dy / c * side, ny = dx / c * side;
    var cx = (a[0] + b[0]) / 2 + nx * sag * 2, cy = (a[1] + b[1]) / 2 + ny * sag * 2;
    return 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + 'Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) +
      ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1);
  }

  function place(node, at, deg, pivot, scale, mirror) {
    node.setAttribute('transform', 'translate(' + at[0].toFixed(1) + ' ' + at[1].toFixed(1) + ') rotate(' +
      deg.toFixed(1) + ') scale(' + (mirror ? -scale : scale) + ' ' + scale + ') translate(' + (-pivot[0]) + ' ' + (-pivot[1]) + ')');
  }

  function Limb(parent, core, line) {
    var g = el('g', { fill: 'none', 'stroke-linecap': 'round' }, parent);
    this.ink = el('path', { stroke: INK, 'stroke-width': core + line * 2 }, g);
    this.core = el('path', { stroke: WHITE, 'stroke-width': core }, g);
  }
  Limb.prototype.draw = function (d) { this.ink.setAttribute('d', d); this.core.setAttribute('d', d); };

  // the hero's two touching eyes, drawn in code so they can squint, pop and glance
  function Eyes(parent) {
    var self = this;
    this.g = el('g', {}, parent);
    this.parts = {};
    ['l', 'r'].forEach(function (k) {
      var E = EYES[k], id = 'mr-eye-' + (++uid);
      var g = el('g', {}, self.g);
      var clip = el('clipPath', { id: id }, g);
      el('ellipse', { cx: 0, cy: 0, rx: E[2], ry: E[3] }, clip);
      el('ellipse', { cx: 0, cy: 0, rx: E[2], ry: E[3], fill: WHITE }, g);
      var pupil = el('circle', { cx: E[4], cy: E[5], r: E[6], fill: INK }, el('g', { 'clip-path': 'url(#' + id + ')' }, g));
      el('ellipse', { cx: 0, cy: 0, rx: E[2], ry: E[3], fill: 'none', stroke: INK, 'stroke-width': EYE_LINE }, g);
      self.parts[k] = { g: g, pupil: pupil };
    });
  }
  // at: centre, scale: size, squash: 1 open to 0 shut, look: pupil offset in hero units
  Eyes.prototype.set = function (at, scale, squash, look) {
    this.g.setAttribute('transform', 'translate(' + at[0].toFixed(1) + ' ' + at[1].toFixed(1) + ') scale(' + scale.toFixed(3) + ')');
    for (var k in this.parts) {
      var E = EYES[k], P = this.parts[k];
      P.g.setAttribute('transform', 'translate(' + E[0] + ' ' + E[1] + ') scale(1 ' + Math.max(0.08, squash).toFixed(3) + ')');
      P.pupil.setAttribute('transform', 'translate(' + look[0].toFixed(1) + ' ' + look[1].toFixed(1) + ')');
    }
  };

  // closed smile that opens into an "o"
  function Mouth(parent, line) {
    this.smile = el('path', { fill: 'none', stroke: INK, 'stroke-width': line, 'stroke-linecap': 'round' }, parent);
    this.o = el('ellipse', { fill: INK }, parent);
  }
  // a cool one-sided smirk, from a closed smile at g 0: the right corner lifts
  Mouth.prototype.smirk = function (at, w, g) {
    var x = at[0], y = at[1];
    this.o.setAttribute('rx', 0); this.o.setAttribute('ry', 0);
    this.smile.setAttribute('fill', 'none');
    this.smile.setAttribute('d', 'M' + (x - w * (1 - 0.15 * g)) + ' ' + (y + 0.08 * w * g) + 'Q' + (x + 0.15 * w * g) + ' ' + (y + w * (0.75 - 0.2 * g)) +
      ' ' + (x + w * (1 + 0.05 * g)) + ' ' + (y - 0.4 * w * g));
  };
  // a wide open grin with no teeth (the celebration mouth), from a closed smile at g 0
  Mouth.prototype.grin = function (at, w, g) {
    var x = at[0], y = at[1];
    this.o.setAttribute('rx', 0); this.o.setAttribute('ry', 0);
    if (g < 0.15) { this.set(at, w, 0); return; }
    var ww = w * (1 + 0.25 * g), d = ww * 0.8 * g;
    // the top lip dips a little so it reads as a smile, not a flat D
    this.smile.setAttribute('d', 'M' + (x - ww) + ' ' + y + 'Q' + x + ' ' + (y + 0.22 * d) + ' ' + (x + ww) + ' ' + y +
      'C' + (x + ww) + ' ' + (y + d) + ' ' + (x - ww) + ' ' + (y + d) + ' ' + (x - ww) + ' ' + y + 'Z');
    this.smile.setAttribute('fill', INK);
  };
  Mouth.prototype.set = function (at, w, open) {
    this.smile.setAttribute('fill', 'none');
    var x = at[0], y = at[1];
    if (open < 0.15) {
      this.o.setAttribute('rx', 0); this.o.setAttribute('ry', 0);
      this.smile.setAttribute('d', 'M' + (x - w) + ' ' + y + 'Q' + x + ' ' + (y + w * 0.75) + ' ' + (x + w) + ' ' + y);
    } else {
      this.smile.setAttribute('d', '');
      this.o.setAttribute('cx', x); this.o.setAttribute('cy', y + w * 0.3);
      this.o.setAttribute('rx', (w * 0.45 * (0.6 + 0.4 * open)).toFixed(1));
      this.o.setAttribute('ry', (w * 0.6 * open).toFixed(1));
    }
  };

  // a hand at the end of an arm: the hero's fist, or a kit hand (open, point, thumb, wave)
  function Hand(parent, fistScale, handScale) {
    this.fist = use('mk-fist', parent);
    this.kit = {};
    this.fistScale = fistScale; this.handScale = handScale;
    this.parent = parent;
    this.show = 'fist';
  }
  // aim turns a kit hand further; fixed sets its rotation outright (a thumbs-up stays upright)
  Hand.prototype.hide = function () { (this.show === 'fist' ? this.fist : this.kit[this.show]).style.display = 'none'; this.hidden = true; };
  Hand.prototype.put = function (kind, wrist, armDeg, mirror, aim, fixed) {
    if (this.hidden) { (this.show === 'fist' ? this.fist : this.kit[this.show]).style.display = ''; this.hidden = false; }
    if (kind !== this.show) {
      (this.show === 'fist' ? this.fist : this.kit[this.show]).style.display = 'none';
      if (kind !== 'fist' && !this.kit[kind]) this.kit[kind] = use('mk-hand-' + kind, this.parent);
      (kind === 'fist' ? this.fist : this.kit[kind]).style.display = '';
      this.show = kind;
    }
    if (kind === 'fist') {
      place(this.fist, wrist, mirror ? armDeg - (180 - FIST_ANGLE) : armDeg - FIST_ANGLE, FIST_WRIST, this.fistScale, mirror);
    } else {
      var src = document.getElementById('mk-hand-' + kind);
      var pivot = [+src.getAttribute('data-wx'), +src.getAttribute('data-wy')];
      // data-dir: the way the hand points from its wrist (the sheet hands point up, -90)
      var dir = src.hasAttribute('data-dir') ? +src.getAttribute('data-dir') : -90;
      var rot = fixed !== undefined ? fixed : armDeg - dir + (aim || 0);
      place(this.kit[kind], wrist, rot, pivot, this.handScale * (+src.getAttribute('data-k') || 1), mirror);
    }
  };

  // an effect mark from a parts file (a Recraft sound wave or ray): its middle moved to at,
  // turned by deg and scaled by k. Hidden at k 0.
  function Mark(id, parent) {
    var src = document.getElementById(id);
    this.c = [+src.getAttribute('data-cx'), +src.getAttribute('data-cy')];
    this.a = +src.getAttribute('data-a') || 0;
    this.node = use(id, parent);
  }
  // stretch: optional [x, y] multipliers on k
  Mark.prototype.put = function (at, deg, k, opacity, stretch) {
    if (k <= 0.001 || opacity <= 0.001) { this.node.setAttribute('opacity', 0); return; }
    var sx = k * (stretch ? stretch[0] : 1), sy = k * (stretch ? stretch[1] : 1);
    this.node.setAttribute('opacity', opacity.toFixed(3));
    this.node.setAttribute('transform', 'translate(' + at[0].toFixed(1) + ' ' + at[1].toFixed(1) + ') rotate(' + deg.toFixed(1) +
      ') scale(' + sx.toFixed(3) + ' ' + sy.toFixed(3) + ') translate(' + (-this.c[0]) + ' ' + (-this.c[1]) + ')');
  };

  /* ---------- shared moves for the limbless objects ---------- */

  // the idle bounce: a parabola in the air, a quick squash on landing; env (0 to 1) damps it.
  // hop.rock tips each hop the other way from the last, a waddle; hop.nod tips every hop the
  // same way, a nod.
  function bounce(A, t, env) {
    var n = t / A.hop.period, f = n % 1, lift = 0, squash = 0, tilt = 0;
    if (f < 0.72) {
      var a = f / 0.72;
      lift = 4 * a * (1 - a) * A.hop.height;
      if (A.hop.rock) tilt = (Math.floor(n) % 2 ? 1 : -1) * A.hop.rock * Math.sin(Math.PI * a);
      if (A.hop.nod) tilt = A.hop.nod * Math.sin(Math.PI * a);
    } else squash = Math.sin(Math.PI * (f - 0.72) / 0.28) * 0.05;
    return { lift: lift * (1 - env), squash: squash * (1 - env), tilt: tilt * (1 - env) };
  }

  // lift, grow, tilt and squash the body about its ground point
  function setBody(r, A, lift, scale, tilt, squash) {
    var G = [A.centreX, A.ground], sx = scale * (1 + squash), sy = scale * (1 - squash);
    r.body.setAttribute('transform', 'translate(0 ' + (-lift).toFixed(1) + ') translate(' + G[0] + ' ' + G[1] + ') rotate(' +
      tilt.toFixed(2) + ') scale(' + sx.toFixed(4) + ' ' + sy.toFixed(4) + ') translate(' + (-G[0]) + ' ' + (-G[1]) + ')');
  }

  // the pupils' sideways look. Idle: a scan timed to the gag, drifting left, then sweeping back
  // to reach the middle just as the gag starts. Gag: held in the middle (a hover gag eases in).
  function lookX(r, t, p) {
    if (p >= 0) return (r.lookAtGag || 0) * (1 - span(p, 0, 0.12));
    return (r.lookX = 16 * Math.sin(1.4 * (t - r.nextGag)) * span(t - r.gagEnd, 0, 0.5));
  }

  // a typing hand (kit mk-type-*): palm and thumb over three separate fingers. Each finger
  // presses on its own rhythm, squashing toward its knuckle (seen from above, a finger curling
  // down onto a key gets shorter).
  function TypeHand(parent, scale) {
    var self = this, src = document.getElementById('mk-type');
    this.g = el('g', {}, parent);
    this.f = ['f1', 'f2', 'f3'].map(function (n) {
      var f = document.getElementById('mk-type-' + n);
      return { node: use('mk-type-' + n, self.g), p: [+f.getAttribute('data-px'), +f.getAttribute('data-py')],
               rate: 2.4 + Math.random() * 1.3, phase: Math.random() };
    });
    use('mk-type-palm', this.g);
    this.pivot = [+src.getAttribute('data-wx'), +src.getAttribute('data-wy')];
    this.scale = scale * (+src.getAttribute('data-k') || 1);
  }
  // the hand's wrist at wrist, fingers along the arm; speed scales the typing, 0 rests the fingers
  TypeHand.prototype.put = function (wrist, armDeg, mirror, t, speed) {
    this.g.style.display = '';
    place(this.g, wrist, armDeg + 90, this.pivot, this.scale, mirror);
    this.f.forEach(function (f) {
      var u = (t * f.rate * speed + f.phase) % 1;
      var sy = 1 - 0.34 * (speed > 0 && u < 0.4 ? Math.sin(Math.PI * u / 0.4) : 0);
      f.node.setAttribute('transform', 'translate(' + f.p[0] + ' ' + f.p[1] + ') scale(1 ' + sy.toFixed(3) + ') translate(' + (-f.p[0]) + ' ' + (-f.p[1]) + ')');
    });
  };
  TypeHand.prototype.hide = function () { this.g.style.display = 'none'; };

  /* ---------- characters ---------- */

  // magnifier: 2048 space of magnifier-recraft.svg. No limbs: it bounces on the end of its
  // handle, eyes big in the lens.
  var MAGNIFIER = {
    viewBox: '-25 -10 2150 2150',
    parts: 'magnifier-parts.svg',
    ground: 1800, centreX: 1050,
    eyes: [1056, 650], eyeScale: 2.2,
    mouth: [1056, 905], mouthW: 92,
    hop: { period: 1.05, height: 70 },
    gag: 1.8,
    idle: 1.8,
    still: 0.5,            // the still copy: mid-gag, eyes popped, mouth open

    build: function (r) {
      r.body = el('g', {}, r.root);
      use('mg-handle', r.body);
      use('mg-rim', r.body);
      var face = el('g', { 'clip-path': 'url(#mg-c-glass)' }, r.body);
      r.eyes = new Eyes(face);
      r.mouth = new Mouth(face, 18);
      r.glint = use('mg-glint', face);
    },

    // t: seconds, p: gag progress 0 to 1, or -1 when idle
    pose: function (r, t, p) {
      var A = this, gag = p >= 0;
      var env = gag ? span(p, 0, 0.12) * (1 - span(p, 0.86, 1)) : 0;
      var b = bounce(A, t, env);

      // gag "found it": lean in (grow and tilt), squint, then pop
      var lean = gag ? span(p, 0, 0.28) * (1 - span(p, 0.8, 1)) : 0;
      setBody(r, A, b.lift, 1 + 0.08 * lean, -5 * lean, b.squash);

      var squint = gag ? span(p, 0.05, 0.25) * (1 - span(p, 0.3, 0.36)) : 0;
      var popT = gag ? back(span(p, 0.32, 0.44)) * (1 - span(p, 0.76, 0.95)) : 0, pop = 1 + 0.2 * popT;
      var open = blink(r, t) * (1 - 0.7 * squint);
      var look = [lookX(r, t, p), gag ? -6 * lean : 3 * Math.sin(t * 0.7)];
      // popped eyes ride up so the open mouth stays clear
      r.eyes.set([A.eyes[0], A.eyes[1] - 45 * popT], A.eyeScale * pop, open, look);
      r.mouth.set([A.mouth[0], A.mouth[1] + 25 * popT], A.mouthW, gag ? span(p, 0.34, 0.42) * (1 - span(p, 0.74, 0.84)) : 0);

      // glint: slides off the top right, then sweeps back in from the bottom left
      var out = gag ? span(p, 0.3, 0.42) : 0, back_in = gag ? span(p, 0.46, 0.72) : 1;
      var gx = gag && p < 0.44 ? 520 * out : -900 * (1 - back_in), gy = gag && p < 0.44 ? -520 * out : 900 * (1 - back_in);
      r.glint.setAttribute('transform', gag ? 'translate(' + gx.toFixed(1) + ' ' + gy.toFixed(1) + ')' : '');
    }
  };

  // case-files (Case Studies): the magnifier going through a floating stack of manila folders
  // (one Recraft folder, cf-folder, drawn four times) hovering beside him, to his right (our left)
  // by the bottom of his lens, since he has no arms. Each folder leans its top toward him and is
  // narrowed a little, so it reads as turned to face him, and he looks down across at them. Idle: every second or so the front folder flips down toward you (squashing about
  // its bottom edge), and while it is flat it moves to the back and pops up behind the others,
  // so the reorder never shows; the rest shuffle forward. His eyes follow each flip. Gag "fan
  // out": the stack spreads into a fan like a hand of cards, he scans it left to right (each
  // folder lifts as he looks at it), then it folds back into a stack.
  var CASE_FILES = {
    viewBox: '-25 -10 2150 2150',
    parts: ['magnifier-parts.svg', 'case-files-parts.svg'],
    ground: 1800, centreX: 1050,
    eyes: [1056, 640], eyeScale: 2.1,
    lookAt: [-44, 32],     // pupils: down and across at the stack (they sit up and right by default)
    mouth: [1056, 905], mouthW: 92,
    hop: { period: 1.05, height: 36 },
    gag: 2.6,
    idle: 4.5,
    still: 0.5,            // fanned out, mid-scan
    files: 4, fileK: 0.42, sift: 1.2,
    // stack slots, front (0) to back: where each folder's bottom middle sits, and its tilt
    slots: [[600, 1470, -2], [618, 1442, 3], [586, 1414, -4], [608, 1386, 2]],
    turn: { lean: 11, narrow: 0.86 },   // every folder: its top leans toward him, and it is narrowed as if turned to him
    fan: { at: [584, 1640], r: 190, spread: 17 },   // the fan's pivot, how far out the bottoms sit, degrees apart

    build: function (r) {
      r.body = el('g', {}, r.root);
      use('mg-handle', r.body);
      use('mg-rim', r.body);
      var face = el('g', { 'clip-path': 'url(#mg-c-glass)' }, r.body);
      r.eyes = new Eyes(face);
      r.mouth = new Mouth(face, 18);
      use('mg-glint', face);
      // the folders float in front of him, not on his body, so they don't hop with him
      r.files = el('g', {}, r.root);
      var src = document.getElementById('cf-folder');
      r.filePivot = [+src.getAttribute('data-cx'), +src.getAttribute('data-by')];
      r.folders = [];
      for (var i = 0; i < this.files; i++) r.folders.push(use('cf-folder', r.files));
      r.siftOff = 0; r.lastT = null;
    },

    pose: function (r, t, p) {
      var A = this, gag = p >= 0, N = A.files;
      var env = gag ? span(p, 0, 0.18) * (1 - span(p, 0.84, 1)) : 0;
      var b = bounce(A, t, env);
      setBody(r, A, b.lift, 1, b.tilt, b.squash);

      // the sift's own clock stops while the gag plays, so the stack comes back as it left
      if (r.lastT !== null && gag && t > r.lastT) r.siftOff += t - r.lastT;
      r.lastT = t;
      var ts = Math.max(0, t - r.siftOff), n = Math.floor(ts / A.sift), u = ts / A.sift - n;
      var shuffle = span(u, 0.3, 0.75), flat = span(u, 0, 0.42), rise = back(span(u, 0.5, 0.9));

      function lerp(a, c, k) { return a + (c - a) * k; }
      var scan = gag ? (N - 1) * span(p, 0.24, 0.74) : 0;
      var drawn = [];
      r.folders.forEach(function (node, i) {
        var s = ((i - n) % N + N) % N;   // its slot as this flip starts, 0 at the front
        var x, y, rot, sy = 1, depth;
        if (s === 0) {
          // the front folder flips down toward you, then pops up again at the back
          if (u < 0.46) {
            x = A.slots[0][0]; y = A.slots[0][1] + 24 * flat; rot = A.slots[0][2]; sy = Math.cos(flat * Math.PI / 2); depth = 0;
          } else {
            var B = A.slots[N - 1];
            x = B[0]; y = B[1]; rot = B[2]; sy = u < 0.5 ? 0 : rise; depth = N;
          }
        } else {
          var S0 = A.slots[s], S1 = A.slots[s - 1];
          x = lerp(S0[0], S1[0], shuffle); y = lerp(S0[1], S1[1], shuffle); rot = lerp(S0[2], S1[2], shuffle);
          depth = s - shuffle;
        }
        // each floats on its own slow bob
        y += 12 * Math.sin(2 * Math.PI * t / 1.7 + i * 1.3);
        var k = A.fileK;
        if (gag) {
          // fanned: the back folder on the left, the front one on the right, on top
          var j = N - 1 - Math.round(depth > N - 0.5 ? N - 1 : depth), a = (j - (N - 1) / 2) * A.fan.spread;
          var look = Math.max(0, 1 - Math.abs(scan - j) * 1.4) * span(p, 0.2, 0.26) * (1 - span(p, 0.74, 0.8));
          var rad = a * Math.PI / 180, out = A.fan.r + 50 * look;
          var fx = A.fan.at[0] + out * Math.sin(rad), fy = A.fan.at[1] - out * Math.cos(rad);
          x = lerp(x, fx, env); y = lerp(y, fy, env); rot = lerp(rot, a, env); sy = lerp(sy, 1, env);
          k *= 1 + 0.07 * look * env;
          depth = lerp(depth, N - 1 - j, env);
        }
        node.style.display = sy < 0.02 ? 'none' : '';
        node.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + (rot + A.turn.lean).toFixed(2) + ') scale(' +
          (k * A.turn.narrow).toFixed(4) + ' ' + (k * sy).toFixed(4) + ') translate(' + (-r.filePivot[0]) + ' ' + (-r.filePivot[1]) + ')');
        drawn.push([depth, node]);
      });
      // back to front
      drawn.sort(function (a, c) { return c[0] - a[0]; }).forEach(function (d) { r.files.appendChild(d[1]); });

      // eyes: down and across at the stack, dipping with each flip; in the gag they scan the fan
      var dip = gag ? 0 : 5 * Math.sin(Math.PI * span(u, 0.05, 0.5));
      var sweep = gag ? span(p, 0.12, 0.24) * (1 - span(p, 0.76, 0.9)) : 0;
      var lx = A.lookAt[0] + (gag ? sweep * (-7 + 14 * scan / (N - 1)) : 2 * Math.sin(t * 0.6));
      r.eyes.set([A.eyes[0], A.eyes[1]], A.eyeScale, blink(r, t), [lx, A.lookAt[1] + dip - 3 * sweep]);
      r.mouth.set(A.mouth, A.mouthW, 0);
    }
  };

  // lightbulb: 2048 space of lightbulb-recraft.svg. No limbs: it bounces on its base, face on
  // the glass. Gag "too bright": two flickers, it switches on, rays out, it squints, sunglasses
  // snap on and it smirks; then the shades snap off and it dims.
  var LIGHTBULB = {
    viewBox: '-75 -30 2150 2150',
    parts: 'lightbulb-parts.svg',
    ground: 1794, centreX: 1020,
    glass: [1000, 768], glassR: 490,
    eyes: [1000, 690], eyeScale: 2.4,
    mouth: [1000, 950], mouthW: 100,
    rays: [-90, -48, -10, -170, -132, 28, 152],   // degrees, none pointing down into the base
    rayScale: 0.62,
    hop: { period: 1.25, height: 45, rock: 6 },   // lower, slower, rocking side to side
    gag: 2.6,
    idle: 1.8,
    still: 0.66,           // lit, rays out, shades on, smirking
    shades: { y: 690, k: 0.48, stretch: [1.27, 0.8] },   // where they sit, their size, wider and shorter than drawn
    // pupil offsets in hero units: the hero's pupils sit right of centre by default
    lookCentre: [-22, 0], lookRest: [-40, -14], glide: 0.6,   // rest: a little left and up

    build: function (r) {
      r.body = el('g', {}, r.root);
      // the Recraft rays (rays-recraft.svg), behind the bulb
      var rays = el('g', {}, r.body);
      r.rays = this.rays.map(function (deg, i) { return new Mark('lb-ray-' + (i + 1), rays); });
      use('lb-body', r.body);
      r.lit = use('lb-lit', r.body);
      var face = el('g', { 'clip-path': 'url(#lb-c-face)' }, r.body);
      r.eyes = new Eyes(face);
      r.mouth = new Mouth(face, 18);
      // the sunglasses drop in from above, so they sit over the face, unclipped
      r.shades = new Mark('lb-shades', r.body);
    },

    pose: function (r, t, p) {
      var A = this, gag = p >= 0;
      var env = gag ? span(p, 0, 0.1) * (1 - span(p, 0.88, 1)) : 0;
      var b = bounce(A, t, env);

      // two quick flickers, then on; off again at the end
      var on = 0;
      if (gag) {
        if ((p > 0.08 && p < 0.11) || (p > 0.15 && p < 0.17)) on = 0.85;
        on = Math.max(on, span(p, 0.22, 0.24) * (1 - span(p, 0.86, 0.95)));
      }
      r.lit.setAttribute('opacity', on.toFixed(3));

      // switching on is a little jolt: a jump and a stretch
      var jolt = gag ? back(span(p, 0.22, 0.32)) * (1 - span(p, 0.4, 0.55)) : 0;
      setBody(r, A, b.lift + 60 * jolt, 1 + 0.06 * jolt, b.tilt, gag ? -0.03 * jolt : b.squash);

      // rays pop out from the glass one after another, each turned to point away from it, then
      // shrink back in
      var C = A.glass;
      A.rays.forEach(function (deg, i) {
        var grow = gag ? back(span(p, 0.24 + i * 0.01, 0.36 + i * 0.01)) * (1 - span(p, 0.84, 0.93)) : 0;
        var a = deg * Math.PI / 180, dist = A.glassR + 165 + 40 * grow;
        r.rays[i].put([C[0] + Math.cos(a) * dist, C[1] + Math.sin(a) * dist], deg - r.rays[i].a, A.rayScale * grow, Math.min(1, grow * 2));
      });

      // too bright: the sunglasses snap on over its eyes (popping in from a touch
      // too big) and it smirks; later they snap off the same way. The eyes switch off under the
      // shades, since they would show through between the lenses.
      // they snap on together with the rays
      var snapOn = gag ? span(p, 0.24, 0.3) : 0, snapOff = gag ? span(p, 0.82, 0.87) : 0;
      if (r.stillPose) { snapOn = 1; snapOff = 0; }
      var shown = snapOn > 0 && snapOff < 1;
      var size = A.shades.k * (snapOff > 0 ? 1 + 0.25 * snapOff : 1.3 - 0.3 * back(snapOn));
      r.shades.put([A.eyes[0], A.shades.y], 0, shown ? size : 0, shown && snapOff < 0.6 ? 1 : 0, A.shades.stretch);
      r.eyes.g.setAttribute('opacity', shown && snapOff < 0.6 ? 0 : 1);
      // the eyes keep their size throughout (no squint or flinch), only blinking
      var look = r.stillPose ? A.lookCentre : this.look(r, t, p);
      r.eyes.set(A.eyes, A.eyeScale, blink(r, t), look);
      var cool = r.stillPose ? 1 : gag ? span(p, 0.3, 0.38) * (1 - span(p, 0.84, 0.92)) : 0;
      r.mouth.smirk(A.mouth, A.mouthW, cool);
    }
  };

  // pupils that rest at A.lookRest, glide to A.lookCentre over A.glide seconds so the gag starts
  // as they arrive, hold there through it, then slide back. Used by the lightbulb.
  function glideLook(r, t, p) {
    var A = this, C = A.lookCentre, R = A.lookRest;
    if (p >= 0) {
      var k = span(p, 0, 0.12), from = r.lookAtGagXY || C;
      return [lerp(from[0], C[0], k), lerp(from[1], C[1], k)];
    }
    var back = span(t - r.gagEnd, 0, 0.4), go = span(t, r.nextGag - A.glide, r.nextGag);
    var xy = [0, 1].map(function (i) { return lerp(lerp(C[i], R[i], back), C[i], go); });
    r.lookX = xy[0]; r.lookXY = xy;
    return xy;
  }
  LIGHTBULB.look = glideLook;

  // megaphone: 2048 space of megaphone-recraft.svg. No limbs and no mouth (the bell is its
  // mouth), no hop: it sways on its handle, its pupils darting about. Gag
  // "shout": it rears back, then lunges forward while sound arcs ring out.
  var MEGAPHONE = {
    viewBox: '-60 -80 2150 2150',
    parts: 'megaphone-parts.svg',
    ground: 1726, centreX: 810,
    eyes: [1010, 950], eyeScale: 2.3,      // no mouth: the bell is its mouth
    bell: [1560, 871],
    waveScale: 0.9,
    hop: { period: 1, height: 0 },     // it does not hop: see sway
    sway: { period: 2.6, angle: 4 },     // planted on its handle, surveying the crowd
    gag: 1.9,
    idle: 1.8,
    still: 0.5,            // mid-shout, all three waves out
    // darting glances, in hero units (the hero's pupils sit right of centre by default)
    darts: [[8, -8], [-38, -6], [-14, 10], [12, 4], [-30, -14]],
    dartMove: 0.22,        // seconds each glance takes to travel
    lookCentre: [-22, 0],

    build: function (r) {
      r.body = el('g', {}, r.root);
      use('mp-body', r.body);
      var face = el('g', { 'clip-path': 'url(#mp-c-face)' }, r.body);
      r.eyes = new Eyes(face);
      // the Recraft sound waves (soundwaves-recraft.svg), small to large, riding on the body so
      // they follow the lunge
      var waves = el('g', {}, r.body);
      r.arcs = [1, 2, 3].map(function (n) { return new Mark('mp-wave-' + n, waves); });
    },

    pose: function (r, t, p) {
      var A = this, gag = p >= 0;
      var env = gag ? span(p, 0, 0.1) * (1 - span(p, 0.88, 1)) : 0;
      // idle: a slow sway on the handle with a small breathing swell, no hop
      var sway = A.sway.angle * Math.sin(2 * Math.PI * t / A.sway.period) * (1 - env);
      var breath = 0.015 * Math.sin(2 * Math.PI * t / (A.sway.period / 2)) * (1 - env);

      // rear back (inhale), then lunge forward and hold the shout, then settle
      var rear = gag ? span(p, 0.04, 0.26) * (1 - span(p, 0.3, 0.36)) : 0;
      var shout = gag ? back(span(p, 0.3, 0.4)) * (1 - span(p, 0.74, 0.9)) : 0;
      var tilt = sway + 9 * rear - 6 * shout;
      setBody(r, A, 20 * rear, 1 + breath - 0.04 * rear + 0.07 * shout, tilt, gag ? 0.05 * rear - 0.04 * shout : 0);

      // three waves ring out of the bell one after another, each popping in, travelling out and fading
      var B = A.bell;
      r.arcs.forEach(function (a, i) {
        var k = gag ? span(p, 0.34 + i * 0.07, 0.62 + i * 0.07) : 0;
        var fade = gag ? 1 - span(p, 0.7 + i * 0.05, 0.86 + i * 0.04) : 0;
        var pop = gag ? back(span(p, 0.34 + i * 0.07, 0.44 + i * 0.07)) : 0;
        // the still shows all three waves out, full and solid
        if (r.stillPose) { k = 0.5; fade = 1; pop = 1; }
        a.put([B[0] + 150 + 170 * i + 110 * k, B[1]], 0, A.waveScale * (0.6 + 0.4 * pop), Math.min(1, k * 3) * fade);
      });

      // eyes stay fully open through the shout
      var look = r.stillPose || gag ? A.lookCentre : this.dart(r, t);
      // a quick double blink right before the shout
      var lead = r.nextGag - t, dbl = 1;
      if (!gag && lead > 0 && lead < 0.34) dbl = 0.1 + 0.9 * Math.min(1, Math.abs((lead % 0.17) - 0.085) / 0.085);
      r.eyes.set([A.eyes[0], A.eyes[1] - 12 * shout], A.eyeScale, Math.min(blink(r, t), dbl), look);
    }
  };

  // the megaphone's pupils dart: a short move to a new spot, a hold, another move. 0.45s
  // before the shout they go to the middle.
  MEGAPHONE.dart = function (r, t) {
    var A = this, d = r.darting;
    var aim = r.nextGag - t < 0.45 ? A.lookCentre : null;
    if (!d) d = r.darting = { from: A.lookCentre, to: A.lookCentre, at: t, next: t + 0.6 };
    var want = aim || (t >= d.next ? A.darts[Math.floor(Math.random() * A.darts.length)] : null);
    if (want && want !== d.to) {
      var k = smooth((t - d.at) / A.dartMove);
      d.from = [lerp(d.from[0], d.to[0], k), lerp(d.from[1], d.to[1], k)];
      d.to = want; d.at = t; d.next = t + 0.8 + Math.random() * 0.6;
    } else if (t >= d.next) d.next = t + 0.3;
    var k2 = smooth((t - d.at) / A.dartMove);
    var xy = [lerp(d.from[0], d.to[0], k2), lerp(d.from[1], d.to[1], k2)];
    r.lookX = xy[0]; r.lookXY = xy;
    return xy;
  };

  // browser-window: a monitor (computer-parts.svg) typing at its keyboard, arms still, hands
  // fluttering on the keys.
  // Its eyes watch its hands, glancing up now and then. Gag "launch": a loading
  // bar fills the address bar (Recraft's own bar, only the fill moves) and its eyes follow it,
  // then the screen lights up and it grins, still typing. (A thumbs-up was tried and parked: the
  // upright kit hand mk-hand-thumbup is still in kit-parts.svg.)
  var COMPUTER = {
    viewBox: '57 360 1930 1930',
    parts: 'computer-parts.svg',
    ground: 1997, centreX: 1022,
    kb: { at: [1022, 1470], k: 0.8, from: [1025, 700], keyRows: 1940 },   // placement; keyRows: top + bottom of the keys
    eyes: [1075, 975], eyeScale: 2.2,
    mouth: [1075, 1186], mouthW: 84,
    bar: [911, 621, 545, 74],      // the address bar: x, y, width, height
    shoulderL: [452, 1170], shoulderR: [1596, 1170],
    restL: [700, 1560], restR: [1350, 1560],   // where the wrists rest over the keys
    fistScale: 2.0, handScale: 0.46,
    hop: { period: 1, height: 0 },
    gag: 2.6,
    idle: 2.2,
    still: 0.76,           // screen lit, bar full, grinning

    build: function (r) {
      var A = this, g = r.root;
      r.body = el('g', {}, g);
      use('pc-body', r.body);
      r.fill = el('rect', { x: A.bar[0], y: A.bar[1], width: 0, height: A.bar[3], fill: '#E3A23B' },
        el('g', { 'clip-path': 'url(#pc-c-bar)' }, r.body));
      r.lit = use('pc-lit', r.body);
      var face = el('g', { 'clip-path': 'url(#pc-c-face)' }, r.body);
      r.eyes = new Eyes(face);
      r.mouth = new Mouth(face, 18);
      var kb = el('g', { transform: 'translate(' + A.kb.at + ') scale(' + A.kb.k + ') translate(' + (-A.kb.from[0]) + ' ' + (-A.kb.from[1]) + ')' }, g);
      use('kb-body', kb);
      // Recraft drew the space bar at the front; the key layout is flipped front to back (each
      // key moved, not mirrored, and the keyboard body left as drawn) so it sits by the monitor
      r.keys = [];
      for (var n = 1; n <= 22; n++) {
        var src = document.getElementById('kb-key-' + n);
        var c = [+src.getAttribute('data-cx'), +src.getAttribute('data-cy')];
        var dy = A.kb.keyRows - 2 * c[1];
        var slot = el('g', { transform: 'translate(0 ' + dy + ')' }, kb);
        r.keys.push({ node: use('kb-key-' + n, slot), at: [A.kb.at[0] + (c[0] - A.kb.from[0]) * A.kb.k, A.kb.at[1] + (c[1] + dy - A.kb.from[1]) * A.kb.k] });
      }
      r.armL = new Limb(g, 48, 18); r.armR = new Limb(g, 48, 18);
      r.typeL = new TypeHand(g, A.handScale);
      r.typeR = new TypeHand(g, A.handScale);
    },

    pose: function (r, t, p) {
      var A = this, gag = p >= 0;
      var fast = 1;   // the typing keeps one pace throughout
      // the monitor bobs a touch with the typing
      var bob = 5 * Math.sin(2 * Math.PI * t * 3.3 * fast);
      var lit = gag ? Math.max(0.9 * span(p, 0.55, 0.58) * (1 - span(p, 0.58, 0.66)), 0.4 * span(p, 0.58, 0.62) * (1 - span(p, 0.86, 0.96))) : 0;
      setBody(r, A, -bob, 1 + 0.03 * (gag ? back(span(p, 0.55, 0.65)) * (1 - span(p, 0.86, 1)) : 0), 0, 0);
      r.lit.setAttribute('opacity', (r.stillPose ? 0.4 : lit).toFixed(3));

      // loading bar: fills across the address bar, holds, then fades
      var fill = gag ? span(p, 0.12, 0.55) : 0;
      r.fill.setAttribute('width', (A.bar[2] * fill).toFixed(1));
      r.fill.setAttribute('opacity', gag ? (1 - span(p, 0.88, 0.98)).toFixed(3) : 0);

      var rate = 11 * fast;   // the hands' small bob; the keys themselves stay still
      // arms stay put, hands resting on the keys, fingers typing
      [[r.armL, r.typeL, A.shoulderL, A.restL], [r.armR, r.typeR, A.shoulderR, A.restR]].forEach(function (h, side) {
        var sh = [h[2][0], h[2][1] - bob];
        var rest = [h[3][0], h[3][1] - 4 * Math.sin(t * rate * 0.9 + side * 2)];
        var deg = angle(sh, rest);
        h[0].draw(hose(sh, rest, Math.hypot(rest[0] - sh[0], rest[1] - sh[1]) * 1.08, side === 0 ? 1 : -1));
        // both thumbs on the inner side: the right-hand drawing as is on the left, mirrored on the right
        h[1].put(rest, deg, side === 1, t, fast);
      });

      // eyes: watching the hands, glancing up now and then; in the gag they follow the bar,
      // then pop when the page lands
      var look;
      if (r.stillPose) look = [-22, -6];
      else if (gag) look = p < 0.56 ? [lerp(-48, 6, fill), -26] : [-22, -8];
      else {
        var g = (t % 3.1) / 3.1, up = span(g, 0.62, 0.68) * (1 - span(g, 0.86, 0.92));
        look = [lerp(-22 + 10 * Math.sin(t * 2.2), -22, up), lerp(22, -4, up)];
      }
      var popT = gag ? back(span(p, 0.55, 0.65)) * (1 - span(p, 0.86, 0.98)) : (r.stillPose ? 1 : 0);
      r.eyes.set([A.eyes[0], A.eyes[1] - 30 * popT], A.eyeScale * (1 + 0.15 * popT), blink(r, t), look);
      // a big open grin when the page lands (the other two do the "o")
      r.mouth.grin(A.mouth, A.mouthW, r.stillPose ? 1 : gag ? back(span(p, 0.55, 0.62)) * (1 - span(p, 0.86, 0.95)) : 0);
    }
  };

  // speech-bubble: the bubble's own path space (speech-bubble-parts.svg). No limbs: it floats,
  // its tail wagging, its eyes going back and forth like someone following a chat. Gag
  // "typing": the face slides aside, three dots bounce, then pop into a golden "!" that rises
  // out of the bubble, and the face slides back chattering.
  var SPEECH_BUBBLE = {
    viewBox: '68 -55 2300 2300',
    parts: 'speech-bubble-parts.svg',
    ground: 1488, centreX: 1253,           // the bubble's bottom edge: the pivot for tilt and squash
    eyes: [1330, 790], eyeScale: 2.9,
    mouth: [1330, 1110], mouthW: 110,
    aside: [1640, 800], asideK: 0.8,      // where the face slides to while it types
    tail: [1170, 1400], tailK: 0.45,       // the tail's neck, inside the bottom edge
    dots: [[850, 900], [1030, 900], [1210, 900]], dotR: 70,
    float: { period: 2.6, height: 38 },
    hop: { period: 1, height: 0 },         // it does not hop: see float
    gag: 3,
    idle: 2,
    still: 0.4,            // typing: face aside, dots mid-bounce
    lookCentre: [-22, 0],
    chat: [[-52, 4], [8, -2]],             // the two sides of the conversation, hero units

    build: function (r) {
      var A = this;
      r.body = el('g', {}, r.root);
      // inks under whites: where the tail's white crosses the bubble's edge, the line goes
      r.tailInk = use('sb-tail-ink', r.body);
      use('sb-ink', r.body);
      use('sb-white', r.body);
      r.tailWhite = use('sb-tail-white', r.body);
      use('sb-shade', r.body);
      var src = document.getElementById('sb-tail-ink');
      r.tailPivot = [+src.getAttribute('data-px'), +src.getAttribute('data-py')];
      var face = el('g', { 'clip-path': 'url(#sb-c-face)' }, r.body);
      r.face = el('g', {}, face);
      r.eyes = new Eyes(r.face);
      r.mouth = new Mouth(r.face, 22);
      r.dots = A.dots.map(function () { return el('circle', { r: A.dotR, fill: INK }, face); });
      // the "!": a tapering bar and a dot, ink outlined, golden
      r.bang = el('g', { 'stroke-linejoin': 'round' }, r.body);
      var bar = 'M-70 -260Q0 -290 70 -260L38 40Q0 58 -38 40Z';
      el('path', { d: bar, fill: INK, stroke: INK, 'stroke-width': 64 }, r.bang);
      el('circle', { cx: 0, cy: 150, r: 62, fill: INK, stroke: INK, 'stroke-width': 64 }, r.bang);
      el('path', { d: bar, fill: '#E3A23B' }, r.bang);
      el('circle', { cx: 0, cy: 150, r: 62, fill: '#E3A23B' }, r.bang);
    },

    pose: function (r, t, p) {
      var A = this, gag = p >= 0;
      var env = gag ? span(p, 0, 0.1) * (1 - span(p, 0.9, 1)) : 0;
      var w = 2 * Math.PI * t / A.float.period;
      var lift = A.float.height * (1 + Math.sin(w)) * (1 - 0.6 * env);
      var tilt = 2.5 * Math.sin(w + 0.9) * (1 - env);

      // the "!" pops: a jolt up and a stretch
      var pop = gag ? back(span(p, 0.62, 0.7)) * (1 - span(p, 0.74, 0.86)) : 0;
      setBody(r, A, lift + 50 * pop, 1 + 0.04 * pop, tilt, gag ? -0.05 * pop : 0.012 * Math.sin(2 * w));

      // the tail wags gently, and flicks when the "!" pops
      var wag = 6 * Math.sin(2 * Math.PI * t / 1.3) + 14 * (gag ? Math.sin(Math.PI * span(p, 0.62, 0.8)) * Math.sin(p * 60) : 0);
      [r.tailInk, r.tailWhite].forEach(function (n) { place(n, A.tail, wag, r.tailPivot, A.tailK); });

      // the face slides aside to make room, then back
      var side = r.stillPose ? 1 : gag ? span(p, 0, 0.12) * (1 - span(p, 0.76, 0.88)) : 0;
      var fx = lerp(A.eyes[0], A.aside[0], side), fy = lerp(A.eyes[1], A.aside[1], side), fk = lerp(1, A.asideK, side);
      r.face.setAttribute('transform', 'translate(' + fx.toFixed(1) + ' ' + fy.toFixed(1) + ') scale(' + fk.toFixed(3) +
        ') translate(' + (-A.eyes[0]) + ' ' + (-A.eyes[1]) + ')');

      // three dots pop in, bounce one after another like a typing indicator, then gather and go
      var gather = gag ? span(p, 0.58, 0.64) : 0;
      A.dots.forEach(function (d, i) {
        var k = r.stillPose ? 1 : gag ? back(span(p, 0.08 + i * 0.03, 0.16 + i * 0.03)) * (1 - gather) : 0;
        var u = ((r.stillPose ? 0.3 : p) * 6 - i * 0.18) % 1;
        var hop = gag && p > 0.16 || r.stillPose ? Math.max(0, Math.sin(Math.PI * u / 0.5)) * (u < 0.5 ? 1 : 0) : 0;
        var x = lerp(d[0], A.dots[1][0], gather), y = d[1] - 70 * hop * (1 - gather);
        r.dots[i].setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + Math.max(0, k).toFixed(3) + ')');
      });

      // the "!" pops where the dots were, holds, then rises out over the top and fades
      var bk = gag ? back(span(p, 0.62, 0.7)) : 0, rise = gag ? span(p, 0.71, 0.88) : 0;
      if (!gag || bk <= 0.001 || rise >= 1) r.bang.setAttribute('opacity', 0);
      else {
        var c = A.dots[1], wob = 6 * Math.sin(p * 40) * (1 - rise);
        r.bang.setAttribute('opacity', (1 - span(p, 0.8, 0.88)).toFixed(3));
        r.bang.setAttribute('transform', 'translate(' + c[0] + ' ' + (c[1] - 560 * rise).toFixed(1) + ') rotate(' + wob.toFixed(1) +
          ') scale(' + (bk * (1 - 0.4 * rise)).toFixed(3) + ')');
      }

      // eyes: back and forth between the two sides of the chat; while typing they watch the
      // dots, and pop when the "!" lands
      var look;
      if (r.stillPose) look = [-48, 14];
      else if (gag) look = p < 0.62 ? [lerp(r.lookAtGag || A.lookCentre[0], -48, span(p, 0, 0.1)), 14] :
        [lerp(-48, A.lookCentre[0], span(p, 0.64, 0.72)), lerp(14, -6, span(p, 0.64, 0.72))];
      else look = this.chatLook(r, t);
      var eyePop = gag ? back(span(p, 0.62, 0.7)) * (1 - span(p, 0.8, 0.92)) : 0;
      r.eyes.set([A.eyes[0], A.eyes[1] - 25 * eyePop], A.eyeScale * (1 + 0.15 * eyePop), blink(r, t), look);

      // the mouth: a small "o" at the pop, then it chatters as the face slides back
      var open = 0;
      if (gag) {
        open = span(p, 0.62, 0.66) * (1 - span(p, 0.7, 0.73));
        if (p > 0.76 && p < 0.94) open = Math.max(0, Math.sin((p - 0.76) / 0.18 * Math.PI * 4)) * 0.8;
      }
      r.mouth.set(A.mouth, A.mouthW, open);
    }
  };

  // the speech bubble's pupils follow a conversation: hold on one side, cross to the other, hold.
  // 0.5s before the gag they come to the middle.
  SPEECH_BUBBLE.chatLook = function (r, t) {
    var A = this, C = A.chat, n = t / 1.5, f = n % 1, from = C[Math.floor(n) % 2], to = C[(Math.floor(n) + 1) % 2];
    var k = span(f, 0.78, 1);
    var xy = [lerp(from[0], to[0], k), lerp(from[1], to[1], k)];
    var mid = span(t, r.nextGag - 0.5, r.nextGag - 0.2);
    xy = [lerp(xy[0], A.lookCentre[0], mid), lerp(xy[1], A.lookCentre[1], mid)];
    r.lookX = xy[0]; r.lookXY = xy;
    return xy;
  };

  // finish-flag: 2048 space of finish-flag-pole-recraft.svg. The Recraft cloth hangs behind the
  // pole and is bent every frame by a travelling wave that grows toward its free end, so it
  // flutters but keeps its drawn line. No limbs: the face rides the wave. Its eyes watch down the
  // track for the runner. Gag "finish" (cued by the steps lane when the runner arrives, or on
  // hover): a crouch, a jump, the cloth whips, impact stars pop, a big grin.
  var FINISH_FLAG = {
    viewBox: '371 47 2150 2150',
    parts: 'finish-flag-parts.svg',
    ground: 1835, centreX: 1043,
    // the cloth: drawn from src (its top left in cloth-recraft space) at k, hung from at
    cloth: { src: [408, 633], k: 0.86, at: [1030, 425], w: 1059 },
    face: [1023, 980], eyeScale: 1.85,     // in cloth-recraft space, so it rides the wave
    mouthDrop: 240, mouthW: 72,
    wave: { amp: 36, cycles: 1.15, rate: 1.3 },
    hop: { period: 1, height: 0 },
    gag: 2.2,
    idle: 4,
    still: 0.36,           // mid-whip, stars out, grinning
    lookTrack: [-58, 6],   // down the track, where the runner comes from (hero units)
    lookCentre: [-22, 0],
    // its own shadow: under the base only (the sun is overhead; the cloth is in the air)
    ownShadow: true, shadow: { at: [1043, 1826], rx: 235, ry: 46 },

    build: function (r) {
      r.shadow = new Shadow(r, r.root);
      r.body = el('g', {}, r.root);
      var stars = el('g', {}, r.body);
      r.stars = [1, 2].map(function (n) { return new Mark('ff-star-' + n, stars); });
      // the cloth's paths, copied so each can be rewritten every frame
      var cloth = el('g', {}, r.body);
      r.cloth = [].map.call(document.getElementById('ff-cloth').children, function (src) {
        var d = src.getAttribute('d');
        return { node: el('path', { fill: src.getAttribute('fill') }, cloth), tok: d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g) };
      });
      use('ff-pole', r.body);
      r.face = el('g', {}, r.body);
      r.eyes = new Eyes(r.face);
      r.mouth = new Mouth(r.face, 18);
    },

    // a point of the cloth (cloth-recraft space) to the stage, bent by the wave
    bend: function (x, y, t, amp, rate) {
      var C = this.cloth, W = this.wave;
      var X = C.at[0] + (x - C.src[0]) * C.k, Y = C.at[1] + (y - C.src[1]) * C.k;
      var u = Math.max(0, (X - C.at[0]) / C.w), ph = 2 * Math.PI * (u * W.cycles - t * rate);
      // the wave lifts and drops, and pulls the free end in a little as it bends
      return [X - 0.12 * amp * u * (1 - Math.cos(ph)), Y + amp * u * Math.sin(ph)];
    },

    pose: function (r, t, p) {
      var A = this, gag = p >= 0;
      var crouch = gag ? span(p, 0, 0.1) * (1 - span(p, 0.1, 0.16)) : 0;
      var jump = gag ? Math.sin(Math.PI * span(p, 0.1, 0.42)) : 0;
      var land = gag ? Math.sin(Math.PI * span(p, 0.42, 0.52)) : 0;
      var sway = 1.6 * Math.sin(2 * Math.PI * t / 3.1) + (gag ? 4 * Math.sin(p * 30) * span(p, 0.12, 0.2) * (1 - span(p, 0.5, 0.75)) : 0);
      setBody(r, A, 120 * jump, 1, sway, 0.06 * crouch + 0.05 * land - 0.04 * jump);
      var S = A.shadow, off = 1 - 0.45 * jump, wide = 1 + 0.08 * (crouch + land);
      r.shadow.set(S.at, S.rx * off * wide, S.ry * off, 1 - 0.55 * jump);

      // the wave: a steady flutter, whipping hard through the finish
      var whip = r.stillPose ? 1 : gag ? span(p, 0.1, 0.18) * (1 - span(p, 0.7, 0.95)) : 0;
      var amp = A.wave.amp * (1 + 1.6 * whip), rate = A.wave.rate * (1 + 1.4 * whip);
      // the clock for the wave runs on its own phase, so a faster rate doesn't jump
      r.wt = (r.wt || 0) + (r.lastT === undefined ? 0 : Math.max(0, t - r.lastT)) * rate; r.lastT = t;
      var wt = r.stillPose ? 0.3 : r.wt;
      var self = this;
      r.cloth.forEach(function (c) {
        var out = '', tok = c.tok, i = 0;
        while (i < tok.length) {
          var s = tok[i];
          if (/[A-Za-z]/.test(s)) { out += s; i++; continue; }
          var q = self.bend(+tok[i], +tok[i + 1], wt, amp, 1);
          out += q[0].toFixed(1) + ' ' + q[1].toFixed(1) + ' ';
          i += 2;
        }
        c.node.setAttribute('d', out);
      });

      // the face rides the wave and tips with its slope
      var F = this.bend(A.face[0], A.face[1], wt, amp, 1), F2 = this.bend(A.face[0] + 40, A.face[1], wt, amp, 1);
      var tip = angle(F, F2);
      r.face.setAttribute('transform', 'translate(' + F[0].toFixed(1) + ' ' + F[1].toFixed(1) + ') rotate(' + tip.toFixed(1) + ')');

      // two impact stars pop off the free end of the cloth, then fade
      var tipAt = this.bend(A.cloth.src[0] + A.cloth.w / A.cloth.k, A.cloth.src[1], wt, amp, 1);
      r.stars.forEach(function (s, i) {
        var k = r.stillPose ? 1 : gag ? back(span(p, 0.16 + i * 0.06, 0.28 + i * 0.06)) : 0;
        var fade = r.stillPose ? 1 : gag ? 1 - span(p, 0.6 + i * 0.05, 0.74 + i * 0.05) : 0;
        var at = i === 0 ? [tipAt[0] + 70, tipAt[1] - 150] : [tipAt[0] - 330, tipAt[1] - 250];
        s.put(at, i === 0 ? 12 : -14, (i === 0 ? 0.85 : 0.6) * k, Math.min(1, k * 2) * fade);
      });

      // eyes: down the track for the runner, glancing back now and then; centred and popped
      // through the finish
      var look;
      if (r.stillPose || gag) look = A.lookCentre;
      else {
        var g = (t % 3.4) / 3.4, back_ = span(g, 0.7, 0.76) * (1 - span(g, 0.9, 0.96));
        look = [lerp(A.lookTrack[0], A.lookCentre[0] + 8, back_), lerp(A.lookTrack[1], -6, back_)];
        var lead = span(t, r.nextGag - 0.4, r.nextGag);
        look = [lerp(look[0], A.lookCentre[0], lead), lerp(look[1], A.lookCentre[1], lead)];
      }
      var pop = r.stillPose ? 1 : gag ? back(span(p, 0.12, 0.24)) * (1 - span(p, 0.78, 0.92)) : 0;
      r.eyes.set([0, -30 * pop], A.eyeScale * (1 + 0.15 * pop), blink(r, t), look);
      r.mouth.grin([0, A.mouthDrop], A.mouthW, r.stillPose ? 1 : gag ? back(span(p, 0.12, 0.2)) * (1 - span(p, 0.8, 0.92)) : 0);
    }
  };

  // a soft ground shadow drawn by the rig itself, for characters whose footing is not on the
  // shared ground line (the loader's CSS shadow is hidden for them: see ownShadow). The sun is
  // overhead, so it sits right under whatever touches the ground and shrinks as that lifts off.
  function Shadow(r, parent) {
    if (!r.shadowGrad) {
      r.shadowGrad = 'mr-sh-' + (++uid);
      var g = el('radialGradient', { id: r.shadowGrad }, el('defs', {}, r.svg));
      el('stop', { offset: 0, 'stop-color': INK, 'stop-opacity': 0.32 }, g);
      el('stop', { offset: 0.55, 'stop-color': INK, 'stop-opacity': 0.22 }, g);
      el('stop', { offset: 1, 'stop-color': INK, 'stop-opacity': 0 }, g);
    }
    this.e = el('ellipse', { fill: 'url(#' + r.shadowGrad + ')' }, parent);
  }
  Shadow.prototype.set = function (c, rx, ry, opacity) {
    this.e.setAttribute('cx', c[0].toFixed(1)); this.e.setAttribute('cy', c[1].toFixed(1));
    this.e.setAttribute('rx', Math.max(0, rx).toFixed(1)); this.e.setAttribute('ry', Math.max(0, ry).toFixed(1));
    this.e.setAttribute('opacity', Math.max(0, Math.min(1, opacity)).toFixed(3));
  };

  // a part that turns about its pivot (data-px/py, drawn at data-k): the compass needle, the
  // stopwatch hand. put(at, deg): its pivot at at, turned deg clockwise from straight up.
  function Pointer(id, parent) {
    var src = document.getElementById(id);
    this.pivot = [+src.getAttribute('data-px'), +src.getAttribute('data-py')];
    this.k = +src.getAttribute('data-k') || 1;
    this.node = use(id, parent);
  }
  Pointer.prototype.put = function (at, deg) { place(this.node, at, deg, this.pivot, this.k); };

  // rays from a parts file popped in a ring around a centre (the compass and stopwatch reuse
  // the lightbulb's Recraft rays)
  function ringRays(r, A, C, R, grow, i) {
    var deg = A.rays[i], a = deg * Math.PI / 180, dist = R + 40 * grow;
    r.rays[i].put([C[0] + Math.cos(a) * dist, C[1] + Math.sin(a) * dist], deg - r.rays[i].a, A.rayScale * grow, Math.min(1, grow * 2));
  }

  // compass (step 1, "Get your bearings"): 2048 space of compass-recraft.svg. No limbs. The
  // needle spins on the dial behind the eyes. Idle: it turns this way and that, searching, the
  // needle swinging after it on a spring, the eyes following the needle's tip. Gag "found it":
  // the needle spins, the eyes go round with it, then it snaps to a heading, rays pop, it jumps.
  var COMPASS = {
    viewBox: '67 141 1900 1900',
    parts: 'compass-parts.svg',
    ground: 1737, centreX: 1017,
    dial: [1052, 1179], dialR: 403,
    eyes: [1052, 1110], eyeScale: 1.8,
    mouth: [1052, 1372], mouthW: 70,
    rays: [-90, -50, -130, -12, -168, 22, 158],
    rayScale: 0.5,
    hop: { period: 1, height: 0 },
    gag: 2.4,
    idle: 3.2,
    still: 0.72,           // snapped to its heading, rays out, eyes popped
    heading: 38,           // where the needle settles in the gag

    build: function (r) {
      r.body = el('g', {}, r.root);
      var rays = el('g', {}, r.body);
      r.rays = this.rays.map(function (deg, i) { return new Mark('cp-ray-' + (i + 1), rays); });
      use('cp-body', r.body);
      var face = el('g', { 'clip-path': 'url(#cp-c-face)' }, r.body);
      r.needle = new Pointer('cp-needle', face);
      r.eyes = new Eyes(face);
      r.mouth = new Mouth(face, 18);
      r.spring = { a: 0, v: 0 };
    },

    pose: function (r, t, p) {
      var A = this, gag = p >= 0;
      var env = gag ? span(p, 0, 0.08) * (1 - span(p, 0.9, 1)) : 0;
      // idle: the body turns to look about, a slow search; a small hop as it settles each way
      var look = Math.sin(2 * Math.PI * t / 3.6) + 0.35 * Math.sin(2 * Math.PI * t / 1.7);
      var tilt = 7 * look * (1 - env);
      var jump = gag ? Math.sin(Math.PI * span(p, 0.6, 0.82)) : 0;
      var land = gag ? Math.sin(Math.PI * span(p, 0.82, 0.9)) : 0;
      setBody(r, A, 110 * jump, 1 + 0.05 * jump, tilt, 0.05 * land - 0.04 * jump);

      // the needle: in the idle it chases the tilt on a wobbly spring; in the gag it spins two
      // turns, slowing, and snaps to its heading with a wobble
      var deg;
      var dt = Math.max(0, Math.min(0.05, t - (r.lastT === undefined ? t : r.lastT))); r.lastT = t;
      if (r.stillPose) deg = A.heading;
      else if (gag) {
        var spin = 1 - Math.pow(1 - span(p, 0.04, 0.58), 2.2);
        var settle = span(p, 0.58, 0.8);
        deg = (r.spinFrom || 0) + (720 + A.heading - (r.spinFrom || 0)) * spin +
          (p > 0.58 ? 14 * Math.sin((p - 0.58) * 60) * (1 - settle) : 0);
        r.spring.a = deg % 360; r.spring.v = 0;
      } else {
        var target = -2.4 * tilt + 18 * Math.sin(t * 0.9);
        r.spring.v += ((target - r.spring.a) * 60 - r.spring.v * 4) * dt;
        r.spring.a += r.spring.v * dt;
        deg = r.spring.a; r.spinFrom = deg;
      }
      r.needle.put(A.dial, deg);

      // rays pop as it settles
      var C = A.dial;
      A.rays.forEach(function (d, i) {
        var grow = r.stillPose ? 1 : gag ? back(span(p, 0.6 + i * 0.012, 0.7 + i * 0.012)) * (1 - span(p, 0.86, 0.95)) : 0;
        ringRays(r, A, C, A.dialR + 230, grow, i);
      });

      // eyes follow the needle's tip; while it spins they go round with it
      var tipA = (deg - 90) * Math.PI / 180;
      var eyeLook = [-22 + 26 * Math.cos(tipA), 22 * Math.sin(tipA)];
      var pop = r.stillPose ? 1 : gag ? back(span(p, 0.6, 0.7)) * (1 - span(p, 0.84, 0.95)) : 0;
      r.eyes.set([A.eyes[0], A.eyes[1] - 30 * pop], A.eyeScale * (1 + 0.15 * pop), blink(r, t), eyeLook);
      // an "o" while it spins, a smile once it has its bearings
      r.mouth.set(A.mouth, A.mouthW, gag && !r.stillPose ? span(p, 0.06, 0.14) * (1 - span(p, 0.56, 0.62)) : 0);
    }
  };

  // clipboard (step 2, "Set your direction"): 2048 space of clipboard-recraft.svg. No limbs, face
  // on the top half of the paper. Idle: a gentle rock while its eyes read down the list, row by
  // row. Gag "all set": a golden tick pops into each box in turn, its eyes snapping to each, then
  // a proud hop and a grin.
  var CLIPBOARD = {
    viewBox: '28 73 2000 2000',
    parts: 'clipboard-parts.svg',
    ground: 1753, centreX: 1028,
    eyes: [1129, 735], eyeScale: 1.7,
    mouth: [1129, 915], mouthW: 70,
    boxes: [[778, 1017], [778, 1192], [778, 1366]],
    tickScale: 0.58,
    hop: { period: 1, height: 0 },
    gag: 2.6,
    idle: 3,
    still: 0.74,           // all three ticked, hopping, grinning

    build: function (r) {
      r.body = el('g', {}, r.root);
      use('cb-body', r.body);
      var face = el('g', { 'clip-path': 'url(#cb-c-face)' }, r.body);
      r.eyes = new Eyes(face);
      r.mouth = new Mouth(face, 18);
      var ticks = el('g', {}, r.body);
      r.ticks = [1, 2, 3].map(function (n) { return new Mark('cb-tick-' + n, ticks); });
    },

    pose: function (r, t, p) {
      var A = this, gag = p >= 0;
      var env = gag ? span(p, 0, 0.08) * (1 - span(p, 0.9, 1)) : 0;
      var rock = 2.5 * Math.sin(2 * Math.PI * t / 2.8) * (1 - env);
      // each tick lands with a small nudge; then a proud hop
      var nudge = 0;
      A.boxes.forEach(function (b, i) { if (gag) nudge += Math.sin(Math.PI * span(p, 0.12 + i * 0.16, 0.2 + i * 0.16)); });
      var hop = gag ? Math.sin(Math.PI * span(p, 0.62, 0.84)) : 0;
      setBody(r, A, 90 * hop, 1 + 0.03 * hop, rock - 2 * nudge, 0.03 * nudge - 0.04 * hop);

      A.boxes.forEach(function (b, i) {
        var k = r.stillPose ? 1 : gag ? back(span(p, 0.12 + i * 0.16, 0.2 + i * 0.16)) * (1 - span(p, 0.88, 0.96)) : 0;
        // each tick leans out of its box, the way a hand-drawn one does
        r.ticks[i].put([b[0] + 45, b[1] - 55], -4, A.tickScale * k, Math.min(1, k * 2));
      });

      // eyes: reading down the list, row by row; in the gag they snap to each new tick, then
      // come back up
      var look;
      if (r.stillPose) look = [-22, -4];
      else if (gag) {
        var row = p < 0.28 ? 0 : p < 0.44 ? 1 : 2;
        look = p < 0.6 ? [-58, 18 + 10 * row] : [lerp(-58, -22, span(p, 0.6, 0.68)), lerp(38, -4, span(p, 0.6, 0.68))];
      } else {
        var u = (t / 1.1) % 3, n = Math.floor(u), f = u - n;
        look = [lerp(-56, 6, span(f, 0.1, 0.85)), 10 + 12 * n];
        var lead = span(t, r.nextGag - 0.35, r.nextGag);
        look = [lerp(look[0], -58, lead), lerp(look[1], 18, lead)];
      }
      r.eyes.set(A.eyes, A.eyeScale, blink(r, t), look);
      r.mouth.grin(A.mouth, A.mouthW, r.stillPose ? 1 : gag ? back(span(p, 0.62, 0.7)) * (1 - span(p, 0.86, 0.95)) : 0);
    }
  };

  // stopwatch (step 3, "Start building"): 2048 space of stopwatch-recraft.svg. No limbs. Idle:
  // the hand ticks round in steps, the body twitching on each tick, the eyes following the
  // tip. Gag "go!": the eyes look up at the button, it presses down, the stopwatch jumps, the
  // hand whips round once and rays pop.
  var STOPWATCH = {
    viewBox: '77 165 1900 1900',
    parts: 'stopwatch-parts.svg',
    ground: 1761, centreX: 1027,
    dial: [1060, 1218], dialR: 470,
    eyes: [1060, 1150], eyeScale: 2.1,
    mouth: [1060, 1410], mouthW: 72,
    rays: [-90, -50, -130, -12, -168, 22, 158],
    rayScale: 0.5,
    tick: 0.5, stepDeg: 15,   // a tick every half second, a quarter hour each
    hop: { period: 1, height: 0 },
    gag: 2.2,
    idle: 3.2,
    still: 0.42,           // button down, jumping, rays out

    build: function (r) {
      r.body = el('g', {}, r.root);
      var rays = el('g', {}, r.body);
      r.rays = this.rays.map(function (deg, i) { return new Mark('sw-ray-' + (i + 1), rays); });
      r.button = use('sw-button', r.body);
      use('sw-body', r.body);
      var face = el('g', { 'clip-path': 'url(#sw-c-face)' }, r.body);
      r.hand = new Pointer('sw-hand', face);
      r.eyes = new Eyes(face);
      r.mouth = new Mouth(face, 18);
    },

    pose: function (r, t, p) {
      var A = this, gag = p >= 0;
      // the tick: each step lands with a little overshoot, and the body twitches
      var n = Math.floor(t / A.tick), f = (t / A.tick) % 1;
      var settle = f < 0.25 ? back(f / 0.25) : 1;
      var twitch = f < 0.2 ? Math.sin(Math.PI * f / 0.2) : 0;
      var idleDeg = (n - 1 + settle) * A.stepDeg;

      var press = gag ? span(p, 0.14, 0.2) * (1 - span(p, 0.3, 0.38)) : 0;
      var jump = gag ? Math.sin(Math.PI * span(p, 0.2, 0.5)) : 0;
      var land = gag ? Math.sin(Math.PI * span(p, 0.5, 0.58)) : 0;
      if (r.stillPose) { press = 1; jump = 0.6; }
      var env = gag ? span(p, 0, 0.1) * (1 - span(p, 0.9, 1)) : 0;
      setBody(r, A, 120 * jump, 1 + 0.03 * twitch * (1 - env) + 0.05 * jump, 0, 0.06 * press + 0.05 * land - 0.05 * jump);
      r.button.setAttribute('transform', 'translate(0 ' + (60 * press).toFixed(1) + ')');

      // the hand: steps round in the idle; in the gag it whips round one full turn and lands back
      // on the tick it left
      var deg = idleDeg;
      if (gag) { if (r.whipFrom === undefined) r.whipFrom = idleDeg; deg = r.whipFrom + 360 * back(span(p, 0.22, 0.6)); }
      else r.whipFrom = undefined;
      if (r.stillPose) deg = 60;
      r.hand.put(A.dial, deg);

      var C = A.dial;
      A.rays.forEach(function (d, i) {
        var grow = r.stillPose ? 1 : gag ? back(span(p, 0.24 + i * 0.012, 0.34 + i * 0.012)) * (1 - span(p, 0.62, 0.74)) : 0;
        ringRays(r, A, C, A.dialR + 260, grow, i);
      });

      // eyes follow the hand's tip; in the gag they glance up at the button first
      var tipA = (deg - 90) * Math.PI / 180, look = [-22 + 24 * Math.cos(tipA), 20 * Math.sin(tipA)];
      if (gag && p < 0.22) look = [lerp(look[0], -22, span(p, 0, 0.08)), lerp(look[1], -34, span(p, 0, 0.08))];
      var pop = r.stillPose ? 1 : gag ? back(span(p, 0.2, 0.3)) * (1 - span(p, 0.7, 0.85)) : 0;
      r.eyes.set([A.eyes[0], A.eyes[1] - 25 * pop], A.eyeScale * (1 + 0.15 * pop), blink(r, t), look);
      r.mouth.set(A.mouth, A.mouthW, r.stillPose ? 1 : gag ? span(p, 0.18, 0.24) * (1 - span(p, 0.66, 0.74)) : 0);
    }
  };

  // block (step 3, "Start building"): 2048 space of block-recraft.svg, a cube in three-quarter
  // view. No limbs; the face on its front. Idle: a jelly wobble (squash and a sideways lean),
  // its eyes glancing up now and then as if waiting for something. Gag "build": two golden
  // blocks the same size fall into place beside it and on top, building a small pyramid; each
  // landing squashes what it lands on; the pyramid gives a proud hop and it grins; then the two
  // golden blocks pop away and it slides back to the middle.
  var BLOCK = {
    viewBox: '-251 -410 2550 2550',
    parts: 'block-parts.svg',
    ground: 1637, centreX: 1024,
    eyes: [795, 1095], eyeScale: 2,
    mouth: [795, 1365], mouthW: 82,
    // the cube's edges, measured from the drawing: along the bottom of its front face, and up
    across: [655, 190], up: [0, -730],
    // the builders: where each lands (in edges), and when it falls
    blocks: [{ at: [1, 0], drop: [0.1, 0.24] }, { at: [0.5, 1], drop: [0.32, 0.46] }],
    // its own shadow, under its footprint (the shared ground line is below the cube's base);
    // the block landing beside it gets one too, growing as it falls; the top one has none
    ownShadow: true, shadow: { at: [1040, 1468], rx: 640, ry: 190 },
    hop: { period: 1, height: 0 },
    gag: 3.2,
    idle: 3.4,
    still: 0.6,            // the pyramid built, grinning

    build: function (r) {
      r.slide = el('g', {}, r.root);
      r.shadows = [new Shadow(r, r.slide), new Shadow(r, r.slide)];
      r.body = el('g', {}, r.slide);
      var src = document.getElementById('bk-white');
      r.bottom = [+src.getAttribute('data-bx'), +src.getAttribute('data-by')];
      r.hero = el('g', {}, r.body);
      use('bk-white', r.hero);
      var face = el('g', { 'clip-path': 'url(#bk-c-face)' }, r.hero);
      r.eyes = new Eyes(face);
      r.mouth = new Mouth(face, 18);
      // drawn after the hero: the one beside it covers its shaded side, the top one sits on both
      r.blocks = this.blocks.map(function () { return use('bk-gold', r.body); });
    },

    // a block's offset moved to at, squashed about its own bottom (sq > 0 flattens), scaled by k
    put: function (r, node, at, sq, k) {
      var B = r.bottom;
      node.setAttribute('transform', 'translate(' + at[0].toFixed(1) + ' ' + at[1].toFixed(1) + ') translate(' + B[0] + ' ' + B[1] +
        ') scale(' + (k * (1 + 0.6 * sq)).toFixed(3) + ' ' + (k * (1 - sq)).toFixed(3) + ') translate(' + (-B[0]) + ' ' + (-B[1]) + ')');
    },

    pose: function (r, t, p) {
      var A = this, gag = p >= 0, still = r.stillPose;
      var env = gag ? span(p, 0, 0.06) * (1 - span(p, 0.94, 1)) : 0;
      // idle: a jelly wobble, squashing and leaning
      var w = 2 * Math.PI * t / 1.6;
      var squash = 0.035 * Math.sin(w) * (1 - env), lean = 2.2 * Math.sin(w * 0.5) * (1 - env);

      // the whole build slides left as it starts, so the finished pyramid sits in the middle,
      // and back once the builders have gone
      var built = still ? 1 : gag ? span(p, 0.04, 0.16) * (1 - span(p, 0.86, 0.98)) : 0;
      r.slide.setAttribute('transform', 'translate(' + (-A.across[0] / 2 * built).toFixed(1) + ' ' + (-A.across[1] / 2 * built).toFixed(1) + ')');
      var proud = gag && !still ? Math.sin(Math.PI * span(p, 0.52, 0.66)) : 0;
      setBody(r, A, 80 * proud, 1, lean, squash - 0.03 * proud);
      var S = A.shadow, up = 1 - 0.3 * proud;
      r.shadows[0].set(S.at, S.rx * up * (1 + squash), S.ry * up, 1 - 0.4 * proud);

      // each block falls (speeding up), lands with a squash and squashes what it lands on
      var land = [0, 0];
      A.blocks.forEach(function (b, i) { land[i] = gag && !still ? Math.sin(Math.PI * span(p, b.drop[1], b.drop[1] + 0.07)) : 0; });
      A.blocks.forEach(function (b, i) {
        var fall = still ? 1 : gag ? span(p, b.drop[0], b.drop[1]) : 0;
        var leave = gag && !still ? span(p, 0.8 + 0.03 * (1 - i), 0.88 + 0.03 * (1 - i)) : 0;   // the top one goes first
        if (i === 0) r.shadows[1].e.setAttribute('opacity', 0);
        if (fall <= 0 || leave >= 1) { r.blocks[i].setAttribute('opacity', 0); return; }
        if (i === 0) {
          // the falling block's shadow grows and darkens as it nears the ground
          var near = (still ? 1 : fall * fall) * (1 - 0.3 * proud) * (leave > 0 ? 1 - leave : 1);
          r.shadows[1].set([S.at[0] + A.across[0], S.at[1] + A.across[1]], S.rx * (0.35 + 0.65 * near), S.ry * (0.35 + 0.65 * near), near);
        }
        var at = [A.across[0] * b.at[0] + A.up[0] * b.at[1], A.across[1] * b.at[0] + A.up[1] * b.at[1] - 1300 * (1 - fall * fall)];
        // the bottom block is squashed again when the top one lands on it
        var sq = 0.16 * land[i] + (i === 0 ? 0.08 * land[1] : 0);
        // leaving: a little swell, then it pops away to nothing
        var k = leave > 0 ? (leave < 0.3 ? 1 + 0.4 * leave : 1.12 * (1 - leave) / 0.7) : 1;
        r.blocks[i].setAttribute('opacity', (1 - span(leave, 0.5, 1)).toFixed(3));
        A.put(r, r.blocks[i], at, sq, k);
      });
      // the hero takes a small thud from the block beside it and a squash from the top one
      A.put(r, r.hero, [0, 0], 0.04 * land[0] + 0.08 * land[1], 1);

      // eyes: forward with an idle glance up; in the gag they watch each block fall in
      var look;
      if (still) look = [-8, -26];
      else if (gag) {
        if (p < 0.24) look = [lerp(-12, 10, span(p, 0.12, 0.24)), lerp(-40, 0, span(p, 0.12, 0.24))];
        else if (p < 0.46) look = [lerp(10, 0, span(p, 0.26, 0.32)), lerp(0, -42, span(p, 0.26, 0.32))];
        else look = [lerp(0, -22, span(p, 0.5, 0.6)), lerp(-42, -6, span(p, 0.5, 0.6))];
      } else {
        var g = (t % 3.8) / 3.8, up = span(g, 0.55, 0.62) * (1 - span(g, 0.82, 0.9));
        look = [-22 + 14 * Math.sin(t * 0.8), lerp(4, -36, up)];
        look = [lerp(look[0], -12, span(t, r.nextGag - 0.4, r.nextGag)), lerp(look[1], -40, span(t, r.nextGag - 0.4, r.nextGag))];
      }
      // the landings jolt the eyes down a touch; they never squint
      r.eyes.set([A.eyes[0], A.eyes[1] + 18 * Math.max(land[0], land[1])], A.eyeScale, blink(r, t), look);
      var grin = still ? 1 : gag ? back(span(p, 0.48, 0.56)) * (1 - span(p, 0.84, 0.93)) : 0;
      r.mouth.grin(A.mouth, A.mouthW, grin);
    }
  };

  // power-button: 2048 space of power-button-recraft.svg, a flat white cap with the power
  // symbol on top, in a tall golden base that wears the face. Rubber-hose arms from the base's
  // sides with the hero's fists. Idle: on standby, arms hanging and swinging a little, the cap
  // breathing, the eyes darting side to side. Gag "switch on": it looks up, reaches up and over
  // with a pointing finger and jabs its own button; the cap presses down, then springs up as the
  // symbol lights, rays pop and it grins, pumping its other fist.
  var POWER_BUTTON = {
    viewBox: '23 -75 2000 2000',
    parts: 'power-button-parts.svg',
    ground: 1605, centreX: 1023,
    cap: [1028, 700],
    eyes: [1100, 1395], eyeScale: 1.35,
    mouth: [1100, 1545], mouthW: 52,
    shoulderL: [352, 1330], shoulderR: [1694, 1330],
    restL: [215, 1540], restR: [1830, 1540],
    hover: [1010, 210], jab: 120,          // where the pointing wrist waits above the cap, and how far it jabs
    pumpUp: [150, 1010],                   // the fist pump's top
    fistScale: 2.5, handScale: 0.46, pointScale: 0.72,   // the fists and the pointing hand drawn to one size
    rays: [-90, -50, -130, -12, -168, 22, 158],
    rayScale: 0.5,
    hop: { period: 1, height: 0 },
    gag: 2.4,
    idle: 3.4,
    still: 0.5,            // switched on: finger on the button, lit, rays out, fist up, grinning

    build: function (r) {
      var A = this;
      r.body = el('g', {}, r.root);
      var rays = el('g', {}, r.body);
      r.rays = this.rays.map(function (deg, i) { return new Mark('pb-ray-' + (i + 1), rays); });
      r.cap = el('g', {}, r.body);
      use('pb-cap', r.cap);
      r.lit = use('pb-lit', r.cap);
      // the base is drawn over the cap, so the cap presses down behind the ring
      use('pb-base', r.body);
      r.eyes = new Eyes(r.body);
      r.mouth = new Mouth(r.body, 16);
      r.armL = new Limb(r.root, 48, 18); r.armR = new Limb(r.root, 48, 18);
      r.handL = new Hand(r.root, A.fistScale, A.handScale);
      r.handR = new Hand(r.root, A.fistScale, A.pointScale);
    },

    pose: function (r, t, p) {
      var A = this, gag = p >= 0, still = r.stillPose;
      var env = gag ? span(p, 0, 0.1) * (1 - span(p, 0.9, 1)) : 0;
      var breathe = 10 * Math.sin(2 * Math.PI * t / 2.4) * (1 - env);

      var press = still ? 0.4 : gag ? span(p, 0.3, 0.36) * (1 - span(p, 0.4, 0.46)) : 0;
      var spring = gag && !still ? back(span(p, 0.4, 0.5)) * (1 - span(p, 0.52, 0.64)) : 0;
      var on = still ? 1 : gag ? span(p, 0.4, 0.44) * (1 - span(p, 0.84, 0.94)) : 0;
      setBody(r, A, 0, 1, 0, 0.03 * press);
      var dy = 90 * press - 50 * spring - breathe;
      r.cap.setAttribute('transform', 'translate(0 ' + dy.toFixed(1) + ')');
      r.lit.setAttribute('opacity', on.toFixed(3));

      A.rays.forEach(function (d, i) {
        var grow = still ? 1 : gag ? back(span(p, 0.42 + i * 0.012, 0.52 + i * 0.012)) * (1 - span(p, 0.74, 0.84)) : 0;
        ringRays(r, A, A.cap, 600, grow, i);
      });

      // right arm: up and over the cap, a pointing jab, then back down
      var reach = still ? 1 : gag ? smooth(span(p, 0.08, 0.28)) * (1 - smooth(span(p, 0.62, 0.8))) : 0;
      var swingR = Math.sin(t * 2.1) * 30 * (1 - env);
      var restR = [A.restR[0] + swingR * 0.3, A.restR[1] - Math.abs(swingR) * 0.2];
      var over = [A.hover[0], A.hover[1] + A.jab * press];
      var wR = [lerp(restR[0], over[0], reach), lerp(restR[1], over[1], reach) - 260 * Math.sin(Math.PI * reach) * (gag && p < 0.3 ? 1 : 0)];
      // it bows out round the right side, not across the front
      r.armR.draw(hose(A.shoulderR, wR, Math.hypot(wR[0] - A.shoulderR[0], wR[1] - A.shoulderR[1]) * 1.12, reach > 0.2 ? 1 : -1));
      // pointing down and a little to the left, at the symbol
      if (reach > 0.6) r.handR.put('point', wR, angle(A.shoulderR, wR), true, 0, 200);
      else r.handR.put('fist', wR, angle(A.shoulderR, wR), true);

      // left arm: hangs, then pumps a fist twice once it's on
      var pump = still ? 1 : gag ? Math.abs(Math.sin(Math.PI * 2 * span(p, 0.46, 0.8))) * (1 - span(p, 0.78, 0.86)) : 0;
      var swingL = Math.sin(t * 2.1 + 1.3) * 30 * (1 - env);
      var restL = [A.restL[0] + swingL * 0.3, A.restL[1] - Math.abs(swingL) * 0.2];
      var wL = [lerp(restL[0], A.pumpUp[0], pump), lerp(restL[1], A.pumpUp[1], pump)];
      r.armL.draw(hose(A.shoulderL, wL, Math.hypot(wL[0] - A.shoulderL[0], wL[1] - A.shoulderL[1]) * 1.12, 1));
      r.handL.put('fist', wL, angle(A.shoulderL, wL), false);

      // eyes: darting on standby; up at the button for the reach, popped once it's on
      var look;
      if (still) look = [-22, -6];
      else if (gag) look = p < 0.42 ? [lerp(r.lookAtGag || -22, -10, span(p, 0, 0.1)), lerp(0, -42, span(p, 0, 0.1))] : [-22, lerp(-42, -6, span(p, 0.44, 0.54))];
      else {
        var g = (t % 4.2) / 4.2;
        look = [g < 0.33 ? -44 : g < 0.66 ? 2 : -22, 0];
        look = [lerp(look[0], -22, span(t, r.nextGag - 0.4, r.nextGag)), 0];
        r.lookX = look[0];
      }
      var pop = still ? 1 : gag ? back(span(p, 0.42, 0.52)) * (1 - span(p, 0.78, 0.9)) : 0;
      r.eyes.set([A.eyes[0], A.eyes[1] - 10 * pop], A.eyeScale * (1 + 0.12 * pop), blink(r, t), look);
      r.mouth.grin(A.mouth, A.mouthW, still ? 1 : gag ? back(span(p, 0.44, 0.52)) * (1 - span(p, 0.8, 0.9)) : 0);
    }
  };

  // the hero duo: two copies of the running hero (duo-parts.svg, his 1024 space), facing each
  // other, the right one mirrored. His body and eyes, rubber-hose limbs, his shoes and fists
  // from the kit. One rig, two gags:
  //   high-five (thank-you page): a crouch, a jump toward each other, a flip mid-air to the palm
  //     side (no face, so the eyes go), a whole-body slap with impact stars, a flip back, a landing.
  //   handshake (About): the inner arms reach in, the Recraft clasp appears between them and
  //     pumps, the two bob along with it, then let go.
  //   solo (hero-cheer, the thank-you page): just the left one, celebrating: a crouch, a jump
  //     with both fists flung up, stars at the top, a squashy landing.
  // The duo gags (high-five, handshake) are parked on the dev page: they need a hero drawn facing
  // left and one in side profile (see "Artist brief" in docs/mascot-rig-spec.md).
  var HERO = {
    pivot: [520, 664], eyes: [586, 357],
    hipF: [568, 664], hipB: [451, 664], shoulderF: [694, 540], shoulderB: [366, 583],
    ankleF: [600, 815], ankleB: [470, 815],
    wristF: [742, 676], wristB: [318, 690],          // hanging at rest
    legCore: 25, armCore: 18, line: 7.5, legLen: 200, armLen: 130
  };
  function makeDuo(kind) {
    return {
      viewBox: kind === 'solo' ? '-30 -74 1100 1100' : '-75 -452 1550 1550',
      parts: 'duo-parts.svg',
      ground: 850, centreX: kind === 'solo' ? 520 : 700,
      // the left one's x offset; the right one mirrored about this x (closer for the handshake)
      at: kind === 'handshake' ? [-180, 1580] : kind === 'solo' ? [0, 0] : [-230, 1630],
      contact: [700, 380],           // where they meet
      clasp: { at: [700, 604], k: 0.115 },  // sized to their fists (the build thickens its outline for this size)
      // a shadow under each hero's feet (the shared one would sit in the gap between them)
      ownShadow: true, shadow: { x: 535, y: 846, rx: 150, ry: 26 },
      hop: { period: 1, height: 0 },
      gag: kind === 'handshake' ? 3.2 : kind === 'solo' ? 2.2 : 2.6,
      idle: kind === 'handshake' ? 4 : 3.2,
      still: kind === 'handshake' ? 0.42 : kind === 'solo' ? 0.42 : 0.49,
      kind: kind,

      build: function (r) {
        var A = this;
        var who = A.kind === 'solo' ? [0] : [0, 1];
        r.shadows = who.map(function () { return new Shadow(r, r.root); });
        r.body = el('g', {}, r.root);
        r.heroes = who.map(function (i) {
          var g = el('g', { transform: i ? 'translate(' + A.at[1] + ' 0) scale(-1 1)' : 'translate(' + A.at[0] + ' 0)' }, r.body);
          var h = { g: g, nextBlink: 1 + Math.random() * 3 };
          // back to front: far arm and fist, far leg and shoe, near leg, near arm, body, near shoe and fist
          h.armB = new Limb(g, HERO.armCore, HERO.line); h.fistB = new Hand(g, 1, 0.46);
          h.legB = new Limb(g, HERO.legCore, HERO.line); h.shoeB = use('mk-shoe', g);
          h.legF = new Limb(g, HERO.legCore, HERO.line);
          h.armF = new Limb(g, HERO.armCore, HERO.line);
          h.body = el('g', {}, g);
          // the right one is his real right glove too, not a mirror image: inside his mirrored frame
          // the body is flipped back (about x 520) and uses du-body-l, the same body with its
          // face moved to the left half, so the thumb, fingers and the 1 all read correctly
          h.back = el('g', i ? { transform: 'translate(1040 0) scale(-1 1)' } : {}, h.body);
          use(i ? 'du-body-l' : 'du-body', h.back);
          h.eyes = new Eyes(h.back);
          h.flipped = !!i;
          if (i) { var bl = document.getElementById('du-body-l'); h.eyeAt = [+bl.getAttribute('data-ex'), +bl.getAttribute('data-ey')]; }
          // his shoulders and hips, in his own frame: flipped back, so they swap sides
          h.A = i ? { hipF: [1040 - HERO.hipB[0], HERO.hipB[1]], hipB: [1040 - HERO.hipF[0], HERO.hipF[1]],
                      shoulderF: [1040 - HERO.shoulderB[0], HERO.shoulderB[1]], shoulderB: [1040 - HERO.shoulderF[0], HERO.shoulderF[1]] } : HERO;
          h.palm = use('du-palm', h.body);
          h.shoeF = use('mk-shoe', g);
          h.fistF = new Hand(g, 1, 0.46);
          return h;
        });
        r.clasp = use('du-clasp', r.body);
        var c = document.getElementById('du-clasp');
        r.claspEnds = [[+c.getAttribute('data-lx'), +c.getAttribute('data-ly')], [+c.getAttribute('data-rx'), +c.getAttribute('data-ry')]];
        r.stars = [1, 2].map(function (n) { return new Mark('du-star-' + n, r.body); });
      },

      // one hero in its own frame: jx toward the other, lift up, lean toward the other, sx the
      // flip (1 back, -1 palm), squash on landing or contact; arms 0 hanging to 1 flung up;
      // tuck 0 to 1 pulls the feet up; wristF overrides the near hand (the handshake)
      hero: function (h, o, t) {
        var H = HERO, P = H.pivot, rad = o.lean * Math.PI / 180, c = Math.cos(rad), s = Math.sin(rad);
        var sx = o.sx * (1 + 0.5 * o.squash), sy = 1 - o.squash;
        function onBody(p) {
          var x = (p[0] - P[0]) * sx, y = (p[1] - P[1]) * sy;
          return [P[0] + x * c - y * s + o.jx, P[1] + x * s + y * c - o.lift];
        }
        h.body.setAttribute('transform', 'translate(' + o.jx.toFixed(1) + ' ' + (-o.lift).toFixed(1) + ') rotate(' + o.lean.toFixed(2) +
          ' ' + P[0] + ' ' + P[1] + ') translate(' + P[0] + ' ' + P[1] + ') scale(' + sx.toFixed(3) + ' ' + sy.toFixed(3) + ') translate(' + (-P[0]) + ' ' + (-P[1]) + ')');
        var palm = o.sx < 0;
        h.back.style.display = palm ? 'none' : '';
        h.palm.style.display = palm ? '' : 'none';
        var air = Math.max(0, o.lift);
        [['F', h.A.hipF, H.ankleF, h.legF, h.shoeF], ['B', h.A.hipB, H.ankleB, h.legB, h.shoeB]].forEach(function (L) {
          var hip = onBody(L[1]);
          var ankle = [L[2][0] + o.jx - 30 * o.tuck, L[2][1] - air - 80 * o.tuck];
          L[3].draw(hose(hip, ankle, H.legLen, -1));
          place(L[4], ankle, -25 * o.tuck, SHOE_ANKLE, 1, false);
        });
        // the hands rest (and fling up) at the same offsets from each hero's own shoulders, so the
        // right one's arms hang and curve exactly like the left one's, mirrored
        function from(shA, shH, p) { return [shA[0] + p[0] - shH[0], shA[1] + p[1] - shH[1]]; }
        [['F', h.A.shoulderF, from(h.A.shoulderF, H.shoulderF, H.wristF), h.armF, h.fistF, from(h.A.shoulderF, H.shoulderF, [790, 380])],
         ['B', h.A.shoulderB, from(h.A.shoulderB, H.shoulderB, H.wristB), h.armB, h.fistB, from(h.A.shoulderB, H.shoulderB, [280, 400])]].forEach(function (L) {
          var sh = onBody(L[1]);
          var up = [L[5][0] + o.jx, L[5][1] - o.lift];
          var rest = [L[2][0] + o.jx + 8 * Math.sin(t * 2 + (L[0] === 'F' ? 0 : 1.4)), L[2][1] - o.lift + 0.6 * Math.min(0, o.lift)];
          var w = L[0] === 'F' && o.wristF ? o.wristF : [lerp(rest[0], up[0], o.arms), lerp(rest[1], up[1], o.arms)];
          L[3].draw(hose(sh, w, H.armLen, 1));
          if (L[0] === 'F' && o.hideF) L[4].hide();
          else L[4].put(L[0] === 'F' && o.handF ? o.handF : 'fist', w, angle(sh, w), L[0] === 'B' || (L[0] === 'F' && o.handF === 'open'));
        });
        // the flipped-back body's eyes look the mirrored way (the pupils' centre is about -22)
        h.eyes.set(h.eyeAt || H.eyes, o.eyeK || 1, blink(h, t), h.flipped ? [-44 - o.look[0], o.look[1]] : o.look);
      },

      pose: function (r, t, p) {
        var A = this, gag = p >= 0, still = r.stillPose;
        var self = this;
        // idle: each bounces a little on its own beat, glancing at the other and at you
        function idle(i) {
          var b = Math.sin(2 * Math.PI * (t / 1.4 + i * 0.37));
          var g = ((t + i * 1.7) % 5) / 5, atYou = g > 0.55 && g < 0.85;
          return { jx: 0, lift: 6 * b - 6, lean: 1.5 * b, sx: 1, squash: 0.02 * Math.max(0, -b), arms: 0, tuck: 0,
                   look: atYou ? [-22, 0] : [8, 0] };
        }
        var o = [idle(0), idle(1)];
        var showStars = 0;
        r.clasp.style.display = 'none';
        if (A.kind === 'solo') {
          // on his own he mostly looks at you
          o[0].look = ((t % 5) / 5) < 0.75 ? [-22, 0] : [8, 0];
          if (gag || still) {
            var q = still ? A.still : p;
            var crouch = span(q, 0, 0.14) * (1 - span(q, 0.14, 0.2));
            var arc = Math.sin(Math.PI * span(q, 0.18, 0.7));
            var land = Math.sin(Math.PI * span(q, 0.7, 0.8));
            showStars = back(span(q, 0.36, 0.46)) * (1 - span(q, 0.6, 0.7));
            o[0] = { jx: 0, lift: 300 * arc - 45 * crouch - 30 * land, lean: 0, sx: 1,
                     squash: 0.1 * crouch + 0.1 * land, arms: Math.min(1, 1.5 * arc), tuck: arc,
                     look: [-22, -8], eyeK: 1 + 0.15 * arc };
          }
        } else if ((gag || still) && A.kind === 'highfive') {
          var q = still ? A.still : p;
          var crouch = span(q, 0, 0.12) * (1 - span(q, 0.12, 0.18));
          var air = span(q, 0.16, 0.8), arc = Math.sin(Math.PI * air);
          var toward = Math.sin(Math.PI * span(q, 0.16, 0.8));
          var flip1 = span(q, 0.22, 0.36), flip2 = span(q, 0.58, 0.72);
          var sxv = q < 0.47 ? Math.cos(Math.PI * flip1) : Math.cos(Math.PI * (1 + flip2));
          var slap = Math.sin(Math.PI * span(q, 0.42, 0.54));
          var land = Math.sin(Math.PI * span(q, 0.8, 0.9));
          showStars = back(span(q, 0.44, 0.54)) * (1 - span(q, 0.66, 0.76));
          o = o.map(function (x, i) {
            // they travel far enough in, and lean hard enough, for the palms to overlap at the slap
            return { jx: 190 * toward, lift: 470 * arc - 45 * crouch - 30 * land, lean: 24 * arc, sx: sxv,
                     squash: 0.1 * crouch + 0.12 * slap + 0.1 * land, arms: Math.min(1, 1.6 * arc), tuck: arc,
                     look: [8, -10] };
          });
        } else if (A.kind === 'handshake') {
          // they are mid-handshake from the first frame, so the clasp never has to swap in. Idle: a
          // slow friendly pump. Gag "won't let go": the shake speeds up and grows until their
          // feet leave the ground and their eyes pop, one huge pump hops them both, they land
          // out of sync (bobbing opposite ways), look at each other, and fall back into the calm
          // shake. The pump's phase is integrated so its speed can change without a jump.
          var q = still ? A.still : p;
          var dt = Math.max(0, Math.min(0.05, t - (r.lastT === undefined ? t : r.lastT))); r.lastT = t;
          var wild = (gag || still) ? span(q, 0.02, 0.55) * (1 - span(q, 0.55, 0.62)) : 0;
          var freq = 0.9 + 4.6 * wild * wild;
          r.ph = (r.ph || 0) + dt * freq * 2 * Math.PI;
          var amp = 16 + 60 * wild;
          var pump = Math.sin(still ? 1.2 : r.ph);
          var big = (gag || still) ? Math.sin(Math.PI * span(q, 0.55, 0.7)) : 0;     // the last huge pump and hop
          var land = gag ? Math.sin(Math.PI * span(q, 0.7, 0.78)) : 0;
          var odd = gag ? span(q, 0.7, 0.74) * (1 - span(q, 0.86, 0.94)) : 0;      // out of sync
          var C = A.clasp, E = r.claspEnds, mid = [(E[0][0] + E[1][0]) / 2, (E[0][1] + E[1][1]) / 2];
          // each body's lift; the clasp rides their average, with the shake on top
          var lifts = [0, 1].map(function (i) {
            var bob = pump * (i && odd > 0 ? -1 : 1);
            return (4 + 26 * wild) * bob + 70 * wild * Math.max(0, bob) + 150 * big - 30 * land;
          });
          var cy = C.at[1] - (lifts[0] + lifts[1]) / 2 + 0.6 * amp * pump * (1 - big) + 10 * land;
          r.clasp.style.display = '';
          r.clasp.setAttribute('transform', 'translate(' + C.at[0] + ' ' + cy.toFixed(1) + ') scale(' + C.k + ') translate(' + (-mid[0]) + ' ' + (-mid[1]) + ')');
          o = o.map(function (x, i) {
            // the clasp's sleeve end for this hero, in its own frame (the right one is mirrored)
            var e = E[i], sxw = C.at[0] + (e[0] - mid[0]) * C.k, syw = cy + (e[1] - mid[1]) * C.k;
            x.wristF = [i ? A.at[1] - sxw : sxw - A.at[0], syw];
            x.hideF = true;
            // bodies ride the pump; when wild their feet leave the ground; out of sync, the
            // right one bobs the opposite way
            var bob = pump * (i && odd > 0 ? -1 : 1);
            x.lift = lifts[i];
            x.squash = 0.08 * land; x.tuck = 0.6 * big + 0.3 * wild;
            x.lean = 2 * bob + 4 * wild * bob;
            x.arms = 0;
            x.eyeK = 1 + 0.16 * Math.max(wild, big);
            // glance at each other when they fall out of step, otherwise at each other or you
            if (odd > 0 || wild > 0.2) x.look = [8, wild > 0.2 ? -12 : 2];
            return x;
          });
        }
        r.heroes.forEach(function (h, i) { self.hero(h, o[i], t); });
        var S = A.shadow;
        r.shadows.forEach(function (sh, i) {
          var x = i ? A.at[1] - S.x - o[i].jx : A.at[0] + S.x + o[i].jx, up = Math.max(0, o[i].lift) / 470;
          sh.set([x, S.y], S.rx * (1 - 0.5 * up), S.ry * (1 - 0.5 * up), 1 - 0.6 * up);
        });
        if (A.kind === 'handshake') { r.stars[0].put(A.clasp.at, 0, 0, 0); r.stars[1].put(A.clasp.at, 0, 0, 0); return; }
        if (A.kind === 'solo') {
          // a star beside each raised fist at the top of the jump
          var L = o[0].lift;
          r.stars[0].put([140, 300 - L], -16, 0.42 * showStars, Math.min(1, showStars * 2));
          r.stars[1].put([920, 280 - L], 16, 0.42 * showStars, Math.min(1, showStars * 2));
          return;
        }
        // the impact stars burst on the outsides, one beyond each hero, flying outward
        var C2 = A.contact, lift = o[0].lift, out = 520 + 120 * showStars;
        r.stars[0].put([C2[0] - out, C2[1] - lift - 60], -18, 0.5 * showStars, Math.min(1, showStars * 2));
        r.stars[1].put([C2[0] + out, C2[1] - lift - 60], 18, 0.5 * showStars, Math.min(1, showStars * 2));
      }
    };
  }

  // hero-cheer (the thank-you page): the hero's victory pose, the drawing from the homepage
  // landing (assets/mascots/hero/hero-idle-parts.svg, built by tools/build-hero-rig.py idle),
  // both fists up, standing planted. His idle there carries over: a bounce with the fists punching
  // up. Gag "cheer": a crouch, a jump with the fists punching high, a landing impact star beside
  // each fist at the top, a squashy landing. Rubber-hose limbs as in hs-hero-rig.js's Idle.
  var VICTORY = {
    shoulderL: [412, 590], wristL: [252, 476],
    shoulderR: [706, 548], wristR: [802, 442],
    hipL: [458, 690], ankleL: [440, 795],
    hipR: [598, 688], ankleR: [600, 778],
    eyes: { r: [640, 364], l: [549, 381] }
  };
  var HERO_CHEER = {
    viewBox: '-72 -73 1200 1200',     // his shoes on the shared ground line, room above for the jump
    parts: ['../hero/hero-idle-parts.svg', '../hero/hero-jolt-parts.svg'],
    ground: 935, centreX: 528,
    hop: { period: 1, height: 0 },
    gag: 2.2,
    idle: 3.4,
    still: 0.42,           // at the top of the jump, fists high, stars out
    period: 1.3, dip: 12, pump: 14, legCore: 27, armCore: 22, line: 7.5,

    build: function (r) {
      var A = this;
      r.body = el('g', {}, r.root);          // the jump lifts everything
      var g = r.body;
      // back to front, as hs-hero-rig.js's Idle: right arm behind the glove, legs, shoes, body
      // and eyes, left arm in front, the band again so the left arm tucks under it, the fists
      r.armR = new Limb(g, A.armCore, A.line);
      r.legL = new Limb(g, A.legCore, A.line); r.legR = new Limb(g, A.legCore, A.line);
      r.shoeL = use('hi-shoe-l', g); r.shoeR = use('hi-shoe-r', g);
      r.torso = el('g', {}, g);
      use('hi-body', r.torso);
      r.eyesV = {};
      ['r', 'l'].forEach(function (e) {
        var eg = el('g', {}, r.torso);
        use('hi-eye-' + e + '-white', eg);
        var pupil = use('hi-pupil-' + e, el('g', { 'clip-path': 'url(#hi-c-eye-' + e + ')' }, eg));
        use('hi-eye-' + e + '-line', eg);
        r.eyesV[e] = { g: eg, pupil: pupil };
      });
      r.armL = new Limb(g, A.armCore, A.line);
      r.band = use('hi-band', g);
      r.number = use('hi-number', g);
      r.fistL = use('hi-fist-l', g); r.fistR = use('hi-fist-r', g);
      r.stars = [1, 3].map(function (n) { return new Mark('hj-star-' + n, r.root); });
    },

    pose: function (r, t, p) {
      var A = this, V = VICTORY, gag = p >= 0, still = r.stillPose;
      if (A.thumbs) return A.thumbsPose(r, t, p);
      var q = still ? A.still : p;
      var env = gag ? span(p, 0, 0.08) * (1 - span(p, 0.9, 1)) : 0;
      // idle: his landing bounce, dipping and punching the fists up
      var u = (t / A.period) % 1;
      var down = A.dip * (1 - Math.cos(2 * Math.PI * u)) / 2 * (1 - env);
      var punch = A.pump * Math.sin(2 * Math.PI * u + 0.6) * (1 - env);
      // the cheer: crouch, jump, fists high, land
      var crouch = (gag || still) ? span(q, 0, 0.14) * (1 - span(q, 0.14, 0.2)) : 0;
      var arc = (gag || still) ? Math.sin(Math.PI * span(q, 0.18, 0.7)) : 0;
      var land = gag && !still ? Math.sin(Math.PI * span(q, 0.7, 0.8)) : 0;
      down += 40 * crouch + 26 * land;
      punch += 70 * arc - 20 * crouch;
      var lift = 210 * arc;
      r.body.setAttribute('transform', 'translate(0 ' + (-lift).toFixed(1) + ')');
      var body = 'translate(0 ' + down.toFixed(1) + ')';
      r.torso.setAttribute('transform', body); r.band.setAttribute('transform', body); r.number.setAttribute('transform', body);
      function onBody(pt) { return [pt[0], pt[1] + down]; }

      // legs: knees bow out as he dips; in the air the feet tuck up a little
      var tuck = 50 * arc;
      var ankleL = [V.ankleL[0] + 10 * arc, V.ankleL[1] - tuck], ankleR = [V.ankleR[0] - 10 * arc, V.ankleR[1] - tuck];
      var lenL = Math.hypot(V.ankleL[0] - V.hipL[0], V.ankleL[1] - V.hipL[1]) * 1.03;
      var lenR = Math.hypot(V.ankleR[0] - V.hipR[0], V.ankleR[1] - V.hipR[1]) * 1.03;
      r.legL.draw(hose(onBody(V.hipL), ankleL, lenL, 1));
      r.legR.draw(hose(onBody(V.hipR), ankleR, lenR, -1));
      r.shoeL.setAttribute('transform', 'translate(' + (ankleL[0] - V.ankleL[0]).toFixed(1) + ' ' + (ankleL[1] - V.ankleL[1]).toFixed(1) + ')');
      r.shoeR.setAttribute('transform', 'translate(' + (ankleR[0] - V.ankleR[0]).toFixed(1) + ' ' + (ankleR[1] - V.ankleR[1]).toFixed(1) + ')');

      // arms: the fists punch up from where the drawing has them (and spread a little at the top)
      [['L', -1, 1.08, r.armL, r.fistL, -40], ['R', 1, 1.06, r.armR, r.fistR, 40]].forEach(function (s) {
        var sh0 = V['shoulder' + s[0]], wr0 = V['wrist' + s[0]];
        var sh = onBody(sh0);
        var wr = [wr0[0] + s[5] * arc, wr0[1] + down * 0.4 - punch];
        var len = Math.hypot(wr0[0] - sh0[0], wr0[1] - sh0[1]) * s[2];
        s[3].draw(hose(sh, wr, Math.max(len, Math.hypot(wr[0] - sh[0], wr[1] - sh[1])), s[1]));
        place(s[4], wr, angle(sh, wr) - angle(sh0, wr0), wr0, 1, false);
      });

      // eyes: his own drawn eyes, blinking and glancing; wide open through the cheer
      var open = gag ? 1 : blink(r, t), look = 5 * Math.sin(t * 0.9);
      ['r', 'l'].forEach(function (e) {
        var c = V.eyes[e];
        r.eyesV[e].g.setAttribute('transform', open < 1 ? 'translate(0 ' + c[1] + ') scale(1 ' + open.toFixed(2) + ') translate(0 ' + (-c[1]) + ')' : '');
        r.eyesV[e].pupil.setAttribute('transform', 'translate(' + look.toFixed(1) + ' ' + (-8 * arc).toFixed(1) + ')');
      });

      // a landing impact star beside each fist at the top of the jump
      var st = (gag || still) ? back(span(q, 0.34, 0.44)) * (1 - span(q, 0.6, 0.7)) : 0;
      if (still) st = 1;
      r.stars[0].put([V.wristL[0] - 130, V.wristL[1] - punch - lift - 60], -14, 0.45 * st, Math.min(1, st * 2));
      r.stars[1].put([V.wristR[0] + 130, V.wristR[1] - punch - lift - 70], 14, 0.45 * st, Math.min(1, st * 2));
    }
  };

  // hero-thumbs: the same victory drawing, posed by the code into two thumbs-up held in front
  // by his chest: each rubber-hose arm comes out from behind the band, swings down to an elbow and comes up into the bottom
  // of the wrist, so the hose disappears inside the hand. The hand is the kit's Recraft thumbs-up
  // without its shade, to match his own fists (the left one mirrored). Idle: a blink and a slow
  // breath. Gag: two thumbs pumps toward you with a bounce, a wink and a star by each thumb.
  // hero-thumbs: the same victory drawing, posed by the code into a two thumbs-up held at his
  // chest. The arms come out of the sides of his band (as on the floating hero), swing out and
  // down to an elbow, then come back in sideways into each hand's wrist, which on this drawing is
  // the rounded heel on the hand's outer side (the left hand from the left, the right from the
  // right). The hose ends inside the hand, so the hand covers its end. The hand is the kit's
  // Recraft thumbs-up without its shade, to match his own fists (the left one mirrored). Idle: a
  // blink and a slow breath. The gag (two thumbs pumps, a wink, a star by each thumb) is off.
  var HERO_THUMBS = Object.assign({}, HERO_CHEER, {
    thumbs: true,
    gag: 1.5,
    idle: -1,
    noGag: true,           // gag off for now (2026-10-19): hover and tap do nothing
    still: undefined,      // the still is him at rest, thumbs up
    wristL: [394, 680], wristR: [742, 664],   // where each arm enters its hand's side
    armL: [434, 622], armR: [696, 604],       // where each arm leaves the band, near the top of its sides
    thumbScale: 0.17, thumbTilt: 4,
    SIDE: [1690, 1290],    // the wrist on the side of the thumbs-up drawing (mk-hand-thumbflat space)
    // the right leg ends a little left of the drawing's ankle, so its rounded end covers the shoe's collar lip
    ankleR: [586, 780],
    // his own shadow, centred under both shoes (the loader's sits under the drawing's middle)
    ownShadow: true, shadow: { at: [566, 916], rx: 235, ry: 34 },

    build: function (r) {
      HERO_CHEER.build.call(this, r);
      r.shadow = new Shadow(r, r.root);
      r.root.insertBefore(r.shadow.e, r.root.firstChild);
      r.shadow.set(this.shadow.at, this.shadow.rx, this.shadow.ry, 1);
      r.fistL.style.display = 'none'; r.fistR.style.display = 'none';
      // both arms in front of his body, tucked under the band where they leave it
      r.body.insertBefore(r.armR.ink.parentNode, r.band);
      // legs over the shoes, so each leg's rounded end covers the drawing's lumpy collar where it goes in
      r.body.insertBefore(r.legL.ink.parentNode, r.torso);
      r.body.insertBefore(r.legR.ink.parentNode, r.torso);
      r.thumbs = [new Hand(r.body, 1, this.thumbScale), new Hand(r.body, 1, this.thumbScale)];
      // the wink: his right eye swaps its pupil for a happy closed arc
      r.wink = el('path', { d: 'M608 384Q640 346 672 384', fill: 'none', stroke: INK, 'stroke-width': 16, 'stroke-linecap': 'round', opacity: 0 }, r.torso);
    },

    thumbsPose: function (r, t, p) {
      var A = this, V = VICTORY;
      if (A.noGag) p = -1;
      var gag = p >= 0;
      // the pumps: a small wind-up, then two quick punches up and toward you
      var u = gag ? clamp((p - 0.1) / 0.6) : 0;
      var wind = gag ? Math.sin(Math.PI * span(p, 0, 0.12)) * (1 - span(p, 0.08, 0.12)) : 0;
      var pump = gag && u > 0 && u < 1 ? Math.sin(Math.PI * ((u * 2) % 1)) : 0;
      var second = gag && u >= 0.5 ? 1 : 0;
      var breath = (1 - Math.cos(2 * Math.PI * t / 3.4)) / 2;
      var down = 4 * breath + 14 * wind + 10 * pump;
      var body = 'translate(0 ' + down.toFixed(1) + ')';
      r.body.removeAttribute('transform');
      r.torso.setAttribute('transform', body); r.band.setAttribute('transform', body); r.number.setAttribute('transform', body);
      function onBody(pt) { return [pt[0], pt[1] + down]; }
      [['L', V.hipL, V.ankleL, 1, r.legL], ['R', V.hipR, A.ankleR, -1, r.legR]].forEach(function (s) {
        s[4].draw(hose(onBody(s[1]), s[2], Math.hypot(s[2][0] - s[1][0], s[2][1] - s[1][1]) * 1.03, s[3]));
      });
      r.shoeL.removeAttribute('transform'); r.shoeR.removeAttribute('transform');
      // arms: out of the band's side, out to the elbow, then back in sideways into the
      // wrist on the hand's outer side
      var lift = 30 * pump - 14 * wind, grow = 1 + 0.12 * pump;
      var src = document.getElementById('mk-hand-thumbflat');
      var pivot = [+src.getAttribute('data-wx'), +src.getAttribute('data-wy')];
      [[A.armL, A.wristL, r.armL, -1, true], [A.armR, A.wristR, r.armR, 1, false]].forEach(function (s, i) {
        var sh = onBody(s[0]), out = s[3], W = [s[1][0], s[1][1] + down - lift];
        function f(q) { return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }
        var end = [W[0] - out * 26 * grow, W[1]];
        s[2].draw('M' + f(sh) + 'C' + f([sh[0] + out * 50, sh[1] + 16]) + ' ' + f([W[0] + out * 50, W[1]]) + ' ' + f(end));
        // place the hand so its side wrist lands on W: work out where its usual pivot goes
        var h = r.thumbs[i], k = A.thumbScale * grow * (+src.getAttribute('data-k') || 1);
        var tilt = -out * (A.thumbTilt + 2 * breath), rad = tilt * Math.PI / 180;
        var dx = (pivot[0] - A.SIDE[0]) * k * (s[4] ? -1 : 1), dy = (pivot[1] - A.SIDE[1]) * k;
        var P = [W[0] + dx * Math.cos(rad) - dy * Math.sin(rad), W[1] + dx * Math.sin(rad) + dy * Math.cos(rad)];
        h.handScale = A.thumbScale * grow;
        h.put('thumbflat', P, 0, s[4], 0, tilt);
      });
      // the drawing's pupils sit up and to the right; here they move to the middle of each eye,
      // so he looks straight at you, drifting only a touch. In the gag his right eye winks.
      var CENTRE = { r: [-27, 7], l: [-22, 5] };
      var open = gag ? 1 : blink(r, t), look = gag ? 0 : 2.5 * Math.sin(t * 0.7);
      var wink = gag && p > 0.14 && p < 0.86 ? 1 : 0;
      ['r', 'l'].forEach(function (e) {
        // winking, the eye keeps its white and outline (the outline is part of his silhouette); the pupil goes
        var c = V.eyes[e], o = open, shut = e === 'r' && wink > 0.5;
        r.eyesV[e].pupil.style.display = shut ? 'none' : '';
        r.eyesV[e].g.setAttribute('transform', o < 1 ? 'translate(0 ' + c[1] + ') scale(1 ' + o.toFixed(2) + ') translate(0 ' + (-c[1]) + ')' : '');
        r.eyesV[e].pupil.setAttribute('transform', 'translate(' + (CENTRE[e][0] + look).toFixed(1) + ' ' + CENTRE[e][1] + ')');
      });
      r.wink.setAttribute('opacity', wink > 0.5 ? 1 : 0);
      // a star pops beside each thumb on the second pump
      var st = gag ? back(span(p, 0.42, 0.56)) * (1 - span(p, 0.78, 0.9)) * second : 0;
      r.stars[0].put([A.wristL[0] - 60, A.wristL[1] - 110 - lift], -14, 0.32 * st, Math.min(1, st * 2));
      r.stars[1].put([A.wristR[0] + 60, A.wristR[1] - 120 - lift], 14, 0.32 * st, Math.min(1, st * 2));
    }
  });

  var CHARACTERS = { magnifier: MAGNIFIER, lightbulb: LIGHTBULB, megaphone: MEGAPHONE, 'browser-window': COMPUTER,
    'speech-bubble': SPEECH_BUBBLE, 'finish-flag': FINISH_FLAG, compass: COMPASS, clipboard: CLIPBOARD, stopwatch: STOPWATCH,
    block: BLOCK, 'power-button': POWER_BUTTON, 'high-five': makeDuo('highfive'), handshake: makeDuo('handshake'),
    'hero-cheer': HERO_CHEER, 'hero-thumbs': HERO_THUMBS, 'case-files': CASE_FILES };

  // blink every few seconds: returns how open the eyes are, 1 to about 0
  function blink(r, t) {
    var dt = t - r.nextBlink;
    if (dt > 0.16) { r.nextBlink = t + 2 + Math.random() * 3; return 1; }
    return dt > 0 ? 0.1 + 0.9 * Math.abs(dt - 0.08) / 0.08 : 1;
  }

  /* ---------- loading and the shared clock ---------- */

  var loaded = {};
  function load(file) {
    if (!loaded[file]) {
      // revalidate so a rebuilt part is never stale; unchanged files come back as 304s
      loaded[file] = fetch(BASE + file, { cache: 'no-cache' }).then(function (res) { return res.text(); }).then(function (txt) {
        var holder = document.createElement('div');
        holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
        holder.setAttribute('aria-hidden', 'true');
        holder.innerHTML = txt;
        document.body.prepend(holder);
      });
    }
    return loaded[file];
  }

  var rigs = [], started = false, last = null;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.target.__rig) e.target.__rig.visible = e.isIntersecting; });
  }) : null;

  function frame(now) {
    if (last === null) last = now;
    var dt = Math.min(0.05, (now - last) / 1000) * api.speed; last = now;
    if (!document.hidden) rigs.forEach(function (r) { if (r.mode === 'loop' && r.visible) r.tick(dt); });
    requestAnimationFrame(frame);
  }

  function Rig(svg, C, opts) {
    this.svg = svg; this.C = C; this.o = opts || {};
    svg.setAttribute('viewBox', C.viewBox);
    this.root = el('g', {}, svg);
    this.t = Math.random() * 10;             // instances never move in sync
    this.nextBlink = this.t + 1 + Math.random() * 2;
    this.idle = 'idle' in this.o ? this.o.idle : (C.idle || 3.5);
    this.nextGag = this.t + (this.o.firstGag !== undefined ? this.o.firstGag : 0.4 + Math.random() * this.idle);
    this.gagAt = -1; this.gagEnd = -1e9;
    this.visible = !io;
    C.build(this);
    // a rig that draws its own shadow hides the loader's
    var fig = C.ownShadow && svg.closest && svg.closest('.hs-mascot');
    var cssShadow = fig && fig.querySelector('.hs-mascot__shadow');
    if (cssShadow) cssShadow.style.display = 'none';
  }
  Rig.prototype.tick = function (dt) {
    this.t += dt;
    var p = -1;
    if (this.gagAt >= 0) {
      p = (this.t - this.gagAt) / this.C.gag;
      if (p >= 1) { p = -1; this.gagAt = -1; this.gagEnd = this.t; this.nextGag = this.t + this.idle * (0.85 + Math.random() * 0.3); }
    } else if (this.idle > 0 && this.t >= this.nextGag) { this.startGag(); p = 0; }
    this.C.pose(this, this.t, p);
  };
  Rig.prototype.startGag = function () { this.gagAt = this.t; this.lookAtGag = this.lookX || 0; this.lookAtGagXY = this.lookXY; };
  Rig.prototype.gag = function () {
    if (this.mode !== 'loop' || this.gagAt >= 0) return;
    this.startGag();
  };
  // the still (repeats, reduced motion): the gag frozen at C.still, or the drawing at rest when
  // the character has no still or the slot asks for it (opts.still 'rest', data-still="rest")
  Rig.prototype.rest = function () {
    var C = this.C, hop = C.hop.height, atRest = this.o.still === 'rest' || C.still === undefined;
    C.hop.height = 0; this.nextBlink = 1e9; this.nextGag = 0.8 * C.hop.period; this.lookAtGag = 0;
    this.stillPose = !atRest;
    C.pose(this, 0.8 * C.hop.period, atRest ? -1 : C.still);
    this.stillPose = false; C.hop.height = hop;
  };

  var api = window.MascotRig = {
    speed: 1,
    reducedMotion: reduce.matches,
    ready: function (id) {
      // parts: one file or a list (the victory hero borrows the landing's impact stars)
      var parts = [].concat(CHARACTERS[id].parts);
      return Promise.all([load('kit-parts.svg')].concat(parts.map(load)));
    },
    // mode: 'loop' (idle plus a gag every few seconds) or 'rest' (still). Reduced motion is
    // always 'rest'. opts.idle: seconds between gags (0 never), opts.firstGag: seconds to the first,
    // opts.still: 'rest' for a still of the drawing at rest instead of the gag's moment.
    mount: function (svg, id, mode, opts) {
      var r = new Rig(svg, CHARACTERS[id], opts);
      r.mode = reduce.matches ? 'rest' : (mode || 'loop');
      svg.__rig = r;
      if (r.mode === 'rest') { r.rest(); return r; }
      r.C.pose(r, r.t, -1);
      if (io) io.observe(svg);
      // a hover or a tap plays the gag right away
      svg.addEventListener('pointerenter', function () { r.gag(); });
      svg.addEventListener('pointerdown', function () { r.gag(); });
      rigs.push(r);
      if (!started) { started = true; requestAnimationFrame(frame); }
      return r;
    }
  };
})();
