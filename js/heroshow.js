/* Hero slideshow — raw WebGL liquid-displacement crossfades between Maha's
   photographs (savor.it-style organic transition, no library). Cover-fit per
   texture, slow in-shader Ken-Burns drift, noise-driven melt edge with a hint
   of chromatic split. Falls back to a plain <img> crossfade without WebGL. */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uT0, uT1;
uniform float uProg, uTime, uCanvasA, uA0, uA1, uZoom0, uZoom1;
uniform vec2 uDir;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { v += a * noise(p); p *= 2.1; a *= 0.5; }
  return v;
}
vec2 cover(vec2 uv, float imgA, float zoom){
  vec2 s = (uCanvasA > imgA) ? vec2(1.0, imgA / uCanvasA) : vec2(uCanvasA / imgA, 1.0);
  return (uv - 0.5) * s / zoom + 0.5;
}
void main() {
  vec2 uv = vUv;
  float n = fbm(uv * 3.0 + uTime * 0.04);
  float g = dot(uv - 0.5, normalize(uDir)) + 0.5;      // directional gradient ~[0,1]
  float val = clamp(mix(g, n, 0.45), 0.0, 1.0);        // organic melt field
  float W = 0.18;
  float p = uProg * (1.0 + 2.0 * W) - W;               // sweep covers the whole field
  float m = smoothstep(val - W, val + W, p);
  float edge = m * (1.0 - m) * 4.0;                    // 1 near the melt line
  vec2 warp = (n - 0.5) * 0.10 * vec2(1.0, 0.8);
  vec2 uv0 = cover(uv + warp * m, uA0, uZoom0);
  vec2 uv1 = cover(uv - warp * (1.0 - m), uA1, uZoom1);
  vec4 c0 = texture2D(uT0, uv0);
  vec4 c1 = texture2D(uT1, uv1);
  c1.r = texture2D(uT1, uv1 + vec2(0.006, 0.0) * edge).r;  // chromatic kiss at the edge
  vec4 c = mix(c0, c1, m);
  c.rgb += edge * 0.05;                                 // faint bloom on the melt line
  float vig = smoothstep(1.25, 0.45, length(uv - 0.5));
  c.rgb *= mix(0.82, 1.0, vig);
  gl_FragColor = vec4(c.rgb, 1.0);
}`;

const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export function initHeroShow(canvas, slides, { onSlide, interval = 5200, reduced = false } = {}) {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false })
          || canvas.getContext("experimental-webgl");
  if (!gl) return initFallback(canvas, slides, { onSlide, interval, reduced });

  const prog = gl.createProgram();
  for (const [type, src] of [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, FRAG]]) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(sh)); return initFallback(canvas, slides, { onSlide, interval, reduced }); }
    gl.attachShader(prog, sh);
  }
  gl.linkProgram(prog); gl.useProgram(prog);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);   // image Y-origin is top-left; GL's is bottom-left

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  for (const n of ["uT0", "uT1", "uProg", "uTime", "uCanvasA", "uA0", "uA1", "uZoom0", "uZoom1", "uDir"])
    U[n] = gl.getUniformLocation(prog, n);
  gl.uniform1i(U.uT0, 0); gl.uniform1i(U.uT1, 1);

  const textures = slides.map(() => null);
  function loadTex(i) {
    if (textures[i]) return Promise.resolve(textures[i]);
    return new Promise(res => {
      const img = new Image();
      img.onload = () => {
        const t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        textures[i] = t; res(t);
      };
      img.onerror = () => res(null);
      img.src = slides[i].src;
    });
  }

  let cur = 0, nxt = 1, prog01 = 0, animStart = 0, animating = false;
  let born = performance.now(), timer = null, dead = false;
  const DIRS = [[0.8, 0.6], [-0.7, 0.7], [0.2, 1.0], [1.0, 0.15], [-0.9, -0.4], [0.6, -0.8]];

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.75);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    if (canvas.width !== (w * dpr | 0) || canvas.height !== (h * dpr | 0)) {
      canvas.width = w * dpr | 0; canvas.height = h * dpr | 0;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
  }
  resize();                                    // size before the first visible frame
  addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) resize(); });

  function draw(now) {
    if (dead) return;
    resize();
    const t = (now - born) / 1000;
    if (animating) {
      prog01 = Math.min((now - animStart) / 1150, 1);
      if (prog01 >= 1) {                       // transition done: promote next
        animating = false; cur = nxt; prog01 = 0;
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, textures[cur]);
      }
    }
    gl.uniform1f(U.uProg, animating ? easeInOut(prog01) : 0);
    gl.uniform1f(U.uTime, t);
    gl.uniform1f(U.uCanvasA, canvas.width / canvas.height);
    gl.uniform1f(U.uA0, slides[cur].ar);
    gl.uniform1f(U.uA1, slides[nxt].ar);
    const z = 1.05 + 0.045 * Math.sin(t * 0.21);          // breathing Ken-Burns
    gl.uniform1f(U.uZoom0, z);
    gl.uniform1f(U.uZoom1, z);
    const d = DIRS[nxt % DIRS.length];
    gl.uniform2f(U.uDir, d[0], d[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(draw);
  }

  async function goto(i) {
    if (animating || dead) return;
    nxt = (i + slides.length) % slides.length;
    if (nxt === cur) return;
    const t = await loadTex(nxt);
    if (!t) { nxt = cur; return; }
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, t);
    animStart = performance.now(); animating = true;
    onSlide && onSlide(nxt);
    loadTex((nxt + 1) % slides.length);        // prefetch the one after
  }
  function schedule() {
    if (reduced || dead) return;
    clearInterval(timer);
    timer = setInterval(() => { if (!document.hidden) goto(cur + 1); }, interval);
  }

  loadTex(0).then(t0 => {
    if (!t0 || dead) return;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, t0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, t0);
    onSlide && onSlide(0);
    requestAnimationFrame(draw);
    loadTex(1);
    schedule();
  });

  return {
    next: () => { goto(cur + 1); schedule(); },
    prev: () => { goto(cur - 1); schedule(); },
    destroy: () => { dead = true; clearInterval(timer); },
  };
}

/* No-WebGL fallback: stacked <img> opacity crossfade. */
function initFallback(canvas, slides, { onSlide, interval, reduced }) {
  const host = canvas.parentElement;
  canvas.remove();
  const imgs = slides.map((s, i) => {
    const im = new Image();
    im.src = s.src; im.alt = ""; im.className = "hero-fallback";
    im.style.opacity = i === 0 ? "1" : "0";
    host.prepend(im);
    return im;
  });
  let cur = 0, timer = null;
  function goto(i) {
    const n = (i + slides.length) % slides.length;
    if (n === cur) return;
    imgs[cur].style.opacity = "0";
    imgs[n].style.opacity = "1";
    cur = n; onSlide && onSlide(n);
  }
  if (!reduced) timer = setInterval(() => { if (!document.hidden) goto(cur + 1); }, interval);
  onSlide && onSlide(0);
  return { next: () => goto(cur + 1), prev: () => goto(cur - 1), destroy: () => clearInterval(timer) };
}
