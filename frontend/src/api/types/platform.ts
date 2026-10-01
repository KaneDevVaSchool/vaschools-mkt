import type { Provenance } from "@/api/types/provenance";

export type MetricField<T = number | boolean | string | null> = {
    value: T;
    provenance: Provenance;
    note?: string;
};

export type PlatformStatus = {
    week: number;
    database: MetricField<boolean>;
    redis: MetricField<boolean>;
    keyword_total: MetricField<number>;
    keywords_by_source: Record<string, number>;
    week1_seed_goal_met: MetricField<boolean>;
    our_domain: string | null;
    serp_provider: string;
    serp_provider_configured: boolean;
    serp_snapshot_total: MetricField<number>;
    google_ads_configured: boolean;
    environment: string;
};

export type SerpProbeTopOrganic = {
    position: number;
    domain: string;
    url: string;
    title: string;
};

export type SerpProbeResult = {
    keyword: string;
    provider: string;
    organic_count: number;
    features: string[];
    results_count: MetricField<number | null>;
    top_organic: SerpProbeTopOrganic | null;
    estimated_cost_usd: string;
    snapshot_id: number | null;
    persist_note: string | null;
};

export type SerpProbeResponse = {
    data: SerpProbeResult;
    meta: ApiMeta;
};

export type ApiMeta = {
    data_fetched_at: string;
    is_stale: boolean;
};

export type PlatformStatusResponse = {
    data: PlatformStatus;
    meta: ApiMeta;
};
