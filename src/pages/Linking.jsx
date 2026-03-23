import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { WellnessCard } from "../components/WellnessCard";
import { WellnessButton } from "../components/WellnessButton";
import { Link2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import useStore from "../store";
import { apiFetch } from "../lib/api";
import { useI18n } from "../contexts/LanguageContext.jsx";

function localeForLang(lang) {
  if (lang === "hi") return "hi-IN";
  if (lang === "ta") return "ta-IN";
  return undefined;
}

export default function Linking() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const authUser = useStore((s) => s.authUser);
  const [invite, setInvite] = useState(null);
  const [inviteCode, setInviteCode] = useState("");
  const [linked, setLinked] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const isCaregiver = authUser?.role === "caregiver";
  const fmt = (iso) => {
    try {
      return new Date(iso).toLocaleString(localeForLang(lang));
    } catch {
      return String(iso);
    }
  };

  const refresh = async () => {
    setError(null);
    try {
      if (isCaregiver) {
        const lst = await apiFetch("/api/caregiver/linked-elders");
        setLinked(Array.isArray(lst) ? lst : []);
      }
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    if (isCaregiver) refresh();
  }, [isCaregiver]);

  const createInvite = async () => {
    setLoading(true);
    setError(null);
    try {
      const inv = await apiFetch("/api/elder/invite", { method: "POST", body: "{}" });
      setInvite(inv);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const linkElder = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/caregiver/link-elder", {
        method: "POST",
        body: JSON.stringify({ code: inviteCode.trim() }),
      });
      setInviteCode("");
      await refresh();
      navigate("/caregiver");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{t("link.notSignedIn")}</p>
      </div>
    );
  }

  if (isCaregiver) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] pb-24">
        <div className="px-6 pt-12 pb-8" style={{ background: "linear-gradient(135deg, #ECFDF5 0%, #ECFEFF 100%)" }}>
          <div className="max-w-[600px] mx-auto">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-700 hover:text-emerald-700 transition-colors mb-4"
              aria-label={t("auth.back")}
            >
              <ArrowLeft size={20} aria-hidden />
              <span style={{ fontSize: "14px", fontWeight: 500 }}>{t("auth.back")}</span>
            </button>
            <h1 className="text-gray-800" style={{ fontSize: "28px", fontWeight: 700 }}>
              {t("link.cg.title")}
            </h1>
          </div>
        </div>

        <div className="px-6 -mt-4 max-w-[600px] mx-auto">
          {error && (
            <div className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
              {error}
            </div>
          )}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <WellnessCard>
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center mx-auto mb-4" aria-hidden>
                  <Link2 size={40} className="text-white" />
                </div>
                <h2 className="text-gray-800 mb-2" style={{ fontSize: "22px", fontWeight: 600 }}>
                  {t("link.cg.enterCodeTitle")}
                </h2>
                <p className="text-gray-600" style={{ fontSize: "14px" }}>
                  {t("link.cg.enterCodeHint")}
                </p>
              </div>

              <form onSubmit={linkElder} className="space-y-6">
                <div>
                  <label htmlFor="link-invite-code" className="block text-gray-700 mb-2" style={{ fontSize: "14px", fontWeight: 600 }}>
                    {t("link.cg.codeLabel")}
                  </label>
                  <input
                    id="link-invite-code"
                    type="text"
                    autoComplete="one-time-code"
                    placeholder={t("link.cg.codePlaceholder")}
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="w-full px-4 py-4 rounded-[16px] bg-white border-2 border-gray-200 focus:border-emerald-600 focus:outline-none transition-colors text-center tracking-wider"
                    style={{ fontSize: "20px", fontWeight: 600 }}
                  />
                  <p className="mt-2 text-gray-500 text-center" style={{ fontSize: "12px" }}>
                    {t("link.cg.caseSensitive")}
                  </p>
                </div>

                <WellnessButton type="submit" variant="primary" size="large" className="w-full" disabled={inviteCode.trim().length < 6 || loading}>
                  {loading ? t("link.cg.linking") : t("link.cg.submit")}
                </WellnessButton>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-gray-600 mb-2" style={{ fontSize: "14px", fontWeight: 600 }}>
                  {t("link.cg.howTitle")}
                </p>
                <ol className="space-y-2 text-gray-600" style={{ fontSize: "14px" }}>
                  <li className="flex gap-2">
                    <span className="text-emerald-700 font-semibold">1.</span>
                    <span>{t("link.cg.step1")}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-700 font-semibold">2.</span>
                    <span>{t("link.cg.step2")}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-700 font-semibold">3.</span>
                    <span>{t("link.cg.step3")}</span>
                  </li>
                </ol>
              </div>
            </WellnessCard>
          </motion.div>

          {linked.length > 0 && (
            <div className="mt-6">
              <h3 className="text-gray-800 mb-2" style={{ fontSize: "18px", fontWeight: 600 }}>
                {t("link.cg.linkedTitle")}
              </h3>
              <ul className="space-y-2">
                {linked.map((e) => (
                  <li key={e.elder_user_id} className="p-3 bg-white rounded-2xl border border-gray-100">
                    <div className="font-semibold text-gray-800">
                      {e.elder_name ?? t("link.cg.elderFallback", { id: e.elder_user_id })}
                    </div>
                    <div className="text-xs text-gray-500">{t("link.cg.linkedAt", { when: fmt(e.linked_at) })}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      <div className="px-6 pt-12 pb-8" style={{ background: "linear-gradient(135deg, #ECFDF5 0%, #ECFEFF 100%)" }}>
        <div className="max-w-[600px] mx-auto">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-700 hover:text-emerald-700 transition-colors mb-4"
            aria-label={t("auth.back")}
          >
            <ArrowLeft size={20} aria-hidden />
            <span style={{ fontSize: "14px", fontWeight: 500 }}>{t("auth.back")}</span>
          </button>
          <h1 className="text-gray-800" style={{ fontSize: "28px", fontWeight: 700 }}>
            {t("link.el.title")}
          </h1>
          <p className="text-gray-600 mt-1" style={{ fontSize: "14px" }}>
            {t("link.el.sub")}
          </p>
        </div>
      </div>

      <div className="px-6 -mt-4 max-w-[600px] mx-auto">
        {error && (
          <div className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
            {error}
          </div>
        )}
        <WellnessCard>
          <WellnessButton variant="primary" size="large" onClick={createInvite} disabled={loading} className="w-full">
            {loading ? t("link.el.generating") : t("link.el.generate")}
          </WellnessButton>
          {invite && (
            <div className="mt-6 p-4 rounded-[16px] border-2 border-gray-200">
              <p className="text-sm text-gray-500">{t("link.el.codeLabel")}</p>
              <p className="text-3xl font-bold tracking-widest text-gray-800 mt-1">{invite.code}</p>
              <p className="text-xs text-gray-400 mt-2">{t("link.el.expires", { when: fmt(invite.expires_at) })}</p>
            </div>
          )}
        </WellnessCard>
      </div>
    </div>
  );
}
