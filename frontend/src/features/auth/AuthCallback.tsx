/**
 * Trang trung gian sau khi Google OAuth thành công.
 *
 * Backend redirect về đây với ?status=ok&redirect=/path. Nhiệm vụ: nạp lại
 * trạng thái đăng nhập rồi chuyển tiếp tới đích.
 */

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/api/useAuth";

export default function AuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const qc = useQueryClient();

    useEffect(() => {
        const status = searchParams.get("status");
        const redirect = searchParams.get("redirect");

        if (status !== "ok") {
            navigate("/login?error=Đăng nhập không thành công.", { replace: true });
            return;
        }

        // Buộc nạp lại /auth/me trước khi vào trang trong — nếu không, route
        // guard sẽ đọc cache cũ (chưa đăng nhập) và đá ngược về /login.
        qc.invalidateQueries({ queryKey: authKeys.me }).then(() => {
            const target = redirect?.startsWith("/") && !redirect.startsWith("//")
                ? redirect
                : "/";
            navigate(target, { replace: true });
        });
    }, [searchParams, navigate, qc]);

    return (
        <div className="centered-state">
            <p>Đang hoàn tất đăng nhập…</p>
        </div>
    );
}
