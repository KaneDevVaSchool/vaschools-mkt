import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { navigationSections } from "@/lib/navigation";
import { NavSection } from "./sidebar/NavSection";
import {
    isPathActive,
    loadExpandedSections,
    persistExpandedSections,
} from "./sidebar/navUtils";
import { SidebarLogo, SidebarTagline } from "./sidebar/SidebarLogo";

type SidebarProps = {
    collapsed: boolean;
    mobileOpen: boolean;
    onCloseMobile: () => void;
};

export function Sidebar({ collapsed, mobileOpen, onCloseMobile }: SidebarProps) {
    const { pathname } = useLocation();

    const activeSectionIds = useMemo(
        () =>
            navigationSections
                .filter((section) =>
                    section.items.some((item) => isPathActive(pathname, item.href, item.end)),
                )
                .map((section) => section.id),
        [pathname],
    );

    const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
        const defaults: Record<string, boolean> = {};
        for (const section of navigationSections) {
            defaults[section.id] = Boolean(section.defaultOpen);
        }
        return loadExpandedSections(
            navigationSections.map((s) => s.id),
            defaults,
            activeSectionIds,
        );
    });

    useEffect(() => {
        if (activeSectionIds.length === 0) return;
        setExpanded((prev) => {
            const next = { ...prev };
            let changed = false;
            for (const id of activeSectionIds) {
                if (!next[id]) {
                    next[id] = true;
                    changed = true;
                }
            }
            if (changed) persistExpandedSections(next);
            return changed ? next : prev;
        });
    }, [activeSectionIds]);

    useEffect(() => {
        if (!mobileOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCloseMobile();
        };
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [mobileOpen, onCloseMobile]);

    const toggleSection = (id: string) => {
        setExpanded((prev) => {
            const next = { ...prev, [id]: !prev[id] };
            persistExpandedSections(next);
            return next;
        });
    };

    const renderBody = (isCollapsed: boolean, inDrawer = false) => (
        <div className="sidebar__body">
            <SidebarLogo collapsed={isCollapsed} onCloseMobile={inDrawer ? onCloseMobile : undefined} />
            <SidebarTagline collapsed={isCollapsed} />

            <nav className="sidebar-scroll sidebar__nav" aria-label="Điều hướng chính">
                {navigationSections.map((section) => (
                    <NavSection
                        key={section.id}
                        section={section}
                        expanded={expanded[section.id] ?? Boolean(section.defaultOpen)}
                        collapsed={isCollapsed}
                        pathname={pathname}
                        onToggle={() => toggleSection(section.id)}
                        onNavigate={onCloseMobile}
                    />
                ))}
            </nav>
        </div>
    );

    return (
        <>
            <aside
                className="sidebar-surface sidebar sidebar--rail-md"
                aria-label="Thanh điều hướng thu gọn"
                data-tour="sidebar"
            >
                {renderBody(true)}
            </aside>

            <aside
                className={[
                    "sidebar-surface sidebar sidebar--desktop",
                    collapsed ? "sidebar--collapsed" : "sidebar--expanded",
                ].join(" ")}
                aria-label="Thanh điều hướng"
                data-tour="sidebar"
            >
                {renderBody(collapsed)}
            </aside>

            {mobileOpen && (
                <div className="sidebar-drawer" role="dialog" aria-modal="true" aria-label="Menu điều hướng">
                    <button
                        type="button"
                        className="sidebar-drawer__overlay"
                        aria-label="Đóng overlay menu"
                        onClick={onCloseMobile}
                    />
                    <aside className="sidebar-surface sidebar sidebar--drawer drawer-in" data-tour="sidebar">
                        {renderBody(false, true)}
                    </aside>
                </div>
            )}
        </>
    );
}
