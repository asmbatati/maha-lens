/* Maha Lens — photo manifest. Curated, one representative per photoshoot.
   No people, no female imagery. Four collections.

   Each photo: { coll, slug, title, title_ar, ar } — `ar` is width/height.
   Files are named by *nominal* size tier (-w640/-w1280/-w2000): the tier is
   the width for landscape photos and the HEIGHT for portrait ones (a portrait
   "w2000" file is 1333×2000). `cap` marks photos whose largest master is
   smaller than 2000px on the tier axis. REALW() resolves true pixel widths. */

const L = 1.5;      // landscape 3:2
const P = 2 / 3;    // portrait 2:3

export const PHOTOS = [
  // ── Product / commercial ──
  { coll: "product", slug: "gold-flacon", title: "Oud",        title_ar: "عود",          ar: P },
  { coll: "product", slug: "elixir",      title: "Elixir",     title_ar: "إكسير",        ar: P },
  { coll: "product", slug: "the-set",     title: "The Set",    title_ar: "الطقم",        ar: P },
  { coll: "product", slug: "lineup",      title: "The Line",   title_ar: "المجموعة",     ar: L },
  { coll: "product", slug: "glow",        title: "Glow",       title_ar: "توهّج",         ar: P },
  { coll: "product", slug: "royal-oud",   title: "Royal Oud",  title_ar: "عود ملكي",     ar: L },
  { coll: "product", slug: "petal",       title: "Petal",      title_ar: "بتلة",         ar: P },
  { coll: "product", slug: "tide",        title: "Tide",       title_ar: "مدّ",           ar: P },
  { coll: "product", slug: "bukhoor",     title: "Bukhoor",    title_ar: "بخور",         ar: L },
  { coll: "product", slug: "evergreen",   title: "Evergreen",  title_ar: "دائم الخضرة",  ar: P },
  { coll: "product", slug: "verdant",     title: "Verdant",    title_ar: "نضارة",        ar: P },
  { coll: "product", slug: "facet",       title: "Facet",      title_ar: "وجه",          ar: P },
  { coll: "product", slug: "ember",       title: "Ember",      title_ar: "جمر",          ar: P },
  // ── Gourmet ──
  { coll: "gourmet", slug: "harvest", title: "Harvest",        title_ar: "حصاد",     ar: L },
  { coll: "gourmet", slug: "cocoa",   title: "Cocoa",          title_ar: "كاكاو",    ar: L },
  { coll: "gourmet", slug: "amber",   title: "Amber",          title_ar: "كهرمان",   ar: L },
  { coll: "gourmet", slug: "honeyed", title: "Honeyed",        title_ar: "مُعسّل",    ar: P },
  { coll: "gourmet", slug: "stack",   title: "The Stack",      title_ar: "طبقات",    ar: L },
  { coll: "gourmet", slug: "sufra",   title: "Sufra",          title_ar: "سفرة",     ar: P },
  { coll: "gourmet", slug: "morning", title: "Morning",        title_ar: "صباح",     ar: L },
  { coll: "gourmet", slug: "maamoul", title: "Date & Nut",     title_ar: "تمر وجوز", ar: P },
  // ── Nature ──
  { coll: "nature", slug: "veil",       title: "Veil",           title_ar: "ضباب",          ar: L, cap: 1920 },
  { coll: "nature", slug: "last-light", title: "Last Light",     title_ar: "آخر الضوء",     ar: L, cap: 1920 },
  { coll: "nature", slug: "wildgold",   title: "Wildgold",       title_ar: "ذهب البرّ",      ar: L, cap: 1920 },
  { coll: "nature", slug: "umbrella",   title: "White Umbrella", title_ar: "المظلة البيضاء", ar: P, cap: 1920 },
  { coll: "nature", slug: "pollinate",  title: "Pollinate",      title_ar: "تلقيح",         ar: L },
  { coll: "nature", slug: "bloom",      title: "Bloom",          title_ar: "زهرة",          ar: L },
  { coll: "nature", slug: "dusk",       title: "Dusk",           title_ar: "غسق",           ar: L },
  { coll: "nature", slug: "almond",     title: "Almond Blossom", title_ar: "زهر اللوز",     ar: L },
  // ── Architecture & culture ──
  { coll: "architecture", slug: "minaret", title: "Minaret", title_ar: "مئذنة", ar: P },
  // ── Coverage (exhibitions, events) ──
  { coll: "coverage", slug: "legend", title: "Legend", title_ar: "أسطورة", ar: 1.229 },
  { coll: "coverage", slug: "soiree", title: "Soirée", title_ar: "سهرة",   ar: 1.2 },
];

export const COLLECTIONS = [
  { id: "product", n: "01", en: "Product", ar: "منتجات", lead_en: "Beauty, fragrance and objects — light shaped around the thing itself.", lead_ar: "تصوير لمختلف المنتجات." },
  { id: "gourmet", n: "02", en: "Gourmet", ar: "أطباق",  lead_en: "Food and craft, styled and lit to be tasted with the eyes.", lead_ar: "طعامٌ ليُتذوّق بالعين قبل اللسان." },
  { id: "nature",  n: "03", en: "Nature",  ar: "طبيعة",  lead_en: "Away from the studio — bloom, light, mist and last sun.", lead_ar: "تصوير للمظاهر الطبيعية." },
  { id: "architecture", n: "04", en: "Architecture", ar: "عمارة", lead_en: "Places and heritage — domes, minarets and light on stone.", lead_ar: "أماكن وتراث — قبابٌ ومآذن وضوءٌ على الحجر." },
  { id: "coverage", n: "05", en: "Coverage", ar: "تغطيات", lead_en: "On location — exhibitions, launches and the life of the show floor.", lead_ar: "تغطية المعارض والفعاليات والمناسبات." },
];

/* ASSET_V busts stale browser caches when files are re-encoded in place
   (e.g. orientation fixes) — bump it whenever pixels change under a same name. */
export const ASSET_V = 6;
export const SRC = (coll, slug, w) => `img/${coll}/${slug}-w${w}.webp?v=${ASSET_V}`;

/* Real pixel width of a size tier (portrait tiers are heights; see header note). */
export const REALW = (p, w) => {
  const capped = Math.min(w, p.cap ?? w);
  return p.ar < 1 ? Math.round(capped * p.ar) : capped;
};
export const SRCSET = p => [640, 1280, 2000]
  .map(w => `${SRC(p.coll, p.slug, w)} ${REALW(p, w)}w`).join(", ");
export const byColl = id => PHOTOS.filter(p => p.coll === id);

/* Hero slideshow reel — five signature photographs. */
const bySlug = s => PHOTOS.find(p => p.slug === s);
export const SLIDES = ["ember", "facet", "amber", "wildgold", "cocoa"].map(s => {
  const p = bySlug(s);
  return { src: SRC(p.coll, p.slug, 1280), ar: p.ar, title: p.title, title_ar: p.title_ar };
});

export const I18N = {
  en: {
    nav_work: "Work", nav_about: "About", nav_contact: "Contact", lang: "ع",
    lang_label: "التبديل إلى العربية",
    skip: "Skip to work",
    kicker: "Photographer",
    hero_hint: "Click to change the frame",
    intro: "A photographer's eye for <em>light, texture and stillness</em> — commercial work made with care, and the natural world in between.",
    about_eyebrow: "About",
    about: "I make photography of the things that inspire me and leave a mark. I like nature, culture, food, and product photography.",
    about_note: "Based in Saudi Arabia. Available for commissions.",
    contact_eyebrow: "Get in touch", contact_ig: "Instagram", contact_email: "Email", scroll: "Scroll",
    to_top: "Back to top",
    lb_label: "Photo viewer", lb_close: "Close", lb_prev: "Previous photo", lb_next: "Next photo",
    view: "View",
    hub_label: "Browse the collections",
  },
  ar: {
    nav_work: "الأعمال", nav_about: "نبذة", nav_contact: "تواصل", lang: "EN",
    lang_label: "Switch to English",
    skip: "تخطٍّ إلى الأعمال",
    kicker: "مصوّرة",
    hero_hint: "اضغط لتغيير الإطار",
    intro: "عينُ مصوّرةٍ تقتنص اللحظة بعدستها.",
    about_eyebrow: "نبذة",
    about: "أُصوّر ما يصنعه الناس والطبيعة الخلابة. أتلذذ بالتقاط اللحظات الساحرة.",
    about_note: "المملكة العربية السعودية. متاحة للتصوير.",
    contact_eyebrow: "تواصل معي", contact_ig: "إنستغرام", contact_email: "البريد", scroll: "مرّر",
    to_top: "إلى الأعلى",
    lb_label: "عارض الصور", lb_close: "إغلاق", lb_prev: "الصورة السابقة", lb_next: "الصورة التالية",
    view: "عرض",
    hub_label: "تصفّح الأقسام",
  },
};
