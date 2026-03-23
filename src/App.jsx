import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import useStore from "./store";
import { apiFetch } from "./lib/api";
import { useI18n } from "./contexts/LanguageContext.jsx";
import { GraceErrorBoundary } from "./components/GraceErrorBoundary.jsx";

const Welcome = lazy(() => import("./pages/Welcome"));
const Auth = lazy(() => import("./pages/Auth"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Linking = lazy(() => import("./pages/Linking"));
const DailyCheckIn = lazy(() => import("./pages/DailyCheckIn"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Assessment = lazy(() => import("./pages/Assessment"));
const ElderAssessmentOnboarding = lazy(() => import("./pages/ElderAssessmentOnboarding"));
const Summary = lazy(() => import("./pages/Summary"));
const AppShell = lazy(() => import("./components/AppShell"));
const ElderProfile = lazy(() => import("./pages/ElderProfile"));
const ElderInsights = lazy(() => import("./pages/ElderInsights"));
const ElderProgress = lazy(() => import("./pages/ElderProgress"));
const ElderResources = lazy(() => import("./pages/ElderResources"));
const ElderCommunity = lazy(() => import("./pages/ElderCommunity"));
const ElderHealth = lazy(() => import("./pages/ElderHealth"));
const CaregiverHome = lazy(() => import("./pages/CaregiverHome"));
const CaregiverAlerts = lazy(() => import("./pages/CaregiverAlerts"));
const CaregiverCheckIn = lazy(() => import("./pages/CaregiverCheckIn"));
const CaregiverMedications = lazy(() => import("./pages/CaregiverMedications"));
const CaregiverElderDetail = lazy(() => import("./pages/CaregiverElderDetail"));
const CaregiverAssessment = lazy(() => import("./pages/CaregiverAssessment"));
const CaregiverSubmit = lazy(() => import("./pages/CaregiverSubmit"));
const CaregiverInsights = lazy(() => import("./pages/CaregiverInsights"));
const CaregiverProfile = lazy(() => import("./pages/CaregiverProfile"));
const ModeratorReports = lazy(() => import("./pages/ModeratorReports"));

function RouteFallback() {
  const { t } = useI18n();
  return (
    <div
      className="min-h-[50vh] flex flex-col items-center justify-center gap-3 bg-[#FAFAFA] px-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="h-9 w-9 rounded-full border-2 border-violet-200 border-t-violet-600 animate-spin" aria-hidden />
      <p className="text-slate-600 text-sm font-medium">{t("mod.loading")}</p>
    </div>
  );
}

function PersistGate({ children }) {
  const { t } = useI18n();
  const [hydrated, setHydrated] = useState(() => useStore.persist.hasHydrated());

  useEffect(() => {
    if (useStore.persist.hasHydrated()) {
      setHydrated(true);
      return undefined;
    }
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated) return undefined;
    let cancelled = false;
    const { authUser, setAuthUser, logout } = useStore.getState();
    apiFetch("/api/me")
      .then((me) => {
        if (!cancelled) setAuthUser(me);
      })
      .catch(() => {
        if (!cancelled && authUser) logout();
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  if (!hydrated) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#FAFAFA] px-6"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="h-10 w-10 rounded-full border-2 border-violet-200 border-t-violet-600 animate-spin" aria-hidden />
        <p className="text-slate-600 text-base font-medium">{t("app.hydratingTitle")}</p>
        <p className="text-slate-500 text-sm text-center max-w-xs">{t("app.hydratingSub")}</p>
      </div>
    );
  }

  return children;
}

function App() {
  const authUser = useStore((s) => s.authUser);

  return (
    <PersistGate>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route
            path="/"
            element={
              <GraceErrorBoundary section="welcome" homeTo="/">
                <Welcome />
              </GraceErrorBoundary>
            }
          />
          <Route
            path="/auth"
            element={
              <GraceErrorBoundary section="auth" homeTo="/">
                <Auth />
              </GraceErrorBoundary>
            }
          />
          <Route
            path="/auth/forgot"
            element={
              <GraceErrorBoundary section="auth" homeTo="/">
                <ForgotPassword />
              </GraceErrorBoundary>
            }
          />
          <Route
            path="/auth/reset"
            element={
              <GraceErrorBoundary section="auth" homeTo="/">
                <ResetPassword />
              </GraceErrorBoundary>
            }
          />

          <Route element={<AppShell />}>
            {/* Elder routes */}
            <Route path="/elder" element={<Dashboard />} />
            <Route path="/elder/checkin" element={<DailyCheckIn />} />
            <Route path="/elder/assessment/onboarding" element={<ElderAssessmentOnboarding />} />
            <Route path="/elder/assessment" element={<Assessment />} />
            <Route path="/elder/summary" element={<Summary />} />
            <Route path="/elder/share" element={<Linking />} />
            <Route path="/elder/insights" element={<ElderInsights />} />
            <Route path="/elder/progress" element={<ElderProgress />} />
            <Route path="/elder/resources" element={<ElderResources />} />
            <Route path="/elder/community" element={<ElderCommunity />} />
            <Route path="/elder/health" element={<ElderHealth />} />
            <Route path="/elder/profile" element={<ElderProfile />} />

            {/* Caregiver routes */}
            <Route path="/caregiver" element={<CaregiverHome />} />
            <Route path="/caregiver/resources" element={<ElderResources />} />
            <Route path="/caregiver/medications" element={<CaregiverMedications />} />
            <Route path="/caregiver/alerts" element={<CaregiverAlerts />} />
            <Route path="/caregiver/elders/:elderUserId" element={<CaregiverElderDetail />} />
            <Route path="/caregiver/elders/:elderUserId/checkin" element={<CaregiverCheckIn />} />
            <Route path="/caregiver/elders/:elderUserId/assessment" element={<CaregiverAssessment />} />
            <Route path="/caregiver/elders/:elderUserId/submit" element={<CaregiverSubmit />} />
            <Route path="/caregiver/link" element={<Linking />} />
            <Route path="/caregiver/insights" element={<CaregiverInsights />} />
            <Route path="/caregiver/profile" element={<CaregiverProfile />} />

            <Route path="/moderator/reports" element={<ModeratorReports />} />
          </Route>

          {/* Default redirect when logged-in */}
          <Route
            path="/home"
            element={
              authUser?.role === "caregiver" ? (
                <Navigate to="/caregiver" replace />
              ) : authUser?.role === "elder" ? (
                <Navigate to="/elder" replace />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </PersistGate>
  );
}

export default App;
