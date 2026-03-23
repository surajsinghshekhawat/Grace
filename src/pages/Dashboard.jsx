import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { WellnessCard } from "../components/WellnessCard";
import { WellnessButton } from "../components/WellnessButton";
import { Heart, FileText, Lightbulb, TrendingUp, Brain, Sparkles, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import useStore from "../store";
import { apiFetch } from "../lib/api";
import { getAssessmentEntryPath } from "../lib/assessmentEntry";
import { qolPercentForBar, qolScoreOutOf10 } from "../lib/wellbeing";
import { useI18n } from "../contexts/LanguageContext.jsx";

function localeFromLang(lang) {
  if (lang === "hi") return "hi-IN";
  if (lang === "ta") return "ta-IN";
  return undefined;
}

function formatCheckInTime(iso, lang) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString(localeFromLang(lang), { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "";
  }
}

function checkinScaleLabel(n, t) {
  const v = Number(n);
  if (!v || v < 1 || v > 5) return "—";
  return t(`dash.chkLvl${v}`);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const authUser = useStore((s) => s.authUser);
  const userName = authUser?.name || t("dash.guestName");

  const [assessments, setAssessments] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [insights, setInsights] = useState(null);
  const [medAdherence, setMedAdherence] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!authUser || authUser.role !== "elder") return;
    let cancelled = false;
    (async () => {
      try {
        setLoadError(null);
        const [a, c, ins, adh] = await Promise.all([
          apiFetch("/api/elder/assessments?limit=3").catch(() => []),
          apiFetch("/api/check-ins/daily?days=14").catch(() => []),
          apiFetch(`/api/elder/wellbeing-insights?lang=${encodeURIComponent(lang)}`).catch(() => null),
          apiFetch("/api/elder/medication-adherence?days=7").catch(() => null),
        ]);
        if (!cancelled) {
          setAssessments(Array.isArray(a) ? a : []);
          setCheckIns(Array.isArray(c) ? c : []);
          setInsights(ins && typeof ins === "object" ? ins : null);
          setMedAdherence(adh && typeof adh === "object" ? adh : null);
        }
      } catch (e) {
        if (!cancelled) setLoadError(e.message || t("dash.loadError"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authUser, t, lang]);

  const latestAssessment = assessments[0];
  const qol10FromStore = qolScoreOutOf10(latestAssessment);
  const qol10 =
    insights?.has_assessment && typeof insights.qol_out_of_10 === "number"
      ? insights.qol_out_of_10
      : qol10FromStore;
  const qolBarPct =
    insights?.has_assessment && typeof insights.blended_qol_0_100 === "number"
      ? Math.min(100, Math.max(0, insights.blended_qol_0_100))
      : qolPercentForBar(latestAssessment);

  const prevAssessment = assessments[1];
  const prevQol10 = qolScoreOutOf10(prevAssessment);
  const qolDelta =
    qol10 != null && prevQol10 != null ? Math.round((qol10 - prevQol10) * 10) / 10 : null;

  const lastCheckIn = checkIns[0];

  const mentalScore =
    insights?.has_assessment && typeof insights.mental_wellbeing_0_100 === "number"
      ? Math.round(insights.mental_wellbeing_0_100)
      : latestAssessment && typeof latestAssessment.depression_probability === "number"
        ? Math.round((1 - latestAssessment.depression_probability) * 100)
        : null;

  const wellnessIndex =
    insights?.has_assessment && typeof insights.wellness_index_0_100 === "number"
      ? Math.round(insights.wellness_index_0_100)
      : null;

  const recommendations = useMemo(() => {
    const factors = insights?.recommendations || insights?.top_factors;
    if (factors?.length) {
      return factors.slice(0, 8).map((f) => ({
        title: f.name || t("dash.insightFallback"),
        desc: f.effect || "",
        resourceSlug: f.resource_slug || null,
      }));
    }
    const legacy = latestAssessment?.top_factors;
    if (!legacy?.length) return [];
    return legacy.slice(0, 6).map((f) => ({
      title: f.name || t("dash.insightFallback"),
      desc: f.effect || "",
      resourceSlug: f.resource_slug || null,
    }));
  }, [insights, latestAssessment, t]);

  const openResource = (slug) => {
    if (!slug) navigate("/elder/resources");
    else navigate(`/elder/resources?highlight=${encodeURIComponent(slug)}`);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      <div className="px-6 pt-12 pb-8 bg-slate-100 border-b border-slate-200/80">
        <div className="max-w-[600px] mx-auto">
          <h1 className="text-gray-800 mb-2" style={{ fontSize: "32px", fontWeight: 700 }}>
            {t("dash.hello")}, {userName}
          </h1>
          <p className="text-gray-600" style={{ fontSize: "16px" }}>
            {t("dash.greeting")}
          </p>
        </div>
      </div>

      <div className="px-6 -mt-4 max-w-[600px] mx-auto space-y-6">
        {loadError && (
          <div className="rounded-[16px] border border-teal-200 bg-teal-50 text-teal-900 text-sm p-4">{loadError}</div>
        )}

        {medAdherence?.reminder_message && medAdherence.medication_count > 0 && (
          <button
            type="button"
            onClick={() => navigate("/elder/health")}
            className="w-full text-left rounded-[16px] border border-teal-300 bg-teal-50 px-4 py-3 shadow-sm hover:bg-teal-100/80 transition-colors"
          >
            <p className="text-teal-950 text-sm font-semibold">{t("dash.medReminderTitle")}</p>
            <p className="text-teal-900/90 text-sm mt-1 leading-relaxed">{medAdherence.reminder_message}</p>
            <p className="text-teal-800 text-xs font-bold mt-2">{t("dash.medOpenHealth")}</p>
          </button>
        )}

        {latestAssessment?.assessment_confidence_hint && (
          <div
            className={`rounded-[16px] border text-sm p-4 leading-relaxed ${
              latestAssessment.assessment_flow === "weekly"
                ? "border-teal-200 bg-teal-50/90 text-teal-950"
                : "border-slate-200 bg-slate-50 text-slate-800"
            }`}
          >
            <span className="font-semibold block mb-1">
              {t("dash.aboutScore")}
              {typeof latestAssessment.answered_question_count === "number"
                ? ` · ${t("dash.nAnswers", { n: latestAssessment.answered_question_count })}`
                : ""}
            </span>
            {latestAssessment.assessment_confidence_hint}
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <WellnessCard gradient={false}>
            <div className="space-y-3">
              <WellnessButton
                variant="primary"
                size="large"
                onClick={() => navigate("/elder/checkin")}
                className="w-full flex items-center justify-center gap-3"
              >
                <Heart size={24} />
                <span style={{ fontSize: "18px" }}>{t("dash.daily")}</span>
              </WellnessButton>
              <WellnessButton
                variant="secondary"
                size="large"
                onClick={() => navigate(getAssessmentEntryPath())}
                className="w-full flex items-center justify-center gap-3"
              >
                <FileText size={24} />
                <span style={{ fontSize: "18px" }}>{t("dash.weekly")}</span>
              </WellnessButton>
              <WellnessButton
                variant="outline"
                size="large"
                onClick={() => navigate("/elder/share")}
                className="w-full flex items-center justify-center gap-3"
              >
                <FileText size={22} />
                <span style={{ fontSize: "17px" }}>{t("profile.linkCaregiver")}</span>
              </WellnessButton>
            </div>
          </WellnessCard>
        </motion.div>

        {(qol10 != null || mentalScore != null || wellnessIndex != null) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <WellnessCard hover>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-2 text-slate-700 text-sm font-semibold">
                  <Sparkles size={18} className="text-violet-600" />
                  {t("dash.wellnessIndex")}
                  {wellnessIndex != null && (
                    <span className="ml-auto text-2xl font-bold text-violet-700">{wellnessIndex}</span>
                  )}
                </div>
                {wellnessIndex != null && (
                  <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, wellnessIndex)}%` }}
                      transition={{ duration: 0.7 }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    />
                  </div>
                )}
                <p className="text-xs text-gray-500 leading-relaxed">{t("dash.wellnessHint")}</p>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="rounded-xl bg-violet-50 border border-violet-100 p-3">
                    <div className="flex items-center gap-2 text-violet-800 text-xs font-semibold mb-1">
                      <TrendingUp size={14} />
                      {t("dash.qol")}
                    </div>
                    {qol10 != null ? (
                      <>
                        <p className="text-2xl font-bold text-gray-900">
                          {qol10}
                          <span className="text-base text-gray-500 font-semibold">/10</span>
                        </p>
                        <div className="h-1.5 bg-violet-200/80 rounded-full overflow-hidden mt-2">
                          <div className="h-full bg-violet-500 rounded-full" style={{ width: `${qolBarPct}%` }} />
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">—</p>
                    )}
                  </div>
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                    <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold mb-1">
                      <Brain size={14} />
                      {t("dash.mental")}
                    </div>
                    {mentalScore != null ? (
                      <>
                        <p className="text-2xl font-bold text-gray-900">
                          {mentalScore}
                          <span className="text-base text-gray-500 font-semibold">/100</span>
                        </p>
                        <div className="h-1.5 bg-emerald-200/80 rounded-full overflow-hidden mt-2">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${mentalScore}%` }} />
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">—</p>
                    )}
                  </div>
                </div>
                {qolDelta != null && assessments.length >= 2 && (
                  <div
                    className={`flex items-center gap-2 text-xs font-semibold ${
                      qolDelta >= 0 ? "text-emerald-700" : "text-cyan-700"
                    }`}
                  >
                    <TrendingUp size={14} className={qolDelta < 0 ? "rotate-180" : ""} />
                    <span>
                      {t("dash.qolDeltaVsPrev", {
                        delta: `${qolDelta >= 0 ? "+" : ""}${qolDelta}`,
                      })}
                    </span>
                  </div>
                )}
                <p className="text-[11px] text-slate-500 border-t border-slate-100 pt-2">{t("dash.sameEngine")}</p>
              </div>
            </WellnessCard>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <WellnessCard hover>
            <button type="button" onClick={() => navigate("/elder/resources")} className="w-full text-center">
              <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-3">
                <Heart size={24} className="text-violet-600" />
              </div>
              <p className="text-gray-800" style={{ fontSize: "14px", fontWeight: 600 }}>
                {t("dash.resources")}
              </p>
            </button>
          </WellnessCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <WellnessCard>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                <Heart size={24} className="text-slate-700" />
              </div>
              <div>
                <h3 className="text-gray-800 mb-1" style={{ fontSize: "18px", fontWeight: 600 }}>
                  {t("dash.lastCheckin")}
                </h3>
                {lastCheckIn ? (
                  <p className="text-gray-500" style={{ fontSize: "14px" }}>
                    {formatCheckInTime(lastCheckIn.created_at, lang)}
                  </p>
                ) : (
                  <p className="text-gray-500" style={{ fontSize: "14px" }}>
                    {t("dash.noCheckin")}
                  </p>
                )}
              </div>
            </div>
            {lastCheckIn && (
              <div className="space-y-3">
                {[
                  { label: t("prog.radarMood"), value: checkinScaleLabel(lastCheckIn.mood, t), key: "mood" },
                  { label: t("prog.radarEnergy"), value: checkinScaleLabel(lastCheckIn.energy, t), key: "energy" },
                  { label: t("prog.radarSleep"), value: checkinScaleLabel(lastCheckIn.sleep, t), key: "sleep" },
                ].map((item) => (
                  <div key={item.key} className="flex justify-between items-center p-3 rounded-[12px] bg-gray-50">
                    <span className="text-gray-700" style={{ fontSize: "14px", fontWeight: 500 }}>
                      {item.label}
                    </span>
                    <span
                      className="px-3 py-1 rounded-full text-white bg-slate-600"
                      style={{ fontSize: "13px", fontWeight: 600 }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => navigate("/elder/progress")}
              className="w-full mt-4 text-emerald-700 hover:text-emerald-800 transition-colors"
              style={{ fontSize: "14px", fontWeight: 600 }}
            >
              {t("dash.viewResults")}
            </button>
          </WellnessCard>
        </motion.div>

        {recommendations.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <WellnessCard>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <Lightbulb size={24} className="text-teal-700" />
                </div>
                <h2 className="text-gray-800" style={{ fontSize: "20px", fontWeight: 600 }}>
                  {t("dash.forYou")}
                </h2>
              </div>
              <div className="space-y-3">
                {recommendations.map((rec, i) => (
                  <div key={i} className="p-4 rounded-[16px] border-l-4 border-teal-400 bg-teal-50/50">
                    <p className="text-gray-800 mb-1" style={{ fontSize: "14px", fontWeight: 600 }}>
                      {rec.title}
                    </p>
                    {rec.desc ? (
                      <p className="text-gray-600 mb-2" style={{ fontSize: "13px" }}>
                        {rec.desc}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => openResource(rec.resourceSlug)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-900"
                    >
                      <ExternalLink size={12} />
                      {t("dash.viewResource")}
                    </button>
                  </div>
                ))}
              </div>
            </WellnessCard>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="rounded-[20px] p-6 text-center bg-slate-800 text-white">
            <p className="mb-2" style={{ fontSize: "18px", fontWeight: 600 }}>
              {t("dash.keepGoing")}
            </p>
            <p className="text-white/85" style={{ fontSize: "14px" }}>
              {t("dash.keepGoingSub")}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
