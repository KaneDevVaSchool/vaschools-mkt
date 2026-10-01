import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import type { SerpSearchResponse } from "@/api/types/serp";

/**
 * Tìm kiếm SERP trực tiếp — MỖI LẦN GỌI LÀ 1 REQUEST CÓ PHÍ.
 *
 * Vì vậy query này không bao giờ tự chạy: `enabled` chỉ nên bật sau khi người
 * dùng bấm tìm, và dữ liệu đã lấy được giữ lại vô hạn (`staleTime: Infinity`)
 * để refetch khi focus/mount không phát sinh thêm chi phí. Muốn gọi lại thật
 * sự thì dùng `refetch()` từ hành động của người dùng.
 */
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
        staleTime: Infinity,
        gcTime: 30 * 60 * 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: false,
    });
}
