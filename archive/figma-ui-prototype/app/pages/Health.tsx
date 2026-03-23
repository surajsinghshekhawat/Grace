import { useState } from "react";
import { BottomNav } from "../components/BottomNav";
import { WellnessCard } from "../components/WellnessCard";
import { WellnessButton } from "../components/WellnessButton";
import { Pill, AlertCircle, Phone, MapPin, Check, Clock } from "lucide-react";
import { motion } from "motion/react";

const medications = [
  {
    id: 1,
    name: "Morning Medication",
    dosage: "1 tablet",
    time: "8:00 AM",
    taken: true,
    takenAt: "8:05 AM",
  },
  {
    id: 2,
    name: "Afternoon Medication",
    dosage: "2 tablets",
    time: "2:00 PM",
    taken: false,
    takenAt: null,
  },
  {
    id: 3,
    name: "Evening Medication",
    dosage: "1 tablet",
    time: "8:00 PM",
    taken: false,
    takenAt: null,
  },
];

export function Health() {
  const [meds, setMeds] = useState(medications);
  const [showSOSConfirm, setShowSOSConfirm] = useState(false);

  const handleMarkTaken = (id: number) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    setMeds(meds.map(med => 
      med.id === id 
        ? { ...med, taken: true, takenAt: timeString }
        : med
    ));
  };

  const handleSOS = () => {
    setShowSOSConfirm(true);
    // In real app: trigger emergency alerts, notify caregiver, send location
    console.log("SOS activated - notifying caregiver and emergency contacts");
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
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6EE7B7] to-[#A78BFA] flex items-center justify-center">
              <Pill size={24} className="text-white" />
            </div>
            <h1
              className="text-gray-800"
              style={{ fontSize: "28px", fontWeight: 700 }}
            >
              Health
            </h1>
          </div>
          <p className="text-gray-600" style={{ fontSize: "16px" }}>
            Medications and emergency support
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-4 max-w-[1100px] mx-auto space-y-6">
        {/* SOS Emergency Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <WellnessCard className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200">
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2 mb-3">
                <AlertCircle size={24} className="text-red-600" />
                <h2
                  className="text-red-700"
                  style={{ fontSize: "20px", fontWeight: 700 }}
                >
                  Emergency SOS
                </h2>
              </div>
              <p className="text-gray-700 mb-4" style={{ fontSize: "14px" }}>
                Press for immediate assistance
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSOS}
                className="w-full max-w-xs mx-auto py-6 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-[20px] shadow-lg font-bold text-xl hover:shadow-xl transition-all"
              >
                🆘 PRESS FOR HELP
              </motion.button>
              <p className="text-gray-600 mt-3" style={{ fontSize: "12px" }}>
                This will notify your caregiver and emergency contacts
              </p>
            </div>
          </WellnessCard>
        </motion.div>

        {/* Medication Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-gray-800"
              style={{ fontSize: "20px", fontWeight: 600 }}
            >
              Today's Medications
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#6EE7B7]"></div>
              <span className="text-gray-600" style={{ fontSize: "14px" }}>
                {meds.filter(m => m.taken).length}/{meds.length} taken
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {meds.map((med, index) => (
              <motion.div
                key={med.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <WellnessCard className={med.taken ? "bg-gradient-to-br from-[#6EE7B7]/10 to-[#A78BFA]/10" : ""}>
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-[16px] flex items-center justify-center flex-shrink-0 ${
                        med.taken
                          ? "bg-gradient-to-br from-[#6EE7B7] to-[#4ADE80]"
                          : "bg-gradient-to-br from-gray-200 to-gray-300"
                      }`}
                    >
                      {med.taken ? (
                        <Check size={28} className="text-white" strokeWidth={3} />
                      ) : (
                        <Pill size={28} className="text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3
                        className="text-gray-800 mb-1"
                        style={{ fontSize: "17px", fontWeight: 600 }}
                      >
                        {med.name}
                      </h3>
                      <div className="flex items-center gap-3 text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span style={{ fontSize: "14px" }}>{med.time}</span>
                        </div>
                        <span>•</span>
                        <span style={{ fontSize: "14px" }}>{med.dosage}</span>
                      </div>
                      {med.taken && med.takenAt && (
                        <p className="text-[#6EE7B7] mt-1" style={{ fontSize: "13px", fontWeight: 500 }}>
                          ✓ Taken at {med.takenAt}
                        </p>
                      )}
                    </div>
                    {!med.taken && (
                      <WellnessButton
                        variant="secondary"
                        size="small"
                        onClick={() => handleMarkTaken(med.id)}
                      >
                        Mark as Taken
                      </WellnessButton>
                    )}
                  </div>
                </WellnessCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Emergency Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2
            className="text-gray-800 mb-4"
            style={{ fontSize: "20px", fontWeight: 600 }}
          >
            Emergency Contacts
          </h2>
          <WellnessCard>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6EE7B7] to-[#A78BFA] flex items-center justify-center">
                  <Phone size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-gray-800" style={{ fontSize: "15px", fontWeight: 600 }}>
                    Primary Caregiver
                  </p>
                  <p className="text-gray-600" style={{ fontSize: "14px" }}>
                    Sarah Johnson • (555) 123-4567
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B8A] to-[#FF8FA3] flex items-center justify-center">
                  <Phone size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-gray-800" style={{ fontSize: "15px", fontWeight: 600 }}>
                    Emergency Services
                  </p>
                  <p className="text-gray-600" style={{ fontSize: "14px" }}>
                    911
                  </p>
                </div>
              </div>
            </div>
          </WellnessCard>
        </motion.div>
      </div>

      {/* SOS Confirmation Modal */}
      {showSOSConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
          onClick={() => setShowSOSConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <WellnessCard className="max-w-md">
              <div className="text-center py-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6EE7B7] to-[#4ADE80] flex items-center justify-center mx-auto mb-4">
                  <Check size={40} className="text-white" strokeWidth={3} />
                </div>
                <h2
                  className="text-gray-800 mb-2"
                  style={{ fontSize: "24px", fontWeight: 700 }}
                >
                  Help is on the way!
                </h2>
                <p className="text-gray-600 mb-6" style={{ fontSize: "16px" }}>
                  Your caregiver has been notified and will contact you shortly.
                </p>
                <WellnessButton
                  variant="primary"
                  size="large"
                  onClick={() => setShowSOSConfirm(false)}
                  className="w-full"
                >
                  Close
                </WellnessButton>
              </div>
            </WellnessCard>
          </motion.div>
        </motion.div>
      )}

      <BottomNav activeTab="health" userType="elder" />
    </div>
  );
}
