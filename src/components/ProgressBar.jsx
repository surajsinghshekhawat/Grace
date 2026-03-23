import { motion } from "framer-motion";

const ProgressBar = ({ progress, className = "" }) => {
  return (
    <div
      className={`w-full h-2 bg-gray-200 rounded-full overflow-hidden ${className}`}
    >
      <motion.div
        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      />
    </div>
  );
};

export default ProgressBar;


