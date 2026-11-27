import { tt, getEngineLang } from "../i18n/engineText.js";
const TARGET_CALL_RATE = 12.5;
const MAX_DAILY_VISITS = 15;

const MIN_GAP_DAYS = 6;
const MAX_GAP_DAYS = 25;

const MAX_ATTEMPTS = 100;

function sanitizeCallRate(value) {
    const rate = Number(value);

    if (!Number.isFinite(rate) || rate <= 0) {
        return TARGET_CALL_RATE;
    }

    return Math.min(
        Math.max(rate, 1),
        MAX_DAILY_VISITS
    );
}

const BRICK_ALIASES = {
    sinnuris: "سنتريس",
    senteris: "سنتريس",
    sinnures: "سنتريس",
    shohada: "الشهداء",
    elshohada: "الشهداء",
    sadat: "السادات",
    elsadat: "السادات",
    sadatcity: "السادات",
    madinetsadat: "السادات",
    sers: "سرس الليان",
    serslayan: "سرس الليان",
    sersellayan: "سرس الليان",
    sersellyan: "سرس الليان",
    menouf: "منوف",
    monouf: "منوف",
    menuf: "منوف",
    tata: "تتا",
    teta: "تتا",
    shubrabloula: "شبرا بلوله",
    shubrabaloula: "شبرا بلوله",
    shobrabaloula: "شبرا بلوله",
    shoubrabloula: "شبرا بلوله",
    elmanshiya: "المنشيه",
    elmanshia: "المنشيه",
    manshiya: "المنشيه",
    kafrfisha: "كفر فيشه",
    kafrfisha: "كفر فيشه",
    ashmoun: "اشمون",
    ashmon: "اشمون",
    talia: "طليا",
    talya: "طليا",
    samadoun: "سمدون",
    samadon: "سمدون",
    smadoun: "سمدون",
    bagour: "الباجور",
    baghour: "الباجور",
    bagor: "الباجور",
    bielarab: "بي العرب",
    biolarab: "بي العرب",
    biarab: "بي العرب",
    bayarab: "بي العرب",
    estanha: "اسطنها",
    astanha: "اسطنها",
    istanha: "اسطنها",
};

const WEEK_DAYS = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,

    "الاحد": 0,
    "الأحد": 0,
    "الاثنين": 1,
    "الإثنين": 1,
    "الثلاثاء": 2,
    "الاربعاء": 3,
    "الأربعاء": 3,
    "الخميس": 4,
    "الجمعه": 5,
    "الجمعة": 5,
    "السبت": 6,
};

const ARABIC_WEEK_DAYS = [
    "الأحد",
    "الاثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
];

// تطبيع متسامح: يزيل التشكيل والتطويل، ويوحّد الألف والياء
// والتاء المربوطة، ويطابق الإنجليزي بلا مسافات أو شرطات حتى
// تتطابق اختلافات الهجاء بين الشيت والمجموعات الملصوقة.
export function normalizeBrick(value) {
    const raw = String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[\u064B-\u0652\u0670]/g, "")
        .replace(/ـ/g, "")
        .replace(/\s+/g, " ");

    if (!raw) {
        return "غير محدد";
    }

    const englishKey = raw.replace(/[^a-z0-9]/g, "");

    if (englishKey && BRICK_ALIASES[englishKey]) {
        return BRICK_ALIASES[englishKey]
            .replace(/[أإآ]/g, "ا")
            .replace(/ى/g, "ي")
            .replace(/ة/g, "ه");
    }

    return raw
        .replace(/[أإآ]/g, "ا")
        .replace(/ى/g, "ي")
        .replace(/ة/g, "ه")
        .replace(/\s+/g, " ");
}

function normalizeDate(value) {
    if (!value) return null;

    if (
        value instanceof Date &&
        !Number.isNaN(value.getTime())
    ) {
        return new Date(
            value.getFullYear(),
            value.getMonth(),
            value.getDate(),
            12
        );
    }

    if (typeof value === "object") {
        return normalizeDate(
            value.date || value.value || value.startDate
        );
    }

    const text = String(value).trim();

    const isoMatch = text.match(
        /^(\d{4})-(\d{1,2})-(\d{1,2})/
    );

    if (isoMatch) {
        const date = new Date(
            Number(isoMatch[1]),
            Number(isoMatch[2]) - 1,
            Number(isoMatch[3]),
            12
        );

        if (
            date.getFullYear() !== Number(isoMatch[1]) ||
            date.getMonth() !== Number(isoMatch[2]) - 1 ||
            date.getDate() !== Number(isoMatch[3])
        ) {
            return null;
        }

        return date;
    }

    const dateMatch = text.match(
        /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
    );
    if (dateMatch) {
        const date = new Date(
            Number(dateMatch[3]),
            Number(dateMatch[2]) - 1,
            Number(dateMatch[1]),
            12
        );

        if (
            date.getFullYear() !== Number(dateMatch[3]) ||
            date.getMonth() !== Number(dateMatch[2]) - 1 ||
            date.getDate() !== Number(dateMatch[1])
        ) {
            return null;
        }

        return date;
    }

    const parsed = new Date(text);

    if (Number.isNaN(parsed.getTime())) return null;

    return new Date(
        parsed.getFullYear(),
        parsed.getMonth(),
        parsed.getDate(),
        12
    );
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getDateDifference(dateA, dateB) {
    const a = new Date(dateA);
    const b = new Date(dateB);

    return Math.round((b - a) / 86400000);
}

function getWorkingDayNumber(value) {
    if (typeof value === "number") return value;

    const normalized = String(value || "")
        .trim()
        .toLowerCase();

    if (
        Object.prototype.hasOwnProperty.call(
            WEEK_DAYS,
            normalized
        )
    ) {
        return WEEK_DAYS[normalized];
    }

    return null;
}

function getDateList({
    startDate,
    endDate,
    workingDays,
    holidays = [],
    meetings = [],
}) {
    const start = normalizeDate(startDate);
    const end = normalizeDate(endDate);

    if (!start || !end || start > end) {
        return [];
    }

    const allowedDays = new Set(
        (workingDays || [6, 0, 1, 2, 3])
            .map(getWorkingDayNumber)
            .filter((day) => day !== null)
    );

    const excludedDates = new Set(
        [...holidays, ...meetings]
            .map((item) => {
                const date = normalizeDate(item);
                return date ? formatDate(date) : null;
            })
            .filter(Boolean)
    );

    const dates = [];
    const current = new Date(start);

    while (current <= end) {
        const dateKey = formatDate(current);

        if (
            allowedDays.has(current.getDay()) &&
            !excludedDates.has(dateKey)
        ) {
            dates.push({
                date: dateKey,
                dateObject: new Date(current),
                dayName: ARABIC_WEEK_DAYS[current.getDay()],
                dayNumber: current.getDay(),
            });
        }

        current.setDate(current.getDate() + 1);
    }

    return dates;
}


// الأيام المستبعدة من فترة البلان مع سبب الاستبعاد (يوم راحة أسبوعي
// أو إجازة أو اجتماع) — للعرض على المستخدم.
export function getExcludedDateList({
    startDate,
    endDate,
    workingDays,
    holidays = [],
    meetings = [],
}) {
    const start = normalizeDate(startDate);
    const end = normalizeDate(endDate);

    if (!start || !end || start > end) {
        return [];
    }

    const allowedDays = new Set(
        (workingDays || [6, 0, 1, 2, 3])
            .map(getWorkingDayNumber)
            .filter((day) => day !== null)
    );

    const toKey = (item) => {
        const date = normalizeDate(item);
        return date ? formatDate(date) : null;
    };
    const holidaySet = new Set(holidays.map(toKey).filter(Boolean));
    const meetingSet = new Set(meetings.map(toKey).filter(Boolean));

    const out = [];
    const current = new Date(start);

    while (current <= end) {
        const dateKey = formatDate(current);
        const reasons = [];
        if (!allowedDays.has(current.getDay())) reasons.push("weekday");
        if (holidaySet.has(dateKey)) reasons.push("holiday");
        if (meetingSet.has(dateKey)) reasons.push("meeting");
        if (reasons.length) {
            out.push({
                date: dateKey,
                dayName: ARABIC_WEEK_DAYS[current.getDay()],
                reasons,
            });
        }
        current.setDate(current.getDate() + 1);
    }

    return out;
}

// الحد الأدنى من الأيام لكل مجموعة مناطق:
// أكبر قيمة بين (سعة 15 زيارة في اليوم) و(أعلى فريكونسي في المجموعة
// لأن زيارات الدكتور الواحد لازم تكون في أيام مختلفة بفاصل 6+ أيام).
export function computeGroupMinimums(doctors, zoneGroups) {
    const zoneGroupMap = buildZoneGroupMap(zoneGroups);
    const reqs = new Map();

    for (const doctor of doctors || []) {
        const brick = getDoctorZone(doctor, zoneGroupMap);
        const frequency = getDoctorFrequency(doctor);
        if (frequency <= 0) continue;
        if (!reqs.has(brick)) {
            reqs.set(brick, {
                brick,
                visits: 0,
                maxFrequency: 0,
                doctors: [],
            });
        }
        const info = reqs.get(brick);
        info.visits += frequency;
        info.maxFrequency = Math.max(info.maxFrequency, frequency);
        info.doctors.push({
            name: doctor.name || doctor.id || "?",
            frequency,
        });
    }

    const out = [];
    for (const info of reqs.values()) {
        out.push({
            ...info,
            days: Math.max(
                Math.ceil(info.visits / MAX_DAILY_VISITS),
                info.maxFrequency
            ),
        });
    }
    out.sort((a, b) => b.days - a.days);
    return out;
}

function simulateFrequencyCuts(groups, availableCount) {
    const sim = groups.map((g) => ({
        brick: g.brick,
        visits: g.visits,
        doctors: g.doctors.map((d) => ({ ...d })),
    }));
    const daysOf = (g) => {
        const maxFreq = Math.max(0, ...g.doctors.map((d) => d.frequency));
        return Math.max(Math.ceil(g.visits / MAX_DAILY_VISITS), maxFreq);
    };
    let need = sim.reduce((s, g) => s + daysOf(g), 0);
    const cuts = new Map();
    let guard = 0;

    while (need > availableCount && guard < 200) {
        guard++;
        let best = null;

        for (const g of sim) {
            const maxFreq = Math.max(
                0,
                ...g.doctors.map((d) => d.frequency)
            );
            const capacityDays = Math.ceil(g.visits / MAX_DAILY_VISITS);
            const days = Math.max(capacityDays, maxFreq);
            if (days <= 1) continue;

            if (maxFreq >= capacityDays) {
                // مربوط بالفريكونسي: خفض كل دكاترة أعلى فريكونسي بمقدار 1
                const top = g.doctors.filter(
                    (d) => d.frequency === maxFreq && d.frequency > 1
                );
                if (!top.length) continue;
                const newDays = Math.max(
                    Math.ceil((g.visits - top.length) / MAX_DAILY_VISITS),
                    maxFreq - 1,
                    ...g.doctors
                        .filter((d) => d.frequency !== maxFreq)
                        .map((d) => d.frequency),
                    0
                );
                const saved = days - newDays;
                if (saved > 0) {
                    const cost = top.length / saved;
                    if (!best || cost < best.cost) {
                        best = { g, kind: "freq", targets: top, saved, cost };
                    }
                }
            }

            // مربوط بالسعة: قلل زيارات بمقدار الفائض عن أيام أقل
            const excess = g.visits - MAX_DAILY_VISITS * (days - 1);
            if (excess > 0 && days - 1 >= 1) {
                const candidates = g.doctors
                    .filter((d) => d.frequency > 1)
                    .sort((a, b) => a.frequency - b.frequency);
                if (candidates.length >= excess) {
                    const targets = candidates.slice(0, excess);
                    const newVisits = g.visits - targets.length;
                    const newMax = Math.max(
                        0,
                        ...g.doctors.map((d) =>
                            targets.includes(d)
                                ? d.frequency - 1
                                : d.frequency
                        )
                    );
                    const newDays = Math.max(
                        Math.ceil(newVisits / MAX_DAILY_VISITS),
                        newMax
                    );
                    const saved = days - newDays;
                    if (saved > 0) {
                        const cost = targets.length / saved;
                        if (!best || cost < best.cost) {
                            best = {
                                g,
                                kind: "capacity",
                                targets,
                                saved,
                                cost,
                            };
                        }
                    }
                }
            }
        }

        if (!best) break;

        for (const d of best.targets) {
            d.frequency -= 1;
            best.g.visits -= 1;
            cuts.set(d.name, (cuts.get(d.name) || 0) + 1);
        }
        need = sim.reduce((s, g) => s + daysOf(g), 0);
    }

    if (!cuts.size) return null;

    const totalCut = [...cuts.values()].reduce((a, b) => a + b, 0);
    return {
        cuts: [...cuts.entries()]
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count),
        totalCut,
        newNeed: need,
        reached: need <= availableCount,
    };
}

// خيارات عملية للوصول إلى خطة مكتملة عندما يتجاوز الحد الأدنى من
// الأيام الأيام المتاحة. لا يطبَّق أي خيار تلقائياً — عرض فقط.
export function computeReliefOptions({
    doctors,
    zoneGroups,
    availableCount,
    excluded = [],
}) {
    const groups = computeGroupMinimums(doctors, zoneGroups);
    const need = groups.reduce((s, g) => s + g.days, 0);
    const deficit = need - availableCount;

    if (deficit <= 0) {
        return { need, availableCount, deficit: 0, groups, options: [] };
    }

    const options = [];

    if (excluded.length > 0) {
        options.push({
            id: "reclaim",
            excludedCount: excluded.length,
            covers: Math.min(excluded.length, deficit),
        });
    }

    options.push({ id: "extend", days: deficit });

    const merges = [];
    for (let i = 0; i < groups.length; i++) {
        for (let j = i + 1; j < groups.length; j++) {
            const a = groups[i];
            const b = groups[j];
            const merged = Math.max(
                Math.ceil((a.visits + b.visits) / MAX_DAILY_VISITS),
                Math.max(a.maxFrequency, b.maxFrequency)
            );
            const saved = a.days + b.days - merged;
            if (saved > 0) {
                merges.push({ a: a.brick, b: b.brick, saved });
            }
        }
    }
    merges.sort((x, y) => y.saved - x.saved);
    if (merges.length) {
        options.push({ id: "merge", merges: merges.slice(0, 3) });
    }

    const cuts = simulateFrequencyCuts(groups, availableCount);
    if (cuts) {
        options.push({ id: "freq", ...cuts });
    }

    return { need, availableCount, deficit, groups, options };
}

function canCombineBricks(bricks) {
    const uniqueBricks = [
        ...new Set(
            bricks
                .map(normalizeBrick)
                .filter(Boolean)
        ),
    ];

    // مسموح بمنطقة واحدة فقط في اليوم.
    return uniqueBricks.length <= 1;
}

export function generateEvenCombinations(dates, frequency) {
    if (frequency === 0) return [[]];

    const sortedDates = [...dates].sort(
        (a, b) => a.date.localeCompare(b.date)
    );

    if (frequency > sortedDates.length) return [];

    const lastIndex = sortedDates.length - 1;

    const isValidCombo = (combo) => {
        for (let i = 1; i < combo.length; i++) {
            const gap = getDateDifference(
                combo[i - 1].dateObject,
                combo[i].dateObject
            );

            if (gap < MIN_GAP_DAYS || gap > MAX_GAP_DAYS) {
                return false;
            }
        }

        return true;
    };

    const combinations = [];
    const seen = new Set();

    const push = (combo) => {
        if (!combo || combo.length !== frequency) {
            return false;
        }

        if (
            new Set(combo.map((date) => date.date)).size !==
            frequency
        ) {
            return false;
        }

        if (!isValidCombo(combo)) return false;

        const key = combo
            .map((date) => date.date)
            .join("|");

        if (seen.has(key)) return false;

        seen.add(key);
        combinations.push(combo);
        return true;
    };

    // تغطية منهجية: بحث من كل يوم عمل كبداية محتملة مع
    // فواصل 6-25 يوم، بحد أقصى لكل بداية، حتى تغطي الاقتراحات
    // كامل فترة البلان بدل التركيز على أولها.
    const maxCombinations = 200;
    const perStartCap = Math.max(
        2,
        Math.floor(
            maxCombinations / (lastIndex + 1)
        )
    );

    for (let s = 0; s <= lastIndex; s++) {
        if (combinations.length >= maxCombinations) break;

        let countForStart = 0;
        const selected = [sortedDates[s]];

        const dfs = (cursor) => {
            if (
                countForStart >= perStartCap ||
                combinations.length >= maxCombinations
            ) {
                return;
            }

            if (selected.length === frequency) {
                if (push([...selected])) {
                    countForStart++;
                }
                return;
            }

            const previous =
                selected[selected.length - 1];
            const remaining =
                frequency - selected.length;

            for (
                let j = cursor + 1;
                j <= lastIndex - (remaining - 1);
                j++
            ) {
                const gap = getDateDifference(
                    previous.dateObject,
                    sortedDates[j].dateObject
                );

                if (gap < MIN_GAP_DAYS) continue;
                if (gap > MAX_GAP_DAYS) break;

                // لو الفترة المتبقية لا تتسع لباقي الزيارات
                // حتى بأقل فاصل ممكن، لا فائدة من المتابعة.
                const spanLeft = getDateDifference(
                    sortedDates[j].dateObject,
                    sortedDates[lastIndex].dateObject
                );

                if (
                    spanLeft <
                    (remaining - 1) * MIN_GAP_DAYS
                ) {
                    break;
                }

                selected.push(sortedDates[j]);
                dfs(j);
                selected.pop();

                if (
                    countForStart >= perStartCap ||
                    combinations.length >=
                        maxCombinations
                ) {
                    return;
                }
            }
        };

        if (frequency === 1) {
            push([sortedDates[s]]);
        } else {
            dfs(s);
        }
    }

    // عينات عشوائية بفواصل متغيرة لمزيد من التنوع بين المحاولات.
    const randomInt = (min, max) =>
        min +
        Math.floor(
            Math.random() * (max - min + 1)
        );

    let guard = 0;

    while (
        combinations.length < maxCombinations &&
        guard < 5000
    ) {
        guard++;

        const selected = [sortedDates[randomInt(0, lastIndex)]];

        for (let step = 1; step < frequency; step++) {
            const previous =
                selected[selected.length - 1];
            const targetGap = randomInt(
                MIN_GAP_DAYS,
                MAX_GAP_DAYS - 3
            );
            let nextIndex = -1;

            const cursor = sortedDates.findIndex(
                (date) => date.date === previous.date
            );

            for (
                let j = cursor + 1;
                j <= lastIndex;
                j++
            ) {
                const gap = getDateDifference(
                    previous.dateObject,
                    sortedDates[j].dateObject
                );

                if (gap >= targetGap) {
                    nextIndex = j;
                    break;
                }
            }

            if (nextIndex === -1) break;

            selected.push(sortedDates[nextIndex]);
        }

        push(selected);
    }

    return combinations;
}

function getDoctorFrequency(doctor) {
    const value = Number(doctor.currentFrequency);

    if (!Number.isFinite(value) || value < 0) {
        return 0;
    }

    return Math.floor(value);
}

// مجموعات المناطق الافتراضية (مناطق خطة المستخدم التجريبية،
// 23 نوفمبر 2026). تُستخدم فقط عندما لا تصل إعدادات مجموعات مناطق
// من واجهة التطبيق؛ المستخدم يعدّلها من صفحة الإعدادات.
// المناطق داخل المجموعة الواحدة يجوز جمعها في يوم واحد، وأي منطقة
// غير موجودة في أي مجموعة تُعامل كمنطقة مستقلة لا تُخلط مع غيرها.
// اليوم الواحد لا يجمع دكاترة من مجموعتين مختلفتين.
export const DEFAULT_ZONE_GROUPS = [
    ["Area A", "Area B", "Area C"],
    ["Area D", "Area E"],
];

function buildZoneGroupMap(zoneGroups) {
    const map = new Map();

    if (!Array.isArray(zoneGroups)) {
        return map;
    }

    for (const group of zoneGroups) {
        if (!Array.isArray(group)) continue;

        const members = [
            ...new Set(
                group
                    .map((brick) => normalizeBrick(brick))
                    .filter(
                        (brick) =>
                            brick &&
                            brick !== "غير محدد" &&
                            brick !== "منطقه جديده" &&
                            brick !== "new area"
                    )
            ),
        ];

        if (members.length < 2) continue;

        const key = [...members].sort().join(" + ");

        for (const member of members) {
            map.set(member, key);
        }
    }

    return map;
}

function getDoctorZone(doctor, zoneGroupMap) {
    const brick = normalizeBrick(doctor.brick);

    return (
        (zoneGroupMap && zoneGroupMap.get(brick)) ||
        brick
    );
}

function getDoctorKey(doctor, index = 0) {
    const base =
        doctor.id !== undefined && doctor.id !== null
            ? String(doctor.id)
            : doctor.name || "doctor";

    // المفتاح يميز كل صف حتى لو تكرر نفس الـ id في الملف.
    return `${base}|${index}`;
}

const NEW_DAY_OPENING_COST = 30;

// تجاوز متوسط الكول ريت المستهدف في اليوم مكلف، حتى يفتح البلان
// أياماً إضافية بدل تكديس اليوم الواحد فوق المستهدف، مع بقاء
// التجاوز ممكناً عند ضغط الأيام (تكلفة محدودة وليست منعاً).
const OVER_TARGET_PENALTY = 25;

function getDayCost(day, doctorBrick, targetLoad) {
    const currentLoad = day.visits.length;

    // الحد الأقصى الفعلي 16 زيارة.
    if (currentLoad >= MAX_DAILY_VISITS) {
        return Infinity;
    }

    const existingBricks = day.bricks;

    const proposedBricks = [
        ...existingBricks,
        doctorBrick,
    ];

    // ممنوع دمج المناطق.
    if (!canCombineBricks(proposedBricks)) {
        return Infinity;
    }

    const before = Math.pow(
        currentLoad - targetLoad,
        2
    );

    const after = Math.pow(
        currentLoad + 1 - targetLoad,
        2
    );

    let cost = after - before;

    // فتح يوم جديد له تكلفة إضافية حتى تتجمع زيارات كل
    // منطقة في أيام أقل، وتتبقى أيام كافية لباقي المناطق.
    if (currentLoad === 0) {
        cost += NEW_DAY_OPENING_COST;
    }

    if (currentLoad >= targetLoad) {
        cost += OVER_TARGET_PENALTY;
    }

    return cost;
}

function createEmptyDays(availableDates) {
    return availableDates.map((item) => ({
        date: item.date,
        dayName: item.dayName,
        visits: [],
        totalVisits: 0,
        bricks: [],
    }));
}

function addDoctorToDays(
    doctor,
    combination,
    daysByDate
) {
    const brick =
        doctor._brick || getDoctorZone(doctor);

    combination.forEach((date, index) => {
        const day = daysByDate.get(date.date);

        const visit = {
            id: `${doctor.id || doctor.name}-${date.date}-${index + 1}`,
            doctorId: doctor.id,
            doctorKey: doctor._key || getDoctorKey(doctor),
            doctorName: doctor.name,
            specialty: doctor.specialty || "",
            brick: doctor.brick || "",
            area: doctor.area || doctor.brick || "",
            zone: brick,
            date: date.date,
            visitNumber: index + 1,
        };

        day.visits.push(visit);
        day.totalVisits = day.visits.length;

        if (!day.bricks.includes(brick)) {
            day.bricks.push(brick);
        }
    });
}

function getAttemptScore(
    days,
    doctors,
    scheduledByDoctor,
    targetRate = TARGET_CALL_RATE
) {
    const totalScheduled = days.reduce(
        (sum, day) => sum + day.visits.length,
        0
    );

    const completedDoctors = doctors.filter(
        (doctor, index) => {
            const required = getDoctorFrequency(doctor);

            const scheduled =
                scheduledByDoctor.get(
                    getDoctorKey(doctor, index)
                ) || 0;

            return scheduled === required;
        }
    ).length;

    const loads = days.map(
        (day) => day.visits.length
    );

    const average =
        loads.length > 0
            ? loads.reduce(
                (sum, value) => sum + value,
                0
            ) / loads.length
            : 0;

    const targetRateDeviation =
        Math.pow(
            average - targetRate,
            2
        );

    const variance =
        loads.length > 0
            ? loads.reduce(
                (sum, value) =>
                    sum + Math.pow(value - average, 2),
                0
            ) / loads.length
            : 0;

    const overMaximum = days.reduce(
        (sum, day) =>
            sum + Math.max(
                0,
                day.visits.length - MAX_DAILY_VISITS
            ),
        0
    );

    return (
        totalScheduled * 100000 +
        completedDoctors * 1000 -
        overMaximum * 10000 -
        variance -
        targetRateDeviation
    );
}

export function runPlanningAttempt({
    preparedDoctors,
    availableDates,
    targetLoad,
}) {
    const days = createEmptyDays(availableDates);

    const daysByDate = new Map(
        days.map((day) => [day.date, day])
    );

    const scheduledByDoctor = new Map();
    const failedDoctors = [];
    const orderedDoctors = [...preparedDoctors].sort(
        (a, b) =>
            b._frequency -
                a._frequency ||
            a._brick.localeCompare(
                b._brick,
                "ar"
            )
    );

    for (const doctor of orderedDoctors) {
        if (doctor._frequency === 0) {
            scheduledByDoctor.set(
                doctor._key,
                0
            );
            continue;
        }

        const combinations =
            doctor._minDate
                ? generateEvenCombinations(
                    availableDates.filter(
                        (entry) => entry.date >= doctor._minDate
                    ),
                    doctor._frequency
                )
                : doctor._combinations.length > 0
                ? doctor._combinations
                : generateEvenCombinations(
                    availableDates,
                    doctor._frequency
                );

        if (combinations.length === 0) {
            failedDoctors.push(doctor);
            scheduledByDoctor.set(
                doctor._key,
                0
            );
            continue;
        }

        const offset =
            Math.floor(
                Math.random() *
                combinations.length
            );
        const candidates = [
            ...combinations.slice(offset),
            ...combinations.slice(0, offset),
        ];
        let bestCombination = null;
        let bestCost = Infinity;

        for (const combination
            of candidates
        ) {
            let totalCost = 0;
            let valid = true;

            for (const date
                of combination
            ) {
                const day =
                    daysByDate.get(
                        date.date
                    );
                const cost =
                    getDayCost(
                        day,
                        doctor._brick,
                        targetLoad
                    );

                if (
                    !Number.isFinite(cost)
                ) {
                    valid = false;
                    break;
                }

                totalCost += cost;
            }

            if (
                valid &&
                totalCost <
                    bestCost
            ) {
                bestCost =
                    totalCost;
                bestCombination =
                    combination;
            }
        }

        if (!bestCombination) {
            failedDoctors.push(doctor);
            scheduledByDoctor.set(
                doctor._key,
                0
            );
            continue;
        }

        addDoctorToDays(
            doctor,
            bestCombination,
            daysByDate
        );
        scheduledByDoctor.set(
            doctor._key,
            bestCombination.length
        );
    }

    return {
        days,
        scheduledByDoctor,
        failedDoctors,
        score: getAttemptScore(
            days,
            preparedDoctors,
            scheduledByDoctor,
            targetLoad
        ),
    };
}


// يبني اختيار أيام لدكتور في منطقة ممتلئة: يختار أقل الأيام امتلاءً
// مع الحفاظ على فواصل 6-25 يوم بين زياراته، فيتوزع الحمل بالتساوي
// بدل ما تمتلئ الأيام الأساسية ويبقى دكاترة بلا أماكن.
function shuffleWithSeed(list, seed) {
    const arr = [...list];
    let s = seed || 1;
    for (let i = arr.length - 1; i > 0; i--) {
        s = (s * 1103515245 + 12345) % 2147483648;
        const j = s % (i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}


function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function runPartitionedAttempt({
    preparedDoctors,
    availableDates,
    seed = 0,
    targetRate = TARGET_CALL_RATE,
}) {
    const rng = mulberry32((seed + 1) * 2654435761);

    const days = createEmptyDays(availableDates);

    const daysByDate = new Map(
        days.map((day) => [day.date, day])
    );

    const scheduledByDoctor = new Map();
    const failedDoctors = [];

    // تجميع الدكاترة حسب المنطقة.
    const brickLists = new Map();

    for (const doctor of preparedDoctors) {
        if (!brickLists.has(doctor._brick)) {
            brickLists.set(doctor._brick, []);
        }
        brickLists.get(doctor._brick).push(doctor);
    }

    let brickInfos = [...brickLists.entries()]
        .map(([brick, list]) => {
            const visits = list.reduce(
                (sum, doctor) => sum + doctor._frequency,
                0
            );
            const maxFreq = Math.max(
                ...list.map((doctor) => doctor._frequency)
            );

            return {
                brick,
                list,
                visits,
                maxFreq,
                need: Math.min(
                    availableDates.length,
                    Math.max(
                        Math.ceil(
                            visits / MAX_DAILY_VISITS
                        ),
                        maxFreq
                    )
                ),
            };
        })
        .filter((info) => info.need > 0);

    brickInfos.sort((a, b) => b.need - a.need);

    // تدوير ترتيب المناطق حسب البذرة حتى تستكشف المحاولات المختلفة
    // توزيعات أيام مختلفة.
    if (brickInfos.length > 0) {
        const rot = seed % brickInfos.length;
        brickInfos = [
            ...brickInfos.slice(rot),
            ...brickInfos.slice(0, rot),
        ];
    }

    // رفع الحد الأدنى للأيام: القسمة على 15 تعطي سعة نظرية لا تتحقق
    // عملياً بسبب شرط التباعد 6-25، فيُقسَّم على معدل أقرب للواقع.
    const totalVisits = brickInfos.reduce(
        (sum, info) => sum + info.visits,
        0
    );
    const divisor = Math.max(
        12,
        Math.ceil(totalVisits / Math.max(1, availableDates.length))
    );
    for (const info of brickInfos) {
        info.need = Math.min(
            availableDates.length,
            Math.max(info.need, Math.ceil(info.visits / divisor))
        );
    }
    // لو تجاوز الإجمالي الأيام المتاحة، خفِّض الأكبر أولاً دون كسر
    // الحد الأدنى الصلب (السعة 15/يوم والفريكونسي الأقصى).
    const hardFloor = (info) =>
        Math.min(
            availableDates.length,
            Math.max(
                Math.ceil(info.visits / MAX_DAILY_VISITS),
                info.maxFreq
            )
        );
    let needSum = brickInfos.reduce((s, i) => s + i.need, 0);
    if (needSum > availableDates.length) {
        for (const info of [...brickInfos].sort(
            (a, b) => b.need - a.need
        )) {
            if (needSum <= availableDates.length) break;
            const reducible = info.need - hardFloor(info);
            const cut = Math.min(
                reducible,
                needSum - availableDates.length
            );
            info.need -= cut;
            needSum -= cut;
        }
    }

    // توزيع الأيام: كل منطقة تأخذ أيامها موزعة بالتساوي على طول
    // فترة البلان (مواقع مستهدفة متباعدة بانتظام)، مع حل التعارض
    // بأقرب يوم فارغ. التباعد 6-25 يُطبَّق على الدكتور داخل أيام
    // توزيع الأيام على مرحلتين:
    // 1) أيام أساسية لكل منطقة متباعدة 6+ حتى تجد الفريكونسي العالي
    //    فواصل صحيحة. الأولوية لأكبر عدد أيام متبقية.
    // 2) الأيام المتبقية للمناطق صاحبة أكبر عجز في السعة.
    const assignment = new Map(
        brickInfos.map((info) => [info.brick, []])
    );
    const assignedCount = new Map(
        brickInfos.map((info) => [info.brick, 0])
    );
    const lastAssignedIndex = new Map();
    const leftoverDates = [];

    availableDates.forEach((entry, idx) => {
        let chosen = null;
        let bestRemaining = -1;

        for (const info of brickInfos) {
            const count = assignedCount.get(info.brick);
            if (count >= info.need) continue;

            const last = lastAssignedIndex.has(info.brick)
                ? lastAssignedIndex.get(info.brick)
                : -Infinity;
            if (idx - last < MIN_GAP_DAYS) continue;

            const remainingNeed = info.need - count;
            if (remainingNeed > bestRemaining) {
                bestRemaining = remainingNeed;
                chosen = info.brick;
            }
        }

        if (chosen) {
            assignment.get(chosen).push(entry);
            assignedCount.set(chosen, assignedCount.get(chosen) + 1);
            lastAssignedIndex.set(chosen, idx);
        } else {
            leftoverDates.push(entry);
        }
    });

    for (const entry of leftoverDates) {
        let chosen = null;
        let bestDeficit = 0;
        for (const info of brickInfos) {
            const deficit =
                info.visits -
                assignment.get(info.brick).length * MAX_DAILY_VISITS;
            if (deficit > bestDeficit) {
                bestDeficit = deficit;
                chosen = info.brick;
            }
        }
        if (chosen) {
            assignment.get(chosen).push(entry);
        }
    }

    // جدولة دكاترة كل منطقة داخل أيامها المخصصة فقط.
    // كل منطقة تُجرَّب عدة مرات بترتيبات عشوائية مع محاكاة محلية
    // للأحمال، ونحتفظ بأفضل محاولة (أقل دكاترة غير مكتملين).
    const ZONE_ATTEMPTS = 40;

    for (const info of brickInfos) {
        const brickDates = assignment.get(info.brick);

        if (!brickDates || brickDates.length === 0) {
            for (const doctor of info.list) {
                failedDoctors.push(doctor);
                scheduledByDoctor.set(doctor._key, 0);
            }
            continue;
        }

        const targetLoad = Math.min(
            MAX_DAILY_VISITS,
            Math.max(1, info.visits / brickDates.length)
        );

        const tightZone =
            info.visits >
            brickDates.length * MAX_DAILY_VISITS * 0.8;

        const combosByFrequency = new Map();

        const combosFor = (doctor) => {
            if (doctor._minDate) {
                return generateEvenCombinations(
                    brickDates.filter(
                        (entry) => entry.date >= doctor._minDate
                    ),
                    doctor._frequency
                );
            }
            if (!combosByFrequency.has(doctor._frequency)) {
                combosByFrequency.set(
                    doctor._frequency,
                    generateEvenCombinations(
                        brickDates,
                        doctor._frequency
                    )
                );
            }
            return combosByFrequency.get(doctor._frequency);
        };

        const baseOrder = [...info.list].sort(
            (a, b) => b._frequency - a._frequency
        );

        let bestZone = null;

        for (let zoneAttempt = 0; zoneAttempt < ZONE_ATTEMPTS; zoneAttempt++) {
            const order =
                zoneAttempt === 0
                    ? baseOrder
                    : shuffleWithSeed(
                          baseOrder,
                          zoneAttempt * 7919 + info.visits
                      );

            const loads = new Map();
            for (const entry of brickDates) {
                loads.set(
                    entry.date,
                    daysByDate.get(entry.date).visits.length
                );
            }

            const placements = [];
            let failed = 0;

            for (const doctor of order) {
                if (doctor._frequency === 0) {
                    placements.push([doctor, null]);
                    continue;
                }

                const combinations = combosFor(doctor);

                let bestCombination = null;
                let bestCost = Infinity;
                const offset = Math.floor(
                    rng() * (combinations.length || 1)
                );
                const candidates = [
                    ...combinations.slice(offset),
                    ...combinations.slice(0, offset),
                ];

                for (const combination of candidates) {
                    let totalCost = 0;
                    let valid = true;

                    for (const date of combination) {
                        const load = loads.get(date.date);

                        if (load >= MAX_DAILY_VISITS) {
                            valid = false;
                            break;
                        }

                        if (tightZone) {
                            totalCost += load;
                        } else {
                            const before = Math.pow(
                                load - targetLoad,
                                2
                            );
                            const after = Math.pow(
                                load + 1 - targetLoad,
                                2
                            );
                            totalCost += after - before;
                        }
                    }

                    if (valid && totalCost < bestCost) {
                        bestCost = totalCost;
                        bestCombination = combination;
                    }
                }

                if (!bestCombination) {
                    failed += 1;
                    placements.push([doctor, null]);
                    continue;
                }

                placements.push([doctor, bestCombination]);
                for (const date of bestCombination) {
                    loads.set(date.date, loads.get(date.date) + 1);
                }
            }

            if (!bestZone || failed < bestZone.failed) {
                bestZone = { failed, placements };
            }
            if (failed === 0) break;
        }


    }

    return {
        days,
        scheduledByDoctor,
        failedDoctors,
        score: getAttemptScore(
            days,
            preparedDoctors,
            scheduledByDoctor,
            targetRate
        ),
    };
}

export function validateVisitPlan({
    days = [],
    doctors = [],
    workingDays,
    holidays = [],
    meetings = [],
    zoneGroups,
}) {
    const errors = [];
    const warnings = [];

    const zoneGroupMap = buildZoneGroupMap(
        zoneGroups === undefined
            ? DEFAULT_ZONE_GROUPS
            : zoneGroups
    );

    const allVisits = days.flatMap(
        (day) => day.visits || []
    );

    const availableDates = getDateList({
        startDate: days[0]?.date,
        endDate: days[days.length - 1]?.date,
        workingDays,
        holidays,
        meetings,
    });

    const availableDateSet = new Set(
        availableDates.map((item) => item.date)
    );

    for (const day of days) {
        const count = (day.visits || []).length;

        // لا يوجد حد أدنى إجباري.
        if (count > MAX_DAILY_VISITS) {
            errors.push(
                tt("dayExceedsMax", { date: day.date, count, max: MAX_DAILY_VISITS })
            );
        }

        const bricks = [
            ...new Set(
                (day.visits || []).map((visit) =>
                    visit.zone !== undefined
                        ? visit.zone
                        : getDoctorZone(
                              visit,
                              zoneGroupMap
                          )
                )
            ),
        ];

        if (!canCombineBricks(bricks)) {
            errors.push(
                tt("dayMixesZones", { date: day.date })
            );
        }

        if (!availableDateSet.has(day.date)) {
            warnings.push(
                tt("dateNotWorking", { date: day.date })
            );
        }
    }

    for (
        let doctorIndex = 0;
        doctorIndex < doctors.length;
        doctorIndex++
    ) {
        const doctor = doctors[doctorIndex];
        const required = getDoctorFrequency(doctor);

        const doctorKey = getDoctorKey(doctor, doctorIndex);

        const doctorVisits = allVisits
            .filter((visit) =>
                visit.doctorKey !== undefined
                    ? visit.doctorKey === doctorKey
                    : visit.doctorId === doctor.id
            )
            .sort(
                (a, b) => a.date.localeCompare(b.date)
            );

        if (doctorVisits.length !== required) {
            errors.push(
                tt("doctorCountMismatch", { name: doctor.name, required, actual: doctorVisits.length })
            );
        }

        for (let i = 1; i < doctorVisits.length; i++) {
            const gap = getDateDifference(
                normalizeDate(doctorVisits[i - 1].date),
                normalizeDate(doctorVisits[i].date)
            );

            if (
                gap < MIN_GAP_DAYS ||
                gap > MAX_GAP_DAYS
            ) {
                errors.push(
                    tt("doctorGapOutOfRange", { name: doctor.name, gap, min: MIN_GAP_DAYS, max: MAX_GAP_DAYS })
                );
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

export function generateVisitPlan({
    doctors = [],
    startDate,
    endDate,
    workingDays,
    holidays = [],
    meetings = [],
    callRate,
    zoneGroups,
}) {
    const zoneGroupMap = buildZoneGroupMap(
        zoneGroups === undefined
            ? DEFAULT_ZONE_GROUPS
            : zoneGroups
    );

    const availableDates = getDateList({
        startDate,
        endDate,
        workingDays,
        holidays,
        meetings,
    });

    const requiredVisits = doctors.reduce(
        (sum, doctor) =>
            sum + getDoctorFrequency(doctor),
        0
    );

    // الكول ريت المدخل من الإعدادات هو متوسط الزيارات
    // اليومية المستهدف؛ عند غيابه نستخدم الافتراضي.
    const effectiveCallRate = sanitizeCallRate(callRate);

    if (availableDates.length === 0) {
        return {
            success: false,
            days: [],
            errors: [
                tt("noWorkingDays"),
            ],
            warnings: [],
            stats: {
                requiredVisits,
                scheduledVisits: 0,
                availableDays: 0,
                averageVisitsPerDay: 0,
                callRate: effectiveCallRate,
            },
        };
    }

    // السعة القصوى فقط هي 16 زيارة في اليوم.
    if (
        requiredVisits >
        availableDates.length * MAX_DAILY_VISITS
    ) {
        return {
            success: false,
            days: [],
            errors: [
                tt("requiredExceedsCapacity", { required: requiredVisits, capacity: availableDates.length * MAX_DAILY_VISITS }),
            ],
            warnings: [],
            stats: {
                requiredVisits,
                scheduledVisits: 0,
                availableDays: availableDates.length,
                averageVisitsPerDay: 0,
                callRate: effectiveCallRate,
            },
        };
    }

    // لا نشترط حداً أدنى لعدد الزيارات في اليوم.
    // نوزع الزيارات حول متوسط الكول ريت المستهدف، مع الحفاظ على
    // تكرار كل دكتور، والحد الأقصى يبقى سقفاً فقط وليس هدفاً إلزامياً.
    const targetLoad = effectiveCallRate;

    // تقدير الحد الأدنى من الأيام لكل منطقة: يكفي لسعة 16 زيارة
    // في اليوم، ولا يقل عن أكبر فريكونسي في المنطقة لأن زيارات
    // الدكتور الواحد لازم تكون في أيام مختلفة بفاصل 6 أيام.
    const brickRequirements = new Map();

    for (const doctor of doctors) {
        const brick = getDoctorZone(
            doctor,
            zoneGroupMap
        );
        const frequency = getDoctorFrequency(doctor);

        if (!brickRequirements.has(brick)) {
            brickRequirements.set(brick, {
                visits: 0,
                maxFrequency: 0,
            });
        }

        const info = brickRequirements.get(brick);
        info.visits += frequency;
        info.maxFrequency = Math.max(
            info.maxFrequency,
            frequency
        );
    }

    let minimumBrickDays = 0;

    const brickDayDetails = [];

    for (const [brick, info] of brickRequirements.entries()) {
        if (info.visits === 0) continue;

        const days = Math.max(
            Math.ceil(info.visits / MAX_DAILY_VISITS),
            info.maxFrequency
        );
        minimumBrickDays += days;
        brickDayDetails.push({ brick, days });
    }

    brickDayDetails.sort((a, b) => b.days - a.days);

    const capacityWarning =
        minimumBrickDays > availableDates.length
            ? tt("notEnoughDaysForZones", { available: availableDates.length, minimum: minimumBrickDays }) +
              " " +
              tt("notEnoughDaysForZonesDetail", {
                  details: brickDayDetails
                      .map((d) =>
                          tt("notEnoughDaysForZonesZone", {
                              zone: d.brick,
                              days: d.days,
                          })
                      )
                      .join(getEngineLang() === "en" ? ", " : "، "),
              }) +
              " " +
              tt("notEnoughDaysForZonesAdvice", {
                  biggest: brickDayDetails[0]?.brick || "",
              })
            : null;

    let bestAttempt = null;
    let attemptsUsed = 0;

    const combinationsByFrequency = new Map();

    const preparedDoctors = doctors.map(
        (doctor, index) => {
            const frequency = getDoctorFrequency(doctor);

            if (
                frequency > 0 &&
                !combinationsByFrequency.has(frequency)
            ) {
                combinationsByFrequency.set(
                    frequency,
                    generateEvenCombinations(
                        availableDates,
                        frequency
                    )
                );
            }

            return {
                ...doctor,
                _index: index,
                _key: getDoctorKey(doctor, index),
                _frequency: frequency,
                _brick: getDoctorZone(
                    doctor,
                    zoneGroupMap
                ),
                _combinations:
                    combinationsByFrequency.get(
                        frequency
                    ) || [],
            };
        }
    );

    for (
        let attempt = 0;
        attempt < MAX_ATTEMPTS;
        attempt++
    ) {
        attemptsUsed++;

        const result = runPlanningAttempt({
            preparedDoctors,
            availableDates,
            targetLoad,
        });

        if (
            !bestAttempt ||
            result.score > bestAttempt.score
        ) {
            bestAttempt = result;
        }

        const allDoctorsCompleted = doctors.every(
            (doctor, index) =>
                result.scheduledByDoctor.get(
                    getDoctorKey(doctor, index)
                ) ===
                getDoctorFrequency(doctor)
        );

        const allDaysWithinLimits = result.days.every(
            (day) =>
                day.visits.length <= MAX_DAILY_VISITS
        );

        if (
            allDoctorsCompleted &&
            allDaysWithinLimits
        ) {
            bestAttempt = result;
            break;
        }
    }

    const greedyCompleted =
        bestAttempt &&
        doctors.every(
            (doctor, index) =>
                bestAttempt.scheduledByDoctor.get(
                    getDoctorKey(doctor, index)
                ) === getDoctorFrequency(doctor)
        ) &&
        bestAttempt.days.every(
            (day) =>
                day.visits.length <= MAX_DAILY_VISITS
        );

    // لو التوزيع المباشر لم يكتمل، جرّب توزيع الأيام على
    // المناطق أولاً ثم جدولة دكاترة كل منطقة داخل أيامها.
    if (!greedyCompleted) {
        for (
            let partitionAttempt = 0;
            partitionAttempt < 80;
            partitionAttempt++
        ) {
            attemptsUsed++;

            const result = runPartitionedAttempt({
                preparedDoctors,
                availableDates,
                seed: partitionAttempt,
                targetRate: effectiveCallRate,
            });

            if (
                !bestAttempt ||
                result.score > bestAttempt.score
            ) {
                bestAttempt = result;
            }

            const allDoctorsCompleted = doctors.every(
                (doctor, index) =>
                    result.scheduledByDoctor.get(
                        getDoctorKey(doctor, index)
                    ) ===
                    getDoctorFrequency(doctor)
            );

            const allDaysWithinLimits =
                result.days.every(
                    (day) =>
                        day.visits.length <=
                        MAX_DAILY_VISITS
                );

            if (
                allDoctorsCompleted &&
                allDaysWithinLimits
            ) {
                bestAttempt = result;
                break;
            }
        }
    }

    const incompleteDoctorsBeforeOutput = doctors
        .map((doctor, index) => ({
            doctor,
            required: getDoctorFrequency(doctor),
            scheduled:
                bestAttempt.scheduledByDoctor.get(
                    getDoctorKey(doctor, index)
                ) || 0,
        }))
        .filter(
            (item) => item.scheduled !== item.required
        );

    const scheduledBeforeOutput =
        bestAttempt.days.reduce(
            (sum, day) =>
                sum + day.visits.length,
            0
        );

    const planIncomplete =
        scheduledBeforeOutput !== requiredVisits ||
        incompleteDoctorsBeforeOutput.length > 0;

    const days = bestAttempt.days.map((day) => ({
        ...day,
        totalVisits: day.visits.length,
        bricks: undefined,
    }));

    const scheduledVisits = days.reduce(
        (sum, day) => sum + day.visits.length,
        0
    );

    const completedDoctors =
        doctors.length -
        incompleteDoctorsBeforeOutput.length;

    const validation = validateVisitPlan({
        days,
        doctors,
        workingDays,
        holidays,
        meetings,
        zoneGroups,
    });

    // عدم اكتمال الخطة (زيارات ناقصة) يظهر في قسم الأخطاء بالأسفل،
    // ومخالفات القواعد الفعلية (فواصل، خلط مناطق...) تظهر في بطاقة
    // "نتيجة مراجعة الخطة" فقط، حتى لا يتكرر نفس الدكتور في القسمين.
    const errors = [];

    if (planIncomplete) {
        errors.unshift(
            tt("planIncomplete", { scheduled: scheduledVisits, required: requiredVisits })
        );

        if (capacityWarning) {
            errors.unshift(capacityWarning);
        }

        const preview =
            incompleteDoctorsBeforeOutput.slice(0, 10);

        for (const item of preview) {
            errors.push(
                tt("doctorScheduledVsRequired", { name: item.doctor.name, required: item.required, scheduled: item.scheduled })
            );
        }

        if (
            incompleteDoctorsBeforeOutput.length > 10
        ) {
            errors.push(
                tt("moreIncompleteDoctors", { count: incompleteDoctorsBeforeOutput.length - 10 })
            );
        }

        const periodSpanDays = getDateDifference(
            availableDates[0].dateObject,
            availableDates[
                availableDates.length - 1
            ].dateObject
        );

        for (const item of incompleteDoctorsBeforeOutput) {
            const minimumSpan =
                (item.required - 1) * MIN_GAP_DAYS;

            if (
                item.required > 1 &&
                minimumSpan > periodSpanDays
            ) {
                errors.push(
                    tt("frequencyNotAchievable", { name: item.doctor.name, required: item.required, minimumSpan, minGap: MIN_GAP_DAYS, periodSpan: periodSpanDays })
                );
            }
        }

        errors.push(
            tt("howToComplete")
        );
    }

    const loads = days.map(
        (day) => day.visits.length
    );

    const averageVisitsPerDay =
        days.length > 0
            ? scheduledVisits / days.length
            : 0;

    const stats = {
        requiredVisits,
        scheduledVisits,
        availableDays: availableDates.length,

        averageVisitsPerDay: Number(
            averageVisitsPerDay.toFixed(2)
        ),

        callRate: effectiveCallRate,

        targetCallRate: effectiveCallRate,

        callRateDifference: Number(
            (
                averageVisitsPerDay -
                effectiveCallRate
            ).toFixed(2)
        ),

        completedDoctors,
        incompleteDoctors:
            incompleteDoctorsBeforeOutput.length,

        minDailyVisits:
            loads.length > 0
                ? Math.min(...loads)
                : 0,

        maxDailyVisits:
            loads.length > 0
                ? Math.max(...loads)
                : 0,

        attemptsUsed,
    };

    const warnings = [
        ...validation.warnings,
    ];

    if (scheduledVisits !== requiredVisits) {
        warnings.push(
            tt("cannotScheduleAll")
        );
    }

    if (
        averageVisitsPerDay >
        MAX_DAILY_VISITS
    ) {
        warnings.push(
            tt("averageExceedsMax", { max: MAX_DAILY_VISITS })
        );
    }

    if (
        Math.abs(
            averageVisitsPerDay - effectiveCallRate
        ) > 0.5
    ) {
        warnings.push(
            tt("averageFarFromTarget", { average: averageVisitsPerDay.toFixed(2), target: effectiveCallRate })
        );
    }

    return {
        success: errors.length === 0 && validation.valid,
        days,
        errors,
        warnings,
        stats,
    };
}
