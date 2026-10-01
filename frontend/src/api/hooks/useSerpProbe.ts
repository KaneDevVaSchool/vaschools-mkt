import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import type { SerpProbeResponse } from "@/api/types/platform";

export type SerpProbeInput = {
    keyword?: string;
    depth?: number;
    persist?: boolean;
};

export function useSerpProbe() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: SerpProbeInput = {}) =>
            apiFetch<SerpProbeResponse>("/api/v1/platform/serp-probe", {
                method: "POST",
                body: JSON.stringify({
                    keyword: input.keyword ?? "trường quốc tế tphcm",
                    depth: input.depth ?? 10,
                    persist: input.persist ?? true,
                }),
            }),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ["platform", "status"] });
        },
    });
}
