import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiFetch } from "./client";

export interface SessionUser {
    email: string;
    name: string;
    avatar_url: string | null;
}

export const authKeys = {
    me: ["auth", "me"] as const,
};

/**
 * Trạng thái đăng nhập hiện tại.
 *
 * 401 là câu trả lời hợp lệ ("chưa đăng nhập"), không phải lỗi — nên không
 * retry và không coi là error state.
 */
export function useMe() {
    return useQuery({
        queryKey: authKeys.me,
        queryFn: async () => {
            try {
                const res = await apiFetch<{ data: SessionUser }>("/auth/me");
                return res.data;
            } catch (err) {
                if (err instanceof ApiError && err.status === 401) return null;
                throw err;
            }
        },
        retry: false,
        staleTime: 5 * 60 * 1000,
    });
}

export function useLogout() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => apiFetch<unknown>("/auth/logout", { method: "POST" }),
        onSuccess: () => {
            qc.setQueryData(authKeys.me, null);
            qc.clear();
        },
    });
}
