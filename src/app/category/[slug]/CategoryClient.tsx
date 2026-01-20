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

export default function CategoryClient() {
    const params = useParams();
    const slug = params.slug as string;
    const [category, setCategory] = useState<Category | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCategory = async () => {
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

        if (slug) {
            fetchCategory();
        }
    }, [slug]);

    if (isLoading) {
        return (
            <>
                <Header />
                <main className={styles.main}>
                    <div className="container">
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                        </div>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    if (!category) {
        return (
            <>
                <Header />
                <main className={styles.main}>
                    <div className="container">
                        <div className={styles.error}>
                            <h2>Category Not Found</h2>
                            <p>The category you're looking for doesn't exist.</p>
                        </div>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
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
                    />
                </div>
            </main>
            <Footer />
        </>
    );
}
