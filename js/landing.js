/* Maha Lens — landing page. Full-screen lens cinematic (video) with the brand,
   leading into work.html. Bilingual; a light starfield drifts over the video. */
import { I18N } from "./data.js?v=13";
import { initParticles } from "./particles.js?v=13";

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

/* ── make sure the cinematic plays (muted autoplay is allowed); fade it in once it
   actually starts so the poster carries the frame until then — never a black gap ── */
const vid = $("#landingVid");
if (vid) {
  const show = () => vid.classList.add("playing");
  if (!reduced) {
    const play = () => vid.play().then(show).catch(() => {});
    play();
    vid.addEventListener("canplay", play, { once: true });
    vid.addEventListener("playing", show);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) play(); });
    setTimeout(() => { if (vid.paused) vid.play().then(show).catch(() => {}); }, 800);  // retry once
  }
}
