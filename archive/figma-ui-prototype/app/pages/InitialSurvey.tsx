import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { WellnessButton } from "../components/WellnessButton";
import { WellnessCard } from "../components/WellnessCard";
import { ArrowLeft, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const surveyQuestions = [
  {
    id: 1,
    question: "How would you describe your mood over the past week?",
    type: "emoji",
    emojis: [
      { emoji: "😢", label: "Very sad", value: 1 },
      { emoji: "😔", label: "Sad", value: 2 },
      { emoji: "😐", label: "Neutral", value: 3 },
      { emoji: "🙂", label: "Good", value: 4 },
      { emoji: "😊", label: "Very good", value: 5 },
    ],
  },
  {
    id: 2,
    question: "How has your energy level been?",
    type: "emoji",
    emojis: [
      { emoji: "🔋", label: "Very low", value: 1 },
      { emoji: "🪫", label: "Low", value: 2 },
      { emoji: "⚡", label: "Moderate", value: 3 },
      { emoji: "✨", label: "High", value: 4 },
      { emoji: "💪", label: "Excellent", value: 5 },
    ],
  },
  {
    id: 3,
    question: "How well have you been sleeping?",
    type: "emoji",
    emojis: [
      { emoji: "😴", label: "Very poor", value: 1 },
      { emoji: "😪", label: "Poor", value: 2 },
      { emoji: "🌙", label: "Okay", value: 3 },
      { emoji: "😌", label: "Good", value: 4 },
      { emoji: "✨", label: "Excellent", value: 5 },
    ],
  },
  {
    id: 4,
    question: "How has your appetite been?",
    type: "scale",
    options: ["Very poor", "Poor", "Normal", "Good", "Very good"],
  },
  {
    id: 5,
    question: "Have you experienced pain or discomfort?",
    type: "emoji",
    emojis: [
      { emoji: "😣", label: "Severe", value: 5 },
      { emoji: "😖", label: "Moderate", value: 4 },
      { emoji: "😕", label: "Mild", value: 3 },
      { emoji: "🙂", label: "Slight", value: 2 },
      { emoji: "😊", label: "None", value: 1 },
    ],
  },
  {
    id: 6,
    question: "How often have you felt lonely?",
    type: "scale",
    options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
  },
  {
    id: 7,
    question: "How often have you connected with others?",
    type: "emoji",
    emojis: [
      { emoji: "🚫", label: "Never", value: 1 },
      { emoji: "😔", label: "Rarely", value: 2 },
      { emoji: "🤝", label: "Sometimes", value: 3 },
      { emoji: "👥", label: "Often", value: 4 },
      { emoji: "💚", label: "Daily", value: 5 },
    ],
  },
  {
    id: 8,
    question: "How active have you been?",
    type: "emoji",
    emojis: [
      { emoji: "🛋️", label: "Not active", value: 1 },
      { emoji: "🚶", label: "Slightly active", value: 2 },
      { emoji: "🏃", label: "Moderately active", value: 3 },
      { emoji: "💪", label: "Very active", value: 4 },
      { emoji: "⚡", label: "Extremely active", value: 5 },
    ],
  },
];

export function InitialSurvey() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = location.state?.role || "elder";
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [direction, setDirection] = useState(1);

  const currentQuestion = surveyQuestions[currentStep];
  const progress = ((currentStep + 1) / surveyQuestions.length) * 100;

  const handleAnswer = (value: any) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
    
    if (currentStep < surveyQuestions.length - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Save survey results (would be sent to backend/ML model)
    console.log("Survey completed:", answers);
    setShowSuccess(true);
    
    setTimeout(() => {
      if (role === "elder") {
        navigate("/elder");
      } else {
        navigate("/caregiver");
      }
    }, 2500);
  };

  if (showSuccess) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{
          background: "linear-gradient(135deg, #E0F7F4 0%, #E8DEFF 100%)",
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#6EE7B7] to-[#A78BFA] flex items-center justify-center mx-auto mb-6">
            <Check size={56} className="text-white" strokeWidth={3} />
          </div>
          <h2
            className="text-gray-800 mb-3"
            style={{ fontSize: "32px", fontWeight: 700 }}
          >
            All Set! 🎉
          </h2>
          <p className="text-gray-600 max-w-md mx-auto" style={{ fontSize: "18px" }}>
            Thank you for sharing. We're creating your personalized wellness journey...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div
        className="px-6 pt-12 pb-8"
        style={{
          background: "linear-gradient(135deg, #E0F7F4 0%, #E8DEFF 100%)",
        }}
      >
        <div className="max-w-[800px] mx-auto">
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-700 hover:text-[#6EE7B7] transition-colors mb-4"
            >
              <ArrowLeft size={20} />
              <span style={{ fontSize: "14px", fontWeight: 500 }}>Back</span>
            </button>
          )}

          <h1
            className="text-gray-800 mb-2"
            style={{ fontSize: "24px", fontWeight: 700 }}
          >
            Welcome to Grace
          </h1>
          <p className="text-gray-600 mb-6" style={{ fontSize: "16px" }}>
            Let's understand your wellbeing
          </p>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-gray-600 mb-2">
              <span style={{ fontSize: "14px", fontWeight: 500 }}>
                Question {currentStep + 1} of {surveyQuestions.length}
              </span>
              <span style={{ fontSize: "14px", fontWeight: 500 }}>
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-2 bg-white/60 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#6EE7B7] to-[#A78BFA] rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="px-6 -mt-4 max-w-[800px] mx-auto">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            initial={{ opacity: 0, x: direction * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -50 }}
            transition={{ duration: 0.3 }}
          >
            <WellnessCard>
              <h2
                className="text-gray-800 mb-6 text-center"
                style={{ fontSize: "22px", fontWeight: 600, lineHeight: 1.4 }}
              >
                {currentQuestion.question}
              </h2>

              {currentQuestion.type === "emoji" && (
                <div className="flex flex-wrap justify-center gap-4">
                  {currentQuestion.emojis?.map((item, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAnswer(item.value)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-[20px] transition-all min-w-[90px] ${
                        answers[currentQuestion.id] === item.value
                          ? "bg-gradient-to-br from-[#6EE7B7]/20 to-[#A78BFA]/20 border-2 border-[#6EE7B7]"
                          : "bg-white border-2 border-gray-200 hover:border-[#6EE7B7]/50"
                      }`}
                    >
                      <span style={{ fontSize: "40px" }}>{item.emoji}</span>
                      <span
                        className="text-gray-700 text-center"
                        style={{ fontSize: "13px", fontWeight: 500 }}
                      >
                        {item.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}

              {currentQuestion.type === "scale" && (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleAnswer(index)}
                      className={`w-full px-5 py-4 rounded-[16px] border-2 transition-all text-left ${
                        answers[currentQuestion.id] === index
                          ? "border-[#6EE7B7] bg-gradient-to-br from-[#6EE7B7]/10 to-[#A78BFA]/10"
                          : "border-gray-200 bg-white hover:border-[#6EE7B7]/50"
                      }`}
                    >
                      <span
                        className="text-gray-800"
                        style={{ fontSize: "17px", fontWeight: 500 }}
                      >
                        {option}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}
            </WellnessCard>

            <p
              className="text-center text-gray-500 mt-6"
              style={{ fontSize: "13px" }}
            >
              Your responses help us personalize your experience
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
