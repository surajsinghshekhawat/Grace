import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { WellnessButton } from "../components/WellnessButton";
import { WellnessCard } from "../components/WellnessCard";
import { PublicLanguageSwitcher } from "../components/PublicLanguageSwitcher";
import { Heart } from "lucide-react";
import useStore from "../store";
import { apiFetch } from "../lib/api";
import { getAssessmentEntryPath } from "../lib/assessmentEntry";
import { useI18n } from "../contexts/LanguageContext.jsx";

export default function Auth() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("login");
  const [role, setRole] = useState("elder");
  const [name, setName] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const setAuthUser = useStore((s) => s.setAuthUser);
  const resetAssessment = useStore((s) => s.resetAssessment);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const mode = activeTab === "login" ? "login" : "register"; // backend: login | register
      const payload =
        mode === "register"
          ? { email_or_phone: emailOrPhone, password, role, name }
          : { email_or_phone: emailOrPhone, password };

      const me = await apiFetch(`/api/${mode}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setAuthUser(me);
      resetAssessment();
      if (me.role === "caregiver") navigate("/caregiver");
      else if (me.role === "elder") {
        try {
          const assessments = await apiFetch("/api/elder/assessments?limit=1");
          if (Array.isArray(assessments) && assessments.length === 0) {
            navigate(getAssessmentEntryPath());
          } else {
            navigate("/elder");
          }
        } catch {
          navigate("/elder");
        }
      } else navigate("/elder");
    } catch (e) {
      setError(e.message || t("auth.errorFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #FFF5F7 0%, #F0E7FF 100%)" }}
    >
      <div className="absolute top-4 right-4 z-10">
        <PublicLanguageSwitcher />
      </div>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center mb-3" aria-hidden>
            <Heart size={32} className="text-white" fill="white" />
          </div>
          <h1 className="text-emerald-700" style={{ fontSize: "32px", fontWeight: 700 }}>
            Grace
          </h1>
        </div>

        <WellnessCard>
          <div className="flex rounded-[16px] bg-gray-100 p-1 mb-6" role="tablist" aria-label={t("auth.authTabsAria")}>
            <button
              type="button"
              role="tab"
              id="auth-tab-login"
              aria-selected={activeTab === "login"}
              aria-controls="auth-panel"
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-2.5 rounded-[12px] transition-all font-medium ${
                activeTab === "login" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-600"
              }`}
            >
              {t("auth.tabLogin")}
            </button>
            <button
              type="button"
              role="tab"
              id="auth-tab-register"
              aria-selected={activeTab === "register"}
              aria-controls="auth-panel"
              onClick={() => setActiveTab("register")}
              className={`flex-1 py-2.5 rounded-[12px] transition-all font-medium ${
                activeTab === "register" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-600"
              }`}
            >
              {t("auth.tabRegister")}
            </button>
          </div>

          <form id="auth-panel" role="tabpanel" aria-labelledby={activeTab === "login" ? "auth-tab-login" : "auth-tab-register"} onSubmit={handleSubmit} className="space-y-5">
            <div>
              <span className="block text-gray-700 mb-2" style={{ fontSize: "14px", fontWeight: 600 }}>
                {t("auth.iAmA")}
              </span>
              <div className="flex gap-3" role="group" aria-label={t("auth.iAmA")}>
                <button
                  type="button"
                  onClick={() => setRole("elder")}
                  aria-pressed={role === "elder"}
                  className={`flex-1 py-3 rounded-[16px] font-medium transition-all ${
                    role === "elder" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {t("auth.roleElder")}
                </button>
                <button
                  type="button"
                  onClick={() => setRole("caregiver")}
                  aria-pressed={role === "caregiver"}
                  className={`flex-1 py-3 rounded-[16px] font-medium transition-all ${
                    role === "caregiver" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {t("auth.roleCaregiver")}
                </button>
              </div>
            </div>

            {activeTab === "register" && (
              <div>
                <label htmlFor="auth-name" className="block text-gray-700 mb-2" style={{ fontSize: "14px", fontWeight: 600 }}>
                  {t("auth.name")}
                </label>
                <input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("auth.namePlaceholder")}
                  className="w-full px-4 py-3 rounded-[16px] bg-white border-2 border-gray-200 focus:border-emerald-600 focus:outline-none transition-colors"
                  style={{ fontSize: "16px" }}
                />
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-gray-700 mb-2" style={{ fontSize: "14px", fontWeight: 600 }}>
                {t("auth.email")}
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                className="w-full px-4 py-3 rounded-[16px] bg-white border-2 border-gray-200 focus:border-emerald-600 focus:outline-none transition-colors"
                style={{ fontSize: "16px" }}
              />
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-gray-700 mb-2" style={{ fontSize: "14px", fontWeight: 600 }}>
                {t("auth.password")}
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={activeTab === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.passwordPlaceholder")}
                className="w-full px-4 py-3 rounded-[16px] bg-white border-2 border-gray-200 focus:border-emerald-600 focus:outline-none transition-colors"
                style={{ fontSize: "16px" }}
              />
            </div>

            {error && (
              <div className="p-3 rounded-[12px] bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
                {error}
              </div>
            )}

            <WellnessButton
              type="submit"
              variant="primary"
              size="large"
              className="w-full mt-6"
              disabled={loading}
            >
              {loading ? t("auth.wait") : activeTab === "login" ? t("auth.submitLogin") : t("auth.submitRegister")}
            </WellnessButton>

            {activeTab === "login" && (
              <p className="text-center mt-3">
                <Link to="/auth/forgot" className="text-emerald-700 font-medium text-sm">
                  {t("auth.forgotPasswordLink")}
                </Link>
              </p>
            )}

            <p className="text-center text-gray-600 mt-4" style={{ fontSize: "14px" }}>
              {activeTab === "login" ? (
                <>
                  {t("auth.noAccount")}{" "}
                  <button type="button" onClick={() => setActiveTab("register")} className="text-emerald-700 font-medium">
                    {t("auth.signUpLink")}
                  </button>
                </>
              ) : (
                <>
                  {t("auth.hasAccount")}{" "}
                  <button type="button" onClick={() => setActiveTab("login")} className="text-emerald-700 font-medium">
                    {t("auth.signInLink")}
                  </button>
                </>
              )}
            </p>
          </form>
        </WellnessCard>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-full mt-4 py-2 text-gray-500 text-sm font-medium"
        >
          ← {t("auth.back")}
        </button>
      </div>
    </div>
  );
}
