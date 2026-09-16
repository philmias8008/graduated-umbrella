/*
 * Shared page motion for Handstart Digital.
 * GSAP drives Lenis smooth scroll plus a data-anim reveal system, both
 * gated behind prefers-reduced-motion. Self initializes once this file
 * loads, and expects gsap.min.js, ScrollTrigger.min.js and SplitText.min.js
 * to already be loaded, plus lenis.min.js when Lenis smoothing is wanted.
 * Used by more than one page, so keep this file free of page specific
 * markup assumptions beyond plain section and footer elements.
 */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  gsap.registerPlugin(ScrollTrigger, SplitText);

  if (typeof Lenis !== 'undefined') {
    var LENIS_LERP = 0.09; // tune by eye: lower is smoother and slower, higher is snappier
    var lenis = new Lenis({ lerp: LENIS_LERP, smoothWheel: true, smoothTouch: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  document.documentElement.classList.add('anim-ready');

  var STAGGER = 0.06; // seconds between staggered targets in one section, matches the prior 60ms
  var SLIDE_DIST = 24; // px, matches the site's existing rise-and-fade distance
  var DURATION = 0.7;
  var EASE = 'power2.out';

  function delayFor(el) {
    var d = parseFloat(el.getAttribute('data-delay'));
    return isNaN(d) ? 0 : d;
  }

  // Top level sections are the outermost section or footer elements, found by
  // ancestry rather than by counting direct children of body, since some
  // pages wrap their whole layout in one extra div and some do not.
  var all = Array.prototype.slice.call(document.querySelectorAll('section, footer'));
  var topLevel = all.filter(function (el) {
    return !el.parentElement.closest('section, footer');
  });

  // The first top level block is already in view on load and stays static.
  var firstSection = topLevel[0];

  // A section that already opts into its own reveal behavior via data-reveal
  // keeps that bespoke animation instead of also getting this generic one.
  var revealSections = topLevel.slice(1).filter(function (el) {
    return !el.hasAttribute('data-reveal');
  });

  revealSections.forEach(function (section) {
    var kids = Array.prototype.slice.call(section.children);
    var targets = kids.length > 1 ? kids : [section];
    var anim = section.getAttribute('data-anim');
    var isClip = anim === 'clip';
    var dir = anim === 'slide-down' ? -1 : 1;

    if (isClip) {
      gsap.set(targets, { clipPath: 'inset(0% 0% 100% 0%)' });
    } else {
      gsap.set(targets, { y: dir * SLIDE_DIST, opacity: 0 });
    }

    ScrollTrigger.create({
      trigger: section,
      start: 'top 80%',
      once: true,
      onEnter: function () {
        gsap.to(targets, isClip
          ? { clipPath: 'inset(0% 0% 0% 0%)', duration: DURATION, ease: EASE, stagger: STAGGER, delay: delayFor(section) }
          : { y: 0, opacity: 1, duration: DURATION, ease: EASE, stagger: STAGGER, delay: delayFor(section) });
      }
    });
  });

  // Clip containers: an element carrying data-clip-anim-container staggers
  // its own data-anim="clip" children by 0.1s each, independent of the
  // section-level reveal above. A page using this on a top-level section
  // should also mark that section data-reveal so it opts out of the
  // section-level pass and isn't animated twice.
  var clipContainers = Array.prototype.slice.call(document.querySelectorAll('[data-clip-anim-container]'));
  clipContainers.forEach(function (container) {
    var clipEls = Array.prototype.slice.call(container.querySelectorAll('[data-anim="clip"]'));
    if (!clipEls.length) return;

    gsap.set(clipEls, { clipPath: 'inset(0% 0% 100% 0%)' });

    ScrollTrigger.create({
      trigger: container,
      start: 'top 80%',
      once: true,
      onEnter: function () {
        gsap.to(clipEls, {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: DURATION,
          ease: EASE,
          stagger: 0.1,
          delay: delayFor(container)
        });
      }
    });
  });

  // Split text reveals: an element carrying data-anim="split-text" gets its
  // own independent trigger, layered on top of whatever its ancestor
  // section is doing above. The element stays hidden from init until its
  // own trigger fires, so there is never a flash of the un-split text.
  var splitTargets = Array.prototype.slice.call(document.querySelectorAll('[data-anim="split-text"]'));
  splitTargets.forEach(function (el) {
    var ownerSection = el.closest('section, footer');
    if (ownerSection === firstSection || (ownerSection && ownerSection.hasAttribute('data-reveal'))) return;

    gsap.set(el, { autoAlpha: 0 });
    var split = SplitText.create(el, { type: 'lines', mask: 'lines' });
    gsap.set(split.lines, { yPercent: 130 });

    ScrollTrigger.create({
      trigger: el,
      start: 'top 80%',
      once: true,
      onEnter: function () {
        gsap.set(el, { autoAlpha: 1 });
        gsap.to(split.lines, {
          yPercent: 0,
          duration: DURATION,
          ease: EASE,
          stagger: 0.15,
          delay: delayFor(el)
        });
      }
    });
  });
})();
