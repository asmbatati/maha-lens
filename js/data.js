/* Maha Omar — photographer. Curated, one representative per photoshoot.
   No people, no female imagery. Three collections. */

export const PHOTOS = [
  // ── Product / commercial ──
  { coll: "product", slug: "gold-flacon", title: "Oud",       title_ar: "عود" },
  { coll: "product", slug: "elixir",      title: "Elixir",    title_ar: "إكسير" },
  { coll: "product", slug: "the-set",     title: "The Set",   title_ar: "الطقم" },
  { coll: "product", slug: "glow",        title: "Glow",      title_ar: "توهّج" },
  { coll: "product", slug: "petal",       title: "Petal",     title_ar: "بتلة" },
  { coll: "product", slug: "evergreen",   title: "Evergreen", title_ar: "دائم الخضرة" },
  { coll: "product", slug: "tide",        title: "Tide",      title_ar: "مدّ" },
  { coll: "product", slug: "verdant",     title: "Verdant",   title_ar: "نضارة" },
  { coll: "product", slug: "facet",       title: "Facet",     title_ar: "وجه" },
  // ── Gourmet ──
  { coll: "gourmet", slug: "harvest", title: "Harvest",     title_ar: "حصاد" },
  { coll: "gourmet", slug: "amber",   title: "Amber",       title_ar: "كهرمان" },
  { coll: "gourmet", slug: "honeyed", title: "Honeyed",     title_ar: "مُعسّل" },
  { coll: "gourmet", slug: "maamoul", title: "Date & Nut",  title_ar: "تمر وجوز" },
  // ── Nature ──
  { coll: "nature", slug: "veil",       title: "Veil",          title_ar: "ضباب" },
  { coll: "nature", slug: "last-light", title: "Last Light",    title_ar: "آخر الضوء" },
  { coll: "nature", slug: "wildgold",   title: "Wildgold",      title_ar: "ذهب البرّ" },
  { coll: "nature", slug: "pollinate",  title: "Pollinate",     title_ar: "تلقيح" },
  { coll: "nature", slug: "bloom",      title: "Bloom",         title_ar: "زهرة" },
  { coll: "nature", slug: "dusk",       title: "Dusk",          title_ar: "غسق" },
  { coll: "nature", slug: "almond",     title: "Almond Blossom", title_ar: "زهر اللوز" },
];

export const COLLECTIONS = [
  { id: "product", n: "01", en: "Product", ar: "منتجات", lead_en: "Beauty, fragrance and objects — light shaped around the thing itself.", lead_ar: "جمال وعطر وأشياء — ضوءٌ يُنحَت حول الشيء نفسه." },
  { id: "gourmet", n: "02", en: "Gourmet", ar: "ضيافة",  lead_en: "Food and craft, styled and lit to be tasted with the eyes.", lead_ar: "طعامٌ وحِرفة، يُنسَّق ويُضاء ليُتذوّق بالعين." },
  { id: "nature",  n: "03", en: "Nature",  ar: "طبيعة",  lead_en: "Away from the studio — bloom, light, mist and last sun.", lead_ar: "بعيدًا عن الاستوديو — زهرٌ وضوءٌ وضبابٌ وآخر الشمس." },
];


export const SRC = (coll, slug, w) => `img/${coll}/${slug}-w${w}.webp`;
export const SRCSET = (coll, slug) => [640, 1280, 2000].map(w => `${SRC(coll, slug, w)} ${w}w`).join(", ");
export const byColl = id => PHOTOS.filter(p => p.coll === id);

export const I18N = {
  en: {
    nav_work: "Work", nav_about: "About", nav_contact: "Contact", lang: "ع",
    kicker: "Photographer",
    intro: "A photographer's eye for <em>light, texture and stillness</em> — commercial work made with care, and the natural world in between.",
    about_eyebrow: "About",
    about: "I make photographs of the things people make — fragrance, food, objects — and of the world that needs no making at all. My work lives in soft light, honest texture, and a quiet sense of stillness.",
    about_note: "Based in Saudi Arabia. Available for product, beauty, food and editorial commissions.",
    contact_eyebrow: "Get in touch", contact_ig: "Instagram", contact_email: "Email", scroll: "Scroll",
  },
  ar: {
    nav_work: "الأعمال", nav_about: "نبذة", nav_contact: "تواصل", lang: "EN",
    kicker: "مصوّرة",
    intro: "عينُ مصوّرةٍ تقتنص <em>الضوء والملمس والسكون</em> — أعمالٌ تجارية بعناية، وعالمٌ طبيعيّ بينها.",
    about_eyebrow: "نبذة",
    about: "أُصوّر ما يصنعه الناس — العطر والطعام والأشياء — وأُصوّر العالم الذي لا يحتاج صناعة. يعيش عملي في الضوء الناعم والملمس الصادق وإحساسٍ هادئ بالسكون.",
    about_note: "مقيمة في المملكة العربية السعودية. متاحة لتصوير المنتجات والجمال والطعام والتحرير.",
    contact_eyebrow: "تواصل معي", contact_ig: "إنستغرام", contact_email: "البريد", scroll: "مرّر",
  },
};
