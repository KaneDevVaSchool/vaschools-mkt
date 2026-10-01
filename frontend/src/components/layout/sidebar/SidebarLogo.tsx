import { Link } from "react-router-dom";
import { SidebarIcon } from "./icons";

const BRAND_MARK = "/images/congnghe/brand/vas-white-mark.png";
const BRAND_MARK_2X = "/images/congnghe/brand/vas-white-mark@2x.png";
const BRAND_LOGO = "/images/congnghe/brand/vas-white.png";

type SidebarLogoProps = {
    collapsed: boolean;
    onCloseMobile?: () => void;
};

export function SidebarLogo({ collapsed, onCloseMobile }: SidebarLogoProps) {
    return (
        <div className="sidebar-logo">
            <Link to="/" className="sidebar-logo__brand" onClick={onCloseMobile}>
                {collapsed ? (
                    <img
                        src={BRAND_MARK}
                        srcSet={`${BRAND_MARK} 1x, ${BRAND_MARK_2X} 2x`}
                        alt="Vietnam America Schools"
                        className="sidebar-logo__mark"
                    />
                ) : (
                    <img
                        src={BRAND_LOGO}
                        alt="Vietnam America Schools"
                        className="sidebar-logo__img"
                    />
                )}
            </Link>
            {onCloseMobile && (
                <button
                    type="button"
                    className="sidebar-logo__close"
                    aria-label="Đóng menu"
                    onClick={onCloseMobile}
                >
                    <SidebarIcon name="x" size={18} />
                </button>
            )}
        </div>
    );
}

export function SidebarTagline({ collapsed }: { collapsed: boolean }) {
    if (collapsed) return null;
    return (
        <p className="sidebar-tagline">
            <SidebarIcon name="sparkles" size={13} />
            Marketing Intelligence
        </p>
    );
}
