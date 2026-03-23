import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Pill, CheckCircle2, Circle } from "lucide-react";
import { apiFetch } from "../lib/api";
import { WellnessCard } from "../components/WellnessCard";
import { WellnessButton } from "../components/WellnessButton";
import { useI18n } from "../contexts/LanguageContext.jsx";

function timeLabel(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

export default function CaregiverMedications() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const selectedElder = Number(searchParams.get("elder"));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingFor, setAddingFor] = useState(null);
  const [form, setForm] = useState({ name: "", dosage: "", schedule_time: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/caregiver/medications/today");
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load medications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const groups = useMemo(() => {
    const m = new Map();
    for (const row of rows) {
      const id = row.elder_user_id;
      if (!m.has(id)) m.set(id, { elder_user_id: id, elder_name: row.elder_name, meds: [] });
      m.get(id).meds.push(row.medication);
    }
    const out = Array.from(m.values());
    if (Number.isFinite(selectedElder) && selectedElder > 0) {
      return out.filter((g) => g.elder_user_id === selectedElder);
    }
    return out;
  }, [rows, selectedElder]);

  const markTaken = async (elderUserId, medId) => {
    try {
      await apiFetch(`/api/caregiver/elders/${elderUserId}/medications/${medId}/mark-taken`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e.message || "Could not mark medication.");
    }
  };

  const addMedication = async (elderUserId) => {
    if (!form.name.trim()) return;
    try {
      await apiFetch(`/api/caregiver/elders/${elderUserId}/medications`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm({ name: "", dosage: "", schedule_time: "" });
      setAddingFor(null);
      await load();
    } catch (e) {
      setError(e.message || "Could not add medication.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      <div className="px-6 pt-12 pb-8 bg-slate-100 border-b border-slate-200/80">
        <div className="max-w-[900px] mx-auto">
          <h1 className="text-gray-800" style={{ fontSize: "28px", fontWeight: 700 }}>
            {t("cgMeds.title")}
          </h1>
          <p className="text-gray-600 text-sm mt-1">{t("cgMeds.sub")}</p>
        </div>
      </div>

      <div className="px-6 -mt-4 max-w-[900px] mx-auto space-y-4">
        {error && <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
        {loading ? (
          <WellnessCard className="text-center py-10 text-gray-600">{t("mod.loading")}</WellnessCard>
        ) : groups.length === 0 ? (
          <WellnessCard className="text-center py-10 text-gray-600">{t("cgMeds.empty")}</WellnessCard>
        ) : (
          groups.map((g) => (
            <WellnessCard key={g.elder_user_id}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="font-semibold text-gray-900">{g.elder_name}</h3>
                <WellnessButton size="small" variant="outline" onClick={() => setAddingFor(g.elder_user_id)}>
                  {t("cgMeds.add")}
                </WellnessButton>
              </div>

              {addingFor === g.elder_user_id && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    placeholder={t("cgMeds.name")}
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  />
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    placeholder={t("cgMeds.dosage")}
                    value={form.dosage}
                    onChange={(e) => setForm((p) => ({ ...p, dosage: e.target.value }))}
                  />
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    placeholder={t("cgMeds.time")}
                    value={form.schedule_time}
                    onChange={(e) => setForm((p) => ({ ...p, schedule_time: e.target.value }))}
                  />
                  <WellnessButton size="small" onClick={() => addMedication(g.elder_user_id)}>
                    {t("cgMeds.save")}
                  </WellnessButton>
                </div>
              )}

              <div className="space-y-2">
                {g.meds.map((m) => (
                  <div key={m.id} className="rounded-xl border border-slate-200 p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        <Pill className="w-4 h-4 text-emerald-700" />
                        {m.name}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {(m.dosage || t("cgMeds.noDosage")) + (m.schedule_time ? ` · ${m.schedule_time}` : "")}
                      </p>
                      {m.last_taken_at ? (
                        <p className="text-xs text-gray-500 mt-0.5">{t("cgMeds.lastTaken", { when: timeLabel(m.last_taken_at) })}</p>
                      ) : null}
                    </div>
                    <WellnessButton
                      size="small"
                      variant={m.taken_today ? "secondary" : "primary"}
                      onClick={() => markTaken(g.elder_user_id, m.id)}
                      className="whitespace-nowrap"
                    >
                      {m.taken_today ? (
                        <span className="inline-flex items-center gap-1"><CheckCircle2 size={14} />{t("cgMeds.taken")}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1"><Circle size={14} />{t("cgMeds.markTaken")}</span>
                      )}
                    </WellnessButton>
                  </div>
                ))}
              </div>
            </WellnessCard>
          ))
        )}
      </div>
    </div>
  );
}

