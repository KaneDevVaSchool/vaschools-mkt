import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useKeywordList } from "@/api/hooks/useKeywords";
import { usePlatformStatus } from "@/api/hooks/usePlatformStatus";
import { useSerpSearch } from "@/api/hooks/useSerpSearch";
import type { SerpIdeaKind } from "@/api/types/serp";
import PageView from "@/components/layout/PageView";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import GoalProgress from "@/components/ui/GoalProgress";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import "./KeywordSeedPage.css";

const GOAL = 2000;
const PER_PAGE = 50;

const SERP_KIND_LABEL: Record<SerpIdeaKind, string> = {
    related_search: "Liên quan",
    people_also_ask: "PAA",
};

const SERP_KIND_TAG: Record<SerpIdeaKind, string> = {
    related_search: "data-tag--teal",
    people_also_ask: "data-tag--indigo",
};

type SearchMode = "db" | "serp";

function SearchIcon() {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden="true"
        >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
        </svg>
    );
}

/** Dãy số trang gọn: 1 … n-1 n n+1 … tổng */
function pageWindow(current: number, totalPages: number): (number | "gap")[] {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const out: (number | "gap")[] = [1];
    const from = Math.max(2, current - 1);
    const to = Math.min(totalPages - 1, current + 1);
    if (from > 2) out.push("gap");
    for (let p = from; p <= to; p += 1) out.push(p);
    if (to < totalPages - 1) out.push("gap");
    out.push(totalPages);
    return out;
}

export default function KeywordSeedPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const source = searchParams.get("source") || "";
    const modeParam = searchParams.get("mode");
    const mode: SearchMode = modeParam === "serp" ? "serp" : "db";
    const [draftQ, setDraftQ] = useState(searchParams.get("q") || "");
    const q = searchParams.get("q") || undefined;

    /* Gọi SerpAPI là có phí, nên chỉ chạy khi người dùng chủ động bấm tìm trong
       phiên này. Mở thẳng URL có ?q= (bookmark, refresh, nút back) sẽ hiện nút
       xác nhận thay vì tự tiêu quota. */
    const [serpConfirmed, setSerpConfirmed] = useState<string | null>(null);
    const serpAllowed = Boolean(q) && serpConfirmed === q;

    const { data: platform } = usePlatformStatus();
    const serpReady =
        platform?.data.serp_provider === "serpapi" && platform.data.serp_provider_configured;

    const { data, isLoading, isError, error, refetch, isFetching } = useKeywordList({
        page,
        per_page: PER_PAGE,
        source: source || undefined,
        q,
        enabled: mode === "db",
    });

    const {
        data: serpData,
        isLoading: serpLoading,
        isError: serpError,
        error: serpErr,
        refetch: refetchSerp,
        isFetching: serpFetching,
    } = useSerpSearch(q, mode === "serp" && serpReady && serpAllowed);

    const hasFilters = Boolean(q || source);
    const dbTotal = platform?.data.keyword_total.value ?? 0;
    const listTotal = data?.pagination.total;
    const total = listTotal ?? dbTotal;
    const bySource = platform?.data.keywords_by_source ?? {};

    /** Nguồn cho segmented control — kèm số lượng để thấy ngay phân bố. */
    const sourceOptions = useMemo(() => {
        const known = ["seed", "suggest"];
        const extra = Object.keys(bySource).filter((k) => !known.includes(k));
        return [
            { id: "", label: "Tất cả", count: dbTotal },
            ...[...known, ...extra].map((id) => ({
                id,
                label: id,
                count: bySource[id] ?? 0,
            })),
        ];
    }, [bySource, dbTotal]);

    const emptyHint = useMemo(() => {
        if (mode === "serp") return null;
        if (isLoading || isError) return null;
        if (listTotal !== undefined && listTotal > 0) return null;

        if (dbTotal > 0 && hasFilters) {
            const parts = [
                q ? `từ khóa “${q}”` : null,
                source ? `nguồn “${source}”` : null,
            ].filter(Boolean);
            return {
                title: "Không có từ khóa khớp bộ lọc",
                desc:
                    parts.length > 0
                        ? `Không tìm thấy kết quả với ${parts.join(" và ")}. Thử cụm khác (ví dụ: trường quốc tế, mầm non) hoặc xóa lọc.`
                        : "Thử đổi điều kiện tìm kiếm hoặc xóa lọc.",
                showClearFilters: true,
            };
        }

        if (dbTotal === 0 && (listTotal === undefined || listTotal === 0)) {
            return {
                title: "Chưa có từ khóa trong cơ sở dữ liệu",
                desc: "Từ thư mục dự án: docker compose up -d db redis api rồi docker compose run --rm api python -m vaschools_mkt.scripts.bootstrap_week1 --skip-migrate",
                showClearFilters: false,
            };
        }

        return null;
    }, [mode, isLoading, isError, listTotal, dbTotal, hasFilters, q, source]);

    function setSearchMode(nextMode: SearchMode) {
        const next = new URLSearchParams(searchParams);
        next.set("mode", nextMode);
        next.set("page", "1");
        if (nextMode === "serp") {
            next.delete("source");
        }
        setSearchParams(next);
    }

    function applySearch(e: React.FormEvent) {
        e.preventDefault();
        const next = new URLSearchParams(searchParams);
        next.set("page", "1");
        next.set("mode", mode);
        const trimmed = draftQ.trim();
        if (trimmed) next.set("q", trimmed);
        else next.delete("q");
        if (mode === "serp") setSerpConfirmed(trimmed || null);
        setSearchParams(next);
    }

    function setPage(p: number) {
        const next = new URLSearchParams(searchParams);
        next.set("page", String(p));
        setSearchParams(next);
    }

    function setSourceFilter(value: string) {
        const next = new URLSearchParams(searchParams);
        next.set("page", "1");
        if (value) next.set("source", value);
        else next.delete("source");
        setSearchParams(next);
    }

    function clearFilters() {
        setDraftQ("");
        setSearchParams(mode === "serp" ? { mode: "serp" } : {});
    }

    const showDbLoading = mode === "db" && isLoading;
    const showSerpLoading = mode === "serp" && serpLoading && serpAllowed;

    const rangeFrom = data && data.data.length > 0 ? (page - 1) * PER_PAGE + 1 : 0;
    const rangeTo = data ? (page - 1) * PER_PAGE + data.data.length : 0;
    const totalPages = data?.pagination.total_pages ?? 1;

    const ideaCounts = useMemo(() => {
        const ideas = serpData?.data.ideas ?? [];
        return {
            related: ideas.filter((i) => i.kind === "related_search").length,
            paa: ideas.filter((i) => i.kind === "people_also_ask").length,
        };
    }, [serpData]);

    return (
        <div className="kw-seed">
            <PageView width="full" description="">
                {/* Dải số liệu tổng quan — đọc được trạng thái kho từ khóa trong 1 cái nhìn */}
                {platform ? (
                    <div className="kw-seed__overview">
                        <div className="kw-seed__goal-card anim-rise" style={{ "--stagger-i": 0 } as React.CSSProperties}>
                            <GoalProgress
                                value={dbTotal}
                                goal={GOAL}
                                label="Mục tiêu tuần 1"
                                hint={
                                    dbTotal >= GOAL
                                        ? "Đã đạt mục tiêu tuần 1"
                                        : `Còn thiếu ${(GOAL - dbTotal).toLocaleString("vi-VN")} từ khóa để đạt mục tiêu tuần 1`
                                }
                            />
                        </div>

                        <div className="kw-seed__stats">
                            {sourceOptions
                                .filter((o) => o.id !== "")
                                .map((o, i) => {
                                    const share = dbTotal > 0 ? (o.count / dbTotal) * 100 : 0;
                                    return (
                                        <article
                                            key={o.id}
                                            className="stat-card anim-rise"
                                            style={{ "--stagger-i": i + 1 } as React.CSSProperties}
                                        >
                                            <p className="stat-card__label">Nguồn {o.label}</p>
                                            <p className="stat-card__value">
                                                {o.count.toLocaleString("vi-VN")}
                                                <span className="stat-card__unit">
                                                    {share.toFixed(1)}% kho
                                                </span>
                                            </p>
                                            <div className="mini-bar">
                                                <div
                                                    className={`mini-bar__fill${o.id === "suggest" ? " mini-bar__fill--teal" : ""}`}
                                                    style={{ width: `${Math.min(100, share)}%` }}
                                                />
                                            </div>
                                        </article>
                                    );
                                })}
                            <article
                                className="stat-card stat-card--warn anim-rise"
                                style={{ "--stagger-i": sourceOptions.length } as React.CSSProperties}
                            >
                                <p className="stat-card__label">Ảnh chụp SERP</p>
                                <p className="stat-card__value">
                                    {(platform.data.serp_snapshot_total.value ?? 0).toLocaleString(
                                        "vi-VN",
                                    )}
                                </p>
                                <p className="stat-card__sub">
                                    {serpReady ? "SerpAPI đã cấu hình" : "Chưa cấu hình SerpAPI"}
                                </p>
                            </article>
                        </div>
                    </div>
                ) : null}

                <div className="panel kw-seed__panel">
                    <div className="panel__strip" aria-hidden="true" />

                    {serpReady ? (
                        <div className="kw-seed__mode">
                            <div className="segmented" role="tablist" aria-label="Chế độ tìm kiếm">
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={mode === "db"}
                                    className={`segmented__btn${mode === "db" ? " segmented__btn--active" : ""}`}
                                    onClick={() => setSearchMode("db")}
                                >
                                    Cơ sở dữ liệu
                                    <span className="segmented__count">
                                        {dbTotal.toLocaleString("vi-VN")}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={mode === "serp"}
                                    className={`segmented__btn${mode === "serp" ? " segmented__btn--active" : ""}`}
                                    onClick={() => setSearchMode("serp")}
                                >
                                    SerpAPI
                                    <span className="segmented__count">trực tiếp</span>
                                </button>
                            </div>
                        </div>
                    ) : null}

                    <form className="data-toolbar" onSubmit={applySearch}>
                        <label className="data-toolbar__field">
                            <span>{mode === "serp" ? "Truy vấn Google (SerpAPI)" : "Tìm kiếm"}</span>
                            <span className="data-toolbar__search">
                                <span className="data-toolbar__search-icon">
                                    <SearchIcon />
                                </span>
                                <input
                                    type="search"
                                    value={draftQ}
                                    onChange={(e) => setDraftQ(e.target.value)}
                                    placeholder={
                                        mode === "serp"
                                            ? "Ví dụ: mì ý, trường quốc tế tphcm"
                                            : "Ví dụ: trường quốc tế"
                                    }
                                />
                            </span>
                        </label>

                        {/* Thay dropdown bằng segmented control — số lượng hiện luôn, không cần mở menu */}
                        {mode === "db" ? (
                            <div className="data-toolbar__field kw-seed__source-field">
                                <span>Nguồn</span>
                                <div
                                    className="segmented"
                                    role="group"
                                    aria-label="Lọc theo nguồn"
                                >
                                    {sourceOptions.map((o) => (
                                        <button
                                            key={o.id || "all"}
                                            type="button"
                                            aria-pressed={source === o.id}
                                            className={`segmented__btn${source === o.id ? " segmented__btn--active" : ""}`}
                                            onClick={() => setSourceFilter(o.id)}
                                        >
                                            {o.label}
                                            <span className="segmented__count">
                                                {o.count.toLocaleString("vi-VN")}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        <div className="kw-seed__actions">
                            <Button type="submit" variant="primary">
                                {mode === "serp" ? "Tìm trên SERP" : "Áp dụng"}
                            </Button>
                            {hasFilters ? (
                                <Button type="button" variant="ghost" onClick={clearFilters}>
                                    Xóa lọc
                                </Button>
                            ) : null}
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    if (mode !== "serp") {
                                        refetch();
                                        return;
                                    }
                                    if (q) setSerpConfirmed(q);
                                    if (serpAllowed) refetchSerp();
                                }}
                                disabled={mode === "serp" ? serpFetching : isFetching}
                            >
                                {(mode === "serp" ? serpFetching : isFetching) ? (
                                    <>
                                        <span className="spinner" aria-hidden="true" /> Đang tải
                                    </>
                                ) : (
                                    "Làm mới"
                                )}
                            </Button>
                        </div>
                    </form>

                    {mode === "serp" ? (
                        <p className="kw-seed__serp-hint">
                            Mỗi lần tìm ≈ 1 request SerpAPI (có phí). Kết quả gồm gợi ý liên quan,
                            PAA và top organic Google VN.
                        </p>
                    ) : null}

                    {mode === "db" && data?.meta?.data_fetched_at ? (
                        <div className="data-meta kw-seed__meta">
                            <span>
                                <strong>{total.toLocaleString("vi-VN")}</strong> từ khóa khớp
                                {q ? ` · “${q}”` : ""}
                                {source ? ` · nguồn ${source}` : ""}
                            </span>
                            <span>Dữ liệu {formatRelativeTime(data.meta.data_fetched_at)}</span>
                        </div>
                    ) : null}

                    {mode === "serp" && serpData?.meta?.data_fetched_at ? (
                        <div className="data-meta kw-seed__meta">
                            <span>
                                <strong>{serpData.data.ideas.length.toLocaleString("vi-VN")}</strong>{" "}
                                gợi ý ({ideaCounts.related} liên quan · {ideaCounts.paa} PAA) ·{" "}
                                <strong>
                                    {serpData.data.organic.length.toLocaleString("vi-VN")}
                                </strong>{" "}
                                organic
                            </span>
                            <span>
                                SerpAPI · ~${serpData.data.estimated_cost_usd} ·{" "}
                                {formatRelativeTime(serpData.meta.data_fetched_at)}
                            </span>
                        </div>
                    ) : null}

                    {showDbLoading || showSerpLoading ? (
                        <div className="skeleton-rows" aria-busy="true" aria-label="Đang tải">
                            {Array.from({ length: 8 }, (_, i) => (
                                <div
                                    key={i}
                                    className="skeleton-rows__row"
                                    style={{ "--stagger-i": i } as React.CSSProperties}
                                >
                                    <span
                                        className="skeleton-rows__cell"
                                        style={{ flex: 4 }}
                                    />
                                    <span
                                        className="skeleton-rows__cell"
                                        style={{ flex: 1 }}
                                    />
                                    <span
                                        className="skeleton-rows__cell"
                                        style={{ flex: 1 }}
                                    />
                                    <span
                                        className="skeleton-rows__cell"
                                        style={{ flex: 1 }}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : null}

                    {mode === "db" && isError ? (
                        <div className="kw-seed__inline-error">
                            <p>{error instanceof Error ? error.message : "Lỗi tải dữ liệu"}</p>
                            <Button variant="secondary" size="sm" onClick={() => refetch()}>
                                Thử lại
                            </Button>
                        </div>
                    ) : null}

                    {mode === "serp" && serpError ? (
                        <div className="kw-seed__inline-error">
                            <p>{serpErr instanceof Error ? serpErr.message : "Lỗi SerpAPI"}</p>
                            <Button variant="secondary" size="sm" onClick={() => refetchSerp()}>
                                Thử lại
                            </Button>
                        </div>
                    ) : null}

                    {mode === "serp" && !q && !serpLoading ? (
                        <div className="kw-seed__empty-wrap">
                            <EmptyState
                                variant="panel"
                                tone="filter"
                                title="Nhập truy vấn và bấm Tìm trên SERP"
                                description="SerpAPI trả về từ khóa liên quan, câu hỏi PAA và kết quả organic thật trên Google Việt Nam."
                            />
                        </div>
                    ) : null}

                    {/* Có ?q= trong URL nhưng chưa bấm tìm trong phiên này: chờ xác
                        nhận để không tự tiêu quota SerpAPI khi refresh/bookmark. */}
                    {mode === "serp" && q && !serpAllowed ? (
                        <div className="kw-seed__empty-wrap">
                            <EmptyState
                                variant="panel"
                                tone="filter"
                                title={`Tìm “${q}” trên SerpAPI?`}
                                description="Truy vấn này nằm trong đường dẫn nhưng chưa được gửi. Mỗi lần tìm tốn khoảng 1 request SerpAPI có phí, nên cần bạn xác nhận."
                                action={
                                    <Button
                                        type="button"
                                        variant="primary"
                                        size="sm"
                                        onClick={() => setSerpConfirmed(q)}
                                    >
                                        Tìm trên SERP
                                    </Button>
                                }
                            />
                        </div>
                    ) : null}

                    {!showDbLoading && mode === "db" && !isError && emptyHint ? (
                        <div className="kw-seed__empty-wrap">
                            <EmptyState
                                variant="panel"
                                tone={emptyHint.showClearFilters ? "filter" : "database"}
                                title={emptyHint.title}
                                description={emptyHint.desc}
                                action={
                                    emptyHint.showClearFilters ? (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={clearFilters}
                                        >
                                            Xóa lọc
                                        </Button>
                                    ) : null
                                }
                            />
                        </div>
                    ) : null}

                    {mode === "serp" && serpAllowed && serpData && !serpLoading && !serpError ? (
                        <>
                            {serpData.data.ideas.length > 0 ? (
                                <>
                                    <div className="kw-seed__section">
                                        <h2 className="kw-seed__section-title">Gợi ý từ khóa</h2>
                                        <span className="kw-seed__section-count">
                                            {serpData.data.ideas.length.toLocaleString("vi-VN")} cụm
                                        </span>
                                    </div>
                                    <div className="data-table-wrap">
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th className="is-num">#</th>
                                                    <th>Cụm từ</th>
                                                    <th>Loại</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {serpData.data.ideas.map((row, i) => (
                                                    <tr key={`${row.kind}-${row.text}`}>
                                                        <td className="is-num">
                                                            <span className="data-table__rank">
                                                                {i + 1}
                                                            </span>
                                                        </td>
                                                        <td className="kw-seed__kw">{row.text}</td>
                                                        <td>
                                                            <span
                                                                className={`data-tag ${SERP_KIND_TAG[row.kind] ?? "data-tag--slate"}`}
                                                            >
                                                                {SERP_KIND_LABEL[row.kind] ??
                                                                    row.kind}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : null}
                            {serpData.data.organic.length > 0 ? (
                                <>
                                    <div className="kw-seed__section">
                                        <h2 className="kw-seed__section-title">Top organic</h2>
                                        <span className="kw-seed__section-count">
                                            {serpData.data.organic.length.toLocaleString("vi-VN")}{" "}
                                            kết quả
                                        </span>
                                    </div>
                                    <div className="data-table-wrap">
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th className="is-num">Hạng</th>
                                                    <th>Domain</th>
                                                    <th>Tiêu đề</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {serpData.data.organic.map((row) => (
                                                    <tr key={row.url}>
                                                        <td className="is-num">
                                                            <span
                                                                className={`data-table__rank${row.position.value <= 3 ? " data-table__rank--top" : ""}`}
                                                            >
                                                                {row.position.value}
                                                            </span>
                                                        </td>
                                                        <td className="kw-seed__domain">
                                                            {row.domain}
                                                        </td>
                                                        <td>
                                                            <a
                                                                href={row.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="kw-seed__link"
                                                            >
                                                                {row.title}
                                                            </a>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : null}
                            {serpData.data.ideas.length === 0 &&
                            serpData.data.organic.length === 0 ? (
                                <div className="kw-seed__empty-wrap">
                                    <EmptyState
                                        variant="panel"
                                        tone="filter"
                                        title="SerpAPI không trả về gợi ý"
                                        description="Thử truy vấn khác hoặc kiểm tra quota SerpAPI."
                                    />
                                </div>
                            ) : null}
                        </>
                    ) : null}

                    {mode === "db" && !showDbLoading && !isError && data && data.data.length > 0 ? (
                        <>
                            <div
                                className={`data-table-wrap${isFetching ? " kw-seed__table--busy" : ""}`}
                            >
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th className="is-num">#</th>
                                            <th>Từ khóa</th>
                                            <th>Nguồn</th>
                                            <th>Tier</th>
                                            <th>Ý định</th>
                                            <th>Vị trí</th>
                                            <th>Ngôn ngữ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.data.map((row, i) => (
                                            <tr key={row.id}>
                                                <td className="is-num kw-seed__idx">
                                                    {rangeFrom + i}
                                                </td>
                                                <td className="kw-seed__kw">{row.text}</td>
                                                <td>
                                                    <span
                                                        className={`data-tag ${row.source === "seed" ? "data-tag--indigo" : row.source === "suggest" ? "data-tag--teal" : "data-tag--slate"}`}
                                                    >
                                                        {row.source ?? "—"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="data-tag data-tag--gold">
                                                        {row.tier}
                                                    </span>
                                                </td>
                                                <td className="kw-seed__muted">
                                                    {row.intent ?? "—"}
                                                </td>
                                                <td className="kw-seed__muted">{row.location}</td>
                                                <td className="kw-seed__muted">{row.language}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Phân trang có số trang — nhảy trực tiếp, kèm khoảng đang xem */}
                            <nav className="data-pager" aria-label="Phân trang">
                                <p className="data-pager__info">
                                    Đang xem <strong>{rangeFrom.toLocaleString("vi-VN")}</strong>–
                                    <strong>{rangeTo.toLocaleString("vi-VN")}</strong> trong{" "}
                                    <strong>{total.toLocaleString("vi-VN")}</strong> từ khóa
                                </p>
                                {totalPages > 1 ? (
                                    <div className="data-pager__pages">
                                        <button
                                            type="button"
                                            className="data-pager__page"
                                            disabled={page <= 1}
                                            onClick={() => setPage(page - 1)}
                                            aria-label="Trang trước"
                                        >
                                            ‹
                                        </button>
                                        {pageWindow(page, totalPages).map((p, i) =>
                                            p === "gap" ? (
                                                <span
                                                    key={`gap-${i}`}
                                                    className="data-pager__gap"
                                                    aria-hidden="true"
                                                >
                                                    …
                                                </span>
                                            ) : (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    className={`data-pager__page${p === page ? " data-pager__page--active" : ""}`}
                                                    aria-current={p === page ? "page" : undefined}
                                                    onClick={() => setPage(p)}
                                                >
                                                    {p}
                                                </button>
                                            ),
                                        )}
                                        <button
                                            type="button"
                                            className="data-pager__page"
                                            disabled={page >= totalPages}
                                            onClick={() => setPage(page + 1)}
                                            aria-label="Trang sau"
                                        >
                                            ›
                                        </button>
                                    </div>
                                ) : null}
                            </nav>
                        </>
                    ) : null}
                </div>
            </PageView>
        </div>
    );
}
