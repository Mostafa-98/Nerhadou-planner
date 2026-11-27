// Worker-safe UI text for the planning engine and Excel importer.
// No React imports here: the planning worker bundles this module.
// The React provider in i18n.jsx calls setEngineLang() whenever the
// UI language changes, so messages come out in the active language.

let currentLang = "ar";

export function setEngineLang(lang) {
  currentLang = lang === "en" ? "en" : "ar";
}

export function getEngineLang() {
  return currentLang;
}

const M = {
  dayExceedsMax: {
    ar: "يوم {date}: عدد الزيارات {count}، والحد الأقصى {max}",
    en: "{date}: {count} visits scheduled, maximum is {max}",
  },
  dayMixesZones: {
    ar: "يوم {date}: يوجد خلط غير مسموح بين المناطق",
    en: "{date}: mixing areas that are not allowed together",
  },
  dateNotWorking: {
    ar: "التاريخ {date} غير موجود ضمن أيام العمل المتاحة",
    en: "{date} is not one of the available working days",
  },
  doctorCountMismatch: {
    ar: "{name}: المطلوب {required} زيارة والموجود {actual}",
    en: "{name}: required {required} visits, found {actual}",
  },
  doctorGapOutOfRange: {
    ar: "{name}: الفاصل بين زيارتين {gap} يوم، والمسموح من {min} إلى {max}",
    en: "{name}: gap between two visits is {gap} days, allowed range is {min} to {max}",
  },
  noWorkingDays: {
    ar: "لا توجد أيام عمل متاحة في الفترة المحددة",
    en: "No available working days in the selected period",
  },
  requiredExceedsCapacity: {
    ar: "عدد الزيارات المطلوبة {required} أكبر من السعة القصوى {capacity} زيارة",
    en: "Required visits ({required}) exceed the maximum capacity of {capacity} visits",
  },
  notEnoughDaysForZones: {
    ar: "عدد أيام العمل المتاحة ({available}) أقل من الحد الأدنى اللازم لتغطية المناطق بالفريكونسي المطلوب ({minimum} يوم على الأقل)",
    en: "Available working days ({available}) are fewer than the minimum needed to cover the areas at the required frequency ({minimum} days at least)",
  },
  notEnoughDaysForZonesDetail: {
    ar: "الحد الأدنى لكل مجموعة: {details}.",
    en: "Minimum days per group: {details}.",
  },
  notEnoughDaysForZonesZone: {
    ar: "{zone}: {days} يوم",
    en: "{zone}: {days}d",
  },
  notEnoughDaysForZonesAdvice: {
    ar: "كل مجموعة مناطق تحتاج أياماً خاصة بها (يوم واحد لكل مجموعة، بحد أقصى 15 زيارة في اليوم، وبفاصل 6-25 يوم بين زيارات الدكتور الواحد). أكبر مجموعة ترفع الحد الأدنى هي: {biggest}. لتغطية كل الزيارات: ادمج مناطق أكثر داخل مجموعات أقل، أو قلل الفريكونسي لبعض الدكاترة، أو مدد فترة البلان.",
    en: "Each area group needs its own days (one group per day, max 15 visits per day, 6-25 day gaps between a doctor's visits). The group driving the minimum most: {biggest}. To cover all visits: merge more areas into fewer groups, lower some doctors' frequency, or extend the plan period.",
  },
  planIncomplete: {
    ar: "الخطة غير مكتملة: تم توزيع {scheduled} من أصل {required} زيارة. الزيارات الناقصة موضحة بالأسفل.",
    en: "Plan is incomplete: {scheduled} of {required} visits scheduled. The missing visits are listed below.",
  },
  doctorScheduledVsRequired: {
    ar: "{name}: المطلوب {required} زيارة والمجدول {scheduled}",
    en: "{name}: required {required} visits, scheduled {scheduled}",
  },
  moreIncompleteDoctors: {
    ar: "...و {count} دكاترة آخرين غير مكتملين",
    en: "...and {count} more incomplete doctors",
  },
  frequencyNotAchievable: {
    ar: "{name}: الفريكونسي {required} لا يمكن تحقيقه داخل فترة البلان؛ يحتاج {minimumSpan} يوم على الأقل بين أول وآخر زيارة بفاصل {minGap} أيام، وفترة البلان {periodSpan} يوم فقط.",
    en: "{name}: a frequency of {required} cannot fit inside the plan period; it needs at least {minimumSpan} days between the first and last visit with a {minGap}-day gap, and the plan period is only {periodSpan} days.",
  },
  howToComplete: {
    ar: "لإكمال الخطة: قلل الفريكونسي للدكاترة الناقصين، أو وسّع فترة البلان من الإعدادات، أو قلل أيام الإجازات والاجتماعات المستبعدة.",
    en: "To complete the plan: lower the frequency of the incomplete doctors, widen the plan period in Settings, or remove some excluded holidays and meeting days.",
  },
  cannotScheduleAll: {
    ar: "تعذر توزيع جميع الزيارات المطلوبة بالكامل",
    en: "Could not schedule all of the required visits",
  },
  averageExceedsMax: {
    ar: "متوسط الزيارات اليومي يتجاوز الحد الأقصى {max}",
    en: "The daily visit average exceeds the maximum of {max}",
  },
  averageFarFromTarget: {
    ar: "متوسط الزيارات {average}، وهو بعيد نسبياً عن المستهدف {target}. لم يتم تغيير تكرار زيارات الدكاترة للوصول إليه.",
    en: "Visit average is {average}, relatively far from the {target} target. Doctor visit frequencies were not changed to reach it.",
  },
  unknownValue: {
    ar: "غير محدد",
    en: "Unassigned",
  },
  excelNoData: {
    ar: "ملف Excel لا يحتوي على بيانات.",
    en: "The Excel file contains no data.",
  },
  excelMissingColumns: {
    ar: "الأعمدة التالية غير موجودة في الملف: {columns}",
    en: "These columns are missing from the file: {columns}",
  },
  excelNoValidDoctors: {
    ar: "ملف Excel لا يحتوي على بيانات دكاترة صالحة.",
    en: "The Excel file contains no valid doctor data.",
  },
  excelReadError: {
    ar: "حصل خطأ أثناء قراءة ملف Excel.",
    en: "Something went wrong while reading the Excel file.",
  },
};

export function tt(key, params) {
  const entry = M[key];
  let text = entry ? entry[currentLang] || entry.ar : key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}

const DAY_NAMES_AR = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

const DAY_NAMES_EN = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Display name for a weekday. Accepts either a 0-6 index (Sunday first)
// or a stored Arabic day name, and renders it in the active language.
export function dayName(day, lang) {
  const useLang = lang || currentLang;
  let index = -1;
  if (typeof day === "number") {
    index = day;
  } else {
    const normalized = String(day)
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .trim();
    index = DAY_NAMES_AR.findIndex(
      (name) => name.replace(/[أإآ]/g, "ا").replace(/ة/g, "ه") === normalized
    );
  }
  if (index < 0) return String(day);
  return useLang === "en" ? DAY_NAMES_EN[index] : DAY_NAMES_AR[index];
}
