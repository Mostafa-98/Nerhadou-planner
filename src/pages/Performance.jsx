import { BarChart3, ClipboardList, Target, Users } from "lucide-react";
import { useI18n } from "../i18n";
import { usePersistentState } from "../utils/usePersistentState";

function Performance() {
  const { language } = useI18n();
  const ar = language === "ar";
  const [doctors] = usePersistentState("visit-planner-doctors", []);
  const [callRate] = usePersistentState("visit-planner-call-rate", 12.5);
  const requiredVisits = doctors.reduce((sum, doctor) => sum + (Number(doctor.currentFrequency) || 0), 0);
  const activeDoctors = doctors.filter((doctor) => Number(doctor.currentFrequency) > 0).length;
  const coverage = doctors.length ? Math.round((activeDoctors / doctors.length) * 100) : 0;

  return (
    <div className="functional-page">
      <div className="welcome-section"><div><h1>{ar ? "تحليل الأداء" : "Performance Analysis"}</h1><p>{ar ? "قراءة سريعة لمؤشرات الخطة الحالية." : "Quick view of current plan indicators."}</p></div></div>
      <div className="doctor-stats-grid">
        <div className="doctor-stat-card"><div className="stat-icon blue"><Users size={22} /></div><div><span>{ar ? "الدكاترة" : "Doctors"}</span><strong>{doctors.length}</strong></div></div>
        <div className="doctor-stat-card"><div className="stat-icon green"><ClipboardList size={22} /></div><div><span>{ar ? "الزيارات" : "Visits"}</span><strong>{requiredVisits}</strong></div></div>
        <div className="doctor-stat-card"><div className="stat-icon orange"><Target size={22} /></div><div><span>Call Rate</span><strong>{callRate}</strong></div></div>
        <div className="doctor-stat-card"><div className="stat-icon purple"><BarChart3 size={22} /></div><div><span>{ar ? "نسبة التغطية" : "Coverage"}</span><strong>{coverage}%</strong></div></div>
      </div>
      <div className="panel"><div className="panel-heading"><h3>{ar ? "مؤشر التغطية" : "Coverage Indicator"}</h3><span className="status">{coverage}%</span></div><div className="performance-bar"><span style={{ width: `${coverage}%` }} /></div><p style={{ marginTop: 14 }}>{ar ? "النسبة تعكس الدكاترة الذين لديهم Frequency أكبر من صفر." : "Coverage reflects doctors with a Frequency greater than zero."}</p></div>
    </div>
  );
}

export default Performance;
