import type { SidebarIconName } from "@/components/layout/sidebar/icons";

export type NavLinkItem = {
    id: string;
    label: string;
    href: string;
    ready: boolean;
    module?: string;
    end?: boolean;
    /** Mô tả ngắn — hiển thị dưới header app, không lặp thêm h1 trong trang. */
    description?: string;
};

export type NavSectionConfig = {
    id: string;
    label: string;
    icon: SidebarIconName;
    defaultOpen?: boolean;
    items: NavLinkItem[];
};

/**
 * Cấu trúc menu theo scope MVP + README N1–N4 (docs/00-overview/scope.md).
 * Mục `ready: false` — lộ trình, chưa có trang.
 */
export const navigationSections: NavSectionConfig[] = [
    {
        id: "overview",
        label: "Tổng quan",
        icon: "dashboard",
        defaultOpen: true,
        items: [
            {
                id: "home",
                label: "Bảng điều khiển",
                href: "/",
                ready: true,
                end: true,
                description:
                    "Trạng thái hạ tầng tuần 1, tiến độ từ khóa nền và lộ trình module N1–N4.",
            },
        ],
    },
    {
        id: "n1",
        label: "Từ khóa & Organic",
        icon: "search",
        defaultOpen: true,
        items: [
            {
                id: "kw-seed",
                label: "Bộ từ khóa nền",
                href: "/keywords/seed",
                ready: true,
                module: "N1",
                description:
                    "Seed thủ công + Google Suggest. Volume và SERP gắn từ tuần 2 (Keyword Overview).",
            },
            {
                id: "kw-overview",
                label: "Keyword Overview",
                href: "/keywords/overview",
                ready: false,
                module: "N1",
            },
            {
                id: "kw-magic",
                label: "Keyword Magic Tool",
                href: "/keywords/magic",
                ready: false,
                module: "N1",
            },
            {
                id: "kw-strategy",
                label: "Keyword Strategy Builder",
                href: "/keywords/strategy",
                ready: false,
                module: "N1",
            },
            {
                id: "domain-overview",
                label: "Domain Overview",
                href: "/keywords/domain",
                ready: false,
                module: "N1",
            },
            {
                id: "organic-research",
                label: "Organic Research",
                href: "/keywords/organic",
                ready: false,
                module: "N1",
            },
            {
                id: "rank-tracking",
                label: "Rank Tracking",
                href: "/keywords/ranks",
                ready: false,
                module: "N1",
            },
            {
                id: "competitor-detection",
                label: "Phát hiện đối thủ",
                href: "/keywords/competitor-detection",
                ready: false,
                module: "N1",
            },
        ],
    },
    {
        id: "n2",
        label: "Phân tích đối thủ",
        icon: "users",
        defaultOpen: false,
        items: [
            {
                id: "compare-domains",
                label: "Compare Domains",
                href: "/competitors/compare",
                ready: false,
                module: "N2",
            },
            {
                id: "traffic-estimation",
                label: "Traffic ước tính",
                href: "/competitors/traffic",
                ready: false,
                module: "N2",
            },
            {
                id: "branded-traffic",
                label: "Branded / Non-branded",
                href: "/competitors/branded",
                ready: false,
                module: "N2",
            },
            {
                id: "backlink-analytics",
                label: "Backlink Analytics",
                href: "/competitors/backlinks",
                ready: false,
                module: "N2",
            },
            {
                id: "content-gap",
                label: "Content Gap",
                href: "/competitors/content-gap",
                ready: false,
                module: "N2",
            },
        ],
    },
    {
        id: "n3",
        label: "Site Audit",
        icon: "scan",
        defaultOpen: false,
        items: [
            {
                id: "site-health",
                label: "Site Health",
                href: "/audit/health",
                ready: false,
                module: "N3",
            },
            {
                id: "audit-issues",
                label: "Lỗi & cảnh báo",
                href: "/audit/issues",
                ready: false,
                module: "N3",
            },
            {
                id: "core-web-vitals",
                label: "Core Web Vitals",
                href: "/audit/cwv",
                ready: false,
                module: "N3",
            },
            {
                id: "crawler-config",
                label: "Crawler & cấu hình",
                href: "/audit/crawler",
                ready: false,
                module: "N3",
            },
            {
                id: "ai-search-readiness",
                label: "AI Search readiness",
                href: "/audit/ai-search",
                ready: false,
                module: "N3",
            },
        ],
    },
    {
        id: "n4",
        label: "On-page Checker",
        icon: "fileCheck",
        defaultOpen: false,
        items: [
            {
                id: "onpage-hub",
                label: "Tổng quan On-page",
                href: "/onpage",
                ready: false,
                end: true,
                module: "N4",
            },
            {
                id: "ideas-strategy",
                label: "Strategy Ideas",
                href: "/onpage/strategy",
                ready: false,
                module: "N4",
            },
            {
                id: "ideas-technical",
                label: "Technical SEO Ideas",
                href: "/onpage/technical",
                ready: false,
                module: "N4",
            },
            {
                id: "ideas-ux",
                label: "UX Ideas",
                href: "/onpage/ux",
                ready: false,
                module: "N4",
            },
            {
                id: "ideas-semantic",
                label: "Semantic Ideas",
                href: "/onpage/semantic",
                ready: false,
                module: "N4",
            },
            {
                id: "ideas-content",
                label: "Content Ideas",
                href: "/onpage/content",
                ready: false,
                module: "N4",
            },
            {
                id: "ideas-serp",
                label: "SERP Features Ideas",
                href: "/onpage/serp-features",
                ready: false,
                module: "N4",
            },
            {
                id: "ideas-backlink",
                label: "Backlink Ideas",
                href: "/onpage/backlinks",
                ready: false,
                module: "N4",
            },
            {
                id: "onpage-review",
                label: "Duyệt gợi ý",
                href: "/onpage/review",
                ready: false,
                module: "N4",
            },
        ],
    },
];

/** Tất cả mục menu (flat) — tiện cho header title, breadcrumb sau này. */
export function allNavItems(): NavLinkItem[] {
    return navigationSections.flatMap((s) => s.items);
}
