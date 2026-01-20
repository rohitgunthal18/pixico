"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "./home.module.css";

interface DashboardStats {
    totalUsers: number;
    totalPrompts: number;
    totalViews: number;
    totalContacts: number;
    recentPrompts: Array<{
        id: string;
        title: string;
        view_count: number;
        created_at: string;
    }>;
    recentContacts: Array<{
        id: string;
        name: string;
        email: string;
        subject: string | null;
        status: string;
        created_at: string;
    }>;
}

export default function AdminHomePage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        totalPrompts: 0,
        totalViews: 0,
        totalContacts: 0,
        recentPrompts: [],
        recentContacts: [],
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        const supabase = createClient();

        try {
            const [usersRes, promptsRes, contactsRes] = await Promise.all([
                supabase.from("profiles").select("*", { count: "exact", head: true }),
                supabase.from("prompts").select("*", { count: "exact", head: true }),
                supabase.from("contact_queries").select("*", { count: "exact", head: true }),
            ]);

            const { data: viewsData } = await supabase
                .from("prompts")
                .select("view_count");

            const totalViews = viewsData?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0;

            const { data: recentPrompts } = await supabase
                .from("prompts")
                .select("id, title, view_count, created_at")
                .order("created_at", { ascending: false })
                .limit(5);

            const { data: recentContacts } = await supabase
                .from("contact_queries")
                .select("id, name, email, subject, status, created_at")
                .order("created_at", { ascending: false })
                .limit(5);

            setStats({
                totalUsers: usersRes.count || 0,
                totalPrompts: promptsRes.count || 0,
                totalViews,
                totalContacts: contactsRes.count || 0,
                recentPrompts: recentPrompts || [],
                recentContacts: recentContacts || [],
            });
        } catch (error) {
            // Error handling could be added here if needed
        } finally {
            setIsLoading(false);
        }
    };

    // Failsafe: Ensure loading stops after 5 seconds for page
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isLoading) {
                setIsLoading(false);
            }
        }, 5000);
        return () => clearTimeout(timer);
    }, [isLoading]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading dashboard stats...</p>
            </div>
        );
    }

    return (
        <div className={styles.dashboard}>
            <header className={styles.header}>
                <h1>Dashboard</h1>
                <p>Welcome back! Here's what's happening with your platform.</p>
            </header>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: "rgba(168, 85, 247, 0.15)", color: "#a855f7" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats.totalUsers}</span>
                        <span className={styles.statLabel}>Total Users</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: "rgba(6, 182, 212, 0.15)", color: "#06b6d4" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="m21 15-5-5L5 21" />
                        </svg>
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats.totalPrompts}</span>
                        <span className={styles.statLabel}>Total Prompts</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: "rgba(34, 197, 94, 0.15)", color: "#22c55e" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats.totalViews.toLocaleString()}</span>
                        <span className={styles.statLabel}>Total Views</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: "rgba(249, 115, 22, 0.15)", color: "#f97316" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats.totalContacts}</span>
                        <span className={styles.statLabel}>Contact Queries</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className={styles.quickActions}>
                <Link href="/admin/prompts/new" className={styles.actionBtn}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add New Prompt
                </Link>
                <Link href="/admin/prompts" className={styles.actionBtnSecondary}>
                    Manage Prompts
                </Link>
                <Link href="/admin/contacts" className={styles.actionBtnSecondary}>
                    View Contacts
                </Link>
            </div>

            {/* Recent Activity */}
            <div className={styles.activityGrid}>
                {/* Recent Prompts */}
                <div className={styles.activityCard}>
                    <div className={styles.activityHeader}>
                        <h3>Recent Prompts</h3>
                        <Link href="/admin/prompts" className={styles.viewAll}>View All →</Link>
                    </div>
                    <div className={styles.activityList}>
                        {stats.recentPrompts.length === 0 ? (
                            <p className={styles.empty}>No prompts yet. Add your first prompt!</p>
                        ) : (
                            stats.recentPrompts.map((prompt) => (
                                <div key={prompt.id} className={styles.activityItem}>
                                    <div className={styles.activityInfo}>
                                        <span className={styles.activityTitle}>{prompt.title}</span>
                                        <span className={styles.activityMeta}>
                                            {prompt.view_count} views • {formatDate(prompt.created_at)}
                                        </span>
                                    </div>
                                    <Link href={`/admin/prompts/${prompt.id}/edit`} className={styles.editLink}>
                                        Edit
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Contacts */}
                <div className={styles.activityCard}>
                    <div className={styles.activityHeader}>
                        <h3>Recent Contacts</h3>
                        <Link href="/admin/contacts" className={styles.viewAll}>View All →</Link>
                    </div>
                    <div className={styles.activityList}>
                        {stats.recentContacts.length === 0 ? (
                            <p className={styles.empty}>No contact queries yet.</p>
                        ) : (
                            stats.recentContacts.map((contact) => (
                                <div key={contact.id} className={styles.activityItem}>
                                    <div className={styles.activityInfo}>
                                        <span className={styles.activityTitle}>
                                            {contact.name}
                                            <span className={`${styles.statusBadge} ${styles[contact.status]}`}>
                                                {contact.status}
                                            </span>
                                        </span>
                                        <span className={styles.activityMeta}>
                                            {contact.subject || contact.email} • {formatDate(contact.created_at)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
