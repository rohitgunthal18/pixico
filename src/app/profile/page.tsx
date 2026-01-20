import { createClient } from "@/lib/supabase/server";
import ProfileClient from "./ProfileClient";

export const metadata = {
    title: "Profile | Pixico - AI Prompt Library",
    description: "Manage your saved and liked AI prompts on Pixico.",
};

export default async function ProfilePage() {
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
        <ProfileClient
            headerCategories={headerCategories}
            footerCategories={footerCategories}
        />
    );
}
