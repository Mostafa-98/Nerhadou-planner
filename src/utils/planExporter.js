import * as XLSX from "xlsx";

const HEADERS = {
    en: ["Date", "Day", "Doctor", "Specialty", "Brick", "Area", "Visit #"],
    ar: ["التاريخ", "اليوم", "الدكتور", "التخصص", "Brick", "Area", "رقم الزيارة"],
};

function dayName(date, ar) {
    return new Date(date + "T00:00:00").toLocaleDateString(
        ar ? "ar-EG" : "en-GB",
        { weekday: "long" }
    );
}

function planRows(plan, ar) {
    const rows = [];
    (plan?.days || []).forEach((day) => {
        (day.visits || []).forEach((visit) => {
            rows.push([
                day.date,
                dayName(day.date, ar),
                visit.doctorName || "",
                visit.specialty || "",
                visit.brick || "",
                visit.area || "",
                visit.visitNumber ?? "",
            ]);
        });
    });
    return rows;
}

export function exportPlanToExcel(plan, language) {
    const ar = language === "ar";
    const worksheet = XLSX.utils.aoa_to_sheet([
        HEADERS[ar ? "ar" : "en"],
        ...planRows(plan, ar),
    ]);
    worksheet["!cols"] = [
        { wch: 12 },
        { wch: 12 },
        { wch: 28 },
        { wch: 18 },
        { wch: 14 },
        { wch: 14 },
        { wch: 8 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        ar ? "الخطة" : "Plan"
    );
    const start = plan?.days?.[0]?.date || "plan";
    const end = plan?.days?.[plan.days.length - 1]?.date || "";
    XLSX.writeFile(workbook, `visit-plan-${start}-to-${end}.xlsx`);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

export function printPlanToPdf(plan, language) {
    const ar = language === "ar";
    const rows = planRows(plan, ar);
    const headers = HEADERS[ar ? "ar" : "en"];
    const title = ar ? "خطة الزيارات" : "Visit Plan";
    const start = plan?.days?.[0]?.date || "";
    const end = plan?.days?.[plan.days.length - 1]?.date || "";

    const html = `<!DOCTYPE html>
<html lang="${ar ? "ar" : "en"}" dir="${ar ? "rtl" : "ltr"}">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  body { font-family: "Segoe UI", Tahoma, Arial, sans-serif; margin: 24px; color: #17293e; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  p { margin: 0 0 16px; color: #5b6b7f; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #d5dee8; padding: 6px 8px; text-align: ${ar ? "right" : "left"}; }
  th { background: #eef3f9; }
  tr:nth-child(even) td { background: #f7fafd; }
  @media print { body { margin: 8mm; } }
</style>
</head>
<body>
<h1>${title}</h1>
<p>${start} &rarr; ${end} &middot; ${rows.length} ${ar ? "زيارة" : "visits"}</p>
<table>
<thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
<tbody>
${rows
    .map(
        (row) =>
            `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`
    )
    .join("\n")}
</tbody>
</table>
<script>window.onload = function () { window.print(); };</script>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) return false;
    win.document.write(html);
    win.document.close();
    return true;
}
