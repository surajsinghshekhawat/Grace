import { motion } from "framer-motion";

export function WellnessButton({
  children,
  onClick,
  variant = "primary",
  size = "default",
  className = "",
  disabled = false,
  type = "button",
}) {
  const baseStyles = "rounded-[20px] font-medium transition-all";
  const sizeStyles = {
    default: "px-6 py-3 min-h-[48px]",
    large: "px-8 py-4 min-h-[56px]",
    small: "px-4 py-2 min-h-[40px] text-sm",
  };
  const variantStyles = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800",
    secondary: "bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800",
    outline: "bg-white border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50",
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
