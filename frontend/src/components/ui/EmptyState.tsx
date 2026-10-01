import type { ReactNode } from "react";
import "./EmptyState.css";

type EmptyStateProps = {
    title: string;
    description?: string;
    action?: ReactNode;
    /** panel: nằm trong bảng/lọc — căn trái, gọn */
    variant?: "default" | "panel";
    /** filter | database — đổi icon (chỉ panel) */
    tone?: "filter" | "database";
};

export default function EmptyState({
    title,
    description,
    action,
    variant = "default",
    tone = "filter",
}: EmptyStateProps) {
    const rootClass = [
        "empty-state",
        "surface-card",
        variant === "panel" ? "empty-state--panel" : "",
        variant === "panel" ? `empty-state--${tone}` : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={rootClass}>
            <div className="empty-state__icon" aria-hidden="true" />
            <div className="empty-state__body">
                <p className="empty-state__title">{title}</p>
                {description ? <p className="empty-state__desc">{description}</p> : null}
                {action ? <div className="empty-state__action">{action}</div> : null}
            </div>
        </div>
    );
}
