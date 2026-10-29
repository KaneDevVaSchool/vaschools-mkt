/**
 * Fetch wrapper: base URL, cookie session, xử lý lỗi theo chuẩn API.
 * Xem docs/01-architecture/api-conventions.md.
 */

/** Rỗng = cùng origin (Vite proxy hoặc SPA prod cùng cổng API). */
export const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

function apiOrigin(): string {
    return API_URL || window.location.origin;
}

/** Lỗi trả về từ API, đã có message tiếng Việt sẵn cho người dùng. */
export class ApiError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly status: number,
        public readonly details?: unknown,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

export async function apiFetch<T>(
    path: string,
    init: RequestInit = {},
): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        ...init,
        // Bắt buộc: cookie session phải đi kèm mọi request.
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...init.headers,
        },
    });

    if (!res.ok) {
        let code = "UNKNOWN";
        let message = "Đã xảy ra lỗi. Vui lòng thử lại.";
        let details: unknown;

        try {
            const body = await res.json();
            if (body?.error) {
                code = body.error.code ?? code;
                message = body.error.message ?? message;
                details = body.error.details;
            }
        } catch {
            // Response không phải JSON — giữ message mặc định.
        }

        throw new ApiError(code, message, res.status, details);
    }

    return res.json() as Promise<T>;
}

/** Điều hướng full-page sang OAuth — không dùng fetch vì đây là redirect thật. */
export function startGoogleLogin(redirect?: string | null): void {
    const base = `${apiOrigin()}/auth/google/redirect`;
    const url = redirect
        ? `${base}?redirect=${encodeURIComponent(redirect)}`
        : base;
    window.location.href = url;
}
