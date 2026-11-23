import * as XLSX from "xlsx";

const REQUIRED_COLUMNS = [
  "Name",
  "Specialty",
  "Current Frequency",
  "Brick",
];

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

        const missingColumns = REQUIRED_COLUMNS.filter(
          (column) => !actualColumns.includes(column)
        );

        if (missingColumns.length > 0) {
          throw new Error(
            `الأعمدة التالية غير موجودة: ${missingColumns.join(", ")}`
          );
        }

        const doctors = rows
          .filter((row) => String(row.Name).trim() !== "")
          .map((row, index) => ({
            id: index + 1,
            name: String(row.Name).trim(),
            specialty: String(row.Specialty).trim(),
            workplace: String(row.Workplace || "").trim(),
            parameters: String(row.Parameters || "").trim(),
            currentFrequency:
              Number(row["Current Frequency"]) || 0,
            brick: String(row.Brick).trim(),
            area: String(row.Area || "").trim(),
            district: String(row.District || "").trim(),
            territory: String(row.Territory || "").trim(),
            schedule: [],
          }));

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
