import { Link, useLocation } from "react-router";
import { Home, Activity, Book, Settings, Users, Heart, Bell } from "lucide-react";
import { motion } from "motion/react";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  tabName?: string;
}

interface BottomNavProps {
  activeTab?: string;
  userType?: "elder" | "caregiver";
  type?: "elder" | "caregiver"; // backwards compatibility
}

export function BottomNav({ activeTab, userType, type }: BottomNavProps) {
  const location = useLocation();
  const navType = userType || type || "elder";

  const elderNavItems: NavItem[] = [
    { icon: <Home size={24} />, label: "Home", path: "/elder", tabName: "home" },
    { icon: <Activity size={24} />, label: "Results", path: "/elder/results", tabName: "results" },
    { icon: <Users size={24} />, label: "Community", path: "/elder/community", tabName: "community" },
    { icon: <Heart size={24} />, label: "Health", path: "/elder/health", tabName: "health" },
    { icon: <Settings size={24} />, label: "Profile", path: "/settings", tabName: "profile" },
  ];

  const caregiverNavItems: NavItem[] = [
    { icon: <Home size={24} />, label: "Home", path: "/caregiver", tabName: "home" },
    { icon: <Activity size={24} />, label: "Insights", path: "/caregiver/insights", tabName: "insights" },
    { icon: <Bell size={24} />, label: "Alerts", path: "/caregiver/alerts", tabName: "alerts" },
    { icon: <Settings size={24} />, label: "Profile", path: "/settings", tabName: "profile" },
  ];

  const navItems = navType === "elder" ? elderNavItems : caregiverNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex justify-around items-center px-2 py-2">
          {navItems.map((item) => {
            const isActive = activeTab ? item.tabName === activeTab : location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center min-w-[60px] py-2 px-3 relative"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center"
                >
                  <div
                    className={`transition-colors ${
                      isActive ? "text-[#6EE7B7]" : "text-gray-500"
                    }`}
                  >
                    {item.icon}
                  </div>
                  <span
                    className={`mt-1 transition-colors ${
                      isActive
                        ? "text-[#6EE7B7] font-medium"
                        : "text-gray-500"
                    }`}
                    style={{ fontSize: "11px" }}
                  >
                    {item.label}
                  </span>
                </motion.div>
                {isActive && (
                  <motion.div
                    layoutId={`nav-indicator-${navType}`}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#6EE7B7] rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}