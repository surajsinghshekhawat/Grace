import { BottomNav } from "../components/BottomNav";
import { WellnessCard } from "../components/WellnessCard";
import { TrendingUp, Users, CheckCircle, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const riskData = [
  { name: "Low", value: 3, color: "#6EE7B7" },
  { name: "Medium", value: 2, color: "#FCD34D" },
  { name: "High", value: 1, color: "#FF6B8A" },
];

const engagementData = [
  { day: "Mon", completed: 5, total: 6 },
  { day: "Tue", completed: 6, total: 6 },
  { day: "Wed", completed: 4, total: 6 },
  { day: "Thu", completed: 5, total: 6 },
  { day: "Fri", completed: 6, total: 6 },
  { day: "Sat", completed: 3, total: 6 },
  { day: "Sun", completed: 4, total: 6 },
];

const wellbeingTrend = [
  { week: "Week 1", average: 68 },
  { week: "Week 2", average: 72 },
  { week: "Week 3", average: 70 },
  { week: "Week 4", average: 75 },
];

export function CaregiverInsights() {
  const totalElders = 6;
  const avgWellbeing = 72;
  const checkInRate = 83;
  const needsAttention = 2;

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
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6EE7B7] to-[#A78BFA] flex items-center justify-center">
              <TrendingUp size={24} className="text-white" />
            </div>
            <h1
              className="text-gray-800"
              style={{ fontSize: "28px", fontWeight: 700 }}
            >
              Insights
            </h1>
          </div>
          <p className="text-gray-600" style={{ fontSize: "16px" }}>
            Analytics across all elders
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-4 max-w-[1100px] mx-auto space-y-6">
        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <WellnessCard className="bg-gradient-to-br from-[#6EE7B7]/20 to-[#A78BFA]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6EE7B7] to-[#4ADE80] flex items-center justify-center">
                  <Users size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-gray-800" style={{ fontSize: "24px", fontWeight: 700 }}>
                    {totalElders}
                  </p>
                  <p className="text-gray-600" style={{ fontSize: "12px" }}>
                    Total Elders
                  </p>
                </div>
              </div>
            </WellnessCard>

            <WellnessCard className="bg-gradient-to-br from-[#A78BFA]/20 to-[#C4B5FD]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#A78BFA] to-[#C4B5FD] flex items-center justify-center">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-gray-800" style={{ fontSize: "24px", fontWeight: 700 }}>
                    {avgWellbeing}
                  </p>
                  <p className="text-gray-600" style={{ fontSize: "12px" }}>
                    Avg Wellbeing
                  </p>
                </div>
              </div>
            </WellnessCard>

            <WellnessCard className="bg-gradient-to-br from-[#93C5FD]/20 to-[#BFDBFE]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#93C5FD] to-[#60A5FA] flex items-center justify-center">
                  <CheckCircle size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-gray-800" style={{ fontSize: "24px", fontWeight: 700 }}>
                    {checkInRate}%
                  </p>
                  <p className="text-gray-600" style={{ fontSize: "12px" }}>
                    Check-in Rate
                  </p>
                </div>
              </div>
            </WellnessCard>

            <WellnessCard className="bg-gradient-to-br from-[#FF6B8A]/20 to-[#FF8FA3]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B8A] to-[#FF8FA3] flex items-center justify-center">
                  <AlertTriangle size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-gray-800" style={{ fontSize: "24px", fontWeight: 700 }}>
                    {needsAttention}
                  </p>
                  <p className="text-gray-600" style={{ fontSize: "12px" }}>
                    Need Attention
                  </p>
                </div>
              </div>
            </WellnessCard>
          </div>
        </motion.div>

        {/* Risk Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <WellnessCard>
            <h2
              className="text-gray-800 mb-4"
              style={{ fontSize: "18px", fontWeight: 600 }}
            >
              Risk Distribution
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {riskData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-gray-700" style={{ fontSize: "14px" }}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </WellnessCard>
        </motion.div>

        {/* Weekly Check-in Completion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <WellnessCard>
            <h2
              className="text-gray-800 mb-4"
              style={{ fontSize: "18px", fontWeight: 600 }}
            >
              Daily Check-in Completion
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" stroke="#999" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#999" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar dataKey="completed" fill="#6EE7B7" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="total" fill="#E5E7EB" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#6EE7B7]"></div>
                <span className="text-gray-700" style={{ fontSize: "14px" }}>
                  Completed
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#E5E7EB]"></div>
                <span className="text-gray-700" style={{ fontSize: "14px" }}>
                  Total
                </span>
              </div>
            </div>
          </WellnessCard>
        </motion.div>

        {/* Wellbeing Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pb-4"
        >
          <WellnessCard>
            <h2
              className="text-gray-800 mb-4"
              style={{ fontSize: "18px", fontWeight: 600 }}
            >
              Average Wellbeing Trend
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={wellbeingTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" stroke="#999" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#999" style={{ fontSize: "12px" }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="average"
                    stroke="#A78BFA"
                    strokeWidth={3}
                    dot={{ fill: "#A78BFA", r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </WellnessCard>
        </motion.div>
      </div>

      <BottomNav activeTab="insights" userType="caregiver" />
    </div>
  );
}
