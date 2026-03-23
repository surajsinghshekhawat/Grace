import { useNavigate, useParams } from "react-router";
import { BottomNav } from "../components/BottomNav";
import { WellnessCard } from "../components/WellnessCard";
import { WellnessButton } from "../components/WellnessButton";
import { ArrowLeft, Phone, Bell, TrendingUp, TrendingDown, Heart, FileText, Lightbulb } from "lucide-react";
import { motion } from "motion/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const mockData = [
  { day: "Mon", mood: 7, energy: 6, sleep: 8, id: "elder-detail-d1" },
  { day: "Tue", mood: 6, energy: 5, sleep: 7, id: "elder-detail-d2" },
  { day: "Wed", mood: 8, energy: 7, sleep: 8, id: "elder-detail-d3" },
  { day: "Thu", mood: 7, energy: 6, sleep: 6, id: "elder-detail-d4" },
  { day: "Fri", mood: 9, energy: 8, sleep: 9, id: "elder-detail-d5" },
  { day: "Sat", mood: 8, energy: 7, sleep: 8, id: "elder-detail-d6" },
  { day: "Sun", mood: 7, energy: 7, sleep: 7, id: "elder-detail-d7" },
];

export function ElderDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

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
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-700 hover:text-[#FF6B8A] transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span style={{ fontSize: "14px", fontWeight: 500 }}>Back</span>
          </button>
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF6B8A] to-[#A78BFA] flex items-center justify-center text-white flex-shrink-0"
              style={{ fontSize: "18px", fontWeight: 600 }}
            >
              MT
            </div>
            <div>
              <h1
                className="text-gray-800"
                style={{ fontSize: "28px", fontWeight: 700 }}
              >
                Margaret Thompson
              </h1>
              <p className="text-gray-600" style={{ fontSize: "14px" }}>
                Last check-in: 2 hours ago
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <WellnessButton variant="primary" className="flex items-center gap-2">
              <Phone size={18} />
              Call
            </WellnessButton>
            <WellnessButton variant="outline" className="flex items-center gap-2">
              <Bell size={18} />
              Send reminder
            </WellnessButton>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-4 max-w-[1100px] mx-auto">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="mb-4"
        >
          <WellnessCard gradient>
            <h2
              className="text-gray-800 mb-3"
              style={{ fontSize: "18px", fontWeight: 600 }}
            >
              Quick Actions
            </h2>
            <div className="space-y-3">
              <WellnessButton
                variant="primary"
                size="large"
                onClick={() => navigate(`/caregiver/elder/${id}/check-in`)}
                className="w-full flex items-center justify-center gap-3"
              >
                <Heart size={24} />
                <span style={{ fontSize: "18px" }}>Daily Check-in</span>
              </WellnessButton>
              <WellnessButton
                variant="secondary"
                size="large"
                onClick={() => navigate(`/caregiver/elder/${id}/assessment`)}
                className="w-full flex items-center justify-center gap-3"
              >
                <FileText size={24} />
                <span style={{ fontSize: "18px" }}>Weekly Assessment</span>
              </WellnessButton>
            </div>
          </WellnessCard>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Today's Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <WellnessCard>
              <h2
                className="text-gray-800 mb-4"
                style={{ fontSize: "20px", fontWeight: 600 }}
              >
                Today's Status
              </h2>
              <div className="space-y-4">
                {[
                  { label: "Mood", value: 7, color: "#FF6B8A" },
                  { label: "Energy", value: 6, color: "#A78BFA" },
                  { label: "Sleep", value: 8, color: "#6EE7B7" },
                  { label: "Pain", value: 3, color: "#93C5FD" },
                  { label: "Loneliness", value: 4, color: "#FFB4C8" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-700" style={{ fontSize: "14px", fontWeight: 500 }}>
                        {item.label}
                      </span>
                      <span className="text-gray-700" style={{ fontSize: "14px", fontWeight: 600 }}>
                        {item.value}/10
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value * 10}%` }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </WellnessCard>
          </motion.div>

          {/* Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <WellnessCard>
              <h2
                className="text-gray-800 mb-4"
                style={{ fontSize: "20px", fontWeight: 600 }}
              >
                7-Day Trends
              </h2>
              <div className="h-[200px] -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                      axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <YAxis 
                      domain={[0, 10]} 
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                      axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="mood"
                      stroke="#FF6B8A"
                      strokeWidth={2}
                      dot={{ fill: "#FF6B8A", r: 4, strokeWidth: 2, stroke: '#fff' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="energy"
                      stroke="#A78BFA"
                      strokeWidth={2}
                      dot={{ fill: "#A78BFA", r: 4, strokeWidth: 2, stroke: '#fff' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sleep"
                      stroke="#6EE7B7"
                      strokeWidth={2}
                      dot={{ fill: "#6EE7B7", r: 4, strokeWidth: 2, stroke: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-4 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF6B8A]" />
                  <span className="text-gray-600" style={{ fontSize: "12px" }}>Mood</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#A78BFA]" />
                  <span className="text-gray-600" style={{ fontSize: "12px" }}>Energy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#6EE7B7]" />
                  <span className="text-gray-600" style={{ fontSize: "12px" }}>Sleep</span>
                </div>
              </div>
            </WellnessCard>
          </motion.div>

          {/* ML Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <WellnessCard>
              <h2
                className="text-gray-800 mb-4"
                style={{ fontSize: "20px", fontWeight: 600 }}
              >
                ML Insights
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700" style={{ fontSize: "14px", fontWeight: 500 }}>
                      Depression Risk
                    </span>
                    <span
                      className="px-3 py-1 rounded-full bg-green-100 text-green-800"
                      style={{ fontSize: "12px", fontWeight: 600 }}
                    >
                      Low
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-400 rounded-full" style={{ width: "25%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700" style={{ fontSize: "14px", fontWeight: 500 }}>
                      Quality of Life Score
                    </span>
                    <span className="text-gray-700" style={{ fontSize: "14px", fontWeight: 600 }}>
                      8.2/10
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#6EE7B7] rounded-full" style={{ width: "82%" }} />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p
                    className="text-gray-700 mb-2"
                    style={{ fontSize: "14px", fontWeight: 600 }}
                  >
                    Top factors:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-gray-600" style={{ fontSize: "14px" }}>
                      <TrendingUp size={16} className="text-green-500 mt-0.5" />
                      <span>Good sleep quality</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-600" style={{ fontSize: "14px" }}>
                      <TrendingUp size={16} className="text-green-500 mt-0.5" />
                      <span>Regular social interaction</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-600" style={{ fontSize: "14px" }}>
                      <TrendingDown size={16} className="text-yellow-500 mt-0.5" />
                      <span>Occasional low energy</span>
                    </li>
                  </ul>
                </div>
              </div>
            </WellnessCard>
          </motion.div>

          {/* Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <WellnessCard>
              <h2
                className="text-gray-800 mb-4"
                style={{ fontSize: "20px", fontWeight: 600 }}
              >
                Recommendations
              </h2>
              <div className="space-y-3">
                {[
                  {
                    title: "Schedule a video call",
                    desc: "Regular social interaction helps maintain wellbeing",
                    color: "#FF6B8A",
                  },
                  {
                    title: "Encourage light exercise",
                    desc: "A short walk could help boost energy levels",
                    color: "#A78BFA",
                  },
                  {
                    title: "Continue current routine",
                    desc: "Sleep patterns are healthy and consistent",
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
        </div>
      </div>

      <BottomNav type="caregiver" />
    </div>
  );
}