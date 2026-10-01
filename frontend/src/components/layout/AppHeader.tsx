import { useLocation } from "react-router-dom";
import { pageMetaForPath } from "@/lib/pageMeta";
import { HeaderAccountMenu } from "./HeaderAccountMenu";
import { HeaderSoftwareReport } from "./HeaderSoftwareReport";
import { SidebarIcon } from "./sidebar/icons";

type AppHeaderProps = {
    collapsed: boolean;
    onToggleSidebar: () => void;
};

export function AppHeader({ collapsed, onToggleSidebar }: AppHeaderProps) {
    const { pathname } = useLocation();
    const { title: pageTitle, module: pageModule } = pageMetaForPath(pathname);

    return (
        <header className="app-header">
            <button
                type="button"
                className="app-header__icon-btn"
                onClick={onToggleSidebar}
                aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
                aria-expanded={!collapsed}
                data-tour="header-menu-toggle"
            >
                <SidebarIcon name="menu" size={20} strokeWidth={1.75} />
            </button>

            <div id="app-content-header" className="app-header__page">
                <div className="page-header">
                    <div className="page-header__title-wrap">
                        <p className="page-header__eyebrow">
                            Marketing Intelligence
                            {pageModule ? ` · ${pageModule}` : ""}
                        </p>
                        <h1 className="page-header__title" title={pageTitle}>
                            {pageTitle}
                        </h1>
                    </div>
                </div>
            </div>

            <div className="app-header__actions">
                <div className="app-header__tools">
                    <HeaderSoftwareReport pageTitle={pageTitle} pagePath={pathname} />
                </div>
                <span className="app-header__divider" aria-hidden="true" />
                <HeaderAccountMenu />
            </div>
        </header>
    );
}
