import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { WellnessButton } from "../components/WellnessButton";
import { WellnessCard } from "../components/WellnessCard";
import { PublicLanguageSwitcher } from "../components/PublicLanguageSwitcher";
import { Heart } from "lucide-react";
import { apiFetch } from "../lib/api";
import { useI18n } from "../contexts/LanguageContext.jsx";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const supportEmail = (import.meta.env.VITE_SUPPORT_EMAIL || "").trim();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email_or_phone: emailOrPhone.trim() }),
      });
      setDone(true);
    } catch (err) {
      setError(err.message || t("auth.errorFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #ECFDF5 0%, #ECFEFF 100%)" }}
    >
      <div className="absolute top-4 right-4 z-10">
        <PublicLanguageSwitcher />
      </div>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center mb-3" aria-hidden>
            <Heart size={32} className="text-white" fill="white" />
          </div>
          <h1 className="text-emerald-700" style={{ fontSize: "28px", fontWeight: 700 }}>
            {t("auth.forgotTitle")}
          </h1>
        </div>

        <WellnessCard>
          {done ? (
            <div className="space-y-4">
              <p className="text-gray-700 text-sm leading-relaxed">{t("auth.forgotDone")}</p>
              <p className="text-gray-600 text-sm">
                {t("auth.forgotSupportHint")}{" "}
                {supportEmail ? (
                  <a className="text-emerald-700 font-medium" href={`mailto:${supportEmail}`}>
                    {supportEmail}
                  </a>
                ) : (
                  <span className="text-gray-500">— set VITE_SUPPORT_EMAIL for your team address.</span>
                )}
              </p>
              <WellnessButton type="button" variant="primary" className="w-full" onClick={() => navigate("/auth")}>
                {t("auth.forgotBack")}
              </WellnessButton>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-gray-600 text-sm">{t("auth.forgotSub")}</p>
              <div>
                <label htmlFor="forgot-email" className="block text-gray-700 mb-2 text-sm font-semibold">
                  {t("auth.email")}
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder={t("auth.emailPlaceholder")}
                  className="w-full px-4 py-3 rounded-[16px] bg-white border-2 border-gray-200 focus:border-emerald-600 focus:outline-none"
                  style={{ fontSize: "16px" }}
                  required
                />
              </div>
              {error && (
                <div className="p-3 rounded-[12px] bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
                  {error}
                </div>
              )}
              <WellnessButton type="submit" variant="primary" size="large" className="w-full" disabled={loading}>
                {loading ? t("auth.wait") : t("auth.forgotSubmit")}
              </WellnessButton>
              <p className="text-center text-sm">
                <Link to="/auth" className="text-emerald-700 font-medium">
                  {t("auth.forgotBack")}
                </Link>
              </p>
            </form>
          )}
        </WellnessCard>
      </div>
    </div>
  );
}
