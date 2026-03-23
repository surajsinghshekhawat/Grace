import { motion } from "motion/react";

interface EmojiOptionProps {
  emoji: string;
  label: string;
  value: number;
  selected: boolean;
  onClick: () => void;
}

export function EmojiOption({ emoji, label, selected, onClick }: EmojiOptionProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full p-5 rounded-[20px] border-2 transition-all ${
        selected
          ? "border-[#FF6B8A] bg-pink-50"
          : "border-gray-200 bg-white hover:border-[#FF6B8A]/50"
      }`}
    >
      <div className="flex items-center gap-4">
        <span style={{ fontSize: "40px" }}>{emoji}</span>
        <span
          className="text-gray-800"
          style={{ fontSize: "18px", fontWeight: 500 }}
        >
          {label}
        </span>
      </div>
    </motion.button>
  );
}
