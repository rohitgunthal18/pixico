"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./login.module.css";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const supabase = createClient();

        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password,
            });

            if (authError) {
                setError(authError.message);
                setIsLoading(false);
                return;
            }

            if (authData.user) {
                // Check if the user has the admin role in the profiles table
                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", authData.user.id)
                    .single();

                if (profileError || profile?.role !== "admin") {
                    // Sign out if not an admin
                    await supabase.auth.signOut();
                    setError("Unauthorized: You do not have administrator privileges.");
                    setIsLoading(false);
                    return;
                }

                // Store admin session in localStorage for legacy compatibility in other components
                const adminSession = {
                    authenticated: true,
                    email: authData.user.email,
                    timestamp: Date.now(),
                    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
                };
                localStorage.setItem("adminSession", JSON.stringify(adminSession));

                // Redirect to admin dashboard
                router.push("/admin/home");
            }
        } catch (err: any) {
            setError("Authentication failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginCard}>
                <div className={styles.logo}>
                    <svg width="40" height="40" viewBox="0 0 28 28" fill="none">
                        <rect width="28" height="28" fill="url(#adminLoginGrad)" />
                        <path d="M7 7H13V13H7V7Z" fill="white" fillOpacity="0.9" />
                        <path d="M15 7H21V13H15V7Z" fill="white" fillOpacity="0.6" />
                        <path d="M7 15H13V21H7V15Z" fill="white" fillOpacity="0.6" />
                        <path d="M15 15H21V21H15V15Z" fill="white" fillOpacity="0.3" />
                        <defs>
                            <linearGradient id="adminLoginGrad" x1="0" y1="0" x2="28" y2="28">
                                <stop stopColor="#a855f7" />
                                <stop offset="1" stopColor="#06b6d4" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <h1>Pixico Admin</h1>
                </div>

                <p className={styles.subtitle}>Sign in to access the admin dashboard</p>

                {error && (
                    <div className={styles.error}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@pixico.io"
                            required
                            autoComplete="email"
                            suppressHydrationWarning
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                            suppressHydrationWarning
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <div className={styles.footer}>
                    <a href="/" className={styles.backLink}>
                        ← Back to Pixico
                    </a>
                </div>
            </div>
        </div>
    );
}

