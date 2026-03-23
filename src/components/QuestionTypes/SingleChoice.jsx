import { motion } from "framer-motion";

const SingleChoice = ({ options, value, onChange }) => {
  return (
    <div className="space-y-3">
      {options.map((option, index) => (
        <motion.button
          key={option.value}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange(option.value)}
          className={`w-full p-6 rounded-2xl text-left font-medium text-lg transition-all duration-200 ${
            value === option.value
              ? "bg-teal-500 text-white shadow-md"
              : "bg-gray-50 hover:bg-gray-100 text-gray-800"
          }`}
        >
          {option.label}
        </motion.button>
      ))}
    </div>
  );
};

export default SingleChoice;


