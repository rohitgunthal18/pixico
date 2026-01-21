"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

interface Prompt {
    id: string;
    title: string;
    slug: string;
    prompt_code: string | null;
    image_url: string | null;
    status: string;
    view_count: number;
    like_count: number;
    created_at: string;
    category: { name: string } | null;
    ai_model: { name: string } | null;
}

const ITEMS_PER_PAGE = 20;

export default function PromptsPage() {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
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

    // Escape to cancel confirmation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setConfirmDeleteId(null);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        fetchPrompts();
    }, [currentPage]);

    const fetchPrompts = async () => {
        setIsLoading(true);
        try {
            const supabase = createClient();

            // Get total count first
            const { count } = await supabase
                .from("prompts")
                .select("*", { count: "exact", head: true });

            setTotalCount(count || 0);

            // Calculate range for pagination
            const from = (currentPage - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            const { data, error } = await supabase
                .from("prompts")
                .select(`
                    id, title, slug, prompt_code, image_url, status, view_count, like_count, created_at,
                    category:categories!category_id(name),
                    ai_model:ai_models!model_id(name)
                `)
                .order("created_at", { ascending: false })
                .range(from, to);

            if (error) {
                setError("Failed to load prompts");
            } else {
                setPrompts((data || []) as unknown as Prompt[]);
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

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

    const handleStatusChange = async (promptId: string, newStatus: string) => {
        const supabase = createClient();
        const { error } = await supabase
            .from("prompts")
            .update({ status: newStatus })
            .eq("id", promptId);

        if (error) {
        } else {
            setPrompts(prompts.map(p =>
                p.id === promptId ? { ...p, status: newStatus } : p
            ));
        }
    };

    const handleDelete = async (promptId: string) => {
        // If not yet confirming this prompt, set it to confirming mode
        if (confirmDeleteId !== promptId) {
            setConfirmDeleteId(promptId);
            return;
        }

        // If already confirming, proceed with delete
        setIsDeleting(promptId);
        setConfirmDeleteId(null);
        setError(null);

        try {
            const supabase = createClient();
            const { error: deleteError } = await supabase
                .from("prompts")
                .delete()
                .eq("id", promptId);

            if (deleteError) {
                setError(`Failed to delete: ${deleteError.message}`);
            } else {
                setPrompts(prev => prev.filter(p => p.id !== promptId));
                setSuccess("Prompt deleted successfully");
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError("An unexpected error occurred.");
        } finally {
            setIsDeleting(null);
        }
    };

    const filteredPrompts = prompts.filter(prompt => {
        const matchesSearch = prompt.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || prompt.status === statusFilter;
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
                <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading prompts list...</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Prompts</h1>
                    <span className={styles.count}>{totalCount} total</span>
                </div>
                <Link href="/admin/prompts/new" className={styles.addBtn}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Prompt
                </Link>
            </header>

            {/* Notifications */}
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

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="7" />
                        <path d="M21 21l-4-4" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search prompts..."
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

            {/* Prompts Table */}
            {filteredPrompts.length === 0 ? (
                <div className={styles.empty}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="m21 15-5-5L5 21" />
                    </svg>
                    <h3>No prompts found</h3>
                    <p>Create your first prompt to get started.</p>
                    <Link href="/admin/prompts/new" className={styles.emptyBtn}>
                        Add New Prompt
                    </Link>
                </div>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Prompt</th>
                                <th>Category</th>
                                <th>Model</th>
                                <th>Status</th>
                                <th>Views</th>
                                <th>Likes</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPrompts.map((prompt) => (
                                <tr key={prompt.id}>
                                    <td>
                                        <span className={styles.promptCode}>{prompt.prompt_code || "—"}</span>
                                    </td>
                                    <td>
                                        <div className={styles.promptCell}>
                                            {prompt.image_url ? (
                                                <Image
                                                    src={prompt.image_url}
                                                    alt={prompt.title}
                                                    width={48}
                                                    height={48}
                                                    className={styles.thumbnail}
                                                />
                                            ) : (
                                                <div className={styles.thumbnailPlaceholder}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                                        <path d="m21 15-5-5L5 21" />
                                                    </svg>
                                                </div>
                                            )}
                                            <span className={styles.promptTitle}>{prompt.title}</span>
                                        </div>
                                    </td>
                                    <td>{prompt.category?.name || "—"}</td>
                                    <td>{prompt.ai_model?.name || "—"}</td>
                                    <td>
                                        <select
                                            className={`${styles.statusBadge} ${styles[prompt.status]}`}
                                            value={prompt.status}
                                            onChange={(e) => handleStatusChange(prompt.id, e.target.value)}
                                        >
                                            <option value="published">Published</option>
                                            <option value="draft">Draft</option>
                                            <option value="hidden">Hidden</option>
                                        </select>
                                    </td>
                                    <td>{prompt.view_count.toLocaleString()}</td>
                                    <td>{prompt.like_count.toLocaleString()}</td>
                                    <td>{formatDate(prompt.created_at)}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <Link
                                                href={`/admin/prompts/${prompt.id}/edit`}
                                                className={styles.actionBtn}
                                                title="Edit"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </Link>
                                            <Link
                                                href={`/prompt/${prompt.slug}`}
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
                                                className={`${styles.actionBtn} ${styles.deleteBtn} ${isDeleting === prompt.id ? styles.loadingBtn : ""} ${confirmDeleteId === prompt.id ? styles.confirming : ""}`}
                                                onClick={() => handleDelete(prompt.id)}
                                                disabled={isDeleting !== null}
                                                onMouseLeave={() => {
                                                    // Optional: auto-cancel confirmation on mouse leave after a delay
                                                    if (confirmDeleteId === prompt.id) {
                                                        setTimeout(() => setConfirmDeleteId(null), 3000);
                                                    }
                                                }}
                                                title={confirmDeleteId === prompt.id ? "Click again to confirm" : "Delete"}
                                            >
                                                {isDeleting === prompt.id ? (
                                                    <div className={styles.btnSpinner}></div>
                                                ) : confirmDeleteId === prompt.id ? (
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
