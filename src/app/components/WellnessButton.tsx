import { motion } from "motion/react";
import { ReactNode } from "react";

interface WellnessButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline";
  size?: "default" | "large";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}

export function WellnessButton({
  children,
  onClick,
  variant = "primary",
  size = "default",
  className = "",
  disabled = false,
  type = "button",
}: WellnessButtonProps) {
  const baseStyles = "rounded-[20px] font-medium transition-all";
  
  const sizeStyles = {
    default: "px-6 py-3 min-h-[48px]",
    large: "px-8 py-4 min-h-[56px]",
  };

  const variantStyles = {
    primary: "bg-[#FF6B8A] text-white hover:bg-[#FF5577] active:bg-[#EE4466]",
    secondary: "bg-[#A78BFA] text-white hover:bg-[#9777E8] active:bg-[#8766D6]",
    outline: "bg-white border-2 border-[#FF6B8A] text-[#FF6B8A] hover:bg-pink-50",
  };

  return (
    <motion.button
      type={type}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      {children}
    </motion.button>
  );
}
