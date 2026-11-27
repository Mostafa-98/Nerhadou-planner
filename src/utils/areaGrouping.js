import { normalizeBrick } from "./planningEngine";

const norm = (s) =>
    String(s || "")
        // إزالة علامات الاتجاه غير المرئية التي تأتي مع النص
        // المنسوخ من واتساب وتفشل المطابقة بصمت.
        .replace(/[‎‏‪-‮؜﻿]/g, "")
        .trim()
        .toLowerCase()
        .replace(/[أإآ]/g, "ا")
        .replace(/ة/g, "ه")
        .replace(/\s+/g, " ");

// Sheet areas (bricks) not covered by any configured group.
export function ungroupedAreas(doctors, zoneGroups) {
    const grouped = new Set(
        (zoneGroups || []).flat().map((brick) => norm(brick))
    );
    const areas = [
        ...new Set(
            (doctors || [])
                .map((d) => String(d.brick || "").trim())
                .filter(Boolean)
        ),
    ];
    return areas.filter((area) => !grouped.has(norm(area)));
}

// Parses pasted groups: one group per line, areas separated by commas
// (English or Arabic). Area tokens are matched to the imported sheet's
// areas with the same normalization the planner engine uses (Arabic
// variants and English transliterations both match).
// Returns { groups, unmatched, missing }:
// - groups: arrays of canonical imported area names, one per pasted line
// - unmatched: pasted tokens that match no imported area
// - missing: imported areas not covered by any pasted line
export function parseGroupsText(text, doctors) {
    const imported = [
        ...new Set(
            (doctors || [])
                .map((d) => String(d.brick || "").trim())
                .filter(Boolean)
        ),
    ];
    const byNorm = new Map();
    for (const brick of imported) {
        const key = normalizeBrick(brick);
        if (!byNorm.has(key)) byNorm.set(key, brick);
    }

    const groups = [];
    const unmatched = [];
    for (const rawLine of String(text || "").split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line) continue;
        const tokens = line
            .replace(/[‎‏‪-‮؜﻿]/g, "")
            .split(/[,،;]/)
            .map((t) => t.trim())
            .filter(Boolean);
        // مطابقة متسامحة: تطبيع كامل، ثم بدون "ال"، ثم تطابق
        // بادئة (مثل "سرس" مع "سرس الليان") لأن هجاء الشيت قد
        // يختصر الاسم.
        const stripAl = (v) => v.replace(/^ال/, "");
        const matchArea = (token) => {
            const key = normalizeBrick(token);
            if (byNorm.has(key)) return byNorm.get(key);
            const noAl = stripAl(key);
            for (const [k, brick] of byNorm) {
                if (stripAl(k) === noAl) return brick;
            }
            // تسامح إضافي: الألف والياء والألف المقصورة في آخر
            // الاسم تُعامل كحرف واحد (تتا = تتى).
            const relax = (v) =>
                v.replace(/[اىي](?=\s|$)/g, "ي");
            const relaxedNoAl = relax(noAl);
            for (const [k, brick] of byNorm) {
                if (relax(stripAl(k)) === relaxedNoAl) return brick;
            }
            if (noAl.length >= 3) {
                for (const [k, brick] of byNorm) {
                    const kk = relax(stripAl(k));
                    if (
                        kk.startsWith(relaxedNoAl) ||
                        relaxedNoAl.startsWith(kk)
                    ) {
                        return brick;
                    }
                }
            }
            return null;
        };

        const matched = [];
        for (const token of tokens) {
            const hit = matchArea(token);
            if (hit) {
                if (!matched.includes(hit)) matched.push(hit);
            } else {
                unmatched.push(token);
            }
        }
        if (matched.length) groups.push(matched);
    }

    const covered = new Set(groups.flat().map((brick) => normalizeBrick(brick)));
    const missing = imported.filter(
        (brick) => !covered.has(normalizeBrick(brick))
    );
    return { groups, unmatched, missing };
}
