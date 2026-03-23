import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Shield } from "lucide-react";

import useStore from "../store";
import { useI18n } from "../contexts/LanguageContext.jsx";
import SettingsBlock from "../components/SettingsBlock";
import { apiFetch } from "../lib/api";

const CaregiverProfile = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const authUser = useStore((s) => s.authUser);
  const setAuthUser = useStore((s) => s.setAuthUser);
  const logout = useStore((s) => s.logout);
  const [name, setName] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState(null);
  const [cgExportBusy, setCgExportBusy] = useState(false);
  const [cgExportError, setCgExportError] = useState(null);
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
    return <div className="grace-card grace-card-pad">{t("link.notSignedIn")}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grace-card grace-card-pad">
        <h1 className="grace-title">{t("profile.cgTitle")}</h1>
        <p className="grace-subtitle mt-1">{t("profile.cgSub")}</p>
      </div>

      <div className="grace-card grace-card-pad space-y-3">
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase">{t("profile.nameFieldLabel")}</div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-gray-900"
            placeholder={t("profile.namePlaceholder")}
            autoComplete="name"
          />
          {nameError && <p className="text-red-600 text-sm mt-1">{nameError}</p>}
          <button
            type="button"
            disabled={nameSaving}
            onClick={async () => {
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
            }}
            className="mt-2 grace-pill-secondary text-sm"
          >
            {nameSaving ? t("profile.savingName") : t("profile.saveName")}
          </button>
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase">{t("profile.contactLabel")}</div>
          <div className="text-gray-900">{authUser.email_or_phone}</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase">{t("profile.roleLabel")}</div>
          <div className="text-gray-900">{t("auth.roleCaregiver")}</div>
        </div>
      </div>

      <div className="grace-card grace-card-pad space-y-3">
        <div className="text-xs font-semibold text-gray-500 uppercase">{t("profile.passwordTitle")}</div>
        <p className="text-sm text-gray-600">{t("profile.passwordSub")}</p>
        {pwdErr && <p className="text-red-600 text-sm">{pwdErr}</p>}
        {pwdMsg && <p className="text-green-700 text-sm">{pwdMsg}</p>}
        <div>
          <div className="text-xs text-gray-600 mb-1">{t("profile.currentPassword")}</div>
          <input
            type="password"
            value={curPwd}
            onChange={(e) => {
              setCurPwd(e.target.value);
              setPwdMsg(null);
              setPwdErr(null);
            }}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-gray-900"
            autoComplete="current-password"
          />
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">{t("profile.newPassword")}</div>
          <input
            type="password"
            value={newPwd}
            onChange={(e) => {
              setNewPwd(e.target.value);
              setPwdMsg(null);
              setPwdErr(null);
            }}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-gray-900"
            autoComplete="new-password"
          />
        </div>
        <button
          type="button"
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
          className="grace-pill-secondary text-sm disabled:opacity-50"
        >
          {pwdBusy ? t("profile.changingPassword") : t("profile.changePassword")}
        </button>
      </div>

      <div className="grace-card grace-card-pad space-y-3 border-red-200">
        <div className="text-xs font-semibold text-red-800 uppercase">{t("profile.deleteTitle")}</div>
        <p className="text-sm text-gray-600 leading-relaxed">{t("profile.deleteSub")}</p>
        {delErr && <p className="text-red-600 text-sm">{delErr}</p>}
        <div>
          <div className="text-xs text-gray-600 mb-1">{t("profile.deleteConfirmPassword")}</div>
          <input
            type="password"
            value={delPwd}
            onChange={(e) => {
              setDelPwd(e.target.value);
              setDelErr(null);
            }}
            className="w-full rounded-xl border border-red-200 px-3 py-2 text-gray-900"
            autoComplete="current-password"
          />
        </div>
        <button
          type="button"
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
              window.location.href = "/";
            } catch (e) {
              setDelErr(e.message || t("profile.deleteError"));
            } finally {
              setDelBusy(false);
            }
          }}
          className="w-full grace-pill bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
        >
          {delBusy ? t("profile.deletingAccount") : t("profile.deleteAccount")}
        </button>
      </div>

      {authUser?.is_moderator && (
        <div className="grace-card grace-card-pad">
          <button
            type="button"
            onClick={() => navigate("/moderator/reports")}
            className="w-full flex items-center justify-center gap-2 grace-pill-secondary text-sm"
          >
            <Shield size={18} aria-hidden />
            {t("profile.modLink")}
          </button>
        </div>
      )}

      <div className="grace-card grace-card-pad">
        <button type="button" onClick={() => navigate("/caregiver/link")} className="grace-pill-primary w-full">
          {t("profile.cgLinkElder")}
        </button>
      </div>

      <div className="grace-card grace-card-pad space-y-3">
        <div className="text-xs font-semibold text-gray-500 uppercase">{t("profile.cgDataTitle")}</div>
        <p className="text-sm text-gray-600 leading-relaxed">{t("profile.cgDataSub")}</p>
        {cgExportError && <p className="text-red-600 text-sm">{cgExportError}</p>}
        <button
          type="button"
          disabled={cgExportBusy}
          onClick={async () => {
            setCgExportError(null);
            setCgExportBusy(true);
            try {
              const data = await apiFetch("/api/me/caregiver-data-export");
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `grace-caregiver-data-export-${new Date().toISOString().slice(0, 10)}.json`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            } catch (e) {
              setCgExportError(e.message || t("profile.exportError"));
            } finally {
              setCgExportBusy(false);
            }
          }}
          className="w-full flex items-center justify-center gap-2 grace-pill-secondary text-sm"
        >
          <Download size={18} aria-hidden />
          {cgExportBusy ? t("profile.exporting") : t("profile.downloadCgJson")}
        </button>
      </div>

      <SettingsBlock isElder={false} />

      <div className="grace-card grace-card-pad">
        <button
          type="button"
          onClick={async () => {
            try {
              await apiFetch("/api/logout", { method: "POST" });
            } catch (_) {}
            logout();
            window.location.href = "/";
          }}
          className="grace-pill bg-red-50 text-red-700 hover:bg-red-100 w-full"
        >
          {t("profile.logoutToHome")}
        </button>
      </div>
    </div>
  );
};

export default CaregiverProfile;
