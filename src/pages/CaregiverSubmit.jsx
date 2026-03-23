import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

import useStore from "../store";
import { apiFetch } from "../lib/api";
import { useI18n } from "../contexts/LanguageContext.jsx";

const CaregiverSubmit = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { elderUserId } = useParams();
  const answers = useStore((s) => s.answers);
  const setPrediction = useStore((s) => s.setPrediction);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleSubmit = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const data = await apiFetch(`/api/caregiver/elders/${elderUserId}/assessments`, {
        method: "POST",
        body: JSON.stringify({
          answers,
          survey_meta: {
            mode: "weekly",
            questions_in_flow: Object.keys(answers || {}).length || undefined,
          },
        }),
      });
      setPrediction(data);
      navigate(`/caregiver/elders/${elderUserId}`);
    } catch (e) {
      setSubmitError(e.message || t("auth.errorFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grace-card grace-card-pad">
        <h1 className="grace-title">{t("cgSubmit.title")}</h1>
        <p className="grace-subtitle">{t("cgSubmit.subtitle")}</p>
      </div>

      {submitError && (
        <div className="grace-card grace-card-pad border border-red-200 bg-red-50/60 text-red-700" role="alert">
          {submitError}
        </div>
      )}

      <div className="grace-card grace-card-pad">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`w-full grace-pill font-semibold ${
            isSubmitting ? "bg-gray-300 text-gray-600" : "bg-teal-500 hover:bg-teal-600 text-white"
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin" aria-hidden />
              {t("cgSubmit.submitting")}
            </span>
          ) : (
            t("cgSubmit.primary")
          )}
        </button>

        <button
          type="button"
          onClick={() => navigate(`/caregiver/elders/${elderUserId}`)}
          className="mt-3 w-full grace-pill-secondary"
        >
          {t("cgSubmit.cancel")}
        </button>
      </div>
    </div>
  );
};

export default CaregiverSubmit;
