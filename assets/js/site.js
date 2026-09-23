/* football.antonabyzov.com, site.js
   No dependencies. Everything degrades to a working page when JS is off.

   1. click-to-load YouTube facade (youtube-nocookie, honours ?start=)
   2. stat counters driven by SCROLL POSITION, not by a timer, and armed only
      after a real gesture, so a headless capture or a print never shows a
      wrong intermediate number. Reveals are CSS (site.css section 15 and 17).
   3. mobile nav toggle
   4. self-hosted clips: pause a <video> once it leaves the viewport
   5. copy-to-clipboard for the Baller League application answers
   6. language switcher: close on an outside click or Escape, keep the #anchor
*/
(function () {
  'use strict';

  /* the few strings this file writes itself, per <html lang> */
  var UI = {
    en: { copied: 'Copied', pressCopy: 'Press Ctrl+C', footage: 'Anton Abyzov match footage' },
    ru: { copied: 'Скопировано', pressCopy: 'Нажмите Ctrl+C', footage: 'Видео матча Антона Абызова' },
    es: { copied: 'Copiado', pressCopy: 'Pulsa Ctrl+C', footage: 'Vídeo del partido de Anton Abyzov' },
    pt: { copied: 'Copiado', pressCopy: 'Pressione Ctrl+C', footage: 'Vídeo da partida de Anton Abyzov' },
    de: { copied: 'Kopiert', pressCopy: 'Strg+C drücken', footage: 'Spielszenen von Anton Abyzov' },
    fr: { copied: 'Copié', pressCopy: 'Appuyez sur Ctrl+C', footage: 'Images de match d\u2019Anton Abyzov' }
  };
  var LANG = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase();
  function t(key) { return (UI[LANG] || UI.en)[key] || UI.en[key]; }

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
    iframe.title = root.getAttribute('data-title') || t('footage');
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

  /* ── 2. counters, tied to scroll position ───────────────────────────── */
  /* Every tile is server-rendered with its final number already in the text,
     so a no-JS render, a print and a capture are correct with nothing running.
     Once the visitor has actually gestured, each tile's number is redrawn from
     how far that tile has travelled up the viewport, over 0.8 of a screen of
     scroll, which is slow enough to read. A tile that has been scrolled past
     reads 1 and therefore shows its final value. */
  var nums = [].slice.call(document.querySelectorAll('[data-count]'));
  var tracked = [];

  function progress(el) {
    var r = el.getBoundingClientRect();
    var span = window.innerHeight * 0.8;           /* ~80vh, the "slow" rule */
    var travelled = window.innerHeight * 0.96 - r.top;
    return travelled / span;
  }

  function paint(item) {
    var p = progress(item.el);
    if (p <= 0) return;                            /* not entered: leave it */
    if (p >= 1) {
      item.el.textContent = item.display;
      item.done = true;
      return;
    }
    var eased = 1 - Math.pow(1 - p, 3);
    item.el.textContent = String(Math.round(item.target * eased));
  }

  /* One frame per burst of scroll events, with a guaranteed TRAILING pass: a
     scroll event that lands while a frame is already queued would otherwise be
     dropped, and if it was the last one of a smooth scroll the tiles would be
     left frozen one frame short of their real value. */
  var queued = false, missed = false;
  function onScroll() {
    if (queued) { missed = true; return; }
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      var left = false;
      for (var i = 0; i < tracked.length; i++) {
        if (tracked[i].done) continue;
        paint(tracked[i]);
        if (!tracked[i].done) left = true;
      }
      if (missed) { missed = false; onScroll(); return; }
      if (!left) window.removeEventListener('scroll', onScroll);
    });
  }

  var armed = false;
  function arm() {
    if (armed || reduced) return;
    armed = true;
    var fold = window.innerHeight * 0.92;
    nums.forEach(function (n) {
      if (n.getBoundingClientRect().top <= fold) return;   /* already read */
      tracked.push({
        el: n,
        target: parseFloat(n.getAttribute('data-count')) || 0,
        display: n.textContent,
        done: false
      });
    });
    if (!tracked.length) return;
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
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

  /* ── 4. self-hosted clips: pause one that leaves the viewport ────────── */
  /* The clips carry no `muted` attribute and no autoplay: the visitor presses
     play. This only stops a clip that is already playing from running on in a
     rail the visitor has scrolled away from, and it never touches a paused or
     finished one, so nothing is hidden and nothing starts by itself. */
  var clips = [].slice.call(document.querySelectorAll('video[data-clip]'));
  if (clips.length && hasIO) {
    var clipIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting && !e.target.paused) e.target.pause();
      });
    }, { threshold: 0.2 });
    clips.forEach(function (v) { clipIO.observe(v); });
    /* one at a time: starting a clip pauses whichever one was running */
    clips.forEach(function (v) {
      v.addEventListener('play', function () {
        clips.forEach(function (o) { if (o !== v && !o.paused) o.pause(); });
      });
    });
  }

  /* ── 5. copy to clipboard (Baller League application answers) ───────── */
  [].forEach.call(document.querySelectorAll('[data-copy]'), function (btn) {
    var label = btn.textContent;
    btn.addEventListener('click', function () {
      var src = document.getElementById(btn.getAttribute('data-copy'));
      if (!src) return;
      var text = (src.innerText || src.textContent || '').trim();
      var done = function (ok) {
        btn.textContent = ok ? t('copied') : t('pressCopy');
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

  /* ── 6. language switcher ───────────────────────────────────────────── */
  /* A <details>, so it works with JS off. This closes it on a click outside
     or Escape, and carries the current #anchor to the same page in the other
     language, since every edition keeps the same ids. */
  var lang = document.querySelector('details.lang');
  if (lang) {
    document.addEventListener('click', function (e) {
      if (lang.open && !lang.contains(e.target)) lang.open = false;
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lang.open) {
        lang.open = false;
        lang.querySelector('summary').focus();
      }
    });
    [].forEach.call(lang.querySelectorAll('a[href]'), function (a) {
      a.addEventListener('click', function () {
        if (location.hash) a.setAttribute('href', a.getAttribute('href').split('#')[0] + location.hash);
      });
    });
  }
})();
