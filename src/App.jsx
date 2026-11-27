import { useI18n } from "./i18n";
import { useState, useEffect } from "react";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import { usePersistentState } from "./utils/usePersistentState";
import { DEFAULT_ZONE_GROUPS } from "./utils/planningEngine";

import Settings from "./pages/Settings";
import Dashboard from "./pages/Dashboard";
import Doctors from "./pages/Doctors";
import VisitPlanning from "./pages/VisitPlanning";
import WorkSchedule from "./pages/WorkSchedule";
import Areas from "./pages/Areas";
import MonthlyPlan from "./pages/MonthlyPlan";
import Performance from "./pages/Performance";

import "./index.css";

const FIXED_PLAN_START_DATE = "2026-11-17";
const FIXED_PLAN_END_DATE = "2026-12-30";
const FIXED_CALL_RATE = "12.5";

function App() {
  const { language } = useI18n();
  const [activePage, setActivePage] = useState("لوحة التحكم");
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);

  // Temporary States
  const [holidayDate, setHolidayDate] = useState("");
  const [meetingDate, setMeetingDate] = useState("");

  // Call Rate
  const [theme, setTheme] = usePersistentState(
    "visit-planner-theme",
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () =>
    setTheme((current) => (current === "dark" ? "light" : "dark"));

  const [callRate, setCallRate] = usePersistentState(
    "visit-planner-call-rate",
    FIXED_CALL_RATE
  );

  // Zone Groups (near areas allowed on the same day)
  const [zoneGroups, setZoneGroups] = usePersistentState(
    "visit-planner-zone-groups",
    DEFAULT_ZONE_GROUPS
  );

  // Working Days
  const [workingDays, setWorkingDays] = usePersistentState(
    "visit-planner-working-days",
    [
      "السبت",
      "الأحد",
      "الإثنين",
      "الثلاثاء",
      "الأربعاء",
    ]
  );

  // Holidays
  const [holidays, setHolidays] = usePersistentState(
    "visit-planner-holidays",
    []
  );

  // Meetings
  const [meetings, setMeetings] = usePersistentState(
    "visit-planner-meetings",
    []
  );

  // Plan Period
  const [planStartDate, setPlanStartDate] = usePersistentState(
    "visit-planner-plan-start",
    FIXED_PLAN_START_DATE
  );

  const [planEndDate, setPlanEndDate] = usePersistentState(
    "visit-planner-plan-end",
    FIXED_PLAN_END_DATE
  );

  // Validate Call Rate
  const handleCallRateChange = (value) => {
    if (value === "") {
      setCallRate("");
      return;
    }

    const number = Number(value);

    if (
      Number.isFinite(number) &&
      number > 0 &&
      number <= 50
    ) {
      setCallRate(value);
    }
  };

  // Toggle Working Day
  const toggleWorkingDay = (day) => {
    setWorkingDays((previous) =>
      previous.includes(day)
        ? previous.filter((item) => item !== day)
        : [...previous, day]
    );
  };

  // Add Holiday
  const addHoliday = () => {
    if (!holidayDate) return;

    if (holidays.includes(holidayDate)) {
      alert(language === "ar" ? "التاريخ ده مسجل بالفعل في الإجازات" : "This date is already registered as a holiday");
      return;
    }

    setHolidays((previous) =>
      [...previous, holidayDate].sort()
    );

    setHolidayDate("");
  };

  // Remove Holiday
  const removeHoliday = (date) => {
    setHolidays((previous) =>
      previous.filter((item) => item !== date)
    );
  };

  // Add Meeting
  const addMeeting = () => {
    if (!meetingDate) return;

    if (meetings.includes(meetingDate)) {
      alert(language === "ar" ? "التاريخ ده مسجل بالفعل في الاجتماعات" : "This date is already registered as a meeting");
      return;
    }

    setMeetings((previous) =>
      [...previous, meetingDate].sort()
    );

    setMeetingDate("");
  };

  // Remove Meeting
  const removeMeeting = (date) => {
    setMeetings((previous) =>
      previous.filter((item) => item !== date)
    );
  };

  // Format Date
  const formatDate = (date) => {
    return new Date(date + "T00:00:00").toLocaleDateString(
      "ar-EG",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  };

  // Calculate Available Working Days
  const calculatePlan = () => {
    if (!planStartDate || !planEndDate) {
      return {
        workingDaysCount: 0,
        totalVisits: 0,
        valid: false,
      };
    }

    if (planStartDate > planEndDate) {
      return {
        workingDaysCount: 0,
        totalVisits: 0,
        valid: false,
      };
    }

    const dayNames = [
      "الأحد",
      "الإثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
      "السبت",
    ];

    let count = 0;

    const currentDate = new Date(
      `${planStartDate}T00:00:00`
    );

    const lastDate = new Date(
      `${planEndDate}T00:00:00`
    );

    while (currentDate <= lastDate) {
      const dateString = [
        currentDate.getFullYear(),
        String(currentDate.getMonth() + 1).padStart(2, "0"),
        String(currentDate.getDate()).padStart(2, "0"),
      ].join("-");

      const dayName = dayNames[currentDate.getDay()];

      const isWorkingDay = workingDays.includes(dayName);
      const isHoliday = holidays.includes(dateString);
      const isMeeting = meetings.includes(dateString);

      if (isWorkingDay && !isHoliday && !isMeeting) {
        count++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const rate = Number(callRate);
    const total = Number.isFinite(rate) ? count * rate : 0;

    return {
      workingDaysCount: count,
      totalVisits: total,
      valid: true,
    };
  };

  const planCalculation = calculatePlan();

  const handleNavigate = (page) => {
    setActivePage(page);
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  return (
    <div className="app-container">

      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        setActivePage={handleNavigate}
        sidebarOpen={sidebarOpen}
      />

      {/* Mobile backdrop */}
      {sidebarOpen ? (
        <button
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        />
      ) : null}

      {/* Main Content */}
      <main className="main-content">

        {/* Topbar */}
        <Topbar
          activePage={activePage}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        {/* Page Content */}
        <section className="page-content">

          {/* Doctors Page */}
          {activePage === "إدارة الدكاترة" ? (
            <Doctors />

          ) : activePage === "مواعيد العمل" ? (
            <WorkSchedule setActivePage={setActivePage} />

          ) : activePage === "توزيع المناطق" ? (
            <Areas />

          ) : activePage === "البلان الشهري" ? (
            <MonthlyPlan />

          ) : activePage === "تحليل الأداء" ? (
            <Performance />

          ) : activePage === "تخطيط الزيارات" ? (

            <VisitPlanning
              callRate={callRate}
              zoneGroups={zoneGroups}
              workingDays={workingDays}
              holidays={holidays}
              meetings={meetings}
              planStartDate={planStartDate}
              planEndDate={planEndDate}
            />

          ) : activePage === "الإعدادات" ? (

            <Settings
              callRate={callRate}
              handleCallRateChange={handleCallRateChange}
              zoneGroups={zoneGroups}
              setZoneGroups={setZoneGroups}
              workingDays={workingDays}
              toggleWorkingDay={toggleWorkingDay}
              holidays={holidays}
              holidayDate={holidayDate}
              setHolidayDate={setHolidayDate}
              addHoliday={addHoliday}
              removeHoliday={removeHoliday}
              meetings={meetings}
              meetingDate={meetingDate}
              setMeetingDate={setMeetingDate}
              addMeeting={addMeeting}
              removeMeeting={removeMeeting}
              formatDate={formatDate}
              planStartDate={planStartDate}
              setPlanStartDate={setPlanStartDate}
              planEndDate={planEndDate}
              setPlanEndDate={setPlanEndDate}
              planCalculation={planCalculation}
            />

          ) : (
            <Dashboard
              callRate={callRate}
              setActivePage={setActivePage}
            />
          )}

        </section>
      </main>
    </div>
  );
}

export default App;
