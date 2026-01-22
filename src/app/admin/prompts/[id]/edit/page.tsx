"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
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

interface AIModel {
    id: string;
    name: string;
    version: string | null;
}

interface Tag {
    id: string;
    name: string;
}

interface PromptData {
    id: string;
    title: string;
    slug: string;
    prompt_text: string;
    description: string | null;
    image_url: string | null;
    image_alt: string | null;
    category_id: string | null;
    model_id: string | null;
    aspect_ratio: string | null;
    style: string | null;
    status: string;
    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string[] | null;
}

export default function EditPromptPage() {
    const router = useRouter();
    const params = useParams();
    const promptId = params.id as string;
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form data
    const [title, setTitle] = useState("");
    const [promptText, setPromptText] = useState("");
    const [description, setDescription] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [modelId, setModelId] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState("");
    const [aspectRatio, setAspectRatio] = useState("1:1");
    const [style, setStyle] = useState("");
    const [status, setStatus] = useState("draft");

    // SEO fields
    const [metaTitle, setMetaTitle] = useState("");
    const [metaDescription, setMetaDescription] = useState("");
    const [metaKeywords, setMetaKeywords] = useState("");

    // Image handling
    const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageAlt, setImageAlt] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    // Data lists
    const [categories, setCategories] = useState<Category[]>([]);
    const [aiModels, setAiModels] = useState<AIModel[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);

    // AI Model Management
    const [newModelName, setNewModelName] = useState("");
    const [isAddingModel, setIsAddingModel] = useState(false);
    const [isDeletingModel, setIsDeletingModel] = useState<string | null>(null);
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
    const modelDropdownRef = useRef<HTMLDivElement>(null);

    // Click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
                setIsModelDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch prompt data and dropdown options
    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient();

            // Fetch dropdown options
            const [catRes, modelRes, tagRes] = await Promise.all([
                supabase.from("categories").select("id, name, slug").order("sort_order"),
                supabase.from("ai_models").select("id, name, version").order("name"),
                supabase.from("tags").select("id, name").order("name"),
            ]);

            setCategories(catRes.data || []);
            setAiModels(modelRes.data || []);
            setTags(tagRes.data || []);

            // Fetch prompt data
            const { data: promptData, error: promptError } = await supabase
                .from("prompts")
                .select(`
                    id, title, slug, prompt_text, description, image_url, image_alt,
                    category_id, model_id, aspect_ratio, style, status,
                    meta_title, meta_description, meta_keywords
                `)
                .eq("id", promptId)
                .single();

            if (promptError || !promptData) {
                setError("Prompt not found");
                setIsLoading(false);
                return;
            }

            const prompt = promptData as PromptData;

            // Populate form fields
            setTitle(prompt.title || "");
            setPromptText(prompt.prompt_text || "");
            setDescription(prompt.description || "");
            setModelId(prompt.model_id || "");
            setAspectRatio(prompt.aspect_ratio || "1:1");
            setStyle(prompt.style || "");
            setStatus(prompt.status || "draft");
            setMetaTitle(prompt.meta_title || "");
            setMetaDescription(prompt.meta_description || "");
            setMetaKeywords(prompt.meta_keywords?.join(", ") || "");
            setImageAlt(prompt.image_alt || "");
            setExistingImageUrl(prompt.image_url);
            setImagePreview(prompt.image_url);

            // Fetch associated categories
            const { data: promptCats } = await supabase
                .from("prompt_categories")
                .select("category_id")
                .eq("prompt_id", promptId);

            if (promptCats && promptCats.length > 0) {
                setSelectedCategories(promptCats.map((pc: any) => pc.category_id));
            } else if (prompt.category_id) {
                setSelectedCategories([prompt.category_id]);
            }

            // Fetch associated tags
            const { data: promptTags } = await supabase
                .from("prompt_tags")
                .select("tag_id")
                .eq("prompt_id", promptId);

            if (promptTags) {
                setSelectedTags(promptTags.map((pt: any) => pt.tag_id));
            }

            setIsLoading(false);
        };

        if (promptId) {
            fetchData();
        }
    }, [promptId]);

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

    const toggleCategory = (catId: string) => {
        if (selectedCategories.includes(catId)) {
            setSelectedCategories(selectedCategories.filter(id => id !== catId));
        } else {
            setSelectedCategories([...selectedCategories, catId]);
        }
    };

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

    const handleAddModel = async () => {
        if (!newModelName.trim()) return;

        setIsAddingModel(true);
        const supabase = createClient();

        try {
            const { data, error } = await supabase
                .from("ai_models")
                .insert({ name: newModelName.trim() })
                .select("id, name, version")
                .single();

            if (error) throw error;

            if (data) {
                setAiModels([...aiModels, data]);
                setModelId(data.id);
                setNewModelName("");
                setSuccess(`AI Model "${data.name}" added successfully`);
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to add model");
        } finally {
            setIsAddingModel(false);
        }
    };

    const handleDeleteModel = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete the AI model "${name}"? This might break prompts using this model.`)) {
            return;
        }

        setIsDeletingModel(id);
        const supabase = createClient();

        try {
            const { error } = await supabase
                .from("ai_models")
                .delete()
                .eq("id", id);

            if (error) throw error;

            setAiModels(aiModels.filter(m => m.id !== id));
            if (modelId === id) setModelId("");
            setSuccess(`AI Model "${name}" deleted successfully`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete model");
        } finally {
            setIsDeletingModel(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !promptText.trim()) {
            setError("Title and prompt text are required");
            return;
        }

        if (selectedCategories.length === 0) {
            setError("Please select at least one category");
            return;
        }

        if (!modelId) {
            setError("Please select an AI model");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        const supabase = createClient();

        try {
            let imageUrl = existingImageUrl;

            // Upload new image if provided
            if (imageFile) {
                setIsUploading(true);
                const fileExt = imageFile.name.split(".").pop();
                const fileName = `${Date.now()}-${generateSlug(title)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from("prompt-images")
                    .upload(fileName, imageFile, {
                        cacheControl: "3600",
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from("prompt-images")
                    .getPublicUrl(fileName);

                imageUrl = urlData.publicUrl;
                setIsUploading(false);
            }

            // Update prompt
            const { data: updateData, error: updateError } = await supabase
                .from("prompts")
                .update({
                    title,
                    prompt_text: promptText,
                    description: description || null,
                    image_url: imageUrl,
                    image_alt: imageAlt || null,
                    category_id: selectedCategories[0] || null,
                    model_id: modelId || null,
                    aspect_ratio: aspectRatio || null,
                    style: style || null,
                    status,
                    meta_title: metaTitle || null,
                    meta_description: metaDescription || null,
                    meta_keywords: metaKeywords ? metaKeywords.split(",").map(k => k.trim()) : null,
                    updated_at: new Date().toISOString(),
                    published_at: status === "published" ? new Date().toISOString() : null,
                })
                .eq("id", promptId)
                .select();

            if (updateError) throw updateError;

            // Check if update actually affected any rows
            if (!updateData || updateData.length === 0) {
                throw new Error("Update failed - no rows were modified. You may not have permission.");
            }

            // Update categories
            await supabase.from("prompt_categories").delete().eq("prompt_id", promptId);
            if (selectedCategories.length > 0) {
                const categoryInserts = selectedCategories.map(catId => ({
                    prompt_id: promptId,
                    category_id: catId,
                }));
                await supabase.from("prompt_categories").insert(categoryInserts);
            }

            // Update tags
            await supabase.from("prompt_tags").delete().eq("prompt_id", promptId);
            if (selectedTags.length > 0) {
                const tagInserts = selectedTags.map(tagId => ({
                    prompt_id: promptId,
                    tag_id: tagId,
                }));
                await supabase.from("prompt_tags").insert(tagInserts);
            }

            setSuccess("Prompt updated successfully!");
            setTimeout(() => {
                router.push("/admin/prompts");
            }, 1500);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to update prompt");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.loadingPage}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading prompt data...</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <Link href="/admin/prompts" className={styles.backBtn}>
                        ← Back
                    </Link>
                    <div className={styles.headerTitle}>
                        <h1>Edit Prompt</h1>
                        <p>Update prompt details, categories, and SEO settings</p>
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
                                        Prompt Title <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g., Cyberpunk futuristic cityscape at sunset"
                                        className={styles.input}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="prompt">
                                        Prompt Text <span className={styles.required}>*</span>
                                    </label>
                                    <textarea
                                        id="prompt"
                                        value={promptText}
                                        onChange={(e) => setPromptText(e.target.value)}
                                        placeholder="Enter the full AI prompt text here..."
                                        className={styles.textarea}
                                        rows={6}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="description">
                                        Description <span className={styles.htmlBadge}>HTML Supported</span>
                                    </label>
                                    <textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Write a structured HTML description... (e.g., <h2>About</h2>, <ul><li>Bold Tips</li></ul>, <table>...</table>)"
                                        className={styles.textarea}
                                        rows={8}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Categories Card */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h2>Categories <span className={styles.required}>*</span></h2>
                                <span className={styles.selectedCount}>
                                    {selectedCategories.length} selected
                                </span>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.categoryGrid}>
                                    {categories.filter(cat => cat.slug !== 'all').map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            className={`${styles.categoryBtn} ${selectedCategories.includes(cat.id) ? styles.selected : ""}`}
                                            onClick={() => toggleCategory(cat.id)}
                                        >
                                            {selectedCategories.includes(cat.id) && (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                                {categories.length === 0 && (
                                    <p className={styles.emptyNote}>No categories found.</p>
                                )}
                            </div>
                        </div>

                        {/* SEO Card */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h2>SEO Settings</h2>
                                <span className={styles.optional}>Optional</span>
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
                                        placeholder="Brief description for search engine results..."
                                        className={styles.textarea}
                                        rows={2}
                                        maxLength={160}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="metaKeywords">Meta Keywords</label>
                                    <input
                                        type="text"
                                        id="metaKeywords"
                                        value={metaKeywords}
                                        onChange={(e) => setMetaKeywords(e.target.value)}
                                        placeholder="ai art, midjourney, cyberpunk, digital art"
                                        className={styles.input}
                                    />
                                    <span className={styles.hint}>Comma-separated keywords</span>
                                </div>
                            </div>
                        </div>

                        {/* Tags Card */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h2>Tags</h2>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.selectedTags}>
                                    {selectedTags.map(tagId => {
                                        const tag = tags.find(t => t.id === tagId);
                                        return tag ? (
                                            <span key={tagId} className={styles.tag}>
                                                {tag.name}
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
                                        {tags.filter(t => !selectedTags.includes(t.id)).slice(0, 8).map(tag => (
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
                        {/* Featured Image Card */}
                        <div className={`${styles.card} ${styles.stickyCard}`}>
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
                                                    setExistingImageUrl(null);
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <label className={styles.uploadArea}>
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                                <circle cx="8.5" cy="8.5" r="1.5" />
                                                <path d="m21 15-5-5L5 21" />
                                            </svg>
                                            <span>Click to upload</span>
                                            <span className={styles.uploadHint}>PNG, JPG, WebP up to 5MB</span>
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg,image/webp,image/gif"
                                                onChange={handleImageChange}
                                            />
                                        </label>
                                    )}
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="imageAlt">Image Alt Text</label>
                                    <input
                                        type="text"
                                        id="imageAlt"
                                        value={imageAlt}
                                        onChange={(e) => setImageAlt(e.target.value)}
                                        placeholder="Describe the image for SEO"
                                        className={styles.input}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* AI Model Card */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h2>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--gradient-purple)" }}>
                                        <path d="M12 2l1.5 8.5L22 12l-8.5 1.5L12 22l-1.5-8.5L2 12l8.5-1.5L12 2z" />
                                    </svg>
                                    AI Model <span className={styles.required}>*</span>
                                </h2>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.modelSelector} ref={modelDropdownRef}>
                                    <div
                                        className={`${styles.modelSelected} ${isModelDropdownOpen ? styles.open : ""}`}
                                        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                                    >
                                        <div className={styles.selectedInfo}>
                                            <div className={styles.radioCircle}></div>
                                            <span>
                                                {aiModels.find(m => m.id === modelId)?.name || "Select AI Model..."}
                                            </span>
                                        </div>
                                        <div className={styles.chevron}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M6 9l6 6 6-6" />
                                            </svg>
                                        </div>
                                    </div>

                                    {isModelDropdownOpen && (
                                        <div className={styles.modelDropdown}>
                                            <div className={styles.modelList}>
                                                {aiModels.map(model => (
                                                    <div
                                                        key={model.id}
                                                        className={`${styles.modelItem} ${modelId === model.id ? styles.active : ""}`}
                                                        onClick={() => {
                                                            setModelId(model.id);
                                                            setIsModelDropdownOpen(false);
                                                        }}
                                                    >
                                                        <div className={styles.modelInfo}>
                                                            <div className={styles.radioCircle}></div>
                                                            <span>{model.name}</span>
                                                        </div>
                                                        <div className={styles.modelActions}>
                                                            <button
                                                                type="button"
                                                                className={`${styles.iconBtn} ${styles.deleteBtn}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteModel(model.id, model.name);
                                                                }}
                                                                disabled={!!isDeletingModel}
                                                                title="Delete model"
                                                            >
                                                                {isDeletingModel === model.id ? (
                                                                    <span className={styles.btnSpinner} style={{ width: "14px", height: "14px" }}></span>
                                                                ) : (
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                                                                    </svg>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {aiModels.length === 0 && (
                                                    <p className={styles.emptyNote}>No AI models found.</p>
                                                )}
                                            </div>

                                            <div className={styles.addModelSection}>
                                                <div className={styles.inputActionRow}>
                                                    <input
                                                        type="text"
                                                        value={newModelName}
                                                        onChange={(e) => setNewModelName(e.target.value)}
                                                        placeholder="Add new model..."
                                                        className={styles.input}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onKeyPress={(e) => {
                                                            if (e.key === "Enter") {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleAddModel();
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAddModel();
                                                        }}
                                                        className={styles.smallBtn}
                                                        disabled={isAddingModel || !newModelName.trim()}
                                                    >
                                                        {isAddingModel ? <span className={styles.btnSpinner} style={{ width: "14px", height: "14px" }}></span> : "Add"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Settings Card */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h2>Settings</h2>
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
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                        <option value="hidden">Hidden</option>
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="aspectRatio">Aspect Ratio</label>
                                    <select
                                        id="aspectRatio"
                                        value={aspectRatio}
                                        onChange={(e) => setAspectRatio(e.target.value)}
                                        className={styles.select}
                                    >
                                        <option value="1:1">1:1 (Square)</option>
                                        <option value="16:9">16:9 (Landscape)</option>
                                        <option value="9:16">9:16 (Portrait)</option>
                                        <option value="4:3">4:3</option>
                                        <option value="3:4">3:4</option>
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="style">Style</label>
                                    <input
                                        type="text"
                                        id="style"
                                        value={style}
                                        onChange={(e) => setStyle(e.target.value)}
                                        placeholder="Hyperrealistic, Anime, etc."
                                        className={styles.input}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className={styles.btnSpinner}></span>
                                    {isUploading ? "Uploading Image..." : "Saving..."}
                                </>
                            ) : (
                                <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                        <polyline points="17 21 17 13 7 13 7 21" />
                                        <polyline points="7 3 7 8 15 8" />
                                    </svg>
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
