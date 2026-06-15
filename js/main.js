/* Maha Omar — photographer. Lenis + GSAP reveals, custom cursor, a scroll-scrubbed
   cinematic hero (montage of her photographs), bilingual EN/AR with RTL. */
import { PHOTOS, COLLECTIONS, SRC, SRCSET, byColl, I18N } from "./data.js";
import { initHero } from "./cinematic.js";

const gsap = window.gsap, ST = window.ScrollTrigger;
gsap.registerPlugin(ST);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
function el(t, c, h) { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }

let lang = "en";
const T = () => I18N[lang];
const pick = (o, k) => lang === "ar" ? (o[k + "_ar"] ?? o[k]) : o[k];

/* ── Lenis smooth scroll ── */
const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
lenis.on("scroll", ST.update);
gsap.ticker.add(t => { lenis.raf(t * 1000); window.__cineUpdate && window.__cineUpdate(); });
gsap.ticker.lagSmoothing(0);
window.__lenis = lenis;

/* ── render collections ── */
const NUM = n => String(n).padStart(2, "0");
const ALIGN = ["full", "left", "right", "wide", "right", "left", "full"];
function figure(p, i) {
  const f = el("figure", "g-fig"); f.dataset.align = ALIGN[i % ALIGN.length];
  f.innerHTML = `<div class="g-frame"><img src="${SRC(p.coll, p.slug, 1280)}" srcset="${SRCSET(p.coll, p.slug)}"
      sizes="(max-width:860px) 100vw, 64vw" alt="${pick(p, "title")}" loading="lazy"></div>
    <figcaption><span class="g-num">${NUM(i + 1)}</span><span class="g-title">${pick(p, "title")}</span></figcaption>`;
  return f;
}
function renderWork() {
  const host = $("#work"); host.innerHTML = "";
  COLLECTIONS.forEach(c => {
    const sec = el("section", "collection"); sec.id = c.id;
    sec.innerHTML = `<div class="coll-head"><span class="coll-eyebrow">${c.n} — ${lang === "ar" ? c.ar : c.en}</span>
      <h2 class="coll-title">${lang === "ar" ? c.ar : c.en}</h2>
      <p class="coll-lead">${lang === "ar" ? c.lead_ar : c.lead_en}</p></div>
      <div class="gallery"></div>`;
    const g = sec.querySelector(".gallery");
    byColl(c.id).forEach((p, i) => g.append(figure(p, i)));
    host.append(sec);
  });
}

/* ── language ── */
function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  $$("[data-i18n]").forEach(e => { const v = T()[e.dataset.i18n]; if (v != null) e.innerHTML = v; });
  renderWork();
  buildGalleryReveals();
  bindCursor();
}

/* ── custom cursor ── */
function bindCursor() {
  if (!matchMedia("(pointer:fine)").matches) return;
  const cur = $("#cursor"), lbl = $(".cur-label");
  $$(".g-fig").forEach(f => {
    if (f.__b) return; f.__b = 1;
    f.addEventListener("pointerenter", () => { cur.classList.add("is-media"); lbl.textContent = lang === "ar" ? "عرض" : "View"; });
    f.addEventListener("pointerleave", () => { cur.classList.remove("is-media"); lbl.textContent = ""; });
  });
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

/* ── reveals ── */
function splitWords(node) {
  const words = (node.dataset.raw || node.textContent).trim();
  if (!node.dataset.raw) node.dataset.raw = node.innerHTML;
  node.innerHTML = words.split(/\s+/).map(w => `<span class="word"><span>${w}</span></span>`).join(" ");
  node.querySelectorAll(".word").forEach(w => { w.style.display = "inline-block"; w.style.overflow = "hidden"; w.firstChild.style.display = "inline-block"; });
  return node.querySelectorAll(".word > span");
}
function buildGalleryReveals() {
  $$(".g-frame").forEach(frame => {
    if (frame.__r) return; frame.__r = 1;
    const img = frame.querySelector("img");
    gsap.set(frame, { clipPath: "inset(0 0 100% 0)" });
    gsap.timeline({ scrollTrigger: { trigger: frame, start: "top 86%" } })
      .to(frame, { clipPath: "inset(0 0 0% 0)", duration: 1.2, ease: "power3.inOut" })
      .to(img, { scale: 1, duration: 1.5, ease: "power3.out" }, 0);
  });
}
function buildReveals() {
  if (!reduced) gsap.from(".hero-title span", { yPercent: 70, opacity: 0, duration: 1.1, stagger: 0.12, ease: "power3.out", delay: 0.1 });
  $$(".reveal-up").forEach(e => gsap.to(e, { opacity: 1, y: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: e, start: "top 90%" } }));
  $$(".reveal-line, .reveal-words").forEach(node => {
    const spans = splitWords(node); gsap.set(spans, { y: "110%" });
    gsap.to(spans, { y: "0%", duration: 1, stagger: 0.02, ease: "power3.out", scrollTrigger: { trigger: node, start: "top 84%" } });
  });
  buildGalleryReveals();
}

/* ── start ── */
function start() {
  $("#yr").textContent = new Date().getFullYear();
  renderWork(); bindCursor();
  initHero({ onProgress: p => {
    const ov = $(".cine-overlay"), sc = $(".hero-scroll");
    const k = Math.min(Math.max((p - 0.04) / 0.5, 0), 1);
    ov.style.opacity = String(1 - k); ov.style.transform = `translateY(${-k * 40}px)`;
    if (sc) sc.style.opacity = String(1 - Math.min(p / 0.12, 1));
  } });
  const tl = gsap.timeline();
  tl.to(".ld-bar i", { width: "100%", duration: 1.0, ease: "power2.inOut", delay: 0.2 })
    .to("#loader", { autoAlpha: 0, duration: 0.7, onComplete: () => $("#loader").style.display = "none" }, "+=0.05")
    .add(buildReveals, "-=0.3");
}
if (document.readyState === "complete") start(); else addEventListener("load", start);
