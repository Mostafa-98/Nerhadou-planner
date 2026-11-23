import { CalendarDays, ClipboardList, Target } from "lucide-react";
import { useI18n } from "../i18n";
import { usePersistentState } from "../utils/usePersistentState";

function MonthlyPlan() {
  const { language } = useI18n();
  const ar = language === "ar";
  const [start] = usePersistentState("visit-planner-plan-start", "2026-11-17");
  const [end] = usePersistentState("visit-planner-plan-end", "2026-12-30");
  const [doctors] = usePersistentState("visit-planner-doctors", []);
  const [callRate] = usePersistentState("visit-planner-call-rate", 12.5);
  const requiredVisits = doctors.reduce((sum, doctor) => sum + (Number(doctor.currentFrequency) || 0), 0);
  return (
    <div className="functional-page">
      <div className="welcome-section"><div><h1>{ar ? "البلان الشهري" : "Monthly Plan"}</h1><p>{ar ? "ملخص فترة الخطة والزيارات المطلوبة." : "Summary of the plan period and required visits."}</p></div></div>
      <div className="work-summary-grid">
        <div className="panel work-summary-card"><div className="stat-icon blue"><CalendarDays size={22} /></div><span>{ar ? "تاريخ البداية" : "Start Date"}</span><strong>{start}</strong></div>
        <div className="panel work-summary-card"><div className="stat-icon orange"><CalendarDays size={22} /></div><span>{ar ? "تاريخ النهاية" : "End Date"}</span><strong>{end}</strong></div>
        <div className="panel work-summary-card"><div className="stat-icon purple"><Target size={22} /></div><span>Call Rate</span><strong>{callRate}</strong></div>
      </div>
      <div className="panel"><div className="panel-heading"><h3>{ar ? "ملخص الخطة" : "Plan Summary"}</h3></div><div className="schedule-list">
        <div className="schedule-item"><div className="schedule-icon plan"><ClipboardList size={18} /></div><div><span>{ar ? "الزيارات المطلوبة" : "Required Visits"}</span><strong>{requiredVisits}</strong></div></div>
        <div className="schedule-item"><div className="schedule-icon meeting"><CalendarDays size={18} /></div><div><span>{ar ? "عدد الدكاترة" : "Doctors"}</span><strong>{doctors.length}</strong></div></div>
      </div></div>
    </div>
  );
}

export default MonthlyPlan;
