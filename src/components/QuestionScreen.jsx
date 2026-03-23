import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import useStore from "../store";
import ProgressBar from "./ProgressBar";
import SingleChoice from "./QuestionTypes/SingleChoice";
import MultipleChoice from "./QuestionTypes/MultipleChoice";
import TextInput from "./QuestionTypes/TextInput";
import LikertScale from "./QuestionTypes/LikertScale";
import SmileyScale from "./QuestionTypes/SmileyScale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "../contexts/LanguageContext";
import { localizeQuestion } from "../i18n/localizeQuestion";

const QuestionScreen = ({ question, onNext, onBack, progress, questionIndex = 0, totalQuestions = 1 }) => {
  const { t } = useI18n();
  const q = localizeQuestion(question, t);
  const savedForQuestion = useStore((s) => s.answers[question.id]);
  const setAnswer = useStore((s) => s.setAnswer);
  const setUserName = useStore((s) => s.setUserName);
  const setUserType = useStore((s) => s.setUserType);
  const [localAnswer, setLocalAnswer] = useState(savedForQuestion ?? null);

  useEffect(() => {
    setLocalAnswer(savedForQuestion ?? null);
  }, [question.id, savedForQuestion]);

  const handleNext = () => {
    if (localAnswer !== null && localAnswer !== "") {
      setAnswer(q.id, localAnswer);

      // Store user name and type for dashboard display
      if (q.id === "user_name") {
        setUserName(localAnswer);
      } else if (q.id === "user_type") {
        setUserType(localAnswer);
      }

      onNext();
    }
  };

  const handleBack = () => {
    onBack();
  };

  const options = Array.isArray(q.options) ? q.options : [];

  const renderQuestionInput = () => {
    switch (q.type) {
      case "single":
        return (
          <SingleChoice
            options={options}
            value={localAnswer}
            onChange={setLocalAnswer}
          />
        );
      case "multiple":
        return (
          <MultipleChoice
            options={options}
            value={localAnswer}
            onChange={setLocalAnswer}
          />
        );
      case "text":
        return (
          <TextInput
            value={localAnswer}
            onChange={setLocalAnswer}
            placeholder={t("assess.textPlaceholder")}
          />
        );
      case "likert":
        return (
          <LikertScale
            options={options}
            value={localAnswer}
            onChange={setLocalAnswer}
          />
        );
      case "smiley":
        return (
          <SmileyScale
            options={options}
            value={localAnswer}
            onChange={setLocalAnswer}
          />
        );
      default:
        return null;
    }
  };

  const canProceed =
    q.type === "multiple"
      ? localAnswer && localAnswer.length > 0
      : localAnswer !== null && localAnswer !== "";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
      className="grace-screen flex items-center justify-center px-4 py-6"
    >
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grace-card grace-card-pad"
        >
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-1">
              {t("assess.questionOf", { current: questionIndex + 1, total: totalQuestions })}
            </p>
            <ProgressBar progress={progress} />
            <p className="text-center text-sm text-gray-600 mt-2">
              {t("assess.percentDone", { pct: Math.round(progress) })}
            </p>
          </div>

          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 text-center mb-6">
            {q.text}
          </h2>

          <div className="space-y-4">{renderQuestionInput()}</div>

          <div className="flex justify-between items-center gap-4 mt-8 pt-6 border-t border-gray-100">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="flex items-center gap-2 grace-pill bg-white border border-teal-200 text-teal-700 hover:bg-teal-50 font-semibold"
          >
            <ChevronLeft className="w-5 h-5" />
            {t("auth.back")}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
            disabled={!canProceed}
            className={`flex items-center gap-2 grace-pill font-semibold transition-all duration-200 ${
              canProceed
                ? "bg-teal-500 hover:bg-teal-600 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {t("assess.next")}
            <ChevronRight className="w-5 h-5" />
          </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default QuestionScreen;
