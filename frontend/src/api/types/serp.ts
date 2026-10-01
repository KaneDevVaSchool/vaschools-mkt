import type { Provenance } from "@/api/types/provenance";
import type { ApiMeta } from "@/api/types/platform";

export type SerpIdeaKind = "related_search" | "people_also_ask";

export type SerpSearchIdea = {
    text: string;
    kind: SerpIdeaKind;
    provenance: Provenance;
};

export type MetricField<T = number | null> = {
    value: T;
    provenance: Provenance;
    note?: string;
};

export type SerpOrganicRow = {
    position: MetricField<number>;
    domain: string;
    url: string;
    title: string;
    description: string | null;
};

export type SerpSearchResult = {
    query: string;
    provider: string;
    features: string[];
    results_count: MetricField<number | null>;
    ideas: SerpSearchIdea[];
    organic: SerpOrganicRow[];
    estimated_cost_usd: string;
};

export type SerpSearchResponse = {
    data: SerpSearchResult;
    meta: ApiMeta;
};
