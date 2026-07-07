/* Remote manifest — photos / collections / copy managed by Maha via admin.html.
   Falls back to the bundled data.js manifest when offline or slow. */
import { SUPA_URL, SUPA_KEY } from "./config.js?v=14";

const HEADERS = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };
const q = path => fetch(`${SUPA_URL}/rest/v1/${path}`, { headers: HEADERS })
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });

export async function loadRemote(timeoutMs = 2500) {
  try {
    const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), timeoutMs));
    const [photos, collections, copy] = await Promise.race([
      Promise.all([
        q("maha_photos?select=*&published=eq.true&order=sort.asc"),
        q("maha_collections?select=*&enabled=eq.true&order=sort.asc"),
        q("maha_site_copy?select=*"),
      ]),
      timeout,
    ]);
    if (!Array.isArray(photos) || !photos.length || !collections.length) return null;
    return { photos, collections, copy: copy || [] };
  } catch (e) {
    return null;   // bundled manifest takes over
  }
}
