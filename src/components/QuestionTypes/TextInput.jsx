import { motion } from "framer-motion";

const TextInput = ({ value = "", onChange, placeholder = "" }) => {
  return (
    <motion.input
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-6 text-xl border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-200"
    />
  );
};

export default TextInput;


