import { createClient } from "@/lib/supabase/server";
import SearchClient from "./SearchClient";

export const metadata = {
    title: "Search Results | Pixico AI Prompt Library",
    description: "Search for AI prompts and articles on Pixico.",
};

export default async function SearchPage() {
    const supabase = await createClient();

    // Fetch navigation categories in parallel
    const [headerCatsRes, footerCatsRes] = await Promise.all([
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

    const headerCategories = (headerCatsRes.data || []) as any[];
    const footerCategories = (footerCatsRes.data || []) as any[];

    return (
        <SearchClient
            headerCategories={headerCategories}
            footerCategories={footerCategories}
        />
    );
}
