import { useNavigate } from "react-router";
import { BottomNav } from "../components/BottomNav";
import { WellnessCard } from "../components/WellnessCard";
import { WellnessButton } from "../components/WellnessButton";
import { Plus, Clock, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

interface Elder {
  id: string;
  name: string;
  avatar: string;
  lastCheckIn: string;
  status: "ok" | "attention" | "high-risk";
}

const mockElders: Elder[] = [
  {
    id: "1",
    name: "Margaret Thompson",
    avatar: "MT",
    lastCheckIn: "2 hours ago",
    status: "ok",
  },
  {
    id: "2",
    name: "Robert Chen",
    avatar: "RC",
    lastCheckIn: "1 day ago",
    status: "attention",
  },
  {
    id: "3",
    name: "Eleanor Davis",
    avatar: "ED",
    lastCheckIn: "3 days ago",
    status: "high-risk",
  },
];

export function CaregiverHome() {
  const navigate = useNavigate();

  const getStatusColor = (status: Elder["status"]) => {
    switch (status) {
      case "ok":
        return "bg-[#6EE7B7] text-green-900";
      case "attention":
        return "bg-yellow-300 text-yellow-900";
      case "high-risk":
        return "bg-red-400 text-red-900";
    }
  };

  const getStatusText = (status: Elder["status"]) => {
    switch (status) {
      case "ok":
        return "OK";
      case "attention":
        return "Needs attention";
      case "high-risk":
        return "High risk";
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      {/* Header */}
      <div
        className="px-6 pt-12 pb-8"
        style={{
          background: "linear-gradient(135deg, #E0F7F4 0%, #E8DEFF 100%)",
        }}
      >
        <div className="max-w-[1100px] mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1
              className="text-gray-800"
              style={{ fontSize: "28px", fontWeight: 700 }}
            >
              Your Elders
            </h1>
            <WellnessButton
              variant="primary"
              onClick={() => navigate("/caregiver/link-elder")}
              className="flex items-center gap-2"
            >
              <Plus size={20} />
              Link Elder
            </WellnessButton>
          </div>
        </div>
      </div>

      {/* Elder List */}
      <div className="px-6 -mt-4 max-w-[1100px] mx-auto">
        {mockElders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <WellnessCard className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4">
                <Plus size={40} className="text-[#FF6B8A]" />
              </div>
              <h3
                className="text-gray-800 mb-2"
                style={{ fontSize: "20px", fontWeight: 600 }}
              >
                No elders linked yet
              </h3>
              <p className="text-gray-600 mb-6" style={{ fontSize: "14px" }}>
                Start by linking an elder to begin monitoring their wellbeing
              </p>
              <WellnessButton
                variant="primary"
                onClick={() => navigate("/caregiver/link-elder")}
              >
                Link your first elder
              </WellnessButton>
            </WellnessCard>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {mockElders.map((elder, index) => (
              <motion.div
                key={elder.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <WellnessCard>
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF6B8A] to-[#A78BFA] flex items-center justify-center text-white flex-shrink-0"
                      style={{ fontSize: "18px", fontWeight: 600 }}
                    >
                      {elder.avatar}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-gray-800 mb-1"
                        style={{ fontSize: "18px", fontWeight: 600 }}
                      >
                        {elder.name}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-500 mb-2">
                        <Clock size={14} />
                        <span style={{ fontSize: "14px" }}>
                          {elder.lastCheckIn}
                        </span>
                      </div>
                      <span
                        className={`inline-block px-3 py-1 rounded-full ${getStatusColor(
                          elder.status
                        )}`}
                        style={{ fontSize: "12px", fontWeight: 600 }}
                      >
                        {getStatusText(elder.status)}
                      </span>
                    </div>

                    {/* Arrow */}
                    <button
                      onClick={() => navigate(`/caregiver/elder/${elder.id}`)}
                      className="text-[#FF6B8A] hover:text-[#FF5577] transition-colors"
                    >
                      <ArrowRight size={24} />
                    </button>
                  </div>
                </WellnessCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <BottomNav type="caregiver" />
    </div>
  );
}