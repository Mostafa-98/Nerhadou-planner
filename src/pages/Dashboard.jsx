import {
  CalendarDays,
  Users,
  ClipboardList,
  Target,
  Map,
  ArrowLeft,
  CalendarCheck,
  CircleAlert,
} from "lucide-react";
import { usePersistentState } from "../utils/usePersistentState";
import { useI18n } from "../i18n";

function Dashboard({ callRate, setActivePage }) {
  const { language, t } = useI18n();
  const ar = language === "ar";
  const [doctors] = usePersistentState("visit-planner-doctors", []);
  const [workingDays] = usePersistentState(
    "visit-planner-working-days",
    ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء"]
  );
  const [holidays] = usePersistentState("visit-planner-holidays", []);
  const [meetings] = usePersistentState("visit-planner-meetings", []);
  const [planStartDate] = usePersistentState(
    "visit-planner-plan-start",
    "2026-11-17"
  );
  const [planEndDate] = usePersistentState(
    "visit-planner-plan-end",
    "2026-12-30"
  );

  const totalVisits = doctors.reduce(
    (sum, doctor) => sum + (Number(doctor.currentFrequency) || 0),
    0
  );

  const areaCount = new Set(
    doctors.map((doctor) => String(doctor.brick || "").trim()).filter(Boolean)
  ).size;

  const setupSteps = [
    {
      label: ar ? "استيراد الدكاترة" : "Import Doctors",
      complete: doctors.length > 0,
      page: "إدارة الدكاترة",
    },
    {
      label: ar ? "تحديد أيام العمل" : "Set Workdays",
      complete: workingDays.length > 0,
      page: "الإعدادات",
    },
    {
      label: ar ? "تحديد فترة البلان" : "Set Plan Period",
      complete: Boolean(planStartDate && planEndDate),
      page: "الإعدادات",
    },
    {
      label: ar ? "تحديد Call Rate" : "Set Call Rate",
      complete: Boolean(Number(callRate) > 0),
      page: "الإعدادات",
    },
  ];

  const completedSteps = setupSteps.filter((step) => step.complete).length;
  const setupProgress = Math.round(
    (completedSteps / setupSteps.length) * 100
  );

  const formatDate = (date) =>
    new Date(`${date}T12:00:00`).toLocaleDateString(ar ? "ar-EG" : "en-GB", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getUpcomingDate = (dates) =>
    [...dates]
      .sort()
      .find((date) => new Date(`${date}T12:00:00`) >= today);

  const upcomingHoliday = getUpcomingDate(holidays);
  const upcomingMeeting = getUpcomingDate(meetings);
  const canGeneratePlan =
    doctors.length > 0 &&
    workingDays.length > 0 &&
    Boolean(planStartDate && planEndDate);

  return (
    <>
      <div className="welcome-section">
        <div>
          <h1>{t("dashboardTitle")}</h1>
          <p>{t("dashboardSubtitle")}</p>
        </div>

        <div className="date-label">
          <CalendarDays size={17} />
          <span>{today.toLocaleDateString(ar ? "ar-EG" : "en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}</span>
        </div>
      </div>

      <div className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <span className="dashboard-eyebrow">{t("systemStatus")}</span>
          <h2>
            {setupProgress === 100
              ? t("readyPlan")
              : t("planNeedsSetup")}
          </h2>
          <p>
            {ar ? `أكملت ${completedSteps} من ${setupSteps.length} خطوات أساسية قبل إنشاء البلان الجديد.` : `You completed ${completedSteps} of ${setupSteps.length} basic steps before creating the new plan.`}
          </p>

          <button
            className="primary-button"
            onClick={() =>
              setActivePage(
                canGeneratePlan ? "تخطيط الزيارات" : setupSteps.find(
                  (step) => !step.complete
                )?.page || "الإعدادات"
              )
            }
          >
            {canGeneratePlan ? t("openPlanning") : t("continueSetup")}
            <ArrowLeft size={18} />
          </button>
        </div>

        <div
          className="dashboard-progress"
          style={{
            "--progress": `${setupProgress * 3.6}deg`,
          }}
          aria-label={ar ? `نسبة اكتمال الإعدادات ${setupProgress}%` : `Setup progress ${setupProgress}%`}
        >
          <div className="dashboard-progress-inner">
            <strong>{setupProgress}%</strong>
            <span>{ar ? "جاهزية الخطة" : "Plan readiness"}</span>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Users size={23} />
          </div>

          <span>{ar ? "إجمالي الدكاترة" : "Total Doctors"}</span>
          <h2>{doctors.length}</h2>
          <small>{ar ? "عدد الدكاترة المسجلين" : "Registered doctors"}</small>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <ClipboardList size={23} />
          </div>

          <span>{ar ? "إجمالي الزيارات" : "Total Visits"}</span>
          <h2>{totalVisits}</h2>
          <small>{ar ? "الزيارات المطلوبة في الخطة" : "Visits required in the plan"}</small>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <Target size={23} />
          </div>

          <span>{ar ? "المستهدف اليومي" : "Call Rate Target"}</span>
          <h2>{callRate || "—"}</h2>
          <small>{ar ? "معدل الزيارات في اليوم" : "Daily target"}</small>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <Map size={23} />
          </div>

          <span>{ar ? "عدد المناطق" : "Areas"}</span>
          <h2>{areaCount}</h2>
          <small>{ar ? "المناطق المسجلة" : "Registered areas"}</small>
        </div>
      </div>

      {/* Content Panels */}
      <div className="dashboard-grid">
        <div className="panel plan-overview">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">{ar ? "إعداد البلان" : "Plan setup"}</span>
              <h3>{ar ? "خطوات البدء السريع" : "Quick Start Steps"}</h3>
            </div>
            <span className="status">
              {completedSteps}/{setupSteps.length} {ar ? "مكتملة" : "done"}
            </span>
          </div>

          <div className="setup-steps">
            {setupSteps.map((step) => (
              <button
                type="button"
                className={`setup-step ${step.complete ? "complete" : ""}`}
                key={step.label}
                onClick={() => setActivePage(step.page)}
              >
                <span className="setup-step-icon">
                  {step.complete ? (
                    <CalendarCheck size={17} />
                  ) : (
                    <CircleAlert size={17} />
                  )}
                </span>
                <span>
                  <strong>{step.label}</strong>
                  <small>{step.complete ? (ar ? "مكتمل" : "Done") : (ar ? "يحتاج إلى إعداد" : "Needs setup")}</small>
                </span>
                <ArrowLeft className="setup-step-arrow" size={16} />
              </button>
            ))}
          </div>
        </div>

        <div className="panel schedule-overview">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">{ar ? "التقويم" : "Calendar"}</span>
              <h3>{ar ? "المواعيد القادمة" : "Upcoming"}</h3>
            </div>
          </div>

          <div className="schedule-list">
            <div className="schedule-item">
              <div className="schedule-icon holiday">
                <CalendarDays size={19} />
              </div>
              <div>
                <span>{ar ? "الإجازة القادمة" : "Next holiday"}</span>
                <strong>
                  {upcomingHoliday
                    ? formatDate(upcomingHoliday)
                    : (ar ? "لا توجد إجازات مسجلة" : "No holidays registered")}
                </strong>
              </div>
            </div>

            <div className="schedule-item">
              <div className="schedule-icon meeting">
                <ClipboardList size={19} />
              </div>
              <div>
                <span>{ar ? "اجتماع قادم" : "Next meeting"}</span>
                <strong>
                  {upcomingMeeting
                    ? formatDate(upcomingMeeting)
                    : (ar ? "لا توجد اجتماعات مسجلة" : "No meetings registered")}
                </strong>
              </div>
            </div>

            <div className="schedule-item">
              <div className="schedule-icon plan">
                <Target size={19} />
              </div>
              <div>
                <span>{ar ? "فترة البلان الحالية" : "Current plan period"}</span>
                <strong>
                  {planStartDate && planEndDate
                    ? `${formatDate(planStartDate)} — ${formatDate(planEndDate)}`
                    : (ar ? "لم يتم تحديد الفترة" : "Period not set")}
                </strong>
              </div>
            </div>
          </div>

          <button
            className="secondary-button"
            onClick={() => setActivePage("الإعدادات")}
          >
            {ar ? "إدارة التقويم والإعدادات" : "Manage calendar and settings"}
            <ArrowLeft size={17} />
          </button>
        </div>
      </div>
    </>
  );
}

export default Dashboard;