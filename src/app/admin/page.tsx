"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminIndexPage() {
    const router = useRouter();

    useEffect(() => {
        // Check if admin is logged in
        const sessionStr = localStorage.getItem("adminSession");
        if (sessionStr) {
            try {
                const session = JSON.parse(sessionStr);
                if (session.authenticated && Date.now() < session.expiresAt) {
                    // Already logged in, go to home
                    router.replace("/admin/home");
                    return;
                }
            } catch {
                // Invalid session
            }
        }
        // Not logged in, go to login
        router.replace("/admin/login");
    }, [router]);

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0a0a0f",
            color: "#fff"
        }}>
            <div style={{
                width: "40px",
                height: "40px",
                border: "3px solid rgba(255, 255, 255, 0.1)",
                borderTopColor: "#a855f7",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite"
            }} />
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
