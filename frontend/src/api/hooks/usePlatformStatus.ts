import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import type { PlatformStatusResponse } from "@/api/types/platform";

export function usePlatformStatus() {
    return useQuery({
        queryKey: ["platform", "status"],
        queryFn: () => apiFetch<PlatformStatusResponse>("/api/v1/platform/status"),
        retry: 1,
    });
}
