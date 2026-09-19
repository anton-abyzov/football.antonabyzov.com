/* football.antonabyzov.com, site.js
   No dependencies. Everything degrades to a working page when JS is off.

   1. click-to-load YouTube facade (youtube-nocookie, honours ?start=)
   2. scroll reveals and stat counters, armed only after a real gesture, so a
      headless capture or a print never shows a wrong intermediate number
   3. mobile nav toggle
   4. copy-to-clipboard for the Baller League application answers
*/
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ── 1. YouTube facade ──────────────────────────────────────────────── */
  function mountPlayer(root, start) {
    var id = root.getAttribute('data-video');
    if (!id) return;
    var frame = root.querySelector('.player__frame');
    var src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) +
              '?autoplay=1&rel=0&modestbranding=1' +
              (start ? '&start=' + encodeURIComponent(start) : '');
    var iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = root.getAttribute('data-title') || 'Anton Abyzov match footage';
    iframe.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    frame.innerHTML = '';
    frame.appendChild(iframe);
    iframe.focus();
    return frame;
  }

  [].forEach.call(document.querySelectorAll('.player'), function (root) {
    var btn = root.querySelector('.player__play');
    if (btn) {
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        mountPlayer(root, root.getAttribute('data-start'));
      });
    }
    // chapter buttons scoped to their own player, via data-player="<id>"
    var scope = root.id ? document.querySelectorAll('[data-player="' + root.id + '"] [data-t]') : [];
    [].forEach.call(scope, function (a) {
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        var frame = mountPlayer(root, a.getAttribute('data-t'));
        if (frame) frame.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      });
    });
  });

  /* ── 2. reveals + counters, armed on the first real gesture ─────────── */
  var groups = [].slice.call(document.querySelectorAll('.reveal'));
  var nums = [].slice.call(document.querySelectorAll('[data-count]'));

  function runCount(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 750, t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var armed = false;
  function arm() {
    if (armed || reduced || !hasIO) return;
    armed = true;
    var fold = window.innerHeight * 0.92;

    /* .reveal groups are animated by CSS scroll-driven timelines (site.css §15);
       JS no longer toggles their visibility, so a capture never loses content. */

    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCount(e.target); countIO.unobserve(e.target); }
      });
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });

    nums.forEach(function (n) {
      if (n.getBoundingClientRect().top > fold) countIO.observe(n);
    });
  }

  ['scroll', 'wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (evt) {
    window.addEventListener(evt, arm, { once: true, passive: true });
  });

  /* ── 3. mobile nav ──────────────────────────────────────────────────── */
  var toggle = document.querySelector('.bug__toggle');
  var panel = document.getElementById('nav-panel');
  if (toggle && panel) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
    });
    panel.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        toggle.setAttribute('aria-expanded', 'false');
        panel.hidden = true;
      }
    });
  }

  /* ── 4. copy to clipboard (Baller League application answers) ───────── */
  [].forEach.call(document.querySelectorAll('[data-copy]'), function (btn) {
    var label = btn.textContent;
    btn.addEventListener('click', function () {
      var src = document.getElementById(btn.getAttribute('data-copy'));
      if (!src) return;
      var text = (src.innerText || src.textContent || '').trim();
      var done = function (ok) {
        btn.textContent = ok ? 'Copied' : 'Press Ctrl+C';
        setTimeout(function () { btn.textContent = label; }, 2200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      } else {
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:absolute;left:-9999px';
        document.body.appendChild(ta); ta.select();
        try { done(document.execCommand('copy')); } catch (err) { done(false); }
        document.body.removeChild(ta);
      }
    });
  });
})();
