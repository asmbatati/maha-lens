# Maha Lens · عدسة مها

Photography portfolio for **Maha Omar** (مها عمر) — product & commercial, gourmet, and nature photography.
*"The way the oryx sees — softly, and whole."*

A buildless, bilingual (English ⇄ Arabic / RTL) single-page site with a scroll-scrubbed cinematic hero.

## Stack

- Plain **HTML + CSS + ES modules** — no build step.
- **Supabase CMS** — photos/collections/copy hydrate from Supabase (`js/remote.js`, `data.js` fallback); `admin.html` is Maha's phone-first panel (RLS-locked writes, EXIF-stripping + auto-orienting webp uploads, suspendable sections).
- **Per-section moods** — silk `#cb997e` with falling flacons (Product), sage `#6b705c` with tumbling fruit (Gourmet), cream `#fff9eb` with petals (Nature), sand `#ddbea9` with floating calligraphy (Architecture), velvet bokeh (Coverage) — plus a themed companion line weaving through each stream with a traveler that rides the scroll.
- **Raw WebGL hero reel** (`js/heroshow.js`) — liquid-displacement crossfades between her photographs, cover-fit + in-shader Ken-Burns, `<img>` crossfade fallback. The page rises over the pinned hero behind a **curved curtain edge** (savor.it-style).
- **Wavy spotlight streams** — each collection is a column of photos drifting on three layered sine waves with clip-path reveals (GSAP ScrollTrigger per image, config in `WAVE`).
- **Celestial layer** (`js/celestial.js`) — glitter twinkles, four-point glints, and falling stars **behind the photos** (sticky canvas inside the page body); camera-flash accents on load / slide change / lightbox.
- [GSAP](https://gsap.com/) 3.12 + ScrollTrigger + [Lenis](https://lenis.darkroom.engineering/) 1.1 — smooth scroll, progress bar, velocity-leaning marquee, giant letter-built closing logotype.
- **Gloock** display serif, glowing like the stars (em-scaled layered text-shadow) + Archivo · Amiri + Alexandria (Arabic).
- Candlelight-dark aesthetic: espresso `#0f0c0a`, champagne gold `#d9a95f`, warm ivory, brand blush `#edafb8`.
- Accessible lightbox (keyboard, RTL-aware arrows, swipe, focus trap), bilingual marquee.

## Run locally

```bash
python -m http.server 4178
# open http://localhost:4178
```

## Structure

```
index.html          markup + content
css/main.css         all styles (light palette, RTL rules)
js/main.js           render, i18n EN/AR toggle, Lenis + GSAP reveals, custom cursor
js/cinematic.js      scroll-scrubbed Ken-Burns hero engine
js/data.js           collections, photo manifest, bilingual strings
img/                 optimized webp galleries + brand mark + hero
favicon*.png         brand favicon
```

## Credits

Photographs © Maha Omar (مها عمر). All rights reserved.
Instagram [@xmaha.95](https://instagram.com/xmaha.95) · mahaomarba@gmail.com
