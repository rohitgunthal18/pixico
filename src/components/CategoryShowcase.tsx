"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "./CategoryShowcase.module.css";

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    prompt_count?: number;
}

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

function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
}

interface CategoryShowcaseProps {
    initialCategories?: Category[];
}

export default function CategoryShowcase({ initialCategories }: CategoryShowcaseProps) {
    const [categories, setCategories] = useState<Category[]>(initialCategories || []);
    const [isLoading, setIsLoading] = useState(!initialCategories);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);

    useEffect(() => {
        if (!initialCategories) {
            fetchCategories();
        }
    }, [initialCategories]);

    const fetchCategories = async () => {
        const supabase = createClient();
        try {
            const { data, error } = await supabase
                .from("categories")
                .select("id, name, slug, description, image_url")
                .eq("show_in_showcase", true)
                .order("sort_order")
                .limit(6);

            if (error) throw error;

            // Optimized: Get all counts in one go if possible, or keep as is if small
            // For now, let's keep the logic but wrap it in a single try/catch
            const categoriesWithCounts = await Promise.all(
                (data || []).map(async (cat) => {
                    const { count } = await supabase
                        .from("prompts")
                        .select("*", { count: "exact", head: true })
                        .eq("category_id", cat.id)
                        .eq("status", "published");
                    return { ...cat, prompt_count: count || 0 };
                })
            );

            setCategories(categoriesWithCounts);
        } catch (err) {
            console.error("Error fetching showcase categories:", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !categories.length) return <div style={{ minHeight: "400px" }} />;
    if (categories.length === 0) return null;

    return (
        <section className={styles.section}>
            <div className="container">
                <div className={styles.header}>
                    <h2 className={styles.title}>Browse by Category</h2>
                    <p className={styles.subtitle}>
                        Explore prompts organized by style, medium, and use case
                    </p>
                </div>

                <div className={styles.grid}>
                    {categories.map((category) => (
                        <Link
                            key={category.slug}
                            href={category.slug === "all" ? "/prompts" : `/category/${category.slug}`}
                            className={styles.card}
                        >
                            <div className={styles.imageWrapper}>
                                <div className={styles.imageContainer}>
                                    <Image
                                        src={category.image_url || `https://picsum.photos/seed/${category.slug}/500/300`}
                                        alt={category.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className={styles.image}
                                        loading="lazy"
                                    />
                                    <div className={styles.gradient} />
                                </div>
                            </div>
                            <div className={styles.content}>
                                <h3 className={styles.categoryName}>{category.name}</h3>
                                <div className={styles.meta}>
                                    <span className={styles.count}>
                                        {(category.prompt_count || 0).toLocaleString()} prompts
                                    </span>
                                    <div className={styles.arrow}>
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <path
                                                d="M7 16L13 10L7 4"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

            </div>
        </section>
    );
}
