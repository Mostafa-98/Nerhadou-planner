const PREFIX = "visit-planner-";

export function exportAllData() {
    const data = {};
    for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && key.startsWith(PREFIX)) {
            data[key] = localStorage.getItem(key);
        }
    }
    const payload = {
        app: "medical-visit-planner",
        version: 1,
        exportedAt: new Date().toISOString(),
        data,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `visit-planner-backup-${stamp}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    return Object.keys(data).length;
}

export function importAllDataText(text) {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || parsed.app !== "medical-visit-planner") {
        throw new Error("not a visit-planner backup file");
    }
    const data = parsed.data;
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("backup file has no data");
    }
    const entries = Object.entries(data);
    if (!entries.length) {
        throw new Error("backup file has no data");
    }
    entries.forEach(([key, value]) => {
        if (!key.startsWith(PREFIX) || typeof value !== "string") {
            throw new Error("backup file has invalid entries");
        }
    });
    entries.forEach(([key, value]) => {
        localStorage.setItem(key, value);
    });
    return entries.length;
}

export async function importAllData(file) {
    const text = await file.text();
    return importAllDataText(text);
}
