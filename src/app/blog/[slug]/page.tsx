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

    // Fetch blog AND navigation categories in parallel (first batch)
    const [blogRes, headerCatsRes, footerCatsRes] = await Promise.all([
        supabase
            .from("blogs")
            .select(`
                id, title, slug, excerpt, content, featured_image, image_alt,
                view_count, created_at, updated_at, published_at, meta_title, meta_description, meta_keywords,
                category_id,
                category:categories!category_id(id, name, slug),
                blog_tags(tag:tags(id, name))
            `)
            .eq("slug", slug)
            .eq("status", "published")
            .single(),
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

    const blog = blogRes.data;
    if (blogRes.error || !blog) {
        notFound();
    }

    const headerCategories = (headerCatsRes.data || []) as any[];
    const footerCategories = (footerCatsRes.data || []) as any[];

    // Fetch related content in parallel (second batch - needs blog.category_id)
    const [promptsRes, blogsRes, _] = await Promise.all([
        supabase
            .from("prompts")
            .select("id, title, slug, image_url, view_count")
            .eq("category_id", blog.category_id)
            .eq("status", "published")
            .order("view_count", { ascending: false })
            .limit(6),
        supabase
            .from("blogs")
            .select("id, title, slug, featured_image, view_count")
            .eq("category_id", blog.category_id)
            .eq("status", "published")
            .neq("id", blog.id)
            .order("view_count", { ascending: false })
            .limit(6),
        // Increment view count in background
        supabase.rpc("increment_blog_view_count", { blog_id: blog.id })
    ]);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pixico-w3us.vercel.app';
    const breadcrumbSchema = generateBreadcrumbSchema([
        { name: "Home", url: baseUrl },
        { name: "Blog", url: `${baseUrl}/blog` },
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
                "url": `${baseUrl}/icon.svg`
            }
        }
    };

    return (
        <>
            <JsonLd key="breadcrumb-schema" data={breadcrumbSchema} />
            <JsonLd key="blog-schema" data={jsonLd} />
            <BlogClient
                initialBlog={blog as any}
                initialRelatedPrompts={promptsRes.data || []}
                initialRelatedBlogs={blogsRes.data || []}
                headerCategories={headerCategories}
                footerCategories={footerCategories}
            />
        </>
    );
}
