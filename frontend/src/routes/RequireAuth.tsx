/**
 * Route guard: chưa đăng nhập thì đưa về /login, kèm ?redirect= để sau khi
 * đăng nhập quay lại đúng trang đang muốn vào.
 */

import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useMe } from "@/api/useAuth";

export default function RequireAuth({ children }: { children: ReactNode }) {
    const { data: user, isLoading } = useMe();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="centered-state">
                <p>Đang kiểm tra phiên đăng nhập…</p>
            </div>
        );
    }

    if (!user) {
        const redirectTo = location.pathname + location.search;
        return (
            <Navigate
                to={{
                    pathname: "/login",
                    search: `?redirect=${encodeURIComponent(redirectTo)}`,
                }}
                state={{ redirectTo }}
                replace
            />
        );
    }

    return <>{children}</>;
}
