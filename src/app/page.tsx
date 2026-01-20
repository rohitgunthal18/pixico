import Header from "@/components/Header";
import Hero from "@/components/Hero";
import PromptGrid from "@/components/PromptGrid";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";

// Dynamic imports for below-fold components
const CategoryShowcase = dynamic(() => import("@/components/CategoryShowcase"), {
  loading: () => <div style={{ minHeight: "400px" }} />,
});

const BlogSection = dynamic(() => import("@/components/BlogSection"), {
  loading: () => <div style={{ minHeight: "300px" }} />,
});

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <PromptGrid id="featured-prompts" title="Featured Prompts" showViewAll={true} viewAllHref="/prompts" limit={15} sectionType="featured" />
        <CategoryShowcase />
        <PromptGrid id="trending" title="Trending This Week" showViewAll={true} limit={10} sectionType="trending" />
        <BlogSection />
      </main>
      <Footer />
    </>
  );
}
