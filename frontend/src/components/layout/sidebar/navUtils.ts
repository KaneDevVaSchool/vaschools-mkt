const SECTIONS_KEY = "mkt-sidebar-sections";
const COLLAPSE_KEY = "mkt-sidebar-collapsed";

export function isPathActive(pathname: string, href: string, end?: boolean): boolean {
    if (href === "/") {
        return pathname === "/" || pathname === "";
    }
    if (end) {
        return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
}

export function loadExpandedSections(
    sectionIds: string[],
    defaults: Record<string, boolean>,
    forceOpenIds: string[],
): Record<string, boolean> {
    const next: Record<string, boolean> = { ...defaults };
    try {
        const raw = localStorage.getItem(SECTIONS_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as Record<string, boolean>;
            for (const id of sectionIds) {
                if (typeof parsed[id] === "boolean") {
                    next[id] = parsed[id];
                }
            }
        }
    } catch {
        /* ignore */
    }
    for (const id of forceOpenIds) {
        next[id] = true;
    }
    return next;
}

export function persistExpandedSections(state: Record<string, boolean>): void {
    try {
        localStorage.setItem(SECTIONS_KEY, JSON.stringify(state));
    } catch {
        /* ignore */
    }
}

export function loadSidebarCollapsed(): boolean {
    try {
        return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
        return false;
    }
}

export function persistSidebarCollapsed(collapsed: boolean): void {
    try {
        localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
        /* ignore */
    }
}
