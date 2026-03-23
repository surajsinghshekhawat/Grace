import { useEffect, useState } from "react";
import { WellnessCard } from "../components/WellnessCard";
import { WellnessButton } from "../components/WellnessButton";
import { Pill, AlertCircle, Phone, Check, Clock, Loader2, Plus, Trash2, Activity } from "lucide-react";
import { motion } from "framer-motion";
import useStore from "../store";
import { apiFetch } from "../lib/api";
import { useI18n } from "../contexts/LanguageContext";

function scheduleToTimeInput(s) {
  if (!s || typeof s !== "string") return "";
  const m = s.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (m) {
    const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
    const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }
  return "";
}

function formatScheduleDisplay(s) {
  if (!s || typeof s !== "string") return "";
  const m = s.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return s;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const d = new Date();
  d.setHours(h, min, 0, 0);
  try {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  } catch {
    return s;
  }
}

function formatTakenAt(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

function localDateKey() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

function currentHm() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
}

export default function ElderHealth() {
  const { t } = useI18n();
  const authUser = useStore((s) => s.authUser);

  const [meds, setMeds] = useState([]);
  const [adherence, setAdherence] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSOSConfirm, setShowSOSConfirm] = useState(false);
  const [sosMessage, setSosMessage] = useState(null);
  const [sosContacts, setSosContacts] = useState([]);
  const [medNudge, setMedNudge] = useState(null);
  const [addingMed, setAddingMed] = useState(false);
  const [newMed, setNewMed] = useState({ name: "", dosage: "", schedule_time: "" }); // schedule_time as HH:MM for input type="time"
  const [addingContact, setAddingContact] = useState(false);
  const [newContact, setNewContact] = useState({ label: "", phone: "" });
  const [profileFields, setProfileFields] = useState({
    age_range: null,
    conditions_summary: "",
    medications_summary: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);

  const load = async () => {
    if (!authUser || authUser?.role !== "elder") return;
    setError(null);
    try {
      const [m, adh, c, prof] = await Promise.all([
        apiFetch("/api/elder/medications").catch(() => []),
        apiFetch("/api/elder/medication-adherence?days=7").catch(() => null),
        apiFetch("/api/elder/emergency-contacts").catch(() => []),
        apiFetch("/api/me/elder-profile").catch(() => null),
      ]);
      setMeds(Array.isArray(m) ? m : []);
      setAdherence(adh && typeof adh === "object" ? adh : null);
      setContacts(Array.isArray(c) ? c : []);
      setProfileFields({
        age_range: prof?.age_range ?? null,
        conditions_summary: prof?.conditions_summary ?? "",
        medications_summary: prof?.medications_summary ?? "",
      });
    } catch (e) {
      setError(e.message || t("health.errLoad"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [authUser, authUser?.role]);

  /** Local-time reminder once per med per day when clock matches schedule_time (HH:MM). */
  useEffect(() => {
    if (!meds.length || authUser?.role !== "elder") return undefined;
    const run = () => {
      const hm = currentHm();
      const day = localDateKey();
      for (const m of meds) {
        const st = scheduleToTimeInput(m.schedule_time);
        if (!st || st !== hm) continue;
        const key = `grace_med_nudge_${m.id}_${day}`;
        if (sessionStorage.getItem(key)) continue;
        sessionStorage.setItem(key, "1");
        setMedNudge({ id: m.id, name: m.name });
        break;
      }
    };
    run();
    const id = setInterval(run, 30000);
    return () => clearInterval(id);
  }, [meds, authUser?.role]);

  const handleMarkTaken = async (id) => {
    try {
      await apiFetch(`/api/elder/medications/${id}/mark-taken`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e.message || t("health.errDose"));
    }
  };

  const handleSOS = async () => {
    try {
      const res = await apiFetch("/api/elder/sos", { method: "POST" });
      setSosMessage(res?.message || t("health.sosMsgDefault"));
      setSosContacts(Array.isArray(res?.emergency_contacts) ? res.emergency_contacts : []);
      setShowSOSConfirm(true);
    } catch (e) {
      setError(e.message || t("health.errSos"));
    }
  };

  const markTakenFromNudge = async () => {
    if (!medNudge) return;
    try {
      await apiFetch(`/api/elder/medications/${medNudge.id}/mark-taken`, { method: "POST" });
      await load();
      setMedNudge(null);
    } catch (e) {
      setError(e.message || t("health.errDose"));
    }
  };

  const closeSosModal = () => {
    setShowSOSConfirm(false);
    setSosContacts([]);
  };

  const addMedication = async () => {
    if (!newMed.name.trim()) return;
    try {
      await apiFetch("/api/elder/medications", {
        method: "POST",
        body: JSON.stringify({
          name: newMed.name.trim(),
          dosage: newMed.dosage.trim(),
          schedule_time: newMed.schedule_time.trim(),
        }),
      });
      setNewMed({ name: "", dosage: "", schedule_time: "" });
      setAddingMed(false);
      await load();
    } catch (e) {
      setError(e.message || t("health.errAddMed"));
    }
  };

  const removeMedication = async (id) => {
    try {
      await apiFetch(`/api/elder/medications/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e.message || t("health.errRemoveMed"));
    }
  };

  const addContact = async () => {
    if (!newContact.label.trim() || !newContact.phone.trim()) return;
    try {
      await apiFetch("/api/elder/emergency-contacts", {
        method: "POST",
        body: JSON.stringify({
          label: newContact.label.trim(),
          phone: newContact.phone.trim(),
          sort_order: contacts.length,
        }),
      });
      setNewContact({ label: "", phone: "" });
      setAddingContact(false);
      await load();
    } catch (e) {
      setError(e.message || t("health.errAddContact"));
    }
  };

  const removeContact = async (id) => {
    try {
      await apiFetch(`/api/elder/emergency-contacts/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e.message || t("health.errRemoveContact"));
    }
  };

  const saveHealthProfile = async () => {
    setProfileSaving(true);
    setError(null);
    try {
      await apiFetch("/api/me/elder-profile", {
        method: "PUT",
        body: JSON.stringify({
          age_range: profileFields.age_range,
          conditions_summary: profileFields.conditions_summary.trim() || null,
          medications_summary: profileFields.medications_summary.trim() || null,
        }),
      });
    } catch (e) {
      setError(e.message || t("health.errSaveProfile"));
    } finally {
      setProfileSaving(false);
    }
  };

  if (!authUser || authUser.role !== "elder") {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
        <p className="text-gray-600">{t("health.elderOnly")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      <div className="px-6 pt-12 pb-8 bg-slate-100 border-b border-slate-200/80">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
              <Pill size={24} className="text-slate-700" />
            </div>
            <h1 className="text-gray-800" style={{ fontSize: "28px", fontWeight: 700 }}>
              {t("health.pageTitle")}
            </h1>
          </div>
          <p className="text-gray-600" style={{ fontSize: "16px" }}>
            {t("health.pageSub")}
          </p>
        </div>
      </div>

      <div className="px-6 -mt-4 max-w-[1100px] mx-auto space-y-6">
        {error && (
          <div className="rounded-[16px] border border-red-200 bg-red-50 text-red-800 text-sm p-4">{error}</div>
        )}

        {medNudge && (
          <div
            className="rounded-2xl border border-violet-200 bg-violet-50/90 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            role="status"
          >
            <p className="text-violet-950 text-sm font-medium">{t("health.medNudge", { name: medNudge.name })}</p>
            <div className="flex flex-wrap gap-2">
              <WellnessButton variant="secondary" size="small" onClick={markTakenFromNudge}>
                {t("health.medNudgeMark")}
              </WellnessButton>
              <WellnessButton variant="outline" size="small" onClick={() => setMedNudge(null)}>
                {t("health.medNudgeDismiss")}
              </WellnessButton>
            </div>
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <WellnessCard className="border-2 border-red-200 bg-red-50/40">
            <div className="text-center py-2">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertCircle size={22} className="text-red-700" />
                <h2 className="text-red-800" style={{ fontSize: "18px", fontWeight: 700 }}>
                  {t("health.sosCardTitle")}
                </h2>
              </div>
              <p className="text-gray-700 mb-4 text-sm">{t("health.sosCardSub")}</p>
              <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleSOS}
                className="w-full max-w-xs mx-auto py-5 bg-red-600 text-white rounded-[16px] shadow font-bold text-lg hover:bg-red-700 transition-colors"
              >
                {t("health.sosCta")}
              </motion.button>
              <p className="text-gray-600 mt-3 text-xs">{t("health.sos911")}</p>
            </div>
          </WellnessCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}>
          <h2 className="text-gray-800 mb-3" style={{ fontSize: "20px", fontWeight: 600 }}>
            {t("health.profileH2")}
          </h2>
          <WellnessCard className="mb-6">
            <p className="text-gray-600 text-sm mb-3">
              {t("health.profileHelp")}
            </p>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{t("health.condLabel")}</label>
            <textarea
              value={profileFields.conditions_summary}
              onChange={(e) => setProfileFields((p) => ({ ...p, conditions_summary: e.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm mb-3"
              placeholder={t("health.condPh")}
            />
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{t("health.medNotesLabel")}</label>
            <textarea
              value={profileFields.medications_summary}
              onChange={(e) => setProfileFields((p) => ({ ...p, medications_summary: e.target.value }))}
              rows={2}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm mb-3"
              placeholder={t("health.medNotesPh")}
            />
            <WellnessButton variant="secondary" size="small" disabled={profileSaving} onClick={saveHealthProfile}>
              {profileSaving ? t("health.savingProfile") : t("health.saveProfileNotes")}
            </WellnessButton>
          </WellnessCard>
        </motion.div>

        {adherence && adherence.medication_count > 0 && typeof adherence.adherence_pct === "number" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
            <WellnessCard className="border border-teal-200 bg-teal-50/40">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center flex-shrink-0">
                  <Activity className="text-white" size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-gray-900 font-bold text-lg">{t("health.sevenTitle")}</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {t("health.sevenExplainer")}
                  </p>
                </div>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-bold text-teal-800">{adherence.adherence_pct}</span>
                <span className="text-lg text-teal-700 font-semibold mb-1">%</span>
                <span className="text-sm text-gray-600 mb-1.5 ml-2">{t("health.adherenceWord")}</span>
              </div>
              <div className="h-3 bg-teal-200/60 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-teal-600 rounded-full transition-all duration-500"
                  style={{ width: `${adherence.adherence_pct}%` }}
                />
              </div>
              <p className="text-sm text-gray-700">
                {t("health.doseSummary", {
                  covered: adherence.covered_dose_days,
                  expected: adherence.expected_dose_days,
                  meds:
                    adherence.medication_count === 1
                      ? t("health.medOneCt", { n: adherence.medication_count })
                      : t("health.medManyCt", { n: adherence.medication_count }),
                })}
              </p>
              {adherence.unmarked_today_count > 0 && (
                <div className="mt-3 p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 text-sm">
                  {t("health.todayUnmarked", { n: adherence.unmarked_today_count })}
                </div>
              )}
            </WellnessCard>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-gray-800" style={{ fontSize: "20px", fontWeight: 600 }}>
              {t("health.medsH2")}
            </h2>
            <button
              type="button"
              onClick={() => setAddingMed((v) => !v)}
              className="text-sm font-semibold text-violet-700 flex items-center gap-1"
            >
              <Plus size={16} /> {t("health.add")}
            </button>
          </div>

          {addingMed && (
            <WellnessCard className="mb-4">
              <div className="space-y-3">
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder={t("health.medNamePh")}
                  value={newMed.name}
                  onChange={(e) => setNewMed((m) => ({ ...m, name: e.target.value }))}
                />
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder={t("health.medDosagePh")}
                  value={newMed.dosage}
                  onChange={(e) => setNewMed((m) => ({ ...m, dosage: e.target.value }))}
                />
                <label className="block text-xs font-semibold text-gray-500">{t("health.reminderTime")}</label>
                <input
                  type="time"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm mt-1"
                  value={newMed.schedule_time}
                  onChange={(e) => setNewMed((m) => ({ ...m, schedule_time: e.target.value }))}
                />
                <WellnessButton variant="primary" size="small" onClick={addMedication}>
                  {t("health.saveMedication")}
                </WellnessButton>
              </div>
            </WellnessCard>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-gray-500 py-8">
              <Loader2 className="animate-spin" size={20} /> {t("mod.loading")}
            </div>
          ) : (
            <div className="space-y-3">
              {meds.map((med, index) => (
                <motion.div key={med.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                  <WellnessCard className={med.taken_today ? "border border-emerald-200 bg-emerald-50/30" : ""}>
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-14 h-14 rounded-[16px] flex items-center justify-center flex-shrink-0 ${
                          med.taken_today ? "bg-emerald-600" : "bg-slate-200"
                        }`}
                      >
                        {med.taken_today ? <Check size={28} className="text-white" strokeWidth={3} /> : <Pill size={28} className="text-slate-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2">
                          <h3 className="text-gray-800 font-semibold truncate">{med.name}</h3>
                          <button type="button" onClick={() => removeMedication(med.id)} className="text-gray-400 hover:text-red-600 p-1" aria-label={t("health.removeMedAria")}>
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-gray-600 text-sm mt-1">
                          {med.schedule_time ? (
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {formatScheduleDisplay(med.schedule_time)}
                            </span>
                          ) : null}
                          {med.dosage ? <span>{med.dosage}</span> : null}
                        </div>
                        {med.taken_today && med.last_taken_at && (
                          <p className="text-emerald-800 text-xs font-medium mt-1">
                            {t("health.loggedToday", { time: formatTakenAt(med.last_taken_at) })}
                          </p>
                        )}
                      </div>
                      {!med.taken_today && (
                        <WellnessButton variant="secondary" size="small" onClick={() => handleMarkTaken(med.id)}>
                          {t("health.markTaken")}
                        </WellnessButton>
                      )}
                    </div>
                  </WellnessCard>
                </motion.div>
              ))}
              {!meds.length && <p className="text-gray-500 text-sm">{t("health.noMedsYet")}</p>}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-gray-800" style={{ fontSize: "20px", fontWeight: 600 }}>
              {t("health.contactsH2")}
            </h2>
            <button type="button" onClick={() => setAddingContact((v) => !v)} className="text-sm font-semibold text-violet-700 flex items-center gap-1">
              <Plus size={16} /> {t("health.add")}
            </button>
          </div>

          {addingContact && (
            <WellnessCard className="mb-4">
              <div className="space-y-3">
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder={t("health.contactLabelPh")}
                  value={newContact.label}
                  onChange={(e) => setNewContact((c) => ({ ...c, label: e.target.value }))}
                />
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder={t("health.phonePh")}
                  value={newContact.phone}
                  onChange={(e) => setNewContact((c) => ({ ...c, phone: e.target.value }))}
                />
                <WellnessButton variant="primary" size="small" onClick={addContact}>
                  {t("health.saveContact")}
                </WellnessButton>
              </div>
            </WellnessCard>
          )}

          <WellnessCard>
            <div className="space-y-4">
              {contacts.map((c) => (
                <div key={c.id} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <Phone size={18} className="text-slate-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 font-semibold">{c.label}</p>
                    <p className="text-gray-600 text-sm">{c.phone}</p>
                  </div>
                  <button type="button" onClick={() => removeContact(c.id)} className="text-gray-400 hover:text-red-600 p-1" aria-label={t("health.removeContactAria")}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {!contacts.length && <p className="text-gray-500 text-sm">{t("health.noContactsYet")}</p>}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Phone size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-gray-800 font-semibold">{t("health.emergencyLineTitle")}</p>
                  <p className="text-gray-600 text-sm">{t("health.emergencyLineSub")}</p>
                </div>
              </div>
            </div>
          </WellnessCard>
        </motion.div>
      </div>

      {showSOSConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
          onClick={closeSosModal}
        >
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()}>
            <WellnessCard className="max-w-md w-full">
              <div className="text-center py-2">
                <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-white" strokeWidth={3} />
                </div>
                <h2 className="text-gray-800 mb-2 text-xl font-bold">{t("health.sosRecorded")}</h2>
                <p className="text-gray-600 mb-4 text-sm text-left">{sosMessage}</p>
                <p className="text-gray-800 text-sm font-semibold mb-2 text-left">{t("health.sosCallContacts")}</p>
                {sosContacts.length > 0 ? (
                  <ul className="space-y-2 mb-6 text-left">
                    {sosContacts.map((c) => {
                      const canDial = typeof c.tel_href === "string" && c.tel_href.length > 4;
                      return (
                        <li key={c.id}>
                          {canDial ? (
                            <a
                              href={c.tel_href}
                              className="inline-flex items-center gap-2 w-full justify-center rounded-2xl border-2 border-violet-300 bg-violet-50 text-violet-900 font-semibold py-3 px-4 hover:bg-violet-100"
                            >
                              <Phone size={18} />
                              {t("health.callContact", { label: c.label })}
                            </a>
                          ) : (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-gray-700">
                              <span className="font-semibold">{c.label}</span>
                              <span className="text-gray-500"> — {c.phone}</span>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-gray-600 text-sm mb-6 text-left">{t("health.sosNoContacts")}</p>
                )}
                <WellnessButton variant="primary" size="large" onClick={closeSosModal} className="w-full">
                  {t("health.sosClose")}
                </WellnessButton>
              </div>
            </WellnessCard>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
