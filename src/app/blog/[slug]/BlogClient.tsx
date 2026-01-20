"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./page.module.css";
import DOMPurify from "dompurify";

interface Blog {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    featured_image: string | null;
    image_alt: string | null;
    view_count: number;
    created_at: string;
    published_at: string | null;
    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string[] | null;
    category: { id: string; name: string; slug: string } | null;
    blog_tags: { tag: { id: string; name: string } }[];
}

interface RelatedPrompt {
    id: string;
    title: string;
    slug: string;
    image_url: string | null;
    view_count: number;
}

interface RelatedBlog {
    id: string;
    title: string;
    slug: string;
    featured_image: string | null;
    view_count: number;
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
    initialBlog: Blog | null;
    initialRelatedPrompts: RelatedPrompt[];
    initialRelatedBlogs: RelatedBlog[];
    headerCategories?: any[];
    footerCategories?: any[];
}

export default function BlogClient({
    initialBlog,
    initialRelatedPrompts,
    initialRelatedBlogs,
    headerCategories,
    footerCategories
}: BlogClientProps) {
    const params = useParams();
    const slug = params.slug as string;

    const [blog, setBlog] = useState<Blog | null>(initialBlog);
    const [relatedPrompts, setRelatedPrompts] = useState<RelatedPrompt[]>(initialRelatedPrompts);
    const [relatedBlogs, setRelatedBlogs] = useState<RelatedBlog[]>(initialRelatedBlogs);
    const [isLoading, setIsLoading] = useState(!initialBlog);
    const [notFoundError, setNotFoundError] = useState(false);

    useEffect(() => {
        if (slug && (!blog || blog.slug !== slug)) {
            fetchBlog();
        }
    }, [slug]);

    const fetchBlog = async () => {
        setIsLoading(true);
        const supabase = createClient();

        const { data, error } = await supabase
            .from("blogs")
            .select(`
                id, title, slug, excerpt, content, featured_image, image_alt,
                view_count, created_at, published_at, meta_title, meta_description, meta_keywords,
                category:categories!category_id(id, name, slug),
                blog_tags(tag:tags(id, name))
            `)
            .eq("slug", slug)
            .eq("status", "published")
            .single();

        if (error || !data) {
            setNotFoundError(true);
            setIsLoading(false);
            return;
        }

        const blogData = data as unknown as Blog;
        setBlog(blogData);

        await supabase.rpc("increment_blog_view_count", { blog_id: blogData.id });

        if (blogData.category) {
            const [promptsRes, blogsRes] = await Promise.all([
                supabase
                    .from("prompts")
                    .select("id, title, slug, image_url, view_count")
                    .eq("category_id", blogData.category.id)
                    .eq("status", "published")
                    .order("view_count", { ascending: false })
                    .limit(6),
                supabase
                    .from("blogs")
                    .select("id, title, slug, featured_image, view_count")
                    .eq("category_id", blogData.category.id)
                    .eq("status", "published")
                    .neq("id", blogData.id)
                    .order("view_count", { ascending: false })
                    .limit(6)
            ]);

            setRelatedPrompts((promptsRes.data || []) as RelatedPrompt[]);
            setRelatedBlogs((blogsRes.data || []) as RelatedBlog[]);
        }

        setIsLoading(false);
    };

    if (notFoundError) {
        return (
            <>
                <Header />
                <main className={styles.main}>
                    <div className={styles.notFound}>
                        <h1>Blog Not Found</h1>
                        <p>This blog post doesn&apos;t exist or has been removed.</p>
                        <Link href="/blog" className={styles.backBtn}>← Back to Blog</Link>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    if (isLoading) {
        return (
            <>
                <Header />
                <main className={styles.main}>
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Loading...</p>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    if (!blog) return null;

    return (
        <>
            <Header initialCategories={headerCategories} />
            <main className={styles.main}>
                <div className={styles.hero}>
                    <div className="container">
                        <div className={styles.heroContent}>
                            {blog.category && (
                                <Link href={`/blog?category=${blog.category.id}`} className={styles.categoryBadge}>
                                    {blog.category.name}
                                </Link>
                            )}
                            <h1 className={styles.title}>{blog.title}</h1>
                            {blog.excerpt && <p className={styles.excerpt}>{blog.excerpt}</p>}
                            <div className={styles.meta}>
                                <span className={styles.date}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                    {formatDate(blog.published_at || blog.created_at)}
                                </span>
                                <span className={styles.views}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                    {formatNumber(blog.view_count)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {blog.featured_image && (
                    <div className={styles.featuredImage}>
                        <div className="container">
                            <div className={styles.imageWrapper}>
                                <Image
                                    src={blog.featured_image}
                                    alt={blog.image_alt || blog.title}
                                    fill
                                    style={{ objectFit: "cover" }}
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="container">
                    <div className={styles.contentLayout}>
                        <article className={styles.article}>
                            <div
                                className={styles.blogContent}
                                dangerouslySetInnerHTML={{
                                    __html: typeof window !== 'undefined'
                                        ? DOMPurify.sanitize(blog.content)
                                        : blog.content
                                }}
                            />

                            {blog.blog_tags && blog.blog_tags.length > 0 && (
                                <div className={styles.tags}>
                                    {blog.blog_tags.map(bt => (
                                        <span key={bt.tag.id} className={styles.tag}>#{bt.tag.name}</span>
                                    ))}
                                </div>
                            )}

                            <div className={styles.share}>
                                <span>Share:</span>
                                <a
                                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.shareBtn}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                </a>
                                <a
                                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.shareBtn}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                </a>
                            </div>
                        </article>

                        <aside className={styles.sidebar}>
                            {relatedPrompts.length > 0 && (
                                <div className={styles.sidebarSection}>
                                    <h3>Related Prompts</h3>
                                    <div className={styles.relatedGrid}>
                                        {relatedPrompts.map(prompt => (
                                            <Link key={prompt.id} href={`/prompt/${prompt.slug}`} className={styles.relatedCard}>
                                                {prompt.image_url ? (
                                                    <Image src={prompt.image_url} alt={prompt.title} fill style={{ objectFit: "cover" }} />
                                                ) : (
                                                    <div className={styles.placeholder}>
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="3" y="3" width="18" height="18" rx="2" />
                                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                                            <path d="m21 15-5-5L5 21" />
                                                        </svg>
                                                    </div>
                                                )}
                                                <span className={styles.relatedTitle}>{prompt.title}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {relatedBlogs.length > 0 && (
                                <div className={styles.sidebarSection}>
                                    <h3>More Articles</h3>
                                    <div className={styles.relatedGrid}>
                                        {relatedBlogs.map(b => (
                                            <Link key={b.id} href={`/blog/${b.slug}`} className={styles.relatedCard}>
                                                {b.featured_image ? (
                                                    <Image src={b.featured_image} alt={b.title} fill style={{ objectFit: "cover" }} />
                                                ) : (
                                                    <div className={styles.placeholder}>
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                            <polyline points="14,2 14,8 20,8" />
                                                        </svg>
                                                    </div>
                                                )}
                                                <span className={styles.relatedTitle}>{b.title}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Link href="/blog" className={styles.backBtn}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 12H5M12 19l-7-7 7-7" />
                                </svg>
                                Back to Blog
                            </Link>
                        </aside>
                    </div>

                    <div className={styles.mobileRelated}>
                        {relatedPrompts.length > 0 && (
                            <div className={styles.mobileSection}>
                                <h3>Related Prompts</h3>
                                <div className={styles.mobileGrid}>
                                    {relatedPrompts.slice(0, 4).map(prompt => (
                                        <Link key={prompt.id} href={`/prompt/${prompt.slug}`} className={styles.mobileCard}>
                                            <div className={styles.mobileCardImage}>
                                                {prompt.image_url ? (
                                                    <Image src={prompt.image_url} alt={prompt.title} fill style={{ objectFit: "cover" }} />
                                                ) : (
                                                    <div className={styles.placeholder}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="3" y="3" width="18" height="18" rx="2" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <span>{prompt.title}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {relatedBlogs.length > 0 && (
                            <div className={styles.mobileSection}>
                                <h3>More Articles</h3>
                                <div className={styles.mobileGrid}>
                                    {relatedBlogs.slice(0, 4).map(b => (
                                        <Link key={b.id} href={`/blog/${b.slug}`} className={styles.mobileCard}>
                                            <div className={styles.mobileCardImage}>
                                                {b.featured_image ? (
                                                    <Image src={b.featured_image} alt={b.title} fill style={{ objectFit: "cover" }} />
                                                ) : (
                                                    <div className={styles.placeholder}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <span>{b.title}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Link href="/blog" className={styles.mobileBackBtn}>
                            ← Back to Blog
                        </Link>
                    </div>
                </div>
            </main>
            <Footer initialCategories={footerCategories} />
        </>
    );
}
