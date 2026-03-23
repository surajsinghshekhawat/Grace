import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const MultipleChoice = ({ options, value = [], onChange }) => {
  useEffect(() => {
    if (!value) {
      onChange([]);
    }
  }, []);

  const handleToggle = (optionValue) => {
    const newValue = value || [];
    if (newValue.includes(optionValue)) {
      onChange(newValue.filter((v) => v !== optionValue));
    } else {
      onChange([...newValue, optionValue]);
    }
  };

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
          onClick={() => handleToggle(option.value)}
          className={`w-full p-6 rounded-2xl text-left font-medium text-lg transition-all duration-200 ${
            value && value.includes(option.value)
              ? "bg-teal-500 text-white shadow-md"
              : "bg-gray-50 hover:bg-gray-100 text-gray-800"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                value && value.includes(option.value)
                  ? "border-white bg-white"
                  : "border-gray-400"
              }`}
            >
              {value && value.includes(option.value) && (
                <div className="w-3 h-3 rounded-full bg-teal-500" />
              )}
            </div>
            {option.label}
          </div>
        </motion.button>
      ))}
    </div>
  );
};

export default MultipleChoice;


