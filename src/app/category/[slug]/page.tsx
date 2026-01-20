import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import CategoryClient from "./CategoryClient";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: category } = await supabase
        .from("categories")
        .select("name, description")
        .eq("slug", slug)
        .single();

    if (!category) return {};

    const title = `Best ${category.name} AI Prompts | Pixico Library`;
    const description =
        category.description ||
        `Explore the largest collection of ${category.name} AI prompts. Find high-quality, copy-paste prompts for image and video generation on Pixico.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
    };
}

export default async function Page({ params }: Props) {
    const { slug } = await params;
    const supabase = await createClient();

    // Fetch all data in parallel
    const [catRes, promptsRes, headerCatsRes, footerCatsRes] = await Promise.all([
        supabase
            .from("categories")
            .select("id, name, description")
            .eq("slug", slug)
            .single(),
        supabase
            .from("prompts")
            .select(`
                id, slug, title, image_url, view_count, like_count, prompt_code,
                ai_model:ai_models!model_id(name),
                category:categories!category_id!inner(slug)
            `)
            .eq("category.slug", slug)
            .eq("status", "published")
            .order("created_at", { ascending: false })
            .limit(12),
        supabase
            .from("categories")
            .select("id, name, slug")
            .eq("show_in_header", true)
            .order("sort_order"),
        supabase
            .from("categories")
            .select("id, name, slug")
            .eq("show_in_footer", true)
            .order("sort_order")
            .limit(6)
    ]);

    const category = catRes.data;
    const headerCategories = (headerCatsRes.data || []) as any[];
    const footerCategories = (footerCatsRes.data || []) as any[];
    const prompts = (promptsRes.data || []) as any[];

    return (
        <CategoryClient
            initialCategory={category || null}
            initialPrompts={prompts}
            slug={slug}
            headerCategories={headerCategories}
            footerCategories={footerCategories}
        />
    );
}
