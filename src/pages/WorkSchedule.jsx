import { CalendarCheck, CalendarDays, CalendarOff, Settings } from "lucide-react";
import { useI18n } from "../i18n";
import { usePersistentState } from "../utils/usePersistentState";

function WorkSchedule({ setActivePage }) {
  const { language } = useI18n();
  const [workingDays] = usePersistentState("visit-planner-working-days", ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء"]);
  const [holidays] = usePersistentState("visit-planner-holidays", []);
  const [meetings] = usePersistentState("visit-planner-meetings", []);
  const ar = language === "ar";
  const formatDate = (date) => new Date(`${date}T12:00:00`).toLocaleDateString(ar ? "ar-EG" : "en-US", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="functional-page">
      <div className="welcome-section">
        <div><h1>{ar ? "مواعيد العمل" : "Work Schedule"}</h1><p>{ar ? "راجع أيام العمل والإجازات والاجتماعات المسجلة." : "Review registered workdays, holidays, and meetings."}</p></div>
        {setActivePage && <button className="primary-button" onClick={() => setActivePage("الإعدادات")}><Settings size={18} />{ar ? "تعديل الإعدادات" : "Edit Settings"}</button>}
      </div>
      <div className="work-summary-grid">
        <div className="panel work-summary-card"><div className="stat-icon green"><CalendarCheck size={22} /></div><span>{ar ? "أيام العمل" : "Workdays"}</span><strong>{workingDays.length}</strong></div>
        <div className="panel work-summary-card"><div className="stat-icon orange"><CalendarOff size={22} /></div><span>{ar ? "الإجازات" : "Holidays"}</span><strong>{holidays.length}</strong></div>
        <div className="panel work-summary-card"><div className="stat-icon purple"><CalendarDays size={22} /></div><span>{ar ? "الاجتماعات" : "Meetings"}</span><strong>{meetings.length}</strong></div>
      </div>
      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-heading"><h3>{ar ? "أيام العمل الأسبوعية" : "Weekly Workdays"}</h3></div>
          <div className="schedule-chip-list">{workingDays.length ? workingDays.map((day) => <span className="schedule-chip" key={day}>{day}</span>) : <p>{ar ? "لم يتم تحديد أيام عمل." : "No workdays selected."}</p>}</div>
        </div>
        <div className="panel">
          <div className="panel-heading"><h3>{ar ? "التقويم المسجل" : "Registered Calendar"}</h3></div>
          <div className="schedule-list">
            {[...holidays.map((date) => ({ date, type: ar ? "إجازة" : "Holiday" })), ...meetings.map((date) => ({ date, type: ar ? "اجتماع" : "Meeting" }))].sort((a, b) => a.date.localeCompare(b.date)).map((item) => (
              <div className="schedule-item" key={`${item.type}-${item.date}`}><div className="schedule-icon plan"><CalendarDays size={18} /></div><div><span>{item.type}</span><strong>{formatDate(item.date)}</strong></div></div>
            ))}
            {!holidays.length && !meetings.length && <p>{ar ? "لا توجد تواريخ مسجلة بعد." : "No dates registered yet."}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkSchedule;
