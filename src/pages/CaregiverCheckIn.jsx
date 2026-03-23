import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useI18n } from "../contexts/LanguageContext.jsx";

function getQuestions(t) {
  return [
    { key: "mood", title: t("cgCheckIn.q.mood.title"), low: t("cgCheckIn.q.mood.low"), high: t("cgCheckIn.q.mood.high") },
    { key: "energy", title: t("cgCheckIn.q.energy.title"), low: t("cgCheckIn.q.energy.low"), high: t("cgCheckIn.q.energy.high") },
    { key: "sleep", title: t("cgCheckIn.q.sleep.title"), low: t("cgCheckIn.q.sleep.low"), high: t("cgCheckIn.q.sleep.high") },
    { key: "appetite", title: t("cgCheckIn.q.appetite.title"), low: t("cgCheckIn.q.appetite.low"), high: t("cgCheckIn.q.appetite.high") },
    { key: "pain", title: t("cgCheckIn.q.pain.title"), low: t("cgCheckIn.q.pain.low"), high: t("cgCheckIn.q.pain.high") },
    {
      key: "loneliness",
      title: t("cgCheckIn.q.loneliness.title"),
      low: t("cgCheckIn.q.loneliness.low"),
      high: t("cgCheckIn.q.loneliness.high"),
    },
  ];
}

const ScaleButton = ({ value, selected, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(value)}
    className={`w-14 h-14 rounded-2xl font-bold text-lg transition ${
      selected ? "bg-teal-500 text-white shadow-lg" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
  >
    {value}
  </button>
);

const CaregiverCheckIn = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { elderUserId } = useParams();
  const [idx, setIdx] = useState(0);
  const [values, setValues] = useState(() => ({}));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const questions = useMemo(() => getQuestions(t), [t]);
  const elderId = Number(elderUserId);
  const current = questions[idx];
  const isLast = idx === questions.length - 1;

  const canSubmit = useMemo(() => {
    return questions.every((q) => typeof values[q.key] === "number");
  }, [values, questions]);

  const setValue = (k, v) => setValues((s) => ({ ...s, [k]: v }));

  const next = () => setIdx((i) => Math.min(i + 1, questions.length - 1));
  const back = () => setIdx((i) => Math.max(i - 1, 0));

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await apiFetch(`/api/caregiver/elders/${elderId}/check-ins`, {
        method: "POST",
        body: JSON.stringify(values),
      });
      navigate(`/caregiver/elders/${elderId}`);
    } catch (e) {
      setError(e.message || t("cgCheckIn.error"));
    } finally {
      setLoading(false);
    }
  };

  if (!current) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grace-screen">
      <div className="grace-container">
        <div className="grace-card grace-card-pad">
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => navigate(`/caregiver/elders/${elderId}`)}
              className="grace-pill-secondary px-4 py-2"
            >
              {t("auth.back")}
            </button>
            <div className="text-sm text-gray-500">
              {t("cgCheckIn.progress", { current: idx + 1, total: questions.length })}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700" role="alert">
              {error}
            </div>
          )}

          <h2 className="text-3xl font-bold text-gray-800 mb-3">{current.title}</h2>
          <p className="text-gray-500 mb-8">{t("cgCheckIn.scaleHint")}</p>

          <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
            <span>{current.low}</span>
            <span>{current.high}</span>
          </div>

          <div className="flex justify-center gap-3 mb-10">
            {[1, 2, 3, 4, 5].map((v) => (
              <ScaleButton
                key={v}
                value={v}
                selected={values[current.key] === v}
                onClick={(val) => setValue(current.key, val)}
              />
            ))}
          </div>

          <div className="flex justify-between gap-3">
            <button
              type="button"
              onClick={back}
              disabled={idx === 0}
              className={`grace-pill px-6 py-3 ${
                idx === 0 ? "bg-gray-200 text-gray-400" : "bg-white border border-teal-200 text-teal-700 hover:bg-teal-50"
              }`}
            >
              {t("cgCheckIn.previous")}
            </button>

            {isLast ? (
              <button
                type="button"
                onClick={submit}
                disabled={loading || !canSubmit}
                className={`grace-pill px-8 py-3 ${
                  loading || !canSubmit ? "bg-gray-300 text-gray-500" : "bg-teal-500 hover:bg-teal-600 text-white"
                }`}
              >
                {loading ? t("cgCheckIn.submitting") : t("cgCheckIn.submit")}
              </button>
            ) : (
              <button
                type="button"
                onClick={next}
                disabled={typeof values[current.key] !== "number"}
                className={`grace-pill px-8 py-3 ${
                  typeof values[current.key] !== "number"
                    ? "bg-gray-300 text-gray-500"
                    : "bg-teal-500 hover:bg-teal-600 text-white"
                }`}
              >
                {t("cgCheckIn.next")}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CaregiverCheckIn;
