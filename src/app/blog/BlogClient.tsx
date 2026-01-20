"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

interface Blog {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    featured_image: string | null;
    view_count: number;
    created_at: string;
    category: { id: string; name: string; slug: string } | null;
}

interface Category {
    id: string;
    name: string;
    slug: string;
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

interface BlogClientProps {
    initialBlogs: Blog[];
    initialCategories: Category[];
}

export default function BlogClient({ initialBlogs, initialCategories }: BlogClientProps) {
    const [blogs] = useState<Blog[]>(initialBlogs);
    const [categories] = useState<Category[]>(initialCategories);
    const [activeCategory, setActiveCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredBlogs = blogs.filter(blog => {
        const matchesCategory = activeCategory === "all" || blog.category?.id === activeCategory;
        const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            blog.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="container">
            {/* Hero */}
            <div className={styles.hero}>
                <h1 className={styles.title}>Blog</h1>
                <p className={styles.subtitle}>
                    AI tips, tutorials, and industry insights to help you create better prompts
                </p>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="7" />
                        <path d="M21 21l-4-4" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search blogs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className={styles.categoryTabs}>
                    <button
                        className={`${styles.tab} ${activeCategory === "all" ? styles.active : ""}`}
                        onClick={() => setActiveCategory("all")}
                    >
                        All
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            className={`${styles.tab} ${activeCategory === cat.id ? styles.active : ""}`}
                            onClick={() => setActiveCategory(cat.id)}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {filteredBlogs.length === 0 ? (
                <div className={styles.empty}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14,2 14,8 20,8" />
                    </svg>
                    <h3>No blogs found</h3>
                    <p>Check back later for new content!</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {filteredBlogs.map((blog) => (
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
                                        style={{ objectFit: "cover" }}
                                    />
                                ) : (
                                    <div className={styles.imagePlaceholder}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className={styles.cardContent}>
                                {blog.category && (
                                    <span className={styles.category}>{blog.category.name}</span>
                                )}
                                <h2 className={styles.cardTitle}>{blog.title}</h2>
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
            )}
        </div>
    );
}
