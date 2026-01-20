"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./page.module.css";

interface Prompt {
    id: string;
    title: string;
    slug: string;
    image_url: string | null;
    view_count: number;
    like_count: number;
    prompt_code: string | null;
    ai_model: { name: string } | null;
}

interface Blog {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    featured_image: string | null;
    view_count: number;
}

function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
}

function SearchContentInner() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get("q") || "";

    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const lastSearchRef = useRef<string>("");

    const performSearch = useCallback(async (searchTerm: string) => {
        if (!searchTerm.trim() || searchTerm === lastSearchRef.current) return;

        lastSearchRef.current = searchTerm;
        setIsLoading(true);
        setHasSearched(true);
        const supabase = createClient();

        // Check if searching by prompt code (4 digit number with or without #)
        const promptCodeMatch = searchTerm.match(/^#?(\d{4})$/);

        let promptsQuery;

        if (promptCodeMatch) {
            const code = promptCodeMatch[1];
            promptsQuery = supabase
                .from("prompts")
                .select("id, title, slug, image_url, view_count, like_count, prompt_code, ai_model:ai_models!model_id(name)")
                .eq("status", "published")
                .eq("prompt_code", code)
                .limit(30) as any;
        } else {
            const term = `%${searchTerm}%`;
            promptsQuery = supabase
                .from("prompts")
                .select("id, title, slug, image_url, view_count, like_count, prompt_code, ai_model:ai_models!model_id(name)")
                .eq("status", "published")
                .or(`title.ilike.${term},slug.ilike.${term},description.ilike.${term},prompt_text.ilike.${term}`)
                .order("view_count", { ascending: false })
                .limit(30) as any;
        }

        const term = `%${searchTerm}%`;
        const [promptsRes, blogsRes] = await Promise.all([
            promptsQuery,
            supabase
                .from("blogs")
                .select("id, title, slug, excerpt, featured_image, view_count")
                .eq("status", "published")
                .or(`title.ilike.${term},slug.ilike.${term},excerpt.ilike.${term},content.ilike.${term}`)
                .order("view_count", { ascending: false })
                .limit(12)
        ]);

        setPrompts((promptsRes.data as any[]) || []);
        setBlogs((blogsRes.data as any[]) || []);
        setIsLoading(false);
    }, []);

    // Search on initial load
    useEffect(() => {
        if (initialQuery) {
            performSearch(initialQuery);
        }
    }, [initialQuery, performSearch]);

    const totalResults = prompts.length + blogs.length;

    return (
        <>
            {/* Results Count Header - NO SEARCH BAR */}
            <div className={styles.resultsHeader}>
                {hasSearched && !isLoading && (
                    <span className={styles.resultsCount}>{totalResults} results</span>
                )}
                {isLoading && <span className={styles.resultsCount}>Searching...</span>}
            </div>

            {/* Loading State */}
            {isLoading && prompts.length === 0 && blogs.length === 0 && (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                </div>
            )}

            {/* Results */}
            {hasSearched && !isLoading && (
                <>
                    {/* Prompts Results - Same grid as homepage */}
                    {prompts.length > 0 && (
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>PROMPTS ({prompts.length})</h2>
                            <div className={styles.grid}>
                                {prompts.map((prompt) => (
                                    <Link key={prompt.id} href={`/prompt/${prompt.slug}`} className={styles.card}>
                                        <div className={styles.imageWrapper}>
                                            {prompt.image_url ? (
                                                <Image
                                                    src={prompt.image_url}
                                                    alt={prompt.title}
                                                    width={400}
                                                    height={500}
                                                    className={styles.image}
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className={styles.placeholder}>
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                                    </svg>
                                                </div>
                                            )}
                                            <div className={styles.overlay}>
                                                <h3 className={styles.promptTitle}>{prompt.title}</h3>
                                                <div className={styles.statsRow}>
                                                    {prompt.ai_model && (
                                                        <>
                                                            <div className={styles.modelBadge}>
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                                                    <path d="M12 3L14.5 8.5L20 9.5L16 14L17 20L12 17L7 20L8 14L4 9.5L9.5 8.5L12 3Z" fill="currentColor" />
                                                                </svg>
                                                                {prompt.ai_model?.name}
                                                            </div>
                                                            <div className={styles.statsDivider} />
                                                        </>
                                                    )}
                                                    <div className={styles.stat}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                                            <path d="M12 21C12 21 4 13.5 4 8.5C4 5.46 6.46 3 9.5 3C11.06 3 12.5 3.68 13.5 4.77L12 6.27L10.5 4.77C9.5 3.68 7.94 3 6.5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                            <path d="M12 21C12 21 20 13.5 20 8.5C20 5.46 17.54 3 14.5 3C12.94 3 11.5 3.68 10.5 4.77" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                        </svg>
                                                        {formatNumber(prompt.like_count || 0)}
                                                    </div>
                                                    <div className={styles.stat}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                                            <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" />
                                                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                                                        </svg>
                                                        {formatNumber(prompt.view_count || 0)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Mobile info below image */}
                                        <div className={styles.mobileInfo}>
                                            <span className={styles.mobileTitle}>{prompt.title}</span>
                                            <div className={styles.mobileMeta}>
                                                {prompt.prompt_code && <span className={styles.promptCode}>#{prompt.prompt_code}</span>}
                                                <span>{formatNumber(prompt.view_count || 0)} views</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Blogs Results */}
                    {blogs.length > 0 && (
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>ARTICLES ({blogs.length})</h2>
                            <div className={styles.blogsGrid}>
                                {blogs.map((blog) => (
                                    <Link key={blog.id} href={`/blog/${blog.slug}`} className={styles.blogCard}>
                                        <div className={styles.blogImage}>
                                            {blog.featured_image ? (
                                                <Image src={blog.featured_image} alt={blog.title} fill style={{ objectFit: "cover" }} />
                                            ) : (
                                                <div className={styles.placeholder}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.blogContent}>
                                            <h3>{blog.title}</h3>
                                            {blog.excerpt && <p>{blog.excerpt}</p>}
                                            <span>{formatNumber(blog.view_count)} views</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* No Results */}
                    {totalResults === 0 && (
                        <div className={styles.empty}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>
                            <p>No results found</p>
                            <Link href="/" className={styles.backBtn}>← Browse All</Link>
                        </div>
                    )}
                </>
            )}

            {/* Initial State */}
            {!hasSearched && !isLoading && (
                <div className={styles.empty}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <p>Use the search bar in the header</p>
                </div>
            )}
        </>
    );
}

interface SearchClientProps {
    headerCategories?: any[];
    footerCategories?: any[];
}

export default function SearchClient({ headerCategories, footerCategories }: SearchClientProps) {
    return (
        <>
            <Header initialCategories={headerCategories} />
            <main className={styles.main}>
                <div className="container">
                    <Suspense fallback={
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                        </div>
                    }>
                        <SearchContentInner />
                    </Suspense>
                </div>
            </main>
            <Footer initialCategories={footerCategories} />
        </>
    );
}
