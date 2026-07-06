/* Maha Lens — orchestration. Lenis + GSAP, pinned WebGL hero under a curved
   curtain, wavy sine-driven photo streams, themed particle skies per section,
   radial camera hub, bilingual EN/AR with RTL, lightbox, custom cursor.
   Content is hydrated from Supabase (admin.html) with data.js as fallback. */
import { PHOTOS, COLLECTIONS, SRC, REALW, I18N, SLIDES } from "./data.js?v=9";
import { initHeroShow } from "./heroshow.js?v=9";
import { initParticles } from "./particles.js?v=9";
import { loadRemote } from "./remote.js?v=9";

const gsap = window.gsap, ST = window.ScrollTrigger;
gsap.registerPlugin(ST);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };

let lang = "en";
const T = () => I18N[lang];
const pick = (o, k) => lang === "ar" ? (o[k + "_ar"] ?? o[k]) : o[k];
const rtl = () => lang === "ar";
const NUM = n => String(n).padStart(2, "0");

/* ── content store (static fallback → remote CMS) ── */
/* repo-relative sources get a cache-buster: rotated files keep their names,
   so stale cached tiers would otherwise show the OLD orientation on click */
const bust = u => u && u.startsWith("img/") && !u.includes("?") ? `${u}?v=6` : u;
const normPhoto = p => ({
  coll: p.coll, slug: p.slug, title: p.title, title_ar: p.title_ar,
  ar: +p.ar, cap: p.cap ?? undefined,
  s640: bust(p.src_640) ?? SRC(p.coll, p.slug, 640),
  s1280: bust(p.src_1280) ?? SRC(p.coll, p.slug, 1280),
  s2000: bust(p.src_2000) ?? SRC(p.coll, p.slug, 2000),
});
let DBP = PHOTOS.map(normPhoto);
let DBC = COLLECTIONS.slice();
const byColl = id => DBP.filter(p => p.coll === id);
const srcsetOf = p => `${p.s640} ${REALW(p, 640)}w, ${p.s1280} ${REALW(p, 1280)}w, ${p.s2000} ${REALW(p, 2000)}w`;

/* per-section mood: background theme · particle mode · cinematic reveal video · texture backdrop */
const THEMES = {
  product:      { theme: "silk",   particles: "flacons", video: "tr-product" },              // #cb997e
  gourmet:      { theme: "sage",   particles: "fruits",  video: "tr-gourmet", tex: "bg-sage" }, // #6b705c
  nature:       { theme: "garden", particles: "petals",  video: "tr-nature" },               // #fff9eb
  architecture: { theme: "sand",   particles: "callig" },                                    // #ddbea9
  coverage:     { theme: "velvet", particles: "bokeh",   tex: "bg-bokeh" },                  // dark
};
const themeOf = id => THEMES[id] || { theme: "velvet", particles: "stars" };

/* ── Lenis smooth scroll ── */
const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
lenis.on("scroll", ST.update);
gsap.ticker.add(t => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
window.__lenis = lenis;

/* ── scroll progress ── */
const progressBar = $("#progress i");
lenis.on("scroll", e => {
  const p = e.limit > 0 ? e.scroll / e.limit : 0;
  progressBar.style.transform = `scaleX(${Math.min(Math.max(p, 0), 1)})`;
});

/* ── camera flash ── */
const flashEl = $("#flash");
function flash(intensity = 0.8) {
  if (reduced) return;
  gsap.fromTo(flashEl, { opacity: intensity }, { opacity: 0, duration: 0.55, ease: "power2.out", overwrite: true });
}

/* ── global starfield (intro / about / contact) ── */
initParticles($("#stars"), { mode: "stars", reduced });

/* ── hero reel ── */
let heroShow = null, curSlide = 0;
function slideLabel(i) {
  const s = SLIDES[i];
  $("#slideNum").textContent = NUM(i + 1);
  $("#slideTotal").textContent = NUM(SLIDES.length);
  $("#slideTitle").textContent = pick(s, "title");
}
// the base <img> tracks the reel so the hero shows the right photo even if WebGL never draws
function setHeroBase(i) {
  const base = $("#heroBase"); if (!base) return;
  const src = SLIDES[i].src;
  if (base.getAttribute("src") === src) return;
  base.style.transition = "opacity .6s var(--ease, ease)";
  base.style.opacity = "0.35";
  const swap = new Image();
  swap.onload = () => { base.src = src; base.style.opacity = "1"; };
  swap.src = src;
}
function initHero() {
  heroShow = initHeroShow($("#heroGL"), SLIDES, {
    reduced, interval: 5200,
    onSlide: i => { curSlide = i; slideLabel(i); setHeroBase(i); if (i > 0) flash(0.16); },
  });
  const hero = $(".hero");
  hero.addEventListener("click", e => {
    if (e.target.closest(".hero-meta")) return;
    heroShow.next(); flash(0.3);
  });
  if (!reduced) {
    gsap.to([".hero-ui", ".hero-meta"], { opacity: 0, ease: "none",
      scrollTrigger: { trigger: "#pageBody", start: "top 92%", end: "top 30%", scrub: 0.4 } });
  }
}

/* ── wavy spotlight streams ── */
/* CodeGrid reference config — exact values from the source */
const CONFIG = {
  waves: {
    base:   { amp: 0.1,   freq: 1.0, speed: 1.0, phase: 5.0 },
    flow:   { amp: 0.15,  freq: 5.0, speed: 5.0, phase: 10.0 },
    detail: { amp: 0.025, freq: 5.0, speed: 1.5, phase: 2.5 },
  },
  clipMax: 20,
  clipPower: 2,
};
const BASE_H = 375;
let ORDER = [];
let sectionSkies = [];

function figure(p, i, coll, k, n, dirSign) {
  const f = el("figure", "sp-item");
  f.dataset.index = ORDER.length; f.dataset.k = k; f.dataset.n = n; f.dataset.ar = p.ar;
  f.dataset.dir = dirSign;
  f.tabIndex = 0; f.setAttribute("role", "button"); f.setAttribute("aria-haspopup", "dialog");
  f.setAttribute("aria-label", `${pick(p, "title")} — ${T().view}`);
  f.innerHTML = `<img src="${p.s1280}" srcset="${srcsetOf(p)}" sizes="640px"
      alt="${pick(p, "title")} — ${pick(coll, "name")}" loading="lazy" decoding="async">
    <figcaption class="sp-cap"><span class="sp-num">${NUM(i + 1)}</span><span class="sp-title">${pick(p, "title")}</span></figcaption>`;
  ORDER.push(p);
  return f;
}
function renderWork() {
  sectionSkies.forEach(s => s.destroy()); sectionSkies = [];
  const host = $("#work"); host.innerHTML = ""; ORDER = [];
  DBC.forEach((c, secIdx) => {
    const coll = { name: c.en, name_ar: c.ar };
    const photos = byColl(c.id);
    if (!photos.length) return;
    const mood = themeOf(c.id);
    const dirSign = secIdx % 2 === 0 ? 1 : -1;          // drift flips section to section
    const sec = el("section", "collection"); sec.id = c.id; sec.dataset.theme = mood.theme; sec.dataset.dir = dirSign;
    if (mood.video) sec.classList.add("has-reveal");
    const headInner = `<span class="coll-eyebrow">${c.n} — ${lang === "ar" ? c.ar : c.en} · ${photos.length}</span>
      <h2 class="coll-title glow">${lang === "ar" ? c.ar : c.en}</h2>
      <p class="coll-lead">${lang === "ar" ? c.lead_ar : c.lead_en}</p>`;
    const head = mood.video
      ? `<div class="sec-reveal">
           <video class="sec-reveal-vid" muted loop playsinline preload="none" poster="video/${mood.video}-poster.webp" aria-hidden="true">
             <source src="video/${mood.video}.webm" type="video/webm"><source src="video/${mood.video}.mp4" type="video/mp4"></video>
           <div class="sec-reveal-scrim"></div>
           <div class="coll-head">${headInner}</div>
         </div>`
      : `<div class="coll-head">${headInner}</div>`;
    const tex = mood.tex ? `<div class="sec-tex" style="background-image:url(img/fx/${mood.tex}.webp?v=6)" aria-hidden="true"></div>` : "";
    sec.innerHTML = `${tex}<div class="sec-sky" aria-hidden="true"><canvas></canvas></div>${head}<div class="spotlight"></div>`;
    const g = sec.querySelector(".spotlight");
    photos.forEach((p, i) => g.append(figure(p, i, coll, i, photos.length, dirSign)));
    host.append(sec);
    sectionSkies.push(initParticles(sec.querySelector(".sec-sky canvas"), { mode: mood.particles, reduced, host: sec }));
  });
  updateSpotlightSizes();
  bindRevealVideos();
  ST.getAll().forEach(t => { if (t.trigger && !document.contains(t.trigger)) t.kill(); });
}
/* cinematic reveal bands play only while on-screen (and never under reduced-motion) */
let revealIO = null;
function bindRevealVideos() {
  if (reduced) return;
  revealIO ??= new IntersectionObserver(entries => entries.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) v.play().catch(() => {}); else v.pause();
  }), { rootMargin: "0px 0px -10% 0px" });
  $$(".sec-reveal-vid").forEach(v => { if (!v.__io) { v.__io = 1; revealIO.observe(v); } });
}
function updateSpotlightSizes() {
  const sizeFactor = Math.min(innerWidth / 750, 1);
  $$(".sp-item").forEach(item => {
    const ar = +item.dataset.ar, k = +item.dataset.k, n = +item.dataset.n;
    // reference shrink: the last quarter of each stream tapers down to 50%
    const shrinkStart = Math.floor(n * 0.75);
    const shrinkFactor = (n >= 4 && k >= shrinkStart)
      ? (k - shrinkStart + 1) / (n - shrinkStart) : 0;
    const h = BASE_H * (ar < 1 ? 1.3 : 1) * sizeFactor * (1 - shrinkFactor * 0.5);
    const w = h * ar;
    item.style.height = `${Math.round(h)}px`;
    item.style.width = `${Math.round(w)}px`;
    const img = item.querySelector("img");
    if (img) img.sizes = `${Math.ceil(w)}px`;
  });
}
/* CodeGrid reference wave — three layered sines drive each photo's drift as
   it travels the viewport; a centered clip mask reveals it toward the middle
   of its journey. Faithful port: only our real aspect ratios, the per-section
   mirror, and RTL awareness are added on top. */
function buildWave() {
  if (reduced) return;
  $$(".sp-item").forEach(item => {
    if (item.__w) return; item.__w = 1;
    const k = +item.dataset.k, n = +item.dataset.n;
    const normalizedIndex = n > 1 ? k / (n - 1) : 0;
    const mirror = +item.dataset.dir || 1;         // direction flips section to section
    const apply = progress => {
      const { base, flow, detail } = CONFIG.waves;
      const vw = innerWidth;
      const baseWave = Math.sin(
        normalizedIndex * base.freq + (1 - progress) * base.speed + base.phase);
      const flowWave = 0.5 + Math.sin(
        normalizedIndex * flow.freq + flow.phase + progress * flow.speed);
      const detailWave = 0.5 + Math.sin(
        normalizedIndex * detail.freq + detail.phase + progress * detail.speed);
      const drift = -vw * 0.1
        + baseWave * vw * base.amp
        + flowWave * vw * flow.amp
        + detailWave * vw * detail.amp;
      const dir = mirror * (rtl() ? -1 : 1);
      // fit: shrink the drift just enough that this photo stays fully on-screen
      // (bites only when the photo is wide relative to the viewport, i.e. phones)
      const slack = Math.max(0, (vw - item.offsetWidth) / 2 - vw * 0.015);
      const fit = Math.min(1, slack / (vw * 0.24));
      const translateX = (vw - item.offsetWidth) / 2 + drift * dir * fit;
      const centerOffset = Math.abs(progress - 0.5) * 2;
      const clipAmount = Math.pow(centerOffset, CONFIG.clipPower) * CONFIG.clipMax;
      item.style.translate = `${translateX}px`;
      item.style.clipPath = `inset(0 ${clipAmount}% 0 ${clipAmount}%)`;
    };
    ST.create({
      trigger: item, start: "top bottom", end: "bottom top",
      onUpdate: s => apply(s.progress),
      onRefresh: s => apply(s.progress),
    });
  });
}
/* ── scroll companion line per section: a themed path weaving between the
   photos, drawn in as you scroll, with a traveler gliding along it ── */
const LINE_STYLES = {
  silk:   { from: "#fff3dd", to: "#d9a95f", w: 3,   op: .8,  traveler: "glitter" },
  sage:   { from: "#e9dfae", to: "#b7c49a", w: 2.5, op: .75, traveler: "fruit" },
  garden: { from: "#dcewff", to: "#9fc4dc", w: 6,   op: .55, traveler: "cloud" },
  sand:   { from: "#8a6a48", to: "#5f4530", w: 2,   op: .6,  traveler: "star" },
  velvet: { from: "#ffd696", to: "#b98ac9", w: 2.5, op: .6,  traveler: "orb" },
};
const TRAVELERS = {
  glitter: `<path d="M0 -9 Q0 0 9 0 Q0 0 0 9 Q0 0 -9 0 Q0 0 0 -9" fill="#fff6e0"/>`,
  fruit: `<circle r="7" fill="#e88c3a"/><ellipse cx="3.4" cy="-7.6" rx="3.4" ry="1.6" fill="#6e8256" transform="rotate(-30 3.4 -7.6)"/>`,
  cloud: `<g fill="#ffffff" opacity=".9"><circle cx="-7" cy="2" r="6"/><circle cx="0" cy="-2" r="8"/><circle cx="8" cy="2" r="6"/></g>`,
  star: `<path d="M0 -8 Q0 0 8 0 Q0 0 0 8 Q0 0 -8 0 Q0 0 0 -8" fill="#d9a95f"/>`,
  orb: `<circle r="8" fill="rgba(255,214,150,.65)"/><circle r="3.4" fill="#fff3dd"/>`,
};
function buildSectionLines() {
  if (reduced) return;
  $$(".collection").forEach((sec, si) => {
    sec.querySelector(".sec-line")?.remove();
    const style = LINE_STYLES[sec.dataset.theme] || LINE_STYLES.velvet;
    const W = sec.clientWidth, H = sec.scrollHeight;
    const head = sec.querySelector(".coll-head");
    // measure relative to the section — head may be nested inside a reveal band
    const secTop = sec.getBoundingClientRect().top;
    const y0 = head ? (head.getBoundingClientRect().bottom - secTop) + 30 : 120;
    const items = sec.querySelectorAll(".sp-item").length;
    const n = Math.max(3, items + 1);
    const step = (H - y0 - 60) / n;
    if (step < 60) return;
    const dir = +sec.dataset.dir || 1;
    let x = W / 2, dAttr = `M ${x.toFixed(1)} ${y0}`;
    for (let i = 0; i < n; i++) {
      const nx = W * (0.5 + (i % 2 === 0 ? 0.33 : -0.33) * dir);
      const y1 = y0 + step * i, y2 = y0 + step * (i + 1);
      dAttr += ` C ${x.toFixed(1)} ${(y1 + step * 0.55).toFixed(1)}, ${nx.toFixed(1)} ${(y1 + step * 0.45).toFixed(1)}, ${nx.toFixed(1)} ${y2.toFixed(1)}`;
      x = nx;
    }
    const gid = `lg-${si}`;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "sec-line");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${style.from}"/><stop offset="1" stop-color="${style.to}"/></linearGradient></defs>
      <path class="sec-path" d="${dAttr}" fill="none" stroke="url(#${gid})"
        stroke-width="${style.w}" stroke-linecap="round" opacity="${style.op}"/>
      <g class="sec-traveler">${TRAVELERS[style.traveler] || TRAVELERS.orb}</g>`;
    sec.insertBefore(svg, head);
    const path = svg.querySelector(".sec-path"), trav = svg.querySelector(".sec-traveler");
    const len = path.getTotalLength();
    path.style.strokeDasharray = len;
    // The traveler is locked to the SCROLL, not the path length: it always sits
    // where the viewport is, weaving left-right — never racing ahead of you.
    const N = 240, samples = [];
    for (let i = 0; i <= N; i++) samples.push({ l: len * i / N, y: path.getPointAtLength(len * i / N).y });
    const yToLen = y => {
      let lo = 0, hi = N;
      while (lo < hi) { const m = (lo + hi) >> 1; samples[m].y < y ? lo = m + 1 : hi = m; }
      return samples[lo].l;
    };
    const apply = p => {
      const vh = innerHeight;
      const targetY = Math.max(0, Math.min(H, p * (H + vh) - vh * 0.45));
      const L = yToLen(targetY);
      path.style.strokeDashoffset = len - L;
      const pt = path.getPointAtLength(L);
      trav.setAttribute("transform", `translate(${pt.x.toFixed(1)},${pt.y.toFixed(1)})`);
      trav.style.opacity = L > 2 && L < len - 2 ? 1 : 0;
    };
    apply(0);
    ST.create({ trigger: sec, start: "top bottom", end: "bottom top",
      onUpdate: s => apply(s.progress), onRefresh: s => apply(s.progress) });
  });
}

let resizeTmr = null;
addEventListener("resize", () => {
  clearTimeout(resizeTmr);
  resizeTmr = setTimeout(() => { updateSpotlightSizes(); buildMarquee(); buildSectionLines(); ST.refresh(); }, 150);
}, { passive: true });

/* ── marquee (repeat-to-fill so the loop never runs dry) ── */
function buildMarquee() {
  const track = $("#mqTrack");
  const items = [["Maha Lens", "عدسة مها"], ...DBC.map(c => [c.en, c.ar])];
  const seq = items.map(([en, ar]) => `<span>${en}<i>✦</i></span><span class="mq-ar">${ar}<i>✦</i></span>`).join("");
  track.innerHTML = seq;
  const w1 = Math.max(track.scrollWidth, 1);
  const reps = Math.max(1, Math.ceil((innerWidth * 1.25) / w1));
  const half = seq.repeat(reps);          // each half is wider than the viewport
  track.innerHTML = half + half;          // -50% loop point is seamless
}

/* ── language ── */
function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = rtl() ? "rtl" : "ltr";
  $$("[data-i18n]").forEach(e => { const v = T()[e.dataset.i18n]; if (v != null) e.innerHTML = v; });
  $("#langToggle").setAttribute("aria-label", T().lang_label);
  $("#lightbox").setAttribute("aria-label", T().lb_label);
  $(".lb-close").setAttribute("aria-label", T().lb_close);
  $(".lb-prev").setAttribute("aria-label", T().lb_prev);
  $(".lb-next").setAttribute("aria-label", T().lb_next);
  $("#hubBtn").setAttribute("aria-label", T().hub_label);
  $("#hub").setAttribute("aria-label", T().hub_label);
  slideLabel(curSlide);
  renderWork();
  buildWave();
  buildSectionLines();
  buildCollHeadReveals();
  bindCursor();
  if (lightbox.isOpen()) lightbox.refresh();
}

/* ── custom cursor ── */
function bindCursor() {
  if (!matchMedia("(pointer:fine)").matches) return;
  const cur = $("#cursor"), lbl = $(".cur-label");
  $$(".sp-item").forEach(f => {
    if (f.__b) return; f.__b = 1;
    f.addEventListener("pointerenter", () => { cur.classList.add("is-media"); lbl.textContent = T().view; });
    f.addEventListener("pointerleave", () => { cur.classList.remove("is-media"); lbl.textContent = ""; });
  });
  const hero = $(".hero");
  if (!hero.__b) {
    hero.__b = 1;
    hero.addEventListener("pointerenter", () => { cur.classList.add("is-media"); lbl.textContent = "✦"; });
    hero.addEventListener("pointerleave", () => { cur.classList.remove("is-media"); lbl.textContent = ""; });
  }
}
if (matchMedia("(pointer:fine)").matches) {
  document.body.classList.add("hasCursor");
  const cur = $("#cursor"); let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
  addEventListener("pointermove", e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  (function loop() { cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2; cur.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`; requestAnimationFrame(loop); })();
}

/* ── nav ── */
$$("[data-scroll]").forEach(a => a.addEventListener("click", e => { e.preventDefault(); const t = $(a.dataset.scroll); if (t) lenis.scrollTo(t, { duration: 1.3 }); }));
$("#langToggle").addEventListener("click", () => { lang = lang === "en" ? "ar" : "en"; applyLang(); ST.refresh(); });
$("#toTop").addEventListener("click", () => lenis.scrollTo(0, { duration: 1.4 }));

/* ── section hub (camera aperture → radial burst) ── */
const hub = (() => {
  const box = $("#hub"), chipsHost = $("#hubChips"), btn = $("#hubBtn");
  let openFlag = false;
  function chipTargets(n) {
    const r = Math.max(130, Math.min(innerWidth, innerHeight) * 0.32);
    return Array.from({ length: n }, (_, i) => {
      const a = (-90 + i * 360 / n) * Math.PI / 180;
      return { x: Math.cos(a) * r, y: Math.sin(a) * r };
    });
  }
  function open() {
    openFlag = true; box.hidden = false;
    chipsHost.innerHTML = "";
    const colls = DBC.filter(c => byColl(c.id).length);
    const targets = chipTargets(colls.length);
    colls.forEach((c, i) => {
      const chip = el("button", "hub-chip", lang === "ar" ? c.ar : c.en);
      chip.addEventListener("click", () => select(c.id));
      chipsHost.append(chip);
      if (reduced) {
        chip.style.transform = `translate(-50%,-50%) translate(${targets[i].x}px,${targets[i].y}px)`;
      } else {
        gsap.set(chip, { xPercent: -50, yPercent: -50, x: 0, y: 0, scale: 0, opacity: 0 });
        gsap.to(chip, { x: targets[i].x, y: targets[i].y, scale: 1, opacity: 1,
          duration: 0.6, delay: 0.04 * i, ease: "back.out(1.7)" });
      }
    });
    if (!reduced) gsap.fromTo(".hub-center", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.6)" });
    flash(0.18);
    chipsHost.querySelector(".hub-chip")?.focus();
  }
  function close(restoreFocus = true) {
    if (!openFlag) return;
    openFlag = false;
    if (reduced) { box.hidden = true; if (restoreFocus) btn.focus(); return; }
    gsap.to(".hub-chip", { x: 0, y: 0, scale: 0, opacity: 0, duration: 0.35, ease: "power2.in", stagger: 0.02 });
    gsap.to(".hub-center", { scale: 0.6, opacity: 0, duration: 0.35, ease: "power2.in",
      onComplete: () => { box.hidden = true; if (restoreFocus) btn.focus(); } });
  }
  function select(id) {
    flash(0.5);
    close(false);
    const target = document.getElementById(id);
    if (target) setTimeout(() => lenis.scrollTo(target, { duration: 1.6 }), reduced ? 0 : 240);
  }
  btn.addEventListener("click", () => openFlag ? close() : open());
  box.querySelector(".hub-backdrop").addEventListener("click", () => close());
  document.addEventListener("keydown", e => { if (!box.hidden && e.key === "Escape") close(); });
  return { close };
})();

/* ── reveals ── */
function splitWords(node) {
  const words = (node.dataset.raw || node.textContent).trim();
  if (!node.dataset.raw) node.dataset.raw = node.innerHTML;
  node.innerHTML = words.split(/\s+/).map(w => `<span class="word"><span>${w}</span></span>`).join(" ");
  node.querySelectorAll(".word").forEach(w => { w.style.display = "inline-block"; w.style.overflow = "hidden"; w.firstChild.style.display = "inline-block"; });
  return node.querySelectorAll(".word > span");
}
function splitChars(node) {
  node.innerHTML = [...node.textContent].map(c => `<span class="ch">${c === " " ? "&nbsp;" : c}</span>`).join("");
  return node.querySelectorAll(".ch");
}
function buildCollHeadReveals() {
  if (reduced) return;
  $$(".coll-head").forEach(head => {
    if (head.__r) return; head.__r = 1;
    gsap.from(head.querySelector(".coll-title"), { yPercent: 55, opacity: 0, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: head, start: "top 84%" } });
    gsap.from([head.querySelector(".coll-eyebrow"), head.querySelector(".coll-lead")], {
      opacity: 0, y: 14, duration: 0.8, stagger: 0.08, ease: "power3.out",
      scrollTrigger: { trigger: head, start: "top 84%" } });
  });
}
let __revealed = false;
function buildReveals() {
  if (__revealed) return;        // run-once: safe to call from dismiss AND the safety net
  __revealed = true;
  if (!reduced) {
    const chars = [...splitChars($(".hero-title .l1")), ...splitChars($(".hero-title .l2"))];
    gsap.from(chars, { yPercent: 74, opacity: 0, duration: 0.7, stagger: 0.032, ease: "power3.out" });
    gsap.from([".hero-kicker", ".hero-ar", ".hero-sig", ".hero-meta"], { opacity: 0, y: 12, duration: 0.7, stagger: 0.07, ease: "power3.out", delay: 0.28 });
    gsap.to("#pageBody", { "--curve": "0vh", ease: "none",
      scrollTrigger: { trigger: "#pageBody", start: "top bottom", end: "top top", scrub: 0.4 } });
    const foot = splitChars($(".foot-logo"));
    gsap.from(foot, { yPercent: 60, opacity: 0, duration: 0.8, stagger: 0.05, ease: "power3.out",
      scrollTrigger: { trigger: ".foot-brand", start: "top 88%" } });
    gsap.from(".foot-ar", { opacity: 0, y: 12, duration: 0.7, ease: "power3.out",
      scrollTrigger: { trigger: ".foot-brand", start: "top 88%" } });
    const skewTo = gsap.quickTo("#mqTrack", "skewX", { duration: 0.4, ease: "power2.out" });
    lenis.on("scroll", e => skewTo(Math.max(-6, Math.min(6, (e.velocity || 0) * 0.35))));
    gsap.from("#hubBtn", { y: 60, opacity: 0, duration: 0.8, delay: 0.9, ease: "power3.out" });
  }
  $$(".reveal-up").forEach(e => gsap.to(e, { opacity: 1, y: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: e, start: "top 90%" } }));
  if (!reduced) $$(".reveal-line, .reveal-words").forEach(node => {
    const spans = splitWords(node); gsap.set(spans, { y: "110%" });
    gsap.to(spans, { y: "0%", duration: 0.9, stagger: 0.018, ease: "power3.out", scrollTrigger: { trigger: node, start: "top 84%" } });
  });
  buildWave();
  buildSectionLines();
  buildCollHeadReveals();
}

/* ── lightbox ── */
const lightbox = (() => {
  const box = $("#lightbox"), img = $(".lb-img"), title = $(".lb-title"),
    count = $(".lb-count"), stage = $(".lb-stage");
  let i = 0, lastFocus = null;
  const collName = p => { const c = DBC.find(c => c.id === p.coll); return c ? (lang === "ar" ? c.ar : c.en) : ""; };
  function show() {
    const p = ORDER[i];
    img.style.opacity = "0.25";
    img.onload = () => { img.style.opacity = "1"; };
    img.src = p.s2000;
    img.srcset = srcsetOf(p);
    img.sizes = "92vw";
    img.alt = pick(p, "title");
    title.textContent = `${pick(p, "title")} — ${collName(p)}`;
    count.textContent = `${NUM(i + 1)} / ${NUM(ORDER.length)}`;
    [i - 1, i + 1].forEach(j => { const q = ORDER[(j + ORDER.length) % ORDER.length]; new Image().src = q.s1280; });
  }
  function open(idx) {
    i = idx; lastFocus = document.activeElement;
    box.hidden = false; document.documentElement.classList.add("lb-open");
    lenis.stop(); show(); flash(0.24);
    if (!reduced) gsap.fromTo(stage, { opacity: 0, scale: 0.985 }, { opacity: 1, scale: 1, duration: 0.45, ease: "power3.out" });
    $(".lb-close").focus();
  }
  function close() {
    box.hidden = true; document.documentElement.classList.remove("lb-open");
    lenis.start(); lastFocus?.focus?.();
  }
  const step = d => { i = (i + d + ORDER.length) % ORDER.length; show(); };
  $(".lb-close").addEventListener("click", close);
  $(".lb-prev").addEventListener("click", () => step(-1));
  $(".lb-next").addEventListener("click", () => step(1));
  $(".lb-backdrop").addEventListener("click", close);
  document.addEventListener("keydown", e => {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") step(rtl() ? -1 : 1);
    else if (e.key === "ArrowLeft") step(rtl() ? 1 : -1);
    else if (e.key === "Tab") {
      const f = $$(".lb-btn", box); const idx = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(idx + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
  let sx = 0, sy = 0;
  stage.addEventListener("pointerdown", e => { sx = e.clientX; sy = e.clientY; }, { passive: true });
  stage.addEventListener("pointerup", e => {
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) step((dx < 0 ? 1 : -1) * (rtl() ? -1 : 1));
  }, { passive: true });
  $("#work").addEventListener("click", e => {
    const f = e.target.closest(".sp-item"); if (f) open(+f.dataset.index);
  });
  $("#work").addEventListener("keydown", e => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const f = e.target.closest(".sp-item"); if (f) { e.preventDefault(); open(+f.dataset.index); }
  });
  return { isOpen: () => !box.hidden, refresh: show };
})();

/* ── loader dismissal — plain CSS class + setTimeout, ZERO gsap/rAF dependency,
   so tab-visibility changes, jank, or a dead animation engine can never trap it ── */
let _revealed = false;
function revealSite() {
  if (_revealed) return; _revealed = true;
  const loader = $("#loader");
  if (loader) { loader.classList.add("dismiss"); setTimeout(() => { loader.style.display = "none"; }, 700); }
  $("#introVid")?.pause();
  buildReveals();
}
function playIntroThenReveal() {
  let seen = false;
  try { seen = sessionStorage.getItem("seen") === "1"; sessionStorage.setItem("seen", "1"); } catch (e) {}
  const loader = $("#loader"), introVid = $("#introVid");
  // absolute guarantee — the loader is gone within 6s no matter what happens above
  setTimeout(revealSite, 6000);
  if (document.hidden) { revealSite(); return; }        // background tab: no ceremony
  if (!seen && !reduced && introVid) {                  // first visit → the lens-aperture cinematic
    loader.classList.add("cinematic");
    if (!reduced) gsap.to(".ld-bar i", { width: "100%", duration: 3.0, ease: "power1.inOut" });
    introVid.play().catch(() => {});
    const go = () => { flash(0.85); revealSite(); };
    introVid.addEventListener("ended", go);
    loader.addEventListener("click", go);               // tap to skip
    setTimeout(go, 3000);                               // plain timeout — not gsap
  } else {
    if (!reduced) gsap.to(".ld-bar i", { width: "100%", duration: seen ? 0.25 : 0.5, ease: "power2.inOut" });
    setTimeout(() => { flash(0.85); revealSite(); }, seen ? 350 : 650);
  }
}

/* ── start ── */
function start() {
  $("#yr").textContent = new Date().getFullYear();
  // Render immediately from the bundled manifest, then dismiss the loader — the site
  // NEVER waits on the network. Supabase content is hydrated in the background below.
  buildMarquee(); applyLang(); initHero();
  playIntroThenReveal();
  loadRemote().then(remote => {
    if (!remote) return;
    DBP = remote.photos.map(normPhoto);
    DBC = remote.collections.map(c => ({ id: c.id, n: c.n, en: c.en, ar: c.ar, lead_en: c.lead_en, lead_ar: c.lead_ar }));
    remote.copy.forEach(row => { if (row.en) I18N.en[row.key] = row.en; if (row.ar) I18N.ar[row.key] = row.ar; });
    applyLang();                                         // re-render with the live CMS data
    ST.refresh();
  }).catch(() => {});
}
/* Run as soon as the DOM is ready — NOT on window "load". main.js is a deferred
   module, so the DOM is already parsed here; gating on "load" would wait for every
   resource (incl. the intro video), which can stall indefinitely on a CDN and leave
   the loader stuck. start() needs only the DOM + GSAP/Lenis, all ready by now. */
if (document.readyState === "loading") addEventListener("DOMContentLoaded", start);
else start();
