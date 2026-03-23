import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WellnessButton } from "../components/WellnessButton";
import { WellnessCard } from "../components/WellnessCard";
import { ArrowLeft, Heart, Lock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "../contexts/LanguageContext.jsx";
import { markAssessmentOnboardingDone } from "../lib/assessmentEntry";

const STEPS = [
  { key: "onb.step1Title", subKey: "onb.step1Body", icon: Sparkles },
  { key: "onb.step2Title", subKey: "onb.step2Body", icon: Heart },
  { key: "onb.step3Title", subKey: "onb.step3Body", icon: Lock },
];

export default function ElderAssessmentOnboarding() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const total = STEPS.length;
  const { key, subKey, icon: Icon } = STEPS[step];

  const goNext = () => {
    if (step < total - 1) {
      setStep((s) => s + 1);
      return;
    }
    markAssessmentOnboardingDone();
    navigate("/elder/assessment");
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      <div className="px-6 pt-10 pb-6 bg-slate-100 border-b border-slate-200/80">
        <div className="max-w-[600px] mx-auto">
          <button
            type="button"
            onClick={() => (step > 0 ? setStep((s) => s - 1) : navigate("/elder"))}
            className="flex items-center gap-2 text-gray-700 hover:text-emerald-700 transition-colors mb-4"
            aria-label={t("auth.back")}
          >
            <ArrowLeft size={20} aria-hidden />
            <span className="text-sm font-medium">{t("auth.back")}</span>
          </button>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 mb-1">{t("onb.kicker")}</p>
          <h1 className="text-gray-800 text-2xl font-bold">{t("onb.title")}</h1>
          <p className="text-gray-600 text-sm mt-2">
            {t("onb.progress", { current: step + 1, total })}
          </p>
        </div>
      </div>

      <div className="px-6 -mt-4 max-w-[600px] mx-auto">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <WellnessCard>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center">
                <Icon className="text-violet-600" size={32} aria-hidden />
              </div>
            </div>
            <h2 className="text-lg font-bold text-gray-900 text-center mb-3">{t(key)}</h2>
            <p className="text-gray-600 text-[15px] leading-relaxed text-center">{t(subKey)}</p>
          </WellnessCard>
        </motion.div>

        <div className="mt-6 flex gap-3">
          {step > 0 && (
            <WellnessButton variant="outline" className="flex-1" onClick={() => setStep((s) => s - 1)}>
              {t("onb.back")}
            </WellnessButton>
          )}
          <WellnessButton variant="primary" className="flex-1" onClick={goNext}>
            {step < total - 1 ? t("onb.next") : t("onb.start")}
          </WellnessButton>
        </div>
      </div>
    </div>
  );
}
