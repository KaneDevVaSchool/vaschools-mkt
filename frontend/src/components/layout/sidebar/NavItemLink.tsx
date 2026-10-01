import { NavLink } from "react-router-dom";
import type { NavLinkItem } from "@/lib/navigation";
import { navItemIcon, SidebarIcon } from "./icons";

type NavItemLinkProps = {
    item: NavLinkItem;
    active: boolean;
    collapsed?: boolean;
    variant?: "sidebar" | "flyout";
    onNavigate?: () => void;
};

export function NavItemLink({
    item,
    active,
    collapsed,
    variant = "sidebar",
    onNavigate,
}: NavItemLinkProps) {
    const icon = navItemIcon(item.id);
    const inner =
        variant === "flyout" ? (
            <>
                <span className="sidebar-nav-item__text">{item.label}</span>
                {item.module && <span className="sidebar-nav-item__tag sidebar-nav-item__tag--flyout">{item.module}</span>}
            </>
        ) : (
            <>
                <span className="sidebar-nav-item__icon">
                    <SidebarIcon name={icon} size={16} strokeWidth={1.75} />
                </span>
                {!collapsed && (
                    <>
                        <span className="sidebar-nav-item__text">{item.label}</span>
                        {item.module && <span className="sidebar-nav-item__tag">{item.module}</span>}
                    </>
                )}
                {collapsed && <span className="sidebar-nav-item__flyout">{item.label}</span>}
            </>
        );

    const rootClass = [
        "sidebar-nav-item",
        variant === "flyout" && "sidebar-nav-item--flyout",
        collapsed && variant === "sidebar" && "sidebar-nav-item--collapsed",
    ]
        .filter(Boolean)
        .join(" ");

    if (!item.ready) {
        return (
            <span
                className={`${rootClass} sidebar-nav-item--disabled`}
                title="Chưa dựng — xem lộ trình trong docs/"
            >
                {inner}
            </span>
        );
    }

    return (
        <NavLink
            to={item.href}
            end={item.end}
            className={({ isActive }) =>
                [
                    rootClass,
                    "sidebar-nav-item--link",
                    (isActive || active) && "sidebar-nav-item--active",
                ]
                    .filter(Boolean)
                    .join(" ")
            }
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
        >
            {inner}
        </NavLink>
    );
}
