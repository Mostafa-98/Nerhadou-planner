
import { useState, useRef } from "react";
import {
    CalendarDays,
    ClipboardList,
    AlertTriangle,
    CheckCircle2,
    RefreshCw,
    Download,
    Printer,
    CalendarOff,
    CheckCheck,
    Undo2,
    Upload,
    XCircle,
} from "lucide-react";

import { usePersistentState } from "../utils/usePersistentState";
import { exportPlanToExcel, printPlanToPdf } from "../utils/planExporter";
import { parseActualsFile, matchActuals } from "../utils/actualsImporter";
import { ungroupedAreas } from "../utils/areaGrouping";
import { validateVisitPlan } from "../utils/planningEngine";

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
    const [actuals, setActuals] = usePersistentState(
        "visit-planner-actuals",
        {}
    );

    const toggleVisitDone = (visitId) => {
        setActuals((current) => ({
            ...current,
            [visitId]: !current[visitId],
        }));
    };

    const [dayBulk, setDayBulk] = usePersistentState(
        "visit-planner-day-bulk",
        {}
    );
    const [importPreview, setImportPreview] = useState(null);
    const importInputRef = useRef(null);

    const markDayDone = (day) => {
        const ids = (day.visits || [])
            .filter((visit) => !actuals[visit.id])
            .map((visit) => visit.id);
        if (!ids.length) return;
        setDayBulk((current) => ({
            ...current,
            [day.date]: [...(current[day.date] || []), ...ids],
        }));
        setActuals((current) => {
            const next = { ...current };
            ids.forEach((id) => {
                next[id] = true;
            });
            return next;
        });
    };

    const undoDayDone = (day) => {
        const ids = dayBulk[day.date] || [];
        if (!ids.length) return;
        setActuals((current) => {
            const next = { ...current };
            ids.forEach((id) => {
                if (next[id]) delete next[id];
            });
            return next;
        });
        setDayBulk((current) => {
            const next = { ...current };
            delete next[day.date];
            return next;
        });
    };

    const handleImportFile = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file || !plan) return;
        try {
            const buffer = await file.arrayBuffer();
            const { rows, error } = parseActualsFile(buffer);
            if (error) {
                setMessage(
                    ar
                        ? "تعذر قراءة الملف. تأكد من وجود عمودين: اسم الدكتور والتاريخ."
                        : "Could not read the file. Make sure it has doctor name and date columns."
                );
                return;
            }
            const result = matchActuals(plan, rows);
            setImportPreview({ ...result, fileName: file.name });
        } catch (err) {
            setMessage(
                ar
                    ? "تعذر قراءة الملف. تأكد من صيغة الملف (Excel أو CSV)."
                    : "Could not read the file. Check the format (Excel or CSV)."
            );
        }
    };

    const applyImport = () => {
        if (!importPreview) return;
        setActuals((current) => {
            const next = { ...current };
            importPreview.matched.forEach((m) => {
                next[m.visitId] = true;
            });
            return next;
        });
        setMessage(
            ar
                ? `تم تسجيل ${importPreview.matched.length} زيارة فعلية من الملف.`
                : `Marked ${importPreview.matched.length} visits as done from the file.`
        );
        setImportPreview(null);
    };

    const [missedDays, setMissedDays] = usePersistentState(
        "visit-planner-missed-days",
        []
    );
    const [isReplanning, setIsReplanning] = useState(false);

    const toISO = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    };

    const addDaysISO = (iso, days) => {
        const date = new Date(iso + "T00:00:00");
        date.setDate(date.getDate() + days);
        return toISO(date);
    };
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

    const handleReplan = (nextMissed) => {
        const missed = nextMissed || missedDays;
        if (!plan || !doctors.length || !planEndDate) return;
        setMessage("");
        setIsReplanning(true);

        const tomorrow = addDaysISO(toISO(new Date()), 1);
        const start =
            planStartDate && planStartDate > tomorrow
                ? planStartDate
                : tomorrow;

        if (start > planEndDate) {
            setIsReplanning(false);
            setMessage(
                ar ? "لا توجد أيام متبقية في فترة البلان لإعادة التوزيع." : "No remaining days in the plan period to re-distribute into."
            );
            return;
        }

        const doneByDoctor = {};
        plan.days.forEach((day) =>
            (day.visits || []).forEach((visit) => {
                if (actuals[visit.id]) {
                    const key = visit.doctorId || visit.doctorName;
                    (doneByDoctor[key] = doneByDoctor[key] || []).push(
                        visit.date
                    );
                }
            })
        );

        const adjustedDoctors = doctors.map((doctor) => {
            const key = doctor.id || doctor.name;
            const done = (doneByDoctor[key] || []).slice().sort();
            const remaining = Math.max(
                0,
                (Number(doctor.currentFrequency) || 0) - done.length
            );
            const entry = { ...doctor, currentFrequency: remaining };
            if (done.length) {
                entry._minDate = addDaysISO(done[done.length - 1], 6);
            }
            return entry;
        });

        const worker = new Worker(
            new URL("../workers/planningWorker.js", import.meta.url),
            { type: "module" }
        );

        worker.onmessage = (event) => {
            const { result } = event.data;
            worker.terminate();

            const missedSet = new Set(missed);
            const daysMap = new Map();

            plan.days.forEach((day) => {
                const kept = (day.visits || []).filter(
                    (visit) => actuals[visit.id]
                );
                if (kept.length) {
                    daysMap.set(day.date, {
                        date: day.date,
                        visits: [...kept],
                        totalVisits: kept.length,
                        bricks: [
                            ...new Set(
                                kept.map((visit) => visit.zone || visit.brick)
                            ),
                        ],
                    });
                }
            });

            (result.days || []).forEach((day) => {
                if (!day.visits?.length || missedSet.has(day.date)) return;
                const existing = daysMap.get(day.date);
                if (existing) {
                    existing.visits.push(...day.visits);
                    existing.totalVisits = existing.visits.length;
                    existing.bricks = [
                        ...new Set(
                            existing.visits.map(
                                (visit) => visit.zone || visit.brick
                            )
                        ),
                    ];
                } else {
                    daysMap.set(day.date, { ...day, visits: [...day.visits] });
                }
            });

            const mergedDays = [...daysMap.values()].sort((a, b) =>
                a.date.localeCompare(b.date)
            );

            const perDoctor = {};
            mergedDays.forEach((day) =>
                day.visits.forEach((visit) => {
                    const key = visit.doctorId || visit.doctorName;
                    (perDoctor[key] = perDoctor[key] || []).push(visit);
                })
            );
            Object.values(perDoctor).forEach((list) =>
                list
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .forEach((visit, index) => {
                        visit.visitNumber = index + 1;
                    })
            );

            const mergedPlan = {
                ...result,
                days: mergedDays,
                stats: {
                    ...result.stats,
                    scheduledVisits: mergedDays.reduce(
                        (sum, day) => sum + day.visits.length,
                        0
                    ),
                },
            };

            const mergedValidation = validateVisitPlan({
                days: mergedDays,
                doctors,
                workingDays,
                holidays: [...holidays, ...missed],
                meetings,
                zoneGroups,
            });

            setPlan(mergedPlan);
            setValidation(mergedValidation);
            setIsReplanning(false);
            setMessage(
                result.success && mergedValidation.valid
                    ? (ar ? "تمت إعادة توزيع الزيارات المتبقية مع الحفاظ على الزيارات المنجزة وقواعد الفواصل." : "Remaining visits re-distributed. Completed visits and gap rules preserved.")
                    : (ar ? "تمت إعادة التوزيع مع ملاحظات تحتاج إلى مراجعة." : "Re-planned with issues that need review.")
            );
        };

        worker.onerror = () => {
            setIsReplanning(false);
            setMessage(
                ar ? "تعذر تشغيل محرك الخطة. يرجى تحديث الصفحة والمحاولة مرة أخرى." : "The plan engine could not run. Please refresh the page and try again."
            );
            worker.terminate();
        };

        worker.postMessage({
            doctors: adjustedDoctors,
            planStartDate: start,
            planEndDate,
            workingDays,
            holidays: [...holidays, ...missed],
            meetings,
            callRate: Number(callRate) || 12.5,
            zoneGroups,
            language,
        });
    };

    const markMissed = (date) => {
        if (missedDays.includes(date)) return;
        const next = [...missedDays, date];
        setMissedDays(next);
        handleReplan(next);
    };

    const stats = plan?.stats || {};

    const allPlanVisits = plan
        ? plan.days.flatMap((day) => day.visits || [])
        : [];
    const doneCount = allPlanVisits.filter(
        (visit) => actuals[visit.id]
    ).length;
    const completionPercent = allPlanVisits.length
        ? Math.round((doneCount / allPlanVisits.length) * 100)
        : 0;

    const missedSet = new Set(missedDays);
    const holidaySet = new Set(holidays || []);
    const planNeedsReplan =
        plan &&
        plan.days.some(
            (day) =>
                (day.visits || []).some((visit) => !actuals[visit.id]) &&
                (holidaySet.has(day.date) || missedSet.has(day.date))
        );

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

            {(() => {
                const ungrouped = ungroupedAreas(doctors, zoneGroups);
                if (!doctors.length || !ungrouped.length) return null;
                return (
                    <div className="ungrouped-warning">
                        <strong>
                            {ar
                                ? `${ungrouped.length} منطقة من ملفك بدون مجموعة`
                                : `${ungrouped.length} sheet areas have no group`}
                        </strong>
                        <p>
                            {ar
                                ? "كل منطقة بدون مجموعة بتحتاج أيام لوحدها وده ممكن يخلي البلان ناقص أو الأيام فاضية. جمّع المناطق المتقاربة في مجموعات من صفحة الإعدادات (ممكن تلصق المجموعات كلها كنص). المناطق: "
                                : "Each ungrouped area needs its own days, which can leave the plan incomplete or days underfilled. Group neighboring areas in Settings (you can paste all groups as text). Areas: "}
                            {ungrouped.slice(0, 10).join(ar ? "، " : ", ")}
                            {ungrouped.length > 10
                                ? (ar ? ` و ${ungrouped.length - 10} أخرى` : ` and ${ungrouped.length - 10} more`)
                                : ""}
                        </p>
                    </div>
                );
            })()}

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

                        <div className="stat-card">
                            <div>
                                <p>{ar ? "الزيارات المنجزة" : "Completed visits"}</p>
                                <h2>
                                    {doneCount} / {allPlanVisits.length}
                                </h2>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div>
                                <p>{ar ? "نسبة الإنجاز" : "Completion"}</p>
                                <h2>{completionPercent}%</h2>
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

                    {planNeedsReplan && (
                        <div
                            className="settings-card"
                            style={{ marginTop: 20 }}
                        >
                            <h3>
                                <AlertTriangle size={19} />
                                {ar ? "الخطة تحتاج إعادة توزيع" : "Plan needs re-distribution"}
                            </h3>
                            <p>
                                {ar ? "يوجد يوم فائت أو إجازة جديدة تؤثر على زيارات مجدولة. أعد توزيع الزيارات المتبقية مع الحفاظ على الزيارات المنجزة وقواعد الفواصل (6-25 يوم) ومجموعات المناطق." : "A missed day or a new holiday affects scheduled visits. Re-distribute the remaining visits while keeping completed visits, the 6-25 day gap rules and area groups."}
                            </p>
                            <button
                                type="button"
                                className="primary-button"
                                onClick={() => handleReplan()}
                                disabled={isReplanning}
                            >
                                <RefreshCw size={16} />
                                {isReplanning
                                    ? (ar ? "جاري إعادة التوزيع..." : "Re-planning...")
                                    : (ar ? "إعادة توزيع الزيارات المتبقية" : "Re-plan remaining visits")}
                            </button>
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
                                <button
                                    type="button"
                                    className="export-button"
                                    onClick={() => importInputRef.current?.click()}
                                >
                                    <Upload size={15} />
                                    {ar ? "استيراد الزيارات الفعلية" : "Import actual visits"}
                                </button>
                                <input
                                    ref={importInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    style={{ display: "none" }}
                                    onChange={handleImportFile}
                                />
                            </div>

                            <ClipboardList size={24} />
                        </div>

                        {importPreview && (
                            <div className="import-preview">
                                <h4>
                                    {ar ? "معاينة الاستيراد" : "Import preview"}
                                    {importPreview.fileName ? ` — ${importPreview.fileName}` : ""}
                                </h4>
                                <p>
                                    {ar
                                        ? `${importPreview.matched.length} زيارة سيتم تسجيلها كمنفذة، ${importPreview.unmatched.length} صف غير مطابق.`
                                        : `${importPreview.matched.length} visits will be marked done, ${importPreview.unmatched.length} unmatched rows.`}
                                </p>
                                {importPreview.unmatched.length > 0 && (
                                    <div style={{ overflowX: "auto" }}>
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>{ar ? "الصف" : "Row"}</th>
                                                    <th>{ar ? "الدكتور" : "Doctor"}</th>
                                                    <th>{ar ? "التاريخ" : "Date"}</th>
                                                    <th>{ar ? "السبب" : "Reason"}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {importPreview.unmatched.map((u, idx) => (
                                                    <tr key={idx}>
                                                        <td>{u.row}</td>
                                                        <td>{u.doctor || "—"}</td>
                                                        <td>{u.date || "—"}</td>
                                                        <td>
                                                            {u.reason === "date"
                                                                ? (ar ? "تاريخ غير صالح" : "Invalid date")
                                                                : u.reason === "noDoctor"
                                                                    ? (ar ? "الدكتور غير موجود في البلان" : "Doctor not in plan")
                                                                    : (ar ? "لا توجد زيارة مخططة في هذا التاريخ" : "No planned visit on this date")}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                <div className="export-actions" style={{ marginTop: 10 }}>
                                    <button
                                        type="button"
                                        className="export-button"
                                        onClick={applyImport}
                                        disabled={importPreview.matched.length === 0}
                                    >
                                        <CheckCircle2 size={15} />
                                        {ar ? "تطبيق" : "Apply"}
                                    </button>
                                    <button
                                        type="button"
                                        className="export-button"
                                        onClick={() => setImportPreview(null)}
                                    >
                                        <XCircle size={15} />
                                        {ar ? "إلغاء" : "Cancel"}
                                    </button>
                                </div>
                            </div>
                        )}

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
                                        {missedSet.has(day.date) && (
                                            <span className="missed-badge">
                                                {ar ? "يوم فائت" : "Missed"}
                                            </span>
                                        )}
                                    </h3>

                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                        }}
                                    >
                                        <strong>
                                            {day.totalVisits} {ar ? "زيارة" : "visits"}
                                        </strong>
                                        {!missedSet.has(day.date) &&
                                            day.visits.some(
                                                (visit) => !actuals[visit.id]
                                            ) && (
                                                <button
                                                    type="button"
                                                    className="export-button"
                                                    onClick={() =>
                                                        markDayDone(day)
                                                    }
                                                >
                                                    <CheckCheck size={14} />
                                                    {ar ? "تنفيذ كل اليوم" : "Mark all done"}
                                                </button>
                                            )}
                                        {(dayBulk[day.date] || []).some(
                                            (id) => actuals[id]
                                        ) && (
                                            <button
                                                type="button"
                                                className="export-button"
                                                onClick={() =>
                                                    undoDayDone(day)
                                                }
                                            >
                                                <Undo2 size={14} />
                                                {ar ? "تراجع عن الكل" : "Undo all"}
                                            </button>
                                        )}
                                        {!missedSet.has(day.date) &&
                                            day.visits.some(
                                                (visit) => !actuals[visit.id]
                                            ) && (
                                                <button
                                                    type="button"
                                                    className="export-button"
                                                    onClick={() =>
                                                        markMissed(day.date)
                                                    }
                                                    disabled={isReplanning}
                                                >
                                                    <CalendarOff size={14} />
                                                    {ar ? "تفويت اليوم" : "Mark missed"}
                                                </button>
                                            )}
                                    </div>
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
                                                    <th>{ar ? "تمت" : "Done"}</th>
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
                                                            <td>
                                                                <input
                                                                    type="checkbox"
                                                                    className="visit-done"
                                                                    checked={!!actuals[visit.id]}
                                                                    onChange={() => toggleVisitDone(visit.id)}
                                                                />
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
