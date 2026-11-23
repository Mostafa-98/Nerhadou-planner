import { MapPinned, Users } from "lucide-react";
import { useI18n } from "../i18n";
import { usePersistentState } from "../utils/usePersistentState";

function Areas() {
  const { language } = useI18n();
  const [doctors] = usePersistentState("visit-planner-doctors", []);
  const ar = language === "ar";
  const grouped = doctors.reduce((result, doctor) => {
    const brick = String(doctor.brick || "").trim() || (ar ? "غير محدد" : "Unassigned");
    result[brick] = (result[brick] || 0) + 1;
    return result;
  }, {});
  const rows = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b, ar ? "ar" : "en"));
  const totalFrequency = doctors.reduce((sum, doctor) => sum + (Number(doctor.currentFrequency) || 0), 0);

  return (
    <div className="functional-page">
      <div className="welcome-section"><div><h1>{ar ? "توزيع المناطق" : "Area Distribution"}</h1><p>{ar ? "عرض توزيع الدكاترة والزيارات حسب الـ Brick." : "View doctor and visit distribution by Brick."}</p></div></div>
      <div className="work-summary-grid">
        <div className="panel work-summary-card"><div className="stat-icon purple"><MapPinned size={22} /></div><span>{ar ? "عدد المناطق" : "Areas"}</span><strong>{rows.length}</strong></div>
        <div className="panel work-summary-card"><div className="stat-icon blue"><Users size={22} /></div><span>{ar ? "الدكاترة" : "Doctors"}</span><strong>{doctors.length}</strong></div>
        <div className="panel work-summary-card"><div className="stat-icon green"><MapPinned size={22} /></div><span>{ar ? "الزيارات المطلوبة" : "Required Visits"}</span><strong>{totalFrequency}</strong></div>
      </div>
      <div className="panel">
        <div className="panel-heading"><h3>{ar ? "توزيع الدكاترة" : "Doctor Distribution"}</h3></div>
        {rows.length ? <div className="area-grid">{rows.map(([area, count]) => (
          <div className="area-card" key={area}><div className="area-icon"><MapPinned size={18} /></div><div><span>{area}</span><strong>{count} {ar ? "دكتور" : "doctors"}</strong></div><div className="area-bar"><span style={{ width: `${Math.max(8, (count / doctors.length) * 100)}%` }} /></div></div>
        ))}</div> : <div className="no-filter-results"><MapPinned size={28} /><h3>{ar ? "لا توجد مناطق مسجلة" : "No areas registered"}</h3></div>}
      </div>
    </div>
  );
}

export default Areas;
