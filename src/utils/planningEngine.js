import { tt } from "../i18n/engineText.js";
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
    ashmoun: "اشمون",
    monouf: "منوف",
    menuf: "منوف",
    bagour: "الباجور",
    baghour: "الباجور",
    sadat: "السادات",
    el_sadat: "السادات",
    "el sadat": "السادات",
    senteris: "سنتريس",
    "astanha": "اسطنها",
    "istanha": "اسطنها",
    sers: "سرس",
    "sers layan": "سرس",
    shohada: "الشهداء",
    "el shohada": "الشهداء",
    talia: "طليا",
    samadoun: "سمدون",
    smadoun: "سمدون",
    teta: "تتا",
    "kafr fisha": "كفر فيشه",
    "shobra baloula": "شبرا بلوله",
    "bay arab": "بي العرب",
    "madinet sadat": "السادات",
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

function normalizeBrick(value) {
    const raw = String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

    if (!raw) {
        return "غير محدد";
    }

    const englishName = raw
        .replace(/[^a-z0-9 ]/g, "")
        .trim();

    if (BRICK_ALIASES[englishName]) {
        return BRICK_ALIASES[englishName]
            .replace(/[أإآ]/g, "ا")
            .replace(/ة/g, "ه");
    }

    return raw
        .replace(/[أإآ]/g, "ا")
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
    ["اشمون", "طليا", "سمدون"],
    ["منوف", "تتا", "كفر فيشه", "شبرا بلوله"],
    ["الباجور", "بي العرب"],
    ["سرس", "سرس الليان"],
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
                            brick && brick !== "غير محدد"
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
            doctor._combinations.length > 0
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

export function runPartitionedAttempt({
    preparedDoctors,
    availableDates,
    seed = 0,
    targetRate = TARGET_CALL_RATE,
}) {
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

    const brickInfos = [...brickLists.entries()]
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

    // توزيع الأيام على المناطق بالتساوي على طول فترة البلان،
    // حتى تكون أيام كل منطقة متباعدة وتسمح بفواصل 6-25 يوم.
    const assignment = new Map(
        brickInfos.map((info) => [info.brick, []])
    );

    const rotation =
        brickInfos.length > 0
            ? seed % brickInfos.length
            : 0;

    const order = [
        ...brickInfos.slice(rotation),
        ...brickInfos.slice(0, rotation),
    ];

    const remaining = new Map(
        order.map((info) => [info.brick, info.need])
    );

    const dealSequence = [];
    let active = true;

    while (active) {
        active = false;

        for (const info of order) {
            if ((remaining.get(info.brick) || 0) > 0) {
                dealSequence.push(info.brick);
                remaining.set(
                    info.brick,
                    remaining.get(info.brick) - 1
                );
                active = true;
            }
        }
    }

    const total = dealSequence.length;
    const usedIndexes = new Set();

    dealSequence.forEach((brick, k) => {
        let position =
            total === 1
                ? Math.floor(
                    (availableDates.length - 1) / 2
                )
                : Math.round(
                    (k * (availableDates.length - 1)) /
                    (total - 1)
                );

        while (
            position < availableDates.length &&
            usedIndexes.has(position)
        ) {
            position++;
        }

        if (position >= availableDates.length) {
            position = availableDates.length - 1;

            while (
                position >= 0 &&
                usedIndexes.has(position)
            ) {
                position--;
            }
        }

        if (position >= 0) {
            usedIndexes.add(position);
            assignment
                .get(brick)
                .push(availableDates[position]);
        }
    });

    // جدولة دكاترة كل منطقة داخل أيامها المخصصة فقط.
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
            Math.max(
                1,
                info.visits / brickDates.length
            )
        );

        const combosByFrequency = new Map();

        const ordered = [...info.list].sort(
            (a, b) => b._frequency - a._frequency
        );

        for (const doctor of ordered) {
            if (doctor._frequency === 0) {
                scheduledByDoctor.set(doctor._key, 0);
                continue;
            }

            if (
                !combosByFrequency.has(doctor._frequency)
            ) {
                combosByFrequency.set(
                    doctor._frequency,
                    generateEvenCombinations(
                        brickDates,
                        doctor._frequency
                    )
                );
            }

            const combinations = combosByFrequency.get(
                doctor._frequency
            );

            if (combinations.length === 0) {
                failedDoctors.push(doctor);
                scheduledByDoctor.set(doctor._key, 0);
                continue;
            }

            const offset = Math.floor(
                Math.random() * combinations.length
            );

            const candidates = [
                ...combinations.slice(offset),
                ...combinations.slice(0, offset),
            ];

            let bestCombination = null;
            let bestCost = Infinity;

            for (const combination of candidates) {
                let totalCost = 0;
                let valid = true;

                for (const date of combination) {
                    const day = daysByDate.get(date.date);
                    const load = day.visits.length;

                    if (load >= MAX_DAILY_VISITS) {
                        valid = false;
                        break;
                    }

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

                if (valid && totalCost < bestCost) {
                    bestCost = totalCost;
                    bestCombination = combination;
                }
            }

            if (!bestCombination) {
                failedDoctors.push(doctor);
                scheduledByDoctor.set(doctor._key, 0);
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

    for (const info of brickRequirements.values()) {
        if (info.visits === 0) continue;

        minimumBrickDays += Math.max(
            Math.ceil(info.visits / MAX_DAILY_VISITS),
            info.maxFrequency
        );
    }

    const capacityWarning =
        minimumBrickDays > availableDates.length
            ? tt("notEnoughDaysForZones", { available: availableDates.length, minimum: minimumBrickDays })
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
