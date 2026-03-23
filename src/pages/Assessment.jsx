import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useStore from "../store";
import { getAllQuestions, getWeeklyQuestions } from "../data/questions";
import QuestionScreen from "../components/QuestionScreen";
import ErrorBoundary from "../components/ErrorBoundary";
import { apiFetch } from "../lib/api";
import { useI18n } from "../contexts/LanguageContext";

const Assessment = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const authUser = useStore((s) => s.authUser);
  const setCurrentQuestionIndex = useStore((s) => s.setCurrentQuestionIndex);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);
  /** null = loading; true = first-time full (baseline + weekly); false = repeat weekly only */
  const [isInitialSurvey, setIsInitialSurvey] = useState(null);
  const [allQuestions, setAllQuestions] = useState([]);

  // Decide question set from server: full survey only if this elder has never submitted an assessment.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await apiFetch("/api/elder/assessments?limit=1");
        const initial = !Array.isArray(list) || list.length === 0;
        if (cancelled) return;
        setIsInitialSurvey(initial);
        setAllQuestions(initial ? getAllQuestions() : getWeeklyQuestions());
      } catch {
        if (cancelled) return;
        // Can't reach API: default to weekly-only so we don't block with the huge first-time form offline.
        setIsInitialSurvey(false);
        setAllQuestions(getWeeklyQuestions());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalQuestions = allQuestions.length;

  // Always start from 0 when entering assessment; keep index in sync and clamped
  useEffect(() => {
    setCurrentQuestionIndex(0);
    setCurrentIndex(0);
    setError(null);
    setHasStarted(false);
  }, [setCurrentQuestionIndex]);

  const safeIndex = Math.max(0, Math.min(currentIndex, Math.max(0, totalQuestions - 1)));
  const currentQuestion = allQuestions[safeIndex];
  const displayName = authUser?.name?.trim() || authUser?.email_or_phone || t("dash.guestName");

  useEffect(() => {
    if (totalQuestions > 0 && currentIndex !== safeIndex) {
      setCurrentIndex(safeIndex);
      setCurrentQuestionIndex(safeIndex);
    }
  }, [currentIndex, safeIndex, totalQuestions, setCurrentQuestionIndex]);

  const progress = totalQuestions > 0 ? (safeIndex / totalQuestions) * 100 : 0;

  const handleNext = () => {
    if (safeIndex < totalQuestions - 1) {
      const nextIndex = safeIndex + 1;
      setCurrentIndex(nextIndex);
      setCurrentQuestionIndex(nextIndex);
      setError(null);
    } else {
      navigate("/elder/summary", {
        state: {
          surveyMeta: {
            mode: isInitialSurvey ? "full" : "weekly",
            questions_in_flow: totalQuestions,
          },
        },
      });
    }
  };

  const handleBack = () => {
    if (safeIndex > 0) {
      const prevIndex = safeIndex - 1;
      setCurrentIndex(prevIndex);
      setCurrentQuestionIndex(prevIndex);
      setError(null);
    } else if (hasStarted) {
      setHasStarted(false);
    } else {
      navigate("/elder");
    }
  };

  if (error) {
    return (
      <div className="grace-card grace-card-pad">
        <p className="text-red-600 font-semibold">{t("assess.errorTitle")}</p>
        <p className="text-gray-700 text-sm mt-1">{error}</p>
        <button onClick={() => { setError(null); setCurrentIndex(0); setCurrentQuestionIndex(0); }} className="grace-pill-primary mt-3">
          {t("assess.startOver")}
        </button>
        <button onClick={() => navigate("/elder")} className="grace-pill-secondary mt-2 block">
          {t("assess.backToday")}
        </button>
      </div>
    );
  }

  if (isInitialSurvey === null) {
    return (
      <div className="grace-screen flex items-center justify-center px-4">
        <div className="grace-card grace-card-pad max-w-lg w-full text-center">
          <p className="text-gray-700">{t("assess.loading")}</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="grace-card grace-card-pad">
        <p className="text-gray-700">{t("assess.noQuestions")}</p>
        <button onClick={() => navigate("/elder")} className="grace-pill-secondary mt-3">{t("assess.backToday")}</button>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="grace-screen flex items-center justify-center px-4">
        <div className="grace-card grace-card-pad max-w-lg w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("assess.hi", { name: displayName })}</h2>
          {isInitialSurvey ? (
            <>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("assess.introFull1")}
              </p>
              <p className="text-gray-600 text-sm mb-6">
                {t("assess.introFull2")}
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("assess.introWeekly1")}
              </p>
              <p className="text-gray-600 text-sm mb-6">
                {t("assess.introWeekly2")}
              </p>
            </>
          )}
          <div className="flex flex-col gap-3">
            <button onClick={() => setHasStarted(true)} className="grace-pill-primary w-full">
              {t("assess.startCta")}
            </button>
            <button onClick={() => navigate("/elder")} className="grace-pill-secondary w-full">
              {t("assess.backDashboard")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      onRetry={() => { setCurrentIndex(0); setCurrentQuestionIndex(0); }}
      fallback={
        <div className="grace-card grace-card-pad">
          <p className="text-red-600 font-semibold">{t("assess.errorTitle")}</p>
          <p className="text-gray-700 text-sm mt-1">{t("assess.errorBoundarySub")}</p>
          <button onClick={() => { setError(null); setCurrentIndex(0); setCurrentQuestionIndex(0); }} className="grace-pill-primary mt-3">
            {t("assess.startOver")}
          </button>
          <button onClick={() => navigate("/elder")} className="grace-pill-secondary mt-2 block">
            {t("assess.backToday")}
          </button>
        </div>
      }
    >
      <QuestionScreen
        key={currentQuestion.id ?? safeIndex}
        question={currentQuestion}
        onNext={handleNext}
        onBack={handleBack}
        progress={progress}
        questionIndex={safeIndex}
        totalQuestions={totalQuestions}
      />
    </ErrorBoundary>
  );
};

export default Assessment;

