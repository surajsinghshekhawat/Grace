import { useState } from "react";
import { useNavigate } from "react-router";
import { BottomNav } from "../components/BottomNav";
import { WellnessCard } from "../components/WellnessCard";
import { WellnessButton } from "../components/WellnessButton";
import { Link2, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

export function LinkElder() {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock success - navigate to caregiver home
    navigate("/caregiver");
  };

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
            Link an Elder
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-4 max-w-[600px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <WellnessCard>
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6B8A] to-[#A78BFA] flex items-center justify-center mx-auto mb-4">
                <Link2 size={40} className="text-white" />
              </div>
              <h2
                className="text-gray-800 mb-2"
                style={{ fontSize: "22px", fontWeight: 600 }}
              >
                Enter Invite Code
              </h2>
              <p className="text-gray-600" style={{ fontSize: "14px" }}>
                Ask the elder to share their invite code from the Grace app
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  className="block text-gray-700 mb-2"
                  style={{ fontSize: "14px", fontWeight: 600 }}
                >
                  Invite Code
                </label>
                <input
                  type="text"
                  placeholder="e.g., GRC-A8B3C1"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full px-4 py-4 rounded-[16px] bg-white border-2 border-gray-200 focus:border-[#FF6B8A] focus:outline-none transition-colors text-center tracking-wider"
                  style={{ fontSize: "20px", fontWeight: 600 }}
                />
                <p className="mt-2 text-gray-500 text-center" style={{ fontSize: "12px" }}>
                  The code is case-sensitive
                </p>
              </div>

              <WellnessButton
                type="submit"
                variant="primary"
                size="large"
                className="w-full"
                disabled={inviteCode.length < 6}
              >
                Link Elder
              </WellnessButton>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p
                className="text-gray-600 mb-2"
                style={{ fontSize: "14px", fontWeight: 600 }}
              >
                How to get the invite code:
              </p>
              <ol className="space-y-2 text-gray-600" style={{ fontSize: "14px" }}>
                <li className="flex gap-2">
                  <span className="text-[#FF6B8A] font-semibold">1.</span>
                  <span>Elder opens Grace app</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#FF6B8A] font-semibold">2.</span>
                  <span>Taps "Share with caregiver"</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#FF6B8A] font-semibold">3.</span>
                  <span>Shares the generated code with you</span>
                </li>
              </ol>
            </div>
          </WellnessCard>
        </motion.div>
      </div>

      <BottomNav type="caregiver" />
    </div>
  );
}
