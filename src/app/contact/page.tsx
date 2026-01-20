import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
    title: "Contact Us | Pixico - AI Prompt Library",
    description: "Get in touch with the Pixico team. We're here to help with any questions or feedback about our AI prompt library.",
};

export default async function ContactPage() {
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
        <ContactClient
            headerCategories={headerCategories}
            footerCategories={footerCategories}
        />
    );
}
