import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PromptGrid from "@/components/PromptGrid";
import styles from "./page.module.css";
import { createClient } from "@/lib/supabase/server";

export default async function AllPromptsPage() {
    const supabase = await createClient();

    // Pre-fetch all data in parallel
    const [headerCatsRes, footerCatsRes, initialPromptsRes] = await Promise.all([
        supabase
            .from("categories")
            .select("id, name, slug")
            .eq("show_in_header", true)
            .order("sort_order"),
        supabase
            .from("categories")
            .select("id, name, slug")
            .order("sort_order"),
        supabase
            .from("prompts")
            .select(`
                id, title, slug, image_url, like_count, view_count, created_at,
                category:categories!category_id(name),
                ai_model:ai_models!model_id(name)
            `)
            .eq("status", "published")
            .order("created_at", { ascending: false })
            .limit(24)
    ]);

    const headerCategories = (headerCatsRes.data || []) as any[];
    const footerCategories = (footerCatsRes.data || []) as any[];
    const initialPrompts = initialPromptsRes.data || [];

    return (
        <>
            <Header initialCategories={headerCategories} />
            <main className={styles.main}>
                <div className="container">
                    <PromptGrid
                        title="All"
                        isPageTitle={true}
                        showFilters={true}
                        showCategoryFilter={false}
                        showViewAll={false}
                        sectionType="all"
                        initialPrompts={initialPrompts || []}
                    />
                </div>
            </main>
            <Footer initialCategories={footerCategories} />
        </>
    );
}
