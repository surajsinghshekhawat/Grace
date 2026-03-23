import { motion } from "framer-motion";

const LikertScale = ({ options, value, onChange }) => {
  return (
    <div className="grid grid-cols-5 gap-3 md:gap-4">
      {options.map((option, index) => (
        <motion.button
          key={option.value}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(option.value)}
          className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 ${
            value === option.value
              ? "bg-teal-500 text-white shadow-lg"
              : "bg-gray-50 hover:bg-gray-100 text-gray-800"
          }`}
        >
          <span className="text-3xl font-bold">{option.value}</span>
          <span
            className={`text-xs md:text-sm text-center ${
              value === option.value ? "text-white" : "text-gray-600"
            }`}
          >
            {option.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
};

export default LikertScale;


