import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { pageMetaForPath } from "@/lib/pageMeta";
import "./PageView.css";

type PageViewProps = {
    /** Ghi đè mô tả từ navigation (hiếm khi cần). */
    description?: string;
    actions?: ReactNode;
    children: ReactNode;
    /** `full` — bảng/dữ liệu: full chiều ngang vùng main (không cap 72rem). */
    width?: "content" | "wide" | "full";
};

/**
 * Khung trang chuẩn: không có h1 — tiêu đề chỉ nằm ở AppHeader.
 */
export default function PageView({
    description: descriptionOverride,
    actions,
    children,
    width = "content",
}: PageViewProps) {
    const { pathname } = useLocation();
    const meta = pageMetaForPath(pathname);
    const description = descriptionOverride ?? meta.description;

    return (
        <div className={`page-view page-view--${width}`}>
            {(description || actions) && (
                <div className="page-view__top">
                    {description ? <p className="page-view__lead">{description}</p> : <span />}
                    {actions ? <div className="page-view__actions">{actions}</div> : null}
                </div>
            )}
            <div className="page-view__body">{children}</div>
        </div>
    );
}
