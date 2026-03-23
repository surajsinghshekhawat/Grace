import { useEffect, useMemo, useState } from "react";
import { WellnessCard } from "../components/WellnessCard";
import { TrendingUp, Users, CheckCircle, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { apiFetch } from "../lib/api";
import { useI18n } from "../contexts/LanguageContext.jsx";

const riskColors = { Low: "#34D399", Medium: "#0EA5E9", High: "#14B8A6" };

export default function CaregiverInsights() {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const overview = await apiFetch("/api/caregiver/elders-overview");
        if (!cancelled) setItems(Array.isArray(overview) ? overview : []);
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

  const totalElders = items.length;
  const highRisk = items.filter((s) => s.depression_risk === "elevated");
  const lowRisk = items.filter((s) => s.depression_risk && s.depression_risk !== "elevated");
  const needsAttention = items.filter((s) => s.needs_attention).length;
  const avgWellbeing = items.length
    ? Math.round(items.reduce((acc, s) => acc + ((s.qol_out_of_10 ?? 0) * 10), 0) / items.length)
    : 0;
  const checkInRate = items.length
    ? Math.round((items.filter((s) => s.last_check_in_at != null).length / items.length) * 100)
    : 0;

  const riskData = useMemo(() => {
    const lowN = lowRisk.length;
    const highN = highRisk.length;
    const medN = Math.max(0, totalElders - lowN - highN);
    const rows = [
      { name: t("cgInsights.riskLow"), value: lowN, color: riskColors.Low },
      { name: t("cgInsights.riskMedium"), value: medN, color: riskColors.Medium },
      { name: t("cgInsights.riskHigh"), value: highN, color: riskColors.High },
    ].filter((d) => d.value > 0);
    return rows.length > 0 ? rows : [{ name: t("cgInsights.riskNoData"), value: 1, color: "#E5E7EB" }];
  }, [totalElders, lowRisk.length, highRisk.length, t]);

  const engagementData = useMemo(
    () => [
      { day: t("cgInsights.dayMon"), completed: 5, total: 6 },
      { day: t("cgInsights.dayTue"), completed: 6, total: 6 },
      { day: t("cgInsights.dayWed"), completed: 4, total: 6 },
      { day: t("cgInsights.dayThu"), completed: 5, total: 6 },
      { day: t("cgInsights.dayFri"), completed: 6, total: 6 },
      { day: t("cgInsights.daySat"), completed: 3, total: 6 },
      { day: t("cgInsights.daySun"), completed: 4, total: 6 },
    ],
    [t]
  );

  const wellbeingTrend = useMemo(
    () => [
      { week: t("cgInsights.weekN", { n: 1 }), average: avgWellbeing - 4 },
      { week: t("cgInsights.weekN", { n: 2 }), average: avgWellbeing - 2 },
      { week: t("cgInsights.weekN", { n: 3 }), average: avgWellbeing - 1 },
      { week: t("cgInsights.weekN", { n: 4 }), average: avgWellbeing },
    ],
    [t, avgWellbeing]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] pb-24 flex flex-col items-center justify-center gap-3 px-4">
        <div className="h-2 w-10 rounded-full bg-emerald-200/80 animate-pulse" aria-hidden />
        <p className="text-gray-600 text-sm">{t("mod.loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      <header className="bg-slate-100 border-b border-slate-200/80 pt-8 pb-6 sm:pt-10 sm:pb-7">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center" aria-hidden>
              <TrendingUp size={24} className="text-white" />
            </div>
            <div className="min-w-0 space-y-1.5 pt-0.5">
              <h1 className="text-gray-800 text-2xl sm:text-[28px] font-bold tracking-tight">
                {t("cgInsights.title")}
              </h1>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                {t("cgInsights.subtitle")}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="-mt-3 max-w-3xl mx-auto w-full space-y-6">
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
            {error}
          </div>
        )}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-1">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <WellnessCard className="bg-gradient-to-br from-emerald-50 to-teal-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center" aria-hidden>
                  <Users size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-gray-800" style={{ fontSize: "24px", fontWeight: 700 }}>
                    {totalElders}
                  </p>
                  <p className="text-gray-600" style={{ fontSize: "12px" }}>
                    {t("cgInsights.statTotal")}
                  </p>
                </div>
              </div>
            </WellnessCard>
            <WellnessCard className="bg-gradient-to-br from-teal-50 to-cyan-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center" aria-hidden>
                  <TrendingUp size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-gray-800" style={{ fontSize: "24px", fontWeight: 700 }}>
                    {avgWellbeing}
                  </p>
                  <p className="text-gray-600" style={{ fontSize: "12px" }}>
                    {t("cgInsights.statWellbeing")}
                  </p>
                </div>
              </div>
            </WellnessCard>
            <WellnessCard className="bg-gradient-to-br from-cyan-50 to-sky-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-sky-500 flex items-center justify-center" aria-hidden>
                  <CheckCircle size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-gray-800" style={{ fontSize: "24px", fontWeight: 700 }}>
                    {checkInRate}%
                  </p>
                  <p className="text-gray-600" style={{ fontSize: "12px" }}>
                    {t("cgInsights.statCheckIn")}
                  </p>
                </div>
              </div>
            </WellnessCard>
            <WellnessCard className="bg-gradient-to-br from-teal-50 to-emerald-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center" aria-hidden>
                  <AlertTriangle size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-gray-800" style={{ fontSize: "24px", fontWeight: 700 }}>
                    {needsAttention}
                  </p>
                  <p className="text-gray-600" style={{ fontSize: "12px" }}>
                    {t("cgInsights.statAttention")}
                  </p>
                </div>
              </div>
            </WellnessCard>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <WellnessCard>
            <h2 className="text-gray-800 text-lg font-semibold tracking-tight mb-4">
              {t("cgInsights.riskDistribution")}
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4 flex-wrap">
              {riskData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} aria-hidden />
                  <span className="text-gray-700" style={{ fontSize: "14px" }}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </WellnessCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <WellnessCard>
            <h2 className="text-gray-800 text-lg font-semibold tracking-tight mb-4">
              {t("cgInsights.dailyCompletion")}
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" stroke="#999" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#999" style={{ fontSize: "12px" }} />
                  <Tooltip contentStyle={{ backgroundColor: "white", border: "none", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }} />
                  <Bar dataKey="completed" fill="#34D399" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="total" fill="#E5E7EB" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400" aria-hidden />
                <span className="text-gray-700" style={{ fontSize: "14px" }}>
                  {t("cgInsights.legendCompleted")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#E5E7EB]" aria-hidden />
                <span className="text-gray-700" style={{ fontSize: "14px" }}>
                  {t("cgInsights.legendTotal")}
                </span>
              </div>
            </div>
          </WellnessCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="pb-2">
          <WellnessCard>
            <h2 className="text-gray-800 text-lg font-semibold tracking-tight mb-4">
              {t("cgInsights.wellbeingTrend")}
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={wellbeingTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" stroke="#999" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#999" style={{ fontSize: "12px" }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: "white", border: "none", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }} />
                  <Line type="monotone" dataKey="average" stroke="#0D9488" strokeWidth={3} dot={{ fill: "#0D9488", r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </WellnessCard>
        </motion.div>
      </div>
    </div>
  );
}
