import { BottomNav } from "../components/BottomNav";
import { WellnessCard } from "../components/WellnessCard";
import { WellnessButton } from "../components/WellnessButton";
import { Bell, AlertTriangle, AlertCircle, TrendingDown, Pill, Heart } from "lucide-react";
import { motion } from "motion/react";

const alerts = [
  {
    id: 1,
    type: "critical",
    icon: AlertCircle,
    elderName: "Mary Johnson",
    message: "SOS alert triggered",
    description: "Emergency button pressed at 2:45 PM",
    time: "15 mins ago",
    color: "from-red-500 to-red-600",
    bgColor: "from-red-50 to-orange-50",
  },
  {
    id: 2,
    type: "high",
    icon: TrendingDown,
    elderName: "John Smith",
    message: "Depression risk increased to High",
    description: "Recent assessment shows concerning patterns",
    time: "2 hours ago",
    color: "from-orange-500 to-orange-600",
    bgColor: "from-orange-50 to-yellow-50",
  },
  {
    id: 3,
    type: "medium",
    icon: Heart,
    elderName: "Mary Johnson",
    message: "Missed daily check-in",
    description: "No check-in for 24 hours",
    time: "1 day ago",
    color: "from-yellow-500 to-yellow-600",
    bgColor: "from-yellow-50 to-yellow-100",
  },
  {
    id: 4,
    type: "medium",
    icon: TrendingDown,
    elderName: "Robert Williams",
    message: "Mood decline detected",
    description: "Mood scores trending downward for 3 days",
    time: "1 day ago",
    color: "from-yellow-500 to-yellow-600",
    bgColor: "from-yellow-50 to-yellow-100",
  },
  {
    id: 5,
    type: "low",
    icon: Pill,
    elderName: "John Smith",
    message: "Medication missed",
    description: "Evening medication not taken yesterday",
    time: "1 day ago",
    color: "from-blue-500 to-blue-600",
    bgColor: "from-blue-50 to-blue-100",
  },
];

export function Alerts() {
  const criticalCount = alerts.filter(a => a.type === "critical").length;
  const highCount = alerts.filter(a => a.type === "high").length;
  const mediumCount = alerts.filter(a => a.type === "medium").length;

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
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B8A] to-[#A78BFA] flex items-center justify-center">
                <Bell size={24} className="text-white" />
              </div>
              <h1
                className="text-gray-800"
                style={{ fontSize: "28px", fontWeight: 700 }}
              >
                Alerts
              </h1>
            </div>
            {alerts.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-red-700" style={{ fontSize: "14px", fontWeight: 600 }}>
                  {alerts.length} active
                </span>
              </div>
            )}
          </div>
          <p className="text-gray-600" style={{ fontSize: "16px" }}>
            Important notifications about your elders
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-4 max-w-[1100px] mx-auto space-y-6">
        {/* Alert Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="grid grid-cols-3 gap-3">
            <WellnessCard className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200">
              <div className="text-center">
                <p className="text-red-700 mb-1" style={{ fontSize: "28px", fontWeight: 700 }}>
                  {criticalCount}
                </p>
                <p className="text-gray-700" style={{ fontSize: "13px", fontWeight: 600 }}>
                  Critical
                </p>
              </div>
            </WellnessCard>
            <WellnessCard className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200">
              <div className="text-center">
                <p className="text-orange-700 mb-1" style={{ fontSize: "28px", fontWeight: 700 }}>
                  {highCount}
                </p>
                <p className="text-gray-700" style={{ fontSize: "13px", fontWeight: 600 }}>
                  High
                </p>
              </div>
            </WellnessCard>
            <WellnessCard className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200">
              <div className="text-center">
                <p className="text-yellow-700 mb-1" style={{ fontSize: "28px", fontWeight: 700 }}>
                  {mediumCount}
                </p>
                <p className="text-gray-700" style={{ fontSize: "13px", fontWeight: 600 }}>
                  Medium
                </p>
              </div>
            </WellnessCard>
          </div>
        </motion.div>

        {/* Alerts List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2
            className="text-gray-800 mb-4"
            style={{ fontSize: "20px", fontWeight: 600 }}
          >
            Recent Alerts
          </h2>
          <div className="space-y-3">
            {alerts.map((alert, index) => {
              const Icon = alert.icon;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <WellnessCard className={`bg-gradient-to-br ${alert.bgColor} border-2 ${
                    alert.type === "critical" ? "border-red-300" :
                    alert.type === "high" ? "border-orange-300" :
                    alert.type === "medium" ? "border-yellow-300" :
                    "border-blue-300"
                  }`}>
                    <div className="flex gap-4">
                      <div
                        className={`w-14 h-14 rounded-[16px] bg-gradient-to-br ${alert.color} flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon size={28} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <h3
                              className="text-gray-800"
                              style={{ fontSize: "17px", fontWeight: 600 }}
                            >
                              {alert.elderName}
                            </h3>
                            <p
                              className="text-gray-700"
                              style={{ fontSize: "15px", fontWeight: 500 }}
                            >
                              {alert.message}
                            </p>
                          </div>
                          <span
                            className="text-gray-500 flex-shrink-0 ml-2"
                            style={{ fontSize: "12px" }}
                          >
                            {alert.time}
                          </span>
                        </div>
                        <p
                          className="text-gray-600 mb-3"
                          style={{ fontSize: "14px" }}
                        >
                          {alert.description}
                        </p>
                        <div className="flex gap-2">
                          <WellnessButton variant="primary" size="small">
                            View Details
                          </WellnessButton>
                          {alert.type === "critical" && (
                            <WellnessButton variant="secondary" size="small">
                              Call Elder
                            </WellnessButton>
                          )}
                        </div>
                      </div>
                    </div>
                  </WellnessCard>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Mark All Read Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="pb-4"
        >
          <WellnessButton
            variant="secondary"
            size="large"
            className="w-full"
          >
            Mark All as Read
          </WellnessButton>
        </motion.div>
      </div>

      <BottomNav activeTab="alerts" userType="caregiver" />
    </div>
  );
}
