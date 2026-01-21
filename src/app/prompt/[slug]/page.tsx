import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PromptClient from "./PromptClient";
import JsonLd from "@/components/JsonLd";
import { generateBreadcrumbSchema } from "@/lib/seo/breadcrumb-schema";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: prompt } = await supabase
        .from("prompts")
        .select("title, description, meta_title, meta_description, image_url, ai_model:ai_models(name)")
        .eq("slug", slug)
        .single();

    if (!prompt) return {};

    const title = prompt?.meta_title || `${prompt?.title} | ${(prompt?.ai_model as any)?.name || "AI"} Prompt`;
    const description =
        prompt?.meta_description ||
        prompt?.description?.replace(/<[^>]*>/g, "").substring(0, 160) ||
        `Copy paste this ${(prompt?.ai_model as any)?.name || "trending"} AI prompt for image generation on Pixico.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: prompt?.image_url ? [prompt.image_url] : [],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: prompt?.image_url ? [prompt.image_url] : [],
        },
    };
}

export default async function Page({ params }: Props) {
    const { slug } = await params;
    const supabase = await createClient();

    // Fetch prompt first to get category_id
    const { data: prompt, error: promptError } = await supabase
        .from("prompts")
        .select(`
            id, slug, prompt_code, title, prompt_text, description, 
            image_url, image_alt, like_count, view_count, save_count,
            aspect_ratio, style, meta_title, meta_description, created_at, updated_at,
            category_id,
            category:categories!category_id(id, name, slug),
            ai_model:ai_models!model_id(id, name),
            prompt_tags(tag:tags(id, name))
        `)
        .eq("slug", slug)
        .eq("status", "published")
        .single();

    if (!prompt) {
        notFound();
    }

    // Now fetch all remaining data in parallel (including category-specific related prompts)
    const [relatedRes, headerCatsRes, footerCatsRes] = await Promise.all([
        // Fetch related prompts by category if available, otherwise random
        prompt.category_id
            ? supabase
                .from("prompts")
                .select("id, slug, title, image_url")
                .eq("category_id", prompt.category_id)
                .eq("status", "published")
                .neq("id", prompt.id)
                .limit(4)
            : supabase
                .from("prompts")
                .select("id, slug, title, image_url")
                .eq("status", "published")
                .neq("slug", slug)
                .limit(4),
        supabase
            .from("categories")
            .select("id, name, slug")
            .eq("show_in_header", true)
            .order("sort_order"),
        supabase
            .from("categories")
            .select("id, name, slug")
            .order("sort_order")
    ]);

    const headerCategories = (headerCatsRes.data || []) as any[];
    const footerCategories = (footerCatsRes.data || []) as any[];
    const relatedPrompts = relatedRes.data || [];

    // Calculate rating from engagement metrics
    const ratingValue = prompt?.like_count && prompt?.view_count
        ? Math.min(5, Math.max(1, (prompt.like_count / Math.max(prompt.view_count, 1)) * 100))
        : 4.5;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pixico-w3us.vercel.app';
    const breadcrumbSchema = generateBreadcrumbSchema([
        { name: "Home", url: baseUrl },
        { name: (prompt?.category as any)?.name || "Prompts", url: `${baseUrl}/category/${(prompt?.category as any)?.slug || 'all'}` },
        { name: prompt?.title || "Prompt", url: "" }
    ]);

    // Main prompt schema with rating
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        "name": prompt?.title,
        "description": prompt?.description?.replace(/<[^>]*>/g, ""),
        "image": prompt?.image_url,
        "datePublished": prompt?.created_at,
        "dateModified": prompt?.updated_at,
        "genre": (prompt?.category as any)?.name,
        "creator": {
            "@type": "Organization",
            "name": "Pixico"
        },
        "keywords": `AI Prompt, ${(prompt?.ai_model as any)?.name}, ${(prompt?.category as any)?.name}`,
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": ratingValue.toFixed(1),
            "reviewCount": prompt?.like_count || 0,
            "bestRating": "5",
            "worstRating": "1"
        }
    };

    return (
        <>
            <JsonLd key="breadcrumb-schema" data={breadcrumbSchema} />
            <JsonLd key="prompt-schema" data={jsonLd} />
            <PromptClient
                initialPrompt={prompt as any}
                initialRelatedPrompts={relatedPrompts || []}
                headerCategories={headerCategories}
                footerCategories={footerCategories}
            />
        </>
    );
}
