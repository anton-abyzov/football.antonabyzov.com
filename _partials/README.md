# Page kit — how to build a page on this site

`_partials/` is not published by GitHub Pages in any meaningful way (nothing links to it) but it is
not secret either. It exists so every page builder produces the same page, verbatim.

**Do not invent components.** Everything below already exists in `assets/css/site.css`. If a page
needs something that is not here, add it to `site.css` under the right numbered section and add it to
this README in the same commit.

---

## 0. Non-negotiables

- **One `<h1>` per page**, and it is the page's subject, not the site's.
- **Two font families only**: `Anton` (display) and `Archivo` (body and UI). Adding a third breaks
  the brand and the performance budget.
- **Gold is earned.** `.hon--gold`, `.ledger li.is-gold`, `.tile--gold` and `.pill--gold` mean a real
  title, trophy, medal or presidential order. Placings, scorer records and near-misses get the plain
  treatment. If you are unsure, it is not gold.
- **Every statistic carries its source** as an HTML comment immediately above it:
  `<!-- src: alfoot.net pid=2125 -->`. No exceptions, including numbers inside prose.
- **Recorded is recorded.** Never write "career total" for a figure that comes from the personal
  match archive.
- **Cyrillic names get a transliteration on first use**, e.g.
  `Чурилов Евгений Владимирович (Churilov Evgeny Vladimirovich)`.
- **No em dashes** in copy. Commas, full stops and colons do the work.
- Mobile-first: everything must work at **375px with 16px gutters and zero horizontal scroll**.
- **Write English only.** `scripts/build.py` generates the `/ru/`, `/es/`, `/pt/`, `/de/` and `/fr/`
  editions from each English page, adds the hreflang block and the language switcher, and takes the
  words from `i18n/<lang>.json` (ADD-CONTENT.md section 6b). Text that must never be translated goes
  in an element with `translate="no"`.

---

## 1. Page skeleton

```html
<!doctype html>
<html lang="en">
<head>
  <!-- paste head-meta.html and fill the {{TOKENS}} -->
</head>
<body>

  <!-- paste header.html verbatim; set aria-current="page" on this page's nav link -->

  <main id="main">
    <!-- optional breadcrumbs, see §3 -->
    <!-- sections: alternate .sec--pitch and .sec--paper, see §2 -->
  </main>

  <!-- paste footer.html verbatim -->

  <script src="/assets/js/site.js" defer></script>
</body>
</html>
```

`docs/index.html` and `docs/404.html` are the two worked examples. Read `docs/index.html` before
writing a new page: every component below appears there at least once.

---

## 2. Tonal rhythm

The page must never be one dark slab. Alternate:

```html
<section class="sec sec--pitch" id="tape" aria-labelledby="h-tape"> … </section>
<section class="sec sec--paper" id="ledger" aria-labelledby="h-ledger"> … </section>
<section class="sec sec--pitch sec--pitch-deep" id="honours"> … </section>
<section class="sec sec--paper" id="profile"> … </section>
```

Both themes redefine `--fg`, `--fg-dim`, `--fg-fade`, `--hair` and `--accent`, so every component
below works unchanged inside either. **Never hard-code a colour in a page.** Use the tokens.

Inside each section:

```html
<div class="sec__in">
  <div class="sec-head">
    <p class="sec-kick"><span class="pill pill--out">Ledger</span>Season by season</p>
    <h2 id="h-ledger">Baranovichi to Minsk to Miami.</h2>
  </div>
  …
</div>
```

`.pill` is red (live), `.pill--out` is an outline in the section accent, `.pill--gold` is gold.

---

## 3. Components

### Breadcrumbs (every page except the home page)

```html
<nav class="crumbs" aria-label="Breadcrumb">
  <ol><li><a href="/">Home</a></li><li aria-current="page">Career</li></ol>
</nav>
```

Mirror it in the page's JSON-LD with a `BreadcrumbList`.

### Hero (home page only)

`.hero` with `.hero__pitch`, `.hero__flood`, `.hero__ghost` decoration layers, `.hero__in`,
`.kicker`, `h1` with `.n1`/`.n2`, `.hero__role`, `.hero__sub`, `.cta-row`, `.hero__shot` + `.third`.
Inner pages open with a plain `.sec-head` instead.

### Stat tiles

```html
<ul class="tiles reveal">
  <!-- src: alfoot.net pid=2125 -->
  <li class="tile"><span class="tile__n" data-count="53">53</span>
    <span class="tile__l">Goals on the official ALF card<em>2011 to 2025</em></span></li>
</ul>
```

The number is written out in full in the HTML. `data-count` only drives the animation, which arms
after a real scroll gesture, so a screenshot or a print never catches a half-counted figure. Add
`.tile--gold` only for a trophy.

### Vertical season ledger

```html
<ol class="ledger reveal">
  <!-- src: devby.io interview, 22 October 2012 -->
  <li class="is-key is-gold">
    <p class="ledger__yr">2009</p>
    <div>
      <h3 class="ledger__h">European champion, Nantes</h3>
      <p class="ledger__p">One paragraph, 62ch maximum.</p>
    </div>
    <p class="ledger__tag">Belarus</p>
  </li>
</ol>
```

`is-key` draws the accent bar on a career-defining row. `is-gold` turns that bar and the year gold
and is reserved for a real title. Plain rows carry neither.

### Honours board

```html
<ul class="hon">
  <!-- src: pressball.by/news/other/61066 via Wayback 20230327011056 -->
  <li class="hon--gold">
    <span class="hon__y">16 December 2009</span>
    <span class="hon__t">Commendation of the President of the Republic of Belarus</span>
    <p class="hon__d">One or two sentences.</p>
  </li>
</ul>
```

The same `.hon` list also does duty as a "traits with receipts" list, where `.hon__y` holds the
receipt ("Receipt · 2008 notebook"). Wrap a board and its aside in `.honours__grid`.

### Video facade + chapters

```html
<div class="player" id="p-patagonia" data-video="p3kv0_LCCqA" data-start="402"
     data-title="Descriptive iframe title, required">
  <div class="player__frame">
    <div class="player__poster" aria-hidden="true"><picture>…</picture></div>
    <span class="player__scoreline" aria-hidden="true"><b>PS23 Superliga 8v8</b> · Miami</span>
    <a class="player__play" href="https://www.youtube.com/watch?v=p3kv0_LCCqA&amp;t=402s" rel="noopener">
      <span class="player__tri" aria-hidden="true"></span>
      <span class="player__cta">Play at goal 1<em>Loads YouTube on click</em></span>
    </a>
  </div>
</div>

<div data-player="p-patagonia">
  <ol class="chapters__list">
    <li><a href="https://www.youtube.com/watch?v=p3kv0_LCCqA&amp;t=402s" rel="noopener" data-t="402">
      <span class="ts">6:47</span><span class="cap">Goal 1</span></a></li>
  </ol>
</div>
```

The controls are real links to the YouTube URL, so the tape works with JS off; site.js
intercepts the click. Nothing is requested from YouTube until the visitor presses play; the iframe is
`youtube-nocookie.com` and honours `?start=`. The chapter container's `data-player` must match the
player's `id` so a page can carry several players. Use `.player__poster--chalk` (a drawn poster)
when no frame grab exists yet. Use `.reels` for a row of small facades, and `.pending` for a cut
that is edited but not yet uploaded, with an honest label.

### Quote

```html
<blockquote class="quote">
  <p>Uppercase display, one or two sentences.</p>
  <footer><b>Anton Abyzov</b>Where it comes from.</footer>
</blockquote>
```

Only quote what the dossier grades as publishable. The IT Cup commentator line is **not** yet
transcribed from the audio and must not appear as a quotation anywhere.

### Gallery grid

```html
<ul class="grid">
  <li><figure class="shot shot--34">
    <picture>…</picture>
    <figcaption>Caption line<em>Second line, plus the photo credit where one is required.</em></figcaption>
  </figure></li>
</ul>
```

Aspect helpers: `.shot--34`, `.shot--45`, `.shot--32`, `.shot--169`. Third-party stills must carry
the credit **in the caption**, not in the footer. That currently applies to the Churilov portrait
(Baranovichi State University, tmpc.barsu.by) and to anything from `@dadecountyfc`.

### CTA band and citations

`.band` is the dark closing band with `.band__in`, `.band__cols` and a `.cta-row`. `.cites` is the
compact source list for `/records/`.

### Buttons

`.btn--volt` (primary, dark sections), `.btn--ghost` (secondary, both themes), `.btn--ink`
(primary on paper sections). Group them in a `.cta-row`.

### Copy to clipboard (the `/baller-league/` page)

```html
<div id="answer-achievements">…the exact text of the answer…</div>
<button class="btn btn--ghost" type="button" data-copy="answer-achievements">Copy answer</button>
```

`site.js` copies the element's text and flips the label to "Copied" for two seconds.

---

## 4. Images

Never hand-write an `<img>`. Add the asset to `tools/build-images.py`, run it, then:

```
python3 tools/img-tag.py nantes-2009-medal "Alt text, one sentence." lazy
```

That prints a `<picture>` with WebP first, a JPEG fallback, intrinsic `width`/`height` and the LQIP
blur-up already inlined as a background. Use `eager` for anything above the fold.

Budgets: **250 KB per image**, **200 KB per OG card**, one CSS file under 60 KB, `site.js` under
12 KB. Video is embedded from YouTube and never hosted here.

OG cards come from `tools/build-og.py`, one per page, 1200x630. Add the page to its `CARDS` list.

---

## 5. Before you call a page done

1. `python3 -m playwright screenshot --viewport-size=1440,900 --full-page …` and
   `--viewport-size=375,812 …` into `docs/_qa/`, then **look at both images**.
2. At 375px, `document.documentElement.scrollWidth` must equal `window.innerWidth`.
3. No unlabelled placeholder anywhere. If an asset is missing, say so in the page, in Anton's voice.
4. Every number traces to a `<!-- src: -->` comment.
5. Add the page to `docs/sitemap.xml` with today's date.

## Motion note (2026-09-19 fix)
`.reveal` groups animate via CSS scroll-driven timelines only (`site.css` §15, `animation-timeline: view()`).
JS never toggles their visibility. Do not add `rv`/`is-in` classes or opacity:0 states to page content;
a full-page capture, print or PDF must always contain every row.

## Shared fixes waiting to be folded into site.css (found on /football/, 2026-09-19)

Three defects live in `site.css`, not in any one page. They are patched per page for now, with the
page-scoped block on `/football/` as the reference copy. Fold them in and delete the page copies.

**1. `.pill` fails WCAG AA.** `site.css` §4 sets `background:var(--live)` (#ff4438) with `color:#fff`,
which is **3.42:1** at 9.5px/700. Its own sibling `.pill--gold` is 10.25:1, so the red pill is the odd
one out in its own system. Put dark ink on the bright fill, exactly as `.pill--gold` does:

```css
.pill{ background:var(--live); color:#2a0906; }   /* 5.38:1 */
```

Do **not** darken the `--live` token instead: it is also the live-dot colour. If white lettering is ever
non-negotiable, `.pill{ background:#c81e10; }` gives 5.75:1.

**2. `.reveal` on a gap-hairline grid opens the hairlines mid-scroll.** `.tiles` draws its cell rules from
`gap:1px` over `background:var(--line-soft)` (§7) while `.reveal > *` applies a scroll-driven
`translateY(18px)` (§15). Put `reveal` on the grid and every cell rises on its own, so the 1px row rule
becomes an ~18px band of bare container background and the vertical divider vanishes across it. Measured
at 375 and 360 before the fix: row gap 19.00px, cells 4 and 5 at `matrix(1,0,0,1,0,18)`. Either animate
the grid as one unit:

```css
.tiles.reveal > *{ animation:none; }
.tiles.reveal{ animation:reveal-rise linear both; animation-timeline:view(); animation-range:entry 0% entry 40%; }
```

or, as `/football/` does, keep `reveal` off the grid and wrap it in a `<div class="reveal">`. Any other
`gap`-hairline grid carrying `reveal` has the same defect.

**3. `.dataline` is a keyboard trap for its own content.** §5 ships it `flex-wrap:nowrap` +
`overflow-x:auto` + `scrollbar-width:none`, so at 375px it is a silent scroller (scrollWidth 984 against
375) and a keyboard-only user never reaches FOOT, BASED IN, OPEN TO or CITY. WCAG 2.1.1. `tabindex="0"`
is now on the `<dl>` in `header.html`, which is the required half. Add the affordance to `site.css`:

```css
.dataline:focus-visible{ outline:2px solid var(--volt); outline-offset:-2px; }
@media (max-width:980px){
  .dataline{ padding-right:calc(var(--gut) + 30px); scroll-snap-type:x proximity; scroll-padding-inline:var(--gut); }
  .dataline > div{ scroll-snap-align:start; }
  .dataline:not(:focus-visible){ --cut:linear-gradient(90deg,#000 calc(100% - 28px),transparent);
    -webkit-mask-image:var(--cut); mask-image:var(--cut); }
}
```

`/futsal/` solves the same defect by wrapping the row under 640px instead. Both are acceptable; pick one
and make it the shared rule, because the header comment in `header.html` still promises a row that
"wraps" while `site.css` makes it scroll.

---

## 18. Case cards and trait chips (`/baller-league/`)

```html
<ul class="case">
  <li class="case--gold"><figure>
    <!-- src: … -->
    {{IMG nantes-2009-european-cup | alt}}
    <figcaption><b class="case__k">2009 · Nantes</b><span class="case__t">European champion</span><span class="case__d">one line</span></figcaption>
  </figure></li>
</ul>
<ul class="traits"><li>Pivot<em>2008 notebook</em></li><li class="is-live">Open to 6v6 indoor</li></ul>
```

A `.case` card is a photograph that carries one line of an argument: kicker, display headline,
one short line. `.case--gold` only for a title or a medal. `.traits` is a wrap of chips, one trait
each, with the receipt as the small line; `.is-live` is the one chip that states availability.
