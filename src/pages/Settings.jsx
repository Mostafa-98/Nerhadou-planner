import { useState } from "react";

import { useI18n } from "../i18n";
import { dayName } from "../i18n/engineText.js";

import {
  CalendarDays,
  CalendarCheck,
  CalendarOff,
  Plus,
  Trash2,
} from "lucide-react";

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

        <div className="zone-groups-list">
          {zoneGroups.map((group, groupIndex) => (
            <div className="zone-group" key={groupIndex}>
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
    </div>
  );
}

export default Settings;