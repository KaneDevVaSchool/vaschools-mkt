import { useEffect, useRef, useState } from "react";
import type { NavSectionConfig } from "@/lib/navigation";
import { SidebarIcon } from "./icons";
import { NavItemLink } from "./NavItemLink";
import { isPathActive } from "./navUtils";

type NavSectionProps = {
    section: NavSectionConfig;
    expanded: boolean;
    collapsed: boolean;
    pathname: string;
    onToggle: () => void;
    onNavigate?: () => void;
};

export function NavSection({
    section,
    expanded,
    collapsed,
    pathname,
    onToggle,
    onNavigate,
}: NavSectionProps) {
    const hasActiveChild = section.items.some((item) =>
        isPathActive(pathname, item.href, item.end),
    );
    const [flyoutOpen, setFlyoutOpen] = useState(false);
    const flyoutRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!collapsed) setFlyoutOpen(false);
    }, [collapsed]);

    useEffect(() => {
        if (!flyoutOpen) return;
        const onClick = (e: MouseEvent) => {
            if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
                setFlyoutOpen(false);
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setFlyoutOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [flyoutOpen]);

    if (collapsed) {
        return (
            <div className="sidebar-section sidebar-section--rail" ref={flyoutRef}>
                <button
                    type="button"
                    className={[
                        "sidebar-section__rail-btn",
                        (hasActiveChild || flyoutOpen) && "sidebar-section__rail-btn--active",
                    ]
                        .filter(Boolean)
                        .join(" ")}
                    aria-label={section.label}
                    aria-expanded={flyoutOpen}
                    aria-haspopup="menu"
                    onClick={() => setFlyoutOpen((v) => !v)}
                >
                    <SidebarIcon name={section.icon} size={18} strokeWidth={1.75} />
                </button>

                {flyoutOpen && (
                    <div className="sidebar-flyout" role="menu" aria-label={section.label}>
                        <div className="sidebar-flyout__head">{section.label}</div>
                        <div className="sidebar-flyout__body">
                            {section.items.map((item) => (
                                <NavItemLink
                                    key={item.id}
                                    item={item}
                                    variant="flyout"
                                    active={isPathActive(pathname, item.href, item.end)}
                                    onNavigate={() => {
                                        setFlyoutOpen(false);
                                        onNavigate?.();
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <section
            className="sidebar-section"
            aria-labelledby={`nav-section-title-${section.id}`}
        >
            <button
                type="button"
                id={`nav-section-${section.id}`}
                className={[
                    "sidebar-section__head",
                    hasActiveChild && "sidebar-section__head--active",
                ]
                    .filter(Boolean)
                    .join(" ")}
                aria-expanded={expanded}
                aria-controls={`nav-section-panel-${section.id}`}
                onClick={onToggle}
            >
                <span className="sidebar-section__head-icon">
                    <SidebarIcon name={section.icon} size={14} strokeWidth={2} />
                </span>
                <span id={`nav-section-title-${section.id}`} className="sidebar-section__head-label">
                    {section.label}
                </span>
                <SidebarIcon
                    name="chevronRight"
                    className={[
                        "sidebar-section__chevron",
                        expanded && "sidebar-section__chevron--open",
                    ]
                        .filter(Boolean)
                        .join(" ")}
                />
            </button>

            <div
                id={`nav-section-panel-${section.id}`}
                role="region"
                aria-labelledby={`nav-section-title-${section.id}`}
                className={[
                    "sidebar-section__panel",
                    expanded && "sidebar-section__panel--open",
                ]
                    .filter(Boolean)
                    .join(" ")}
            >
                <div className="sidebar-section__panel-inner">
                    <ul className="sidebar-section__list">
                        {section.items.map((item) => (
                            <li key={item.id}>
                                <NavItemLink
                                    item={item}
                                    active={isPathActive(pathname, item.href, item.end)}
                                    onNavigate={onNavigate}
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
