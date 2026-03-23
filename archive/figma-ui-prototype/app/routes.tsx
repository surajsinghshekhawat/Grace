import { createBrowserRouter } from "react-router";
import { Welcome } from "./pages/Welcome";
import { Auth } from "./pages/Auth";
import { InitialSurvey } from "./pages/InitialSurvey";
import { CaregiverHome } from "./pages/CaregiverHome";
import { CaregiverInsights } from "./pages/CaregiverInsights";
import { Alerts } from "./pages/Alerts";
import { LinkElder } from "./pages/LinkElder";
import { ElderDetail } from "./pages/ElderDetail";
import { ElderHome } from "./pages/ElderHome";
import { DailyCheckIn } from "./pages/DailyCheckIn";
import { WeeklyAssessment } from "./pages/WeeklyAssessment";
import { Results } from "./pages/Results";
import { ShareWithCaregiver } from "./pages/ShareWithCaregiver";
import { Resources } from "./pages/Resources";
import { Community } from "./pages/Community";
import { Health } from "./pages/Health";
import { Settings } from "./pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Welcome,
  },
  {
    path: "/auth",
    Component: Auth,
  },
  {
    path: "/survey",
    Component: InitialSurvey,
  },
  {
    path: "/caregiver",
    children: [
      {
        index: true,
        Component: CaregiverHome,
      },
      {
        path: "insights",
        Component: CaregiverInsights,
      },
      {
        path: "alerts",
        Component: Alerts,
      },
      {
        path: "link-elder",
        Component: LinkElder,
      },
      {
        path: "elder/:id",
        Component: ElderDetail,
      },
      {
        path: "elder/:id/check-in",
        Component: DailyCheckIn,
      },
      {
        path: "elder/:id/assessment",
        Component: WeeklyAssessment,
      },
    ],
  },
  {
    path: "/elder",
    children: [
      {
        index: true,
        Component: ElderHome,
      },
      {
        path: "check-in",
        Component: DailyCheckIn,
      },
      {
        path: "assessment",
        Component: WeeklyAssessment,
      },
      {
        path: "results",
        Component: Results,
      },
      {
        path: "community",
        Component: Community,
      },
      {
        path: "health",
        Component: Health,
      },
      {
        path: "share",
        Component: ShareWithCaregiver,
      },
    ],
  },
  {
    path: "/resources",
    Component: Resources,
  },
  {
    path: "/settings",
    Component: Settings,
  },
]);