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

export default async function Page() {
    return <CategoryClient />;
}
