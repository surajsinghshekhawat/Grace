import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import useStore from "../store";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { getAssessmentEntryPath } from "../lib/assessmentEntry";
import { useI18n } from "../contexts/LanguageContext.jsx";

const Summary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const surveyMeta = location.state?.surveyMeta ?? null;
  const answers = useStore((state) => state.answers);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const setPrediction = useStore((state) => state.setPrediction);

  const handleSubmit = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const payload = { answers };
      if (surveyMeta?.mode) {
        payload.survey_meta = {
          mode: surveyMeta.mode,
          questions_in_flow: surveyMeta.questions_in_flow,
        };
      }
      const data = await apiFetch("/api/elder/assessments", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setPrediction(data);
      navigate("/elder");
    } catch (e) {
      const msg = e.message || t("auth.errorFailed");
      const isNotFound = /not found|404/i.test(msg);
      setSubmitError(isNotFound ? t("sum.backendDown") : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grace-screen">
      <div className="grace-container">
        <div className="grace-card grace-card-pad text-center">
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <h2 className="grace-title">{t("sum.title")}</h2>
            <p className="grace-subtitle mt-2">{t("sum.subtitle")}</p>
            {surveyMeta?.mode === "weekly" && (
              <div className="mt-4 p-4 rounded-2xl bg-teal-50 border border-teal-200 text-left text-teal-950 text-sm leading-relaxed">
                <strong className="font-semibold">{t("sum.weeklyTitle")}</strong>
                <span className="block mt-1 text-teal-900/90">
                  {typeof surveyMeta.questions_in_flow === "number"
                    ? t("sum.weeklyNumbered", { n: surveyMeta.questions_in_flow })
                    : t("sum.weeklyGeneric")}
                </span>
              </div>
            )}
            {surveyMeta?.mode === "full" && (
              <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left text-emerald-950 text-sm">
                <strong className="font-semibold">{t("sum.fullTitle")}</strong>
                <span className="block mt-1 text-emerald-900/90">{t("sum.fullBody")}</span>
              </div>
            )}
          </motion.div>

          {submitError && (
            <div className="mt-5 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-left" role="alert">
              <p className="font-medium">{submitError}</p>
              <p className="text-sm mt-2 text-red-600">{t("sum.errorHint")}</p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`w-full grace-pill font-semibold text-lg ${
                isSubmitting ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-teal-500 hover:bg-teal-600 text-white"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin" aria-hidden />
                  {t("sum.submitting")}
                </span>
              ) : (
                t("sum.submit")
              )}
            </motion.button>
            <button type="button" onClick={() => navigate(getAssessmentEntryPath())} className="grace-pill-secondary w-full">
              {t("sum.backToQuestions")}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Summary;
