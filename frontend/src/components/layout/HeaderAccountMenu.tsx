import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLogout, useMe } from "@/api/useAuth";
import { SidebarIcon } from "./sidebar/icons";
import { useHeaderPopover } from "./useHeaderPopover";

export function HeaderAccountMenu() {
    const { data: user } = useMe();
    const logout = useLogout();
    const navigate = useNavigate();
    const rootRef = useRef<HTMLDivElement>(null);
    const { isOpen: open, toggle, close } = useHeaderPopover("account");

    const userLabel = user?.name ?? user?.email ?? "Người dùng";
    const userInitial = userLabel.trim().charAt(0).toUpperCase() || "?";

    useEffect(() => {
        if (!open) return;
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
    }, [open, close]);

    function handleLogout() {
        logout.mutate(undefined, {
            onSuccess: () => {
                close();
                navigate("/login", { replace: true });
            },
        });
    }

    return (
        <div className="header-account" ref={rootRef}>
            <button
                type="button"
                className={["header-account__btn", open && "header-account__btn--open"]
                    .filter(Boolean)
                    .join(" ")}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={`Tài khoản ${userLabel}`}
                onClick={() => toggle()}
            >
                <span className="header-account__avatar">
                    {user?.avatar_url ? (
                        <img
                            src={user.avatar_url}
                            alt={userLabel}
                            className="header-account__avatar-img"
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        userInitial
                    )}
                </span>
            </button>

            {open && (
                <div className="header-account__menu" role="menu" onClick={(e) => e.stopPropagation()}>
                    <div className="header-account__profile">
                        <span className="header-account__name">{userLabel}</span>
                        {user?.email && (
                            <span className="header-account__email">{user.email}</span>
                        )}
                    </div>
                    <button
                        type="button"
                        className="header-account__logout"
                        role="menuitem"
                        disabled={logout.isPending}
                        onClick={handleLogout}
                    >
                        <SidebarIcon name="logOut" size={18} strokeWidth={1.75} />
                        <span>{logout.isPending ? "Đang thoát…" : "Đăng xuất"}</span>
                    </button>
                </div>
            )}
        </div>
    );
}
