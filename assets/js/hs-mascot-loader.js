/*
  Mascot loader. Vanilla JS, safe on every page including the homepage.

  Markup:  <figure class="hs-mascot" data-mascot="magnifier" data-state="idle"></figure>
  Optional attributes:
    data-blob="sage"         overrides the mascot's default blob from manifest.json
    data-label="..."         alt text; without it the mascot is decorative
    data-pose="happy"        base pose instead of idle (raster only)
    data-hover-pose="happy"  pose shown on hover (default: first pose not starting with "idle")
    data-boil                alternate idle and idle-b at 4 fps; or data-boil="idle happy"
    data-eager               load the base pose immediately (above-the-fold mascots)

  Reads /assets/mascots/manifest.json, where every id has a default blob
  color and finished art also has a type. Raster ids load
  final/{id}-{pose}.webp with an @2x srcset; svg ids are inlined from
  final/{id}.svg so their named layers can animate. Ids without a type, or
  whose art fails, fall back to placeholder/{id}.svg.
  The blob and shadow are drawn here, never baked into the art.

  Pages can merge test manifests before this script loads:
    window.HSMascotsConfig = { extraManifests: ['/mascot-test/demo/manifest.json'] };
*/
(function () {
  var cfg = window.HSMascotsConfig || {};
  var BASE = '/assets/mascots/';
  var FINAL = BASE + 'final/';
  var LAYERS = ['body', 'eyes', 'pupils', 'mouth', 'arm-l', 'arm-r', 'leg-l', 'leg-r', 'marks'];
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var BLOB_PATH = 'M104 6C150 4 190 36 194 84C198 132 170 178 118 190C66 202 18 172 8 118C-2 64 36 10 104 6Z';
  var RASTER_1X = 600;

  // Lets the CSS hide reveal-state mascots only when JS is running to reveal them.
  document.documentElement.classList.add('hs-mascots-js');

  var manifestPromise = null;
  var svgCache = {};
  var instanceCount = 0;
  var revealObserver = null;

  function fetchJson(url) {
    return fetch(url)
      .then(function (r) { return r.ok ? r.json() : {}; })
      .catch(function () { return {}; });
  }

  function getManifest() {
    if (!manifestPromise) {
      var urls = [BASE + 'manifest.json'].concat(cfg.extraManifests || []);
      manifestPromise = Promise.all(urls.map(fetchJson)).then(function (list) {
        return Object.assign.apply(Object, [{}].concat(list));
      });
    }
    return manifestPromise;
  }

  // Caches the promise, not the result, so ten figures requesting the same
  // file at once still produce a single request. Raster images rely on the
  // browser's image cache for the same effect.
  function getSvgText(url) {
    if (!svgCache[url]) {
      svgCache[url] = fetch(url).then(function (r) {
        if (!r.ok) throw new Error(r.status + ' ' + url);
        return r.text();
      });
      svgCache[url].catch(function () { delete svgCache[url]; });
    }
    return svgCache[url];
  }

  function hash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function el(tag, cls) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    return node;
  }

  /* inline SVG path */

  function sanitize(svg) {
    svg.querySelectorAll('script, foreignObject').forEach(function (n) { n.remove(); });
    [svg].concat([].slice.call(svg.querySelectorAll('*'))).forEach(function (n) {
      [].slice.call(n.attributes).forEach(function (a) {
        if (/^on/i.test(a.name)) n.removeAttribute(a.name);
      });
    });
  }

  // Layer ids become data-layer so the same mascot can appear twice on a page
  // without duplicate ids. Any other id (gradients, clip paths) gets a
  // per-instance prefix and every reference to it is rewritten.
  function scopeIds(svg) {
    var prefix = 'hsm' + (++instanceCount) + '-';
    var map = {};
    svg.querySelectorAll('[id]').forEach(function (n) {
      var id = n.getAttribute('id');
      if (LAYERS.indexOf(id) !== -1) {
        n.setAttribute('data-layer', id);
        n.removeAttribute('id');
      } else {
        map[id] = prefix + id;
        n.setAttribute('id', prefix + id);
      }
    });
    if (!Object.keys(map).length) return;

    function rewriteUrls(value) {
      return value.replace(/url\(\s*['"]?#([^'")\s]+)['"]?\s*\)/g, function (m, id) {
        return map[id] ? 'url(#' + map[id] + ')' : m;
      });
    }
    svg.querySelectorAll('*').forEach(function (n) {
      [].slice.call(n.attributes).forEach(function (a) {
        var v = a.value;
        if (a.localName === 'href' && v.charAt(0) === '#' && map[v.slice(1)]) {
          n.setAttributeNS(a.namespaceURI, a.name, '#' + map[v.slice(1)]);
        } else if (v.indexOf('url(') !== -1) {
          n.setAttribute(a.name, rewriteUrls(v));
        }
      });
    });
  }

  function buildSvg(text, id, figure) {
    var doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    var svg = doc.documentElement;
    if (!svg || svg.namespaceURI !== SVG_NS || doc.querySelector('parsererror')) {
      throw new Error('Invalid SVG for mascot "' + id + '"');
    }
    if (svg.querySelector('style')) {
      console.warn('Mascot "' + id + '" has a <style> block. Its class rules will leak into the page. Export with presentation attributes (see docs/mascot-svg-contract.md).');
    }
    sanitize(svg);
    scopeIds(svg);
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('focusable', 'false');
    var label = figure.getAttribute('data-label');
    var title = svg.querySelector('title');
    if (title) title.remove();
    if (label) {
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', label);
    } else {
      svg.setAttribute('aria-hidden', 'true');
    }
    return document.importNode(svg, true);
  }

  function fillWithSvg(figure, art, url, id, source) {
    return getSvgText(url).then(function (text) {
      art.textContent = '';
      art.appendChild(buildSvg(text, id, figure));
      figure.setAttribute('data-type', 'svg');
      figure.setAttribute('data-source', source);
      figure.removeAttribute('data-hover-ready');
      figure.removeAttribute('data-boil-ready');
    });
  }

  /* raster path */

  function pickPoses(figure, poses) {
    var has = function (p) { return poses.indexOf(p) !== -1; };
    var base = figure.getAttribute('data-pose') || 'idle';
    if (!has(base)) base = poses[0];

    var hover = figure.getAttribute('data-hover-pose');
    if (!hover || !has(hover)) {
      hover = poses.filter(function (p) { return p !== base && p.indexOf('idle') !== 0; })[0] || null;
    }

    var boil = null;
    if (figure.hasAttribute('data-boil')) {
      var wanted = (figure.getAttribute('data-boil') || '').trim().split(/\s+/).filter(Boolean);
      if (wanted.length !== 2) wanted = [base, base + '-b'];
      if (has(wanted[0]) && has(wanted[1]) && wanted[0] !== wanted[1]) {
        boil = wanted;
      } else {
        console.warn('Mascot "' + figure.getAttribute('data-mascot') + '" has data-boil but is missing pose "' + (has(wanted[0]) ? wanted[1] : wanted[0]) + '".');
      }
    }
    return { base: base, hover: hover, boil: boil };
  }

  function fillWithRaster(figure, art, id, entry) {
    var dir = entry.path || FINAL;
    var poses = entry.poses && entry.poses.length ? entry.poses : ['idle'];
    var pick = pickPoses(figure, poses);
    var ratio = Number(entry.ratio) || 1;
    var eager = figure.hasAttribute('data-eager');
    var label = figure.getAttribute('data-label') || '';

    // Only the poses this figure can show are requested.
    var needed = [pick.base];
    if (pick.hover) needed.push(pick.hover);
    if (pick.boil) needed = needed.concat(pick.boil);
    needed = needed.filter(function (p, i) { return needed.indexOf(p) === i; });

    art.textContent = '';
    var imgs = {};
    needed.forEach(function (pose) {
      var img = el('img', 'hs-mascot__pose');
      var src = dir + id + '-' + pose + '.webp';
      img.src = src;
      img.srcset = src + ' 1x, ' + dir + id + '-' + pose + '@2x.webp 2x';
      img.width = RASTER_1X;
      img.height = Math.round(RASTER_1X / ratio);
      img.decoding = 'async';
      img.loading = eager && pose === pick.base ? 'eager' : 'lazy';
      if (eager && pose === pick.base) img.setAttribute('fetchpriority', 'high');
      img.alt = pose === pick.base ? label : '';
      img.draggable = false;
      img.setAttribute('data-pose', pose);
      if (pose === pick.base) img.classList.add('is-base');
      if (pose === pick.hover) img.classList.add('is-hover');
      if (pick.boil && pose === pick.boil[0]) img.classList.add('is-boil-a');
      if (pick.boil && pose === pick.boil[1]) img.classList.add('is-boil-b');
      imgs[pose] = img;
      art.appendChild(img);
    });
    if (!label) art.setAttribute('aria-hidden', 'true');

    figure.setAttribute('data-type', 'raster');
    figure.setAttribute('data-source', 'final');
    if (pick.hover) figure.setAttribute('data-hover-ready', '');
    if (pick.boil) figure.setAttribute('data-boil-ready', '');

    // A missing base pose means the mascot is not really ready: use the
    // placeholder. A missing extra pose just disables the feature it served.
    Object.keys(imgs).forEach(function (pose) {
      imgs[pose].addEventListener('error', function () {
        if (pose === pick.base) {
          console.warn('Mascot "' + id + '" base pose "' + pose + '" failed to load. Using placeholder.');
          art.removeAttribute('aria-hidden');
          fillWithSvg(figure, art, BASE + 'placeholder/' + id + '.svg', id, 'placeholder')
            .then(function () { announce(figure, id); })
            .catch(function (err) { figure.setAttribute('data-loaded', 'error'); console.error(err); });
          return;
        }
        console.warn('Mascot "' + id + '" pose "' + pose + '" failed to load.');
        imgs[pose].remove();
        if (pose === pick.hover) figure.removeAttribute('data-hover-ready');
        if (pick.boil && pick.boil.indexOf(pose) !== -1) figure.removeAttribute('data-boil-ready');
      });
    });
  }

  /* shared */

  function buildShell(figure, id) {
    figure.textContent = '';
    var blob = el('span', 'hs-mascot__blob');
    blob.setAttribute('aria-hidden', 'true');
    blob.innerHTML = '<svg viewBox="0 0 200 200" preserveAspectRatio="none" focusable="false"><path d="' + BLOB_PATH + '"/></svg>';
    var shadow = el('span', 'hs-mascot__shadow');
    shadow.setAttribute('aria-hidden', 'true');
    var art = el('span', 'hs-mascot__art');
    figure.appendChild(blob);
    figure.appendChild(shadow);
    figure.appendChild(art);
    // Small per-id tilt so neighbouring blobs do not look stamped.
    figure.style.setProperty('--hs-blob-rotate', ((hash(id) % 41) - 20) + 'deg');
    return art;
  }

  function observeReveal(figure) {
    if (!('IntersectionObserver' in window)) {
      figure.classList.add('is-revealed');
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('is-revealed');
            revealObserver.unobserve(e.target);
          }
        });
      }, { threshold: 0.3 });
    }
    revealObserver.observe(figure);
  }

  function announce(figure, id) {
    figure.setAttribute('data-loaded', 'true');
    figure.dispatchEvent(new CustomEvent('hs-mascot:loaded', {
      bubbles: true,
      detail: { id: id, type: figure.getAttribute('data-type'), source: figure.getAttribute('data-source') }
    }));
  }

  function loadOne(figure) {
    if (figure._hsLoad) return figure._hsLoad;
    var id = figure.getAttribute('data-mascot');
    if (!id) return Promise.resolve(figure);
    figure.setAttribute('data-loaded', 'pending');

    // Offsets blinks so a row of mascots does not blink in unison.
    figure.style.setProperty('--hs-blink-delay', (Math.random() * -4).toFixed(2) + 's');

    var placeholderUrl = BASE + 'placeholder/' + id + '.svg';
    figure._hsLoad = getManifest().then(function (manifest) {
      var entry = manifest[id];
      var art = buildShell(figure, id);
      // A data-blob written on the figure wins over the manifest default.
      if (!figure.hasAttribute('data-blob')) {
        figure.setAttribute('data-blob', (entry && entry.blob) || 'tint');
      }
      if (entry && Number(entry.ratio)) {
        figure.style.setProperty('--hs-mascot-ratio', String(Number(entry.ratio)));
      }

      if (entry && entry.type === 'raster') {
        fillWithRaster(figure, art, id, entry);
        return;
      }
      if (entry && entry.type === 'svg') {
        return fillWithSvg(figure, art, (entry.path || FINAL) + id + '.svg', id, 'final').catch(function (err) {
          console.warn('Mascot "' + id + '" svg failed to load. Using placeholder.', err);
          return fillWithSvg(figure, art, placeholderUrl, id, 'placeholder');
        });
      }
      return fillWithSvg(figure, art, placeholderUrl, id, 'placeholder');
    }).then(function () {
      if (figure.getAttribute('data-state') === 'reveal') observeReveal(figure);
      announce(figure, id);
      return figure;
    }).catch(function (err) {
      figure.setAttribute('data-loaded', 'error');
      console.error(err);
      return figure;
    });
    return figure._hsLoad;
  }

  function load(root) {
    var figures = (root || document).querySelectorAll('.hs-mascot[data-mascot]');
    return Promise.all([].map.call(figures, loadOne));
  }

  window.HSMascots = { load: load, loadOne: loadOne, observeReveal: observeReveal };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { load(); });
  } else {
    load();
  }
})();
