import { useI18n } from "../contexts/LanguageContext.jsx";

const LANGS = [
  { code: "en", short: "EN" },
  { code: "hi", short: "HI" },
  { code: "ta", short: "TA" },
];

/**
 * Compact language toggle for unauthenticated routes (persists via LanguageContext).
 */
export function PublicLanguageSwitcher({ className = "" }) {
  const { lang, setLangCode, t } = useI18n();

  return (
    <div
      className={`flex items-center justify-end gap-1 ${className}`}
      role="group"
      aria-label={t("welcome.langAria")}
    >
      {LANGS.map(({ code, short }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLangCode(code)}
          className={`min-h-[44px] min-w-[44px] rounded-xl px-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
            lang === code
              ? "bg-white/90 text-emerald-700 shadow-sm"
              : "text-gray-600 hover:bg-white/50"
          }`}
          aria-pressed={lang === code}
        >
          {short}
        </button>
      ))}
    </div>
  );
}
