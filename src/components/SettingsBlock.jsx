import { useState, useEffect, useCallback } from "react";
import { Type, Contrast, Bell, Globe, Shield } from "lucide-react";
import useStore from "../store";
import { apiFetch } from "../lib/api";
import { langCodeFromSettingsLabel } from "../i18n/dictionaries";
import { useI18n } from "../contexts/LanguageContext.jsx";

const LANG_OPTIONS = ["English", "Hindi", "Tamil"];

export function SettingsBlock({ isElder }) {
  const { t } = useI18n();
  const authUser = useStore((s) => s.authUser);

  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [checkInReminders, setCheckInReminders] = useState(true);
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(!!authUser);
  const [saveError, setSaveError] = useState(null);

  const load = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    setSaveError(null);
    try {
      const s = await apiFetch("/api/me/settings");
      setLargeText(!!s.large_text);
      setHighContrast(!!s.high_contrast);
      setCheckInReminders(s.checkin_reminders !== false);
      const lab = s.language || "English";
      setLanguage(lab);
      try {
        localStorage.setItem("grace_lang", langCodeFromSettingsLabel(lab));
        window.dispatchEvent(new Event("grace-language"));
      } catch (_) {}
    } catch {
      /* keep defaults if offline */
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (partial) => {
    if (!authUser) return;
    setSaveError(null);
    try {
      await apiFetch("/api/me/settings", { method: "PATCH", body: JSON.stringify(partial) });
      window.dispatchEvent(new Event("grace-settings-updated"));
    } catch (e) {
      setSaveError(e.message || t("settings.saveError"));
    }
  };

  const toggleLarge = () => {
    const v = !largeText;
    setLargeText(v);
    patch({ large_text: v });
  };

  const toggleContrast = () => {
    const v = !highContrast;
    setHighContrast(v);
    patch({ high_contrast: v });
  };

  const toggleReminders = () => {
    const v = !checkInReminders;
    setCheckInReminders(v);
    patch({ checkin_reminders: v });
  };

  const changeLanguage = async (lang) => {
    setLanguage(lang);
    await patch({ language: lang });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">{t("profile.settingsTitle")}</h2>

      {saveError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3" role="alert">
          {saveError}
        </div>
      )}
      {loading && authUser && <div className="text-sm text-gray-500">{t("settings.syncing")}</div>}

      <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 p-4 border-b border-gray-50">
          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center" aria-hidden>
            <Type className="w-5 h-5 text-teal-700" />
          </div>
          <span className="font-semibold text-gray-900">{t("settings.accessibility")}</span>
        </div>
        <div className="divide-y divide-gray-50">
          <div className="flex items-center justify-between p-4">
            <div>
              <div className="font-medium text-gray-900">{t("settings.largeText")}</div>
              <div className="text-sm text-gray-500">{t("settings.largeTextHint")}</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={largeText}
              aria-label={t("settings.largeText")}
              onClick={toggleLarge}
              className={`relative w-11 h-6 rounded-full transition ${largeText ? "bg-emerald-600" : "bg-gray-200"}`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition left-1 ${largeText ? "translate-x-5" : ""}`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between p-4">
            <div>
              <div className="font-medium text-gray-900">{t("settings.highContrast")}</div>
              <div className="text-sm text-gray-500">{t("settings.highContrastHint")}</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={highContrast}
              aria-label={t("settings.highContrast")}
              onClick={toggleContrast}
              className={`relative w-11 h-6 rounded-full transition ${highContrast ? "bg-emerald-600" : "bg-gray-200"}`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition left-1 ${highContrast ? "translate-x-5" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 p-4 border-b border-gray-50">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center" aria-hidden>
            <Bell className="w-5 h-5 text-emerald-700" />
          </div>
          <span className="font-semibold text-gray-900">{t("settings.notifications")}</span>
        </div>
        <div className="flex items-center justify-between p-4">
          <div>
            <div className="font-medium text-gray-900">{t("settings.checkInReminders")}</div>
            <div className="text-sm text-gray-500">
              {isElder ? t("settings.checkInHintElder") : t("settings.checkInHintCaregiver")}
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={checkInReminders}
            aria-label={t("settings.checkInReminders")}
            onClick={toggleReminders}
            className={`relative w-11 h-6 rounded-full transition ${checkInReminders ? "bg-teal-600" : "bg-gray-200"}`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition left-1 ${checkInReminders ? "translate-x-5" : ""}`}
            />
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 p-4 border-b border-gray-50">
          <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center" aria-hidden>
            <Globe className="w-5 h-5 text-sky-600" />
          </div>
          <span className="font-semibold text-gray-900">{t("settings.language")}</span>
        </div>
        <div className="p-4">
          <label htmlFor="grace-lang" className="sr-only">
            {t("settings.languageSelectAria")}
          </label>
          <select
            id="grace-lang"
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 bg-white"
            aria-label={t("settings.languageSelectAria")}
          >
            {LANG_OPTIONS.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
      </div>

      <details className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm group">
        <summary className="flex items-center gap-3 p-4 cursor-pointer list-none">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center" aria-hidden>
            <Shield className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium text-gray-900">{t("settings.privacyTitle")}</div>
            <div className="text-sm text-gray-500">{t("settings.privacySub")}</div>
          </div>
          <span className="text-gray-400 group-open:rotate-90 transition" aria-hidden>
            ›
          </span>
        </summary>
        <div className="px-4 pb-4 text-sm text-gray-600 border-t border-gray-50 pt-3">
          <p className="mb-2">{t("settings.privacyP1")}</p>
          <p>{t("settings.privacyP2")}</p>
        </div>
      </details>
    </div>
  );
}

export default SettingsBlock;
