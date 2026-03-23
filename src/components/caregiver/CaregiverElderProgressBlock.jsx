/**
 * Progress / charts for a linked elder — mirrors Elder Progress (infographics, trends, radar).
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import { WellnessCard } from "../WellnessCard";
import { TrendingUp, Heart, Info } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  depressionWellbeingScore,
  qolPercentForBar,
  qolScoreOutOf10,
} from "../../lib/wellbeing";
import {
  filterAssessmentsWithinDays,
  filterCheckInsWithinDays,
  chronological,
  qolTrendI18nSpec,
  mentalTrendI18nSpec,
  checkinMoodTrendI18nSpec,
} from "../../lib/trends";

const ASSESSMENT_WINDOW_DAYS = 28;
const CHECKIN_MOOD_WINDOW_DAYS = 14;

function localeForLang(lang) {
  if (lang === "hi") return "hi-IN";
  if (lang === "ta") return "ta-IN";
  return undefined;
}

function formatShortDate(iso, lang) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(localeForLang(lang), { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function enPluralSuffix(count) {
  return count === 1 ? "" : "s";
}

function resolveTrendSpec(spec, t) {
  return {
    direction: spec.direction,
    summary: spec.summaryKey ? t(spec.summaryKey, spec.params) : null,
    detail: t(spec.detailKey, spec.params),
  };
}

export function CaregiverElderProgressBlock({ assessments, checkIns, insights, lang, t }) {
  const latest = assessments[0];
  const prev = assessments[1];
  const riskScore = depressionWellbeingScore(latest);
  const qol10 = qolScoreOutOf10(latest);
  const qolBar = qolPercentForBar(latest);
  const prevQol10 = qolScoreOutOf10(prev);
  const qolDelta = qol10 != null && prevQol10 != null ? Math.round((qol10 - prevQol10) * 10) / 10 : null;

  const riskElevated =
    latest != null &&
    (String(latest.depression_risk || "").toLowerCase() === "elevated" || latest.depression_probability >= 0.5);

  const riskLabelText =
    latest == null ? null : riskElevated ? t("prog.riskElevatedLabel") : t("prog.riskLowLabel");

  const riskBlurb =
    latest == null ? null : riskElevated ? t("prog.riskBlurbElevated") : t("prog.riskBlurbLow");

  const assessmentsInWindow = useMemo(
    () => filterAssessmentsWithinDays(assessments, ASSESSMENT_WINDOW_DAYS),
    [assessments]
  );
  const chronoAssessments = useMemo(() => chronological(assessmentsInWindow), [assessmentsInWindow]);

  const trendData = useMemo(() => {
    if (chronoAssessments.length < 2) return [];
    return chronoAssessments.map((a) => ({
      label: formatShortDate(a.created_at, lang),
      score: qolScoreOutOf10(a),
      id: a.id,
    }));
  }, [chronoAssessments, lang]);

  const mentalTrendData = useMemo(() => {
    if (chronoAssessments.length < 2) return [];
    return chronoAssessments.map((a) => ({
      label: formatShortDate(a.created_at, lang),
      mental: depressionWellbeingScore(a),
      id: a.id,
    }));
  }, [chronoAssessments, lang]);

  const qolInterpretation = useMemo(
    () => resolveTrendSpec(qolTrendI18nSpec(chronoAssessments), t),
    [chronoAssessments, t]
  );
  const mentalInterpretation = useMemo(
    () => resolveTrendSpec(mentalTrendI18nSpec(chronoAssessments), t),
    [chronoAssessments, t]
  );

  const checkInsMoodWindow = useMemo(
    () => chronological(filterCheckInsWithinDays(checkIns, CHECKIN_MOOD_WINDOW_DAYS)),
    [checkIns]
  );
  const moodInterpretation = useMemo(
    () => resolveTrendSpec(checkinMoodTrendI18nSpec(checkInsMoodWindow), t),
    [checkInsMoodWindow, t]
  );
  const moodTrendChartData = useMemo(() => {
    return checkInsMoodWindow
      .filter((c) => typeof c.mood === "number")
      .map((c) => ({
        label: formatShortDate(c.created_at, lang),
        mood: c.mood,
        id: c.id,
      }));
  }, [checkInsMoodWindow, lang]);

  const hasOlderAssessmentsOutsideWindow =
    assessments.length > 0 && assessmentsInWindow.length < assessments.length;

  const displayQol10 =
    insights?.has_assessment && typeof insights.qol_out_of_10 === "number"
      ? insights.qol_out_of_10
      : qol10;
  const displayMental =
    insights?.has_assessment && typeof insights.mental_wellbeing_0_100 === "number"
      ? Math.round(insights.mental_wellbeing_0_100)
      : riskScore;
  const displayQolBar =
    insights?.has_assessment && typeof insights.blended_qol_0_100 === "number"
      ? Math.min(100, Math.max(0, insights.blended_qol_0_100))
      : qolBar;

  const radarData = useMemo(() => {
    const ci = checkIns[0];
    if (!ci) return [];
    return [
      { category: t("prog.radarMood"), value: ci.mood, fullMark: 5 },
      { category: t("prog.radarEnergy"), value: ci.energy, fullMark: 5 },
      { category: t("prog.radarSleep"), value: ci.sleep, fullMark: 5 },
      { category: t("prog.radarAppetite"), value: ci.appetite, fullMark: 5 },
      { category: t("prog.radarComfort"), value: 6 - Math.min(5, Math.max(1, ci.pain)), fullMark: 5 },
      { category: t("prog.radarConnected"), value: 6 - Math.min(5, Math.max(1, ci.loneliness)), fullMark: 5 },
    ];
  }, [checkIns, t]);

  const hasAnyProgressData =
    latest ||
    (checkIns && checkIns.length > 0) ||
    (insights && insights.has_assessment);

  if (!hasAnyProgressData) {
    return (
      <WellnessCard className="border border-slate-200">
        <p className="text-gray-600 text-sm leading-relaxed">{t("cgDetail.progressEmpty")}</p>
      </WellnessCard>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">{t("cgDetail.progressTitle")}</h2>
        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{t("cgDetail.progressSub")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <WellnessCard>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Heart size={24} className="text-emerald-700" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-gray-800 mb-1 text-lg font-semibold">{t("prog.depressionRiskTitle")}</h3>
                {riskLabelText ? (
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      riskElevated ? "bg-teal-100 text-teal-900" : "bg-emerald-100 text-emerald-900"
                    }`}
                  >
                    {riskLabelText}
                  </span>
                ) : (
                  <p className="text-gray-500 text-sm">{t("prog.completeForCard")}</p>
                )}
              </div>
            </div>
            {latest && displayMental != null && (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 text-sm">{t("prog.overallScoreLabel")}</span>
                    <span className="text-gray-800 text-sm font-semibold">{displayMental}/100</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, displayMental)}%` }}
                      transition={{ duration: 0.8, delay: 0.1 }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>
                {riskBlurb && <p className="text-gray-600 mt-4 text-sm">{riskBlurb}</p>}
              </div>
            )}
          </WellnessCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <WellnessCard>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={24} className="text-violet-700" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-gray-800 mb-1 text-lg font-semibold">{t("prog.qolScoreTitle")}</h3>
                {displayQol10 != null ? (
                  <span className="text-gray-800 text-3xl font-bold">
                    {displayQol10}
                    <span className="text-gray-500 text-lg font-semibold">/10</span>
                  </span>
                ) : (
                  <p className="text-gray-500 text-sm">{t("prog.completeForCard")}</p>
                )}
              </div>
            </div>
            {latest && displayQol10 != null && (
              <div className="space-y-3">
                <p className="text-xs text-violet-800/90 bg-violet-50 border border-violet-100 rounded-lg px-2 py-1.5">
                  {t("prog.blendedNote")}
                </p>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${displayQolBar}%` }}
                    transition={{ duration: 0.8, delay: 0.15 }}
                    className="h-full bg-violet-500 rounded-full"
                  />
                </div>
                {insights?.wellness_index_0_100 != null && (
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-gray-800">{t("dash.wellnessIndex")}</span>{" "}
                    {Math.round(insights.wellness_index_0_100)}/100
                  </p>
                )}
                {qolDelta != null && assessments.length >= 2 && (
                  <div
                    className={`flex items-center gap-2 text-sm font-semibold ${
                      qolDelta >= 0 ? "text-emerald-700" : "text-cyan-700"
                    }`}
                  >
                    <TrendingUp size={16} className={qolDelta < 0 ? "rotate-180" : ""} />
                    <span>
                      {t("prog.deltaFromPrev", {
                        signedDelta: `${qolDelta >= 0 ? "+" : ""}${qolDelta}`,
                      })}
                    </span>
                  </div>
                )}
              </div>
            )}
          </WellnessCard>
        </motion.div>
      </div>

      {(qolInterpretation.detail || mentalInterpretation.detail || moodInterpretation.detail) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <WellnessCard>
            <h3 className="text-gray-800 mb-1 text-lg font-semibold">{t("prog.periodHeading")}</h3>
            <p className="text-gray-600 mb-4 text-sm">
              {t("prog.periodExplainer", {
                aDays: ASSESSMENT_WINDOW_DAYS,
                cDays: CHECKIN_MOOD_WINDOW_DAYS,
              })}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div
                className={`rounded-xl border p-4 ${
                  qolInterpretation.direction === "up"
                    ? "border-emerald-200 bg-emerald-50/60"
                    : qolInterpretation.direction === "down"
                      ? "border-cyan-200 bg-cyan-50/50"
                      : qolInterpretation.direction === "steady"
                        ? "border-slate-200 bg-slate-50/80"
                        : "border-violet-100 bg-violet-50/40"
                }`}
              >
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  {t("prog.sectionQol")}
                </p>
                {qolInterpretation.summary && (
                  <p className="text-gray-900 font-semibold text-sm mb-2">{qolInterpretation.summary}</p>
                )}
                <p className="text-gray-700 text-sm leading-relaxed">{qolInterpretation.detail}</p>
              </div>
              <div
                className={`rounded-xl border p-4 ${
                  mentalInterpretation.direction === "up"
                    ? "border-emerald-200 bg-emerald-50/60"
                    : mentalInterpretation.direction === "down"
                      ? "border-cyan-200 bg-cyan-50/50"
                      : mentalInterpretation.direction === "steady"
                        ? "border-slate-200 bg-slate-50/80"
                        : "border-violet-100 bg-violet-50/40"
                }`}
              >
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  {t("prog.sectionMental")}
                </p>
                {mentalInterpretation.summary && (
                  <p className="text-gray-900 font-semibold text-sm mb-2">{mentalInterpretation.summary}</p>
                )}
                <p className="text-gray-700 text-sm leading-relaxed">{mentalInterpretation.detail}</p>
              </div>
              <div
                className={`rounded-xl border p-4 ${
                  moodInterpretation.direction === "up"
                    ? "border-emerald-200 bg-emerald-50/60"
                    : moodInterpretation.direction === "down"
                      ? "border-cyan-200 bg-cyan-50/50"
                      : moodInterpretation.direction === "steady"
                        ? "border-slate-200 bg-slate-50/80"
                        : "border-violet-100 bg-violet-50/40"
                }`}
              >
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  {t("prog.sectionMood")}
                </p>
                {moodInterpretation.summary && (
                  <p className="text-gray-900 font-semibold text-sm mb-2">{moodInterpretation.summary}</p>
                )}
                <p className="text-gray-700 text-sm leading-relaxed">{moodInterpretation.detail}</p>
              </div>
            </div>
          </WellnessCard>
        </motion.div>
      )}

      {hasOlderAssessmentsOutsideWindow && (
        <div className="text-sm text-gray-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
          {t("prog.windowCharts", {
            days: ASSESSMENT_WINDOW_DAYS,
            count: assessmentsInWindow.length,
            s: enPluralSuffix(assessmentsInWindow.length),
          })}
        </div>
      )}

      {trendData.length >= 2 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <WellnessCard>
            <h3 className="text-gray-800 mb-4 text-lg font-semibold">{t("prog.qolFromAssessments")}</h3>
            <p className="text-gray-600 mb-4 text-sm">
              {t("prog.qolChartCaption", {
                days: ASSESSMENT_WINDOW_DAYS,
                count: chronoAssessments.length,
                s: enPluralSuffix(chronoAssessments.length),
              })}
            </p>
            <div className="h-[220px] sm:h-[250px] -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={{ stroke: "#E5E7EB" }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={{ stroke: "#E5E7EB" }} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                  <Line type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2} dot={{ fill: "#7c3aed", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </WellnessCard>
        </motion.div>
      )}

      {mentalTrendData.length >= 2 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <WellnessCard>
            <h3 className="text-gray-800 mb-1 text-lg font-semibold">{t("prog.mentalTrend")}</h3>
            <p className="text-gray-600 mb-4 text-sm">
              {t("prog.mentalTrendCaption", {
                days: ASSESSMENT_WINDOW_DAYS,
                count: chronoAssessments.length,
                s: enPluralSuffix(chronoAssessments.length),
              })}{" "}
              {t("prog.mentalTrendSub")}
            </p>
            <div className="h-[220px] sm:h-[250px] -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mentalTrendData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={{ stroke: "#E5E7EB" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={{ stroke: "#E5E7EB" }} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                  <Line type="monotone" dataKey="mental" stroke="#059669" strokeWidth={2} dot={{ fill: "#059669", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </WellnessCard>
        </motion.div>
      )}

      {moodTrendChartData.length >= 2 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <WellnessCard>
            <h3 className="text-gray-800 mb-1 text-lg font-semibold">{t("prog.moodCheckinsTitle")}</h3>
            <p className="text-gray-600 mb-4 text-sm">
              {t("prog.moodChartCaption", {
                days: CHECKIN_MOOD_WINDOW_DAYS,
                count: moodTrendChartData.length,
                s: enPluralSuffix(moodTrendChartData.length),
              })}
            </p>
            <div className="h-[200px] sm:h-[220px] -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moodTrendChartData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={{ stroke: "#E5E7EB" }} />
                  <YAxis domain={[1, 5]} allowDecimals={false} tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={{ stroke: "#E5E7EB" }} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                  <Line type="monotone" dataKey="mood" stroke="#7c3aed" strokeWidth={2} dot={{ fill: "#7c3aed", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </WellnessCard>
        </motion.div>
      )}

      {assessments.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <WellnessCard>
            <h3 className="text-gray-800 mb-4 text-lg font-semibold">{t("prog.history")}</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm min-w-[320px]">
                <thead>
                  <tr className="bg-slate-50 text-left text-gray-600">
                    <th className="p-3 font-semibold">{t("prog.date")}</th>
                    <th className="p-3 font-semibold">{t("prog.tableQolCol")}</th>
                    <th className="p-3 font-semibold">{t("prog.tableMentalCol")}</th>
                    <th className="p-3 font-semibold">{t("prog.tableRiskCol")}</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((a) => {
                    const q = qolScoreOutOf10(a);
                    const m = depressionWellbeingScore(a);
                    const elev =
                      String(a.depression_risk || "").toLowerCase() === "elevated" || a.depression_probability >= 0.5;
                    return (
                      <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                        <td className="p-3 text-gray-800 whitespace-nowrap">{formatShortDate(a.created_at, lang)}</td>
                        <td className="p-3 font-medium">{q != null ? q : "—"}</td>
                        <td className="p-3 font-medium">{m != null ? m : "—"}</td>
                        <td className="p-3">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              elev ? "bg-teal-100 text-teal-900" : "bg-emerald-100 text-emerald-900"
                            }`}
                          >
                            {elev ? t("prog.riskBadgeElevated") : t("prog.riskBadgeLow")}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </WellnessCard>
        </motion.div>
      )}

      {radarData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <WellnessCard>
            <h3 className="text-gray-800 mb-4 text-lg font-semibold">{t("prog.radarTitle")}</h3>
            <p className="text-gray-600 mb-4 text-sm">{t("cgDetail.radarSub")}</p>
            <div className="h-[260px] sm:h-[300px] -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                  <Radar
                    name={t("prog.radarScoreName")}
                    dataKey="value"
                    stroke="#7c3aed"
                    fill="#7c3aed"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </WellnessCard>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-2">
        <div className="flex items-start gap-3 p-4 rounded-[16px] bg-slate-100 border border-slate-200">
          <Info size={20} className="text-slate-600 flex-shrink-0 mt-0.5" aria-hidden />
          <p className="text-slate-800 text-sm">
            <strong>{t("prog.disclaimerNote")}</strong> {t("prog.disclaimerText")}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
