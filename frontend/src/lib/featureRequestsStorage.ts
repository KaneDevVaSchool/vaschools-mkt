export type FeatureRequestStatus = "pending" | "reviewing" | "approved" | "rejected" | "done";

export type FeatureRequestItem = {
    id: string;
    description: string;
    page_title: string | null;
    page_url: string | null;
    status: FeatureRequestStatus;
    created_at: string;
    updated_at: string;
};

const STORAGE_KEY = "mkt-feature-requests";

function readAll(): FeatureRequestItem[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as FeatureRequestItem[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeAll(items: FeatureRequestItem[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
        /* ignore */
    }
}

export function loadLocalFeatureRequests(): FeatureRequestItem[] {
    return readAll().sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
}

export function addLocalFeatureRequest(input: {
    description: string;
    page_title: string | null;
    page_url: string | null;
}): FeatureRequestItem {
    const now = new Date().toISOString();
    const item: FeatureRequestItem = {
        id: crypto.randomUUID(),
        description: input.description,
        page_title: input.page_title,
        page_url: input.page_url,
        status: "pending",
        created_at: now,
        updated_at: now,
    };
    writeAll([item, ...readAll()]);
    return item;
}

export function updateLocalFeatureRequest(
    id: string,
    input: { description: string; page_title: string | null; page_url: string | null },
): FeatureRequestItem | null {
    const items = readAll();
    const idx = items.findIndex((r) => r.id === id);
    if (idx < 0) return null;
    const next = {
        ...items[idx],
        ...input,
        updated_at: new Date().toISOString(),
    };
    items[idx] = next;
    writeAll(items);
    return next;
}

export function deleteLocalFeatureRequest(id: string): void {
    writeAll(readAll().filter((r) => r.id !== id));
}

export function countOpenFeatureRequests(items: FeatureRequestItem[]): number {
    return items.filter((i) => i.status === "pending" || i.status === "reviewing").length;
}
