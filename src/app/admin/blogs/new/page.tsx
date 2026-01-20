"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import styles from "./page.module.css";

interface Category {
    id: string;
    name: string;
    slug: string;
}

interface Tag {
    id: string;
    name: string;
}

export default function NewBlogPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form data
    const [title, setTitle] = useState("");
    const [excerpt, setExcerpt] = useState("");
    const [content, setContent] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState("");
    const [status, setStatus] = useState("draft");

    // SEO fields
    const [metaTitle, setMetaTitle] = useState("");
    const [metaDescription, setMetaDescription] = useState("");
    const [metaKeywords, setMetaKeywords] = useState("");
    const [slug, setSlug] = useState("");

    // Image upload
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageAlt, setImageAlt] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    // Data lists
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoadingData(true);
        const supabase = createClient();

        try {
            const [catRes, tagRes] = await Promise.all([
                supabase.from("categories").select("id, name, slug").order("sort_order"),
                supabase.from("tags").select("id, name").order("name"),
            ]);

            setCategories(catRes.data || []);
            setTags(tagRes.data || []);
        } catch (err) {
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError("Image must be less than 5MB");
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const generateSlug = (text: string) => {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .slice(0, 100);
    };

    // Auto-generate slug from title
    useEffect(() => {
        if (title && !slug) {
            setSlug(generateSlug(title));
        }
    }, [title, slug]);

    const handleAddTag = async () => {
        if (!newTag.trim()) return;

        const supabase = createClient();
        const tagSlug = generateSlug(newTag);

        const { data: existing } = await supabase
            .from("tags")
            .select("id")
            .eq("slug", tagSlug)
            .single();

        if (existing) {
            if (!selectedTags.includes(existing.id)) {
                setSelectedTags([...selectedTags, existing.id]);
            }
        } else {
            const { data: newTagData } = await supabase
                .from("tags")
                .insert({ name: newTag.trim(), slug: tagSlug })
                .select("id, name")
                .single();

            if (newTagData) {
                setTags([...tags, newTagData]);
                setSelectedTags([...selectedTags, newTagData.id]);
            }
        }

        setNewTag("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !content.trim()) {
            setError("Title and content are required");
            return;
        }

        if (!categoryId) {
            setError("Please select a category");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        const supabase = createClient();

        try {
            let imageUrl = null;

            // Upload image if provided
            if (imageFile) {
                setIsUploading(true);
                const fileExt = imageFile.name.split(".").pop();
                const fileName = `blog-${Date.now()}-${generateSlug(title)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from("prompt-images")
                    .upload(fileName, imageFile, {
                        cacheControl: "3600",
                        upsert: false
                    });

                if (uploadError) {
                    setError("Image upload failed, creating blog without image...");
                } else {
                    const { data: urlData } = supabase.storage
                        .from("prompt-images")
                        .getPublicUrl(fileName);
                    imageUrl = urlData.publicUrl;
                }
                setIsUploading(false);
            }

            // Create blog
            const finalSlug = slug || generateSlug(title);
            const { data: blogData, error: blogError } = await supabase
                .from("blogs")
                .insert({
                    title,
                    slug: finalSlug,
                    excerpt: excerpt || null,
                    content,
                    featured_image: imageUrl,
                    image_alt: imageAlt || null,
                    category_id: categoryId || null,
                    author_id: user?.id,
                    status,
                    meta_title: metaTitle || null,
                    meta_description: metaDescription || null,
                    meta_keywords: metaKeywords ? metaKeywords.split(",").map(k => k.trim()) : null,
                    published_at: status === "published" ? new Date().toISOString() : null,
                })
                .select("id")
                .single();

            if (blogError) throw blogError;

            // Add tags
            if (selectedTags.length > 0 && blogData) {
                const tagInserts = selectedTags.map(tagId => ({
                    blog_id: blogData.id,
                    tag_id: tagId,
                }));
                await supabase.from("blog_tags").insert(tagInserts);
            }

            setSuccess(`Blog "${title}" created successfully! Redirecting...`);
            setTimeout(() => {
                router.push("/admin/blogs");
            }, 2000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to create blog");
            setIsSubmitting(false);
        }
    };

    if (isLoadingData) {
        return (
            <div className={styles.loadingPage}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading form data...</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <Link href="/admin/blogs" className={styles.backBtn}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back
                    </Link>
                    <div className={styles.headerTitle}>
                        <h1>Create New Blog</h1>
                        <p>Add a new SEO-optimized blog post</p>
                    </div>
                </div>
            </header>

            {/* Alerts */}
            {error && (
                <div className={styles.alert + " " + styles.alertError}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <span>{error}</span>
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            {success && (
                <div className={styles.alert + " " + styles.alertSuccess}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span>{success}</span>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formLayout}>
                    {/* Left Column - Main Content */}
                    <div className={styles.mainCol}>
                        {/* Basic Info Card */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h2>Basic Information</h2>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="title">
                                        Blog Title <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g., Getting Started with AI Image Generation"
                                        className={styles.input}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="slug">
                                        URL Slug
                                        <span className={styles.charCount}>/blog/{slug || "your-slug"}</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="slug"
                                        value={slug}
                                        onChange={(e) => setSlug(generateSlug(e.target.value))}
                                        placeholder="auto-generated-from-title"
                                        className={styles.input}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="excerpt">
                                        Excerpt / Summary
                                    </label>
                                    <textarea
                                        id="excerpt"
                                        value={excerpt}
                                        onChange={(e) => setExcerpt(e.target.value)}
                                        placeholder="A brief summary of the blog post (shown in cards and previews)..."
                                        className={styles.textarea}
                                        rows={3}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="content">
                                        Blog Content <span className={styles.required}>*</span>
                                        <span className={styles.htmlBadge}>HTML Supported</span>
                                    </label>
                                    <textarea
                                        id="content"
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Paste your HTML content here. Supports all HTML tags including headings, paragraphs, lists, tables, images, etc."
                                        className={styles.textarea + " " + styles.contentTextarea}
                                        rows={16}
                                        required
                                    />
                                    <span className={styles.hint}>
                                        Paste AI-generated HTML directly. Content will be rendered as-is.
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* SEO Card */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h2>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="m21 21-4.35-4.35" />
                                    </svg>
                                    SEO Settings
                                </h2>
                                <span className={styles.seoBadge}>Important for Traffic</span>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="metaTitle">
                                        Meta Title
                                        <span className={styles.charCount}>{metaTitle.length}/60</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="metaTitle"
                                        value={metaTitle}
                                        onChange={(e) => setMetaTitle(e.target.value)}
                                        placeholder="SEO-optimized title for search engines"
                                        className={styles.input}
                                        maxLength={60}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="metaDescription">
                                        Meta Description
                                        <span className={styles.charCount}>{metaDescription.length}/160</span>
                                    </label>
                                    <textarea
                                        id="metaDescription"
                                        value={metaDescription}
                                        onChange={(e) => setMetaDescription(e.target.value)}
                                        placeholder="Brief description for search engine results (shown in Google)..."
                                        className={styles.textarea}
                                        rows={3}
                                        maxLength={160}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="metaKeywords">Meta Keywords / Tags</label>
                                    <input
                                        type="text"
                                        id="metaKeywords"
                                        value={metaKeywords}
                                        onChange={(e) => setMetaKeywords(e.target.value)}
                                        placeholder="ai art, midjourney tutorial, prompt engineering, ai tips"
                                        className={styles.input}
                                    />
                                    <span className={styles.hint}>Comma-separated keywords for SEO</span>
                                </div>
                            </div>
                        </div>

                        {/* Tags Card */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h2>#Tags</h2>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.selectedTags}>
                                    {selectedTags.map(tagId => {
                                        const tag = tags.find(t => t.id === tagId);
                                        return tag ? (
                                            <span key={tagId} className={styles.tag}>
                                                #{tag.name}
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedTags(selectedTags.filter(t => t !== tagId))}
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ) : null;
                                    })}
                                </div>
                                <div className={styles.tagInputRow}>
                                    <input
                                        type="text"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        placeholder="Add a tag..."
                                        className={styles.input}
                                        onKeyPress={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAddTag();
                                            }
                                        }}
                                    />
                                    <button type="button" onClick={handleAddTag} className={styles.addTagBtn}>
                                        Add
                                    </button>
                                </div>
                                {tags.length > 0 && (
                                    <div className={styles.suggestedTags}>
                                        {tags.filter(t => !selectedTags.includes(t.id)).slice(0, 10).map(tag => (
                                            <button
                                                key={tag.id}
                                                type="button"
                                                className={styles.suggestedTag}
                                                onClick={() => setSelectedTags([...selectedTags, tag.id])}
                                            >
                                                + {tag.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className={styles.sideCol}>
                        {/* Publish Card */}
                        <div className={styles.card + " " + styles.stickyCard}>
                            <div className={styles.cardHeader}>
                                <h2>Publish</h2>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="status">Status</label>
                                    <select
                                        id="status"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className={styles.select}
                                    >
                                        <option value="draft">📝 Draft</option>
                                        <option value="published">✅ Published</option>
                                        <option value="hidden">🔒 Hidden</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    className={styles.submitBtn}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className={styles.btnSpinner}></span>
                                            {isUploading ? "Uploading Image..." : "Creating..."}
                                        </>
                                    ) : (
                                        <>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M12 5v14M5 12h14" />
                                            </svg>
                                            Create Blog
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Category Card */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h2>Category <span className={styles.required}>*</span></h2>
                            </div>
                            <div className={styles.cardBody}>
                                <select
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className={styles.select}
                                    required
                                >
                                    <option value="">Select a category...</option>
                                    {categories.filter(c => c.slug !== 'all').map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                                <span className={styles.hint}>
                                    Same categories as prompts for cross-linking
                                </span>
                            </div>
                        </div>

                        {/* Featured Image Card */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h2>Featured Image</h2>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.imageUpload}>
                                    {imagePreview ? (
                                        <div className={styles.imagePreviewBox}>
                                            <Image
                                                src={imagePreview}
                                                alt="Preview"
                                                fill
                                                style={{ objectFit: "cover" }}
                                            />
                                            <button
                                                type="button"
                                                className={styles.removeImageBtn}
                                                onClick={() => {
                                                    setImageFile(null);
                                                    setImagePreview(null);
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <label className={styles.uploadArea}>
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                                <circle cx="8.5" cy="8.5" r="1.5" />
                                                <path d="m21 15-5-5L5 21" />
                                            </svg>
                                            <span>Click to upload image</span>
                                            <span className={styles.uploadHint}>PNG, JPG, WebP • Max 5MB</span>
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg,image/webp,image/gif"
                                                onChange={handleImageChange}
                                            />
                                        </label>
                                    )}
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="imageAlt">
                                        Alt Text (SEO)
                                        <span className={styles.charCount}>{imageAlt.length}/125</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="imageAlt"
                                        value={imageAlt}
                                        onChange={(e) => setImageAlt(e.target.value)}
                                        placeholder="Describe the image for search engines..."
                                        className={styles.input}
                                        maxLength={125}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
