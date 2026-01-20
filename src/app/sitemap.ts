import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pixico.io';
    const supabase = await createClient();

    // 1. Fetch all published prompts
    const { data: prompts } = await supabase
        .from('prompts')
        .select('slug, updated_at')
        .eq('status', 'published');

    // 2. Fetch all published blogs
    const { data: blogs } = await supabase
        .from('blogs')
        .select('slug, updated_at')
        .eq('status', 'published');

    // 3. Fetch all categories
    const { data: categories } = await supabase
        .from('categories')
        .select('slug, updated_at');

    const promptUrls = (prompts || []).map((p) => ({
        url: `${baseUrl}/prompt/${p.slug}`,
        lastModified: new Date(p.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    const blogUrls = (blogs || []).map((b) => ({
        url: `${baseUrl}/blog/${b.slug}`,
        lastModified: new Date(b.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    const categoryUrls = (categories || []).map((c) => ({
        url: `${baseUrl}/category/${c.slug}`,
        lastModified: new Date(c.updated_at),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
    }));

    const staticPages = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 1.0,
        },
        {
            url: `${baseUrl}/generate`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.95,
        },
        {
            url: `${baseUrl}/prompts`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.95,
        },
        {
            url: `${baseUrl}/blog`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.9,
        },
        {
            url: `${baseUrl}/faq`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.85,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        },
    ];

    return [...staticPages, ...promptUrls, ...blogUrls, ...categoryUrls];
}
