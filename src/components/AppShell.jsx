import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, HeartHandshake, Home, AlertTriangle, Pill, MessageCircle, User, BookOpen } from "lucide-react";
import useStore from "../store";
import { apiFetch } from "../lib/api";
import { GraceErrorBoundary } from "./GraceErrorBoundary.jsx";
import { useI18n } from "../contexts/LanguageContext";

const tabsByRole = {
  elder: [
    { to: "/elder", labelKey: "nav.tabHome", icon: Home },
    { to: "/elder/progress", labelKey: "nav.tabResults", icon: BarChart3 },
    { to: "/elder/community", labelKey: "nav.tabCommunity", icon: MessageCircle },
    { to: "/elder/health", labelKey: "nav.tabHealth", icon: Pill },
    { to: "/elder/profile", labelKey: "nav.tabProfile", icon: User },
  ],
  caregiver: [
    { to: "/caregiver", labelKey: "nav.tabHome", icon: Home },
    { to: "/caregiver/resources", labelKey: "nav.tabResources", icon: BookOpen },
    { to: "/caregiver/medications", labelKey: "nav.tabHealth", icon: Pill },
    { to: "/caregiver/insights", labelKey: "nav.tabInsights", icon: HeartHandshake },
    { to: "/caregiver/alerts", labelKey: "nav.tabAlerts", icon: AlertTriangle },
    { to: "/caregiver/profile", labelKey: "nav.tabProfile", icon: User },
  ],
};

const AppShell = () => {
  const { t } = useI18n();
  const authUser = useStore((s) => s.authUser);
  const authUserPresent = useStore((s) => !!s.authUser);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const root = document.documentElement;
    const apply = async () => {
      if (!authUserPresent) {
        root.classList.remove("grace-large-text", "grace-high-contrast");
        return;
      }
      try {
        const s = await apiFetch("/api/me/settings");
        root.classList.toggle("grace-large-text", !!s.large_text);
        root.classList.toggle("grace-high-contrast", !!s.high_contrast);
      } catch {
        root.classList.remove("grace-large-text", "grace-high-contrast");
      }
    };
    apply();
    const onUpd = () => apply();
    window.addEventListener("grace-settings-updated", onUpd);
    return () => window.removeEventListener("grace-settings-updated", onUpd);
  }, [authUserPresent, location.pathname]);

  const role = authUser?.role;
  const tabs = role ? tabsByRole[role] : [];
  const setAuthUser = useStore((s) => s.setAuthUser);
  const moderatorPath = location.pathname.startsWith("/moderator");

  useEffect(() => {
    if (!authUserPresent) return;
    apiFetch("/api/me")
      .then((me) => setAuthUser(me))
      .catch(() => {});
  }, [authUserPresent, setAuthUser]);

  // Simple route guard: if not logged in, bounce protected routes back to welcome.
  if (
    !role &&
    (location.pathname.startsWith("/elder") ||
      location.pathname.startsWith("/caregiver") ||
      location.pathname.startsWith("/moderator"))
  ) {
    navigate("/");
    return null;
  }

  // If logged in but path doesn't match role, redirect to their home tab (moderator routes exempt).
  if (!moderatorPath && role === "elder" && location.pathname.startsWith("/caregiver")) {
    navigate("/elder");
    return null;
  }
  if (!moderatorPath && role === "caregiver" && location.pathname.startsWith("/elder")) {
    navigate("/caregiver");
    return null;
  }

  const errorHome = role === "caregiver" ? "/caregiver" : "/elder";
  const navLabel =
    role === "caregiver" ? t("a11y.navCaregiver") : role === "elder" ? t("a11y.navElder") : t("a11y.navPrimary");

  return (
    <div className="grace-screen">
      <a href="#main-content" className="grace-skip-link">
        {t("a11y.skipToMain")}
      </a>
      <div className="grace-container">
        <main id="main-content" tabIndex={-1} className="outline-none min-h-[50vh]">
          <GraceErrorBoundary section="main" homeTo={errorHome}>
            <Outlet />
          </GraceErrorBoundary>
        </main>
      </div>

      {tabs.length > 0 && (
        <nav
          className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-gray-100 safe-area-bottom"
          aria-label={navLabel}
        >
          <div className="mx-auto max-w-3xl px-4">
            <div
              className="grid gap-1 py-2"
              style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
            >
              {tabs.map((tab) => {
                const active =
                  location.pathname === tab.to ||
                  (tab.to !== "/" && location.pathname.startsWith(tab.to + "/"));
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.to}
                    type="button"
                    onClick={() => navigate(tab.to)}
                    aria-current={active ? "page" : undefined}
                    className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2 transition ${
                      active ? "text-emerald-700 font-medium" : "text-gray-500"
                    }`}
                  >
                    <Icon className="w-5 h-5" aria-hidden />
                    <span className="text-xs font-semibold">{t(tab.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
};

export default AppShell;

