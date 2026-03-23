import { useNavigate } from "react-router";
import { BottomNav } from "../components/BottomNav";
import { WellnessCard } from "../components/WellnessCard";
import { WellnessButton } from "../components/WellnessButton";
import { Heart, FileText, Share2, Smile, Lightbulb, TrendingUp } from "lucide-react";
import { motion } from "motion/react";

export function ElderHome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      {/* Header */}
      <div
        className="px-6 pt-12 pb-8"
        style={{
          background: "linear-gradient(135deg, #E0F7F4 0%, #E8DEFF 100%)",
        }}
      >
        <div className="max-w-[600px] mx-auto">
          <h1
            className="text-gray-800 mb-2"
            style={{ fontSize: "32px", fontWeight: 700 }}
          >
            Hello, Margaret
          </h1>
          <p className="text-gray-600" style={{ fontSize: "16px" }}>
            How are you feeling today?
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-4 max-w-[600px] mx-auto space-y-6">
        {/* Primary Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <WellnessCard gradient>
            <div className="space-y-3">
              <WellnessButton
                variant="primary"
                size="large"
                onClick={() => navigate("/elder/check-in")}
                className="w-full flex items-center justify-center gap-3"
              >
                <Heart size={24} />
                <span style={{ fontSize: "18px" }}>Daily Check-in</span>
              </WellnessButton>
              <WellnessButton
                variant="secondary"
                size="large"
                onClick={() => navigate("/elder/assessment")}
                className="w-full flex items-center justify-center gap-3"
              >
                <FileText size={24} />
                <span style={{ fontSize: "18px" }}>Weekly Assessment</span>
              </WellnessButton>
            </div>
          </WellnessCard>
        </motion.div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <WellnessCard hover>
              <button
                onClick={() => navigate("/elder/share")}
                className="w-full text-center"
              >
                <div className="w-14 h-14 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-3">
                  <Share2 size={24} className="text-[#FF6B8A]" />
                </div>
                <p
                  className="text-gray-800"
                  style={{ fontSize: "14px", fontWeight: 600 }}
                >
                  Share with Caregiver
                </p>
              </button>
            </WellnessCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <WellnessCard hover>
              <button
                onClick={() => navigate("/resources")}
                className="w-full text-center"
              >
                <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                  <Heart size={24} className="text-[#A78BFA]" />
                </div>
                <p
                  className="text-gray-800"
                  style={{ fontSize: "14px", fontWeight: 600 }}
                >
                  Resources
                </p>
              </button>
            </WellnessCard>
          </motion.div>
        </div>

        {/* Last Check-in Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <WellnessCard>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B8A] to-[#A78BFA] flex items-center justify-center flex-shrink-0">
                <Smile size={24} className="text-white" />
              </div>
              <div>
                <h3
                  className="text-gray-800 mb-1"
                  style={{ fontSize: "18px", fontWeight: 600 }}
                >
                  Your Last Check-in
                </h3>
                <p className="text-gray-500" style={{ fontSize: "14px" }}>
                  Yesterday at 2:30 PM
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: "Mood", value: "Good", color: "#FF6B8A" },
                { label: "Energy", value: "Moderate", color: "#A78BFA" },
                { label: "Sleep", value: "Excellent", color: "#6EE7B7" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between items-center p-3 rounded-[12px] bg-gray-50"
                >
                  <span className="text-gray-700" style={{ fontSize: "14px", fontWeight: 500 }}>
                    {item.label}
                  </span>
                  <span
                    className="px-3 py-1 rounded-full text-white"
                    style={{
                      backgroundColor: item.color,
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate("/elder/results")}
              className="w-full mt-4 text-[#FF6B8A] hover:text-[#FF5577] transition-colors"
              style={{ fontSize: "14px", fontWeight: 600 }}
            >
              View full results →
            </button>
          </WellnessCard>
        </motion.div>

        {/* Personalized Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <WellnessCard>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <Lightbulb size={24} className="text-yellow-600" />
              </div>
              <h2
                className="text-gray-800"
                style={{ fontSize: "20px", fontWeight: 600 }}
              >
                For You Today
              </h2>
            </div>

            <div className="space-y-3">
              {[
                {
                  title: "Stay socially connected",
                  desc: "How about calling a friend or family member today?",
                  color: "#FF6B8A",
                },
                {
                  title: "Maintain your sleep routine",
                  desc: "Your sleep quality is excellent. Keep it up!",
                  color: "#6EE7B7",
                },
              ].map((rec, i) => (
                <div
                  key={i}
                  className="p-4 rounded-[16px] border-l-4"
                  style={{
                    backgroundColor: `${rec.color}10`,
                    borderColor: rec.color,
                  }}
                >
                  <p
                    className="text-gray-800 mb-1"
                    style={{ fontSize: "14px", fontWeight: 600 }}
                  >
                    {rec.title}
                  </p>
                  <p className="text-gray-600" style={{ fontSize: "13px" }}>
                    {rec.desc}
                  </p>
                </div>
              ))}
            </div>
          </WellnessCard>
        </motion.div>

        {/* Quality of Life Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <WellnessCard>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={24} className="text-[#A78BFA]" />
              </div>
              <div className="flex-1">
                <h2
                  className="text-gray-800 mb-1"
                  style={{ fontSize: "18px", fontWeight: 600 }}
                >
                  Quality of Life Score
                </h2>
                <span
                  className="text-gray-800"
                  style={{ fontSize: "32px", fontWeight: 700 }}
                >
                  8.2<span className="text-gray-500" style={{ fontSize: "18px" }}>/10</span>
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "82%" }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="h-full bg-gradient-to-r from-[#A78BFA] to-[#93C5FD] rounded-full"
                />
              </div>

              <div className="flex items-center gap-2 text-green-600">
                <TrendingUp size={16} />
                <span style={{ fontSize: "14px", fontWeight: 600 }}>
                  +0.4 from last week
                </span>
              </div>
            </div>
          </WellnessCard>
        </motion.div>

        {/* Encouragement Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div
            className="rounded-[20px] p-6 text-center"
            style={{
              background: "linear-gradient(135deg, #FF6B8A 0%, #A78BFA 100%)",
            }}
          >
            <p
              className="text-white mb-2"
              style={{ fontSize: "18px", fontWeight: 600 }}
            >
              You're doing great! 🌟
            </p>
            <p className="text-white/90" style={{ fontSize: "14px" }}>
              Keep up with your daily check-ins to track your wellbeing journey
            </p>
          </div>
        </motion.div>
      </div>

      <BottomNav type="elder" />
    </div>
  );
}