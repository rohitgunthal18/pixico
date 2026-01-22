import Header from "@/components/Header";
import Hero from "@/components/Hero";
import PromptGrid from "@/components/PromptGrid";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";

// Dynamic imports for below-fold components
const CategoryShowcase = dynamic(() => import("@/components/CategoryShowcase"), {
  loading: () => <div style={{ minHeight: "400px" }} />,
});

const BlogSection = dynamic(() => import("@/components/BlogSection"), {
  loading: () => <div style={{ minHeight: "300px" }} />,
});

export default async function Home() {
  const supabase = await createClient();

  // Fetch ALL data in a single Promise.all for maximum parallel performance
  const [
    headerCatsRes,
    footerCatsRes,
    showcaseCatsRes,
    featuredRes,
    trendingRes,
    blogsRes
  ] = await Promise.all([
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
      .limit(6),
    // Fetch showcase categories WITH prompt counts in single query (fixes N+1)
    supabase
      .from("categories")
      .select(`
        id, name, slug, description, image_url,
        prompts:prompts!category_id(count)
      `)
      .eq("show_in_showcase", true)
      .order("sort_order")
      .limit(6),
    supabase
      .from("prompts")
      .select(`
        id, title, slug, image_url, like_count, view_count, created_at,
        category:categories!category_id(name),
        ai_model:ai_models!model_id(name)
      `)
      .eq("status", "published")
      .order("like_count", { ascending: false })
      .limit(15),
    supabase
      .from("prompts")
      .select(`
        id, title, slug, image_url, like_count, view_count, created_at,
        category:categories!category_id(name),
        ai_model:ai_models!model_id(name)
      `)
      .eq("status", "published")
      .order("view_count", { ascending: false })
      .limit(10),
    // Fetch blogs server-side for faster LCP
    supabase
      .from("blogs")
      .select(`
        id, title, slug, excerpt, featured_image, view_count, created_at,
        category:categories!category_id(name, slug)
      `)
      .eq("status", "published")
      .order("view_count", { ascending: false })
      .limit(6)
  ]);

  const headerCategories = (headerCatsRes.data || []) as any[];
  const footerCategories = (footerCatsRes.data || []) as any[];

  // Transform showcase categories to extract prompt counts
  const showcaseCategories = (showcaseCatsRes.data || []).map((cat: any) => ({
    ...cat,
    prompt_count: cat.prompts?.[0]?.count || 0
  }));

  return (
    <>
      <Header initialCategories={headerCategories} />
      <main>
        <Hero />
        <PromptGrid
          id="featured-prompts"
          title="Featured Prompts"
          showViewAll={true}
          viewAllHref="/prompts"
          limit={15}
          sectionType="featured"
          initialPrompts={featuredRes.data || []}
        />
        <CategoryShowcase initialCategories={showcaseCategories as any} />
        <PromptGrid
          id="trending"
          title="Trending This Week"
          showViewAll={true}
          limit={10}
          sectionType="trending"
          initialPrompts={trendingRes.data || []}
        />
        <BlogSection initialBlogs={blogsRes.data as any || []} />
      </main>
      <Footer initialCategories={footerCategories} />
    </>
  );
}
