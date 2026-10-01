import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import type { KeywordListResponse } from "@/api/types/keywords";

export type KeywordListParams = {
    page: number;
    per_page?: number;
    source?: string;
    q?: string;
    enabled?: boolean;
};

export function useKeywordList(params: KeywordListParams) {
    const sp = new URLSearchParams();
    sp.set("page", String(params.page));
    sp.set("per_page", String(params.per_page ?? 50));
    if (params.source) sp.set("source", params.source);
    if (params.q?.trim()) sp.set("q", params.q.trim());

    const { enabled = true, ...queryParams } = params;

    return useQuery({
        queryKey: ["keywords", queryParams],
        queryFn: () => apiFetch<KeywordListResponse>(`/api/v1/keywords?${sp}`),
        placeholderData: (prev) => prev,
        enabled,
    });
}
