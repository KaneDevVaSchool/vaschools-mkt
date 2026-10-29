/** Path nội bộ SPA (pathname + search) — dùng sau OAuth. */
export function parseInternalRedirect(raw: string | null | undefined): {
    pathname: string;
    search: string;
} {
    if (!raw?.startsWith("/") || raw.startsWith("//")) {
        return { pathname: "/", search: "" };
    }
    const q = raw.indexOf("?");
    if (q === -1) {
        return { pathname: raw, search: "" };
    }
    return {
        pathname: raw.slice(0, q) || "/",
        search: raw.slice(q),
    };
}

export function internalRedirectPath(pathname: string, search: string): string {
    return `${pathname}${search}`;
}
