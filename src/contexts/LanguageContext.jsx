import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DICTS, langCodeFromSettingsLabel, settingsLabelFromCode } from "../i18n/dictionaries";

const LanguageContext = createContext({
  lang: "en",
  t: (k, _params) => (typeof k === "string" ? k : String(k)),
  setLangCode: () => {},
});

const STORAGE_KEY = "grace_lang";

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "en";
    } catch {
      return "en";
    }
  });

  useEffect(() => {
    const fn = () => {
      try {
        const v = localStorage.getItem(STORAGE_KEY);
        if (v && ["en", "hi", "ta"].includes(v)) setLang(v);
      } catch (_) {}
    };
    window.addEventListener("grace-language", fn);
    return () => window.removeEventListener("grace-language", fn);
  }, []);

  const t = useCallback(
    (key, params) => {
      const d = DICTS[lang] || DICTS.en;
      let s = d[key] ?? DICTS.en[key] ?? key;
      if (params != null && typeof s === "string") {
        for (const [k, v] of Object.entries(params)) {
          s = s.split(`{${k}}`).join(String(v));
        }
      }
      return s;
    },
    [lang]
  );

  const setLangCode = useCallback((code) => {
    const c = ["en", "hi", "ta"].includes(code) ? code : "en";
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch (_) {}
    setLang(c);
  }, []);

  useEffect(() => {
    try {
      document.documentElement.lang = lang === "hi" ? "hi" : lang === "ta" ? "ta" : "en";
    } catch (_) {}
  }, [lang]);

  const value = useMemo(() => ({ lang, t, setLangCode, settingsLabelFromCode, langCodeFromSettingsLabel }), [lang, t, setLangCode]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  return useContext(LanguageContext);
}
