import type { ApiMeta } from "@/api/types/platform";

export type KeywordRow = {
    id: number;
    text: string;
    source: string | null;
    tier: string;
    location: string;
    language: string;
    intent: string | null;
    created_at: string | null;
};

export type Pagination = {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
};

export type KeywordListResponse = {
    data: KeywordRow[];
    pagination: Pagination;
    meta: ApiMeta;
};
