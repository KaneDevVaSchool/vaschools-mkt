export type KeywordSourceTrust = "high" | "medium" | "live" | "deprecated";

export type KeywordSourceDef = {
    id: string;
    label: string;
    shortLabel: string;
    description: string;
    trust: KeywordSourceTrust;
    /** Hiện trong bộ lọc nguồn (khi có dữ liệu hoặc là nguồn dự kiến). */
    filterable: boolean;
    /** Tính vào chế độ “Nguồn đáng tin” mặc định. */
    trusted: boolean;
    tagClass: string;
};

export const KEYWORD_SOURCES: KeywordSourceDef[] = [
    {
        id: "gsc",
        label: "Google Search Console",
        shortLabel: "GSC",
        description:
            "Query thật từ site VAS — nguồn chính xác nhất. Nạp qua export định kỳ (sắp có trong pipeline).",
        trust: "high",
        filterable: true,
        trusted: true,
        tagClass: "data-tag--gold",
    },
    {
        id: "suggest",
        label: "Google Suggest",
        shortLabel: "Suggest",
        description:
            "Gợi ý Autocomplete của Google (suggestqueries.google.com), mở rộng từ danh sách chủ đề nội bộ.",
        trust: "medium",
        filterable: true,
        trusted: true,
        tagClass: "data-tag--teal",
    },
    {
        id: "paa",
        label: "People Also Ask",
        shortLabel: "PAA",
        description: "Câu hỏi PAA trích từ SERP snapshot — dùng khi job SERP chạy định kỳ.",
        trust: "medium",
        filterable: true,
        trusted: true,
        tagClass: "data-tag--indigo",
    },
    {
        id: "serp_title",
        label: "Tiêu đề SERP",
        shortLabel: "SERP",
        description: "Cụm từ từ tiêu đề kết quả organic trong snapshot.",
        trust: "medium",
        filterable: true,
        trusted: true,
        tagClass: "data-tag--slate",
    },
    {
        id: "seed",
        label: "Seed YAML (đã ngừng)",
        shortLabel: "Seed",
        description: "Tổ hợp thủ công trong repo — không còn ghi vào kho làm việc.",
        trust: "deprecated",
        filterable: false,
        trusted: false,
        tagClass: "data-tag--slate",
    },
];

const BY_ID = new Map(KEYWORD_SOURCES.map((s) => [s.id, s]));

export const TRUSTED_SOURCE_IDS = KEYWORD_SOURCES.filter((s) => s.trusted).map((s) => s.id);

export function keywordSourceDef(source: string | null | undefined): KeywordSourceDef | null {
    if (!source) return null;
    return BY_ID.get(source) ?? null;
}

export function keywordSourceLabel(source: string | null | undefined): string {
    const def = keywordSourceDef(source);
    if (def) return def.shortLabel;
    return source ?? "—";
}

export function trustLabel(trust: KeywordSourceTrust): string {
    switch (trust) {
        case "high":
            return "Uy tín cao";
        case "medium":
            return "Tự động · Google";
        case "live":
            return "Trực tiếp · SerpAPI";
        case "deprecated":
            return "Đã ngừng";
        default:
            return trust;
    }
}
