# Maha Lens · عدسة مها

Photography portfolio for **Maha Omar** (مها عمر) — product & commercial, gourmet, and nature photography.
*"The way the oryx sees — softly, and whole."*

A buildless, bilingual (English ⇄ Arabic / RTL) single-page site with a scroll-scrubbed cinematic hero.

## Stack

- Plain **HTML + CSS + ES modules** — no build step.
- [GSAP](https://gsap.com/) 3.12 + ScrollTrigger — clip-path image reveals.
- [Lenis](https://lenis.darkroom.engineering/) 1.1 — smooth scroll, drives the hero Ken-Burns scrub.
- Cormorant Garamond + Jost + Amiri (Arabic).
- Palette: `#edafb8 · #f7e1d7 · #dedbd2 · #b0c4b1 · #4a5759`.

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
