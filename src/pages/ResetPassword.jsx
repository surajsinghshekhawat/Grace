import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { WellnessButton } from "../components/WellnessButton";
import { WellnessCard } from "../components/WellnessCard";
import { PublicLanguageSwitcher } from "../components/PublicLanguageSwitcher";
import { Heart } from "lucide-react";
import useStore from "../store";
import { apiFetch } from "../lib/api";
import { getAssessmentEntryPath } from "../lib/assessmentEntry";
import { useI18n } from "../contexts/LanguageContext.jsx";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useI18n();
  const token = searchParams.get("token") || "";
  const setAuthUser = useStore((s) => s.setAuthUser);
  const resetAssessment = useStore((s) => s.resetAssessment);

  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const me = await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, new_password: password }),
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
    } catch (err) {
      setError(err.message || t("auth.errorFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div
        className="relative min-h-screen flex flex-col items-center justify-center p-6"
        style={{ background: "linear-gradient(135deg, #ECFDF5 0%, #ECFEFF 100%)" }}
      >
        <div className="absolute top-4 right-4 z-10">
          <PublicLanguageSwitcher />
        </div>
        <WellnessCard className="max-w-md w-full">
          <p className="text-red-700 text-sm mb-4">{t("auth.resetInvalid")}</p>
          <Link to="/auth/forgot" className="text-emerald-700 font-medium text-sm">
            {t("auth.forgotTitle")}
          </Link>
        </WellnessCard>
      </div>
    );
  }

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
            {t("auth.resetTitle")}
          </h1>
        </div>

        <WellnessCard>
          <form onSubmit={handleSubmit} className="space-y-5">
            <p className="text-gray-600 text-sm">{t("auth.resetSub")}</p>
            <div>
              <label htmlFor="reset-pw" className="block text-gray-700 mb-2 text-sm font-semibold">
                {t("auth.newPassword")}
              </label>
              <input
                id="reset-pw"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.passwordPlaceholder")}
                className="w-full px-4 py-3 rounded-[16px] bg-white border-2 border-gray-200 focus:border-emerald-600 focus:outline-none"
                style={{ fontSize: "16px" }}
                minLength={6}
                required
              />
            </div>
            {error && (
              <div className="p-3 rounded-[12px] bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
                {error}
              </div>
            )}
            <WellnessButton type="submit" variant="primary" size="large" className="w-full" disabled={loading}>
              {loading ? t("auth.wait") : t("auth.resetSubmit")}
            </WellnessButton>
            <p className="text-center text-sm">
              <Link to="/auth" className="text-emerald-700 font-medium">
                {t("auth.forgotBack")}
              </Link>
            </p>
          </form>
        </WellnessCard>
      </div>
    </div>
  );
}
