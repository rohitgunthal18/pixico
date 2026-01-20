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

    // Basic check for existence
    const { data } = await supabase
        .from("prompts")
        .select("id")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

    if (!data) {
        notFound();
    }

    // Fetch full details for JSON-LD
    const { data: prompt } = await supabase
        .from("prompts")
        .select(`
            title, description, image_url, created_at, updated_at, like_count, view_count,
            ai_model:ai_models(name), 
            category:categories(name, slug)
        `)
        .eq("id", data.id)
        .single();

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
            <JsonLd data={breadcrumbSchema} />
            <JsonLd data={jsonLd} />
            <PromptClient />
        </>
    );
}
