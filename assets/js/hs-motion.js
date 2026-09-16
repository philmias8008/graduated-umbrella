/*
 * Shared page motion for Handstart Digital.
 * Lenis smooth scroll plus a generic top level section reveal, both gated
 * behind prefers-reduced-motion. Self initializes once this file loads, and
 * expects lenis.min.js to already be loaded when Lenis smoothing is wanted.
 * Used by more than one page, so keep this file free of page specific markup
 * assumptions beyond plain section and footer elements.
 */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  if (typeof Lenis !== 'undefined') {
    var LENIS_LERP = 0.09; // tune by eye: lower is smoother and slower, higher is snappier
    var lenis = new Lenis({ lerp: LENIS_LERP });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  document.documentElement.classList.add('anim-ready');

  var STAGGER_MS = 60;

  // Top level sections are the outermost section or footer elements, found by
  // ancestry rather than by counting direct children of body, since some
  // pages wrap their whole layout in one extra div and some do not.
  var all = Array.prototype.slice.call(document.querySelectorAll('section, footer'));
  var topLevel = all.filter(function (el) {
    return !el.parentElement.closest('section, footer');
  });

  // The first top level block is already in view on load and stays static.
  // A section that already opts into its own reveal behavior via data-reveal
  // keeps that bespoke animation instead of also getting this generic one.
  var revealSections = topLevel.slice(1).filter(function (el) {
    return !el.hasAttribute('data-reveal');
  });

  var revealTargets = revealSections.map(function (section) {
    var clip = section.getAttribute('data-anim') === 'clip';
    var kids = Array.prototype.slice.call(section.children);
    var targets = kids.length > 1 ? kids : [section];
    targets.forEach(function (el, i) {
      el.setAttribute('data-reveal-target', '');
      if (clip) el.setAttribute('data-reveal-clip', '');
      el.style.transitionDelay = (i * STAGGER_MS) + 'ms';
    });
    return targets;
  });

  var io = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var idx = revealSections.indexOf(entry.target);
      if (idx === -1) return;
      revealTargets[idx].forEach(function (el) { el.classList.add('hs-revealed'); });
      obs.unobserve(entry.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px -20% 0px' });
  revealSections.forEach(function (section) { io.observe(section); });
})();
