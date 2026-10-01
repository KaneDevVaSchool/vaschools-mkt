/**
 * Nhãn nguồn dữ liệu — bắt buộc mọi chỗ hiển thị số liệu (xem data-provenance.md).
 */

import "./ProvenanceBadge.css";

export type Provenance = "MEASURED" | "OBSERVED" | "VENDOR" | "ESTIMATED";

const LABELS: Record<Provenance, string> = {
    MEASURED: "Thật",
    OBSERVED: "Quan sát",
    VENDOR: "Nhà cung cấp",
    ESTIMATED: "Ước tính",
};

interface ProvenanceBadgeProps {
    provenance: Provenance;
    title?: string;
}

export default function ProvenanceBadge({ provenance, title }: ProvenanceBadgeProps) {
    const label = LABELS[provenance];
    return (
        <span
            className={`prov-badge prov-badge--${provenance.toLowerCase()}`}
            title={title ?? label}
        >
            {label}
        </span>
    );
}
