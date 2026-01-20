"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "./PromptGrid.module.css";

const sortOptions = [
    { value: "trending", label: "Trending" },
    { value: "newest", label: "Newest" },
    { value: "popular", label: "Most Popular" },
];

// Mock data with likes and views
const mockPrompts = [
    {
        id: "1",
        title: "Ethereal cyberpunk woman with neon lights",
        category: "Portraits",
        model: "Midjourney",
        image: "https://picsum.photos/seed/p1/400/600",
        slug: "ethereal-cyberpunk-woman",
        likes: 2834,
        views: 15420,
    },
    {
        id: "2",
        title: "Magical forest with bioluminescent plants",
        category: "Landscapes",
        model: "FLUX",
        image: "https://picsum.photos/seed/p2/400/500",
        slug: "magical-forest-bioluminescent",
        likes: 1956,
        views: 12300,
    },
    {
        id: "3",
        title: "Anime warrior princess with silver hair",
        category: "Anime",
        model: "Stable Diffusion",
        image: "https://picsum.photos/seed/p3/400/550",
        slug: "anime-warrior-princess",
        likes: 3210,
        views: 18900,
    },
    {
        id: "4",
        title: "Futuristic city skyline at sunset",
        category: "Concept Art",
        model: "Midjourney",
        image: "https://picsum.photos/seed/p4/400/400",
        slug: "futuristic-city-skyline",
        likes: 1547,
        views: 9800,
    },
    {
        id: "5",
        title: "Luxury perfume product photography",
        category: "Photography",
        model: "DALL-E",
        image: "https://picsum.photos/seed/p5/400/500",
        slug: "luxury-perfume-product",
        likes: 892,
        views: 6540,
    },
    {
        id: "6",
        title: "Abstract geometric 3D iridescent shapes",
        category: "3D Renders",
        model: "Leonardo AI",
        image: "https://picsum.photos/seed/p6/400/450",
        slug: "abstract-geometric-3d",
        likes: 1123,
        views: 7890,
    },
    {
        id: "7",
        title: "Vintage fashion in art deco setting",
        category: "Photography",
        model: "Midjourney",
        image: "https://picsum.photos/seed/p7/400/600",
        slug: "vintage-fashion-art-deco",
        likes: 2456,
        views: 14200,
    },
    {
        id: "8",
        title: "Surreal underwater palace with mermaids",
        category: "Concept Art",
        model: "FLUX",
        image: "https://picsum.photos/seed/p8/400/520",
        slug: "underwater-palace-mermaids",
        likes: 1789,
        views: 11500,
    },
    {
        id: "9",
        title: "Minimalist tech startup logo design",
        category: "Concept Art",
        model: "DALL-E",
        image: "https://picsum.photos/seed/p9/400/400",
        slug: "minimalist-tech-logo",
        likes: 654,
        views: 4320,
    },
    {
        id: "10",
        title: "Japanese zen garden in autumn",
        category: "Landscapes",
        model: "Stable Diffusion",
        image: "https://picsum.photos/seed/p10/400/500",
        slug: "japanese-zen-garden",
        likes: 2103,
        views: 13400,
    },
    {
        id: "11",
        title: "Steampunk mechanical owl with gears",
        category: "Concept Art",
        model: "Midjourney",
        image: "https://picsum.photos/seed/p11/400/480",
        slug: "steampunk-mechanical-owl",
        likes: 1876,
        views: 10200,
    },
    {
        id: "12",
        title: "Elegant marble interior with gold",
        category: "3D Renders",
        model: "Leonardo AI",
        image: "https://picsum.photos/seed/p12/400/550",
        slug: "elegant-interior-marble",
        likes: 1432,
        views: 8760,
    },
];

// Format numbers (1500 -> 1.5K)
function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
}

interface PromptGridProps {
    title?: string;
    isPageTitle?: boolean;
    showFilters?: boolean;
    showCategoryFilter?: boolean;
    showViewAll?: boolean;
    viewAllHref?: string;
    limit?: number;
    sectionType?: "featured" | "trending" | "category" | "all";
    categoryId?: string;
    id?: string;
    initialPrompts?: any[];
}

export default function PromptGrid({
    title = "Featured Prompts",
    isPageTitle = false,
    showFilters = true,
    showCategoryFilter = true,
    showViewAll = true,
    viewAllHref = "/prompts",
    limit,
    sectionType,
    categoryId,
    id,
    initialPrompts,
}: PromptGridProps) {
    const [activeCategory, setActiveCategory] = useState("All");
    const [activeModel, setActiveModel] = useState("All Models");
    const [sortBy, setSortBy] = useState("trending");

    // Format initial prompts if provided
    const formattedInitialPrompts = initialPrompts ? (initialPrompts as any[]).map(p => {
        const cat = p.category as unknown as { name: string } | null;
        const model = p.ai_model as unknown as { name: string } | null;
        return {
            id: p.id,
            title: p.title,
            category: cat?.name || "Uncategorized",
            model: model?.name || "AI Model",
            image: p.image_url || "https://picsum.photos/seed/default/400/500",
            slug: p.slug,
            likes: p.like_count || 0,
            views: p.view_count || 0,
        };
    }) : [];

    const [dbPrompts, setDbPrompts] = useState<any[]>(formattedInitialPrompts);
    const [isLoading, setIsLoading] = useState(!initialPrompts);
    const [categories, setCategories] = useState<string[]>(["All"]);
    const [models, setModels] = useState<string[]>(["All Models"]);

    // Fetch categories and models from database
    useEffect(() => {
        const fetchFilters = async () => {
            const supabase = createClient();

            // Fetch categories - filter based on section type
            let categoryQuery = supabase
                .from("categories")
                .select("name")
                .eq("is_active", true);

            // Apply section-specific filter
            if (sectionType === "featured") {
                categoryQuery = categoryQuery.eq("show_in_featured", true);
            } else if (sectionType === "trending") {
                categoryQuery = categoryQuery.eq("show_in_trending", true);
            }

            const { data: catData } = await categoryQuery.order("sort_order");

            if (catData && catData.length > 0) {
                const catNames = ["All", ...catData.map(c => c.name).filter(n => n !== "All")];
                setCategories(catNames);
            }

            // Fetch AI models
            const { data: modelData } = await supabase
                .from("ai_models")
                .select("name")
                .eq("is_active", true)
                .order("name");

            if (modelData && modelData.length > 0) {
                const modelNames = ["All Models", ...modelData.map(m => m.name)];
                setModels(modelNames);
            }
        };
        fetchFilters();

        // Initialize sorting based on section type
        if (sectionType === "featured") {
            setSortBy("popular");
        } else if (sectionType === "trending") {
            setSortBy("trending");
        }
    }, [sectionType]);

    // Fetch prompts from database
    useEffect(() => {
        const fetchPrompts = async () => {
            setIsLoading(true);
            const supabase = createClient();

            let selectStr = `
                id, title, slug, image_url, like_count, view_count, created_at,
                category:categories!category_id(name),
                ai_model:ai_models!model_id(name)
            `;

            // If we are filtering by name, we need !inner for those tables in Supabase
            if (activeCategory !== "All" && !categoryId) {
                selectStr = selectStr.replace("category:categories!category_id(name)", "category:categories!category_id!inner(name)");
            }
            if (activeModel !== "All Models") {
                selectStr = selectStr.replace("ai_model:ai_models!model_id(name)", "ai_model:ai_models!model_id!inner(name)");
            }

            let query = supabase
                .from("prompts")
                .select(selectStr)
                .eq("status", "published");

            // Apply category filter (from prop or tab)
            if (categoryId) {
                query = query.eq("category_id", categoryId);
            } else if (activeCategory !== "All") {
                query = query.eq("categories.name", activeCategory);
            }

            // Apply AI Model filter
            if (activeModel !== "All Models") {
                query = query.eq("ai_models.name", activeModel);
            }

            // Apply sorting
            if (sortBy === "newest") {
                query = query.order("created_at", { ascending: false });
            } else if (sortBy === "popular") {
                query = query.order("like_count", { ascending: false });
            } else {
                // "trending"
                query = query.order("view_count", { ascending: false });
            }

            // Apply limit
            if (limit) {
                query = query.limit(limit);
            } else {
                query = query.limit(50);
            }

            const { data, error } = await query;

            if (!error && data) {
                const formattedPrompts = (data as any[]).map(p => {
                    const cat = p.category as unknown as { name: string } | null;
                    const model = p.ai_model as unknown as { name: string } | null;
                    return {
                        id: p.id,
                        title: p.title,
                        category: cat?.name || "Uncategorized",
                        model: model?.name || "AI Model",
                        image: p.image_url || "https://picsum.photos/seed/default/400/500",
                        slug: p.slug,
                        likes: p.like_count || 0,
                        views: p.view_count || 0,
                    };
                });
                setDbPrompts(formattedPrompts);
            }
            setIsLoading(false);
        };
        fetchPrompts();
    }, [sectionType, categoryId, activeCategory, activeModel, sortBy, limit]);

    // If we have database results, they are already filtered by the query
    // Otherwise, we apply in-memory filtering to the mock data Fallback
    const prompts = dbPrompts.length > 0
        ? dbPrompts
        : mockPrompts.filter(prompt => {
            const categoryMatch = activeCategory === "All" || prompt.category === activeCategory;
            const modelMatch = activeModel === "All Models" || prompt.model === activeModel;
            // Sorting is handled by state or query, but for mock data we can just return filtered list
            return categoryMatch && modelMatch;
        });

    return (
        <section id={id} className={styles.section}>
            <div className="container">
                {/* Header */}
                <div className={styles.header}>
                    {isPageTitle ? (
                        <h1 className={styles.pageTitle}>{title}</h1>
                    ) : (
                        <h2 className={styles.title}>{title}</h2>
                    )}

                    <div className={styles.headerActions}>
                        {/* Show dropdowns in header if category filter is hidden */}
                        {showFilters && !showCategoryFilter && (
                            <div className={styles.filterActions}>
                                <div className={styles.selectWrapper}>
                                    <select
                                        className={styles.select}
                                        value={activeModel}
                                        onChange={(e) => setActiveModel(e.target.value)}
                                        suppressHydrationWarning
                                    >
                                        {models.map(model => (
                                            <option key={model} value={model}>{model}</option>
                                        ))}
                                    </select>
                                    <svg className={styles.selectIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M6 9l6 6 6-6" />
                                    </svg>
                                </div>

                                <div className={styles.selectWrapper}>
                                    <select
                                        className={styles.select}
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        suppressHydrationWarning
                                    >
                                        <option value="trending">Trending</option>
                                        <option value="newest">Newest</option>
                                        <option value="popular">Most Popular</option>
                                    </select>
                                    <svg className={styles.selectIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M6 9l6 6 6-6" />
                                    </svg>
                                </div>
                            </div>
                        )}

                        {showViewAll && (
                            <Link href={viewAllHref} className={styles.viewAll}>
                                View All
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Filters - Only show this section if category filter is enabled */}
                {showFilters && showCategoryFilter && (
                    <div className={styles.filters}>
                        <div className={styles.filterGroup}>
                            <div className={styles.filterTabs}>
                                {categories.map((cat: string) => (
                                    <button
                                        key={cat}
                                        className={`${styles.filterTab} ${activeCategory === cat ? styles.active : ""}`}
                                        onClick={() => setActiveCategory(cat)}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Model & Sort (Visible here only when categories are visible) */}
                        <div className={styles.filterActions}>
                            <div className={styles.selectWrapper}>
                                <select
                                    className={styles.select}
                                    value={activeModel}
                                    onChange={(e) => setActiveModel(e.target.value)}
                                    suppressHydrationWarning
                                >
                                    {models.map(model => (
                                        <option key={model} value={model}>{model}</option>
                                    ))}
                                </select>
                                <svg className={styles.selectIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                            </div>

                            <div className={styles.selectWrapper}>
                                <select
                                    className={styles.select}
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    suppressHydrationWarning
                                >
                                    <option value="trending">Trending</option>
                                    <option value="newest">Newest</option>
                                    <option value="popular">Most Popular</option>
                                </select>
                                <svg className={styles.selectIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                            </div>
                        </div>
                    </div>
                )}

                {/* Grid */}
                <div className={styles.grid}>
                    {prompts.map((prompt) => (
                        <Link
                            key={prompt.id}
                            href={`/prompt/${prompt.slug}`}
                            className={styles.card}
                        >
                            <div className={styles.imageWrapper}>
                                <Image
                                    src={prompt.image}
                                    alt={prompt.title}
                                    width={400}
                                    height={500}
                                    className={styles.image}
                                    loading="lazy"
                                />
                                <div className={styles.overlay}>
                                    {/* Title */}
                                    <h3 className={styles.promptTitle}>{prompt.title}</h3>

                                    {/* Stats Row: Model | Likes | Views */}
                                    <div className={styles.statsRow}>
                                        <div className={styles.modelBadge}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 3L14.5 8.5L20 9.5L16 14L17 20L12 17L7 20L8 14L4 9.5L9.5 8.5L12 3Z" fill="currentColor" />
                                            </svg>
                                            {prompt.model}
                                        </div>
                                        <div className={styles.statsDivider} />
                                        <div className={styles.stat}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 21C12 21 4 13.5 4 8.5C4 5.46 6.46 3 9.5 3C11.06 3 12.5 3.68 13.5 4.77L12 6.27L10.5 4.77C9.5 3.68 7.94 3 6.5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                <path d="M12 21C12 21 20 13.5 20 8.5C20 5.46 17.54 3 14.5 3C12.94 3 11.5 3.68 10.5 4.77" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                            {formatNumber(prompt.likes)}
                                        </div>
                                        <div className={styles.stat}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                                <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" />
                                                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                                            </svg>
                                            {formatNumber(prompt.views)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {prompts.length === 0 && (
                    <div className={styles.empty}>
                        <p>No prompts found matching your filters.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
