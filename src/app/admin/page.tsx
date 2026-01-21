"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminIndexPage() {
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                router.replace("/admin/home");
                return;
            }

            // Fallback for transition period (if any)
            const sessionStr = localStorage.getItem("adminSession");
            if (sessionStr) {
                try {
                    const session = JSON.parse(sessionStr);
                    if (session.authenticated && Date.now() < session.expiresAt) {
                        router.replace("/admin/home");
                        return;
                    }
                } catch {
                    // Invalid session
                }
            }
            // Not logged in, go to login
            router.replace("/admin/login");
        };

        checkAuth();
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
