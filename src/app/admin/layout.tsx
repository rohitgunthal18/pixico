"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./layout.module.css";

interface AdminLayoutProps {
    children: React.ReactNode;
}

interface AdminSession {
    authenticated: boolean;
    email: string;
    timestamp: number;
    expiresAt: number;
}

const navItems = [
    { name: "Dashboard", href: "/admin/home", icon: "grid" },
    { name: "Prompts", href: "/admin/prompts", icon: "image" },
    { name: "Blogs", href: "/admin/blogs", icon: "blog" },
    { name: "Categories", href: "/admin/categories", icon: "folder" },
    { name: "Users", href: "/admin/users", icon: "users" },
    { name: "Contacts", href: "/admin/contacts", icon: "mail" },
    { name: "Settings", href: "/admin/settings", icon: "settings" },
];

const icons: Record<string, React.ReactNode> = {
    grid: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
    ),
    image: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
        </svg>
    ),
    folder: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    ),
    blog: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10,9 9,9 8,9" />
        </svg>
    ),
    users: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    mail: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
    ),
    settings: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
};

export default function AdminLayout({ children }: AdminLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        checkAuth();
    }, [pathname]);

    const checkAuth = async () => {
        // Skip auth check for login page and index (index handles its own redirect)
        if (pathname === "/admin" || pathname === "/admin/login") {
            setIsLoading(false);
            setIsAuthenticated(false);
            return;
        }

        const supabase = createClient();

        try {
            // Verify actual Supabase session
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                // Verify admin role in profiles table
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", session.user.id)
                    .single();

                if (profile?.role === "admin") {
                    setIsAuthenticated(true);
                    setIsLoading(false);
                    return;
                }
            }

            // If we reach here, we are not authenticated or not an admin
            // Clear any legacy session to be safe
            localStorage.removeItem("adminSession");
            router.push("/admin");
        } catch (err) {
            router.push("/admin");
        } finally {
            setIsLoading(false);
        }
    };

    // Failsafe: Ensure loading stops after 3 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isLoading) {
                setIsLoading(false);
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, [isLoading]);

    const handleLogout = () => {
        localStorage.removeItem("adminSession");
        router.push("/admin");
    };

    // Show login page and index without layout
    if (pathname === "/admin" || pathname === "/admin/login") {
        return <>{children}</>;
    }

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading admin panel...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className={styles.adminLayout}>
            {/* Mobile Header */}
            <header className={styles.mobileHeader}>
                <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
                <Link href="/admin/home" className={styles.mobileLogo}>
                    Pixico Admin
                </Link>
            </header>

            {/* Sidebar Backdrop */}
            {sidebarOpen && (
                <div className={styles.backdrop} onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}>
                <div className={styles.sidebarHeader}>
                    <Link href="/" className={styles.logo}>
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <rect width="28" height="28" fill="url(#adminLogoGrad)" />
                            <path d="M7 7H13V13H7V7Z" fill="white" fillOpacity="0.9" />
                            <path d="M15 7H21V13H15V7Z" fill="white" fillOpacity="0.6" />
                            <path d="M7 15H13V21H7V15Z" fill="white" fillOpacity="0.6" />
                            <path d="M15 15H21V21H15V15Z" fill="white" fillOpacity="0.3" />
                            <defs>
                                <linearGradient id="adminLogoGrad" x1="0" y1="0" x2="28" y2="28">
                                    <stop stopColor="#a855f7" />
                                    <stop offset="1" stopColor="#06b6d4" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <span>Pixico</span>
                    </Link>
                    <span className={styles.adminBadge}>Admin</span>
                </div>

                <nav className={styles.nav}>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${pathname === item.href || pathname.startsWith(item.href + "/") ? styles.active : ""}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            {icons[item.icon]}
                            <span>{item.name}</span>
                        </Link>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userInfo}>
                        <div className={styles.userAvatar}>A</div>
                        <div className={styles.userDetails}>
                            <span className={styles.userName}>Admin</span>
                            <span className={styles.userRole}>Administrator</span>
                        </div>
                    </div>
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        Logout
                    </button>
                    <Link href="/" className={styles.backLink}>
                        ← Back to Site
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}
