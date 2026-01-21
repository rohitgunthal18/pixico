"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

interface Category {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    image_url: string | null;
    description: string | null;
    sort_order: number;
    show_in_header: boolean;
    show_in_footer: boolean;
    show_in_showcase: boolean;
    show_in_featured: boolean;
    show_in_trending: boolean;
    prompt_count?: number;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        icon: "",
        image_url: "",
        description: "",
        show_in_header: true,
        show_in_footer: true,
        show_in_showcase: true,
        show_in_featured: true,
        show_in_trending: true,
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    // Failsafe: Ensure loading stops after 5 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isLoading) {
                setIsLoading(false);
            }
        }, 5000);
        return () => clearTimeout(timer);
    }, [isLoading]);

    const fetchCategories = async () => {
        setIsLoading(true);
        const supabase = createClient();

        try {
            // Fetch categories with prompt counts in a SINGLE query (fixes N+1)
            const { data, error: fetchError } = await supabase
                .from("categories")
                .select(`
                    *,
                    prompt_categories(count)
                `)
                .order("sort_order");

            if (fetchError) throw fetchError;

            // Transform the data to extract count
            const categoriesWithCounts = (data || []).map((cat: any) => ({
                ...cat,
                prompt_count: cat.prompt_categories?.[0]?.count || 0
            }));

            setCategories(categoriesWithCounts);
        } catch (err) {
            setError("Failed to load categories");
        } finally {
            setIsLoading(false);
        }
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
    };

    const handleOpenModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                slug: category.slug,
                icon: category.icon || "",
                image_url: category.image_url || "",
                description: category.description || "",
                show_in_header: category.show_in_header,
                show_in_footer: category.show_in_footer,
                show_in_showcase: category.show_in_showcase,
                show_in_featured: category.show_in_featured,
                show_in_trending: category.show_in_trending,
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: "",
                slug: "",
                icon: "",
                image_url: "",
                description: "",
                show_in_header: true,
                show_in_footer: true,
                show_in_showcase: true,
                show_in_featured: true,
                show_in_trending: true,
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCategory(null);
        setFormData({
            name: "",
            slug: "",
            icon: "",
            image_url: "",
            description: "",
            show_in_header: true,
            show_in_footer: true,
            show_in_showcase: true,
            show_in_featured: true,
            show_in_trending: true,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const supabase = createClient();
        const slug = formData.slug || generateSlug(formData.name);

        try {
            if (editingCategory) {
                // Update existing category
                const { data: updateData, error: updateError } = await supabase
                    .from("categories")
                    .update({
                        name: formData.name,
                        slug,
                        icon: formData.icon || null,
                        image_url: formData.image_url || null,
                        description: formData.description || null,
                        show_in_header: formData.show_in_header,
                        show_in_footer: formData.show_in_footer,
                        show_in_showcase: formData.show_in_showcase,
                        show_in_featured: formData.show_in_featured,
                        show_in_trending: formData.show_in_trending,
                    })
                    .eq("id", editingCategory.id)
                    .select();

                if (updateError) throw updateError;

                // Check if update actually affected any rows
                if (!updateData || updateData.length === 0) {
                    throw new Error("Update failed - you may not have permission to modify this category");
                }

                setSuccess("Category updated successfully!");
            } else {
                // Create new category
                const maxOrder = Math.max(...categories.map(c => c.sort_order), -1);
                const { error: insertError } = await supabase
                    .from("categories")
                    .insert({
                        name: formData.name,
                        slug,
                        icon: formData.icon || null,
                        image_url: formData.image_url || null,
                        description: formData.description || null,
                        show_in_header: formData.show_in_header,
                        show_in_footer: formData.show_in_footer,
                        show_in_showcase: formData.show_in_showcase,
                        show_in_featured: formData.show_in_featured,
                        show_in_trending: formData.show_in_trending,
                        sort_order: maxOrder + 1,
                    });

                if (insertError) throw insertError;
                setSuccess("Category created successfully!");
            }

            handleCloseModal();
            fetchCategories();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save category");
        }
    };

    const handleDelete = async (category: Category) => {
        if (!confirm(`Are you sure you want to delete "${category.name}"? This cannot be undone.`)) {
            return;
        }

        const supabase = createClient();

        try {
            const { error: deleteError } = await supabase
                .from("categories")
                .delete()
                .eq("id", category.id);

            if (deleteError) throw deleteError;

            setSuccess("Category deleted successfully!");
            fetchCategories();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError("Failed to delete category. It may have associated prompts.");
        }
    };

    const handleMoveUp = async (category: Category, index: number) => {
        if (index === 0) return;
        const supabase = createClient();
        const prevCategory = categories[index - 1];

        try {
            await Promise.all([
                supabase.from("categories").update({ sort_order: category.sort_order }).eq("id", prevCategory.id),
                supabase.from("categories").update({ sort_order: prevCategory.sort_order }).eq("id", category.id),
            ]);
            fetchCategories();
        } catch (err) {
        }
    };

    const handleMoveDown = async (category: Category, index: number) => {
        if (index === categories.length - 1) return;
        const supabase = createClient();
        const nextCategory = categories[index + 1];

        try {
            await Promise.all([
                supabase.from("categories").update({ sort_order: category.sort_order }).eq("id", nextCategory.id),
                supabase.from("categories").update({ sort_order: nextCategory.sort_order }).eq("id", category.id),
            ]);
            fetchCategories();
        } catch (err) {
        }
    };

    if (isLoading) {
        return (
            <div className={styles.loadingPage}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading categories...</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.headerTitle}>
                        <h1>Categories</h1>
                        <p>Manage categories for prompts, header, footer, and showcase sections</p>
                    </div>
                    <button className={styles.addBtn} onClick={() => handleOpenModal()}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Category
                    </button>
                </div>
            </header>

            {/* Alerts */}
            {error && (
                <div className={styles.alert + " " + styles.alertError}>
                    <span>{error}</span>
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            {success && (
                <div className={styles.alert + " " + styles.alertSuccess}>
                    <span>{success}</span>
                </div>
            )}

            {/* Categories Table */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Order</th>
                            <th>Name</th>
                            <th>Slug</th>
                            <th>Prompts</th>
                            <th>Header</th>
                            <th>Featured</th>
                            <th>Showcase</th>
                            <th>Trending</th>
                            <th>Footer</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((category, index) => (
                            <tr key={category.id}>
                                <td className={styles.orderCell}>
                                    <div className={styles.orderBtns}>
                                        <button
                                            className={styles.orderBtn}
                                            onClick={() => handleMoveUp(category, index)}
                                            disabled={index === 0}
                                        >
                                            ↑
                                        </button>
                                        <span>{category.sort_order}</span>
                                        <button
                                            className={styles.orderBtn}
                                            onClick={() => handleMoveDown(category, index)}
                                            disabled={index === categories.length - 1}
                                        >
                                            ↓
                                        </button>
                                    </div>
                                </td>
                                <td className={styles.nameCell}>
                                    <strong>{category.name}</strong>
                                    {category.description && (
                                        <span className={styles.description}>{category.description}</span>
                                    )}
                                </td>
                                <td><code className={styles.slug}>{category.slug}</code></td>
                                <td className={styles.countCell}>{category.prompt_count || 0}</td>
                                <td>
                                    <span className={`${styles.badge} ${category.show_in_header ? styles.badgeActive : styles.badgeInactive}`}>
                                        {category.show_in_header ? "Yes" : "No"}
                                    </span>
                                </td>
                                <td>
                                    <span className={`${styles.badge} ${category.show_in_featured ? styles.badgeActive : styles.badgeInactive}`}>
                                        {category.show_in_featured ? "Yes" : "No"}
                                    </span>
                                </td>
                                <td>
                                    <span className={`${styles.badge} ${category.show_in_showcase ? styles.badgeActive : styles.badgeInactive}`}>
                                        {category.show_in_showcase ? "Yes" : "No"}
                                    </span>
                                </td>
                                <td>
                                    <span className={`${styles.badge} ${category.show_in_trending ? styles.badgeActive : styles.badgeInactive}`}>
                                        {category.show_in_trending ? "Yes" : "No"}
                                    </span>
                                </td>
                                <td>
                                    <span className={`${styles.badge} ${category.show_in_footer ? styles.badgeActive : styles.badgeInactive}`}>
                                        {category.show_in_footer ? "Yes" : "No"}
                                    </span>
                                </td>
                                <td className={styles.actionsCell}>
                                    <button className={styles.editBtn} onClick={() => handleOpenModal(category)}>
                                        Edit
                                    </button>
                                    {category.slug !== "all" && (
                                        <button className={styles.deleteBtn} onClick={() => handleDelete(category)}>
                                            Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={handleCloseModal}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>{editingCategory ? "Edit Category" : "Add Category"}</h2>
                            <button className={styles.modalClose} onClick={handleCloseModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label>Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Category name"
                                    className={styles.input}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Slug</label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    placeholder="Auto-generated from name"
                                    className={styles.input}
                                />
                                <span className={styles.hint}>Leave empty to auto-generate from name</span>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description (optional)"
                                    className={styles.textarea}
                                    rows={2}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Image URL (for showcase)</label>
                                <input
                                    type="text"
                                    value={formData.image_url}
                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                    placeholder="https://..."
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.checkboxGroup}>
                                <label className={styles.checkbox}>
                                    <input
                                        type="checkbox"
                                        checked={formData.show_in_header}
                                        onChange={(e) => setFormData({ ...formData, show_in_header: e.target.checked })}
                                    />
                                    <span>Show in Header</span>
                                </label>
                                <label className={styles.checkbox}>
                                    <input
                                        type="checkbox"
                                        checked={formData.show_in_featured}
                                        onChange={(e) => setFormData({ ...formData, show_in_featured: e.target.checked })}
                                    />
                                    <span>Featured Prompts</span>
                                </label>
                                <label className={styles.checkbox}>
                                    <input
                                        type="checkbox"
                                        checked={formData.show_in_showcase}
                                        onChange={(e) => setFormData({ ...formData, show_in_showcase: e.target.checked })}
                                    />
                                    <span>Browse by Category</span>
                                </label>
                                <label className={styles.checkbox}>
                                    <input
                                        type="checkbox"
                                        checked={formData.show_in_trending}
                                        onChange={(e) => setFormData({ ...formData, show_in_trending: e.target.checked })}
                                    />
                                    <span>Trending This Week</span>
                                </label>
                                <label className={styles.checkbox}>
                                    <input
                                        type="checkbox"
                                        checked={formData.show_in_footer}
                                        onChange={(e) => setFormData({ ...formData, show_in_footer: e.target.checked })}
                                    />
                                    <span>Show in Footer</span>
                                </label>
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelBtn} onClick={handleCloseModal}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.submitBtn}>
                                    {editingCategory ? "Update Category" : "Create Category"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
