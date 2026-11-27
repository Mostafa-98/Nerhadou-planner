
import { useState } from "react";
import {
    CalendarDays,
    ClipboardList,
    AlertTriangle,
    CheckCircle2,
    RefreshCw,
    Download,
    Printer,
} from "lucide-react";

import { usePersistentState } from "../utils/usePersistentState";
import { exportPlanToExcel, printPlanToPdf } from "../utils/planExporter";

import { useI18n } from "../i18n";


function VisitPlanning({
    callRate,
    zoneGroups,
    workingDays,
    holidays,
    meetings,
    planStartDate,
    planEndDate,
}) {
    const { language } = useI18n();
    const ar = language === "ar";
    const [doctors] = usePersistentState(
        "visit-planner-doctors",
        []
    );

    const [plan, setPlan] = usePersistentState(
        "visit-planner-plan-result",
        null
    );
    const [validation, setValidation] = useState(null);
    const [message, setMessage] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const formatDate = (date) => {
        return new Date(date + "T00:00:00").toLocaleDateString(
            ar ? "ar-EG" : "en-GB",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
            }
        );
    };

    const handleGeneratePlan = () => {
        setMessage("");
        setPlan(null);
        setValidation(null);

        if (!planStartDate || !planEndDate) {
            setMessage(
                ar ? "من فضلك حدد تاريخ بداية ونهاية البلان من الإعدادات." : "Please set the plan start and end dates in Settings."
            );
            return;
        }

        if (!doctors.length) {
            setMessage(
                ar ? "لا توجد بيانات دكاترة. استورد ملف Excel أولاً." : "No doctor data yet. Import an Excel file first."
            );
            return;
        }
        setIsGenerating(true);
        setMessage(ar ? "جاري إنشاء الخطة، لا تقم بإغلاق الصفحة." : "Generating the plan, please keep this page open.");

        const worker = new Worker(
            new URL(
                "../workers/planningWorker.js",
                import.meta.url
            ),
            { type: "module" }
        );

        worker.onmessage = (event) => {
            const { result, validation: nextValidation } =
                event.data;

            setPlan(result);
            setValidation(nextValidation);
            setIsGenerating(false);

            if (result.success) {
                setMessage(
                    ar ? "تم إنشاء الخطة. راجع النتائج قبل اعتمادها." : "Plan generated. Review the results before approving it."
                );
            } else {
                setMessage(
                    ar ? "تم إنشاء نتيجة مبدئية، لكن توجد أخطاء تحتاج إلى مراجعة." : "A draft plan was generated, but some issues need review."
                );
            }

            worker.terminate();
        };

        worker.onerror = () => {
            setIsGenerating(false);
            setMessage(
                ar ? "تعذر تشغيل محرك الخطة. يرجى تحديث الصفحة والمحاولة مرة أخرى." : "The plan engine could not run. Please refresh the page and try again."
            );
            worker.terminate();
        };

        worker.postMessage({
            doctors,
            planStartDate,
            planEndDate,
            workingDays,
            holidays,
            meetings,
            callRate: Number(callRate) || 12.5,
            zoneGroups,
            language,
        });
    };

    const stats = plan?.stats || {};

    const actualCallRate =
        Number(stats.averageVisitsPerDay || 0);

    const targetCallRate =
        Number(stats.targetCallRate || callRate || 12.5);
    const callRateDifference =
        Number(
            (
                actualCallRate - targetCallRate
            ).toFixed(2)
        );

    const getCallRateMessage = () => {
        if (callRateDifference === 0) {
            return ar ? "وصلت للـ Call Rate المستهدف بالضبط." : "Exactly on the targeted Call Rate.";
        }

        if (callRateDifference > 0) {
            return ar ? `أعلى من المستهدف بـ ${callRateDifference} زيارة يومياً.` : `${callRateDifference} visits/day above target.`;
        }

        return ar ? `أقل من المستهدف بـ ${Math.abs(callRateDifference)} زيارة يومياً.` : `${Math.abs(callRateDifference)} visits/day below target.`;
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>{ar ? "تخطيط الزيارات" : "Visit Planning"}</h1>
                    <p>
                        {ar ? "إنشاء وتوزيع زيارات الدكاترة خلال فترة البلان" : "Generate and distribute doctor visits across the plan period"}
                    </p>
                </div>

                <button
                    className="primary-button"
                    onClick={handleGeneratePlan}
                    disabled={isGenerating}
                >
                    <RefreshCw size={18} />
                    {isGenerating
                        ? (ar ? "جاري إنشاء الخطة..." : "Generating plan...") : (ar ? "إنشاء خطة الزيارات" : "Generate Visit Plan")}
                </button>
            </div>

            <div
                className="settings-card"
                style={{ marginBottom: 20 }}
            >
                <div className="section-header">
                    <div>
                        <h2>{ar ? "إعدادات الخطة" : "Plan Settings"}</h2>
                        <p>
                            {ar ? "يتم استخدام البيانات المسجلة في صفحة الإعدادات" : "Using the data saved on the Settings page"}
                        </p>
                    </div>

                    <CalendarDays size={24} />
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div>
                            <p>{ar ? "بداية البلان" : "Plan start"}</p>
                            <h3>
                                {planStartDate || (ar ? "غير محدد" : "Not set")}
                            </h3>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div>
                            <p>{ar ? "نهاية البلان" : "Plan end"}</p>
                            <h3>
                                {planEndDate || (ar ? "غير محدد" : "Not set")}
                            </h3>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div>
                            <p>{ar ? "Call Rate المستهدف" : "Target Call Rate"}</p>
                            <h3>{Number(callRate) || 12.5}</h3>                        </div>
                    </div>

                    <div className="stat-card">
                        <div>
                            <p>{ar ? "عدد الدكاترة" : "Doctors"}</p>
                            <h3>{doctors.length}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {message && (
                <div
                    className="settings-card"
                    style={{ marginBottom: 20 }}
                >
                    {message}
                </div>
            )}

            {plan && (
                <>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div>
                                <p>{ar ? "أيام العمل المتاحة" : "Available workdays"}</p>
                                <h2>
                                    {stats.availableDays ?? 0}
                                </h2>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div>
                                <p>{ar ? "الزيارات المطلوبة" : "Required visits"}</p>
                                <h2>
                                    {stats.requiredVisits ?? 0}
                                </h2>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div>
                                <p>{ar ? "الزيارات الموزعة" : "Scheduled visits"}</p>
                                <h2>
                                    {stats.scheduledVisits ?? 0}
                                </h2>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div>
                                <p>{ar ? "Call Rate المستهدف" : "Target Call Rate"}</p>
                                <h2>{targetCallRate}</h2>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div>
                                <p>{ar ? "Call Rate الفعلي" : "Actual Call Rate"}</p>
                                <h2>
                                    {actualCallRate.toFixed(2)}
                                </h2>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div>
                                <p>{ar ? "الفرق عن المستهدف" : "Difference from target"}</p>
                                <h2>
                                    {callRateDifference > 0 ? "+" : ""}
                                    {callRateDifference.toFixed(2)}
                                </h2>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div>
                                <p>{ar ? "أقل زيارات في يوم" : "Lowest visits in a day"}</p>
                                <h2>
                                    {stats.minDailyVisits ?? 0}
                                </h2>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div>
                                <p>{ar ? "أعلى زيارات في يوم" : "Highest visits in a day"}</p>
                                <h2>
                                    {stats.maxDailyVisits ?? 0}
                                </h2>
                            </div>
                        </div>
                    </div>

                    <div
                        className="settings-card"
                        style={{ marginTop: 20 }}
                    >
                        <h3>{ar ? "تقييم الـ Call Rate" : "Call Rate Assessment"}</h3>
                        <p>
                            {getCallRateMessage()}
                        </p>
                        <p>
                            {ar ? "الهدف هو 12.5 زيارة في يوم العمل. الحد الأقصى المسموح به 15 زيارة." : "The target is 12.5 visits per workday. The allowed maximum is 15 visits."}
                        </p>
                        <p>
                            {ar ? "لم يتم تقليل تكرار زيارات أي دكتور للوصول إلى المتوسط المستهدف." : "No doctor's visit frequency was reduced to reach the target average."}
                        </p>
                    </div>

                    {plan.warnings?.length > 0 && (
                        <div
                            className="settings-card"
                            style={{ marginTop: 20 }}
                        >
                            <h3>
                                <AlertTriangle size={19} />
                                {ar ? "تنبيهات الخطة" : "Plan notices"}
                            </h3>

                            {plan.warnings.map(
                                (warning, index) => (
                                    <p key={index}>{warning}</p>
                                )
                            )}
                        </div>
                    )}

                    {plan.errors?.length > 0 && (
                        <div
                            className="settings-card"
                            style={{ marginTop: 20 }}
                        >
                            <h3>
                                {ar ? "الأخطاء التي تحتاج إلى مراجعة" : "Issues that need review"}
                            </h3>

                            {plan.errors.map(
                                (error, index) => (
                                    <p key={index}>
                                        {typeof error === "string"
                                            ? error
                                            : `${error.doctor}: ${error.message}`}
                                    </p>
                                )
                            )}
                        </div>
                    )}

                    {validation && (
                        <div
                            className="settings-card"
                            style={{ marginTop: 20 }}
                        >
                            <h3>
                                {validation.valid ? (
                                    <CheckCircle2 size={19} />
                                ) : (
                                    <AlertTriangle size={19} />
                                )}

                                {ar ? "نتيجة مراجعة الخطة" : "Plan review result"}
                            </h3>

                            <p>
                                {validation.valid
                                    ? (ar ? "الزيارات المجدولة تحترم الفواصل الزمنية وقواعد التوزيع." : "Scheduled visits respect the gap rules and distribution rules.") : (ar ? "الخطة بها مخالفات ويجب مراجعتها قبل اعتمادها." : "The plan has violations and must be reviewed before approval.")}
                            </p>

                            {validation.errors.map(
                                (error, index) => (
                                    <p key={index}>{error}</p>
                                )
                            )}
                        </div>
                    )}

                    <div
                        className="settings-card"
                        style={{ marginTop: 20 }}
                    >
                        <div className="section-header">
                            <div>
                                <h2>{ar ? "جدول الزيارات اليومي" : "Daily Visit Schedule"}</h2>
                                <p>
                                    {ar ? "تفاصيل الدكاترة الموزعين على أيام العمل" : "Doctors assigned across the working days"}
                                </p>
                            </div>
                            <div className="export-actions">
                                <button
                                    type="button"
                                    className="export-button"
                                    onClick={() => exportPlanToExcel(plan, language)}
                                >
                                    <Download size={15} />
                                    {ar ? "تصدير Excel" : "Export Excel"}
                                </button>
                                <button
                                    type="button"
                                    className="export-button"
                                    onClick={() => {
                                        if (!printPlanToPdf(plan, language)) {
                                            setMessage(
                                                ar ? "المتصفح منع نافذة الطباعة. فعّل النوافذ المنبثقة وحاول مرة أخرى." : "The browser blocked the print window. Allow pop-ups and try again."
                                            );
                                        }
                                    }}
                                >
                                    <Printer size={15} />
                                    {ar ? "طباعة / PDF" : "Print / PDF"}
                                </button>
                            </div>

                            <ClipboardList size={24} />
                        </div>

                        {plan.days.map((day) => (
                            <div
                                key={day.date}
                                style={{
                                    borderBottom: "1px solid #e5e7eb",
                                    padding: "18px 0",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        gap: 12,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <h3>
                                        {formatDate(day.date)}
                                    </h3>

                                    <strong>
                                        {day.totalVisits} {ar ? "زيارة" : "visits"}
                                    </strong>
                                </div>

                                {day.visits.length === 0 ? (
                                    <p>
                                        {ar ? "لا توجد زيارات في هذا اليوم." : "No visits on this day."}
                                    </p>
                                ) : (
                                    <div
                                        style={{ overflowX: "auto" }}
                                    >
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>{ar ? "اسم الدكتور" : "Doctor"}</th>
                                                    <th>{ar ? "التخصص" : "Specialty"}</th>
                                                    <th>Brick</th>
                                                    <th>Area</th>
                                                    <th>{ar ? "رقم الزيارة" : "Visit #"}</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {day.visits.map(
                                                    (visit) => (
                                                        <tr key={visit.id}>
                                                            <td>
                                                                {visit.doctorName}
                                                            </td>
                                                            <td>
                                                                {visit.specialty}
                                                            </td>
                                                            <td>
                                                                {visit.brick}
                                                            </td>
                                                            <td>
                                                                {visit.area}
                                                            </td>
                                                            <td>
                                                                {visit.visitNumber}
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default VisitPlanning;
