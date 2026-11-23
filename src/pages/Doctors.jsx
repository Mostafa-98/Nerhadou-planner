
import { usePersistentState } from "../utils/usePersistentState";
import { useMemo, useState } from "react";
import {
    Upload,
    Users,
    FileSpreadsheet,
    Search,
    SlidersHorizontal,
    X,
    Trash2,
    ChevronLeft,
    ChevronRight,
    MapPinned,
    Stethoscope,
    RotateCcw,
} from "lucide-react";
import { importDoctorsFromExcel } from "../utils/excelImporter";
import { useI18n } from "../i18n";

function Doctors() {
    const { t } = useI18n();
    const [doctors, setDoctors] = usePersistentState(
        "visit-planner-doctors",
        []
    );
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");
    const [searchTerm, setSearchTerm] = useState("");
    const [specialtyFilter, setSpecialtyFilter] = useState("all");
    const [brickFilter, setBrickFilter] = useState("all");
    const [sortBy, setSortBy] = useState("name");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const specialties = useMemo(
        () =>
            [...new Set(
                doctors
                    .map((doctor) => String(doctor.specialty || "").trim())
                    .filter(Boolean)
            )].sort((a, b) => a.localeCompare(b, "ar")),
        [doctors]
    );

    const bricks = useMemo(
        () =>
            [...new Set(
                doctors
                    .map((doctor) => String(doctor.brick || "").trim())
                    .filter(Boolean)
            )].sort((a, b) => a.localeCompare(b, "ar")),
        [doctors]
    );

    const filteredDoctors = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLocaleLowerCase("ar");

        return doctors
            .filter((doctor) => {
                const searchableText = [
                    doctor.name,
                    doctor.specialty,
                    doctor.brick,
                    doctor.workplace,
                    doctor.parameters,
                ].join(" ").toLocaleLowerCase("ar");

                const matchesSearch =
                    !normalizedSearch ||
                    searchableText.includes(normalizedSearch);
                const matchesSpecialty =
                    specialtyFilter === "all" ||
                    doctor.specialty === specialtyFilter;
                const matchesBrick =
                    brickFilter === "all" ||
                    doctor.brick === brickFilter;

                return matchesSearch && matchesSpecialty && matchesBrick;
            })
            .sort((first, second) => {
                if (sortBy === "frequency") {
                    return (
                        (Number(second.currentFrequency) || 0) -
                        (Number(first.currentFrequency) || 0)
                    );
                }

                if (sortBy === "brick") {
                    return String(first.brick).localeCompare(
                        String(second.brick),
                        "ar"
                    );
                }

                return String(first.name).localeCompare(
                    String(second.name),
                    "ar"
                );
            });
    }, [doctors, searchTerm, specialtyFilter, brickFilter, sortBy]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredDoctors.length / pageSize)
    );
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const pageStart = (safeCurrentPage - 1) * pageSize;
    const visibleDoctors = filteredDoctors.slice(
        pageStart,
        pageStart + pageSize
    );

    const totalFrequency = doctors.reduce(
        (sum, doctor) => sum + (Number(doctor.currentFrequency) || 0),
        0
    );

    const averageFrequency = doctors.length
        ? (totalFrequency / doctors.length).toFixed(1)
        : "0";

    const resetFilters = () => {
        setSearchTerm("");
        setSpecialtyFilter("all");
        setBrickFilter("all");
        setSortBy("name");
        setCurrentPage(1);
    };

    const handleFileImport = async (event) => {
        const file = event.target.files[0];

        if (!file) return;

        setLoading(true);
        setMessage("");
        setMessageType("success");

        try {
            const importedDoctors = await importDoctorsFromExcel(file);

            setDoctors(importedDoctors);
            resetFilters();
            setMessage(
                `تم استيراد ${importedDoctors.length} دكتور بنجاح`
            );
        } catch (error) {
            setMessageType("error");
            setMessage(error.message || "حصل خطأ أثناء استيراد الملف");
        } finally {
            setLoading(false);
            event.target.value = "";
        }
    };

    const clearDoctors = () => {
        if (
            !doctors.length ||
            !window.confirm("هل تريد حذف جميع الدكاترة المسجلين؟")
        ) {
            return;
        }

        setDoctors([]);
        resetFilters();
        setMessage("تم حذف بيانات الدكاترة.");
        setMessageType("success");
    };

    return (
        <div className="doctors-page">
            <div className="welcome-section doctors-header">
                <div>
                    <h1>{t("doctorsPageTitle")}</h1>
                    <p>{t("doctorsPageSubtitle")}</p>
                </div>

                <label className="primary-button doctors-import-button">
                    <Upload size={18} />
                    {t("importExcel")}

                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileImport}
                        hidden
                    />
                </label>
            </div>

            {message && (
                <div className={`notice-message ${messageType}`}>
                    <span>{message}</span>
                    <button
                        type="button"
                        onClick={() => setMessage("")}
                        aria-label="إغلاق الرسالة"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="doctor-stats-grid">
                <div className="doctor-stat-card">
                    <div className="stat-icon blue">
                        <Users size={22} />
                    </div>
                    <div>
                        <span>إجمالي الدكاترة</span>
                        <strong>{doctors.length}</strong>
                    </div>
                </div>

                <div className="doctor-stat-card">
                    <div className="stat-icon green">
                        <Stethoscope size={22} />
                    </div>
                    <div>
                        <span>التخصصات المسجلة</span>
                        <strong>{specialties.length}</strong>
                    </div>
                </div>

                <div className="doctor-stat-card">
                    <div className="stat-icon orange">
                        <MapPinned size={22} />
                    </div>
                    <div>
                        <span>المناطق المسجلة</span>
                        <strong>{bricks.length}</strong>
                    </div>
                </div>

                <div className="doctor-stat-card">
                    <div className="stat-icon purple">
                        <FileSpreadsheet size={22} />
                    </div>
                    <div>
                        <span>متوسط Frequency</span>
                        <strong>{averageFrequency}</strong>
                    </div>
                </div>
            </div>

            <div className="panel doctors-table-panel">
                <div className="panel-heading doctors-panel-heading">
                    <div>
                        <span className="panel-kicker">قاعدة البيانات</span>
                        <h2>قائمة الدكاترة</h2>
                    </div>

                    {doctors.length > 0 && (
                        <button
                            type="button"
                            className="clear-doctors-button"
                            onClick={clearDoctors}
                        >
                            <Trash2 size={16} />
                            مسح القائمة
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="doctors-loading">
                        <div className="loading-spinner" />
                        <strong>جاري قراءة ملف Excel</strong>
                        <span>يرجى الانتظار حتى اكتمال الاستيراد</span>
                    </div>
                ) : doctors.length === 0 ? (
                    <label className="doctors-empty-state">
                        <div className="empty-file-icon">
                            <FileSpreadsheet size={34} />
                        </div>
                        <h3>لا توجد بيانات دكاترة حتى الآن</h3>
                        <p>استورد ملف Excel لبدء تنظيم الزيارات</p>
                        <span className="empty-import-action">
                            <Upload size={17} />
                            اختيار ملف Excel
                        </span>
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileImport}
                            hidden
                        />
                    </label>
                ) : (
                    <>
                        <div className="doctor-toolbar">
                            <label className="doctor-search">
                                <Search size={17} />
                                <input
                                    type="search"
                                    value={searchTerm}
                                    onChange={(event) => {
                                        setSearchTerm(event.target.value);
                                        setCurrentPage(1);
                                    }}
                                    placeholder="ابحث بالاسم أو التخصص أو المنطقة..."
                                />
                            </label>

                            <label className="doctor-select">
                                <SlidersHorizontal size={15} />
                                <select
                                    value={specialtyFilter}
                                    onChange={(event) => {
                                        setSpecialtyFilter(event.target.value);
                                        setCurrentPage(1);
                                    }}
                                    aria-label="تصفية التخصص"
                                >
                                    <option value="all">كل التخصصات</option>
                                    {specialties.map((specialty) => (
                                        <option value={specialty} key={specialty}>
                                            {specialty}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="doctor-select">
                                <MapPinned size={15} />
                                <select
                                    value={brickFilter}
                                    onChange={(event) => {
                                        setBrickFilter(event.target.value);
                                        setCurrentPage(1);
                                    }}
                                    aria-label="تصفية المنطقة"
                                >
                                    <option value="all">كل المناطق</option>
                                    {bricks.map((brick) => (
                                        <option value={brick} key={brick}>
                                            {brick}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="doctor-select">
                                <select
                                    value={sortBy}
                                    onChange={(event) => setSortBy(event.target.value)}
                                    aria-label="ترتيب الدكاترة"
                                >
                                    <option value="name">الترتيب حسب الاسم</option>
                                    <option value="frequency">الأعلى Frequency</option>
                                    <option value="brick">حسب المنطقة</option>
                                </select>
                            </label>

                            {(searchTerm ||
                                specialtyFilter !== "all" ||
                                brickFilter !== "all" ||
                                sortBy !== "name") && (
                                <button
                                    type="button"
                                    className="reset-filters-button"
                                    onClick={resetFilters}
                                    title="إعادة ضبط الفلاتر"
                                >
                                    <RotateCcw size={15} />
                                </button>
                            )}
                        </div>

                        <div className="doctors-results-summary">
                            <span>
                                عرض <strong>{visibleDoctors.length}</strong> من{" "}
                                <strong>{filteredDoctors.length}</strong> نتيجة
                            </span>
                        </div>

                        {filteredDoctors.length === 0 ? (
                            <div className="no-filter-results">
                                <Search size={28} />
                                <h3>لا توجد نتائج مطابقة</h3>
                                <p>جرّب تغيير كلمات البحث أو إزالة الفلاتر.</p>
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={resetFilters}
                                >
                                    إعادة ضبط البحث
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="doctors-table-scroll">
                                    <table className="doctors-table">
                                        <thead>
                                            <tr>
                                                <th>الطبيب</th>
                                                <th>التخصص</th>
                                                <th>Parameters</th>
                                                <th>Current Frequency</th>
                                                <th>المنطقة</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {visibleDoctors.map((doctor) => (
                                                <tr key={doctor.id}>
                                                    <td>
                                                        <div className="doctor-name-cell">
                                                            <div className="doctor-avatar">
                                                                {String(doctor.name || "?")
                                                                    .trim()
                                                                    .charAt(0)}
                                                            </div>
                                                            <div>
                                                                <strong>{doctor.name || "غير معروف"}</strong>
                                                                {doctor.workplace && (
                                                                    <small>{doctor.workplace}</small>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="specialty-badge">
                                                            {doctor.specialty || "غير محدد"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {doctor.parameters || "—"}
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`frequency-badge ${
                                                                Number(doctor.currentFrequency) > 0
                                                                    ? ""
                                                                    : "zero"
                                                            }`}
                                                        >
                                                            {doctor.currentFrequency || 0}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="brick-cell">
                                                            <MapPinned size={15} />
                                                            {doctor.brick || "غير محدد"}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {totalPages > 1 && (
                                    <div className="doctors-pagination">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setCurrentPage((page) =>
                                                    Math.max(1, page - 1)
                                                )
                                            }
                                            disabled={safeCurrentPage === 1}
                                            aria-label="الصفحة السابقة"
                                        >
                                            <ChevronRight size={17} />
                                        </button>

                                        <span>
                                            صفحة {safeCurrentPage} من {totalPages}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setCurrentPage((page) =>
                                                    Math.min(totalPages, page + 1)
                                                )
                                            }
                                            disabled={safeCurrentPage === totalPages}
                                            aria-label="الصفحة التالية"
                                        >
                                            <ChevronLeft size={17} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Doctors;
