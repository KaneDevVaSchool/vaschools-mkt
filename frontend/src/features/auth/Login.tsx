/**
 * Trang đăng nhập — chỉ Google Workspace SSO (không có form user/password).
 *
 * Bấm nút -> điều hướng full-page (window.location) tới /auth/google/redirect
 * vì đây là OAuth redirect thật, không phải gọi API qua fetch.
 *
 * Bố cục port y nguyên từ va-workspace
 * (Modules/Identity/resources/js/pages/Login.vue — Vue/CSS thuần) sang React,
 * giữ nguyên class name và CSS.
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { startGoogleLogin } from "@/api/client";
import "./Login.css";

export default function Login() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [error, setError] = useState<string | null>(null);

    // Lỗi từ backend (redirect ?error=...). Xoá khỏi URL ngay sau khi đọc để
    // F5/back không hiện lại lỗi cũ.
    useEffect(() => {
        const err = searchParams.get("error");
        if (!err) return;

        setError(err);
        const rest = new URLSearchParams(searchParams);
        rest.delete("error");
        setSearchParams(rest, { replace: true });
    }, [searchParams, setSearchParams]);

    function handleLogin() {
        startGoogleLogin(searchParams.get("redirect"));
    }

    return (
        <div className="login">
            <img
                src="/images/background/background-logo.png"
                alt=""
                className="login__watermark"
                aria-hidden="true"
            />
            <div className="login__scrim" aria-hidden="true" />

            <div className="login__container">
                <header className="login__header">
                    <img
                        src="/images/logo-2.png"
                        alt="Vietnam America Schools — Trường học của sự lắng nghe"
                        className="login__logo"
                    />
                    <p className="login__system-name">
                        Hệ thống SEO &amp; Marketing Intelligence
                    </p>
                </header>

                <div className="login__card">
                    <h1 className="login__title">Đăng nhập</h1>

                    <p className="login__subtitle">
                        Đăng nhập thông qua tài khoản mail do nhà trường cung cấp
                    </p>

                    {error && (
                        <p className="login__error" role="alert">
                            {error}
                        </p>
                    )}

                    <div className="login__actions">
                        <button
                            type="button"
                            className="login__google-btn"
                            aria-label="Đăng nhập bằng tài khoản Google của nhà trường"
                            onClick={handleLogin}
                        >
                            <img
                                src="/images/google.png"
                                alt=""
                                className="login__google-icon"
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
