/* Hero run-cycle rig (dev test). Vanilla JS, no libraries, so it stays homepage-safe.
   Parts come from hero-parts.svg (built by tools/build-hero-rig.py); arms and legs are
   drawn here as rubber-hose strokes that bend to keep their length. All coordinates are
   in the art's 1024 space. */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1D3F66';
  var WHITE = '#FFFFFF';

  // Anchor points measured on the Recraft "A" drawing. A new drawing needs new values.
  var ART = {
    hipBack: [451, 664], hipFront: [568, 664],
    shoulderBack: [366, 583], shoulderFront: [694, 540],
    ankle: [700, 782],          // where the leg enters the shoe, in shoe art space
    wrist: [797, 497],          // where the arm enters the fist, in fist art space
    fistAngle: -23.5,           // direction the fist art points, degrees
    bodyPivot: [520, 664],      // lean and bob pivot, middle of the hips
    eyes: { r: [640, 352], l: [532, 362] },
    rest: {                     // the drawing's own pose
      ankleFront: [700, 782], ankleBack: [300, 768], shoeBack: 118,
      wristFront: [797, 497], wristBack: [243, 592]
    }
  };

  var DEFAULTS = {
    period: 0.75,      // seconds per full stride (two steps)
    stride: 150,       // how far each foot travels either side of the hip
    lift: 120,         // how high the back foot kicks up
    bob: 14,           // body bounce per step
    lean: 6,           // forward lean, degrees
    armSwing: 1,       // arm pump, 1 is the full range
    legCore: 25, armCore: 18, line: 7.5,
    legLength: 245, armReach: 112,
    blink: true, glance: true
  };

  // Foot loop keyframes: phase, x (in strides), y (in lifts, up is negative), shoe angle.
  // 0 is the front foot landing, heel first with the toe up.
  var FOOT = [
    [0.00,  1.00,  0.00,   0],
    [0.25,  0.15,  0.02,  22],
    [0.50, -0.90, -0.05,  55],
    [0.65, -1.10, -0.85, 110],
    [0.80, -0.25, -1.00,  70],
    [0.92,  0.85, -0.45,  10],
    [1.00,  1.00,  0.00,   0]
  ];
  var GROUND = 815;  // ankle height when the foot is planted

  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { return t * t * (3 - 2 * t); }

  function footAt(u) {
    u = ((u % 1) + 1) % 1;
    for (var i = 0; i < FOOT.length - 1; i++) {
      var a = FOOT[i], b = FOOT[i + 1];
      if (u <= b[0]) {
        var t = smooth((u - a[0]) / (b[0] - a[0]));
        return [lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)];
      }
    }
    return FOOT[0].slice(1);
  }

  function angle(a, b) { return Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI; }

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function use(id, parent) { return el('use', { href: '#' + id }, parent); }

  function rotate(p, deg, c) {
    var r = deg * Math.PI / 180, s = Math.sin(r), co = Math.cos(r);
    var x = p[0] - c[0], y = p[1] - c[1];
    return [c[0] + x * co - y * s, c[1] + x * s + y * co];
  }

  // Rubber hose: a quadratic curve from a to b that bows to one side so its length stays
  // close to len. side +1 or -1 picks the side (knees forward, elbows back).
  function hose(a, b, len, side) {
    var dx = b[0] - a[0], dy = b[1] - a[1], c = Math.hypot(dx, dy) || 1;
    var sag = len > c ? Math.sqrt(3 * c * (len - c) / 8) : 0;
    var nx = -dy / c * side, ny = dx / c * side;
    var cx = (a[0] + b[0]) / 2 + nx * sag * 2, cy = (a[1] + b[1]) / 2 + ny * sag * 2;
    return 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + 'Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) +
      ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1);
  }

  function Hero(svg, opts) {
    this.o = Object.assign({}, DEFAULTS, opts || {});
    this.svg = svg;
    svg.setAttribute('viewBox', svg.getAttribute('viewBox') || '60 40 900 920');
    var g = el('g', {}, svg);
    var self = this;
    function limb(parent) {
      var lg = el('g', { fill: 'none', 'stroke-linecap': 'round' }, parent);
      return { ink: el('path', { stroke: INK }, lg), core: el('path', { stroke: WHITE }, lg) };
    }
    // back to front: far arm, far leg and shoe, near leg, near arm, body, near shoe and fist
    this.armBack = limb(g); this.fistBack = use('hr-fist', g);
    this.legBack = limb(g); this.shoeBack = use('hr-shoe', g);
    this.legFront = limb(g);
    this.armFront = limb(g);
    this.body = el('g', {}, g);
    use('hr-body', this.body);
    this.eyes = {};
    ['r', 'l'].forEach(function (e) {
      var eg = el('g', {}, self.body);
      use('hr-eye-' + e + '-white', eg);
      var clip = el('g', { 'clip-path': 'url(#hr-c-eye-' + e + ')' }, eg);
      var pupil = use('hr-pupil-' + e, clip);
      use('hr-eye-' + e + '-line', eg);
      self.eyes[e] = { g: eg, pupil: pupil };
    });
    this.shoeFront = use('hr-shoe', g);
    this.fistFront = use('hr-fist', g);
    this.applyWidths();
    this.nextBlink = 1 + Math.random() * 2;
  }

  Hero.prototype.applyWidths = function () {
    var o = this.o;
    [[this.legBack, o.legCore], [this.legFront, o.legCore], [this.armBack, o.armCore], [this.armFront, o.armCore]]
      .forEach(function (p) {
        p[0].ink.setAttribute('stroke-width', p[1] + o.line * 2);
        p[0].core.setAttribute('stroke-width', p[1]);
      });
  };

  Hero.prototype.set = function (opts) {
    Object.assign(this.o, opts);
    this.applyWidths();
  };

  function place(node, at, angle, pivot, mirror) {
    node.setAttribute('transform',
      'translate(' + at[0].toFixed(1) + ' ' + at[1].toFixed(1) + ') rotate(' + angle.toFixed(1) + ')' +
      (mirror ? ' scale(-1 1)' : '') + ' translate(' + (-pivot[0]) + ' ' + (-pivot[1]) + ')');
  }

  function drawLimb(l, d) { l.ink.setAttribute('d', d); l.core.setAttribute('d', d); }

  // Draw the drawing's own pose, used for the static view and for reduced motion.
  Hero.prototype.rest = function () {
    var o = this.o, R = ART.rest;
    this.body.removeAttribute('transform');
    drawLimb(this.legFront, hose(ART.hipFront, R.ankleFront, o.legLength, -1));
    drawLimb(this.legBack, hose(ART.hipBack, R.ankleBack, o.legLength, -1));
    place(this.shoeFront, R.ankleFront, 0, ART.ankle);
    place(this.shoeBack, R.ankleBack, R.shoeBack, ART.ankle);
    drawLimb(this.armFront, hose(ART.shoulderFront, R.wristFront, o.armReach * 1.15, 1));
    drawLimb(this.armBack, hose(ART.shoulderBack, R.wristBack, o.armReach * 1.15, 1));
    place(this.fistFront, R.wristFront, angle(ART.shoulderFront, R.wristFront) - ART.fistAngle, ART.wrist);
    place(this.fistBack, R.wristBack, angle(ART.shoulderBack, R.wristBack) - (180 - ART.fistAngle), ART.wrist, true);
    this.eyes.r.g.removeAttribute('transform'); this.eyes.l.g.removeAttribute('transform');
  };

  // u is the stride phase, 0 to 1. time is seconds, for the blink.
  Hero.prototype.pose = function (u, time) {
    var o = this.o;
    // body: lowest at mid stance, twice a stride, leaning into the run
    var bob = o.bob * Math.cos(4 * Math.PI * (u - 0.25));
    var lean = o.lean + 1.5 * Math.sin(4 * Math.PI * u);
    var piv = ART.bodyPivot;
    this.body.setAttribute('transform', 'translate(0 ' + bob.toFixed(1) + ') rotate(' + lean.toFixed(2) +
      ' ' + piv[0] + ' ' + piv[1] + ')');
    function onBody(p) { var q = rotate(p, lean, piv); return [q[0], q[1] + bob]; }

    var self = this;
    [['Front', 0], ['Back', 0.5]].forEach(function (leg) {
      var hip = onBody(ART['hip' + leg[0]]);
      var f = footAt(u + leg[1]);
      var ankle = [ART['hip' + leg[0]][0] + 10 + f[0] * o.stride, GROUND + f[1] * o.lift];
      drawLimb(self['leg' + leg[0]], hose(hip, ankle, o.legLength, -1));
      place(self['shoe' + leg[0]], ankle, f[2], ART.ankle);
    });

    // arms pump against the legs: the near arm swings with the far leg. The near arm swings
    // between forward-up and down by its hip, never across the bib; the far arm swings from
    // back-out on its side to forward behind the body. Each entry: centre angle and swing, degrees.
    var c = Math.cos(2 * Math.PI * u);
    [['Front', 28, 58], ['Back', 96, -80]].forEach(function (arm) {
      var sh = onBody(ART['shoulder' + arm[0]]);
      var a = arm[1] + arm[2] * o.armSwing * c;
      var r = a * Math.PI / 180;
      var wrist = [sh[0] + Math.cos(r) * o.armReach, sh[1] + Math.sin(r) * o.armReach];
      drawLimb(self['arm' + arm[0]], hose(sh, wrist, o.armReach * 1.15, 1));
      if (arm[0] === 'Front') place(self.fistFront, wrist, a - ART.fistAngle, ART.wrist);
      else place(self.fistBack, wrist, a - (180 - ART.fistAngle), ART.wrist, true);
    });

    // eyes: a quick blink every few seconds and a small glance down the track
    var squash = 1;
    if (o.blink && time !== undefined) {
      var dt = time - this.nextBlink;
      if (dt > 0.16) this.nextBlink = time + 2 + Math.random() * 3;
      else if (dt > 0) squash = 0.1 + 0.9 * Math.abs(dt - 0.08) / 0.08;
    }
    var look = o.glance ? 4 * Math.sin(2 * Math.PI * u) : 0;
    ['r', 'l'].forEach(function (e) {
      var c = ART.eyes[e];
      self.eyes[e].g.setAttribute('transform', squash < 1
        ? 'translate(0 ' + c[1] + ') scale(1 ' + squash.toFixed(2) + ') translate(0 ' + (-c[1]) + ')' : '');
      self.eyes[e].pupil.setAttribute('transform', 'translate(' + (6 + look).toFixed(1) + ' 0)');
    });
  };

  // Idle: the victory pose, both fists up. Same idea as the runner: Recraft's parts,
  // rig strokes for the limbs. Its own 1024 space and anchors (hero-idle-parts.svg).
  var IDLE = {
    shoulderL: [412, 590], wristL: [252, 476],
    shoulderR: [706, 548], wristR: [802, 442],
    hipL: [458, 690], ankleL: [440, 795],
    hipR: [598, 688], ankleR: [600, 778],
    eyes: { r: [640, 364], l: [549, 381] },
    pivot: [528, 690]
  };
  var IDLE_DEFAULTS = {
    period: 1.3,      // seconds per bounce
    dip: 12,          // how far the body dips on each bounce
    pump: 14,         // how far the fists punch up
    legCore: 27, armCore: 22, line: 7.5,
    blink: true, glance: true
  };

  function Idle(svg, opts) {
    this.o = Object.assign({}, IDLE_DEFAULTS, opts || {});
    var self = this;
    svg.setAttribute('viewBox', svg.getAttribute('viewBox') || '100 110 860 860');
    var g = el('g', {}, svg);
    function limb(parent) {
      var lg = el('g', { fill: 'none', 'stroke-linecap': 'round' }, parent);
      return { ink: el('path', { stroke: INK }, lg), core: el('path', { stroke: WHITE }, lg) };
    }
    // back to front: right arm behind the glove, legs, shoes, body and eyes, left arm in
    // front of the glove, the band again so the left arm tucks under it, then the fists
    this.armR = limb(g);
    this.legL = limb(g); this.legR = limb(g);
    use('hi-shoe-l', g); use('hi-shoe-r', g);
    this.body = el('g', {}, g);
    use('hi-body', this.body);
    this.eyes = {};
    ['r', 'l'].forEach(function (e) {
      var eg = el('g', {}, self.body);
      use('hi-eye-' + e + '-white', eg);
      var clip = el('g', { 'clip-path': 'url(#hi-c-eye-' + e + ')' }, eg);
      var pupil = use('hi-pupil-' + e, clip);
      use('hi-eye-' + e + '-line', eg);
      self.eyes[e] = { g: eg, pupil: pupil };
    });
    this.armL = limb(g);
    this.band = use('hi-band', g);
    this.fistL = use('hi-fist-l', g);
    this.fistR = use('hi-fist-r', g);
    this.nextBlink = 1 + Math.random() * 2;
    this.applyWidths();
  }

  Idle.prototype.applyWidths = function () {
    var o = this.o;
    [[this.legL, o.legCore], [this.legR, o.legCore], [this.armL, o.armCore], [this.armR, o.armCore]]
      .forEach(function (p) {
        p[0].ink.setAttribute('stroke-width', p[1] + o.line * 2);
        p[0].core.setAttribute('stroke-width', p[1]);
      });
  };
  Idle.prototype.set = Hero.prototype.set;

  Idle.prototype.rest = function () {
    var pump = this.o.pump;
    this.o.pump = 0; this.pose(0); this.o.pump = pump;
  };

  Idle.prototype.pose = function (u, time) {
    var o = this.o, A = IDLE, self = this;
    // dip down and spring back up; fists punch up as the body rises
    var down = o.dip * (1 - Math.cos(2 * Math.PI * u)) / 2;
    var punch = o.pump * Math.sin(2 * Math.PI * u + 0.6);
    var body = 'translate(0 ' + down.toFixed(1) + ')';
    this.body.setAttribute('transform', body);
    this.band.setAttribute('transform', body);
    function onBody(p) { return [p[0], p[1] + down]; }

    var legLen = { L: Math.hypot(A.ankleL[0] - A.hipL[0], A.ankleL[1] - A.hipL[1]) * 1.03,
                   R: Math.hypot(A.ankleR[0] - A.hipR[0], A.ankleR[1] - A.hipR[1]) * 1.03 };
    // knees bow outward as the body dips
    drawLimb(this.legL, hose(onBody(A.hipL), A.ankleL, legLen.L, 1));
    drawLimb(this.legR, hose(onBody(A.hipR), A.ankleR, legLen.R, -1));

    [['L', -1, 1.08], ['R', 1, 1.06]].forEach(function (s) {
      var sh0 = A['shoulder' + s[0]], wr0 = A['wrist' + s[0]];
      var sh = onBody(sh0);
      var wr = [wr0[0], wr0[1] + down * 0.4 - punch];
      var len = Math.hypot(wr0[0] - sh0[0], wr0[1] - sh0[1]) * s[2];
      drawLimb(self['arm' + s[0]], hose(sh, wr, len, s[1]));
      var turn = angle(sh, wr) - angle(sh0, wr0);
      place(self['fist' + s[0]], wr, turn, wr0);
    });

    var squash = 1;
    if (o.blink && time !== undefined) {
      var dt = time - this.nextBlink;
      if (dt > 0.16) this.nextBlink = time + 2 + Math.random() * 3;
      else if (dt > 0) squash = 0.1 + 0.9 * Math.abs(dt - 0.08) / 0.08;
    }
    var look = o.glance && time !== undefined ? 5 * Math.sin(time * 0.9) : 0;
    ['r', 'l'].forEach(function (e) {
      var c = A.eyes[e];
      self.eyes[e].g.setAttribute('transform', squash < 1
        ? 'translate(0 ' + c[1] + ') scale(1 ' + squash.toFixed(2) + ') translate(0 ' + (-c[1]) + ')' : '');
      self.eyes[e].pupil.setAttribute('transform', 'translate(' + look.toFixed(1) + ' 0)');
    });
  };

  // Shared clock: one requestAnimationFrame loop drives every hero on the page.
  var heroes = [], running = true, last = null, started = false;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  function frame(now) {
    if (last === null) last = now;
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    heroes.forEach(function (h) {
      if (h.mode !== 'run') return;
      if (running) { h.t += dt; h.u = (h.u + dt / h.o.period) % 1; }
      h.pose(h.u, h.t);
    });
    requestAnimationFrame(frame);
  }

  window.HeroRig = {
    ready: Promise.all(['hero-parts.svg', 'hero-idle-parts.svg'].map(function (f) {
      return fetch(f).then(function (r) { return r.text(); });
    })).then(function (txts) {
      var holder = document.createElement('div');
      holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
      holder.innerHTML = txts.join('');
      document.body.prepend(holder);
    }),
    // mode: 'run' animates, 'rest' shows the drawing's pose, 'frame' one still phase
    // kind: 'run' (default) or 'idle'
    mount: function (svg, opts, mode, kind) {
      var h = kind === 'idle' ? new Idle(svg, opts) : new Hero(svg, opts);
      // 'frame' holds one phase of the cycle still
      h.mode = mode === 'frame' ? 'frame' : reduce.matches ? 'rest' : (mode || 'run');
      h.u = (opts && opts.phase) || 0; h.t = 0;
      if (h.mode === 'rest') h.rest(); else h.pose(h.u);
      heroes.push(h);
      if (!started) { started = true; requestAnimationFrame(frame); }
      return h;
    },
    pause: function (p) { running = !p; },
    reducedMotion: reduce.matches
  };
})();
