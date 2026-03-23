import { DICTS } from "./dictionaries";

/** Read UI string without React hooks (class components, pre-hydration). Uses `grace_lang` + `DICTS`. */
export function dictLookup(key) {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem("grace_lang") : null;
    const lang = ["en", "hi", "ta"].includes(raw) ? raw : "en";
    const d = DICTS[lang] || DICTS.en;
    return d[key] ?? DICTS.en[key] ?? key;
  } catch {
    return DICTS.en[key] ?? key;
  }
}
