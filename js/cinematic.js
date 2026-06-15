/* Scroll-scrubbed cinematic hero — drives a slow Ken-Burns (scale + subtle parallax drift)
   on a single editorial still as you scroll a tall sticky section. The image is a montage
   of Maha's own framed work; the motion reads as premium without a frame sequence. */
export function initHero({ onProgress } = {}) {
  const sec = document.querySelector(".cine");
  const img = document.querySelector("#cineImg");
  if (!sec || !img) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function update() {
    const rect = sec.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    const p = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 0;
    if (!reduced) {
      const scale = 1.06 + p * 0.16;        // slow zoom-in across the scrub
      const ty = (p - 0.5) * 5;             // gentle vertical parallax drift (%)
      img.style.transform = `scale(${scale}) translate3d(0, ${ty}%, 0)`;
    }
    onProgress && onProgress(p);
  }
  window.__cineUpdate = update;
  addEventListener("resize", update, { passive: true });
  addEventListener("scroll", update, { passive: true });
  update();
}
