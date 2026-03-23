import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { WellnessCard } from "../components/WellnessCard";
import { WellnessButton } from "../components/WellnessButton";
import { Plus, Clock, ArrowRight, Bell, Activity, TrendingUp, TrendingDown, Minus, AlertTriangle, Pill } from "lucide-react";
import { motion } from "framer-motion";
import { apiFetch } from "../lib/api";
import { useI18n } from "../contexts/LanguageContext.jsx";

function formatLastCheckIn(iso, t) {
  if (!iso) return t("cgHome.time.noCheckin");
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / (1000 * 60 * 60);
  if (diff < 1) return t("cgHome.time.minsAgo", { n: Math.round(diff * 60) });
  if (diff < 24) return t("cgHome.time.hoursAgo", { n: Math.round(diff) });
  return t("cgHome.time.daysAgo", { n: Math.round(diff / 24) });
}

function qolTrendIcon(trend, t) {
  if (trend === "up")
    return { Icon: TrendingUp, label: t("cgHome.qolTrendUp"), className: "text-emerald-700 bg-emerald-100" };
  if (trend === "down")
    return { Icon: TrendingDown, label: t("cgHome.qolTrendDown"), className: "text-cyan-800 bg-cyan-100" };
  if (trend === "steady")
    return { Icon: Minus, label: t("cgHome.qolTrendSteady"), className: "text-slate-600 bg-slate-100" };
  return { Icon: Minus, label: t("cgHome.qolTrendUnknown"), className: "text-slate-400 bg-slate-50" };
}

function reasonHint(r, t) {
  const key = `cgHome.reason.${r}`;
  const s = t(key);
  return s === key ? r : s;
}

export default function CaregiverHome() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [elders, setElders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [alerts, overview] = await Promise.all([
          apiFetch("/api/caregiver/alerts?limit=30&include_dismissed=false").catch(() => []),
          apiFetch("/api/caregiver/elders-overview").catch(() => null),
        ]);
        if (!cancelled && Array.isArray(alerts)) {
          setAlertCount(alerts.filter((a) => !a.dismissed).length);
        }
        if (!cancelled && Array.isArray(overview)) {
          const sorted = [...overview].sort((a, b) => {
            if (a.needs_attention === b.needs_attention) return 0;
            return a.needs_attention ? -1 : 1;
          });
          setElders(sorted);
        } else if (!cancelled) {
          setElders([]);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    return elders.map((e) => {
      const name = e.elder_name?.trim() || t("link.cg.elderFallback", { id: e.elder_user_id });
      const initials = name
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      const riskLabel =
        e.depression_risk === "elevated"
          ? t("cgHome.riskElevated")
          : e.depression_risk === "low"
            ? t("cgHome.riskLow")
            : t("cgHome.riskNone");
      const riskStyle =
        e.depression_risk === "elevated"
          ? "bg-cyan-100 text-cyan-900"
          : e.depression_risk === "low"
            ? "bg-emerald-100 text-emerald-900"
            : "bg-teal-100 text-teal-900";
      const qt = qolTrendIcon(e.qol_trend, t);
      return { ...e, displayName: name, initials, riskLabel, riskStyle, qt };
    });
  }, [elders, t]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      <header className="bg-slate-100 border-b border-slate-200/80 pt-8 pb-6 sm:pt-10 sm:pb-7">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <h1 className="text-gray-800 text-2xl sm:text-[28px] font-bold tracking-tight">
              {t("cgHome.title")}
            </h1>
            <WellnessButton
              variant="primary"
              onClick={() => navigate("/caregiver/link")}
              className="flex shrink-0 items-center justify-center gap-2 w-full sm:w-auto min-h-[44px]"
              aria-label={t("cgHome.linkElder")}
            >
              <Plus size={20} aria-hidden />
              {t("cgHome.linkElder")}
            </WellnessButton>
          </div>
        </div>
      </header>

      <div className="-mt-3 max-w-3xl mx-auto w-full space-y-5 pt-1">
        {alertCount > 0 && (
          <Link
            to="/caregiver/alerts"
            className="block mb-4 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3 hover:bg-red-100/80 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
              <Bell className="text-white w-5 h-5" aria-hidden />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-red-900 text-sm">
                {alertCount === 1 ? t("cgHome.alertsBannerOne") : t("cgHome.alertsBannerMany", { count: alertCount })}
              </p>
              <p className="text-red-800/90 text-xs">{t("cgHome.alertsSub")}</p>
            </div>
            <ArrowRight className="text-red-700 flex-shrink-0" size={20} aria-hidden />
          </Link>
        )}
        {error && (
          <div className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
            {error}
          </div>
        )}
        {loading ? (
          <WellnessCard className="text-center py-12 text-gray-600">{t("mod.loading")}</WellnessCard>
        ) : rows.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <WellnessCard className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Plus size={40} className="text-emerald-700" aria-hidden />
              </div>
              <h3 className="text-gray-800 mb-2" style={{ fontSize: "20px", fontWeight: 600 }}>
                {t("cgHome.emptyTitle")}
              </h3>
              <p className="text-gray-600 mb-6" style={{ fontSize: "14px" }}>
                {t("cgHome.emptySub")}
              </p>
              <WellnessButton variant="primary" onClick={() => navigate("/caregiver/link")}>
                {t("cgHome.emptyCta")}
              </WellnessButton>
            </WellnessCard>
          </motion.div>
        ) : (
          <div className="space-y-5">
            {rows.map((elder, index) => {
              const QtIcon = elder.qt.Icon;
              return (
                <motion.div
                  key={elder.elder_user_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <WellnessCard className={`relative ${elder.needs_attention ? "border border-teal-300 bg-teal-50/30" : "border border-slate-200"}`}>
                    <div className="flex items-start gap-4">
                      <div
                        className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white flex-shrink-0"
                        style={{ fontSize: "18px", fontWeight: 600 }}
                        aria-hidden
                      >
                        {elder.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-gray-800" style={{ fontSize: "18px", fontWeight: 600 }}>
                            {elder.displayName}
                          </h3>
                          {elder.needs_attention && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 text-xs font-bold">
                              <AlertTriangle size={12} aria-hidden /> {t("cgHome.needsAttention")}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 mb-2">
                          <Clock size={14} aria-hidden />
                          <span style={{ fontSize: "14px" }}>
                            {t("cgHome.lastCheckinLabel")} {formatLastCheckIn(elder.last_check_in_at, t)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${elder.riskStyle}`}>
                            {elder.riskLabel}
                          </span>
                          {typeof elder.mental_wellbeing_0_100 === "number" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-800 border border-violet-100">
                              {t("cgHome.mentalShort", { n: Math.round(elder.mental_wellbeing_0_100) })}
                            </span>
                          )}
                          {typeof elder.qol_out_of_10 === "number" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-100">
                              {t("cgHome.qolShort", { n: elder.qol_out_of_10 })}
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${elder.qt.className}`}
                            title={elder.qt.label}
                          >
                            <QtIcon size={14} aria-hidden />
                            {elder.qol_trend === "up"
                              ? t("cgHome.trendUp")
                              : elder.qol_trend === "down"
                                ? t("cgHome.trendDown")
                                : elder.qol_trend === "steady"
                                  ? t("cgHome.trendSteady")
                                  : t("cgHome.trendDash")}
                          </span>
                          {elder.medication_count > 0 && typeof elder.medication_adherence_pct === "number" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-100">
                              <Activity size={14} aria-hidden />
                              {t("cgHome.medsAdherence", { pct: elder.medication_adherence_pct })}
                            </span>
                          )}
                          {elder.sos_events_last_7_days > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-900">
                              {t("cgHome.sosBadge", { n: elder.sos_events_last_7_days })}
                            </span>
                          )}
                          {elder.open_alerts_count > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-900">
                              <Bell size={12} aria-hidden />
                              {elder.open_alerts_count === 1
                                ? t("cgHome.openAlertsOne", { n: elder.open_alerts_count })
                                : t("cgHome.openAlertsMany", { n: elder.open_alerts_count })}
                            </span>
                          )}
                          {elder.unmarked_meds_today > 0 && elder.medication_count > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-900 border border-teal-200">
                              <Pill size={12} aria-hidden />
                              {t("cgHome.unmarkedMeds", { n: elder.unmarked_meds_today })}
                            </span>
                          )}
                        </div>

                        {elder.attention_reasons?.length > 0 && (
                          <p className="text-xs text-teal-900/90 leading-relaxed mb-3">
                            {elder.attention_reasons.map((r) => reasonHint(r, t)).join(" · ")}
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={() => navigate(`/caregiver/elders/${elder.elder_user_id}`)}
                          className="text-emerald-700 hover:text-emerald-800 text-sm font-bold flex items-center gap-1"
                        >
                          {t("cgHome.viewDetails")} <ArrowRight size={16} aria-hidden />
                        </button>
                      </div>
                    </div>
                  </WellnessCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
