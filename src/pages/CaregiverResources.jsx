import { useState, useMemo } from "react";
import { Heart, Monitor, Users, Activity } from "lucide-react";
import { useI18n } from "../contexts/LanguageContext";

const TOPICS = [
  { id: "mental", icon: Heart },
  { id: "social", icon: Users },
  { id: "exercise", icon: Activity },
  { id: "learn", icon: Monitor },
];

const RESOURCES = [
  { id: "mindfulness", topic: "mental" },
  { id: "staying_social", topic: "social" },
  { id: "movement", topic: "exercise" },
  { id: "sleep", topic: "mental" },
  { id: "learn_results", topic: "learn" },
];

const CaregiverResources = () => {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(null);

  const filtered = useMemo(() => {
    let list = RESOURCES;
    if (selectedTopic) list = list.filter((r) => r.topic === selectedTopic);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => {
        const title = t(`cgRes.item_${r.id}_title`).toLowerCase();
        const summary = t(`cgRes.item_${r.id}_summary`).toLowerCase();
        return title.includes(q) || summary.includes(q);
      });
    }
    return list;
  }, [search, selectedTopic, t]);

  return (
    <div className="space-y-4">
      <div className="grace-card grace-card-pad">
        <h1 className="grace-title">{t("cgRes.title")}</h1>
        <p className="grace-subtitle mt-1">{t("cgRes.sub")}</p>
      </div>

      <div className="grace-card grace-card-pad">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("cgRes.searchPh")}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>

      <div className="grace-card grace-card-pad">
        <h2 className="font-semibold text-gray-900 mb-3">{t("cgRes.popularTopics")}</h2>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((topic) => {
            const Icon = topic.icon;
            const active = selectedTopic === topic.id;
            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => setSelectedTopic(active ? null : topic.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                  active ? "bg-teal-500 text-white" : "bg-white/80 border border-gray-200 text-gray-700 hover:bg-teal-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t(`cgRes.topic_${topic.id}`)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="grace-card grace-card-pad text-gray-600">{t("cgRes.noMatch")}</div>
        ) : (
          filtered.map((r) => (
            <div
              key={r.id}
              className="grace-card grace-card-pad border-l-4 border-teal-200 hover:border-teal-400 transition"
            >
              <h3 className="font-semibold text-gray-900">{t(`cgRes.item_${r.id}_title`)}</h3>
              <p className="text-sm text-gray-600 mt-1">{t(`cgRes.item_${r.id}_summary`)}</p>
            </div>
          ))
        )}
      </div>

      <div className="grace-card grace-card-pad bg-teal-50 border-teal-100 space-y-2">
        <h3 className="font-semibold text-gray-900">{t("cgRes.crisisTitle")}</h3>
        <p className="text-sm text-gray-700">{t("cgRes.crisisBody")}</p>
        <p className="text-sm text-gray-800 font-medium">{t("cgRes.crisisIndia")}</p>
        <div className="flex flex-wrap gap-2">
          <a href="tel:9152987821" className="text-sm font-semibold text-teal-800 underline">
            iCall
          </a>
          <span className="text-gray-400">·</span>
          <a href="tel:18602662345" className="text-sm font-semibold text-teal-800 underline">
            Vandrevala
          </a>
        </div>
        <p className="text-sm text-gray-600">{t("cgRes.crisisUS")}</p>
        <a
          href="https://findahelpline.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-teal-800 underline inline-block"
        >
          {t("res.crisisHelpline")}
        </a>
      </div>
    </div>
  );
};

export default CaregiverResources;
