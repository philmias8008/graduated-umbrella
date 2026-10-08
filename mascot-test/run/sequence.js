/* Landing sequence demo: idle bounce, squash and pop, run with a speed ramp, and a wipe
   that follows the hero off screen. Needs rig.js. Vanilla JS, homepage-safe. */
(function () {
  'use strict';

  var VIEW_W = 900;           // both rigs use a 900-wide viewBox, so art units map the same
  var SQUASH = 0.22;          // seconds crouching before the pop
  var PUFF = 0.45;            // seconds the dust puff lasts
  // Speed: a short hold at the first stride, then exponential growth to a full sprint, then he
  // keeps accelerating (legs cycling faster to match) until he's off screen.
  var HOLD = 0.2;             // seconds at the first stride
  var RAMP = 0.9;             // seconds of exponential growth to the full sprint
  var TAU = 0.8;              // growth rate of that ramp, smaller is more sudden
  var BOOST = 0.8;            // after the ramp, speed doubles roughly every 0.7 x this
  var MIN_PERIOD = 0.16;
  var SLOW = { period: 1.0, stride: 135, lift: 100, bob: 11, lean: 5 };
  var FAST = { period: 0.3, stride: 230, lift: 190, bob: 22, lean: 16 };
  var NS = 'http://www.w3.org/2000/svg';

  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOut(t) { return 1 - (1 - t) * (1 - t); }

  function Sequence(stage) {
    this.stage = stage;
    this.next = stage.querySelector('[data-seq-next]');
    this.current = stage.querySelector('[data-seq-current]');
    this.box = stage.querySelector('[data-seq-hero]');
    this.idleSvg = this.box.querySelector('[data-seq-idle]');
    this.runSvg = this.box.querySelector('[data-seq-run]');
    this.idle = HeroRig.mount(this.idleSvg, {}, 'frame', 'idle');
    this.runner = HeroRig.mount(this.runSvg, {}, 'frame');
    this.puff = this.makePuff();
    this.reset();
    var self = this;
    requestAnimationFrame(function loop(now) { self.tick(now); requestAnimationFrame(loop); });
  }

  // Dust puff: a ring of cloud circles around the feet, in the runner's art space
  Sequence.prototype.makePuff = function () {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '60 40 900 920');
    svg.setAttribute('class', 'seq-puff');
    svg.setAttribute('aria-hidden', 'true');
    var puffs = [];
    [[330, 880, 52], [420, 900, 64], [520, 905, 72], [620, 900, 62], [710, 880, 50], [470, 840, 44], [600, 845, 46]]
      .forEach(function (c) {
        var n = document.createElementNS(NS, 'circle');
        n.setAttribute('cx', c[0]); n.setAttribute('cy', c[1]); n.setAttribute('r', c[2]);
        n.setAttribute('fill', '#F7F4EE'); n.setAttribute('stroke', '#1D3F66'); n.setAttribute('stroke-width', 8);
        svg.appendChild(n); puffs.push({ n: n, r: c[2], cx: c[0], cy: c[1] });
      });
    this.box.appendChild(svg);
    this.puffs = puffs;
    return svg;
  };

  Sequence.prototype.reset = function () {
    this.phase = 'idle';
    this.t = 0; this.u = 0; this.ru = 0.1; this.x = 0; this.edge = 0;
    this.idleSvg.style.visibility = ''; this.idleSvg.style.transform = '';
    this.runSvg.style.visibility = 'hidden'; this.runSvg.style.transform = '';
    this.puff.style.visibility = 'hidden';
    this.box.style.transform = ''; this.box.style.opacity = '';
    this.current.style.clipPath = ''; this.current.style.opacity = ''; this.current.style.transition = '';
    this.stage.classList.remove('is-done');
  };

  Sequence.prototype.start = function () {
    if (this.phase !== 'idle') return;
    if (HeroRig.reducedMotion) {
      // no run for reduced motion: a plain crossfade to the next section
      this.current.style.transition = 'opacity 0.4s';
      this.current.style.opacity = '0';
      this.box.style.opacity = '0';
      this.stage.classList.add('is-done');
      this.phase = 'done';
      return;
    }
    this.phase = 'squash'; this.pt = 0;
  };

  Sequence.prototype.tick = function (now) {
    if (this.last === undefined) this.last = now;
    var dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    this.t += dt;
    var k = this.box.getBoundingClientRect().width / VIEW_W;   // px per art unit

    if (HeroRig.reducedMotion) {
      if (!this.still) { this.idle.rest(); this.still = true; }
      return;
    }
    if (this.phase === 'idle' || this.phase === 'squash') {
      this.u = (this.u + dt / this.idle.o.period) % 1;
      this.idle.pose(this.u, this.t);
    }
    if (this.phase === 'squash') {
      this.pt += dt;
      var s = easeOut(Math.min(1, this.pt / SQUASH));
      this.idleSvg.style.transform = 'scale(' + (1 + 0.1 * s) + ',' + (1 - 0.18 * s) + ')';
      if (this.pt >= SQUASH) {
        this.phase = 'run'; this.pt = 0;
        this.idleSvg.style.visibility = 'hidden';
        this.runSvg.style.visibility = '';
        this.puff.style.visibility = '';
      }
    }
    if (this.phase === 'run') {
      this.pt += dt;
      // stretch out of the crouch
      var pop = Math.min(1, this.pt / 0.15);
      this.runSvg.style.transform = 'scale(' + lerp(0.92, 1, pop) + ',' + lerp(1.12, 1, pop) + ')';
      // dust puff grows and fades where he stood
      var pp = Math.min(1, this.pt / PUFF);
      this.puff.style.opacity = 1 - pp;
      this.puff.style.transform = 'translateX(' + (-this.x) + 'px)';
      this.puffs.forEach(function (c, i) {
        var g = 0.4 + 0.9 * easeOut(pp);
        c.n.setAttribute('r', (c.r * g).toFixed(1));
        c.n.setAttribute('cx', (c.cx + (c.cx - 520) * 0.5 * pp).toFixed(1));
      });
      if (pp >= 1) this.puff.style.visibility = 'hidden';
      // speed: every setting moves from the first stride to a full sprint together
      var stageW = this.stage.getBoundingClientRect().width;
      var boxLeft = this.box.offsetLeft;
      var tt = Math.max(0, this.pt - HOLD);
      var r = Math.min(1, (Math.exp(tt / TAU) - 1) / (Math.exp(RAMP / TAU) - 1));
      var o = {};
      for (var key in SLOW) o[key] = lerp(SLOW[key], FAST[key], r);
      if (tt > RAMP) o.period = Math.max(MIN_PERIOD, o.period / Math.exp((tt - RAMP) / BOOST));
      this.runner.set(o);
      this.ru = (this.ru + dt / o.period) % 1;
      this.runner.pose(this.ru, this.t);
      // ground speed matches the stride so the planted foot doesn't slide
      this.x += 3.8 * o.stride * k / o.period * dt;
      this.box.style.transform = 'translateX(' + this.x.toFixed(1) + 'px)';
      // wipe edge follows his back, catching up from the left in the first half second
      var back = boxLeft + this.x + this.box.offsetWidth * 0.3;
      this.edge = back * Math.min(1, this.pt / 0.5);
      this.current.style.clipPath = 'inset(0 0 0 ' + Math.min(stageW, Math.max(0, this.edge)).toFixed(1) + 'px)';
      // finished only once all of him is past the right edge, not just the wipe
      if (boxLeft + this.x > stageW + 4) {
        this.current.style.clipPath = 'inset(0 0 0 100%)';
        this.runSvg.style.visibility = 'hidden';
        this.phase = 'done'; this.stage.classList.add('is-done');
      }
    }
  };

  // Jump ahead by stepping the clock, for checking a moment of the run (?seqt=seconds on the test page)
  Sequence.prototype.advance = function (seconds) {
    var now = this.last || 0;
    for (var t = 0; t < seconds; t += 1 / 60) { now += 1000 / 60; this.tick(now); }
  };

  window.HeroSequence = Sequence;
})();
