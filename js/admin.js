/* Maha Lens admin — phone-first CMS on Supabase (auth + storage + RLS).
   Uploads auto-orient (EXIF applied), strip all metadata (canvas re-encode),
   and emit the three webp tiers. Writes are RLS-locked to the admin emails. */
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPA_URL, SUPA_KEY } from "./config.js";

const supa = createClient(SUPA_URL, SUPA_KEY);
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const msg = (el, text, ok = true) => { el.textContent = text; el.className = `msg ${ok ? "ok" : "bad"}`; };

/* ── auth ── */
const authView = $("#authView"), appView = $("#appView");
$("#signIn").addEventListener("click", async () => {
  const { error } = await supa.auth.signInWithPassword({ email: $("#email").value.trim(), password: $("#password").value });
  if (error) msg($("#authMsg"), error.message, false);
});
$("#signUp").addEventListener("click", async () => {
  const { error } = await supa.auth.signUp({ email: $("#email").value.trim(), password: $("#password").value });
  msg($("#authMsg"), error ? error.message : "تم إنشاء الحساب — تفقّدي بريدك لتأكيد التسجيل ثم سجّلي الدخول.", !error);
});
$("#signOut").addEventListener("click", () => supa.auth.signOut());
supa.auth.onAuthStateChange((_e, session) => {
  const on = !!session;
  authView.classList.toggle("hidden", on);
  appView.classList.toggle("hidden", !on);
  $("#signOut").classList.toggle("hidden", !on);
  if (on) boot();
});

/* ── tabs ── */
$$(".tabs button").forEach(b => b.addEventListener("click", () => {
  $$(".tabs button").forEach(x => x.classList.toggle("on", x === b));
  ["photos", "sections", "copy"].forEach(t => $(`#tab-${t}`).classList.toggle("hidden", t !== b.dataset.tab));
}));

/* ── data ── */
let colls = [], photos = [];
async function boot() {
  const [c, p] = await Promise.all([
    supa.from("maha_collections").select("*").order("sort"),
    supa.from("maha_photos").select("*").order("sort"),
  ]);
  colls = c.data || []; photos = p.data || [];
  $("#collPick").innerHTML = colls.map(x => `<option value="${x.id}">${x.ar} · ${x.en}</option>`).join("");
  renderPhotos(); renderSections(); renderCopy();
}

/* ── photos tab ── */
const gate = $("#gateChk"), fileIn = $("#file"), upBtn = $("#upload");
gate.addEventListener("change", () => { fileIn.disabled = upBtn.disabled = !gate.checked; });
$("#collPick").addEventListener("change", renderPhotos);

function renderPhotos() {
  const coll = $("#collPick").value || colls[0]?.id;
  const list = photos.filter(p => p.coll === coll);
  $("#photoGrid").innerHTML = list.map(p => `
    <div class="ph ${p.published ? "" : "off"}" data-id="${p.id}">
      <img src="${p.src_640}" alt="" loading="lazy">
      <div class="pad">
        <input class="t" data-f="title_ar" value="${(p.title_ar || "").replace(/"/g, "&quot;")}">
        <input class="t2 ltr" data-f="title" value="${(p.title || "").replace(/"/g, "&quot;")}">
        <div class="row">
          <button class="ghost act-pub">${p.published ? "إخفاء" : "إظهار"}</button>
          <button class="ghost act-save">حفظ</button>
          <button class="danger act-del">حذف</button>
        </div>
      </div>
    </div>`).join("") || `<p class="note">لا صور في هذا القسم بعد.</p>`;
}
$("#photoGrid").addEventListener("click", async e => {
  const card = e.target.closest(".ph"); if (!card) return;
  const id = card.dataset.id;
  const p = photos.find(x => x.id === id);
  if (e.target.classList.contains("act-pub")) {
    const { error } = await supa.from("maha_photos").update({ published: !p.published }).eq("id", id);
    if (!error) { p.published = !p.published; renderPhotos(); }
  } else if (e.target.classList.contains("act-save")) {
    const title_ar = card.querySelector('[data-f="title_ar"]').value.trim();
    const title = card.querySelector('[data-f="title"]').value.trim();
    const { error } = await supa.from("maha_photos").update({ title, title_ar }).eq("id", id);
    e.target.textContent = error ? "خطأ" : "تم ✓";
    if (!error) { p.title = title; p.title_ar = title_ar; }
  } else if (e.target.classList.contains("act-del")) {
    if (!confirm("حذف الصورة نهائيًا؟")) return;
    const marker = "/storage/v1/object/public/photos/";
    if (p.src_640.includes(marker)) {
      const paths = [p.src_640, p.src_1280, p.src_2000].map(u => decodeURIComponent(u.split(marker)[1]));
      await supa.storage.from("photos").remove(paths);
    }
    const { error } = await supa.from("maha_photos").delete().eq("id", id);
    if (!error) { photos = photos.filter(x => x.id !== id); renderPhotos(); }
  }
});

async function processImage(file) {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const w = bmp.width, h = bmp.height, ar = w / h;
  const long = Math.max(w, h);
  const tiers = {};
  for (const tier of [640, 1280, 2000]) {
    const t = Math.min(tier, long);
    const tw = ar >= 1 ? t : Math.round(t * ar);
    const th = ar >= 1 ? Math.round(t / ar) : t;
    const cv = document.createElement("canvas");
    cv.width = tw; cv.height = th;
    cv.getContext("2d").drawImage(bmp, 0, 0, tw, th);   // re-encode = EXIF/GPS stripped
    tiers[tier] = await new Promise(res => cv.toBlob(res, "image/webp", 0.88));
  }
  bmp.close();
  return { tiers, ar, cap: long < 2000 ? long : null };
}
upBtn.addEventListener("click", async () => {
  const file = fileIn.files?.[0];
  if (!file) return msg($("#upMsg"), "اختاري صورة أولًا.", false);
  if (!gate.checked) return;
  const coll = $("#collPick").value;
  const title_ar = $("#newTitleAr").value.trim() || "بدون عنوان";
  const title = $("#newTitleEn").value.trim() || "Untitled";
  const prog = $("#upProg"); prog.classList.remove("hidden"); prog.value = 8;
  upBtn.disabled = true;
  try {
    const { tiers, ar, cap } = await processImage(file);
    prog.value = 30;
    const slug = `p-${Date.now().toString(36)}`;
    const urls = {};
    let step = 0;
    for (const [tier, blob] of Object.entries(tiers)) {
      const path = `${slug}-w${tier}.webp`;
      const { error } = await supa.storage.from("photos").upload(path, blob, { contentType: "image/webp", upsert: true });
      if (error) throw error;
      urls[tier] = supa.storage.from("photos").getPublicUrl(path).data.publicUrl;
      prog.value = 30 + (++step) * 20;
    }
    const maxSort = Math.max(0, ...photos.filter(p => p.coll === coll).map(p => p.sort));
    const row = { coll, slug, title, title_ar, ar: +ar.toFixed(4), cap,
      src_640: urls[640], src_1280: urls[1280], src_2000: urls[2000], sort: maxSort + 10 };
    const { data, error } = await supa.from("maha_photos").insert(row).select().single();
    if (error) throw error;
    photos.push(data);
    prog.value = 100;
    msg($("#upMsg"), "تم الرفع ✓ — الصورة ظاهرة في الموقع الآن.");
    $("#newTitleAr").value = $("#newTitleEn").value = ""; fileIn.value = "";
    renderPhotos();
  } catch (err) {
    msg($("#upMsg"), `تعذّر الرفع: ${err.message || err}`, false);
  } finally {
    upBtn.disabled = !gate.checked;
    setTimeout(() => $("#upProg").classList.add("hidden"), 800);
  }
});

/* ── sections tab (suspend/enable + leads) ── */
function renderSections() {
  $("#tab-sections").innerHTML = colls.map(c => `
    <div class="card" data-id="${c.id}">
      <div class="row" style="justify-content:space-between">
        <strong>${c.ar} · <span class="ltr" style="display:inline-block">${c.en}</span></strong>
        <label class="row" style="margin:0;font-size:.85rem;color:var(--ivory)">
          <input type="checkbox" data-f="enabled" ${c.enabled ? "checked" : ""}> ظاهر
        </label>
      </div>
      <label>الوصف (عربي)</label>
      <textarea data-f="lead_ar">${c.lead_ar || ""}</textarea>
      <label>Lead (English)</label>
      <textarea data-f="lead_en" class="ltr">${c.lead_en || ""}</textarea>
      <div class="row" style="margin-top:.7rem"><button class="sec-save">حفظ</button><span class="msg"></span></div>
    </div>`).join("");
}
$("#tab-sections").addEventListener("click", async e => {
  if (!e.target.classList.contains("sec-save")) return;
  const card = e.target.closest(".card");
  const patch = {
    enabled: card.querySelector('[data-f="enabled"]').checked,
    lead_ar: card.querySelector('[data-f="lead_ar"]').value,
    lead_en: card.querySelector('[data-f="lead_en"]').value,
  };
  const { error } = await supa.from("maha_collections").update(patch).eq("id", card.dataset.id);
  msg(card.querySelector(".msg"), error ? error.message : "تم ✓", !error);
});

/* ── copy tab ── */
const COPY_LABELS = { intro: "المقدمة", about: "نبذة", about_note: "سطر التواصل" };
async function renderCopy() {
  const { data } = await supa.from("maha_site_copy").select("*");
  const rows = data || [];
  $("#tab-copy").innerHTML = Object.entries(COPY_LABELS).map(([key, label]) => {
    const row = rows.find(r => r.key === key) || { en: "", ar: "" };
    return `<div class="card" data-key="${key}">
      <strong>${label}</strong>
      <label>عربي</label><textarea data-f="ar">${row.ar}</textarea>
      <label>English</label><textarea data-f="en" class="ltr">${row.en}</textarea>
      <div class="row" style="margin-top:.7rem"><button class="copy-save">حفظ</button><span class="msg"></span></div>
    </div>`;
  }).join("");
}
$("#tab-copy").addEventListener("click", async e => {
  if (!e.target.classList.contains("copy-save")) return;
  const card = e.target.closest(".card");
  const row = { key: card.dataset.key,
    ar: card.querySelector('[data-f="ar"]').value,
    en: card.querySelector('[data-f="en"]').value };
  const { error } = await supa.from("maha_site_copy").upsert(row);
  msg(card.querySelector(".msg"), error ? error.message : "تم ✓", !error);
});
