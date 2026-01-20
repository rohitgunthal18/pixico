import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogClient from "./BlogClient";
import styles from "./page.module.css";

export const metadata = {
    title: "Blog | Pixico AI Prompt Library",
    description: "Read the latest tips, tutorials, and industry insights about AI prompt engineering, Midjourney, DALL-E, and more.",
};

export default async function BlogPage() {
    const supabase = await createClient();

    const [headerCatsRes, footerCatsRes, blogRes, catRes] = await Promise.all([
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
            .from("blogs")
            .select(`
                id, title, slug, excerpt, featured_image, view_count, created_at,
                category:categories!category_id(id, name, slug)
            `)
            .eq("status", "published")
            .order("created_at", { ascending: false }),
        supabase
            .from("categories")
            .select("id, name, slug")
            .order("sort_order"),
    ]);

    const headerCategories = (headerCatsRes.data || []) as any[];
    const footerCategories = (footerCatsRes.data || []) as any[];
    const blogs = (blogRes.data || []) as any[];
    const categories = (catRes.data || []).filter(c => c.slug !== 'all') as any[];

    return (
        <>
            <Header initialCategories={headerCategories} />
            <main className={styles.main}>
                <BlogClient
                    initialBlogs={blogs}
                    initialCategories={categories}
                />
            </main>
            <Footer initialCategories={footerCategories} />
        </>
    );
}
