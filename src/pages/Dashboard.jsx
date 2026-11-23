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
    new Date(`${date}T12:00:00`).toLocaleDateString("ar-EG", {
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
          <span>{today.toLocaleDateString("ar-EG", {
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
            أكملت {completedSteps} من {setupSteps.length} خطوات أساسية
            قبل إنشاء البلان الجديد.
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
          aria-label={`نسبة اكتمال الإعدادات ${setupProgress}%`}
        >
          <div className="dashboard-progress-inner">
            <strong>{setupProgress}%</strong>
            <span>جاهزية الخطة</span>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Users size={23} />
          </div>

          <span>إجمالي الدكاترة</span>
          <h2>{doctors.length}</h2>
          <small>عدد الدكاترة المسجلين</small>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <ClipboardList size={23} />
          </div>

          <span>إجمالي الزيارات</span>
          <h2>{totalVisits}</h2>
          <small>الزيارات المطلوبة في الخطة</small>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <Target size={23} />
          </div>

          <span>Call Rate Target</span>
          <h2>{callRate || "—"}</h2>
          <small>المستهدف اليومي</small>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <Map size={23} />
          </div>

          <span>عدد المناطق</span>
          <h2>{areaCount}</h2>
          <small>المناطق المسجلة</small>
        </div>
      </div>

      {/* Content Panels */}
      <div className="dashboard-grid">
        <div className="panel plan-overview">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">إعداد البلان</span>
              <h3>خطوات البدء السريع</h3>
            </div>
            <span className="status">
              {completedSteps}/{setupSteps.length} مكتملة
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
                  <small>{step.complete ? "مكتمل" : "يحتاج إلى إعداد"}</small>
                </span>
                <ArrowLeft className="setup-step-arrow" size={16} />
              </button>
            ))}
          </div>
        </div>

        <div className="panel schedule-overview">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">التقويم</span>
              <h3>المواعيد القادمة</h3>
            </div>
          </div>

          <div className="schedule-list">
            <div className="schedule-item">
              <div className="schedule-icon holiday">
                <CalendarDays size={19} />
              </div>
              <div>
                <span>الإجازة القادمة</span>
                <strong>
                  {upcomingHoliday
                    ? formatDate(upcomingHoliday)
                    : "لا توجد إجازات مسجلة"}
                </strong>
              </div>
            </div>

            <div className="schedule-item">
              <div className="schedule-icon meeting">
                <ClipboardList size={19} />
              </div>
              <div>
                <span>اجتماع قادم</span>
                <strong>
                  {upcomingMeeting
                    ? formatDate(upcomingMeeting)
                    : "لا توجد اجتماعات مسجلة"}
                </strong>
              </div>
            </div>

            <div className="schedule-item">
              <div className="schedule-icon plan">
                <Target size={19} />
              </div>
              <div>
                <span>فترة البلان الحالية</span>
                <strong>
                  {planStartDate && planEndDate
                    ? `${formatDate(planStartDate)} — ${formatDate(planEndDate)}`
                    : "لم يتم تحديد الفترة"}
                </strong>
              </div>
            </div>
          </div>

          <button
            className="secondary-button"
            onClick={() => setActivePage("الإعدادات")}
          >
            إدارة التقويم والإعدادات
            <ArrowLeft size={17} />
          </button>
        </div>
      </div>
    </>
  );
}

export default Dashboard;