import { useNavigate } from "react-router";
import { WellnessButton } from "../components/WellnessButton";
import { WellnessCard } from "../components/WellnessCard";
import { Heart } from "lucide-react";
import { motion } from "motion/react";

export function Welcome() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{
        background: "linear-gradient(135deg, #FFF5F7 0%, #F0E7FF 100%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col items-center mb-12"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6B8A] to-[#A78BFA] flex items-center justify-center mb-4 shadow-lg">
            <Heart size={40} className="text-white" fill="white" />
          </div>
          <h1
            className="text-[#FF6B8A] mb-2"
            style={{ fontSize: "42px", fontWeight: 700 }}
          >
            Grace
          </h1>
        </motion.div>

        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <WellnessCard gradient hover={false}>
            <div className="text-center mb-8">
              <h2
                className="text-gray-800 mb-3"
                style={{ fontSize: "28px", fontWeight: 600 }}
              >
                Welcome to Grace
              </h2>
              <p className="text-gray-600" style={{ fontSize: "16px" }}>
                Caregiver-first wellbeing check-ins for elders
              </p>
            </div>

            <div className="space-y-3">
              <WellnessButton
                variant="primary"
                size="large"
                onClick={() => navigate("/auth")}
                className="w-full"
              >
                Create account
              </WellnessButton>
              <WellnessButton
                variant="outline"
                size="large"
                onClick={() => navigate("/auth")}
                className="w-full"
              >
                Sign in
              </WellnessButton>
            </div>

            <button
              onClick={() => navigate("/elder")}
              className="w-full mt-4 text-[#A78BFA] hover:text-[#9777E8] transition-colors"
              style={{ fontSize: "14px" }}
            >
              Try a demo assessment
            </button>
          </WellnessCard>
        </motion.div>

        {/* Footer text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-8 text-gray-500"
          style={{ fontSize: "14px" }}
        >
          A compassionate companion for your wellbeing journey
        </motion.p>
      </motion.div>
    </div>
  );
}
