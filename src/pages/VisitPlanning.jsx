
import { useState } from "react";
import {
    CalendarDays,
    ClipboardList,
    AlertTriangle,
    CheckCircle2,
    RefreshCw,
} from "lucide-react";

import { usePersistentState } from "../utils/usePersistentState";


function VisitPlanning({
    callRate,
    workingDays,
    holidays,
    meetings,
    planStartDate,
    planEndDate,
}) {
    const [doctors] = usePersistentState(
        "visit-planner-doctors",
        []
    );

    const [plan, setPlan] = useState(null);
    const [validation, setValidation] = useState(null);
    const [message, setMessage] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const formatDate = (date) => {
        return new Date(date + "T00:00:00").toLocaleDateString(
            "ar-EG",
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
                "من فضلك حدد تاريخ بداية ونهاية البلان من الإعدادات."
            );
            return;
        }

        if (!doctors.length) {
            setMessage(
                "لا توجد بيانات دكاترة. استورد ملف Excel أولاً."
            );
            return;
        }
        setIsGenerating(true);
        setMessage("جاري إنشاء الخطة، لا تقم بإغلاق الصفحة.");

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
                    "تم إنشاء الخطة. راجع النتائج قبل اعتمادها."
                );
            } else {
                setMessage(
                    "تم إنشاء نتيجة مبدئية، لكن توجد أخطاء تحتاج إلى مراجعة."
                );
            }

            worker.terminate();
        };

        worker.onerror = () => {
            setIsGenerating(false);
            setMessage(
                "تعذر تشغيل محرك الخطة. يرجى تحديث الصفحة والمحاولة مرة أخرى."
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
            return "وصلت للـ Call Rate المستهدف بالضبط.";
        }

        if (callRateDifference > 0) {
            return `أعلى من المستهدف بـ ${callRateDifference} زيارة يومياً.`;
        }

        return `أقل من المستهدف بـ ${Math.abs(
            callRateDifference
        )} زيارة يومياً.`;
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>تخطيط الزيارات</h1>
                    <p>
                        إنشاء وتوزيع زيارات الدكاترة خلال فترة البلان
                    </p>
                </div>

                <button
                    className="primary-button"
                    onClick={handleGeneratePlan}
                    disabled={isGenerating}
                >
                    <RefreshCw size={18} />
                    {isGenerating
                        ? "جاري إنشاء الخطة..."
                        : "إنشاء خطة الزيارات"}
                </button>
            </div>

            <div
                className="settings-card"
                style={{ marginBottom: 20 }}
            >
                <div className="section-header">
                    <div>
                        <h2>إعدادات الخطة</h2>
                        <p>
                            يتم استخدام البيانات المسجلة في صفحة الإعدادات
                        </p>
                    </div>

                    <CalendarDays size={24} />
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div>
                            <p>بداية البلان</p>
                            <h3>
                                {planStartDate || "غير محدد"}
                            </h3>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div>
                            <p>نهاية البلان</p>
                            <h3>
                                {planEndDate || "غير محدد"}
                            </h3>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div>
                            <p>Call Rate المستهدف</p>
                            <h3>{Number(callRate) || 12.5}</h3>                        </div>
                    </div>

                    <div className="stat-card">
                        <div>
                            <p>عدد الدكاترة</p>
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
                                <p>أيام العمل المتاحة</p>
                                <h2>
                                    {stats.availableDays ?? 0}
                                </h2>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div>
                                <p>الزيارات المطلوبة</p>
                                <h2>
                                    {stats.requiredVisits ?? 0}
                                </h2>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div>
                                <p>الزيارات الموزعة</p>
                                <h2>
                                    {stats.scheduledVisits ?? 0}
                                </h2>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div>
                                <p>Call Rate المستهدف</p>
                                <h2>{targetCallRate}</h2>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div>
                                <p>Call Rate الفعلي</p>
                                <h2>
                                    {actualCallRate.toFixed(2)}
                                </h2>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div>
                                <p>الفرق عن المستهدف</p>
                                <h2>
                                    {callRateDifference > 0 ? "+" : ""}
                                    {callRateDifference.toFixed(2)}
                                </h2>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div>
                                <p>أقل زيارات في يوم</p>
                                <h2>
                                    {stats.minDailyVisits ?? 0}
                                </h2>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div>
                                <p>أعلى زيارات في يوم</p>
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
                        <h3>تقييم الـ Call Rate</h3>
                        <p>
                            {getCallRateMessage()}
                        </p>
                        <p>
                            الهدف هو 12.5 زيارة في يوم العمل.
                            الحد الأقصى المسموح به 15 زيارة.
                        </p>
                        <p>
                            لم يتم تقليل تكرار زيارات أي دكتور
                            للوصول إلى المتوسط المستهدف.
                        </p>
                    </div>

                    {plan.warnings?.length > 0 && (
                        <div
                            className="settings-card"
                            style={{ marginTop: 20 }}
                        >
                            <h3>
                                <AlertTriangle size={19} />
                                تنبيهات الخطة
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
                                الأخطاء التي تحتاج إلى مراجعة
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

                                نتيجة مراجعة الخطة
                            </h3>

                            <p>
                                {validation.valid
                                    ? "الزيارات المجدولة تحترم الفواصل الزمنية وقواعد التوزيع."
                                    : "الخطة بها مخالفات ويجب مراجعتها قبل اعتمادها."}
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
                                <h2>جدول الزيارات اليومي</h2>
                                <p>
                                    تفاصيل الدكاترة الموزعين على أيام العمل
                                </p>
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
                                        {day.totalVisits} زيارة
                                    </strong>
                                </div>

                                {day.visits.length === 0 ? (
                                    <p>
                                        لا توجد زيارات في هذا اليوم.
                                    </p>
                                ) : (
                                    <div
                                        style={{ overflowX: "auto" }}
                                    >
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>اسم الدكتور</th>
                                                    <th>التخصص</th>
                                                    <th>Brick</th>
                                                    <th>Area</th>
                                                    <th>رقم الزيارة</th>
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
