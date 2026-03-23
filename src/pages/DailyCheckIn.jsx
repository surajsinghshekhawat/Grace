import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { WellnessButton } from "../components/WellnessButton";
import { WellnessCard } from "../components/WellnessCard";
import { ArrowLeft, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useStore from "../store";
import { apiFetch } from "../lib/api";
import { useI18n } from "../contexts/LanguageContext.jsx";

function q(id, t) {
  const base = `daily.q.${id}`;
  return {
    id,
    question: t(`${base}.question`),
    type: "emoji",
    emojis: [1, 2, 3, 4, 5].map((value) => ({
      emoji:
        id === "mood"
          ? ["😢", "😔", "😐", "🙂", "😊"][value - 1]
          : id === "energy"
            ? ["🔋", "🪫", "⚡", "✨", "💪"][value - 1]
            : id === "sleep"
              ? ["😴", "😪", "🌙", "😌", "✨"][value - 1]
              : id === "appetite"
                ? ["😣", "😕", "😐", "🙂", "😊"][value - 1]
                : id === "pain"
                  ? ["😊", "🙂", "😐", "😖", "😣"][value - 1]
                  : ["😔", "😕", "😐", "🙂", "🤗"][value - 1],
      label: t(`${base}.l${value}`),
      value,
    })),
  };
}

function getQuestions(t) {
  return [q("mood", t), q("energy", t), q("sleep", t), q("appetite", t), q("pain", t), q("loneliness", t)];
}

export default function DailyCheckIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const questions = useMemo(() => getQuestions(t), [t]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [direction, setDirection] = useState(1);

  const isCaregiverMode = location.pathname.startsWith("/caregiver");
  const elderId = isCaregiverMode ? location.pathname.match(/\/caregiver\/elders\/(\d+)/)?.[1] : null;

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleAnswer = (value) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    if (currentStep < questions.length - 1) {
      setDirection(1);
      setTimeout(() => setCurrentStep((s) => s + 1), 300);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    } else {
      navigate(-1);
    }
  };

  const allAnswered = questions.every((qItem) => answers[qItem.id] != null);

  const handleSubmit = async () => {
    if (!allAnswered) return;
    setError(null);
    setLoading(true);
    try {
      const body = {
        mood: answers.mood,
        energy: answers.energy,
        sleep: answers.sleep,
        appetite: answers.appetite,
        pain: answers.pain,
        loneliness: answers.loneliness,
      };
      if (isCaregiverMode && elderId) {
        await apiFetch(`/api/caregiver/elders/${elderId}/check-ins`, { method: "POST", body: JSON.stringify(body) });
      } else {
        await apiFetch("/api/check-ins/daily", { method: "POST", body: JSON.stringify(body) });
      }
      setShowSuccess(true);
      setTimeout(() => {
        if (isCaregiverMode && elderId) navigate(`/caregiver/elders/${elderId}`);
        else navigate("/elder");
      }, 2000);
    } catch (e) {
      setError(e.message || t("daily.error"));
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "linear-gradient(135deg, #FFF5F7 0%, #F0E7FF 100%)" }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#6EE7B7] to-[#93C5FD] flex items-center justify-center mx-auto mb-6" aria-hidden>
            <Check size={48} className="text-white" />
          </div>
          <h2 className="text-gray-800 mb-2" style={{ fontSize: "28px", fontWeight: 700 }}>
            {t("daily.successTitle")}
          </h2>
          <p className="text-gray-600" style={{ fontSize: "16px" }}>
            {t("daily.successSub")}
          </p>
        </motion.div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #ECFDF5 0%, #ECFEFF 100%)" }}>
      <div className="px-6 pt-12 pb-8" style={{ background: "linear-gradient(135deg, #CCFBF1 0%, #DCFCE7 100%)" }}>
        <div className="max-w-[600px] mx-auto">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-700 hover:text-emerald-700 transition-colors mb-6"
            aria-label={t("auth.back")}
          >
            <ArrowLeft size={20} aria-hidden />
            <span style={{ fontSize: "14px", fontWeight: 500 }}>{t("auth.back")}</span>
          </button>
          <div className="mb-2">
            <div className="flex justify-between text-gray-600 mb-2">
              <span style={{ fontSize: "14px", fontWeight: 500 }}>
                {t("daily.questionOf", { current: currentStep + 1, total: questions.length })}
              </span>
              <span style={{ fontSize: "14px", fontWeight: 500 }}>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-white/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 pb-6">
        <div className="max-w-[600px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 * direction }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 * direction }}
              transition={{ duration: 0.3 }}
            >
              <WellnessCard hover={false}>
                <h2 className="text-gray-800 mb-8 text-center" style={{ fontSize: "24px", fontWeight: 600, lineHeight: 1.4 }}>
                  {currentQuestion.question}
                </h2>
                {currentQuestion.type === "emoji" && (
                  <div className="space-y-3">
                    {currentQuestion.emojis?.map((item) => (
                      <motion.button
                        key={item.value}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAnswer(item.value)}
                        className={`w-full p-5 rounded-[20px] border-2 transition-all ${
                          answers[currentQuestion.id] === item.value
                            ? "border-emerald-600 bg-emerald-50"
                            : "border-gray-200 bg-white hover:border-emerald-400"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span style={{ fontSize: "40px" }} aria-hidden>
                            {item.emoji}
                          </span>
                          <span className="text-gray-800" style={{ fontSize: "18px", fontWeight: 500 }}>
                            {item.label}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
                {currentStep === questions.length - 1 && allAnswered && (
                  <div className="mt-6">
                    {error && (
                      <div className="mb-3 p-3 rounded-xl bg-red-50 text-red-700 text-sm" role="alert">
                        {error}
                      </div>
                    )}
                    <WellnessButton variant="primary" size="large" onClick={handleSubmit} disabled={loading} className="w-full">
                      {loading ? t("daily.submitting") : t("daily.complete")}
                    </WellnessButton>
                  </div>
                )}
              </WellnessCard>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
