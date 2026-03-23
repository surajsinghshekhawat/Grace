import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { BottomNav } from "../components/BottomNav";
import { WellnessCard } from "../components/WellnessCard";
import { WellnessButton } from "../components/WellnessButton";
import { Share2, Copy, Check, Clock, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

export function ShareWithCaregiver() {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(3600); // 1 hour in seconds

  const generateCode = () => {
    // Generate a random invite code
    const code = `GRC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setInviteCode(code);
    setTimeRemaining(3600);
  };

  const copyToClipboard = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (inviteCode && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [inviteCode, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
            Share with Caregiver
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-4 max-w-[600px] mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <WellnessCard>
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6B8A] to-[#A78BFA] flex items-center justify-center mx-auto mb-4">
                <Share2 size={40} className="text-white" />
              </div>
              <h2
                className="text-gray-800 mb-2"
                style={{ fontSize: "22px", fontWeight: 600 }}
              >
                Connect with Your Caregiver
              </h2>
              <p className="text-gray-600" style={{ fontSize: "14px" }}>
                Generate a secure code to share your wellbeing data
              </p>
            </div>

            {!inviteCode ? (
              <WellnessButton
                variant="primary"
                size="large"
                onClick={generateCode}
                className="w-full"
              >
                Generate Invite Code
              </WellnessButton>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                {/* Code Display */}
                <div className="p-6 rounded-[20px] bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-[#FF6B8A] text-center">
                  <p
                    className="text-gray-600 mb-2"
                    style={{ fontSize: "14px", fontWeight: 500 }}
                  >
                    Your invite code
                  </p>
                  <p
                    className="text-gray-800 tracking-wider mb-4"
                    style={{ fontSize: "32px", fontWeight: 700 }}
                  >
                    {inviteCode}
                  </p>
                  <WellnessButton
                    variant="primary"
                    onClick={copyToClipboard}
                    className="flex items-center justify-center gap-2 mx-auto"
                  >
                    {copied ? (
                      <>
                        <Check size={18} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        Copy Code
                      </>
                    )}
                  </WellnessButton>
                </div>

                {/* Expiry Timer */}
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Clock size={16} />
                  <span style={{ fontSize: "14px" }}>
                    Expires in{" "}
                    <span className="font-semibold text-[#FF6B8A]">
                      {formatTime(timeRemaining)}
                    </span>
                  </span>
                </div>

                {/* New Code Button */}
                <button
                  onClick={generateCode}
                  className="w-full text-[#A78BFA] hover:text-[#9777E8] transition-colors"
                  style={{ fontSize: "14px", fontWeight: 600 }}
                >
                  Generate new code
                </button>
              </motion.div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p
                className="text-gray-600 mb-3"
                style={{ fontSize: "14px", fontWeight: 600 }}
              >
                How it works:
              </p>
              <ol className="space-y-2 text-gray-600" style={{ fontSize: "14px" }}>
                <li className="flex gap-2">
                  <span className="text-[#FF6B8A] font-semibold">1.</span>
                  <span>Generate an invite code above</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#FF6B8A] font-semibold">2.</span>
                  <span>Share the code with your caregiver</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#FF6B8A] font-semibold">3.</span>
                  <span>They enter the code in their Grace app</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#FF6B8A] font-semibold">4.</span>
                  <span>Your wellbeing data is securely shared</span>
                </li>
              </ol>
            </div>
          </WellnessCard>
        </motion.div>

        {/* Privacy Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="p-4 rounded-[16px] bg-blue-50 border border-blue-200">
            <p
              className="text-blue-900 mb-2"
              style={{ fontSize: "14px", fontWeight: 600 }}
            >
              Your privacy matters
            </p>
            <p className="text-blue-800" style={{ fontSize: "13px" }}>
              You can revoke access at any time from your settings. Only the caregiver
              with this code can view your wellbeing data.
            </p>
          </div>
        </motion.div>
      </div>

      <BottomNav type="elder" />
    </div>
  );
}
