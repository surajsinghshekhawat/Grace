import { motion } from "framer-motion";

export function WellnessCard({ children, className = "", gradient = false, hover = true, onClick }) {
  return (
    <motion.div
      role={onClick ? "button" : undefined}
      whileHover={hover ? { y: -4, boxShadow: "0px 12px 30px rgba(0,0,0,0.08)" } : {}}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`bg-white rounded-[20px] p-6 ${
        gradient ? "bg-gradient-to-br from-white to-emerald-50" : ""
      } ${className}`}
      style={{ boxShadow: "0px 8px 20px rgba(0,0,0,0.05)" }}
    >
      {children}
    </motion.div>
  );
}
