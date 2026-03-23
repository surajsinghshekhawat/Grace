import { useState } from "react";
import { useNavigate } from "react-router";
import { BottomNav } from "../components/BottomNav";
import { WellnessCard } from "../components/WellnessCard";
import { WellnessButton } from "../components/WellnessButton";
import {
  ArrowLeft,
  Type,
  Palette,
  Globe,
  Shield,
  Bell,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { motion } from "motion/react";

export function Settings() {
  const navigate = useNavigate();
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [language, setLanguage] = useState("English");
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      {/* Header */}
      <div
        className="px-6 pt-12 pb-8"
        style={{
          background: "linear-gradient(135deg, #FFF5F7 0%, #F0E7FF 100%)",
        }}
      >
        <div className="max-w-[600px] mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-700 hover:text-[#FF6B8A] transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span style={{ fontSize: "14px", fontWeight: 500 }}>Back</span>
          </button>
          <h1
            className="text-gray-800"
            style={{ fontSize: "28px", fontWeight: 700 }}
          >
            Settings
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-4 max-w-[600px] mx-auto space-y-6">
        {/* Accessibility */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <WellnessCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Type size={20} className="text-[#A78BFA]" />
              </div>
              <h2
                className="text-gray-800"
                style={{ fontSize: "20px", fontWeight: 600 }}
              >
                Accessibility
              </h2>
            </div>

            <div className="space-y-4">
              {/* Large Text Toggle */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p
                    className="text-gray-800"
                    style={{ fontSize: "16px", fontWeight: 500 }}
                  >
                    Large text
                  </p>
                  <p className="text-gray-500" style={{ fontSize: "13px" }}>
                    Increase text size for easier reading
                  </p>
                </div>
                <button
                  onClick={() => setLargeText(!largeText)}
                  className={`w-14 h-8 rounded-full transition-all ${
                    largeText ? "bg-[#FF6B8A]" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-6 h-6 bg-white rounded-full transition-all ${
                      largeText ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* High Contrast Toggle */}
              <div className="flex items-center justify-between py-2 border-t border-gray-200 pt-4">
                <div>
                  <p
                    className="text-gray-800"
                    style={{ fontSize: "16px", fontWeight: 500 }}
                  >
                    High contrast
                  </p>
                  <p className="text-gray-500" style={{ fontSize: "13px" }}>
                    Improve visibility with enhanced contrast
                  </p>
                </div>
                <button
                  onClick={() => setHighContrast(!highContrast)}
                  className={`w-14 h-8 rounded-full transition-all ${
                    highContrast ? "bg-[#FF6B8A]" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-6 h-6 bg-white rounded-full transition-all ${
                      highContrast ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </WellnessCard>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <WellnessCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                <Bell size={20} className="text-[#FF6B8A]" />
              </div>
              <h2
                className="text-gray-800"
                style={{ fontSize: "20px", fontWeight: 600 }}
              >
                Notifications
              </h2>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p
                  className="text-gray-800"
                  style={{ fontSize: "16px", fontWeight: 500 }}
                >
                  Check-in reminders
                </p>
                <p className="text-gray-500" style={{ fontSize: "13px" }}>
                  Daily notifications to complete check-ins
                </p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`w-14 h-8 rounded-full transition-all ${
                  notifications ? "bg-[#FF6B8A]" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full transition-all ${
                    notifications ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </WellnessCard>
        </motion.div>

        {/* Language */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <WellnessCard>
            <button className="w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Globe size={20} className="text-[#93C5FD]" />
                  </div>
                  <div className="text-left">
                    <p
                      className="text-gray-800"
                      style={{ fontSize: "16px", fontWeight: 600 }}
                    >
                      Language
                    </p>
                    <p className="text-gray-500" style={{ fontSize: "13px" }}>
                      {language}
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </div>
            </button>
          </WellnessCard>
        </motion.div>

        {/* Privacy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <WellnessCard>
            <button className="w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Shield size={20} className="text-[#6EE7B7]" />
                  </div>
                  <div className="text-left">
                    <p
                      className="text-gray-800"
                      style={{ fontSize: "16px", fontWeight: 600 }}
                    >
                      Privacy & Security
                    </p>
                    <p className="text-gray-500" style={{ fontSize: "13px" }}>
                      Manage your data and privacy settings
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </div>
            </button>
          </WellnessCard>
        </motion.div>

        {/* Account */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <WellnessCard>
            <div className="space-y-3">
              <div className="pb-3 border-b border-gray-200">
                <p
                  className="text-gray-600 mb-1"
                  style={{ fontSize: "13px", fontWeight: 600 }}
                >
                  Account
                </p>
                <p className="text-gray-800" style={{ fontSize: "16px" }}>
                  margaret.thompson@email.com
                </p>
              </div>
              <button className="w-full text-left py-2">
                <p
                  className="text-gray-800 hover:text-[#FF6B8A] transition-colors"
                  style={{ fontSize: "15px", fontWeight: 500 }}
                >
                  Manage connected caregivers →
                </p>
              </button>
            </div>
          </WellnessCard>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <WellnessButton
            variant="outline"
            onClick={() => navigate("/")}
            className="w-full flex items-center justify-center gap-2 border-red-300 text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} />
            Log out
          </WellnessButton>
        </motion.div>

        {/* Version Info */}
        <p className="text-center text-gray-400 pb-6" style={{ fontSize: "12px" }}>
          Grace v1.0.0
        </p>
      </div>

      <BottomNav type="elder" />
    </div>
  );
}
