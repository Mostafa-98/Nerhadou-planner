/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";

const translations = {
  ar: {
    dashboard: "لوحة التحكم",
    doctors: "إدارة الدكاترة",
    workSchedule: "مواعيد العمل",
    areas: "توزيع المناطق",
    planning: "تخطيط الزيارات",
    monthly: "البلان الشهري",
    performance: "تحليل الأداء",
    settings: "الإعدادات",
    menuTitle: "القائمة الرئيسية",
    topbarSubtitle: "مرحباً بك في نظام تخطيط الزيارات الطبية",
    arabic: "العربية",
    english: "English",
    language: "اللغة",
    switchToEnglish: "التبديل إلى الإنجليزية",
    switchToArabic: "التبديل إلى العربية",
    switchToDark: "الوضع الداكن",
    switchToLight: "الوضع الفاتح",
    dashboardTitle: "لوحة التحكم",
    dashboardSubtitle: "تابع بيانات الدكاترة وخطة الزيارات الشهرية من مكان واحد.",
    systemStatus: "حالة النظام",
    readyPlan: "كل إعدادات الخطة جاهزة",
    planNeedsSetup: "خطة العمل تحتاج إلى بعض الإعدادات",
    continueSetup: "متابعة الإعداد",
    openPlanning: "الانتقال لتخطيط الزيارات",
    doctorsPageTitle: "إدارة الدكاترة",
    doctorsPageSubtitle: "استيراد وتنظيم بيانات الدكاترة وتصفية قاعدة البيانات",
    importExcel: "استيراد Excel",
  },
  en: {
    dashboard: "Dashboard",
    doctors: "Doctors",
    workSchedule: "Work Schedule",
    areas: "Area Distribution",
    planning: "Visit Planning",
    monthly: "Monthly Plan",
    performance: "Performance Analysis",
    settings: "Settings",
    menuTitle: "Main Menu",
    topbarSubtitle: "Welcome to the Medical Visit Planning System",
    arabic: "العربية",
    english: "English",
    language: "Language",
    switchToEnglish: "Switch to English",
    switchToArabic: "Switch to Arabic",
    switchToDark: "Dark mode",
    switchToLight: "Light mode",
    dashboardTitle: "Dashboard",
    dashboardSubtitle: "Track doctor data and the monthly visit plan in one place.",
    systemStatus: "System Status",
    readyPlan: "All plan settings are ready",
    planNeedsSetup: "The work plan needs some setup",
    continueSetup: "Continue Setup",
    openPlanning: "Open Visit Planning",
    doctorsPageTitle: "Doctors",
    doctorsPageSubtitle: "Import and organize doctor data and filter the database",
    importExcel: "Import Excel",
  },
};

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem("visit-planner-language") === "en"
        ? "en"
        : "ar";
    } catch {
      return "ar";
    }
  });

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
    try {
      localStorage.setItem("visit-planner-language", language);
    } catch {
      // Language remains available for the current session.
    }
  }, [language]);

  const toggleLanguage = () =>
    setLanguage((current) => (current === "ar" ? "en" : "ar"));

  const t = (key) => translations[language][key] || key;

  return (
    <I18nContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return context;
}
