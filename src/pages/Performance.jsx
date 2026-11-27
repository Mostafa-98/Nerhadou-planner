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

  const [plan] = usePersistentState("visit-planner-plan-result", null);
  const [actuals] = usePersistentState("visit-planner-actuals", {});
  const planVisits = plan ? plan.days.flatMap((day) => day.visits || []) : [];
  const doneTotal = planVisits.filter((visit) => actuals[visit.id]).length;
  const completion = planVisits.length ? Math.round((doneTotal / planVisits.length) * 100) : 0;

  const perDoctor = doctors.map((doctor) => {
    const visits = planVisits.filter(
      (visit) => visit.doctorId === doctor.id || visit.doctorName === doctor.name
    );
    const done = visits.filter((visit) => actuals[visit.id]).length;
    return {
      id: doctor.id || doctor.name,
      name: doctor.name,
      planned: visits.length,
      done,
      percent: visits.length ? Math.round((done / visits.length) * 100) : 0,
    };
  }).filter((row) => row.planned > 0);

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

      <div className="panel">
        <div className="panel-heading"><h3>{ar ? "الزيارات الفعلية مقابل الخطة" : "Actual visits vs plan"}</h3><span className="status">{doneTotal} / {planVisits.length}</span></div>
        {planVisits.length === 0 ? (
          <p>{ar ? "أنشئ خطة أولاً من صفحة تخطيط الزيارات، ثم علّم الزيارات المنجزة." : "Generate a plan on the Visit Planning page first, then mark completed visits there."}</p>
        ) : (
          <>
            <div className="performance-bar"><span style={{ width: `${completion}%` }} /></div>
            <p style={{ marginTop: 14 }}>{ar ? `نسبة الإنجاز الإجمالية: ${completion}%` : `Overall completion: ${completion}%`}</p>
            <div style={{ overflowX: "auto", marginTop: 10 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{ar ? "الدكتور" : "Doctor"}</th>
                    <th>{ar ? "مخطط" : "Planned"}</th>
                    <th>{ar ? "منجز" : "Done"}</th>
                    <th>{ar ? "النسبة" : "%"}</th>
                  </tr>
                </thead>
                <tbody>
                  {perDoctor.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td>{row.planned}</td>
                      <td>{row.done}</td>
                      <td>{row.percent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Performance;
