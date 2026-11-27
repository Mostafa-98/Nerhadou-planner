
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
    const { language, t } = useI18n();
    const ar = language === "ar";
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
                ar ? `تم استيراد ${importedDoctors.length} دكتور بنجاح` : `Imported ${importedDoctors.length} doctors successfully`
            );
        } catch (error) {
            setMessageType("error");
            setMessage(error.message || (ar ? "حصل خطأ أثناء استيراد الملف" : "Something went wrong while importing the file"));
        } finally {
            setLoading(false);
            event.target.value = "";
        }
    };

    const clearDoctors = () => {
        if (
            !doctors.length ||
            !window.confirm(ar ? "هل تريد حذف جميع الدكاترة المسجلين؟" : "Delete all registered doctors?")
        ) {
            return;
        }

        setDoctors([]);
        resetFilters();
        setMessage(ar ? "تم حذف بيانات الدكاترة." : "Doctor data deleted.");
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
                        aria-label={ar ? "إغلاق الرسالة" : "Dismiss message"}
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
                        <span>{ar ? "إجمالي الدكاترة" : "Total Doctors"}</span>
                        <strong>{doctors.length}</strong>
                    </div>
                </div>

                <div className="doctor-stat-card">
                    <div className="stat-icon green">
                        <Stethoscope size={22} />
                    </div>
                    <div>
                        <span>{ar ? "التخصصات المسجلة" : "Specialties"}</span>
                        <strong>{specialties.length}</strong>
                    </div>
                </div>

                <div className="doctor-stat-card">
                    <div className="stat-icon orange">
                        <MapPinned size={22} />
                    </div>
                    <div>
                        <span>{ar ? "المناطق المسجلة" : "Areas"}</span>
                        <strong>{bricks.length}</strong>
                    </div>
                </div>

                <div className="doctor-stat-card">
                    <div className="stat-icon purple">
                        <FileSpreadsheet size={22} />
                    </div>
                    <div>
                        <span>{ar ? "متوسط Frequency" : "Average Frequency"}</span>
                        <strong>{averageFrequency}</strong>
                    </div>
                </div>
            </div>

            <div className="panel doctors-table-panel">
                <div className="panel-heading doctors-panel-heading">
                    <div>
                        <span className="panel-kicker">{ar ? "قاعدة البيانات" : "Database"}</span>
                        <h2>{ar ? "قائمة الدكاترة" : "Doctor List"}</h2>
                    </div>

                    {doctors.length > 0 && (
                        <button
                            type="button"
                            className="clear-doctors-button"
                            onClick={clearDoctors}
                        >
                            <Trash2 size={16} />
                            {ar ? "مسح القائمة" : "Clear list"}
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="doctors-loading">
                        <div className="loading-spinner" />
                        <strong>{ar ? "جاري قراءة ملف Excel" : "Reading Excel file"}</strong>
                        <span>{ar ? "يرجى الانتظار حتى اكتمال الاستيراد" : "Please wait until the import finishes"}</span>
                    </div>
                ) : doctors.length === 0 ? (
                    <label className="doctors-empty-state">
                        <div className="empty-file-icon">
                            <FileSpreadsheet size={34} />
                        </div>
                        <h3>{ar ? "لا توجد بيانات دكاترة حتى الآن" : "No doctor data yet"}</h3>
                        <p>{ar ? "استورد ملف Excel لبدء تنظيم الزيارات" : "Import an Excel file to start organizing visits"}</p>
                        <span className="empty-import-action">
                            <Upload size={17} />
                            {ar ? "اختيار ملف Excel" : "Choose Excel file"}
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
                                    placeholder={ar ? "ابحث بالاسم أو التخصص أو المنطقة..." : "Search by name, specialty or area..."}
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
                                    aria-label={ar ? "تصفية التخصص" : "Filter by specialty"}
                                >
                                    <option value="all">{ar ? "كل التخصصات" : "All specialties"}</option>
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
                                    aria-label={ar ? "تصفية المنطقة" : "Filter by area"}
                                >
                                    <option value="all">{ar ? "كل المناطق" : "All areas"}</option>
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
                                    aria-label={ar ? "ترتيب الدكاترة" : "Sort doctors"}
                                >
                                    <option value="name">{ar ? "الترتيب حسب الاسم" : "Sort by name"}</option>
                                    <option value="frequency">{ar ? "الأعلى Frequency" : "Highest frequency"}</option>
                                    <option value="brick">{ar ? "حسب المنطقة" : "By area"}</option>
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
                                    title={ar ? "إعادة ضبط الفلاتر" : "Reset filters"}
                                >
                                    <RotateCcw size={15} />
                                </button>
                            )}
                        </div>

                        <div className="doctors-results-summary">
                            <span>
                                {ar ? "عرض" : "Showing"} <strong>{visibleDoctors.length}</strong> {ar ? "من" : "of"}{" "} <strong>{filteredDoctors.length}</strong> {ar ? "نتيجة" : "results"}
                            </span>
                        </div>

                        {filteredDoctors.length === 0 ? (
                            <div className="no-filter-results">
                                <Search size={28} />
                                <h3>{ar ? "لا توجد نتائج مطابقة" : "No matching results"}</h3>
                                <p>{ar ? "جرّب تغيير كلمات البحث أو إزالة الفلاتر." : "Try changing the search terms or removing filters."}</p>
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={resetFilters}
                                >
                                    {ar ? "إعادة ضبط البحث" : "Reset search"}
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="doctors-table-scroll">
                                    <table className="doctors-table">
                                        <thead>
                                            <tr>
                                                <th>{ar ? "الطبيب" : "Doctor"}</th>
                                                <th>{ar ? "التخصص" : "Specialty"}</th>
                                                <th>Parameters</th>
                                                <th>Current Frequency</th>
                                                <th>{ar ? "المنطقة" : "Area"}</th>
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
                                                                <strong>{doctor.name || (ar ? "غير معروف" : "Unknown")}</strong>
                                                                {doctor.workplace && (
                                                                    <small>{doctor.workplace}</small>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="specialty-badge">
                                                            {!doctor.specialty || doctor.specialty === "غير محدد" ? (ar ? "غير محدد" : "Unassigned") : doctor.specialty}
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
                                                            {!doctor.brick || doctor.brick === "غير محدد" ? (ar ? "غير محدد" : "Unassigned") : doctor.brick}
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
                                            aria-label={ar ? "الصفحة السابقة" : "Previous page"}
                                        >
                                            <ChevronRight size={17} />
                                        </button>

                                        <span>
                                            {ar ? "صفحة" : "Page"} {safeCurrentPage} {ar ? "من" : "of"} {totalPages}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setCurrentPage((page) =>
                                                    Math.min(totalPages, page + 1)
                                                )
                                            }
                                            disabled={safeCurrentPage === totalPages}
                                            aria-label={ar ? "الصفحة التالية" : "Next page"}
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
