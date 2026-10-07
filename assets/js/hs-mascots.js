/*
  Optional GSAP upgrade for mascots. Load after gsap.min.js (and ScrollTrigger
  if the page has it). Never load on the homepage.

  Takes over reveal and hover with richer timelines. CSS keeps running the idle
  bob, blink, boil and the hover pose swap. Does nothing when GSAP is missing or
  reduced motion is on, so the CSS states in hs-mascots.css remain the baseline.
*/
(function () {
  if (!window.gsap) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var gsap = window.gsap;
  var canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;

  function part(fig, name) {
    return fig.querySelector('.hs-mascot__' + name);
  }

  function layer(fig, name) {
    return fig.querySelector('[data-layer="' + name + '"]');
  }

  function buildReveal(fig) {
    var tl = gsap.timeline({ paused: true });
    var blob = part(fig, 'blob');
    var shadow = part(fig, 'shadow');
    var art = part(fig, 'art');
    tl.set(fig, { autoAlpha: 1 });
    if (blob) tl.from(blob, { scale: .4, opacity: 0, duration: .55, ease: 'back.out(2)' }, 0);
    if (shadow) tl.from(shadow, { scaleX: 0, opacity: 0, duration: .45, ease: 'power2.out' }, .15);
    if (art) tl.from(art, { yPercent: 14, scaleX: .7, scaleY: .5, transformOrigin: '50% 84%', duration: .9, ease: 'elastic.out(1, .45)' }, .1);

    // Extra beats for svg mascots that have named layers.
    var face = ['eyes', 'pupils', 'mouth'].map(function (n) { return layer(fig, n); }).filter(Boolean);
    var armL = layer(fig, 'arm-l');
    var armR = layer(fig, 'arm-r');
    if (face.length) tl.from(face, { scale: 0, transformOrigin: '50% 50%', duration: .4, stagger: .06, ease: 'back.out(3)' }, .35);
    if (armL) tl.from(armL, { rotation: -70, transformOrigin: '100% 0%', duration: .6, ease: 'back.out(2.5)' }, .4);
    if (armR) tl.from(armR, { rotation: 70, transformOrigin: '0% 0%', duration: .6, ease: 'back.out(2.5)' }, .45);
    return tl;
  }

  function wireReveal(fig) {
    gsap.set(fig, { autoAlpha: 0 });
    var tl = buildReveal(fig);
    function play() {
      fig.classList.add('is-revealed');
      tl.play(0);
    }
    fig._hsReveal = tl;
    if (window.ScrollTrigger) {
      window.ScrollTrigger.create({ trigger: fig, start: 'top 85%', once: true, onEnter: play });
    } else if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { io.disconnect(); play(); }
      }, { threshold: 0.3 });
      io.observe(fig);
    } else {
      play();
    }
  }

  function wireHover(fig) {
    var art = part(fig, 'art');
    var armR = layer(fig, 'arm-r');
    var pupils = layer(fig, 'pupils');

    var squash = gsap.timeline({ paused: true })
      .to(art, { scaleX: 1.07, scaleY: .92, transformOrigin: '50% 84%', duration: .12, ease: 'power2.out' })
      .to(art, { scaleX: 1, scaleY: 1, duration: .6, ease: 'elastic.out(1.1, .35)' });

    var wave = armR
      ? gsap.to(armR, { rotation: -30, transformOrigin: '0% 0%', duration: .18, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true })
      : null;

    // Svg mascots only: pupils glance toward the cursor while it is over the mascot.
    var lookX = pupils ? gsap.quickTo(pupils, 'x', { duration: .3, ease: 'power3.out' }) : null;
    var lookY = pupils ? gsap.quickTo(pupils, 'y', { duration: .3, ease: 'power3.out' }) : null;

    fig.addEventListener('mouseenter', function () {
      squash.play(0);
      if (wave) wave.play();
    });
    fig.addEventListener('mousemove', function (e) {
      if (!lookX) return;
      var r = fig.getBoundingClientRect();
      lookX(((e.clientX - r.left) / r.width - .5) * 6);
      lookY(((e.clientY - r.top) / r.height - .5) * 5);
    });
    fig.addEventListener('mouseleave', function () {
      if (wave) {
        wave.pause();
        gsap.to(armR, { rotation: 0, duration: .3, ease: 'power2.out' });
      }
      if (lookX) { lookX(0); lookY(0); }
    });
  }

  function enhance(fig) {
    if (!fig || fig._hsEnhanced || fig.getAttribute('data-state') === 'static') return;
    if (!part(fig, 'art')) return;
    fig._hsEnhanced = true;
    fig.classList.add('hs-mascot--gsap');
    if (fig.getAttribute('data-state') === 'reveal') wireReveal(fig);
    if (canHover) wireHover(fig);
  }

  document.addEventListener('hs-mascot:loaded', function (e) { enhance(e.target); });
  document.querySelectorAll('.hs-mascot[data-loaded="true"]').forEach(enhance);

  window.HSMascotsGsap = { enhance: enhance };
})();
