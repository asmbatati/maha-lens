/* Maha Lens — landing page. Full-screen lens cinematic (video) with the brand,
   leading into work.html. Bilingual; a light starfield drifts over the video. */
import { I18N } from "./data.js?v=12";
import { initParticles } from "./particles.js?v=12";

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

/* ── make sure the cinematic plays (muted autoplay is allowed) ── */
const vid = $("#landingVid");
if (vid && !reduced) {
  const play = () => vid.play().catch(() => {});
  play();
  vid.addEventListener("canplay", play, { once: true });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) play(); });
}
