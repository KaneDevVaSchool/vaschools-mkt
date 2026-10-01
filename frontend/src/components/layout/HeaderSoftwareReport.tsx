import { useEffect, useMemo, useRef, useState } from "react";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import {
    addLocalFeatureRequest,
    countOpenFeatureRequests,
    deleteLocalFeatureRequest,
    loadLocalFeatureRequests,
    updateLocalFeatureRequest,
    type FeatureRequestItem,
} from "@/lib/featureRequestsStorage";
import { SidebarIcon } from "./sidebar/icons";
import { useHeaderPopover } from "./useHeaderPopover";

const STATUS_LABEL: Record<FeatureRequestItem["status"], string> = {
    pending: "Chờ ghi nhận",
    reviewing: "Đang xem xét",
    approved: "Đã duyệt",
    rejected: "Từ chối",
    done: "Đã hoàn thành",
};

const DESCRIPTION_MAX = 2000;

type HeaderSoftwareReportProps = {
    pageTitle: string;
    pagePath: string;
};

export function HeaderSoftwareReport({ pageTitle, pagePath }: HeaderSoftwareReportProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const { isOpen, toggle, close } = useHeaderPopover("software-report");
    const [tab, setTab] = useState<"create" | "mine">("create");
    const [items, setItems] = useState<FeatureRequestItem[]>(() => loadLocalFeatureRequests());
    const [editingId, setEditingId] = useState<string | null>(null);
    const [attachPage, setAttachPage] = useState(true);
    const [description, setDescription] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const openCount = useMemo(() => countOpenFeatureRequests(items), [items]);
    const badge = openCount > 0 ? (openCount > 9 ? "9+" : String(openCount)) : "";

    useEffect(() => {
        if (!isOpen) return;
        const onClick = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                close();
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") close();
        };
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [isOpen, close]);

    function resetForm() {
        setEditingId(null);
        setAttachPage(true);
        setDescription("");
        setError(null);
    }

    function openPanel() {
        if (!isOpen) {
            resetForm();
            setTab("create");
            setItems(loadLocalFeatureRequests());
        }
        toggle();
    }

    function submit() {
        const text = description.trim();
        if (!text) {
            setError("Vui lòng mô tả yêu cầu cụ thể.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const payload = {
                description: text,
                page_title: attachPage ? pageTitle : null,
                page_url: attachPage ? pagePath : null,
            };
            if (editingId) {
                updateLocalFeatureRequest(editingId, payload);
            } else {
                addLocalFeatureRequest(payload);
            }
            setItems(loadLocalFeatureRequests());
            resetForm();
            setTab("mine");
        } finally {
            setSaving(false);
        }
    }

    function startEdit(item: FeatureRequestItem) {
        if (item.status !== "pending") return;
        setEditingId(item.id);
        setDescription(item.description);
        setAttachPage(Boolean(item.page_url));
        setTab("create");
    }

    function removeItem(item: FeatureRequestItem) {
        if (item.status !== "pending") return;
        deleteLocalFeatureRequest(item.id);
        setItems(loadLocalFeatureRequests());
        if (editingId === item.id) resetForm();
    }

    return (
        <div className="header-pop" ref={rootRef}>
            <button
                type="button"
                className={[
                    "header-pop__btn",
                    "header-pop__btn--report",
                    isOpen && "header-pop__btn--open",
                ]
                    .filter(Boolean)
                    .join(" ")}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                aria-label={
                    openCount > 0
                        ? `Ghi nhận phần mềm, ${openCount} đang chờ xử lý`
                        : "Ghi nhận yêu cầu / báo lỗi phần mềm"
                }
                data-tour="header-software-report"
                onClick={openPanel}
            >
                <SidebarIcon name="bell" size={20} strokeWidth={1.75} />
                {badge && <span className="header-pop__badge">{badge}</span>}
            </button>

            {isOpen && (
                <div
                    className="header-pop__panel header-pop__panel--report"
                    role="dialog"
                    aria-label="Ghi nhận yêu cầu phần mềm"
                >
                    <div className="header-pop__head header-pop__head--stack">
                        <div className="header-pop__title-row">
                            <SidebarIcon name="alertTriangle" size={16} strokeWidth={2} />
                            <span className="header-pop__title">Ghi nhận phần mềm</span>
                        </div>
                        <div className="header-pop__tabs" role="tablist">
                            <button
                                type="button"
                                role="tab"
                                className={[
                                    "header-pop__tab-btn",
                                    tab === "create" && "header-pop__tab-btn--active",
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                                aria-selected={tab === "create"}
                                onClick={() => {
                                    setTab("create");
                                    if (!editingId) resetForm();
                                }}
                            >
                                {editingId ? "Sửa ghi nhận" : "Ghi nhận mới"}
                            </button>
                            <button
                                type="button"
                                role="tab"
                                className={[
                                    "header-pop__tab-btn",
                                    tab === "mine" && "header-pop__tab-btn--active",
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                                aria-selected={tab === "mine"}
                                onClick={() => setTab("mine")}
                            >
                                Của tôi
                                {items.length > 0 && (
                                    <span className="header-pop__tab-count">{items.length}</span>
                                )}
                            </button>
                        </div>
                    </div>

                    {tab === "create" ? (
                        <div className="fr-form">
                            <p className="fr-form__intro">
                                Mô tả lỗi hoặc tính năng bạn cần — đội phát triển sẽ xem và phản
                                hồi (lưu tạm trên trình duyệt cho đến khi có API).
                            </p>
                            <label className="fr-form__toggle">
                                <input
                                    type="checkbox"
                                    checked={attachPage}
                                    onChange={(e) => setAttachPage(e.target.checked)}
                                />
                                <span>Đính kèm trang đang đứng</span>
                            </label>
                            {attachPage && (
                                <p className="fr-form__page-preview">
                                    <SidebarIcon name="link" size={13} strokeWidth={2} />
                                    {pageTitle}
                                </p>
                            )}
                            <div className="fr-form__field">
                                <label className="fr-form__label" htmlFor="mkt-fr-description">
                                    Yêu cầu cụ thể <span className="fr-form__required">*</span>
                                </label>
                                <textarea
                                    id="mkt-fr-description"
                                    className={[
                                        "fr-form__textarea",
                                        error && "fr-form__textarea--error",
                                    ]
                                        .filter(Boolean)
                                        .join(" ")}
                                    rows={5}
                                    maxLength={DESCRIPTION_MAX}
                                    value={description}
                                    disabled={saving}
                                    placeholder="Vd. Nút xuất Excel, báo lỗi số liệu, góp ý UX sidebar…"
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                                <div className="fr-form__field-foot">
                                    {error && <span className="fr-form__error">{error}</span>}
                                    <span className="fr-form__count">
                                        {description.length}/{DESCRIPTION_MAX}
                                    </span>
                                </div>
                            </div>
                            <div className="fr-form__actions">
                                {editingId && (
                                    <button
                                        type="button"
                                        className="fr-form__btn fr-form__btn--ghost"
                                        disabled={saving}
                                        onClick={resetForm}
                                    >
                                        Huỷ sửa
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="fr-form__btn fr-form__btn--primary"
                                    disabled={saving || !description.trim()}
                                    onClick={submit}
                                >
                                    {saving ? "Đang gửi…" : editingId ? "Cập nhật" : "Gửi ghi nhận"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="fr-list">
                            {items.length === 0 ? (
                                <p className="fr-list__empty">Chưa có ghi nhận nào.</p>
                            ) : (
                                <ul className="fr-list__items">
                                    {items.map((item) => (
                                        <li key={item.id} className="fr-list__item">
                                            <div className="fr-list__item-head">
                                                <span
                                                    className={[
                                                        "fr-list__status",
                                                        `fr-list__status--${item.status}`,
                                                    ].join(" ")}
                                                >
                                                    {STATUS_LABEL[item.status]}
                                                </span>
                                                <time dateTime={item.created_at}>
                                                    {formatRelativeTime(item.created_at)}
                                                </time>
                                            </div>
                                            <p className="fr-list__desc">{item.description}</p>
                                            {item.page_title && (
                                                <p className="fr-list__page">{item.page_title}</p>
                                            )}
                                            {item.status === "pending" && (
                                                <div className="fr-list__actions">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEdit(item)}
                                                    >
                                                        Sửa
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(item)}
                                                    >
                                                        Rút lại
                                                    </button>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
