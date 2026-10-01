import type { ReactNode } from "react";

type IconProps = {
    size?: number;
    className?: string;
    strokeWidth?: number;
};

const defaults = { size: 18, strokeWidth: 1.75 };

function Svg({
    children,
    size = defaults.size,
    className,
    strokeWidth = defaults.strokeWidth,
}: IconProps & { children: ReactNode }) {
    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            {children}
        </svg>
    );
}

export type SidebarIconName =
    | "dashboard"
    | "layers"
    | "search"
    | "users"
    | "scan"
    | "fileCheck"
    | "chevronRight"
    | "menu"
    | "x"
    | "sparkles"
    | "logOut"
    | "bell"
    | "alertTriangle"
    | "link";

export function SidebarIcon({
    name,
    ...props
}: IconProps & { name: SidebarIconName }) {
    switch (name) {
        case "dashboard":
            return (
                <Svg {...props}>
                    <rect width="7" height="9" x="3" y="3" rx="1" />
                    <rect width="7" height="5" x="14" y="3" rx="1" />
                    <rect width="7" height="9" x="14" y="12" rx="1" />
                    <rect width="7" height="5" x="3" y="16" rx="1" />
                </Svg>
            );
        case "layers":
            return (
                <Svg {...props}>
                    <path d="m12.83 2.18 8 3.99a1 1 0 0 1 0 1.83l-8 3.99a2 2 0 0 1-1.66 0l-8-3.99a1 1 0 0 1 0-1.83l8-3.99a2 2 0 0 1 1.66 0z" />
                    <path d="m22 12.65-8 3.99a2 2 0 0 1-1.66 0l-8-3.99" />
                    <path d="m22 17.65-8 3.99a2 2 0 0 1-1.66 0l-8-3.99" />
                </Svg>
            );
        case "search":
            return (
                <Svg {...props}>
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                </Svg>
            );
        case "users":
            return (
                <Svg {...props}>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </Svg>
            );
        case "scan":
            return (
                <Svg {...props}>
                    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                    <path d="M7 12h10" />
                </Svg>
            );
        case "fileCheck":
            return (
                <Svg {...props}>
                    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                    <path d="m9 15 2 2 4-4" />
                </Svg>
            );
        case "chevronRight":
            return (
                <Svg {...props} size={props.size ?? 14} strokeWidth={props.strokeWidth ?? 2}>
                    <path d="m9 18 6-6-6-6" />
                </Svg>
            );
        case "menu":
            return (
                <Svg {...props}>
                    <path d="M4 12h16" />
                    <path d="M4 6h16" />
                    <path d="M4 18h16" />
                </Svg>
            );
        case "x":
            return (
                <Svg {...props}>
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                </Svg>
            );
        case "sparkles":
            return (
                <Svg {...props} size={props.size ?? 13}>
                    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                </Svg>
            );
        case "logOut":
            return (
                <Svg {...props}>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" x2="9" y1="12" y2="12" />
                </Svg>
            );
        case "bell":
            return (
                <Svg {...props}>
                    <path d="M10.268 21a2 2 0 0 0 3.464 0" />
                    <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
                </Svg>
            );
        case "alertTriangle":
            return (
                <Svg {...props}>
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                </Svg>
            );
        case "link":
            return (
                <Svg {...props}>
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </Svg>
            );
        default:
            return null;
    }
}

const itemIconMap: Record<string, SidebarIconName> = {
    home: "dashboard",
    "kw-overview": "search",
    "kw-magic": "search",
    "kw-strategy": "layers",
    "domain-overview": "dashboard",
    "organic-research": "search",
    "rank-tracking": "layers",
    "competitor-detection": "users",
    "compare-domains": "users",
    "traffic-estimation": "layers",
    "branded-traffic": "search",
    "backlink-analytics": "layers",
    "content-gap": "fileCheck",
    "site-health": "scan",
    "audit-issues": "scan",
    "core-web-vitals": "scan",
    "crawler-config": "scan",
    "ai-search-readiness": "sparkles",
    "onpage-hub": "fileCheck",
    "ideas-strategy": "layers",
    "ideas-technical": "scan",
    "ideas-ux": "dashboard",
    "ideas-semantic": "search",
    "ideas-content": "fileCheck",
    "ideas-serp": "search",
    "ideas-backlink": "layers",
    "onpage-review": "fileCheck",
};

export function navItemIcon(id: string): SidebarIconName {
    return itemIconMap[id] ?? "layers";
}
