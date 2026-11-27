import {
  LayoutDashboard,
  Users,
  CalendarDays,
  MapPinned,
  ClipboardList,
  BarChart3,
  Settings,
  UserRound,
} from "lucide-react";
import { useI18n } from "../i18n";

const menuItems = [
  { title: "لوحة التحكم", icon: LayoutDashboard },
  { title: "إدارة الدكاترة", icon: Users },
  { title: "مواعيد العمل", icon: CalendarDays },
  { title: "توزيع المناطق", icon: MapPinned },
  { title: "تخطيط الزيارات", icon: ClipboardList },
  { title: "البلان الشهري", icon: CalendarDays },
  { title: "تحليل الأداء", icon: BarChart3 },
  { title: "الإعدادات", icon: Settings },
];

function Sidebar({ activePage, setActivePage, sidebarOpen }) {
  const { t } = useI18n();
  const menuLabels = {
    "لوحة التحكم": t("dashboard"),
    "إدارة الدكاترة": t("doctors"),
    "مواعيد العمل": t("workSchedule"),
    "توزيع المناطق": t("areas"),
    "تخطيط الزيارات": t("planning"),
    "البلان الشهري": t("monthly"),
    "تحليل الأداء": t("performance"),
    "الإعدادات": t("settings"),
  };

  return (
    <aside className={`sidebar ${sidebarOpen ? "" : "closed"}`}>
      <div className="brand">
        <img
          className="brand-logo"
          src={`${import.meta.env.BASE_URL}nerhadou-logo.png`}
          alt="Nerhadou International"
        />
        <div className="brand-name">Visit Planner</div>
        <div className="brand-disclaimer">{t("disclaimer")}</div>
      </div>

      <div className="menu-title">{t("menuTitle")}</div>

      <nav>
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.title}
              className={`menu-item ${
                activePage === item.title ? "active" : ""
              }`}
              onClick={() => setActivePage(item.title)}
            >
              <Icon size={19} />
              <span>{menuLabels[item.title]}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-avatar">
          <UserRound size={20} />
        </div>

        <div>
          <strong>{t("systemManager")}</strong>
          <span>Medical Representative</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;