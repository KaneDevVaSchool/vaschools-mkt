import { Link } from "react-router-dom";
import ProvenanceBadge from "@/components/ProvenanceBadge/ProvenanceBadge";
import PageSection from "@/components/layout/PageSection";
import Button from "@/components/ui/Button";
import GoalProgress from "@/components/ui/GoalProgress";
import StatusPill from "@/components/StatusPill/StatusPill";
import { usePlatformStatus } from "@/api/hooks/usePlatformStatus";
import { useSerpProbe } from "@/api/hooks/useSerpProbe";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import "./Week1StatusPanel.css";

const WEEK1_KEYWORD_GOAL = 2000;

export default function Week1StatusPanel() {
    const { data, isLoading, isError, error, refetch, isFetching } = usePlatformStatus();
    const serpProbe = useSerpProbe();

    if (isLoading) {
        return (
            <PageSection title="Hạ tầng & dữ liệu nền" variant="plain">
                <div className="week1-skeleton stat-grid">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="skeleton-block surface-card stat-card" style={{ height: "5.5rem" }} />
                    ))}
                </div>
            </PageSection>
        );
    }

    if (isError || !data) {
        return (
            <PageSection
                title="Hạ tầng & dữ liệu nền"
                actions={
                    <Button variant="secondary" size="sm" onClick={() => refetch()}>
                        Thử lại
                    </Button>
                }
            >
                <p className="week1-panel__error">
                    Không lấy được trạng thái từ API.{" "}
                    {error instanceof Error ? error.message : ""}
                </p>
            </PageSection>
        );
    }

    const s = data.data;
    const total = s.keyword_total.value ?? 0;

    return (
        <PageSection
            title="Hạ tầng & dữ liệu nền"
            description={`Cập nhật ${formatRelativeTime(data.meta.data_fetched_at)}`}
            actions={
                <>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isFetching}
                    >
                        {isFetching ? "Đang tải…" : "Làm mới"}
                    </Button>
                    <Link to="/keywords/seed" className="ui-btn ui-btn--primary ui-btn--sm">
                        Bộ từ khóa
                    </Link>
                </>
            }
        >
            <div className="week1-panel__goal surface-card">
                <GoalProgress
                    value={total}
                    goal={WEEK1_KEYWORD_GOAL}
                    label="Tiến độ từ khóa nền (tuần 1)"
                />
                {s.keyword_total.note ? (
                    <p className="week1-panel__hint">{s.keyword_total.note}</p>
                ) : null}
            </div>

            <div className="stat-grid">
                <article
                    className={`surface-card stat-card${s.database.value ? " stat-card--ok" : " stat-card--warn"}`}
                >
                    <p className="stat-card__label">PostgreSQL</p>
                    <StatusPill ok={Boolean(s.database.value)} />
                </article>
                <article
                    className={`surface-card stat-card${s.redis.value ? " stat-card--ok" : " stat-card--warn"}`}
                >
                    <p className="stat-card__label">Redis</p>
                    <StatusPill ok={Boolean(s.redis.value)} />
                </article>
                <article className="surface-card stat-card">
                    <p className="stat-card__label">Từ khóa nền</p>
                    <p className="stat-card__value">
                        {total.toLocaleString("vi-VN")}
                        <ProvenanceBadge provenance={s.keyword_total.provenance} />
                    </p>
                </article>
                <article
                    className={`surface-card stat-card${s.serp_provider_configured ? " stat-card--ok" : " stat-card--warn"}`}
                >
                    <p className="stat-card__label">SERP · {s.serp_provider}</p>
                    <StatusPill
                        ok={s.serp_provider_configured}
                        labelOk="Đã cấu hình"
                        labelBad="Thiếu cấu hình"
                    />
                    <p className="stat-card__sub">
                        {(s.serp_snapshot_total?.value ?? 0).toLocaleString("vi-VN")} snapshot
                    </p>
                </article>
            </div>

            {s.serp_provider === "serpapi" && s.serp_provider_configured ? (
                <div className="week1-panel__serp surface-card">
                    <div className="week1-panel__serp-head">
                        <div>
                            <p className="week1-panel__serp-title">SerpAPI</p>
                            <p className="week1-panel__hint">
                                Gọi thử 1 từ khóa (~0,0075 USD). Lưu snapshot vào PostgreSQL nếu từ khóa có trong
                                bộ seed.
                            </p>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={serpProbe.isPending}
                            onClick={() =>
                                serpProbe.mutate({
                                    keyword: "trường quốc tế tphcm",
                                    depth: 10,
                                    persist: true,
                                })
                            }
                        >
                            {serpProbe.isPending ? "Đang gọi SerpAPI…" : "Gọi thử SerpAPI"}
                        </Button>
                    </div>
                    {serpProbe.isError ? (
                        <p className="week1-panel__error">
                            {serpProbe.error instanceof Error ? serpProbe.error.message : "Lỗi probe SERP"}
                        </p>
                    ) : null}
                    {serpProbe.data ? (
                        <ul className="week1-panel__serp-result">
                            <li>
                                <span>Từ khóa</span>
                                <strong>{serpProbe.data.data.keyword}</strong>
                            </li>
                            <li>
                                <span>Kết quả organic</span>
                                <strong>{serpProbe.data.data.organic_count}</strong>
                            </li>
                            <li>
                                <span>Top 1</span>
                                <strong>
                                    {serpProbe.data.data.top_organic
                                        ? `#${serpProbe.data.data.top_organic.position} · ${serpProbe.data.data.top_organic.domain}`
                                        : "—"}
                                </strong>
                            </li>
                            <li>
                                <span>Features</span>
                                <strong>
                                    {serpProbe.data.data.features.length
                                        ? serpProbe.data.data.features.join(", ")
                                        : "—"}
                                </strong>
                            </li>
                            <li>
                                <span>Chi phí ước tính</span>
                                <strong>${serpProbe.data.data.estimated_cost_usd} USD</strong>
                            </li>
                            {serpProbe.data.data.snapshot_id ? (
                                <li>
                                    <span>Snapshot ID</span>
                                    <strong>{serpProbe.data.data.snapshot_id}</strong>
                                </li>
                            ) : null}
                            {serpProbe.data.data.persist_note ? (
                                <li className="week1-panel__serp-note">{serpProbe.data.data.persist_note}</li>
                            ) : null}
                        </ul>
                    ) : null}
                </div>
            ) : null}

            <div className="week1-panel__footer surface-card">
                <div className="week1-panel__footer-row">
                    <span>
                        Domain VAS: <strong>{s.our_domain ?? "—"}</strong>
                    </span>
                    <span className="week1-panel__footer-sep" aria-hidden="true">
                        ·
                    </span>
                    <span className="week1-panel__footer-ads">
                        Google Ads{" "}
                        <StatusPill
                            ok={s.google_ads_configured}
                            labelOk="OK"
                            labelBad="Chưa (tuần 1)"
                        />
                    </span>
                </div>
                {Object.keys(s.keywords_by_source).length > 0 ? (
                    <ul className="week1-panel__sources">
                        {Object.entries(s.keywords_by_source).map(([src, n]) => (
                            <li key={src}>
                                <span>{src}</span>
                                <strong>{n.toLocaleString("vi-VN")}</strong>
                            </li>
                        ))}
                    </ul>
                ) : null}
            </div>
        </PageSection>
    );
}
