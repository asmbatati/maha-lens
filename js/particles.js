/* Particle layers — one engine, many moods. Each collection section gets its
   own sticky viewport canvas; the global sky keeps the starfield. All layers
   pause off-screen (IntersectionObserver) and in hidden tabs.
     stars / stars-cool  twinkles + glints + falling stars
     petals              blossom petals drifting down a cream sky (nature)
     flacons             perfume bottles falling & floating, sparkles (product)
     fruits              oranges, citrus slices & berries tumbling (gourmet)
     callig              Arabic letterforms floating with a 3D-ish flip (architecture)
     embers / bokeh      warm sparks / out-of-focus event lights
   The 3D feel is faked cheaply:每 sprite spins with an axis squash
   (scaleX = sin) plus gradient shading and depth-based size/alpha.        */

const TONES = {
  warm: ["244,236,223", "217,169,95", "237,175,184"],
  cool: ["230,236,246", "168,190,220", "244,236,223"],
};
const rnd = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;
/* roundRect is missing on older iOS Safari — fall back to a plain rect */
const rrect = (ctx, x, y, w, h, r) =>
  ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);

/* generated 3D sprites (text-prompt-only, reviewed; vector art is the fallback) */
const SPRITES = { flacons: "img/fx/flacon.png", fruits: "img/fx/citrus.png", callig: "img/fx/meem.png" };

export function initParticles(canvas, { mode = "stars", reduced = false, host = null } = {}) {
  if (reduced || !canvas) return { flashStar: () => {}, destroy: () => {} };
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, dead = false, running = !host;
  let sprite = null;
  if (SPRITES[mode]) {
    const im = new Image();
    im.onload = () => { sprite = im; };
    im.src = `${SPRITES[mode]}?v=6`;
  }
  function drawSprite(x, y, size, rot, squash, alpha) {
    const h = size, w = h * (sprite.width / sprite.height);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(squash, 1);
    ctx.globalAlpha = alpha;
    ctx.drawImage(sprite, -w / 2, -h / 2, w, h);
    ctx.restore(); ctx.globalAlpha = 1;
  }

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  addEventListener("resize", resize, { passive: true });
  if (host) new IntersectionObserver(
    es => es.forEach(e => { running = e.isIntersecting; }),
    { rootMargin: "25%" }
  ).observe(host);

  /* sprite pool: x,y in [0,1], v fall speed (neg = floats up), depth 0.5-1 */
  const pool = (n, extra) => Array.from({ length: n }, () => ({
    x: Math.random(), y: Math.random(), depth: rnd(0.5, 1),
    v: Math.random() < 0.72 ? rnd(0.012, 0.034) : rnd(-0.014, -0.005),
    sway: rnd(10, 40), f: rnd(0.25, 0.7), ph: rnd(0, TAU),
    rot: rnd(0, TAU), rv: rnd(-0.6, 0.6), spin: rnd(0.3, 1.1),
    ...extra(),
  }));

  const stars = Array.from({ length: Math.min(120, innerWidth / 13 | 0) }, () => ({
    x: Math.random(), y: Math.random(), r: rnd(0.4, 1.4),
    tone: (mode === "stars-cool" ? TONES.cool : TONES.warm)[Math.random() * 3 | 0],
    phase: rnd(0, TAU), speed: rnd(0.4, 1.6), glint: Math.random() < 0.14, drift: rnd(-0.006, 0.006),
  }));
  const petals = pool(26, () => ({ s: rnd(5, 12), a: rnd(0.4, 0.8),
    tone: ["232,161,173", "217,169,95", "157,178,158", "224,140,120"][Math.random() * 4 | 0] }));
  const flacons = pool(13, () => ({ s: rnd(13, 26), sparkle: false }))
    .concat(Array.from({ length: 10 }, () => ({ sparkle: true, x: Math.random(), y: Math.random(),
      s: rnd(2, 4.6), ph: rnd(0, TAU), f: rnd(0.5, 1.6) })));
  const fruits = pool(16, () => ({ s: rnd(7, 15),
    kind: ["orange", "slice", "berry"][Math.random() * 3 | 0] }));
  const glyphs = pool(15, () => ({ s: rnd(20, 46),
    ch: ["م", "هـ", "ع", "د", "س", "ل", "ن"][Math.random() * 7 | 0] }));
  const embers = pool(34, () => ({ r: rnd(0.8, 2.4), a: rnd(0.25, 0.7) }));
  const bokeh = Array.from({ length: 16 }, () => ({
    x: Math.random(), y: Math.random(), r: rnd(18, 64),
    tone: ["255,214,150", "244,236,223", "237,175,184"][Math.random() * 3 | 0],
    vx: rnd(-0.008, 0.008), vy: rnd(-0.005, 0.005), ph: rnd(0, TAU), f: rnd(0.15, 0.5),
  }));

  let comet = null, nextComet = performance.now() + rnd(3500, 8000);
  function spawnComet(now) {
    const fromLeft = Math.random() < 0.5;
    comet = { t0: now, life: rnd(700, 1000), x0: fromLeft ? rnd(-0.1, 0.25) : rnd(0.75, 1.1),
      y0: rnd(0.04, 0.3), dx: (fromLeft ? 1 : -1) * rnd(0.35, 0.55), dy: rnd(0.12, 0.22) };
    nextComet = now + rnd(8000, 15000);
  }
  function glintPath(x, y, s) {
    ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x, y, x + s, y);
    ctx.quadraticCurveTo(x, y, x, y + s); ctx.quadraticCurveTo(x, y, x - s, y);
    ctx.quadraticCurveTo(x, y, x, y - s);
  }
  /* shared fall/float placement */
  const fallXY = (p, t) => ({
    x: p.x * W + Math.sin(p.ph + t * p.f) * p.sway,
    y: (((p.y + p.v * t) % 1.1) + 1.1) % 1.1 * H - 0.05 * H,
  });

  const DRAW = {
    stars(t, now) {
      for (const s of stars) {
        const tw = 0.5 + 0.5 * Math.sin(s.phase + t * s.speed);
        const a = 0.06 + tw * (s.glint ? 0.5 : 0.34);
        const x = (((s.x + s.drift * t) % 1) + 1) % 1 * W, y = s.y * H;
        ctx.fillStyle = `rgba(${s.tone},${a.toFixed(3)})`;
        ctx.beginPath();
        if (s.glint) glintPath(x, y, s.r * (2.6 + tw * 3.2)); else ctx.arc(x, y, s.r, 0, TAU);
        ctx.fill();
      }
      if (!comet && now > nextComet) spawnComet(now);
      if (comet) {
        const k = (now - comet.t0) / comet.life;
        if (k >= 1) comet = null;
        else {
          const e = k * (2 - k), x = (comet.x0 + comet.dx * e) * W, y = (comet.y0 + comet.dy * e) * H;
          const tail = 90 * (1 - k * 0.5), ang = Math.atan2(comet.dy, comet.dx), a = Math.sin(Math.PI * k);
          const g = ctx.createLinearGradient(x, y, x - Math.cos(ang) * tail, y - Math.sin(ang) * tail);
          g.addColorStop(0, `rgba(255,250,240,${(0.9 * a).toFixed(3)})`);
          g.addColorStop(0.25, `rgba(217,169,95,${(0.45 * a).toFixed(3)})`);
          g.addColorStop(1, "rgba(217,169,95,0)");
          ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(x, y);
          ctx.lineTo(x - Math.cos(ang) * tail, y - Math.sin(ang) * tail); ctx.stroke();
          ctx.fillStyle = `rgba(255,252,245,${a.toFixed(3)})`;
          ctx.beginPath(); ctx.arc(x, y, 1.9, 0, TAU); ctx.fill();
        }
      }
    },
    petals(t) {
      for (const p of petals) {
        const { x, y } = fallXY(p, t);
        ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot + t * p.rv);
        ctx.fillStyle = `rgba(${p.tone},${p.a})`;
        ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * 0.42, 0, 0, TAU); ctx.fill();
        ctx.restore();
      }
    },
    flacons(t) {
      for (const p of flacons) {
        if (p.sparkle) {   // gold glitter between the bottles
          const tw = 0.5 + 0.5 * Math.sin(p.ph + t * p.f);
          ctx.fillStyle = `rgba(255,246,224,${(0.25 + tw * 0.5).toFixed(3)})`;
          ctx.beginPath(); glintPath(p.x * W, p.y * H, p.s * (0.8 + tw)); ctx.fill();
          continue;
        }
        const { x, y } = fallXY(p, t);
        const squash = 0.42 + 0.58 * Math.abs(Math.sin(p.ph + t * p.spin));  // 3D-ish spin
        const s = p.s * p.depth;
        if (sprite) {   // generated 3D flacon render
          drawSprite(x, y, s * 2.4, Math.sin(p.ph + t * p.rv) * 0.35, squash, 0.55 + 0.4 * p.depth);
          continue;
        }
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(p.ph + t * p.rv) * 0.35);
        ctx.scale(squash, 1);
        const a = 0.5 * p.depth;
        // bottle body with glass shading
        const g = ctx.createLinearGradient(-s * 0.45, 0, s * 0.45, 0);
        g.addColorStop(0, `rgba(64,38,20,${a})`);
        g.addColorStop(0.45, `rgba(120,76,40,${a * 0.8})`);
        g.addColorStop(1, `rgba(48,28,14,${a})`);
        ctx.fillStyle = g;
        ctx.beginPath(); rrect(ctx, -s * 0.45, -s * 0.5, s * 0.9, s, s * 0.16); ctx.fill();
        // gold cap
        ctx.fillStyle = `rgba(217,169,95,${(0.85 * p.depth).toFixed(3)})`;
        ctx.beginPath(); rrect(ctx, -s * 0.16, -s * 0.78, s * 0.32, s * 0.3, s * 0.06); ctx.fill();
        // specular line
        ctx.strokeStyle = `rgba(255,244,222,${(0.5 * p.depth).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-s * 0.24, -s * 0.34); ctx.lineTo(-s * 0.24, s * 0.3); ctx.stroke();
        ctx.restore();
      }
    },
    fruits(t) {
      for (const p of fruits) {
        const { x, y } = fallXY(p, t);
        const s = p.s * p.depth, rot = p.rot + t * p.rv;
        const squash = 0.55 + 0.45 * Math.abs(Math.sin(p.ph + t * p.spin));
        if (sprite && p.kind !== "berry") {   // generated citrus render (berries stay vector)
          drawSprite(x, y, s * 2.4, rot, squash, 0.6 + 0.35 * p.depth);
          continue;
        }
        ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(squash, 1);
        const a = 0.75 * p.depth;
        if (p.kind === "berry") {
          const g = ctx.createRadialGradient(-s * 0.2, -s * 0.2, 0, 0, 0, s * 0.62);
          g.addColorStop(0, `rgba(168,52,62,${a})`); g.addColorStop(1, `rgba(96,22,30,${a})`);
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s * 0.62, 0, TAU); ctx.fill();
        } else if (p.kind === "slice") {
          ctx.fillStyle = `rgba(244,196,94,${a})`;
          ctx.beginPath(); ctx.arc(0, 0, s, 0, TAU); ctx.fill();
          ctx.fillStyle = `rgba(255,236,178,${a})`;
          ctx.beginPath(); ctx.arc(0, 0, s * 0.8, 0, TAU); ctx.fill();
          ctx.strokeStyle = `rgba(214,150,52,${a})`; ctx.lineWidth = 1;
          for (let i = 0; i < 6; i++) {
            ctx.beginPath(); ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(i * TAU / 6) * s * 0.74, Math.sin(i * TAU / 6) * s * 0.74); ctx.stroke();
          }
        } else {           // orange with a leaf
          const g = ctx.createRadialGradient(-s * 0.25, -s * 0.25, 0, 0, 0, s);
          g.addColorStop(0, `rgba(238,150,58,${a})`); g.addColorStop(1, `rgba(196,102,26,${a})`);
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s, 0, TAU); ctx.fill();
          ctx.fillStyle = `rgba(110,130,86,${a})`;
          ctx.beginPath(); ctx.ellipse(s * 0.32, -s * 0.86, s * 0.34, s * 0.15, -0.6, 0, TAU); ctx.fill();
        }
        ctx.restore();
      }
    },
    callig(t) {
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (const p of glyphs) {
        const { x, y } = fallXY(p, t);
        const flip = Math.sin(p.ph + t * p.spin);           // rotateY illusion
        const s = p.s * p.depth;
        if (sprite && p.ch === "م") {   // the golden meem gets its 3D render
          drawSprite(x, y, s * 1.7, Math.sin(p.ph + t * p.rv * 0.6) * 0.25, Math.max(0.18, Math.abs(flip)), 0.5 + 0.4 * p.depth);
          continue;
        }
        ctx.save(); ctx.translate(x, y);
        ctx.rotate(Math.sin(p.ph + t * p.rv * 0.6) * 0.25);
        ctx.scale(Math.max(0.18, Math.abs(flip)), 1);
        ctx.font = `${s}px Amiri, serif`;
        ctx.fillStyle = `rgba(74,52,32,${(0.28 + 0.4 * p.depth).toFixed(3)})`;
        ctx.fillText(p.ch, 0, 0);
        ctx.restore();
      }
    },
    embers(t) {
      for (const e of embers) {
        const y = (1 - ((e.y + Math.abs(e.v) * 1.6 * t) % 1.06)) * H + 10;
        const x = e.x * W + Math.sin(e.ph + t * e.f) * e.sway;
        const a = e.a * (0.45 + 0.55 * Math.sin(e.ph + t * 1.3));
        ctx.fillStyle = `rgba(255,${170 + (e.r * 30 | 0)},94,${Math.max(a, 0.05).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(x, y, e.r, 0, TAU); ctx.fill();
      }
    },
    bokeh(t) {
      for (const b of bokeh) {
        const x = (((b.x + b.vx * t) % 1) + 1) % 1 * W;
        const y = (((b.y + b.vy * t) % 1) + 1) % 1 * H;
        const a = 0.04 + 0.05 * (0.5 + 0.5 * Math.sin(b.ph + t * b.f));
        const g = ctx.createRadialGradient(x, y, 0, x, y, b.r);
        g.addColorStop(0, `rgba(${b.tone},${a.toFixed(3)})`);
        g.addColorStop(1, `rgba(${b.tone},0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, b.r, 0, TAU); ctx.fill();
      }
    },
  };
  DRAW["stars-cool"] = DRAW.stars;

  function frame(now) {
    if (dead) return;
    if (!document.hidden && running) {
      ctx.clearRect(0, 0, W, H);
      (DRAW[mode] || DRAW.stars)(now / 1000, now);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    flashStar: () => { if (mode.startsWith("stars")) spawnComet(performance.now()); },
    destroy: () => { dead = true; },
  };
}
