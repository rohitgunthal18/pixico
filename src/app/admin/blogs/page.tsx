"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

interface Blog {
    id: string;
    title: string;
    slug: string;
    featured_image: string | null;
    status: string;
    view_count: number;
    created_at: string;
    category: { name: string } | null;
}

const ITEMS_PER_PAGE = 20;

export default function BlogsPage() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setConfirmDeleteId(null);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        fetchBlogs();
    }, [currentPage]);

    // Failsafe: Ensure loading stops after 5 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isLoading) {
                setIsLoading(false);
            }
        }, 5000);
        return () => clearTimeout(timer);
    }, [isLoading]);

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const fetchBlogs = async () => {
        setIsLoading(true);
        try {
            const supabase = createClient();

            // Calculate range for pagination
            const from = (currentPage - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            // Run count and data queries in PARALLEL for faster loading
            const [countResult, dataResult] = await Promise.all([
                supabase.from("blogs").select("*", { count: "exact", head: true }),
                supabase
                    .from("blogs")
                    .select(`
                        id, title, slug, featured_image, status, view_count, created_at,
                        category:categories!category_id(name)
                    `)
                    .order("created_at", { ascending: false })
                    .range(from, to)
            ]);

            setTotalCount(countResult.count || 0);

            if (dataResult.error) {
                setError("Failed to load blogs");
            } else {
                setBlogs((dataResult.data || []) as unknown as Blog[]);
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (blogId: string, newStatus: string) => {
        const supabase = createClient();
        const updateData: { status: string; published_at?: string | null } = { status: newStatus };

        if (newStatus === "published") {
            updateData.published_at = new Date().toISOString();
        }

        const { error } = await supabase
            .from("blogs")
            .update(updateData)
            .eq("id", blogId);

        if (error) {
        } else {
            setBlogs(blogs.map(b =>
                b.id === blogId ? { ...b, status: newStatus } : b
            ));
        }
    };

    const handleDelete = async (blogId: string) => {
        if (confirmDeleteId !== blogId) {
            setConfirmDeleteId(blogId);
            return;
        }

        setIsDeleting(blogId);
        setConfirmDeleteId(null);
        setError(null);

        try {
            const supabase = createClient();
            const { error: deleteError } = await supabase
                .from("blogs")
                .delete()
                .eq("id", blogId);

            if (deleteError) {
                setError(`Failed to delete: ${deleteError.message}`);
            } else {
                setBlogs(prev => prev.filter(b => b.id !== blogId));
                setSuccess("Blog deleted successfully");
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError("An unexpected error occurred.");
        } finally {
            setIsDeleting(null);
        }
    };

    const filteredBlogs = blogs.filter(blog => {
        const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || blog.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading blogs...</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Blogs</h1>
                    <span className={styles.count}>{totalCount} total</span>
                </div>
                <Link href="/admin/blogs/new" className={styles.addBtn}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Blog
                </Link>
            </header>

            {error && (
                <div className={styles.alert + " " + styles.alertError}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{error}</span>
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            {success && (
                <div className={styles.alert + " " + styles.alertSuccess}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span>{success}</span>
                </div>
            )}

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
                <select
                    className={styles.statusSelect}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="hidden">Hidden</option>
                </select>
            </div>

            {filteredBlogs.length === 0 ? (
                <div className={styles.empty}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14,2 14,8 20,8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    <h3>No blogs found</h3>
                    <p>Create your first blog post to get started.</p>
                    <Link href="/admin/blogs/new" className={styles.emptyBtn}>
                        Add New Blog
                    </Link>
                </div>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Blog</th>
                                <th>Category</th>
                                <th>Status</th>
                                <th>Views</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBlogs.map((blog) => (
                                <tr key={blog.id}>
                                    <td>
                                        <div className={styles.blogCell}>
                                            {blog.featured_image ? (
                                                <Image
                                                    src={blog.featured_image}
                                                    alt={blog.title}
                                                    width={48}
                                                    height={48}
                                                    className={styles.thumbnail}
                                                />
                                            ) : (
                                                <div className={styles.thumbnailPlaceholder}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                        <polyline points="14,2 14,8 20,8" />
                                                    </svg>
                                                </div>
                                            )}
                                            <span className={styles.blogTitle}>{blog.title}</span>
                                        </div>
                                    </td>
                                    <td>{blog.category?.name || "—"}</td>
                                    <td>
                                        <select
                                            className={`${styles.statusBadge} ${styles[blog.status]}`}
                                            value={blog.status}
                                            onChange={(e) => handleStatusChange(blog.id, e.target.value)}
                                        >
                                            <option value="published">Published</option>
                                            <option value="draft">Draft</option>
                                            <option value="hidden">Hidden</option>
                                        </select>
                                    </td>
                                    <td>{blog.view_count.toLocaleString()}</td>
                                    <td>{formatDate(blog.created_at)}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <Link
                                                href={`/admin/blogs/${blog.id}/edit`}
                                                className={styles.actionBtn}
                                                title="Edit"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </Link>
                                            <Link
                                                href={`/blog/${blog.slug}`}
                                                className={styles.actionBtn}
                                                title="View"
                                                target="_blank"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                    <polyline points="15,3 21,3 21,9" />
                                                    <line x1="10" y1="14" x2="21" y2="3" />
                                                </svg>
                                            </Link>
                                            <button
                                                className={`${styles.actionBtn} ${styles.deleteBtn} ${isDeleting === blog.id ? styles.loadingBtn : ""} ${confirmDeleteId === blog.id ? styles.confirming : ""}`}
                                                onClick={() => handleDelete(blog.id)}
                                                disabled={isDeleting !== null}
                                                onMouseLeave={() => {
                                                    if (confirmDeleteId === blog.id) {
                                                        setTimeout(() => setConfirmDeleteId(null), 3000);
                                                    }
                                                }}
                                                title={confirmDeleteId === blog.id ? "Click again to confirm" : "Delete"}
                                            >
                                                {isDeleting === blog.id ? (
                                                    <div className={styles.btnSpinner}></div>
                                                ) : confirmDeleteId === blog.id ? (
                                                    <span className={styles.confirmText}>Confirm?</span>
                                                ) : (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="3,6 5,6 21,6" />
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        className={styles.pageBtn}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        ← Previous
                    </button>
                    <div className={styles.pageInfo}>
                        Page {currentPage} of {totalPages}
                    </div>
                    <button
                        className={styles.pageBtn}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}
