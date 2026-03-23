import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { WellnessCard } from "../components/WellnessCard";
import { ImageWithFallback } from "../components/ImageWithFallback";
import { ArrowLeft, Phone, Heart, Users, Activity, Book, Search, X, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { apiFetch } from "../lib/api";
import { useI18n } from "../contexts/LanguageContext";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1619186067269-b14da5a19bcd?w=400",
  "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400",
  "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
];

function categoryAccent(cat) {
  const c = (cat || "").toLowerCase();
  if (c.includes("mental") || c.includes("calm")) return "#93C5FD";
  if (c.includes("movement")) return "#6EE7B7";
  if (c.includes("nutrition")) return "#FBBF24";
  if (c.includes("urgent") || c.includes("crisis")) return "#EF4444";
  if (c.includes("connection") || c.includes("community")) return "#0D9488";
  if (c.includes("brain")) return "#67E8F9";
  return "#047857";
}

export default function ElderResources() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight") || searchParams.get("focus") || searchParams.get("id");

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, listRes] = await Promise.all([
        apiFetch("/api/resources/categories").catch(() => []),
        apiFetch("/api/resources").catch(() => []),
      ]);
      setCategories(Array.isArray(catRes) ? catRes.map((c) => c.name).filter(Boolean) : []);
      setItems(Array.isArray(listRes) ? listRes : []);
    } catch (e) {
      setError(e.message || t("res.errLoad"));
    } finally {
      setLoading(false);
    }
  }, [t, lang]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!highlightId || !items.length) return;
    const found = items.find((i) => i.id === highlightId);
    if (found) setSelected(found);
  }, [highlightId, items]);

  const filtered = useMemo(() => {
    let list = items;
    if (categoryFilter) {
      list = list.filter((i) => (i.category || "").toLowerCase() === categoryFilter.toLowerCase());
    }
    const q = searchQ.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          (r.title || "").toLowerCase().includes(q) ||
          (r.summary || "").toLowerCase().includes(q) ||
          (r.tags || []).some((tag) => String(tag).toLowerCase().includes(q))
      );
    }
    return list;
  }, [items, searchQ, categoryFilter]);

  const openDetail = (resource) => {
    setSelected(resource);
    setSearchParams({ highlight: resource.id });
  };

  const closeDetail = () => {
    setSelected(null);
    setSearchParams({});
  };

  const followLink = (url) => {
    if (!url) return;
    if (url.startsWith("/")) {
      navigate(url);
      closeDetail();
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      <div className="px-6 pt-12 pb-8 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-b border-slate-200/80">
        <div className="max-w-[1100px] mx-auto">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-700 hover:text-emerald-700 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span style={{ fontSize: "14px", fontWeight: 500 }}>Back</span>
          </button>
          <h1 className="text-gray-800 mb-2" style={{ fontSize: "28px", fontWeight: 700 }}>
            {t("res.title")}
          </h1>
          <p className="text-gray-600" style={{ fontSize: "14px" }}>
            {t("res.subtitle")}
          </p>
        </div>
      </div>

      <div className="px-6 -mt-4 max-w-[1100px] mx-auto">
        {error && (
          <div className="mb-4 p-4 rounded-[16px] bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={t("res.search")}
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white rounded-[16px] border border-gray-200 focus:outline-none focus:border-emerald-600 transition-colors"
              style={{ fontSize: "15px" }}
            />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
          <h2 className="text-gray-800 mb-3" style={{ fontSize: "18px", fontWeight: 600 }}>
            {t("res.categories")}
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => setCategoryFilter("")}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border ${
                !categoryFilter ? "bg-teal-600 text-white border-teal-600" : "bg-white border-gray-200 text-gray-700"
              }`}
            >
              {t("res.all")}
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategoryFilter(c)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border ${
                  categoryFilter === c ? "bg-emerald-600 text-white border-emerald-600" : "bg-white border-gray-200 text-gray-700"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <p className="text-gray-500 py-12 text-center">{t("res.loading")}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((resource, index) => {
              const color = categoryAccent(resource.category);
              const img = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
              const Icon =
                (resource.category || "").toLowerCase().includes("mental") || (resource.tags || []).includes("stress")
                  ? Heart
                  : (resource.category || "").toLowerCase().includes("movement")
                    ? Activity
                    : (resource.category || "").toLowerCase().includes("connection")
                      ? Users
                      : Book;
              return (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(0.05 * index, 0.5) }}
                >
                  <button
                    type="button"
                    onClick={() => openDetail(resource)}
                    className="w-full text-left overflow-hidden rounded-[20px] bg-white hover:shadow-lg transition-all duration-300 border border-slate-100"
                    style={{ boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.06)" }}
                  >
                    <div className="relative h-36 overflow-hidden flex items-center justify-center" style={{ background: `${color}18` }}>
                      <ImageWithFallback src={img} alt="" className="w-full h-full object-cover opacity-90" />
                      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 40%, ${color}35 100%)` }} />
                      <div
                        className="absolute top-3 left-3 w-10 h-10 rounded-full flex items-center justify-center text-white shadow"
                        style={{ background: color }}
                      >
                        <Icon size={20} />
                      </div>
                      <span className="absolute bottom-3 left-3 text-xs font-bold text-white drop-shadow-md bg-black/25 px-2 py-0.5 rounded-full">
                        {resource.category}
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="text-gray-800 mb-2" style={{ fontSize: "18px", fontWeight: 600 }}>
                        {resource.title}
                      </h3>
                      <p className="text-gray-600 mb-3 line-clamp-3" style={{ fontSize: "14px" }}>
                        {resource.summary}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(resource.tags || []).slice(0, 4).map((tag) => (
                          <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-1" style={{ color, fontSize: "14px", fontWeight: 600 }}>
                        {t("res.open")} →
                      </span>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}

        {!loading && !filtered.length && (
          <p className="text-center text-gray-500 py-12">{t("res.emptyFilter")}</p>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 mb-6">
          <div
            className="rounded-[20px] p-6"
            style={{ background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)", boxShadow: "0px 8px 20px rgba(239, 68, 68, 0.3)" }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Phone size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-white mb-1" style={{ fontSize: "20px", fontWeight: 700 }}>
                  {t("res.crisisTitle")}
                </h3>
                <p className="text-white/90" style={{ fontSize: "14px" }}>
                  {t("res.crisisSub")}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-white/95 text-sm font-semibold">{t("res.crisisIndiaHeading")}</p>
              <a
                href="tel:9152987821"
                className="block w-full px-6 py-3 bg-white text-red-600 rounded-[16px] text-center transition-all hover:bg-red-50"
                style={{ fontSize: "17px", fontWeight: 700 }}
              >
                {t("res.crisisICall")}
              </a>
              <a
                href="tel:18602662345"
                className="block w-full px-6 py-3 bg-white text-red-600 rounded-[16px] text-center transition-all hover:bg-red-50"
                style={{ fontSize: "17px", fontWeight: 700 }}
              >
                {t("res.crisisVandrevala")}
              </a>
              <a
                href="tel:988"
                className="block w-full px-6 py-2 bg-white/90 text-red-700 rounded-[16px] text-center text-sm font-semibold hover:bg-white"
              >
                {t("res.crisisUS988")}
              </a>
              <button
                type="button"
                onClick={() =>
                  window.open("https://findahelpline.com/", "_blank", "noopener,noreferrer")
                }
                className="block w-full px-6 py-2 bg-white/15 text-white rounded-[16px] text-center text-sm font-semibold hover:bg-white/25"
              >
                {t("res.crisisHelpline")}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/45 flex items-end md:items-center justify-center p-0 md:p-6 z-50"
          onClick={closeDetail}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full md:max-w-lg md:rounded-[24px] rounded-t-[24px] max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-violet-600 uppercase tracking-wide">{selected.category}</p>
                <h2 className="text-xl font-bold text-gray-900 pr-8">{selected.title}</h2>
              </div>
              <button type="button" onClick={closeDetail} className="p-2 rounded-full hover:bg-slate-100 text-slate-600" aria-label={t("res.closeAria")}>
                <X size={22} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-gray-600 text-sm leading-relaxed">{selected.summary}</p>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{t("res.open")}</p>
                <ul className="space-y-2">
                  {(selected.links || []).map((link, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => followLink(link.url)}
                        className="w-full text-left flex items-center gap-2 p-3 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50/50 transition-colors"
                      >
                        <ExternalLink size={16} className="text-violet-600 flex-shrink-0" />
                        <span className="text-sm font-semibold text-gray-800">{link.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
