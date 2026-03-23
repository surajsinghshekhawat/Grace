import { BottomNav } from "../components/BottomNav";
import { WellnessCard } from "../components/WellnessCard";
import { TrendingUp, Heart, Info } from "lucide-react";
import { motion } from "motion/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const trendData = [
  { week: "Week 1", score: 7.2, id: "trend-w1" },
  { week: "Week 2", score: 7.5, id: "trend-w2" },
  { week: "Week 3", score: 7.8, id: "trend-w3" },
  { week: "Week 4", score: 8.2, id: "trend-w4" },
];

const radarData = [
  { category: "Mood", value: 8, id: "radar-1" },
  { category: "Energy", value: 7, id: "radar-2" },
  { category: "Sleep", value: 9, id: "radar-3" },
  { category: "Social", value: 6, id: "radar-4" },
  { category: "Physical", value: 7, id: "radar-5" },
];

export function Results() {
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
          <h1
            className="text-gray-800 mb-2"
            style={{ fontSize: "28px", fontWeight: 700 }}
          >
            Your Wellbeing Snapshot
          </h1>
          <p className="text-gray-600" style={{ fontSize: "14px" }}>
            Based on your recent check-ins and assessments
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-4 max-w-[1100px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Depression Risk */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <WellnessCard>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Heart size={24} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <h2
                    className="text-gray-800 mb-1"
                    style={{ fontSize: "20px", fontWeight: 600 }}
                  >
                    Depression Risk
                  </h2>
                  <span
                    className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-800"
                    style={{ fontSize: "14px", fontWeight: 600 }}
                  >
                    Low Risk
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600" style={{ fontSize: "14px" }}>
                      Overall score
                    </span>
                    <span
                      className="text-gray-800"
                      style={{ fontSize: "14px", fontWeight: 600 }}
                    >
                      25/100
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "25%" }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                    />
                  </div>
                </div>

                <p className="text-gray-600 mt-4" style={{ fontSize: "14px" }}>
                  Your responses indicate positive mental wellbeing. Continue with your
                  current routines and stay connected with loved ones.
                </p>
              </div>
            </WellnessCard>
          </motion.div>

          {/* Quality of Life */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <WellnessCard>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={24} className="text-[#A78BFA]" />
                </div>
                <div className="flex-1">
                  <h2
                    className="text-gray-800 mb-1"
                    style={{ fontSize: "20px", fontWeight: 600 }}
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
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="h-full bg-gradient-to-r from-[#A78BFA] to-[#93C5FD] rounded-full"
                  />
                </div>

                <div className="flex items-center gap-2 text-green-600 mt-3">
                  <TrendingUp size={16} />
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>
                    +0.4 from last week
                  </span>
                </div>

                <p className="text-gray-600" style={{ fontSize: "14px" }}>
                  Your quality of life has improved steadily over the past month.
                </p>
              </div>
            </WellnessCard>
          </motion.div>

          {/* Trend Graph */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-2"
          >
            <WellnessCard>
              <div className="flex justify-between items-start mb-4">
                <h2
                  className="text-gray-800"
                  style={{ fontSize: "20px", fontWeight: 600 }}
                >
                  30-Day Wellbeing Trend
                </h2>
              </div>
              <p className="text-gray-600 mb-4" style={{ fontSize: "14px" }}>
                Your last 4 weeks show a <span className="text-green-600" style={{ fontWeight: 600 }}>positive trend</span>. Keep up the great progress!
              </p>
              <div className="h-[250px] -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="week" 
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
                      dataKey="score"
                      stroke="#FF6B8A"
                      strokeWidth={3}
                      dot={{ fill: "#FF6B8A", r: 6, strokeWidth: 2, stroke: '#fff' }}
                      label={{ 
                        position: 'top', 
                        fill: '#374151',
                        fontSize: 13,
                        fontWeight: 600,
                        offset: 10
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-gray-500 mt-3 text-center" style={{ fontSize: "12px" }}>
                ✓ Maintaining healthy wellbeing levels (7.0-10.0)
              </p>
            </WellnessCard>
          </motion.div>

          {/* Wellbeing Dimensions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="md:col-span-2"
          >
            <WellnessCard>
              <h2
                className="text-gray-800 mb-4"
                style={{ fontSize: "20px", fontWeight: 600 }}
              >
                Wellbeing Dimensions
              </h2>
              <p className="text-gray-600 mb-4" style={{ fontSize: "14px" }}>
                Your wellbeing across different life areas
              </p>
              <div className="h-[300px] -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#f0f0f0" />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                    <Radar
                      name="Score"
                      dataKey="value"
                      stroke="#FF6B8A"
                      fill="#FF6B8A"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </WellnessCard>
          </motion.div>
        </div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 mb-6"
        >
          <div className="flex items-start gap-3 p-4 rounded-[16px] bg-blue-50 border border-blue-200">
            <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-blue-900" style={{ fontSize: "13px" }}>
              <strong>Note:</strong> This is not a medical diagnosis. These insights are
              based on your self-reported data. Please consult a healthcare professional
              for medical advice.
            </p>
          </div>
        </motion.div>
      </div>

      <BottomNav type="elder" />
    </div>
  );
}