import * as XLSX from "xlsx";

// The planner truly needs three things per doctor: a name, an area
// (brick) to group geographically, and a visit frequency. Everything
// else is optional display/context data. Headers are matched flexibly
// (English/Arabic variants, any spacing or case) and unknown columns
// are ignored so real-world sheets with totals and extra columns load.

function normalizeHeader(header) {
  return String(header ?? "")
    .replace(/[ً-ْٰ]/g, "") // Arabic diacritics
    .replace(/ـ/g, "") // tatweel
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .toLowerCase()
    .replace(/[_\-–—/\\().,:*#%[\]{}]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const FIELDS = {
  name: {
    label: "اسم الدكتور",
    example: "Name",
    required: true,
    aliases: [
      "name", "doctor name", "dr name", "doctor", "dr", "physician",
      "الاسم", "اسم", "اسم الدكتور", "الدكتور", "دكتور", "اسم الطبيب", "الطبيب",
    ],
  },
  brick: {
    label: "المنطقة / البريك",
    example: "Brick",
    required: true,
    aliases: [
      "brick", "بريك", "sub area", "subarea", "المنطقه الفرعيه",
      "area", "المنطقه", "منطقه", "region", "الاقليم", "اقليم",
    ],
  },
  currentFrequency: {
    label: "الفريكونسي (عدد الزيارات)",
    example: "Current Frequency",
    required: true,
    aliases: [
      "current frequency", "frequency", "freq", "visit frequency",
      "visits per month", "number of visits", "no of visits", "visits",
      "الفريكونسي", "فريكونسي", "التكرار", "تكرار", "عدد الزيارات",
      "الزيارات", "عدد الزيارات الشهريه", "معدل الزيارات",
    ],
  },
  // Optional fields: used for display/context only, never required.
  specialty: {
    label: "التخصص",
    required: false,
    aliases: ["specialty", "speciality", "التخصص", "تخصص"],
  },
  workplace: {
    label: "مكان العمل",
    required: false,
    aliases: ["workplace", "work place", "مكان العمل", "جهه العمل", "المستشفي"],
  },
  parameters: {
    label: "Parameters",
    required: false,
    aliases: ["parameters", "parameter", "باراميترات"],
  },
  area: {
    label: "Area",
    required: false,
    aliases: ["area name", "المنطقه الرئيسيه", "district area"],
  },
  district: {
    label: "District",
    required: false,
    aliases: ["district", "الحي", "القسم"],
  },
  territory: {
    label: "Territory",
    required: false,
    aliases: ["territory", "تيريتوري", "النطاق"],
  },
};

function buildColumnLookup(actualColumns) {
  // normalized header -> original header (first occurrence wins)
  const byNormalized = new Map();
  actualColumns.forEach((column) => {
    const normalized = normalizeHeader(column);
    if (normalized && !byNormalized.has(normalized)) {
      byNormalized.set(normalized, column);
    }
  });

  const lookup = {};
  Object.entries(FIELDS).forEach(([field, config]) => {
    for (const alias of config.aliases) {
      const found = byNormalized.get(normalizeHeader(alias));
      if (found !== undefined) {
        lookup[field] = found;
        break;
      }
    }
  });
  return lookup;
}

const ARABIC_DIGITS = /[٠-٩۰-۹]/g;
function parseFrequency(value) {
  if (value === null || value === undefined) return 0;
  const ascii = String(value).replace(ARABIC_DIGITS, (d) =>
    String("٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹".indexOf(d) % 10)
  );
  const match = ascii.match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function isSummaryRow(name) {
  const normalized = normalizeHeader(name);
  return (
    normalized === "" ||
    /^(total|grand total|subtotal|sum)(\s|$)/.test(normalized) ||
    /^(المجموع|مجموع|الاجمالي|اجمالي)(\s|$)/.test(normalized)
  );
}

export function importDoctorsFromExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, {
          type: "array",
        });

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        const rows = XLSX.utils.sheet_to_json(firstSheet, {
          defval: "",
          raw: false,
        });

        if (rows.length === 0) {
          throw new Error("ملف Excel لا يحتوي على بيانات.");
        }

        const actualColumns = Object.keys(rows[0]);
        const lookup = buildColumnLookup(actualColumns);

        const missing = Object.entries(FIELDS)
          .filter(([, config]) => config.required)
          .filter(([field]) => lookup[field] === undefined)
          .map(
            ([, config]) => `${config.label} (${config.example})`
          );

        if (missing.length > 0) {
          throw new Error(
            `الأعمدة التالية غير موجودة في الملف: ${missing.join("، ")}`
          );
        }

        const get = (row, field) =>
          lookup[field] !== undefined ? String(row[lookup[field]] ?? "").trim() : "";

        const doctors = rows
          .filter((row) => !isSummaryRow(row[lookup.name]))
          .map((row, index) => ({
            id: index + 1,
            name: get(row, "name"),
            specialty: get(row, "specialty"),
            workplace: get(row, "workplace"),
            parameters: get(row, "parameters"),
            currentFrequency: parseFrequency(row[lookup.currentFrequency]),
            brick: get(row, "brick"),
            area: get(row, "area"),
            district: get(row, "district"),
            territory: get(row, "territory"),
            schedule: [],
          }));

        if (doctors.length === 0) {
          throw new Error("ملف Excel لا يحتوي على بيانات دكاترة صالحة.");
        }

        resolve(doctors);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("حصل خطأ أثناء قراءة ملف Excel."));
    };

    reader.readAsArrayBuffer(file);
  });
}
