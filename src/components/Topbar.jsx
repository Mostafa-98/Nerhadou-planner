import {
  Menu,
  Bell,
  Search,
  UserRound,
  Languages,
  Moon,
  Sun,
} from "lucide-react";
import { useI18n } from "../i18n";

function Topbar({ activePage, sidebarOpen, setSidebarOpen, theme, toggleTheme }) {
  const { language, toggleLanguage, t } = useI18n();
  const pageTitles = {
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
    <header className="topbar">
      <div className="topbar-right">
        <button
          className="icon-button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu size={21} />
        </button>

        <div>
          <h3>{pageTitles[activePage] || activePage}</h3>
          <p>{t("topbarSubtitle")}</p>
        </div>
      </div>

      <div className="topbar-left">
        <button
          className="icon-button theme-toggle"
          type="button"
          onClick={toggleTheme}
          title={theme === "dark" ? t("switchToLight") : t("switchToDark")}
          aria-label={theme === "dark" ? t("switchToLight") : t("switchToDark")}
        >
          {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        <button
          className="language-button"
          type="button"
          onClick={toggleLanguage}
          title={language === "ar" ? t("switchToEnglish") : t("switchToArabic")}
          aria-label={language === "ar" ? t("switchToEnglish") : t("switchToArabic")}
        >
          <Languages size={18} />
          <span>{language === "ar" ? "EN" : "عربي"}</span>
        </button>
        <button className="icon-button">
          <Search size={20} />
        </button>

        <button className="icon-button">
          <Bell size={20} />
        </button>

        <div className="profile-circle">
          <UserRound size={20} />
        </div>
      </div>
    </header>
  );
}

export default Topbar;