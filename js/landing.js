/* Maha Lens — landing page. Full-screen lens cinematic (video) with the brand,
   leading into work.html. Bilingual; a light starfield drifts over the video. */
import { I18N } from "./data.js?v=14";
import { initParticles } from "./particles.js?v=14";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* ── bilingual ── */
let lang = "en";
const T = () => I18N[lang];
function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  $$("[data-i18n]").forEach(e => { const v = T()[e.dataset.i18n]; if (v != null) e.innerHTML = v; });
  $("#langToggle").setAttribute("aria-label", lang === "ar" ? "Switch to English" : "التبديل إلى العربية");
}
$("#langToggle").addEventListener("click", () => { lang = lang === "en" ? "ar" : "en"; applyLang(); });
applyLang();

/* ── starfield over the cinematic ── */
initParticles($("#stars"), { mode: "stars", reduced });

/* ── make the cinematic play. Muted autoplay is usually allowed, but some phones
   block it (iOS Low Power, data-saver). The video is always visible (poster frame
   until it plays), and we retry on load, on visibility, and on the FIRST user
   gesture — so it starts the moment the browser lets it. ── */
const vid = $("#landingVid");
if (vid && !reduced) {
  const play = () => { const p = vid.play(); if (p && p.catch) p.catch(() => {}); };
  play();
  vid.addEventListener("canplay", play, { once: true });
  vid.addEventListener("loadeddata", play, { once: true });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) play(); });
  const kick = () => { play(); if (!vid.paused) off(); };
  const off = () => ["pointerdown", "touchstart", "scroll", "keydown"].forEach(ev => removeEventListener(ev, kick));
  ["pointerdown", "touchstart", "scroll", "keydown"].forEach(ev => addEventListener(ev, kick, { passive: true }));
}
