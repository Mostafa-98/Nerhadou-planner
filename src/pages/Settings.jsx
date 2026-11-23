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
  return (
    <div className="settings-page">
      <div className="welcome-section">
        <div>
          <h1>إعدادات النظام</h1>
          <p>
            خصص أهداف الزيارات وأيام العمل بما يناسب طبيعة عملك.
          </p>
        </div>
      </div>

      {/* Call Rate Settings */}
      <div className="panel settings-panel">
        <div className="panel-heading">
          <h3>إعدادات معدل الزيارات</h3>
          <span className="status">إعداد شخصي</span>
        </div>

        <div className="setting-item">
          <div>
            <strong>Call Rate Target</strong>
            <p>عدد الزيارات المستهدف يومياً</p>
          </div>

          <div className="setting-input">
            <input
              type="number"
              min="12.5"
              max="12.5"
              step="0.1"
              value={callRate}
              readOnly
              placeholder="12.5"
            />

            <span>زيارة / يوم</span>
          </div>
        </div>

        <div className="setting-note">
          <strong>معلومة مهمة</strong>
          <p>
            Call Rate = 12.5 هو متوسط مستهدف لفترة البلان.
            الحد الأقصى اليومي المسموح به هو 15 زيارة،
            ولا يتم تقليل تكرار زيارات الدكاترة للوصول إليه.
          </p>
        </div>
      </div>

      {/* Working Days */}
      <div className="panel settings-panel schedule-panel">
        <div className="panel-heading">
          <h3>أيام العمل الأسبوعية</h3>
          <span className="status">{workingDays.length} أيام عمل</span>
        </div>

        <p className="section-description">
          اختار الأيام اللي متاح فيها تنفيذ الزيارات.
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

              <span>{day}</span>
            </button>
          ))}
        </div>

        <div className="setting-note">
          <strong>عدد أيام العمل: {workingDays.length}</strong>
          <p>
            الأيام غير المحددة سيتم اعتبارها أيام راحة،
            ولن يتم توزيع زيارات عليها.
          </p>
        </div>
      </div>

      {/* Holidays */}
      <div className="panel settings-panel schedule-panel">
        <div className="panel-heading">
          <h3>الإجازات والعطلات</h3>
          <span className="status">{holidays.length} إجازات</span>
        </div>

        <p className="section-description">
          أضف الإجازات الرسمية أو الشخصية التي تريد استبعادها من البلان.
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
            إضافة إجازة
          </button>
        </div>

        <div className="date-list">
          {holidays.length === 0 ? (
            <div className="empty-dates">
              <CalendarOff size={23} />
              <span>لم تتم إضافة إجازات حتى الآن</span>
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
                  title="حذف الإجازة"
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
          <h3>أيام الاجتماعات</h3>
          <span className="status">{meetings.length} اجتماعات</span>
        </div>

        <p className="section-description">
          حدد مواعيد الاجتماعات حتى لا يتم جدولة زيارات في هذه الأيام.
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
            إضافة اجتماع
          </button>
        </div>

        <div className="date-list">
          {meetings.length === 0 ? (
            <div className="empty-dates">
              <CalendarDays size={23} />
              <span>لم تتم إضافة اجتماعات حتى الآن</span>
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
                  title="حذف الاجتماع"
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
          <h3>فترة البلان الشهري</h3>
          <span className="status">إعداد البلان</span>
        </div>

        <p className="section-description">
          حدد بداية ونهاية الفترة التي تريد إنشاء خطة الزيارات لها.
        </p>

        <div className="plan-period-grid">
          <div className="setting-item">
            <div>
              <strong>تاريخ بداية البلان</strong>
              <p>أول يوم في الخطة</p>
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
              <strong>تاريخ نهاية البلان</strong>
              <p>آخر يوم في الخطة</p>
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
              <strong>تنبيه</strong>
              <p>تاريخ النهاية لازم يكون بعد تاريخ البداية.</p>
            </div>
          )}

        <div className="plan-results-grid">
          <div className="plan-result-card">
            <span>أيام العمل الفعلية</span>

            <h2>
              {planCalculation.valid
                ? planCalculation.workingDaysCount
                : "—"}
            </h2>

            <small>بعد استبعاد الإجازات والاجتماعات</small>
          </div>

          <div className="plan-result-card">
            <span>Call Rate اليومي</span>
            <h2>{callRate || "—"}</h2>
            <small>زيارة / يوم</small>
          </div>

          <div className="plan-result-card">
            <span>إجمالي الزيارات المستهدف</span>

            <h2>
              {planCalculation.valid && callRate
                ? planCalculation.totalVisits.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })
                : "—"}
            </h2>

            <small>الطاقة الاستيعابية للفترة</small>
          </div>
        </div>

        <div className="setting-note">
          <strong>طريقة الحساب</strong>
          <p>
            إجمالي الزيارات = أيام العمل الفعلية × Call Rate.
            يتم استبعاد أيام الراحة والإجازات والاجتماعات المسجلة.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Settings;