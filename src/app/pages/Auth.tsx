import { useState } from "react";
import { useNavigate } from "react-router";
import { WellnessButton } from "../components/WellnessButton";
import { WellnessCard } from "../components/WellnessCard";
import { Heart } from "lucide-react";
import { motion } from "motion/react";

export function Auth() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("signup");
  const [role, setRole] = useState<"elder" | "caregiver">("elder");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "signup") {
      // After signup, go to initial survey
      navigate("/survey", { state: { role } });
    } else {
      // After login, go directly to dashboard
      if (role === "elder") {
        navigate("/elder");
      } else {
        navigate("/caregiver");
      }
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{
        background: "linear-gradient(135deg, #FFF5F7 0%, #F0E7FF 100%)",
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF6B8A] to-[#A78BFA] flex items-center justify-center mb-3">
            <Heart size={32} className="text-white" fill="white" />
          </div>
          <h1
            className="text-[#FF6B8A]"
            style={{ fontSize: "32px", fontWeight: 700 }}
          >
            Grace
          </h1>
        </div>

        <WellnessCard>
          {/* Tabs */}
          <div className="flex rounded-[16px] bg-gray-100 p-1 mb-6">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-2.5 rounded-[12px] transition-all font-medium ${
                activeTab === "login"
                  ? "bg-white text-[#FF6B8A] shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              className={`flex-1 py-2.5 rounded-[12px] transition-all font-medium ${
                activeTab === "signup"
                  ? "bg-white text-[#FF6B8A] shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selector */}
            <div>
              <label
                className="block text-gray-700 mb-2"
                style={{ fontSize: "14px", fontWeight: 600 }}
              >
                I am a...
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRole("elder")}
                  className={`flex-1 py-3 rounded-[16px] font-medium transition-all ${
                    role === "elder"
                      ? "bg-[#FF6B8A] text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Elder
                </button>
                <button
                  type="button"
                  onClick={() => setRole("caregiver")}
                  className={`flex-1 py-3 rounded-[16px] font-medium transition-all ${
                    role === "caregiver"
                      ? "bg-[#FF6B8A] text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Caregiver
                </button>
              </div>
            </div>

            {/* Name Field */}
            {activeTab === "signup" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label
                  className="block text-gray-700 mb-2"
                  style={{ fontSize: "14px", fontWeight: 600 }}
                >
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 rounded-[16px] bg-white border-2 border-gray-200 focus:border-[#FF6B8A] focus:outline-none transition-colors"
                  style={{ fontSize: "16px" }}
                />
              </motion.div>
            )}

            {/* Email Field */}
            <div>
              <label
                className="block text-gray-700 mb-2"
                style={{ fontSize: "14px", fontWeight: 600 }}
              >
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-[16px] bg-white border-2 border-gray-200 focus:border-[#FF6B8A] focus:outline-none transition-colors"
                style={{ fontSize: "16px" }}
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                className="block text-gray-700 mb-2"
                style={{ fontSize: "14px", fontWeight: 600 }}
              >
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-[16px] bg-white border-2 border-gray-200 focus:border-[#FF6B8A] focus:outline-none transition-colors"
                style={{ fontSize: "16px" }}
              />
            </div>

            {/* Submit Button */}
            <WellnessButton
              type="submit"
              variant="primary"
              size="large"
              className="w-full mt-6"
            >
              {activeTab === "login" ? "Sign in" : "Create account"}
            </WellnessButton>

            {/* Toggle Text */}
            <p className="text-center text-gray-600 mt-4" style={{ fontSize: "14px" }}>
              {activeTab === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("signup")}
                    className="text-[#FF6B8A] font-medium"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("login")}
                    className="text-[#FF6B8A] font-medium"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </form>
        </WellnessCard>
      </div>
    </div>
  );
}