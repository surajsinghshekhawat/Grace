import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { WellnessButton } from "../components/WellnessButton";
import { WellnessCard } from "../components/WellnessCard";
import { ArrowLeft, Check } from "lucide-react";
import { motion } from "motion/react";

const assessmentQuestions = [
  {
    id: 1,
    question: "Over the past week, have you felt down, depressed, or hopeless?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
  },
  {
    id: 2,
    question: "Have you had little interest or pleasure in doing things?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
  },
  {
    id: 3,
    question: "How would you rate your overall quality of life this week?",
    options: ["Poor", "Fair", "Good", "Very good", "Excellent"],
  },
  {
    id: 4,
    question: "Have you engaged in activities you enjoy this week?",
    options: ["Not at all", "Once or twice", "Several times", "Daily"],
  },
  {
    id: 5,
    question: "How often have you connected with family or friends?",
    options: ["Not at all", "Once or twice", "Several times", "Daily"],
  },
];

export function WeeklyAssessment() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Detect if this is caregiver or elder mode
  const isCaregiverMode = location.pathname.startsWith("/caregiver");

  const progress = (Object.keys(answers).length / assessmentQuestions.length) * 100;
  const allAnswered = Object.keys(answers).length === assessmentQuestions.length;

  const handleAnswer = (questionId: number, optionIndex: number) => {
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  const handleSubmit = () => {
    setShowSuccess(true);
    setTimeout(() => {
      if (isCaregiverMode && id) {
        navigate(`/caregiver/elder/${id}`);
      } else {
        navigate("/elder/results");
      }
    }, 2000);
  };

  if (showSuccess) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{
          background: "linear-gradient(135deg, #FFF5F7 0%, #F0E7FF 100%)",
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#6EE7B7] to-[#93C5FD] flex items-center justify-center mx-auto mb-6">
            <Check size={48} className="text-white" />
          </div>
          <h2
            className="text-gray-800 mb-2"
            style={{ fontSize: "28px", fontWeight: 700 }}
          >
            Assessment Complete!
          </h2>
          <p className="text-gray-600" style={{ fontSize: "16px" }}>
            Processing your wellbeing snapshot...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      {/* Header */}
      <div
        className="px-6 pt-12 pb-8"
        style={{
          background: "linear-gradient(135deg, #E0F7F4 0%, #E8DEFF 100%)",
        }}
      >
        <div className="max-w-[800px] mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-700 hover:text-[#FF6B8A] transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span style={{ fontSize: "14px", fontWeight: 500 }}>Back</span>
          </button>

          <h1
            className="text-gray-800 mb-3"
            style={{ fontSize: "28px", fontWeight: 700 }}
          >
            Weekly Assessment
          </h1>
          <p className="text-gray-600 mb-6" style={{ fontSize: "16px" }}>
            Take a moment to reflect on your week
          </p>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-gray-600 mb-2">
              <span style={{ fontSize: "14px", fontWeight: 500 }}>
                {Object.keys(answers).length} of {assessmentQuestions.length} answered
              </span>
              <span style={{ fontSize: "14px", fontWeight: 500 }}>
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-2 bg-white/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#FF6B8A] to-[#A78BFA] rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="px-6 -mt-4 max-w-[800px] mx-auto space-y-5">
        {assessmentQuestions.map((q, index) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <WellnessCard>
              <div className="flex gap-3 mb-4">
                <div
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B8A] to-[#A78BFA] flex items-center justify-center text-white flex-shrink-0"
                  style={{ fontSize: "14px", fontWeight: 600 }}
                >
                  {index + 1}
                </div>
                <h3
                  className="text-gray-800 flex-1"
                  style={{ fontSize: "18px", fontWeight: 600, lineHeight: 1.4 }}
                >
                  {q.question}
                </h3>
              </div>

              <div className="space-y-2 ml-11">
                {q.options.map((option, optionIndex) => (
                  <motion.button
                    key={optionIndex}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleAnswer(q.id, optionIndex)}
                    className={`w-full px-4 py-3 rounded-[16px] border-2 transition-all text-left ${
                      answers[q.id] === optionIndex
                        ? "border-[#FF6B8A] bg-pink-50"
                        : "border-gray-200 bg-white hover:border-[#FF6B8A]/50"
                    }`}
                  >
                    <span
                      className="text-gray-800"
                      style={{ fontSize: "16px", fontWeight: 500 }}
                    >
                      {option}
                    </span>
                  </motion.button>
                ))}
              </div>
            </WellnessCard>
          </motion.div>
        ))}

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="pt-4"
        >
          <WellnessButton
            variant="primary"
            size="large"
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="w-full"
          >
            {allAnswered
              ? "Submit Assessment"
              : `Answer ${assessmentQuestions.length - Object.keys(answers).length} more questions`}
          </WellnessButton>
        </motion.div>

        <p
          className="text-center text-gray-500 pb-6"
          style={{ fontSize: "13px" }}
        >
          Your responses are confidential and help us provide better care
        </p>
      </div>
    </div>
  );
}