import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BlogClient from "./BlogClient";
import JsonLd from "@/components/JsonLd";
import { generateBreadcrumbSchema } from "@/lib/seo/breadcrumb-schema";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: blog } = await supabase
        .from("blogs")
        .select("title, excerpt, meta_title, meta_description, featured_image")
        .eq("slug", slug)
        .single();

    if (!blog) return {};

    const title = blog.meta_title || `${blog.title} | Pixico Blog`;
    const description =
        blog.meta_description ||
        blog.excerpt ||
        `Read about ${blog.title} on Pixico. Discover the latest in AI prompt engineering and image generation.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: blog.featured_image ? [blog.featured_image] : [],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: blog.featured_image ? [blog.featured_image] : [],
        },
    };
}

export default async function Page({ params }: Props) {
    const { slug } = await params;
    const supabase = await createClient();

    // Basic check for existence
    const { data } = await supabase
        .from("blogs")
        .select("id")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

    if (!data) {
        notFound();
    }

    // Fetch details for JSON-LD
    const { data: blog } = await supabase
        .from("blogs")
        .select("title, excerpt, featured_image, created_at, updated_at, category:categories(name, slug)")
        .eq("id", data.id)
        .single();

    // Breadcrumb schema
    const breadcrumbSchema = generateBreadcrumbSchema([
        { name: "Home", url: "https://pixico.io" },
        { name: "Blog", url: "https://pixico.io/blog" },
        { name: blog?.title || "Article", url: "" }
    ]);

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": blog?.title,
        "description": blog?.excerpt,
        "image": blog?.featured_image,
        "datePublished": blog?.created_at,
        "dateModified": blog?.updated_at,
        "author": {
            "@type": "Organization",
            "name": "Pixico"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Pixico",
            "logo": {
                "@type": "ImageObject",
                "url": "https://pixico.io/icon.svg"
            }
        }
    };

    return (
        <>
            <JsonLd data={breadcrumbSchema} />
            <JsonLd data={jsonLd} />
            <BlogClient />
        </>
    );
}
