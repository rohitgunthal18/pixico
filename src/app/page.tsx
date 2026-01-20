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

  // 1. Fetch all basic navigation and showcase categories first
  const [headerCatsRes, footerCatsRes, showcaseCatsRes] = await Promise.all([
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
    supabase
      .from("categories")
      .select("id, name, slug, description, image_url")
      .eq("show_in_showcase", true)
      .order("sort_order")
      .limit(6)
  ]);

  const showcaseCategories = showcaseCatsRes.data || [];
  const headerCategories = (headerCatsRes.data || []) as any[];
  const footerCategories = (footerCatsRes.data || []) as any[];

  // 2. Fetch everything else in parallel: 
  // - Category counts
  // - Featured prompts
  // - Trending prompts
  const [categoriesWithCounts, featuredRes, trendingRes] = await Promise.all([
    Promise.all(
      showcaseCategories.map(async (cat) => {
        const { count } = await supabase
          .from("prompts")
          .select("*", { count: "exact", head: true })
          .eq("category_id", cat.id)
          .eq("status", "published");
        return { ...cat, prompt_count: count || 0 };
      })
    ),
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
      .limit(10)
  ]);

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
        <CategoryShowcase initialCategories={categoriesWithCounts as any} />
        <PromptGrid
          id="trending"
          title="Trending This Week"
          showViewAll={true}
          limit={10}
          sectionType="trending"
          initialPrompts={trendingRes.data || []}
        />
        <BlogSection />
      </main>
      <Footer initialCategories={footerCategories} />
    </>
  );
}
