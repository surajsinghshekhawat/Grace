import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { WellnessButton } from "../components/WellnessButton";
import { WellnessCard } from "../components/WellnessCard";
import { ArrowLeft, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const questions = [
  {
    id: 1,
    question: "How is your mood today?",
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
    question: "How is your energy level?",
    type: "emoji",
    emojis: [
      { emoji: "🔋", label: "Empty", value: 1 },
      { emoji: "🪫", label: "Low", value: 2 },
      { emoji: "⚡", label: "Moderate", value: 3 },
      { emoji: "✨", label: "High", value: 4 },
      { emoji: "💪", label: "Excellent", value: 5 },
    ],
  },
  {
    id: 3,
    question: "How well did you sleep last night?",
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
    question: "Are you experiencing any pain?",
    type: "emoji",
    emojis: [
      { emoji: "😣", label: "Severe", value: 5 },
      { emoji: "😖", label: "Moderate", value: 4 },
      { emoji: "😐", label: "Mild", value: 3 },
      { emoji: "🙂", label: "Very little", value: 2 },
      { emoji: "😊", label: "None", value: 1 },
    ],
  },
  {
    id: 5,
    question: "How connected do you feel to others?",
    type: "emoji",
    emojis: [
      { emoji: "😔", label: "Very lonely", value: 1 },
      { emoji: "😕", label: "Lonely", value: 2 },
      { emoji: "😐", label: "Neutral", value: 3 },
      { emoji: "🙂", label: "Connected", value: 4 },
      { emoji: "🤗", label: "Very connected", value: 5 },
    ],
  },
  {
    id: 6,
    question: "Any additional notes?",
    type: "text",
  },
];

export function DailyCheckIn() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [direction, setDirection] = useState(1);

  // Detect if this is caregiver or elder mode
  const isCaregiverMode = location.pathname.startsWith("/caregiver");

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleAnswer = (value: any) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
    
    if (currentStep < questions.length - 1) {
      setDirection(1);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 300);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = () => {
    setShowSuccess(true);
    setTimeout(() => {
      if (isCaregiverMode && id) {
        navigate(`/caregiver/elder/${id}`);
      } else {
        navigate("/elder");
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
            Check-in Complete!
          </h2>
          <p className="text-gray-600" style={{ fontSize: "16px" }}>
            Thank you for sharing how you're feeling
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(135deg, #FFF5F7 0%, #F0E7FF 100%)",
      }}
    >
      {/* Header */}
      <div className="px-6 pt-12 pb-8"
        style={{
          background: "linear-gradient(135deg, #E0F7F4 0%, #E8DEFF 100%)",
        }}
      >
        <div className="max-w-[600px] mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-700 hover:text-[#FF6B8A] transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            <span style={{ fontSize: "14px", fontWeight: 500 }}>Back</span>
          </button>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-gray-600 mb-2">
              <span style={{ fontSize: "14px", fontWeight: 500 }}>
                Question {currentStep + 1} of {questions.length}
              </span>
              <span style={{ fontSize: "14px", fontWeight: 500 }}>
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-2 bg-white/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#FF6B8A] to-[#A78BFA] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
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
                <h2
                  className="text-gray-800 mb-8 text-center"
                  style={{ fontSize: "24px", fontWeight: 600, lineHeight: 1.4 }}
                >
                  {currentQuestion.question}
                </h2>

                {currentQuestion.type === "emoji" && (
                  <div className="space-y-3">
                    {currentQuestion.emojis?.map((item) => (
                      <motion.button
                        key={item.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAnswer(item.value)}
                        className={`w-full p-5 rounded-[20px] border-2 transition-all ${
                          answers[currentQuestion.id] === item.value
                            ? "border-[#FF6B8A] bg-pink-50"
                            : "border-gray-200 bg-white hover:border-[#FF6B8A]/50"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span style={{ fontSize: "40px" }}>{item.emoji}</span>
                          <span
                            className="text-gray-800"
                            style={{ fontSize: "18px", fontWeight: 500 }}
                          >
                            {item.label}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}

                {currentQuestion.type === "text" && (
                  <div className="space-y-4">
                    <textarea
                      value={answers[currentQuestion.id] || ""}
                      onChange={(e) =>
                        setAnswers({ ...answers, [currentQuestion.id]: e.target.value })
                      }
                      placeholder="Share any thoughts or concerns... (optional)"
                      className="w-full px-4 py-4 rounded-[16px] bg-white border-2 border-gray-200 focus:border-[#FF6B8A] focus:outline-none transition-colors resize-none"
                      rows={6}
                      style={{ fontSize: "16px" }}
                    />
                    <WellnessButton
                      variant="primary"
                      size="large"
                      onClick={handleSubmit}
                      className="w-full"
                    >
                      Complete Check-in
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