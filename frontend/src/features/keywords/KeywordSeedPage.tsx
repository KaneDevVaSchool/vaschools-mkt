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

const SERP_KIND_LABEL: Record<SerpIdeaKind, string> = {
    related_search: "Liên quan",
    people_also_ask: "PAA",
};

type SearchMode = "db" | "serp";

export default function KeywordSeedPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const source = searchParams.get("source") || "";
    const modeParam = searchParams.get("mode");
    const mode: SearchMode = modeParam === "serp" ? "serp" : "db";
    const [draftQ, setDraftQ] = useState(searchParams.get("q") || "");
    const q = searchParams.get("q") || undefined;

    const { data: platform } = usePlatformStatus();
    const serpReady =
        platform?.data.serp_provider === "serpapi" && platform.data.serp_provider_configured;

    const { data, isLoading, isError, error, refetch, isFetching } = useKeywordList({
        page,
        per_page: 50,
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
    } = useSerpSearch(q, mode === "serp" && serpReady);

    const hasFilters = Boolean(q || source);
    const dbTotal = platform?.data.keyword_total.value ?? 0;
    const listTotal = data?.pagination.total;
    const total = listTotal ?? dbTotal;

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
    const showSerpLoading = mode === "serp" && serpLoading && Boolean(q);

    return (
        <div className="kw-seed">
            <PageView width="full" description="">
                <div className="panel kw-seed__panel">
                    <div className="panel__strip" aria-hidden="true" />
                    {platform ? (
                        <div className="kw-seed__goal">
                            <GoalProgress
                                value={platform.data.keyword_total.value ?? 0}
                                goal={GOAL}
                                label="Mục tiêu tuần 1"
                            />
                        </div>
                    ) : null}
                    {serpReady ? (
                        <div className="kw-seed__mode" role="tablist" aria-label="Chế độ tìm kiếm">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={mode === "db"}
                                className={`kw-seed__mode-btn${mode === "db" ? " kw-seed__mode-btn--active" : ""}`}
                                onClick={() => setSearchMode("db")}
                            >
                                Cơ sở dữ liệu
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={mode === "serp"}
                                className={`kw-seed__mode-btn${mode === "serp" ? " kw-seed__mode-btn--active" : ""}`}
                                onClick={() => setSearchMode("serp")}
                            >
                                SerpAPI
                            </button>
                        </div>
                    ) : null}

                    <form className="data-toolbar" onSubmit={applySearch}>
                    <label className="data-toolbar__field">
                        <span>{mode === "serp" ? "Truy vấn Google (SerpAPI)" : "Tìm kiếm"}</span>
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
                    </label>
                    {mode === "db" ? (
                        <label className="data-toolbar__field">
                            <span>Nguồn (select)</span>
                            <select
                                value={source}
                                onChange={(e) => setSourceFilter(e.target.value)}
                            >
                                <option value="">Tất cả</option>
                                <option value="seed">seed</option>
                                <option value="suggest">suggest</option>
                            </select>
                        </label>
                    ) : null}
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
                        onClick={() => (mode === "serp" ? refetchSerp() : refetch())}
                        disabled={mode === "serp" ? serpFetching : isFetching}
                    >
                        {(mode === "serp" ? serpFetching : isFetching) ? "Đang tải…" : "Làm mới"}
                    </Button>
                </form>

                {mode === "serp" ? (
                    <p className="kw-seed__serp-hint">
                        Mỗi lần tìm ≈ 1 request SerpAPI (có phí). Kết quả gồm gợi ý liên quan, PAA và top
                        organic Google VN.
                    </p>
                ) : null}

                {mode === "db" ? (
                <div className="data-toolbar__chips" role="group" aria-label="Lọc nhanh theo nguồn">
                    {[
                        { id: "", label: "Tất cả" },
                        { id: "seed", label: "seed" },
                        { id: "suggest", label: "suggest" },
                    ].map((chip) => (
                        <button
                            key={chip.id || "all"}
                            type="button"
                            className={`filter-chip${source === chip.id ? " filter-chip--active" : ""}`}
                            onClick={() => setSourceFilter(chip.id)}
                        >
                            {chip.label}
                        </button>
                    ))}
                </div>
                ) : null}

                {mode === "db" && data?.meta?.data_fetched_at ? (
                    <div className="data-meta kw-seed__meta">
                        <span>
                            {total.toLocaleString("vi-VN")} từ khóa
                            {q ? ` · “${q}”` : ""}
                        </span>
                        <span>Dữ liệu {formatRelativeTime(data.meta.data_fetched_at)}</span>
                    </div>
                ) : null}

                {mode === "serp" && serpData?.meta?.data_fetched_at ? (
                    <div className="data-meta kw-seed__meta">
                        <span>
                            {serpData.data.ideas.length.toLocaleString("vi-VN")} gợi ý ·{" "}
                            {serpData.data.organic.length.toLocaleString("vi-VN")} organic
                            {q ? ` · “${q}”` : ""}
                        </span>
                        <span>
                            SerpAPI · ~${serpData.data.estimated_cost_usd} ·{" "}
                            {formatRelativeTime(serpData.meta.data_fetched_at)}
                        </span>
                    </div>
                ) : null}

                {showDbLoading || showSerpLoading ? (
                    <div className="kw-seed__skeleton" aria-busy="true">
                        <div className="skeleton-block" style={{ height: "12rem", margin: "0 var(--space-4) var(--space-4)" }} />
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

                {!showDbLoading && mode === "db" && !isError && emptyHint ? (
                    <div className="kw-seed__empty-wrap">
                        <EmptyState
                            variant="panel"
                            tone={emptyHint.showClearFilters ? "filter" : "database"}
                            title={emptyHint.title}
                            description={emptyHint.desc}
                            action={
                                emptyHint.showClearFilters ? (
                                    <Button type="button" variant="secondary" size="sm" onClick={clearFilters}>
                                        Xóa lọc
                                    </Button>
                                ) : null
                            }
                        />
                    </div>
                ) : null}

                {mode === "serp" && serpData && !serpLoading && !serpError ? (
                    <>
                        {serpData.data.ideas.length > 0 ? (
                            <>
                                <h2 className="kw-seed__section-title">Gợi ý từ khóa</h2>
                                <div className="data-table-wrap">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Cụm từ</th>
                                                <th>Loại</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {serpData.data.ideas.map((row) => (
                                                <tr key={`${row.kind}-${row.text}`}>
                                                    <td className="kw-seed__kw">{row.text}</td>
                                                    <td>
                                                        <span className="data-tag">
                                                            {SERP_KIND_LABEL[row.kind] ?? row.kind}
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
                                <h2 className="kw-seed__section-title">Top organic</h2>
                                <div className="data-table-wrap">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Domain</th>
                                                <th>Tiêu đề</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {serpData.data.organic.map((row) => (
                                                <tr key={row.url}>
                                                    <td>{row.position.value}</td>
                                                    <td>{row.domain}</td>
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
                        {serpData.data.ideas.length === 0 && serpData.data.organic.length === 0 ? (
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
                        <div className="data-table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Từ khóa</th>
                                        <th>Nguồn</th>
                                        <th>Tier</th>
                                        <th>Vị trí</th>
                                        <th>Ngôn ngữ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.data.map((row) => (
                                        <tr key={row.id}>
                                            <td className="kw-seed__kw">{row.text}</td>
                                            <td>
                                                <span className="data-tag">{row.source ?? "—"}</span>
                                            </td>
                                            <td>{row.tier}</td>
                                            <td>{row.location}</td>
                                            <td>{row.language}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {data.pagination.total_pages > 1 ? (
                            <nav className="data-pager" aria-label="Phân trang">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={page <= 1}
                                    onClick={() => setPage(page - 1)}
                                >
                                    Trước
                                </Button>
                                <span>
                                    Trang {page} / {data.pagination.total_pages}
                                </span>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={page >= data.pagination.total_pages}
                                    onClick={() => setPage(page + 1)}
                                >
                                    Sau
                                </Button>
                            </nav>
                        ) : null}
                    </>
                ) : null}
                </div>
            </PageView>
        </div>
    );
}
