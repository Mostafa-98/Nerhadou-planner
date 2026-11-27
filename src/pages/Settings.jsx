import { useRef, useState } from "react";

import { useI18n } from "../i18n";
import { dayName } from "../i18n/engineText.js";
import { exportAllData, importAllData } from "../utils/backup";

import {
  CalendarDays,
  CalendarCheck,
  CalendarOff,
  Plus,
  Trash2,
  Database,
  Download,
  Upload,
  ClipboardPaste,
} from "lucide-react";
import { parseGroupsText, ungroupedAreas } from "../utils/areaGrouping";

const weekDays = [
  "السبت",
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
];

function Settings({
  callRate,
  handleCallRateChange,
  zoneGroups,
  setZoneGroups,
  doctors = [],
  workingDays,
  toggleWorkingDay,
  holidays,
  holidayDate,
  setHolidayDate,
  addHoliday,
  removeHoliday,
  meetings,
  meetingDate,
  setMeetingDate,
  addMeeting,
  removeMeeting,
  formatDate,
  planStartDate,
  setPlanStartDate,
  planEndDate,
  setPlanEndDate,
  planCalculation,
}) {
  const { language } = useI18n();
  const ar = language === "ar";
  const [groupInputs, setGroupInputs] = useState({});
  const [selectedGroup, setSelectedGroup] = useState(0);
  const [pasteText, setPasteText] = useState("");
  const [pastePreview, setPastePreview] = useState(null);

  const ungroupedSheetAreas = ungroupedAreas(doctors, zoneGroups);

  const addAreaToGroup = (groupIndex, area) => {
    if (!area) return;
    setZoneGroups((current) =>
      current.map((group, index) => {
        const without = group.filter((item) => item !== area);
        if (index === groupIndex) {
          return [...without, area];
        }
        return without;
      })
    );
  };

  const handlePastePreview = () => {
    if (!pasteText.trim()) return;
    setPastePreview(parseGroupsText(pasteText, doctors));
  };

  const applyPastedGroups = () => {
    if (!pastePreview || !pastePreview.groups.length) return;
    setZoneGroups(pastePreview.groups);
    setPastePreview(null);
    setPasteText("");
  };
  const backupFileRef = useRef(null);
  const [backupMessage, setBackupMessage] = useState("");

  const handleBackupImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const count = await importAllData(file);
      setBackupMessage(
        ar
          ? `تم استيراد ${count} إعداد. سيتم تحديث الصفحة الآن.`
          : `Imported ${count} settings. The page will reload now.`
      );
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      setBackupMessage(
        ar
          ? "الملف غير صالح. اختر ملف نسخة احتياطية تم تصديره من التطبيق."
          : "Invalid file. Choose a backup file exported from this app."
      );
    }
  };

  const updateGroupInput = (groupIndex, value) => {
    setGroupInputs((current) => ({
      ...current,
      [groupIndex]: value,
    }));
  };

  const addBrickToGroup = (groupIndex) => {
    const brick = (groupInputs[groupIndex] || "").trim();

    if (!brick) return;

    setZoneGroups((current) =>
      current.map((group, index) => {
        const without = group.filter((item) => item !== brick);

        if (index === groupIndex) {
          return [...without, brick];
        }

        return without;
      })
    );

    updateGroupInput(groupIndex, "");
  };

  const removeBrickFromGroup = (groupIndex, brick) => {
    setZoneGroups((current) =>
      current
        .map((group, index) =>
          index === groupIndex
            ? group.filter((item) => item !== brick)
            : group
        )
        .filter((group) => group.length > 0)
    );
  };

  const addGroup = () => {
    setZoneGroups((current) => [...current, [ar ? "منطقة جديدة" : "New area"]]);
  };

  const removeGroup = (groupIndex) => {
    setZoneGroups((current) =>
      current.filter((_, index) => index !== groupIndex)
    );
  };

  return (
    <div className="settings-page">
      <div className="welcome-section">
        <div>
          <h1>{ar ? "إعدادات النظام" : "System Settings"}</h1>
          <p>
            {ar ? "خصص أهداف الزيارات وأيام العمل بما يناسب طبيعة عملك." : "Tune visit targets and working days to fit how you work."}
          </p>
        </div>
      </div>

      {/* Call Rate Settings */}
      <div className="panel settings-panel">
        <div className="panel-heading">
          <h3>{ar ? "إعدادات معدل الزيارات" : "Call Rate Settings"}</h3>
          <span className="status">{ar ? "إعداد شخصي" : "Personal setting"}</span>
        </div>

        <div className="setting-item">
          <div>
            <strong>Call Rate Target</strong>
            <p>{ar ? "عدد الزيارات المستهدف يومياً" : "Targeted visits per day"}</p>
          </div>

          <div className="setting-input">
            <input
              type="number"
              min="1"
              max="15"
              step="0.5"
              value={callRate}
              onChange={(event) =>
                handleCallRateChange(event.target.value)
              }
              placeholder="12.5"
            />

            <span>{ar ? "زيارة / يوم" : "visits / day"}</span>
          </div>
        </div>

        <div className="setting-note">
          <strong>{ar ? "معلومة مهمة" : "Good to know"}</strong>
          <p>
            {ar ? "Call Rate هو متوسط الزيارات المستهدف يومياً لفترة البلان، والبلان بيتوزع حواليه. الحد الأقصى اليومي المسموح به هو 15 زيارة، ولا يتم تقليل تكرار زيارات الدكاترة للوصول إليه." : "Call Rate is the targeted daily visit average for the plan period, and the plan is distributed around it. The daily maximum is 15 visits, and doctor visit frequencies are never reduced to reach it."}
          </p>
        </div>
      </div>

      {/* Zone Groups */}
      <div className="panel settings-panel">
        <div className="panel-heading">
          <h3>{ar ? "مجموعات المناطق" : "Area Groups"}</h3>
          <span className="status">{zoneGroups.length} {ar ? "مجموعات" : "groups"}</span>
        </div>

        <p className="section-description">
          {ar ? "المناطق الموجودة في نفس المجموعة يمكن جدولتها مع بعض في نفس اليوم. أي منطقة مش موجودة في أي مجموعة بتتجدول في أيام لوحدها، والبلان مش هيخلط منطقتين بعيدتين في يوم واحد." : "Areas in the same group can share a day. An area that is not in any group gets its own days, and the plan never mixes two distant areas on the same day."}
        </p>

        <div className="paste-groups-box">
          <label>
            {ar ? "لصق المجموعات كنص" : "Paste groups as text"}
          </label>
          <textarea
            rows={4}
            value={pasteText}
            onChange={(event) => { setPasteText(event.target.value); setPastePreview(null); }}
            placeholder={ar
              ? "كل مجموعة في سطر، والمناطق مفصولة بفاصلة. مثال:\nمنوف, تتا, شبرا بلوله\nاشمون, طليا, سمدون"
              : "One group per line, areas separated by commas. Example:\nMenouf, Tata, Shubra Baloula\nAshmoun, Talia, Samadoun"}
          />
          <div className="export-actions" style={{ marginTop: 8 }}>
            <button type="button" className="export-button" onClick={handlePastePreview}>
              <ClipboardPaste size={15} />
              {ar ? "معاينة المجموعات" : "Preview groups"}
            </button>
          </div>

          {pastePreview && (
            <div className="paste-preview">
              {pastePreview.groups.map((group, i) => (
                <div className="zone-group-bricks" key={i} style={{ marginBottom: 6 }}>
                  <strong style={{ marginInlineEnd: 6 }}>{ar ? `مجموعة ${i + 1}:` : `Group ${i + 1}:`}</strong>
                  {group.map((brick) => (
                    <span className="zone-brick-chip" key={brick}>{brick}</span>
                  ))}
                </div>
              ))}
              {pastePreview.unmatched.length > 0 && (
                <p className="paste-warning">
                  {ar
                    ? `لم يتم مطابقة: ${pastePreview.unmatched.join("، ")} — راجع الأسماء مقارنة بالملف.`
                    : `Not matched: ${pastePreview.unmatched.join(", ")} — check the names against the imported sheet.`}
                </p>
              )}
              {pastePreview.missing.length > 0 && (
                <p className="paste-warning">
                  {ar
                    ? `مناطق من الملف بدون مجموعة: ${pastePreview.missing.join("، ")}`
                    : `Sheet areas left ungrouped: ${pastePreview.missing.join(", ")}`}
                </p>
              )}
              <div className="export-actions" style={{ marginTop: 8 }}>
                <button type="button" className="export-button" onClick={applyPastedGroups} disabled={!pastePreview.groups.length}>
                  <ClipboardPaste size={15} />
                  {ar ? "استبدال المجموعات الحالية" : "Replace current groups"}
                </button>
                <button type="button" className="export-button" onClick={() => setPastePreview(null)}>
                  {ar ? "إلغاء" : "Cancel"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="zone-groups-list">
          {zoneGroups.map((group, groupIndex) => (
            <div
              className={`zone-group${selectedGroup === groupIndex ? " zone-group-selected" : ""}`}
              key={groupIndex}
              onClick={() => setSelectedGroup(groupIndex)}
            >
              <div className="zone-group-bricks">
                {group.map((brick) => (
                  <span className="zone-brick-chip" key={brick}>
                    {brick}

                    <button
                      type="button"
                      aria-label={ar ? `حذف ${brick}` : `Delete ${brick}`}
                      onClick={() =>
                        removeBrickFromGroup(groupIndex, brick)
                      }
                    >
                      <Trash2 size={13} />
                    </button>
                  </span>
                ))}
              </div>

              <div className="zone-group-actions">
                <input
                  type="text"
                  value={groupInputs[groupIndex] || ""}
                  placeholder={ar ? "أضف منطقة للمجموعة" : "Add an area to the group"}
                  onChange={(event) =>
                    updateGroupInput(groupIndex, event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      addBrickToGroup(groupIndex);
                    }
                  }}
                />

                <button
                  type="button"
                  className="zone-group-add-brick"
                  aria-label={ar ? "إضافة المنطقة" : "Add area"}
                  onClick={() => addBrickToGroup(groupIndex)}
                >
                  <Plus size={15} />
                </button>

                <button
                  type="button"
                  className="zone-group-delete"
                  aria-label={ar ? "حذف المجموعة" : "Delete group"}
                  onClick={() => removeGroup(groupIndex)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="zone-group-add">
          <button type="button" onClick={addGroup}>
            <Plus size={15} />
            <span>{ar ? "مجموعة جديدة" : "New group"}</span>
          </button>
        </div>

        {ungroupedSheetAreas.length > 0 && (
          <div className="ungrouped-areas">
            <p>
              {ar
                ? "مناطق من ملفك لسه مش في أي مجموعة — دوس على المنطقة عشان تضيفها للمجموعة المحددة:"
                : "Areas from your sheet not in any group yet - tap an area to add it to the selected group:"}
            </p>
            <div className="zone-group-bricks">
              {ungroupedSheetAreas.map((area) => (
                <button
                  type="button"
                  className="zone-brick-chip zone-brick-add"
                  key={area}
                  onClick={() => addAreaToGroup(Math.min(selectedGroup, Math.max(zoneGroups.length - 1, 0)), area)}
                >
                  <Plus size={12} /> {area}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="setting-note">
          <strong>{ar ? "معلومة مهمة" : "Good to know"}</strong>
          <p>
            {ar ? "البلان لا يخلط أبداً مناطق من مجموعتين مختلفتين في نفس اليوم، فأضف هنا فقط المناطق القريبة فعلاً من بعضها." : "The plan never mixes areas from two different groups on the same day, so only add areas that are genuinely close to each other."}
          </p>
        </div>
      </div>

      {/* Working Days */}
      <div className="panel settings-panel schedule-panel">
        <div className="panel-heading">
          <h3>{ar ? "أيام العمل الأسبوعية" : "Weekly Workdays"}</h3>
          <span className="status">{workingDays.length} {ar ? "أيام عمل" : "workdays"}</span>
        </div>

        <p className="section-description">
          {ar ? "اختار الأيام اللي متاح فيها تنفيذ الزيارات." : "Pick the days visits can take place."}
        </p>

        <div className="week-days-grid">
          {weekDays.map((day) => (
            <button
              type="button"
              key={day}
              className={`day-option ${workingDays.includes(day) ? "selected" : ""
                }`}
              onClick={() => toggleWorkingDay(day)}
            >
              {workingDays.includes(day) && (
                <CalendarCheck size={16} />
              )}

              <span>{dayName(day, language)}</span>
            </button>
          ))}
        </div>

        <div className="setting-note">
          <strong>{ar ? "عدد أيام العمل" : "Working days"}: {workingDays.length}</strong>
          <p>
            {ar ? "الأيام غير المحددة سيتم اعتبارها أيام راحة، ولن يتم توزيع زيارات عليها." : "Unselected days count as rest days and no visits are scheduled on them."}
          </p>
        </div>
      </div>

      {/* Holidays */}
      <div className="panel settings-panel schedule-panel">
        <div className="panel-heading">
          <h3>{ar ? "الإجازات والعطلات" : "Holidays"}</h3>
          <span className="status">{holidays.length} {ar ? "إجازات" : "holidays"}</span>
        </div>

        <p className="section-description">
          {ar ? "أضف الإجازات الرسمية أو الشخصية التي تريد استبعادها من البلان." : "Add official or personal holidays to exclude from the plan."}
        </p>

        <div className="date-add-row">
          <input
            type="date"
            value={holidayDate}
            onChange={(e) => setHolidayDate(e.target.value)}
            className="date-input"
          />

          <button
            type="button"
            className="setting-add-button"
            onClick={addHoliday}
            disabled={!holidayDate}
          >
            <Plus size={17} />
            {ar ? "إضافة إجازة" : "Add holiday"}
          </button>
        </div>

        <div className="date-list">
          {holidays.length === 0 ? (
            <div className="empty-dates">
              <CalendarOff size={23} />
              <span>{ar ? "لم تتم إضافة إجازات حتى الآن" : "No holidays added yet"}</span>
            </div>
          ) : (
            holidays.map((date) => (
              <div className="date-list-item" key={date}>
                <div>
                  <CalendarOff size={18} />
                  <span>{formatDate(date)}</span>
                </div>

                <button
                  type="button"
                  className="remove-date-button"
                  onClick={() => removeHoliday(date)}
                  title={ar ? "حذف الإجازة" : "Delete holiday"}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Meetings */}
      <div className="panel settings-panel schedule-panel">
        <div className="panel-heading">
          <h3>{ar ? "أيام الاجتماعات" : "Meeting Days"}</h3>
          <span className="status">{meetings.length} {ar ? "اجتماعات" : "meetings"}</span>
        </div>

        <p className="section-description">
          {ar ? "حدد مواعيد الاجتماعات حتى لا يتم جدولة زيارات في هذه الأيام." : "Set meeting days so no visits are scheduled on them."}
        </p>

        <div className="date-add-row">
          <input
            type="date"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
            className="date-input"
          />

          <button
            type="button"
            className="setting-add-button"
            onClick={addMeeting}
            disabled={!meetingDate}
          >
            <Plus size={17} />
            {ar ? "إضافة اجتماع" : "Add meeting"}
          </button>
        </div>

        <div className="date-list">
          {meetings.length === 0 ? (
            <div className="empty-dates">
              <CalendarDays size={23} />
              <span>{ar ? "لم تتم إضافة اجتماعات حتى الآن" : "No meetings added yet"}</span>
            </div>
          ) : (
            meetings.map((date) => (
              <div className="date-list-item" key={date}>
                <div>
                  <CalendarDays size={18} />
                  <span>{formatDate(date)}</span>
                </div>

                <button
                  type="button"
                  className="remove-date-button"
                  onClick={() => removeMeeting(date)}
                  title={ar ? "حذف الاجتماع" : "Delete meeting"}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Monthly Plan Period */}
      <div className="panel settings-panel schedule-panel">
        <div className="panel-heading">
          <h3>{ar ? "فترة البلان الشهري" : "Monthly Plan Period"}</h3>
          <span className="status">{ar ? "إعداد البلان" : "Plan setup"}</span>
        </div>

        <p className="section-description">
          {ar ? "حدد بداية ونهاية الفترة التي تريد إنشاء خطة الزيارات لها." : "Set the start and end of the period you want the visit plan for."}
        </p>

        <div className="plan-period-grid">
          <div className="setting-item">
            <div>
              <strong>{ar ? "تاريخ بداية البلان" : "Plan start date"}</strong>
              <p>{ar ? "أول يوم في الخطة" : "First day of the plan"}</p>
            </div>

            <input
              type="date"
              className="date-input"
              value={planStartDate}
              onChange={(e) => setPlanStartDate(e.target.value)}
            />
          </div>

          <div className="setting-item">
            <div>
              <strong>{ar ? "تاريخ نهاية البلان" : "Plan end date"}</strong>
              <p>{ar ? "آخر يوم في الخطة" : "Last day of the plan"}</p>
            </div>

            <input
              type="date"
              className="date-input"
              value={planEndDate}
              onChange={(e) => setPlanEndDate(e.target.value)}
            />
          </div>
        </div>

        {planStartDate &&
          planEndDate &&
          planStartDate > planEndDate && (
            <div className="setting-note">
              <strong>{ar ? "تنبيه" : "Note"}</strong>
              <p>{ar ? "تاريخ النهاية لازم يكون بعد تاريخ البداية." : "The end date must come after the start date."}</p>
            </div>
          )}

        <div className="plan-results-grid">
          <div className="plan-result-card">
            <span>{ar ? "أيام العمل الفعلية" : "Actual working days"}</span>

            <h2>
              {planCalculation.valid
                ? planCalculation.workingDaysCount
                : "—"}
            </h2>

            <small>{ar ? "بعد استبعاد الإجازات والاجتماعات" : "After excluding holidays and meetings"}</small>
          </div>

          <div className="plan-result-card">
            <span>{ar ? "Call Rate اليومي" : "Daily Call Rate"}</span>
            <h2>{callRate || "—"}</h2>
            <small>{ar ? "زيارة / يوم" : "visits / day"}</small>
          </div>

          <div className="plan-result-card">
            <span>{ar ? "إجمالي الزيارات المستهدف" : "Total targeted visits"}</span>

            <h2>
              {planCalculation.valid && callRate
                ? planCalculation.totalVisits.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })
                : "—"}
            </h2>

            <small>{ar ? "الطاقة الاستيعابية للفترة" : "Period capacity"}</small>
          </div>
        </div>

        <div className="setting-note">
          <strong>{ar ? "طريقة الحساب" : "How it is calculated"}</strong>
          <p>
            {ar ? "إجمالي الزيارات = أيام العمل الفعلية × Call Rate. يتم استبعاد أيام الراحة والإجازات والاجتماعات المسجلة." : "Total visits = actual working days x Call Rate. Rest days, holidays and registered meetings are excluded."}
          </p>
        </div>
      </div>

      <div className="settings-card" style={{ marginTop: 20 }}>
        <div className="section-header">
          <div>
            <h2>{ar ? "النسخ الاحتياطي" : "Backup"}</h2>
            <p>
              {ar
                ? "احفظ كل بيانات التطبيق في ملف واحد، أو استرجعها على هذا الجهاز أو أي جهاز آخر."
                : "Save all app data to one file, or restore it on this or any other device."}
            </p>
          </div>
          <Database size={24} />
        </div>
        <div className="export-actions">
          <button
            type="button"
            className="export-button"
            onClick={() => {
              const count = exportAllData();
              setBackupMessage(
                ar
                  ? `تم تصدير ${count} إعداد في ملف النسخة الاحتياطية.`
                  : `Exported ${count} settings to the backup file.`
              );
            }}
          >
            <Download size={15} />
            {ar ? "تصدير نسخة احتياطية" : "Export backup"}
          </button>
          <button
            type="button"
            className="export-button"
            onClick={() => backupFileRef.current?.click()}
          >
            <Upload size={15} />
            {ar ? "استيراد نسخة احتياطية" : "Import backup"}
          </button>
          <input
            ref={backupFileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: "none" }}
            onChange={handleBackupImport}
          />
        </div>
        {backupMessage && (
          <p style={{ marginTop: 12 }}>{backupMessage}</p>
        )}
      </div>
    </div>
  );
}

export default Settings;