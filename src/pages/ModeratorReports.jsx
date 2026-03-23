import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flag, Shield } from "lucide-react";
import useStore from "../store";
import { apiFetch } from "../lib/api";
import { WellnessCard } from "../components/WellnessCard";
import { WellnessButton } from "../components/WellnessButton";
import { useI18n } from "../contexts/LanguageContext";

function formatWhen(iso, lang) {
  if (!iso) return "";
  try {
    const loc = lang === "hi" ? "hi-IN" : lang === "ta" ? "ta-IN" : undefined;
    return new Date(iso).toLocaleString(loc);
  } catch {
    return iso;
  }
}

export default function ModeratorReports() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const authUser = useStore((s) => s.authUser);
  const setAuthUser = useStore((s) => s.setAuthUser);

  const home = authUser?.role === "caregiver" ? "/caregiver/profile" : "/elder/profile";

  const [filter, setFilter] = useState("pending");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actingId, setActingId] = useState(null);

  useEffect(() => {
    if (!authUser) return;
    apiFetch("/api/me")
      .then((me) => setAuthUser(me))
      .catch(() => {});
  }, [authUser, setAuthUser]);

  const load = useCallback(async () => {
    if (!authUser || !authUser?.is_moderator) {
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const q = filter === "all" ? "" : `?status=${encodeURIComponent(filter)}`;
      const data = await apiFetch(`/api/moderator/community-reports${q}`);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || t("mod.loadError"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [authUser, authUser?.is_moderator, filter, t]);

  useEffect(() => {
    load();
  }, [load]);

  const patchStatus = async (id, status) => {
    setActingId(id);
    setError(null);
    try {
      await apiFetch(`/api/moderator/community-reports/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (e) {
      setError(e.message || t("mod.patchError"));
    } finally {
      setActingId(null);
    }
  };

  if (!authUser) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
        <p className="text-gray-600">{t("mod.signIn")}</p>
      </div>
    );
  }

  if (!authUser.is_moderator) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] pb-24">
        <div className="px-6 pt-12 pb-6 max-w-[720px] mx-auto">
          <button
            type="button"
            onClick={() => navigate(home)}
            className="flex items-center gap-2 text-gray-700 hover:text-violet-600 mb-6"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">{t("mod.back")}</span>
          </button>
          <WellnessCard>
            <p className="text-gray-800 font-semibold">{t("mod.deniedTitle")}</p>
            <p className="text-gray-600 text-sm mt-2">{t("mod.deniedSub")}</p>
          </WellnessCard>
        </div>
      </div>
    );
  }

  const filters = [
    { id: "pending", label: t("mod.filterPending") },
    { id: "reviewed", label: t("mod.filterReviewed") },
    { id: "dismissed", label: t("mod.filterDismissed") },
    { id: "all", label: t("mod.filterAll") },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      <div className="px-6 pt-12 pb-6 bg-slate-100 border-b border-slate-200/80">
        <div className="max-w-[900px] mx-auto">
          <button
            type="button"
            onClick={() => navigate(home)}
            className="flex items-center gap-2 text-gray-700 hover:text-violet-600 mb-4"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">{t("mod.back")}</span>
          </button>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
              <Shield className="text-violet-700" size={24} />
            </div>
            <div>
              <h1 className="text-gray-800 text-2xl font-bold">{t("mod.title")}</h1>
              <p className="text-gray-600 text-sm mt-1">{t("mod.sub")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-2 max-w-[900px] mx-auto space-y-4">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition ${
                filter === f.id ? "bg-violet-600 text-white" : "bg-white border border-slate-200 text-gray-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>
        )}

        {loading ? (
          <p className="text-gray-600 text-sm py-8 text-center">{t("mod.loading")}</p>
        ) : rows.length === 0 ? (
          <WellnessCard>
            <p className="text-gray-600 text-sm">{t("mod.empty")}</p>
          </WellnessCard>
        ) : (
          rows.map((r) => (
            <WellnessCard key={r.id}>
              <div className="flex items-start gap-2 mb-3">
                <Flag size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                    {t("mod.report")} #{r.id} · {formatWhen(r.created_at, lang)}
                  </p>
                  <p className="text-gray-800 text-sm mt-1">
                    <span className="font-semibold">{t("mod.reporter")}:</span> {r.reporter_name}{" "}
                    <span className="text-gray-500">(user #{r.reporter_user_id})</span>
                  </p>
                  <p className="text-gray-800 text-sm mt-1">
                    <span className="font-semibold">{t("mod.target")}:</span> {r.target_type} #{r.target_id}
                    {r.target_type === "comment" && r.target_post_id ? (
                      <span className="text-gray-500"> · {t("mod.post")} #{r.target_post_id}</span>
                    ) : null}
                  </p>
                  <p className="text-gray-800 text-sm mt-2">
                    <span className="font-semibold">{t("mod.reason")}:</span> {r.reason}
                  </p>
                  {r.details ? (
                    <p className="text-gray-700 text-sm mt-1 whitespace-pre-wrap">{r.details}</p>
                  ) : null}
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {r.target_preview}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {t("mod.status")}: <span className="font-semibold text-gray-700">{r.status}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                {r.status !== "reviewed" && (
                  <WellnessButton
                    size="small"
                    variant="secondary"
                    disabled={actingId === r.id}
                    onClick={() => patchStatus(r.id, "reviewed")}
                  >
                    {t("mod.markReviewed")}
                  </WellnessButton>
                )}
                {r.status !== "dismissed" && (
                  <WellnessButton
                    size="small"
                    variant="outline"
                    disabled={actingId === r.id}
                    onClick={() => patchStatus(r.id, "dismissed")}
                  >
                    {t("mod.dismiss")}
                  </WellnessButton>
                )}
                {r.status !== "pending" && (
                  <WellnessButton
                    size="small"
                    variant="outline"
                    disabled={actingId === r.id}
                    onClick={() => patchStatus(r.id, "pending")}
                  >
                    {t("mod.reopen")}
                  </WellnessButton>
                )}
              </div>
            </WellnessCard>
          ))
        )}
      </div>
    </div>
  );
}
