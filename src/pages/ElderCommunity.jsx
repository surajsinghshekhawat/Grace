import { useCallback, useEffect, useState } from "react";
import { WellnessCard } from "../components/WellnessCard";
import { WellnessButton } from "../components/WellnessButton";
import { MessageCircle, Heart, Users, ArrowLeft, Loader2, Sparkles, Flag } from "lucide-react";
import { motion } from "framer-motion";
import useStore from "../store";
import { apiFetch } from "../lib/api";
import { useI18n } from "../contexts/LanguageContext";

function formatTimeAgo(iso, t, lang) {
  if (!iso) return "";
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return t("comm.timeJustNow");
  if (s < 3600) return t("comm.timeMinsAgo", { n: Math.floor(s / 60) });
  if (s < 86400) return t("comm.timeHoursAgo", { n: Math.floor(s / 3600) });
  const loc = lang === "hi" ? "hi-IN" : lang === "ta" ? "ta-IN" : undefined;
  try {
    return d.toLocaleDateString(loc);
  } catch {
    return d.toLocaleDateString();
  }
}

function CommentThread({ nodes, postId, onRefresh, onReportComment, depth = 0 }) {
  const { t, lang } = useI18n();
  const [replyText, setReplyText] = useState({});
  const [submitting, setSubmitting] = useState({});

  const toggleCommentLike = async (commentId) => {
    await apiFetch(`/api/community/comments/${commentId}/like`, { method: "POST" });
    onRefresh();
  };

  const sendReply = async (parentId, text) => {
    const bodyTrimmed = (text || "").trim();
    if (!bodyTrimmed) return;
    setSubmitting((m) => ({ ...m, [parentId]: true }));
    try {
      await apiFetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: bodyTrimmed, parent_comment_id: parentId }),
      });
      setReplyText((m) => ({ ...m, [parentId]: "" }));
      onRefresh();
    } finally {
      setSubmitting((m) => ({ ...m, [parentId]: false }));
    }
  };

  if (!nodes?.length) return null;

  return (
    <div className={depth ? "mt-3 ml-3 pl-3 border-l-2 border-slate-200" : "mt-4 space-y-4"}>
      {nodes.map((node) => (
        <div key={node.id} className="rounded-xl bg-slate-50 p-3">
          <div className="flex justify-between gap-2">
            <span className="text-sm font-semibold text-gray-900">{node.author_name}</span>
            <span className="text-xs text-gray-500">{formatTimeAgo(node.created_at, t, lang)}</span>
          </div>
          <p className="text-gray-700 text-sm mt-1 whitespace-pre-wrap">{node.body}</p>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <button
              type="button"
              onClick={() => toggleCommentLike(node.id)}
              className={`text-xs font-medium flex items-center gap-1 ${
                node.liked_by_me ? "text-emerald-700" : "text-gray-500"
              }`}
            >
              <Heart size={14} className={node.liked_by_me ? "fill-current" : ""} />
              {node.like_count}
            </button>
            {onReportComment ? (
              <button
                type="button"
                onClick={() => onReportComment(node.id)}
                className="text-xs font-medium text-slate-500 flex items-center gap-1 hover:text-teal-700"
              >
                <Flag size={12} /> {t("comm.report")}
              </button>
            ) : null}
          </div>
          <div className="mt-2 flex flex-col gap-2">
            <input
              type="text"
              placeholder={t("comm.replyPlaceholder")}
              value={replyText[node.id] ?? ""}
              onChange={(e) => setReplyText((m) => ({ ...m, [node.id]: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            />
            <button
              type="button"
              disabled={submitting[node.id]}
              onClick={() => sendReply(node.id, replyText[node.id])}
              className="self-start text-xs font-semibold text-violet-700"
            >
              {submitting[node.id] ? t("comm.replySending") : t("comm.reply")}
            </button>
          </div>
          {node.replies?.length > 0 && (
            <CommentThread
              nodes={node.replies}
              postId={postId}
              onRefresh={onRefresh}
              onReportComment={onReportComment}
              depth={depth + 1}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ElderCommunity() {
  const { t, lang } = useI18n();
  const authUser = useStore((s) => s.authUser);

  const [topics, setTopics] = useState([]);
  const [filterTopicId, setFilterTopicId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newPostBody, setNewPostBody] = useState("");
  const [composeTopicId, setComposeTopicId] = useState("daily_life");
  const [topComment, setTopComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState("Spam or scam");
  const [reportDetails, setReportDetails] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [reportThanks, setReportThanks] = useState(false);

  const openReport = (type, id) => {
    setReportTarget({ type, id });
    setReportReason("Spam or scam");
    setReportDetails("");
    setReportThanks(false);
    setReportOpen(true);
  };

  const submitReport = async () => {
    if (!reportTarget) return;
    setReportBusy(true);
    setErr(null);
    try {
      await apiFetch("/api/community/report", {
        method: "POST",
        body: JSON.stringify({
          target_type: reportTarget.type,
          target_id: reportTarget.id,
          reason: reportReason,
          details: reportDetails.trim() || null,
        }),
      });
      setReportThanks(true);
      setTimeout(() => {
        setReportOpen(false);
        setReportTarget(null);
        setReportThanks(false);
      }, 1600);
    } catch (e) {
      setErr(e.message || t("comm.errReport"));
    } finally {
      setReportBusy(false);
    }
  };

  const loadTopics = useCallback(async () => {
    const data = await apiFetch(`/api/community/topics?lang=${encodeURIComponent(lang)}`);
    setTopics(Array.isArray(data) ? data : []);
  }, [lang]);

  const loadFeed = useCallback(async (tid) => {
    const q = tid ? `?topic_id=${encodeURIComponent(tid)}&limit=80` : "?limit=80";
    const data = await apiFetch(`/api/community/feed${q}`);
    setPosts(Array.isArray(data) ? data : []);
  }, []);

  const openPost = useCallback(async (postId) => {
    setBusy(true);
    setErr(null);
    try {
      const p = await apiFetch(`/api/community/posts/${postId}`);
      setSelectedPost(p);
    } catch (e) {
      setErr(e.message || t("comm.errLoadPost"));
    } finally {
      setBusy(false);
    }
  }, [t]);

  useEffect(() => {
    if (!authUser || authUser?.role !== "elder") {
      setLoading(false);
      return;
    }
    loadTopics().catch((e) => setErr(e.message));
  }, [authUser, authUser?.role, loadTopics]);

  useEffect(() => {
    if (!authUser || authUser?.role !== "elder") return;
    setLoading(true);
    loadFeed(filterTopicId)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [authUser, authUser?.role, filterTopicId, loadFeed]);

  useEffect(() => {
    if (topics.length && !topics.find((x) => x.id === composeTopicId)) {
      setComposeTopicId(topics[0].id);
    }
  }, [topics, composeTopicId]);

  const refreshSelectedPost = async () => {
    if (!selectedPost?.id) return;
    const p = await apiFetch(`/api/community/posts/${selectedPost.id}`);
    setSelectedPost(p);
    await loadFeed(filterTopicId);
  };

  const createPost = async () => {
    const body = newPostBody.trim();
    if (!body || !composeTopicId) return;
    setBusy(true);
    setErr(null);
    try {
      await apiFetch(`/api/community/topics/${composeTopicId}/posts`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setNewPostBody("");
      await loadFeed(filterTopicId);
    } catch (e) {
      setErr(e.message || t("comm.errPost"));
    } finally {
      setBusy(false);
    }
  };

  const togglePostLike = async (postId, e) => {
    e?.stopPropagation?.();
    await apiFetch(`/api/community/posts/${postId}/like`, { method: "POST" });
    if (selectedPost?.id === postId) await refreshSelectedPost();
    else await loadFeed(filterTopicId);
  };

  const sendTopComment = async () => {
    const body = topComment.trim();
    if (!body || !selectedPost?.id) return;
    setBusy(true);
    try {
      await apiFetch(`/api/community/posts/${selectedPost.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body, parent_comment_id: null }),
      });
      setTopComment("");
      await refreshSelectedPost();
    } catch (e) {
      setErr(e.message || t("comm.errComment"));
    } finally {
      setBusy(false);
    }
  };

  if (!authUser || authUser.role !== "elder") {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
        <p className="text-gray-600 text-center">{t("comm.elderOnly")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      <div className="px-6 pt-12 pb-8 bg-slate-100 border-b border-slate-200/80">
        <div className="max-w-[600px] mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
              <Users size={24} className="text-violet-700" />
            </div>
            <div>
              <h1 className="text-gray-900" style={{ fontSize: "28px", fontWeight: 800 }}>
                {t("comm.title")} <Sparkles className="inline w-6 h-6 text-teal-500 ml-1 -mt-1" />
              </h1>
              <p className="text-gray-600 text-sm font-medium">{t("comm.sub")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-4 max-w-[600px] mx-auto space-y-6 py-4">
        {err && (
          <div className="rounded-[16px] border border-red-200 bg-red-50 text-red-800 text-sm p-4">{err}</div>
        )}

        {loading && !selectedPost ? (
          <div className="flex justify-center py-12 text-gray-500 gap-2 items-center">
            <Loader2 className="animate-spin" size={22} /> {t("comm.loading")}
          </div>
        ) : selectedPost ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <button
              type="button"
              onClick={() => setSelectedPost(null)}
              className="flex items-center gap-2 text-gray-700 mb-4 text-sm font-medium"
            >
              <ArrowLeft size={18} /> {t("comm.backFeed")}
            </button>
            <WellnessCard>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {selectedPost.topic_title ? (
                  <span className="text-xs font-bold uppercase tracking-wide text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
                    {selectedPost.topic_title}
                  </span>
                ) : null}
                <span className="text-xs text-gray-500">{formatTimeAgo(selectedPost.created_at, t, lang)}</span>
              </div>
              <div className="flex justify-between gap-2 mb-2">
                <span className="font-semibold text-gray-900">{selectedPost.author_name}</span>
              </div>
              <p className="text-gray-800 whitespace-pre-wrap mb-4">{selectedPost.body}</p>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => togglePostLike(selectedPost.id)}
                  className={`flex items-center gap-2 text-sm font-semibold ${
                    selectedPost.liked_by_me ? "text-emerald-700" : "text-gray-600"
                  }`}
                >
                  <Heart size={18} className={selectedPost.liked_by_me ? "fill-current" : ""} />
                  {t("comm.likes", { n: selectedPost.like_count })}
                </button>
                <button
                  type="button"
                  onClick={() => openReport("post", selectedPost.id)}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-teal-700"
                >
                  <Flag size={16} /> {t("comm.reportPost")}
                </button>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{t("comm.addComment")}</h3>
                <textarea
                  value={topComment}
                  onChange={(e) => setTopComment(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm"
                  placeholder={t("comm.commentPlaceholder")}
                />
                <WellnessButton
                  variant="primary"
                  size="small"
                  className="mt-2"
                  disabled={busy || !topComment.trim()}
                  onClick={sendTopComment}
                >
                  {t("comm.postComment")}
                </WellnessButton>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{t("comm.commentsHeading")}</h3>
                {selectedPost.comments?.length ? (
                  <CommentThread
                    nodes={selectedPost.comments}
                    postId={selectedPost.id}
                    onRefresh={refreshSelectedPost}
                    onReportComment={(cid) => openReport("comment", cid)}
                  />
                ) : (
                  <p className="text-sm text-gray-500">{t("comm.noComments")}</p>
                )}
              </div>
            </WellnessCard>
          </motion.div>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
              <button
                type="button"
                onClick={() => setFilterTopicId(null)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  filterTopicId == null
                    ? "bg-emerald-600 text-white shadow-md"
                    : "bg-white border border-slate-200 text-gray-700 hover:border-emerald-300"
                }`}
              >
                {t("comm.allTopics")}
              </button>
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setFilterTopicId(topic.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    filterTopicId === topic.id
                      ? "bg-emerald-600 text-white shadow-md"
                      : "bg-white border border-slate-200 text-gray-700 hover:border-emerald-300"
                  }`}
                >
                  {topic.title}
                </button>
              ))}
            </div>

            <WellnessCard className="mb-2 border-2 border-dashed border-emerald-200 bg-white/80">
              <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                {t("comm.newPost")}
                <span className="text-xs font-normal text-emerald-600">{t("comm.composeHint")}</span>
              </h3>
              <label className="block text-xs font-semibold text-gray-500 mb-1">{t("comm.pickTopic")}</label>
              <select
                value={composeTopicId}
                onChange={(e) => setComposeTopicId(e.target.value)}
                className="w-full md:w-auto mb-3 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium bg-white"
              >
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.title}
                  </option>
                ))}
              </select>
              <textarea
                value={newPostBody}
                onChange={(e) => setNewPostBody(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm"
                placeholder={t("comm.placeholder")}
              />
              <WellnessButton variant="primary" className="mt-3 w-full md:w-auto" disabled={busy} onClick={createPost}>
                {t("comm.publish")}
              </WellnessButton>
            </WellnessCard>

            <div className="space-y-4">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.4) }}
                >
                  <WellnessCard className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openPost(post.id)}>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {post.topic_title ? (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {post.topic_title}
                        </span>
                      ) : null}
                      <span className="text-xs text-gray-500">{formatTimeAgo(post.created_at, t, lang)}</span>
                    </div>
                    <div className="flex justify-between gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{post.author_name}</span>
                    </div>
                    <p className="text-gray-700 text-sm line-clamp-4 whitespace-pre-wrap">{post.body}</p>
                    <div className="flex gap-4 mt-3 text-xs text-gray-500 flex-wrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={`flex items-center gap-1 font-semibold ${
                          post.liked_by_me ? "text-emerald-700" : "text-gray-600"
                        }`}
                        onClick={(e) => togglePostLike(post.id, e)}
                      >
                        <Heart size={16} className={post.liked_by_me ? "fill-emerald-500 text-emerald-500" : ""} />
                        {post.like_count}
                      </button>
                      <span className="flex items-center gap-1 text-gray-600">
                        <MessageCircle size={16} />
                        {post.comment_count}
                      </span>
                      <button
                        type="button"
                        className="font-medium text-emerald-700 hover:text-emerald-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          openPost(post.id);
                        }}
                      >
                        {t("comm.openPost")}
                      </button>
                      <button
                        type="button"
                        className="flex items-center gap-1 font-medium text-slate-500 hover:text-teal-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          openReport("post", post.id);
                        }}
                      >
                        <Flag size={14} /> {t("comm.report")}
                      </button>
                    </div>
                  </WellnessCard>
                </motion.div>
              ))}
              {!posts.length && (
                <p className="text-gray-500 text-sm text-center py-8">{t("comm.emptyFeed")}</p>
              )}
            </div>
          </>
        )}
      </div>

      {reportOpen && (
        <div
          className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4"
          onClick={() => !reportBusy && setReportOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {reportThanks ? (
              <p className="text-center text-gray-800 font-medium py-6">{t("comm.reportThanks")}</p>
            ) : (
              <>
                <h2 className="text-lg font-bold text-gray-900 mb-1">{t("comm.reportTitle")}</h2>
                <p className="text-sm text-gray-600 mb-4">{t("comm.reportSub")}</p>
                <label className="block text-xs font-semibold text-gray-500 mb-1">{t("comm.reportReasonLabel")}</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm mb-3"
                >
                  <option value="Spam or scam">{t("comm.reportSpam")}</option>
                  <option value="Harassment or hate">{t("comm.reportHarassment")}</option>
                  <option value="Suicide or self-harm concern">{t("comm.reportSelfHarm")}</option>
                  <option value="Other">{t("comm.reportOther")}</option>
                </select>
                <label className="block text-xs font-semibold text-gray-500 mb-1">{t("comm.reportDetailsLabel")}</label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm mb-4"
                  placeholder={t("comm.reportDetailsPh")}
                />
                <div className="flex gap-2">
                  <WellnessButton variant="secondary" className="flex-1" disabled={reportBusy} onClick={() => setReportOpen(false)}>
                    {t("comm.cancel")}
                  </WellnessButton>
                  <WellnessButton variant="primary" className="flex-1" disabled={reportBusy} onClick={submitReport}>
                    {reportBusy ? t("comm.reportSending") : t("comm.reportSubmit")}
                  </WellnessButton>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
