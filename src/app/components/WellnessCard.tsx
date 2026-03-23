import { motion } from "motion/react";
import { ReactNode } from "react";

interface WellnessCardProps {
  children: ReactNode;
  className?: string;
  gradient?: boolean;
  hover?: boolean;
}

export function WellnessCard({
  children,
  className = "",
  gradient = false,
  hover = true,
}: WellnessCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, boxShadow: "0px 12px 30px rgba(0,0,0,0.08)" } : {}}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-[20px] p-6 ${
        gradient
          ? "bg-gradient-to-br from-white to-pink-50"
          : ""
      } ${className}`}
      style={{
        boxShadow: "0px 8px 20px rgba(0,0,0,0.05)",
      }}
    >
      {children}
    </motion.div>
  );
}
