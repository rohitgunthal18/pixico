"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./page.module.css";

interface SavedPrompt {
    id: string;
    prompt: {
        id: string;
        title: string;
        slug: string;
        image_url: string | null;
        view_count: number;
        like_count: number;
    };
    created_at: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const { user, profile, isLoading, signOut } = useAuth();
    const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
    const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
    const [activeTab, setActiveTab] = useState<"saved" | "liked">("saved");

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (user) {
            fetchSavedPrompts();
        }
    }, [user]);

    const fetchSavedPrompts = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("saved_prompts")
            .select(`
                id,
                created_at,
                prompt:prompts(id, title, slug, image_url, view_count, like_count)
            `)
            .eq("user_id", user?.id)
            .order("created_at", { ascending: false });

        if (!error && data) {
            setSavedPrompts(data as unknown as SavedPrompt[]);
        }
        setIsLoadingPrompts(false);
    };

    const handleRemoveSaved = async (savedId: string) => {
        const supabase = createClient();
        await supabase.from("saved_prompts").delete().eq("id", savedId);
        setSavedPrompts(savedPrompts.filter(s => s.id !== savedId));
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
        if (num >= 1000) return (num / 1000).toFixed(1) + "K";
        return num.toString();
    };

    if (isLoading || !user) {
        return (
            <>
                <Header />
                <main className={styles.main}>
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <main className={styles.main}>
                <div className={styles.content}>
                    {/* Profile Header */}
                    <section className={styles.profileHeader}>
                        <div className={styles.avatar}>
                            {profile?.avatar_url ? (
                                <Image
                                    src={profile.avatar_url}
                                    alt={profile.full_name || "User"}
                                    width={100}
                                    height={100}
                                    className={styles.avatarImage}
                                />
                            ) : (
                                <div className={styles.avatarInitial}>
                                    {profile?.full_name?.[0] || profile?.email?.[0] || "U"}
                                </div>
                            )}
                        </div>
                        <div className={styles.userInfo}>
                            <h1 className={styles.userName}>{profile?.full_name || "User"}</h1>
                            <p className={styles.userEmail}>{profile?.email}</p>
                            <div className={styles.userStats}>
                                <div className={styles.stat}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                    </svg>
                                    <span><strong>{savedPrompts.length}</strong> Saved</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={signOut} className={styles.signOutBtn}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            Sign Out
                        </button>
                    </section>

                    {/* Tabs */}
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${activeTab === "saved" ? styles.active : ""}`}
                            onClick={() => setActiveTab("saved")}
                        >
                            Saved Prompts
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === "liked" ? styles.active : ""}`}
                            onClick={() => setActiveTab("liked")}
                        >
                            Liked Prompts
                        </button>
                    </div>

                    {/* Content Section */}
                    {isLoadingPrompts ? (
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                        </div>
                    ) : savedPrompts.length === 0 ? (
                        <div className={styles.empty}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                            <h3>No saved prompts yet</h3>
                            <p>Start exploring and save prompts you love!</p>
                            <Link href="/" className={styles.browseBtn}>
                                Explore Prompts
                            </Link>
                        </div>
                    ) : (
                        <div className={styles.promptsGrid}>
                            {savedPrompts.map((saved) => (
                                <div key={saved.id} className={styles.promptCard}>
                                    <Link href={`/prompt/${saved.prompt.slug}`}>
                                        {saved.prompt.image_url ? (
                                            <Image
                                                src={saved.prompt.image_url}
                                                alt={saved.prompt.title}
                                                width={400}
                                                height={300}
                                                className={styles.promptImage}
                                            />
                                        ) : (
                                            <div className={styles.promptImagePlaceholder}>
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                                    <path d="m21 15-5-5L5 21" />
                                                </svg>
                                            </div>
                                        )}
                                        <div className={styles.promptInfo}>
                                            <h3 className={styles.promptTitle}>{saved.prompt.title}</h3>
                                            <div className={styles.promptMeta}>
                                                <span>{formatNumber(saved.prompt.view_count)} views</span>
                                                <span>•</span>
                                                <span>{formatNumber(saved.prompt.like_count)} likes</span>
                                            </div>
                                        </div>
                                    </Link>
                                    <div className={styles.promptActions}>
                                        <button
                                            className={`${styles.actionBtn} ${styles.removeBtn}`}
                                            onClick={() => handleRemoveSaved(saved.id)}
                                            title="Remove from saved"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
