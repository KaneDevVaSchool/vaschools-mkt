import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import AuthCallback from "@/features/auth/AuthCallback";
import Login from "@/features/auth/Login";
import Home from "@/features/home/Home";
import KeywordSeedPage from "@/features/keywords/KeywordSeedPage";
import RequireAuth from "@/routes/RequireAuth";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            <Route
                element={
                    <RequireAuth>
                        <AppLayout />
                    </RequireAuth>
                }
            >
                <Route index element={<Home />} />
                <Route path="keywords/seed" element={<KeywordSeedPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
