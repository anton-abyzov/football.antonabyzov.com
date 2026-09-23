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

  /* ── 7. motion layer: progress bar, card tilt, the story, the moments ── */
  /* Everything here is additive. With JS off, reduced motion or a narrow
     screen the page is the plain stacked layout the HTML already carries. */
  var bar = document.createElement('div');
  bar.className = 'scrollbar'; bar.setAttribute('aria-hidden', 'true');
  bar.appendChild(document.createElement('i'));
  document.body.appendChild(bar);

  if (!reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    [].forEach.call(document.querySelectorAll('.clip__fig, .grid li > figure, .chap__fig, .reels > li'), function (el) {
      el.classList.add('tilt');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--rx', (((e.clientX - r.left) / r.width) - 0.5) * 6 + 'deg');
        el.style.setProperty('--ry', (0.5 - ((e.clientY - r.top) / r.height)) * 6 + 'deg');
      });
      el.addEventListener('pointerleave', function () {
        el.style.removeProperty('--rx'); el.style.removeProperty('--ry');
      });
    });
  }

  /* home showcase: the clip most in view plays silently as a preview; the
     first time the visitor touches a clip, previews stop for good and that
     clip is theirs, with sound */
  var show = document.querySelector('.story') ? document.querySelector('#best-goals .clips') : null;
  if (show && hasIO && !reduced) {
    var vids = [].slice.call(show.querySelectorAll('video[data-clip]'));
    var ratios = new Map(), previewing = true;
    vids.forEach(function (v) {
      v.muted = true; v.loop = true;
      v.addEventListener('pointerdown', function stop() {
        if (!previewing) return;
        previewing = false;
        vids.forEach(function (o) { o.loop = false; if (o !== v) o.pause(); o.closest('.clip').classList.remove('is-live'); });
        v.muted = false;
      });
    });
    var pick = function () {
      if (!previewing) return;
      var best = null, max = 0.6;
      ratios.forEach(function (r, v) { if (r > max) { max = r; best = v; } });
      vids.forEach(function (v) {
        var li = v.closest('.clip');
        if (v === best) { li.classList.add('is-live'); if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } }
        else { li.classList.remove('is-live'); if (!v.paused) v.pause(); }
      });
    };
    var showIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { ratios.set(e.target, e.intersectionRatio); });
      pick();
    }, { threshold: [0, 0.25, 0.5, 0.6, 0.75, 0.9, 1] });
    vids.forEach(function (v) { showIO.observe(v); });
  }

  /* GSAP only where a pinned sequence exists, only on wide screens with
     motion allowed; loaded from cdnjs after the page is interactive */
  var story = document.querySelector('.story');
  var wide = window.matchMedia('(min-width: 1024px) and (min-height: 620px)').matches;
  if ((story || show) && wide && !reduced) {
    var load = function (src, cb) {
      var s = document.createElement('script'); s.src = src; s.async = true; s.onload = cb;
      s.crossOrigin = 'anonymous'; document.head.appendChild(s);
    };
    var CDN = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/';
    load(CDN + 'gsap.min.js', function () {
      load(CDN + 'ScrollTrigger.min.js', function () {
        var gsap = window.gsap; gsap.registerPlugin(window.ScrollTrigger);
        if (story) pinStory(gsap);
        if (show) pinShow(gsap);
        window.ScrollTrigger.refresh();
      });
    });
  }

  function pinStory(gsap) {
    var chaps = [].slice.call(story.querySelectorAll('.chap'));
    if (chaps.length < 2) return;
    story.classList.add('story--pin');
    chaps[0].classList.add('is-on');
    var stage = story.querySelector('.story__stage');
    var meter = story.querySelector('.story__meter i');
    var parts = function (c) { return [].slice.call(c.querySelectorAll('.chap__txt > *')); };
    chaps.slice(1).forEach(function (c) {
      gsap.set(c.querySelector('.chap__fig'), { clipPath: 'inset(100% 0% 0% 0%)' });
      gsap.set(parts(c), { autoAlpha: 0 });
    });
    var tl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      scrollTrigger: {
        trigger: stage, start: 'top top',
        end: function () { return '+=' + Math.round((chaps.length - 1) * window.innerHeight * 1.15); },
        pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: function (self) {
          if (meter) meter.style.transform = 'scaleX(' + self.progress + ')';
          var on = Math.min(chaps.length - 1, Math.round(self.progress * (chaps.length - 1)));
          chaps.forEach(function (c, i) { c.classList.toggle('is-on', i === on); });
        }
      }
    });
    tl.addLabel('c0').to({}, { duration: 0.6 });
    chaps.forEach(function (c, i) {
      if (!i) return;
      var prev = chaps[i - 1], fig = c.querySelector('.chap__fig'), img = c.querySelector('img');
      tl.to(parts(prev), { y: -36, autoAlpha: 0, stagger: 0.04, duration: 0.45, ease: 'power2.in' })
        .to(prev.querySelector('.chap__fig'), { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.5, ease: 'power2.in' }, '<')
        .to(fig, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7 }, '-=0.3')
        .fromTo(img, { scale: 1.22 }, { scale: 1, duration: 1.1 }, '<')
        .fromTo(c.querySelector('.chap__yr'), { xPercent: 28, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 0.6 }, '<0.1')
        .fromTo(parts(c).filter(function (el) { return !el.classList.contains('chap__yr'); }),
          { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.07, duration: 0.5 }, '<0.12')
        .addLabel('c' + i)
        .to({}, { duration: 1.0 });
    });
  }

  function pinShow(gsap) {
    var rail = show.closest('.rail');
    rail.classList.add('rail--pin');
    var dist = function () { return Math.max(0, show.scrollWidth - show.clientWidth); };
    if (dist() < 200) { rail.classList.remove('rail--pin'); return; }
    gsap.to(show, {
      x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: {
        trigger: rail, start: 'top top', end: function () { return '+=' + dist(); },
        pin: true, scrub: 0.9, anticipatePin: 1, invalidateOnRefresh: true
      }
    });
  }
})();
