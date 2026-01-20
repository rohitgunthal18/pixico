import { createClient } from "@/lib/supabase/server";
import GenerateClient from "./GenerateClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pixico AI Chat | Master Prompt Engineering",
    description: "Generate high-quality AI image and video prompts with Pixico AI. Expert guidance for Midjourney, FLUX, Runway, and more.",
};

export default async function GeneratePage() {
    const supabase = await createClient();

    // Get current user session
    const { data: { user } } = await supabase.auth.getUser();

    let initialConversations = [];
    if (user) {
        // Pre-fetch conversations for instant sidebar loading
        const { data, error } = await supabase
            .from('chat_conversations')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

        if (!error && data) {
            initialConversations = data;
        }
    }

    return (
        <GenerateClient initialConversations={initialConversations} />
    );
}
