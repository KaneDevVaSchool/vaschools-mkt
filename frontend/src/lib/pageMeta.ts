import { allNavItems } from "@/lib/navigation";
import { isPathActive } from "@/components/layout/sidebar/navUtils";

export type PageMeta = {
    title: string;
    description?: string;
    module?: string;
};

export function pageMetaForPath(pathname: string): PageMeta {
    let best: (ReturnType<typeof allNavItems>[number] & { href: string }) | null = null;

    for (const item of allNavItems()) {
        if (!isPathActive(pathname, item.href, item.end)) continue;
        if (!best || item.href.length > best.href.length) {
            best = item;
        }
    }

    if (!best) {
        return { title: "Marketing Intelligence" };
    }

    return {
        title: best.label,
        description: best.description,
        module: best.module,
    };
}

/** @deprecated Dùng pageMetaForPath */
export function pageTitleForPath(pathname: string): string {
    return pageMetaForPath(pathname).title;
}
