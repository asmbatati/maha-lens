# Maha Lens · عدسة مها

Photography portfolio for **Maha Omar** (مها عمر) — product & commercial, gourmet, nature, architecture, and event-coverage photography.

A buildless, bilingual (English ⇄ Arabic / RTL) **multi-page** site: a cinematic landing that opens into the portfolio, with a Supabase CMS so Maha can manage it from her phone. **Live at [maha-lens.vercel.app](https://maha-lens.vercel.app)**.

## Pages

- **`index.html`** — landing: a full-screen lens cinematic (video, with a poster fallback so a frame always shows) + brand + "View the work".
- **`work.html`** — the portfolio: WebGL photo hero, wavy spotlight galleries, About, Contact, camera hub, lightbox. **Home** link returns to the landing.
- **`admin.html`** — Maha's phone-first CMS (Supabase auth + storage).

Cross-page navigation uses the browser's `@view-transition` for an animated crossfade where supported.

## Stack

- Plain **HTML + CSS + ES modules** — no build step, no npm.
- [GSAP](https://gsap.com/) 3.12 + ScrollTrigger + [Lenis](https://lenis.darkroom.engineering/) 1.1 — smooth scroll, reveals, the wavy streams, marquee.
- **Supabase CMS** — photos/collections/copy hydrate from Supabase at runtime (`js/remote.js`, `js/data.js` is the offline fallback). Project `pvconwkeshzoovchvzqm`; tables `maha_photos` / `maha_collections` / `maha_site_copy`; public `photos` storage bucket. **RLS-locked** writes (admin emails only). `admin.html` uploads auto-orient, strip all metadata, and emit the three webp tiers.
- **WebGL hero reel** (`js/heroshow.js`) — liquid-melt crossfades between her photographs over an always-visible base `<img>`; an absolute `goTo(i)` keeps the reel synced to the base (no flashing). Cover-fit + in-shader Ken-Burns; `<img>`-crossfade fallback with no WebGL.
- **Wavy spotlight streams** — each collection is a column of photos drifting on three layered sine waves with clip-path reveals (per-image ScrollTrigger). Large on desktop, scaled down on phones.
- **Per-section moods** (`js/particles.js`) — silk `#cb997e` + falling flacons (Product), sage `#6b705c` + tumbling fruit (Gourmet), cream `#fff9eb` + petals (Nature), sand `#ddbea9` + floating calligraphy (Architecture), velvet + bokeh (Coverage); each with a themed companion line that a traveler rides on scroll.
- **Type:** Gloock (display serif, glowing) + Archivo · Amiri + Alexandria (Arabic).
- **Aesthetic:** candlelight & starlight — espresso `#0f0c0a`, champagne gold `#d9a95f`, warm ivory, brand blush `#edafb8`.
- Accessible lightbox (keyboard, RTL-aware arrows, swipe, focus trap), bilingual marquee, camera-aperture section hub.

## Run locally

```bash
python -m http.server 4178
# open http://localhost:4178
```

(ES modules require HTTP — `file://` will fail to load `js/*.js`.)

## Structure

```
index.html · work.html · admin.html   the three pages
css/main.css        all styles (dark palette, landing, hero, wave, per-section themes, RTL)
js/main.js          work-page app: render, i18n EN/AR, hero driver, wave, hub, lightbox
js/heroshow.js      WebGL liquid-melt hero slideshow (+ base-image sync, fallback)
js/particles.js     themed particle skies (stars/embers/petals/calligraphy/bokeh/…)
js/landing.js       landing script (bilingual, starfield, plays the cinematic)
js/data.js          fallback manifest: photos, 5 collections, SLIDES, bilingual strings
js/remote.js        Supabase fetch (→ data.js fallback) · js/config.js  connection
js/admin.js         CMS logic (RLS-locked uploads/edits)
img/                webp galleries + fx/ (sprites + textures) · video/  cinematic + reveal clips
vercel.json         no-store on the HTML pages
```

Cache-busting: JS/CSS carry `?v=N` (bumped per change); images use `?v=6` (bumped on in-place re-encodes).

## Credits

Photographs © Maha Omar (مها عمر). All rights reserved.
Instagram [@xmaha.95](https://instagram.com/xmaha.95) · mahaomarba@gmail.com
