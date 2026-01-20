import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "FAQ - Frequently Asked Questions | Pixico",
    description: "Get answers to common questions about Gemini prompts, AI image generation, and using Pixico's prompt library. Learn how to copy-paste prompts for best results.",
};

const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
        {
            "@type": "Question",
            "name": "What is a Gemini prompt?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "A Gemini prompt is a text instruction used with Google's Gemini AI to generate images, photos, or creative content. Gemini prompts guide the AI to create specific visuals based on your description."
            }
        },
        {
            "@type": "Question",
            "name": "How do I copy paste Gemini prompts?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "To copy-paste Gemini prompts: (1) Browse our library and find your desired prompt, (2) Click 'Reveal Prompt' to see the full text, (3) Click the 'Copy' button, (4) Paste it into Google Gemini AI or your preferred image generator. It's that simple!"
            }
        },
        {
            "@type": "Question",
            "name": "What are the best Gemini photo prompts for couples?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "The best Gemini couple photo prompts include romantic settings, specific poses, and lighting descriptions. Popular options include retro couple photos, traditional saree couple prompts, and modern photo editing styles. Browse our 'Couple Prompts' category for hundreds of options."
            }
        },
        {
            "@type": "Question",
            "name": "How do I use nano banana prompt?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "The nano banana prompt is a trending Gemini AI prompt for creating unique miniature-style images. Simply copy the prompt from our library and paste it into Gemini with your specific subject to generate creative nano-style visuals."
            }
        },
        {
            "@type": "Question",
            "name": "Are Pixico prompts free to use?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes! All prompts on Pixico are completely free to copy, paste, and use. No registration required to browse and copy prompts, though creating an account lets you save your favorites."
            }
        },
        {
            "@type": "Question",
            "name": "What AI models work with these prompts?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Our prompts work with Google Gemini, Midjourney, DALL-E, Stable Diffusion, FLUX, and most other AI image generators. Each prompt is tagged with compatible models for best results."
            }
        },
        {
            "@type": "Question",
            "name": "How often are new prompts added?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "We add new trending prompts daily, especially Gemini photo prompts and viral styles. Check our 'Trending' section to see the latest additions and most popular prompts."
            }
        },
        {
            "@type": "Question",
            "name": "Can I submit my own prompts?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes! Create a free account and you can submit your best AI prompts to share with the community. Popular submissions get featured on our homepage."
            }
        }
    ]
};

export default async function FAQPage() {
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
        <>
            <JsonLd key="faq-schema" data={faqSchema} />
            <Header initialCategories={headerCategories} />
            <main className={styles.main}>
                <div className="container">
                    <div className={styles.hero}>
                        <h1>Frequently Asked Questions</h1>
                        <p>Everything you need to know about using Pixico and AI prompts</p>
                    </div>

                    <div className={styles.faqGrid}>
                        {faqSchema.mainEntity.map((item, index) => (
                            <div key={index} className={styles.faqItem}>
                                <h2 className={styles.question}>{item.name}</h2>
                                <p className={styles.answer}>{item.acceptedAnswer.text}</p>
                            </div>
                        ))}
                    </div>

                    <div className={styles.cta}>
                        <h2>Still have questions?</h2>
                        <p>Can't find the answer you're looking for? Reach out to our support team.</p>
                        <a href="/contact" className={styles.ctaButton}>Contact Us</a>
                    </div>
                </div>
            </main>
            <Footer initialCategories={footerCategories} />
        </>
    );
}
