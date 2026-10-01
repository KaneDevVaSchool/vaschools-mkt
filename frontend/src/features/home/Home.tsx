import { Link } from "react-router-dom";
import ProvenanceBadge from "@/components/ProvenanceBadge/ProvenanceBadge";
import PageSection from "@/components/layout/PageSection";
import PageView from "@/components/layout/PageView";
import Week1StatusPanel from "@/features/platform/Week1StatusPanel";
import "./Home.css";

const MODULES = [
    {
        id: "N1",
        title: "Nghiên cứu từ khóa",
        desc: "Keyword overview, rank tracking, chiến lược từ khóa.",
        ready: true,
        href: "/keywords/seed",
        cta: "Mở bộ từ khóa nền",
    },
    {
        id: "N2",
        title: "Phân tích đối thủ",
        desc: "So sánh domain, ước tính traffic, content gap.",
        ready: false,
        href: undefined,
        cta: undefined,
    },
    {
        id: "N3",
        title: "Site Audit",
        desc: "Crawler nội bộ, CWV, health score.",
        ready: false,
        href: undefined,
        cta: undefined,
    },
    {
        id: "N4",
        title: "On-page Checker",
        desc: "Gợi ý tối ưu theo nhóm ý tưởng, có human review.",
        ready: false,
        href: undefined,
        cta: undefined,
    },
] as const;

export default function Home() {
    return (
        <PageView width="wide">
            <Week1StatusPanel />

            <PageSection title="Lộ trình module" description="Theo docs/00-overview/roadmap-7-weeks.md">
                <div className="card-grid home__modules">
                    {MODULES.map((m) => (
                        <article
                            key={m.id}
                            className={`surface-card home__module-card${m.ready ? " home__module-card--live surface-card--interactive" : " surface-card--muted"}`}
                        >
                            <div className="home__module-head">
                                <h3 className="home__module-title">
                                    {m.title}
                                    <span className="home__module-id">{m.id}</span>
                                </h3>
                                {m.ready ? (
                                    <span className="home__module-badge">Đang dựng</span>
                                ) : (
                                    <span className="home__module-badge home__module-badge--soon">
                                        Sắp tới
                                    </span>
                                )}
                            </div>
                            <p className="home__module-desc">{m.desc}</p>
                            {m.ready && m.href ? (
                                <Link to={m.href} className="home__module-link">
                                    {m.cta} →
                                </Link>
                            ) : (
                                <p className="home__status">Chưa có trang — chỉ xem trên sidebar.</p>
                            )}
                        </article>
                    ))}
                </div>
            </PageSection>

            <PageSection
                title="Nhãn nguồn dữ liệu"
                description="Mọi số liệu báo cáo phải mang nhãn — không hiển thị số trần."
            >
                <ul className="home__prov-list">
                    <li>
                        <ProvenanceBadge provenance="MEASURED" /> Lượt truy cập từ GA4
                    </li>
                    <li>
                        <ProvenanceBadge provenance="OBSERVED" /> Vị trí SERP quan sát trực tiếp
                    </li>
                    <li>
                        <ProvenanceBadge provenance="VENDOR" /> Volume từ nhà cung cấp
                    </li>
                    <li>
                        <ProvenanceBadge
                            provenance="ESTIMATED"
                            title="Volume × CTR mô hình nội bộ"
                        />{" "}
                        Traffic organic ước tính
                    </li>
                </ul>
            </PageSection>
        </PageView>
    );
}
