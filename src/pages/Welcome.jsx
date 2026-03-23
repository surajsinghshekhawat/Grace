import { useNavigate } from "react-router-dom";
import { WellnessButton } from "../components/WellnessButton";
import { WellnessCard } from "../components/WellnessCard";
import { PublicLanguageSwitcher } from "../components/PublicLanguageSwitcher";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "../contexts/LanguageContext.jsx";

export default function Welcome() {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #ECFDF5 0%, #ECFEFF 100%)" }}
    >
      <div className="absolute top-4 right-4 z-10">
        <PublicLanguageSwitcher />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col items-center mb-12"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center mb-4 shadow-lg" aria-hidden>
            <Heart size={40} className="text-white" fill="white" />
          </div>
          <h1 className="text-emerald-700 mb-2" style={{ fontSize: "42px", fontWeight: 700 }}>
            Grace
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <WellnessCard gradient hover={false}>
            <div className="text-center mb-8">
              <h2 className="text-gray-800 mb-3" style={{ fontSize: "28px", fontWeight: 600 }}>
                {t("welcome.title")}
              </h2>
              <p className="text-gray-600" style={{ fontSize: "16px" }}>
                {t("welcome.subtitle")}
              </p>
            </div>

            <div className="space-y-3">
              <WellnessButton
                variant="primary"
                size="large"
                onClick={() => navigate("/auth")}
                className="w-full"
              >
                {t("welcome.createAccount")}
              </WellnessButton>
              <WellnessButton
                variant="outline"
                size="large"
                onClick={() => navigate("/auth")}
                className="w-full"
              >
                {t("welcome.signIn")}
              </WellnessButton>
            </div>

            <button
              type="button"
              onClick={() => navigate("/elder")}
              className="w-full mt-4 text-teal-700 hover:text-teal-800 transition-colors"
              style={{ fontSize: "14px" }}
            >
              {t("welcome.tryDemo")}
            </button>
          </WellnessCard>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-8 text-gray-500"
          style={{ fontSize: "14px" }}
        >
          {t("welcome.footer")}
        </motion.p>
      </motion.div>
    </div>
  );
}
