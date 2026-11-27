import * as XLSX from "xlsx";

const norm = (s) =>
    String(s || "")
        .toLowerCase()
        .trim()
        .replace(/[ً-ْ]/g, "")
        .replace(/\s+/g, " ");

const fmt = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
    ).padStart(2, "0")}`;

function toISODate(value) {
    if (value == null || value === "") return null;
    if (value instanceof Date && !isNaN(value)) return fmt(value);
    if (typeof value === "number") {
        const d = XLSX.SSF.parse_date_code(value);
        if (d)
            return `${d.y}-${String(d.m).padStart(2, "0")}-${String(
                d.d
            ).padStart(2, "0")}`;
        return null;
    }
    const s = String(value).trim();
    const m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (m)
        return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
    const m2 = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (m2)
        return `${m2[3]}-${m2[2].padStart(2, "0")}-${m2[1].padStart(2, "0")}`;
    const p = Date.parse(s);
    if (!isNaN(p)) return fmt(new Date(p));
    return null;
}

const DOCTOR_HEADERS = [
    "doctor",
    "doctor name",
    "physician",
    "name",
    "الدكتور",
    "اسم الدكتور",
    "الاسم",
    "دكتور",
];
const DATE_HEADERS = [
    "date",
    "visit date",
    "day",
    "التاريخ",
    "تاريخ الزيارة",
    "اليوم",
];

// Parses an .xlsx/.xls/.csv actual-visits sheet into [{row, doctor, date}].
// Returns {rows, error} where error is "empty" | "headers" | null.
export function parseActualsFile(buffer) {
    const wb = XLSX.read(buffer, { type: "array", cellDates: true });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    if (!raw.length) return { rows: [], error: "empty" };
    const headers = raw[0].map((h) => norm(h));
    const di = headers.findIndex((h) =>
        DOCTOR_HEADERS.some((k) => h.includes(k))
    );
    const ti = headers.findIndex((h) => DATE_HEADERS.some((k) => h.includes(k)));
    if (di < 0 || ti < 0) return { rows: [], error: "headers" };
    const rows = [];
    for (let i = 1; i < raw.length; i++) {
        const doctor = String(raw[i][di] || "").trim();
        const date = toISODate(raw[i][ti]);
        if (!doctor && !date) continue;
        rows.push({ row: i + 1, doctor, date });
    }
    return { rows, error: null };
}

// Matches parsed rows against the current plan by doctor name + date.
// Returns {matched: [{visitId, doctor, date}], unmatched: [{row, doctor, date, reason}]}
// reason: "date" (unparseable), "noDoctor" (doctor not in plan), "noVisit" (no planned visit that day).
export function matchActuals(plan, rows) {
    const visits = (plan?.days || []).flatMap((d) => d.visits || []);
    const matched = [];
    const unmatched = [];
    const used = new Set();
    for (const r of rows) {
        if (!r.date) {
            unmatched.push({ ...r, reason: "date" });
            continue;
        }
        const key = norm(r.doctor);
        const visit = visits.find(
            (v) =>
                !used.has(v.id) &&
                v.date === r.date &&
                norm(v.doctorName) === key
        );
        if (visit) {
            used.add(visit.id);
            matched.push({
                visitId: visit.id,
                doctor: visit.doctorName,
                date: visit.date,
            });
        } else {
            const doctorKnown = visits.some((v) => norm(v.doctorName) === key);
            unmatched.push({ ...r, reason: doctorKnown ? "noVisit" : "noDoctor" });
        }
    }
    return { matched, unmatched };
}
