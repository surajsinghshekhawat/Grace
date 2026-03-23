import { useEffect, useMemo, useState } from "react";
import { Activity, HeartHandshake } from "lucide-react";

import useStore from "../store";
import { apiFetch } from "../lib/api";
import { useI18n } from "../contexts/LanguageContext";

const ElderInsights = () => {
  const { t } = useI18n();
  const prediction = useStore((s) => s.prediction);
  const authUser = useStore((s) => s.authUser);
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!authUser || authUser?.role !== "elder") return;
      try {
        setError(null);
        const data = await apiFetch("/api/check-ins/daily?days=14");
        setRecentCheckIns(data);
      } catch (e) {
        setError(e.message);
      }
    };
    load();
  }, [authUser, authUser?.role]);

  const avgMood = useMemo(() => {
    if (!recentCheckIns.length) return null;
    const v = recentCheckIns.reduce((a, x) => a + (x.mood || 0), 0) / recentCheckIns.length;
    return Math.round(v * 10) / 10;
  }, [recentCheckIns]);

  return (
    <div className="space-y-4">
      <div className="grace-card grace-card-pad flex items-start gap-3">
        <div className="p-2 rounded-2xl bg-teal-50">
          <HeartHandshake className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h1 className="grace-title text-base md:text-xl">Insights</h1>
          <p className="grace-subtitle">Your recent wellbeing signals and supportive next steps.</p>
        </div>
      </div>

      {error && (
        <div className="grace-card grace-card-pad border border-red-200 bg-red-50/70 text-red-700">{error}</div>
      )}

      <div className="grace-card grace-card-pad">
        <div className="flex items-center gap-2 font-semibold text-gray-900">
          <Activity className="w-5 h-5 text-teal-600" />
          {t("elInsight.recentTitle")}
        </div>
        <div className="mt-3 text-gray-700">
          {avgMood == null
            ? t("elInsight.noCheckins")
            : t("elInsight.avgMood", { n: recentCheckIns.length, avg: avgMood })}
        </div>
      </div>

      <div className="grace-card grace-card-pad">
        <div className="font-semibold text-gray-900">{t("elInsight.recTitle")}</div>
        <div className="mt-2 text-gray-700">
          {prediction ? (
            <div className="space-y-2">
              {(prediction.top_factors || []).slice(0, 4).map((f, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-white/70 border border-white/60">
                  <div className="font-semibold text-gray-900">{f.name}</div>
                  <div className="text-sm text-gray-600">{f.effect}</div>
                </div>
              ))}
              <div className="text-sm text-gray-500">{prediction.disclaimer}</div>
            </div>
          ) : (
            t("elInsight.recEmpty")
          )}
        </div>
      </div>
    </div>
  );
};

export default ElderInsights;

