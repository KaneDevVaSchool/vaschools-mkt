import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import type { SerpSearchResponse } from "@/api/types/serp";

export function useSerpSearch(q: string | undefined, enabled: boolean) {
    const trimmed = q?.trim() ?? "";
    return useQuery({
        queryKey: ["serp", "search", trimmed],
        queryFn: () =>
            apiFetch<SerpSearchResponse>("/api/v1/serp/search", {
                method: "POST",
                body: JSON.stringify({ q: trimmed, depth: 10 }),
            }),
        enabled: enabled && trimmed.length > 0,
        staleTime: 5 * 60 * 1000,
        retry: false,
    });
}
