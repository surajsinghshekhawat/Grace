import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { WellnessCard } from "../components/WellnessCard";
import { WellnessButton } from "../components/WellnessButton";
import { ArrowLeft, Download, LogOut, Shield } from "lucide-react";
import { motion } from "framer-motion";
import useStore from "../store";
import SettingsBlock from "../components/SettingsBlock";
import { apiFetch } from "../lib/api";
import { useI18n } from "../contexts/LanguageContext.jsx";

export default function ElderProfile() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const authUser = useStore((s) => s.authUser);
  const setAuthUser = useStore((s) => s.setAuthUser);
  const logout = useStore((s) => s.logout);

  const [name, setName] = useState(authUser?.name || "");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState(null);
  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [pwdMsg, setPwdMsg] = useState(null);
  const [pwdErr, setPwdErr] = useState(null);
  const [delPwd, setDelPwd] = useState("");
  const [delBusy, setDelBusy] = useState(false);
  const [delErr, setDelErr] = useState(null);

  useEffect(() => {
    setName(authUser?.name || "");
  }, [authUser?.name]);

  if (!authUser) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <p className="text-gray-600">{t("link.notSignedIn")}</p>
      </div>
    );
  }

  const downloadDataExport = async () => {
    setExportError(null);
    setExportBusy(true);
    try {
      const data = await apiFetch("/api/me/data-export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `grace-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportError(e.message || t("profile.exportError"));
    } finally {
      setExportBusy(false);
    }
  };

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === authUser.name) return;
    setNameError(null);
    setNameSaving(true);
    try {
      const me = await apiFetch("/api/me", { method: "PATCH", body: JSON.stringify({ name: trimmed }) });
      setAuthUser(me);
    } catch (e) {
      setNameError(e.message || t("profile.nameUpdateError"));
    } finally {
      setNameSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      <div className="px-6 pt-12 pb-8 bg-slate-100 border-b border-slate-200/80">
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
            {t("profile.settingsTitle")}
          </h1>
        </div>
      </div>

      <div className="px-6 -mt-4 max-w-[600px] mx-auto space-y-6">
        <SettingsBlock isElder />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <WellnessCard>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 mb-1 text-xs font-semibold uppercase tracking-wide">{t("profile.displayNameLabel")}</p>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-[16px] border-2 border-gray-200 focus:border-emerald-600 focus:outline-none"
                  placeholder={t("profile.namePlaceholder")}
                  autoComplete="name"
                />
                {nameError && <p className="text-red-600 text-sm mt-2">{nameError}</p>}
                <WellnessButton variant="secondary" size="small" className="mt-3" disabled={nameSaving} onClick={saveName}>
                  {nameSaving ? t("profile.savingName") : t("profile.saveName")}
                </WellnessButton>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="text-gray-600 mb-1 text-xs font-semibold uppercase tracking-wide">{t("profile.accountLabel")}</p>
                <p className="text-gray-800 text-base">{authUser.email_or_phone}</p>
              </div>
            </div>
          </WellnessCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}>
          <WellnessCard>
            <p className="text-gray-600 mb-1 text-xs font-semibold uppercase tracking-wide">{t("profile.passwordTitle")}</p>
            <p className="text-gray-600 text-sm mb-3">{t("profile.passwordSub")}</p>
            {pwdErr && <p className="text-red-600 text-sm mb-2">{pwdErr}</p>}
            {pwdMsg && <p className="text-green-700 text-sm mb-2">{pwdMsg}</p>}
            <label className="block text-sm text-gray-700 mb-1">{t("profile.currentPassword")}</label>
            <input
              type="password"
              value={curPwd}
              onChange={(e) => {
                setCurPwd(e.target.value);
                setPwdMsg(null);
                setPwdErr(null);
              }}
              className="w-full px-4 py-3 rounded-[16px] border-2 border-gray-200 focus:border-emerald-600 focus:outline-none mb-3"
              autoComplete="current-password"
            />
            <label className="block text-sm text-gray-700 mb-1">{t("profile.newPassword")}</label>
            <input
              type="password"
              value={newPwd}
              onChange={(e) => {
                setNewPwd(e.target.value);
                setPwdMsg(null);
                setPwdErr(null);
              }}
              className="w-full px-4 py-3 rounded-[16px] border-2 border-gray-200 focus:border-emerald-600 focus:outline-none mb-3"
              autoComplete="new-password"
            />
            <WellnessButton
              variant="secondary"
              size="small"
              disabled={pwdBusy || !curPwd || !newPwd}
              onClick={async () => {
                setPwdErr(null);
                setPwdMsg(null);
                setPwdBusy(true);
                try {
                  await apiFetch("/api/me/change-password", {
                    method: "POST",
                    body: JSON.stringify({ current_password: curPwd, new_password: newPwd }),
                  });
                  setCurPwd("");
                  setNewPwd("");
                  setPwdMsg(t("profile.passwordChanged"));
                } catch (e) {
                  setPwdErr(e.message || t("profile.passwordError"));
                } finally {
                  setPwdBusy(false);
                }
              }}
            >
              {pwdBusy ? t("profile.changingPassword") : t("profile.changePassword")}
            </WellnessButton>
          </WellnessCard>
        </motion.div>

        {authUser?.is_moderator && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <WellnessCard>
              <button
                type="button"
                onClick={() => navigate("/moderator/reports")}
                className="w-full flex items-center justify-center gap-2 text-left px-2 py-2 rounded-xl hover:bg-violet-50 text-violet-800 font-semibold text-sm"
              >
                <Shield size={20} />
                {t("profile.modLink")}
              </button>
            </WellnessCard>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.125 }}>
          <WellnessCard>
            <WellnessButton
              variant="secondary"
              className="w-full"
              onClick={() => navigate("/elder/share")}
            >
              {t("profile.linkCaregiver")}
            </WellnessButton>
          </WellnessCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
          <WellnessCard>
            <p className="text-gray-600 mb-1 text-xs font-semibold uppercase tracking-wide text-red-800">{t("profile.deleteTitle")}</p>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">{t("profile.deleteSub")}</p>
            {delErr && <p className="text-red-600 text-sm mb-2">{delErr}</p>}
            <label className="block text-sm text-gray-700 mb-1">{t("profile.deleteConfirmPassword")}</label>
            <input
              type="password"
              value={delPwd}
              onChange={(e) => {
                setDelPwd(e.target.value);
                setDelErr(null);
              }}
              className="w-full px-4 py-3 rounded-[16px] border-2 border-red-200 focus:border-red-400 focus:outline-none mb-3"
              autoComplete="current-password"
            />
            <WellnessButton
              variant="outline"
              className="w-full border-red-400 text-red-700 hover:bg-red-50"
              disabled={delBusy || !delPwd}
              onClick={async () => {
                if (!window.confirm(t("profile.deleteConfirmDialog"))) return;
                setDelErr(null);
                setDelBusy(true);
                try {
                  await apiFetch("/api/me/delete-account", {
                    method: "POST",
                    body: JSON.stringify({ password: delPwd }),
                  });
                  logout();
                  navigate("/");
                } catch (e) {
                  setDelErr(e.message || t("profile.deleteError"));
                } finally {
                  setDelBusy(false);
                }
              }}
            >
              {delBusy ? t("profile.deletingAccount") : t("profile.deleteAccount")}
            </WellnessButton>
          </WellnessCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <WellnessCard>
            <p className="text-gray-600 mb-1 text-xs font-semibold uppercase tracking-wide">{t("profile.dataTitle")}</p>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">{t("profile.dataSub")}</p>
            {exportError && <p className="text-red-600 text-sm mb-3">{exportError}</p>}
            <WellnessButton
              variant="secondary"
              className="w-full flex items-center justify-center gap-2"
              disabled={exportBusy}
              onClick={downloadDataExport}
            >
              <Download size={18} />
              {exportBusy ? t("profile.exporting") : t("profile.downloadJson")}
            </WellnessButton>
          </WellnessCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <WellnessButton
            variant="outline"
            onClick={async () => {
              try {
                await apiFetch("/api/logout", { method: "POST" });
              } catch (_) {}
              logout();
              navigate("/");
            }}
            className="w-full flex items-center justify-center gap-2 border-red-300 text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} aria-hidden />
            {t("profile.logout")}
          </WellnessButton>
        </motion.div>

        <p className="text-center text-gray-400 pb-6 text-xs">{t("profile.footerVersion")}</p>
      </div>
    </div>
  );
}
