import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { WellnessCard } from "../components/WellnessCard";
import { WellnessButton } from "../components/WellnessButton";
import { Bell, AlertCircle, TrendingDown, Heart, Loader2, Check } from "lucide-react";
import { motion } from "framer-motion";
import { apiFetch } from "../lib/api";
import { useI18n } from "../contexts/LanguageContext.jsx";

function timeAgo(iso, t) {
  if (!iso) return "";
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return t("cgAlerts.time.justNow");
  if (s < 3600) return t("cgAlerts.time.minAgo", { n: Math.floor(s / 60) });
  if (s < 86400) return t("cgAlerts.time.hourAgo", { n: Math.floor(s / 3600) });
  return t("cgAlerts.time.dayAgo", { n: Math.floor(s / 86400) });
}

function severityStyle(sev, t) {
  if (sev === "critical")
    return {
      icon: AlertCircle,
      border: "border-red-300",
      bg: "from-red-50 to-orange-50",
      chip: "bg-red-100 text-red-800",
      label: t("cgAlerts.sevCritical"),
    };
  if (sev === "high")
    return {
      icon: TrendingDown,
      border: "border-teal-300",
      bg: "from-teal-50 to-cyan-50",
      chip: "bg-teal-100 text-teal-900",
      label: t("cgAlerts.sevHigh"),
    };
  return {
    icon: Heart,
    border: "border-cyan-300",
    bg: "from-cyan-50 to-cyan-100",
    chip: "bg-cyan-100 text-cyan-900",
    label: t("cgAlerts.sevMedium"),
  };
}

export default function CaregiverAlerts() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/caregiver/alerts?limit=50");
      setAlerts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || t("cgAlerts.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const active = alerts.filter((a) => !a.dismissed);
  const criticalCount = active.filter((a) => a.severity === "critical").length;
  const highCount = active.filter((a) => a.severity === "high").length;
  const mediumCount = active.filter((a) => a.severity === "medium").length;

  const dismiss = async (id) => {
    setBusyId(id);
    try {
      await apiFetch(`/api/caregiver/alerts/${id}/dismiss`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e.message || t("cgAlerts.dismissError"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      <header className="bg-slate-100 border-b border-slate-200/80 pt-8 pb-6 sm:pt-10 sm:pb-7">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center" aria-hidden>
                <Bell size={24} className="text-white" />
              </div>
              <div className="min-w-0 space-y-1.5 pt-0.5">
                <h1 className="text-gray-800 text-2xl sm:text-[28px] font-bold tracking-tight">
                  {t("cgAlerts.title")}
                </h1>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{t("cgAlerts.sub")}</p>
              </div>
            </div>
            {active.length > 0 && (
              <div className="flex shrink-0 items-center gap-2 self-start px-3 py-1.5 rounded-full bg-red-100">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden />
                <span className="text-red-700 text-sm font-semibold">
                  {t("cgAlerts.active", { count: active.length })}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="-mt-3 max-w-3xl mx-auto w-full space-y-6">
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col justify-center items-center py-16 gap-3 text-gray-500">
            <Loader2 className="animate-spin" size={22} aria-hidden />
            <span className="text-sm">{t("cgAlerts.loading")}</span>
          </div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <WellnessCard className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200">
                  <div className="text-center">
                    <p className="text-red-700 mb-1" style={{ fontSize: "28px", fontWeight: 700 }}>
                      {criticalCount}
                    </p>
                    <p className="text-gray-700" style={{ fontSize: "13px", fontWeight: 600 }}>
                      {t("cgAlerts.sevCritical")}
                    </p>
                  </div>
                </WellnessCard>
                <WellnessCard className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200">
                  <div className="text-center">
                    <p className="text-teal-700 mb-1" style={{ fontSize: "28px", fontWeight: 700 }}>
                      {highCount}
                    </p>
                    <p className="text-gray-700" style={{ fontSize: "13px", fontWeight: 600 }}>
                      {t("cgAlerts.sevHigh")}
                    </p>
                  </div>
                </WellnessCard>
                <WellnessCard className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-2 border-cyan-200">
                  <div className="text-center">
                    <p className="text-cyan-700 mb-1" style={{ fontSize: "28px", fontWeight: 700 }}>
                      {mediumCount}
                    </p>
                    <p className="text-gray-700" style={{ fontSize: "13px", fontWeight: 600 }}>
                      {t("cgAlerts.sevMedium")}
                    </p>
                  </div>
                </WellnessCard>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
              <h2 className="text-gray-800 text-lg font-semibold tracking-tight">
                {t("cgAlerts.recent")}
              </h2>
              {alerts.length === 0 ? (
                <WellnessCard className="text-center py-10 text-gray-600">{t("cgAlerts.empty")}</WellnessCard>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert, index) => {
                    const st = severityStyle(alert.severity, t);
                    const Icon = st.icon;
                    return (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(0.05 * index, 0.4) }}
                      >
                        <WellnessCard
                          className={`bg-gradient-to-br ${st.bg} border-2 ${st.border} ${alert.dismissed ? "opacity-60" : ""}`}
                        >
                          <div className="flex gap-3 sm:gap-4">
                            <div
                              className={`w-14 h-14 rounded-[16px] flex items-center justify-center flex-shrink-0 ${
                                alert.severity === "critical"
                                  ? "bg-red-500"
                                  : alert.severity === "high"
                                    ? "bg-teal-500"
                                    : "bg-cyan-500"
                              }`}
                            >
                              <Icon size={28} className="text-white" aria-hidden />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div>
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${st.chip}`}>{st.label}</span>
                                  <h3 className="text-gray-800 mt-1" style={{ fontSize: "17px", fontWeight: 600 }}>
                                    {alert.elder_name || t("link.cg.elderFallback", { id: alert.elder_user_id })}
                                  </h3>
                                  <p className="text-gray-800" style={{ fontSize: "15px", fontWeight: 600 }}>
                                    {alert.title}
                                  </p>
                                </div>
                                <span className="text-gray-500 flex-shrink-0 text-xs">{timeAgo(alert.created_at, t)}</span>
                              </div>
                              <p className="text-gray-600 mb-3" style={{ fontSize: "14px" }}>
                                {alert.message}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <WellnessButton
                                  variant="primary"
                                  size="small"
                                  onClick={() => navigate(`/caregiver/elders/${alert.elder_user_id}`)}
                                >
                                  {t("cgAlerts.viewElder")}
                                </WellnessButton>
                                {!alert.dismissed && (
                                  <WellnessButton
                                    variant="secondary"
                                    size="small"
                                    disabled={busyId === alert.id}
                                    onClick={() => dismiss(alert.id)}
                                    className="flex items-center gap-1"
                                  >
                                    {busyId === alert.id ? (
                                      <Loader2 className="animate-spin w-4 h-4" aria-hidden />
                                    ) : (
                                      <Check size={16} aria-hidden />
                                    )}
                                    {t("cgAlerts.dismiss")}
                                  </WellnessButton>
                                )}
                                {alert.dismissed && (
                                  <span className="text-xs text-gray-500 self-center">{t("cgAlerts.dismissed")}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </WellnessCard>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="pt-2 pb-2">
              <Link to="/caregiver" className="block">
                <WellnessButton variant="secondary" size="large" className="w-full">
                  {t("cgAlerts.backHome")}
                </WellnessButton>
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
