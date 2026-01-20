"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PromptGrid from "@/components/PromptGrid";
import styles from "./page.module.css";

interface Category {
    id: string;
    name: string;
    description: string | null;
}

interface CategoryClientProps {
    initialCategory: Category | null;
    initialPrompts: any[];
    slug: string;
    headerCategories?: any[];
    footerCategories?: any[];
}

export default function CategoryClient({
    initialCategory,
    initialPrompts,
    slug,
    headerCategories,
    footerCategories
}: CategoryClientProps) {
    const [category, setCategory] = useState<Category | null>(initialCategory);
    const [isLoading, setIsLoading] = useState(!initialCategory && initialCategory !== null);

    useEffect(() => {
        const fetchCategory = async () => {
            if (category && category.id) {
                setIsLoading(false);
                return;
            }

            const supabase = createClient();
            const { data, error } = await supabase
                .from("categories")
                .select("id, name, description")
                .eq("slug", slug)
                .single();

            if (!error && data) {
                setCategory(data);
            }
            setIsLoading(false);
        };

        fetchCategory();
    }, [slug, category]);

    if (isLoading) {
        return (
            <>
                <Header initialCategories={headerCategories} />
                <main className={styles.main}>
                    <div className="container">
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                        </div>
                    </div>
                </main>
                <Footer initialCategories={footerCategories} />
            </>
        );
    }

    if (!category) {
        return (
            <>
                <Header initialCategories={headerCategories} />
                <main className={styles.main}>
                    <div className="container">
                        <div className={styles.error}>
                            <h2>Category Not Found</h2>
                            <p>The category you're looking for doesn't exist.</p>
                        </div>
                    </div>
                </main>
                <Footer initialCategories={footerCategories} />
            </>
        );
    }

    return (
        <>
            <Header initialCategories={headerCategories} />
            <main className={styles.main}>
                <div className="container">
                    <PromptGrid
                        title={category.name}
                        isPageTitle={true}
                        showFilters={true}
                        showCategoryFilter={false}
                        showViewAll={false}
                        sectionType="category"
                        categoryId={category.id}
                        initialPrompts={initialPrompts}
                    />
                </div>
            </main>
            <Footer initialCategories={footerCategories} />
        </>
    );
}
