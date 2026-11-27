import {
    generateVisitPlan,
    validateVisitPlan,
} from "../utils/planningEngine";
import { setEngineLang } from "../i18n/engineText.js";

self.onmessage = (event) => {
    const payload = event.data;
    setEngineLang(payload.language);

    const result = generateVisitPlan({
        doctors: payload.doctors,
        startDate: payload.planStartDate,
        endDate: payload.planEndDate,
        workingDays: payload.workingDays,
        holidays: payload.holidays,
        meetings: payload.meetings,
        callRate: payload.callRate,
        zoneGroups: payload.zoneGroups,
    });

    let validation = null;

    if (result.days?.length > 0) {
        validation = validateVisitPlan({
            days: result.days,
            doctors: payload.doctors,
            workingDays: payload.workingDays,
            holidays: payload.holidays,
            meetings: payload.meetings,
            zoneGroups: payload.zoneGroups,
            allowedMixedDays: new Set(
                (result.sharedDayExceptions || []).map((x) => x.date)
            ),
        });

        // عند عدم اكتمال الخطة، أسماء الدكاترة الناقصين معروضة بالفعل
        // في قسم الأخطاء؛ نخفي سطور "المطلوب/الموجود" من بطاقة المراجعة
        // حتى تبقى للمخالفات الفعلية فقط (فواصل، خلط مناطق...).
        if (result.stats?.incompleteDoctors > 0) {
            const countLinePattern =
                /: (المطلوب \d+ زيارة والموجود \d+|required \d+ visits?, found \d+)$/i;
            const shown = validation.errors.filter(
                (entry) => !countLinePattern.test(entry)
            );
            validation = {
                ...validation,
                errors: shown,
                valid: shown.length === 0,
            };
        }
    }

    self.postMessage({
        result,
        validation,
    });
};
