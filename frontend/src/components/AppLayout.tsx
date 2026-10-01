/**
 * Khung ứng dụng sau khi đăng nhập: sidebar theo chuẩn va-workspace + nội dung.
 */

import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import {
    loadSidebarCollapsed,
    persistSidebarCollapsed,
} from "@/components/layout/sidebar/navUtils";
import "./AppLayout.css";

export default function AppLayout() {
    const [collapsed, setCollapsed] = useState(() => loadSidebarCollapsed());
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia("(min-width: 1024px)");
        const onChange = (e: MediaQueryListEvent) => {
            if (e.matches) setMobileOpen(false);
        };
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    const toggleSidebar = () => {
        if (window.innerWidth < 1024) {
            setMobileOpen((v) => !v);
            return;
        }
        setCollapsed((v) => {
            const next = !v;
            persistSidebarCollapsed(next);
            return next;
        });
    };

    return (
        <div className="app-shell">
            <Sidebar
                collapsed={collapsed}
                mobileOpen={mobileOpen}
                onCloseMobile={() => setMobileOpen(false)}
            />

            <div
                className={[
                    "app-shell__main",
                    !collapsed && "app-shell__main--expanded",
                ]
                    .filter(Boolean)
                    .join(" ")}
            >
                <AppHeader collapsed={collapsed} onToggleSidebar={toggleSidebar} />
                <main className="app-shell__content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
