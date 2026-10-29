/**
 * Trang trung gian sau khi Google OAuth thành công.
 *
 * Backend redirect về đây với ?status=ok&redirect=/path. Nhiệm vụ: nạp lại
 * trạng thái đăng nhập rồi chuyển tiếp tới đích.
 */

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { authKeys, useMe } from "@/api/useAuth";
import { apiFetch } from "@/api/client";
import type { SessionUser } from "@/api/useAuth";
import { parseInternalRedirect } from "@/lib/redirectUtils";

export default function AuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const { refetch } = useMe();

    useEffect(() => {
        let cancelled = false;

        async function finish() {
            const status = searchParams.get("status");
            const redirect = searchParams.get("redirect");

            if (status !== "ok") {
                navigate("/login?error=Đăng nhập không thành công.", { replace: true });
                return;
            }

            // Buộc nạp lại session trước khi vào route guard — tránh vòng /login.
            let user: SessionUser | null | undefined;
            try {
                const res = await apiFetch<{ data: SessionUser }>("/auth/me");
                user = res.data;
                qc.setQueryData(authKeys.me, user);
            } catch {
                const refreshed = await refetch();
                user = refreshed.data;
            }

            if (cancelled) return;

            if (!user) {
                const params = new URLSearchParams({
                    error: "Phiên đăng nhập chưa sẵn sàng. Vui lòng thử lại.",
                });
                if (redirect?.startsWith("/") && !redirect.startsWith("//")) {
                    params.set("redirect", redirect);
                }
                navigate(`/login?${params.toString()}`, { replace: true });
                return;
            }

            navigate(parseInternalRedirect(redirect), { replace: true });
        }

        void finish();
        return () => {
            cancelled = true;
        };
    }, [searchParams, navigate, qc, refetch]);

    return (
        <div className="centered-state">
            <p>Đang hoàn tất đăng nhập…</p>
        </div>
    );
}
