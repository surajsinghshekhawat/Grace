import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardList, Heart, Bell, Activity } from "lucide-react";

import useStore from "../store";
import { apiFetch } from "../lib/api";
import { useI18n } from "../contexts/LanguageContext.jsx";
import { CaregiverElderProgressBlock } from "../components/caregiver/CaregiverElderProgressBlock.jsx";

function formatCheckInAgo(iso, t) {
  if (!iso) return t("cgHome.time.noCheckin");
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / (1000 * 60 * 60);
  if (diff < 1) return t("cgHome.time.minsAgo", { n: Math.round(diff * 60) });
  if (diff < 24) return t("cgHome.time.hoursAgo", { n: Math.round(diff) });
  return t("cgHome.time.daysAgo", { n: Math.round(diff / 24) });
}

const CaregiverElderDetail = () => {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const { elderUserId } = useParams();
  const resetAssessment = useStore((s) => s.resetAssessment);

  const [summary, setSummary] = useState(null);
  const [adherence, setAdherence] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const elderId = Number(elderUserId);

  const load = useCallback(async () => {
    if (!Number.isFinite(elderId) || elderId <= 0) {
      setError(t("cgDetail.invalidElder"));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/api/caregiver/elders/${elderId}/summary?days=30`);
      setSummary(data);
    } catch (e) {
      setError(e.message);
    }
    try {
      const [adh, asm, ins] = await Promise.all([
        apiFetch(`/api/caregiver/elders/${elderId}/medication-adherence?days=7`).catch(() => null),
        apiFetch(`/api/caregiver/elders/${elderId}/assessments?limit=36`).catch(() => []),
        apiFetch(`/api/caregiver/elders/${elderId}/wellbeing-insights?lang=${encodeURIComponent(lang)}`).catch(() => null),
      ]);
      setAdherence(adh && typeof adh === "object" ? adh : null);
      setAssessments(Array.isArray(asm) ? asm : []);
      setInsights(ins && typeof ins === "object" ? ins : null);
    } catch {
      setAdherence(null);
      setAssessments([]);
      setInsights(null);
    } finally {
      setLoading(false);
    }
  }, [elderId, t, lang]);

  useEffect(() => {
    load();
  }, [load]);

  const elderName = summary?.elder_name || t("link.cg.elderFallback", { id: elderId });
  const initials = elderName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const lastCheckIn = summary?.recent_check_ins?.[0];
  const lastCheckInAgo = formatCheckInAgo(lastCheckIn?.created_at, t);
  const checkIns = summary?.recent_check_ins ?? [];

  const latestAssessment = summary?.latest_assessment || null;
  const primaryAssessment = latestAssessment || assessments[0] || null;

  const recommendationItems = useMemo(() => {
    const fromInsights = insights?.recommendations?.length
      ? insights.recommendations
      : insights?.top_factors?.length
        ? insights.top_factors
        : null;
    if (fromInsights?.length) {
      return fromInsights.slice(0, 10).map((f) => ({
        title: f.name || t("dash.insightFallback"),
        desc: f.effect || "",
      }));
    }
    const legacy = primaryAssessment?.top_factors;
    if (!legacy?.length) return [];
    return legacy.slice(0, 8).map((f) => ({
      title: f.name || t("dash.insightFallback"),
      desc: f.effect || "",
    }));
  }, [insights, primaryAssessment, t]);

  const startAssessment = () => {
    resetAssessment();
    navigate(`/caregiver/elders/${elderId}/assessment`);
  };

  const serverUnreachable = error && /Can't connect to server/i.test(error);

  return (
    <div className="space-y-5 pb-2">
      <button
        type="button"
        onClick={() => navigate("/caregiver")}
        className="flex items-center gap-2 text-gray-600 text-sm font-medium min-h-[44px] -mt-1 mb-1 hover:text-emerald-800 transition-colors"
        aria-label={t("auth.back")}
      >
        <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden /> {t("auth.back")}
      </button>

      <div
        className="px-4 sm:px-6 pt-8 pb-6 -mx-4 rounded-2xl border border-emerald-100/80 shadow-sm"
        style={{ background: "linear-gradient(135deg, #ECFDF5 0%, #ECFEFF 100%)" }}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm" aria-hidden>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-gray-900 truncate">{elderName}</h1>
            <p className="text-sm text-gray-600 mt-0.5">
              {t("cgHome.lastCheckinLabel")} {lastCheckInAgo}
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={() => alert(t("cgDetail.reminderSoon"))}
            className="flex-1 py-3 rounded-2xl border-2 border-emerald-600 text-emerald-700 font-semibold flex items-center justify-center gap-2"
          >
            <Bell className="w-5 h-5" aria-hidden /> {t("cgDetail.sendReminder")}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 sm:p-5" role="alert">
          <div className="text-red-700 font-semibold">{t("cgDetail.errorTitle")}</div>
          <div className="text-red-700 text-sm mt-1">{serverUnreachable ? t("cgDetail.serverUnreachable") : error}</div>
          <button type="button" onClick={load} className="mt-3 px-4 py-2 rounded-xl border border-red-300 text-red-700 text-sm font-medium">
            {t("cgDetail.tryAgain")}
          </button>
        </div>
      )}

      {adherence && adherence.medication_count > 0 && typeof adherence.adherence_pct === "number" && (
        <div className="rounded-2xl border border-teal-200 p-4 shadow-sm bg-teal-50/80 sm:p-5">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-teal-700" aria-hidden />
            <h2 className="font-semibold text-gray-900">{t("cgDetail.med7d")}</h2>
          </div>
          <div className="flex items-end gap-1 mb-2">
            <span className="text-3xl font-bold text-teal-800">{adherence.adherence_pct}</span>
            <span className="text-teal-700 font-semibold mb-1">%</span>
          </div>
          <div className="h-2 bg-teal-200/70 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-teal-600 rounded-full" style={{ width: `${adherence.adherence_pct}%` }} />
          </div>
          <p className="text-sm text-gray-700">
            {t("cgDetail.doseDays", { covered: adherence.covered_dose_days, expected: adherence.expected_dose_days })} ·{" "}
            {adherence.medication_count === 1
              ? t("cgDetail.medOne", { n: adherence.medication_count })
              : t("cgDetail.medMany", { n: adherence.medication_count })}
          </p>
          {adherence.unmarked_today_count > 0 && (
            <p className="text-sm text-teal-800 mt-2 font-medium">{t("cgDetail.unmarkedToday", { n: adherence.unmarked_today_count })}</p>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">{t("cgDetail.quickActions")}</h2>
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => navigate(`/caregiver/elders/${elderId}/checkin`)}
            className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-emerald-700"
          >
            <Heart className="w-5 h-5" aria-hidden /> {t("dash.daily")}
          </button>
          <button
            type="button"
            onClick={startAssessment}
            className="w-full py-3 rounded-2xl bg-teal-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-teal-700"
          >
            <ClipboardList className="w-5 h-5" aria-hidden /> {t("dash.weekly")}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/caregiver/medications?elder=${elderId}`)}
            className="w-full py-3 rounded-2xl border border-emerald-300 text-emerald-700 font-semibold flex items-center justify-center gap-2 hover:bg-emerald-50"
          >
            <Activity className="w-5 h-5" aria-hidden /> {t("cgDetail.manageMeds")}
          </button>
        </div>
      </div>

      {!error && (
        <section aria-labelledby="cg-elder-progress-heading">
          <h2 id="cg-elder-progress-heading" className="sr-only">
            {t("cgDetail.progressTitle")}
          </h2>
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-gray-500 text-sm">{t("mod.loading")}</div>
          ) : (
            <CaregiverElderProgressBlock assessments={assessments} checkIns={checkIns} insights={insights} lang={lang} t={t} />
          )}
        </section>
      )}

      {!loading && primaryAssessment && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-2 text-lg">{t("cgDetail.recommendationsTitle")}</h2>
          <p className="text-sm text-gray-700 mb-4 leading-relaxed">
            {t("cgDetail.insightSummary", {
              risk: String(primaryAssessment.depression_risk || "unknown"),
              qol: String(primaryAssessment.qol_score_0_100 ?? 0),
            })}
          </p>
          {recommendationItems.length > 0 ? (
            <div className="space-y-3">
              {recommendationItems.map((r, i) => (
                <div key={`rec-${i}`} className="rounded-xl border border-teal-100 bg-teal-50/60 p-3 sm:p-4">
                  <p className="text-sm font-semibold text-gray-900">{r.title}</p>
                  {r.desc ? <p className="text-xs text-gray-700 mt-1.5 leading-relaxed">{r.desc}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">{t("cgDetail.noRecommendations")}</p>
          )}
        </div>
      )}

      {!loading && !primaryAssessment && !error && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-2">{t("cgDetail.recommendationsTitle")}</h2>
          <p className="text-sm text-gray-600">{t("cgDetail.noInsightsYet")}</p>
        </div>
      )}
    </div>
  );
};

export default CaregiverElderDetail;
