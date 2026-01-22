"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "./BlogSection.module.css";

interface Blog {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    featured_image: string | null;
    view_count: number;
    created_at: string;
    category: { name: string; slug: string } | null;
}

function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

interface BlogSectionProps {
    initialBlogs?: Blog[];
}

export default function BlogSection({ initialBlogs }: BlogSectionProps) {
    const [blogs, setBlogs] = useState<Blog[]>(initialBlogs || []);
    const [isLoading, setIsLoading] = useState(!initialBlogs);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Skip fetch if we have initial data from server
        if (!initialBlogs) {
            fetchBlogs();
        }
    }, [initialBlogs]);

    const fetchBlogs = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("blogs")
            .select(`
                id, title, slug, excerpt, featured_image, view_count, created_at,
                category:categories!category_id(name, slug)
            `)
            .eq("status", "published")
            .order("view_count", { ascending: false })
            .limit(6);

        if (!error && data) {
            setBlogs(data as unknown as Blog[]);
        }
        setIsLoading(false);
    };

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const scrollAmount = 350;
            scrollRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };

    if (isLoading) {
        return (
            <section className={styles.section}>
                <div className="container">
                    <div className={styles.header}>
                        <h2 className={styles.title}>Latest from Blog</h2>
                    </div>
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                    </div>
                </div>
            </section>
        );
    }

    if (blogs.length === 0) {
        return null;
    }

    return (
        <section className={styles.section}>
            <div className="container">
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h2 className={styles.title}>Latest from Blog</h2>
                        <span className={styles.subtitle}>AI tips, tutorials & industry insights</span>
                    </div>
                    <Link href="/blog" className={styles.viewAll}>
                        View All
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                {/* Blog Cards Slider with centered arrows */}
                <div className={styles.sliderContainer}>
                    {/* Left Arrow */}
                    <button
                        className={`${styles.sliderArrow} ${styles.arrowLeft}`}
                        onClick={() => scroll("left")}
                        aria-label="Scroll left"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>

                    <div className={styles.slider} ref={scrollRef}>
                        {blogs.map((blog) => (
                            <Link
                                key={blog.id}
                                href={`/blog/${blog.slug}`}
                                className={styles.card}
                            >
                                <div className={styles.cardImage}>
                                    {blog.featured_image ? (
                                        <Image
                                            src={blog.featured_image}
                                            alt={blog.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 350px"
                                            style={{ objectFit: "cover" }}
                                            loading={blogs.indexOf(blog) < 2 ? "eager" : "lazy"}
                                            priority={blogs.indexOf(blog) < 2}
                                        />
                                    ) : (
                                        <div className={styles.imagePlaceholder}>
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                <polyline points="14,2 14,8 20,8" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.cardContent}>
                                    {blog.category && (
                                        <span className={styles.category}>{blog.category.name}</span>
                                    )}
                                    <h3 className={styles.cardTitle}>{blog.title}</h3>
                                    {blog.excerpt && (
                                        <p className={styles.excerpt}>{blog.excerpt}</p>
                                    )}
                                    <div className={styles.cardMeta}>
                                        <span className={styles.date}>{formatDate(blog.created_at)}</span>
                                        <span className={styles.views}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                            {formatNumber(blog.view_count)}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Right Arrow */}
                    <button
                        className={`${styles.sliderArrow} ${styles.arrowRight}`}
                        onClick={() => scroll("right")}
                        aria-label="Scroll right"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>
                </div>

                {/* Mobile View All Button */}
                <div className={styles.mobileViewAll}>
                    <Link href="/blog" className={styles.viewAllBtn}>
                        View All Blog Posts
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
    );
}
