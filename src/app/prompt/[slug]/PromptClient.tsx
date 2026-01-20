"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryShowcase from "@/components/CategoryShowcase";
import AuthModal from "@/components/AuthModal";
import styles from "./page.module.css";

interface Prompt {
    id: string;
    slug: string;
    prompt_code: string | null;
    title: string;
    prompt_text: string;
    description: string | null;
    image_url: string | null;
    image_alt: string | null;
    like_count: number;
    view_count: number;
    save_count: number;
    aspect_ratio: string | null;
    style: string | null;
    meta_title: string | null;
    meta_description: string | null;
    category: { id: string; name: string; slug: string } | null;
    ai_model: { id: string; name: string } | null;
    prompt_tags: { tag: { id: string; name: string } }[];
}

interface RelatedPrompt {
    id: string;
    slug: string;
    title: string;
    image_url: string | null;
}

function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
}

export default function PromptClient() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const { user } = useAuth();

    const [prompt, setPrompt] = useState<Prompt | null>(null);
    const [relatedPrompts, setRelatedPrompts] = useState<RelatedPrompt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [localLikeCount, setLocalLikeCount] = useState(0);
    const [copied, setCopied] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    // Prompt reveal states
    const [isPromptRevealed, setIsPromptRevealed] = useState(false);
    const [revealCountdown, setRevealCountdown] = useState(5);
    const [isRevealing, setIsRevealing] = useState(false);

    useEffect(() => {
        if (slug) {
            fetchPrompt();
        }
    }, [slug]);

    const fetchPrompt = async () => {
        const supabase = createClient();

        // Fetch prompt with category, model, and tags
        const { data, error } = await supabase
            .from("prompts")
            .select(`
                id, slug, prompt_code, title, prompt_text, description, 
                image_url, image_alt, like_count, view_count, save_count,
                aspect_ratio, style, meta_title, meta_description,
                category:categories!category_id(id, name, slug),
                ai_model:ai_models!model_id(id, name),
                prompt_tags(tag:tags(id, name))
            `)
            .eq("slug", slug)
            .eq("status", "published")
            .single();

        if (error || !data) {
            console.error("Error fetching prompt:", error);
            setIsLoading(false);
            return;
        }

        setPrompt(data as unknown as Prompt);
        setLocalLikeCount(data.like_count || 0);

        // Increment view count
        await supabase.rpc("increment_view_count", { prompt_id: data.id });

        // Fetch related prompts from same category
        const categoryData = data.category as unknown as { id: string; name: string; slug: string } | null;
        if (categoryData?.id) {
            const { data: related } = await supabase
                .from("prompts")
                .select("id, slug, title, image_url")
                .eq("category_id", categoryData.id)
                .eq("status", "published")
                .neq("id", data.id)
                .limit(4);

            setRelatedPrompts(related || []);
        }

        // Check if user has liked/saved this prompt
        if (data.id) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: statusData } = await supabase.rpc("get_user_prompt_status", {
                    p_prompt_id: data.id,
                    p_user_id: session.user.id
                });
                if (statusData) {
                    setIsLiked(statusData.liked || false);
                    setIsSaved(statusData.saved || false);
                }
            } else {
                // Check anonymous likes from localStorage
                const likedPrompts: string[] = JSON.parse(localStorage.getItem('pixico_liked_prompts') || '[]');
                if (likedPrompts.includes(data.id)) {
                    setIsLiked(true);
                }
            }

            // Check if prompt was already revealed in this session
            const wasRevealed = sessionStorage.getItem(`prompt_revealed_${data.id}`);
            if (wasRevealed === 'true') {
                setIsPromptRevealed(true);
            }
        }

        setIsLoading(false);
    };

    const handleCopy = async () => {
        if (!prompt) return;

        const textToCopy = prompt.prompt_text;

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(textToCopy);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                return;
            }

            const textArea = document.createElement("textarea");
            textArea.value = textToCopy;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            textArea.setSelectionRange(0, 99999);

            try {
                const successful = document.execCommand("copy");
                if (successful) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                }
            } catch (err) {
                console.error("Fallback copy failed:", err);
            }

            document.body.removeChild(textArea);
        } catch (err) {
            console.error("Copy failed:", err);
        }
    };

    const handleLike = async () => {
        if (!prompt) return;

        const likedPromptsKey = 'pixico_liked_prompts';
        const likedPrompts: string[] = JSON.parse(localStorage.getItem(likedPromptsKey) || '[]');
        const hasLikedAnonymously = likedPrompts.includes(prompt.id);

        if (user) {
            const previousLiked = isLiked;
            const previousCount = localLikeCount;
            setIsLiked(!isLiked);
            setLocalLikeCount(prev => isLiked ? prev - 1 : prev + 1);

            const supabase = createClient();
            const { data, error } = await supabase.rpc("toggle_like", {
                p_prompt_id: prompt.id,
                p_user_id: user.id
            });

            if (error) {
                console.error("Error toggling like:", error);
                setIsLiked(previousLiked);
                setLocalLikeCount(previousCount);
                return;
            }

            if (data) {
                setLocalLikeCount(data.count);
                setIsLiked(data.liked);
            }
        } else {
            if (hasLikedAnonymously) return;

            setIsLiked(true);
            setLocalLikeCount(prev => prev + 1);
            likedPrompts.push(prompt.id);
            localStorage.setItem(likedPromptsKey, JSON.stringify(likedPrompts));

            const supabase = createClient();
            await supabase.rpc("increment_like_count", { prompt_id: prompt.id });
        }
    };

    const handleRevealPrompt = () => {
        if (isPromptRevealed || isRevealing) return;

        setIsRevealing(true);
        setRevealCountdown(5);

        const timer = setInterval(() => {
            setRevealCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setIsPromptRevealed(true);
                    setIsRevealing(false);
                    if (prompt) {
                        sessionStorage.setItem(`prompt_revealed_${prompt.id}`, 'true');
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSave = async () => {
        if (!prompt) return;

        if (!user) {
            setShowLoginPrompt(true);
            return;
        }

        const previousSaved = isSaved;
        setIsSaved(!isSaved);

        const supabase = createClient();
        const { data, error } = await supabase.rpc("toggle_save", {
            p_prompt_id: prompt.id,
            p_user_id: user.id
        });

        if (error) {
            console.error("Error toggling save:", error);
            setIsSaved(previousSaved);
            return;
        }

        if (data) {
            setIsSaved(data.saved);
        }
    };

    if (isLoading) {
        return (
            <>
                <Header />
                <main className={styles.main}>
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    if (!prompt) {
        return (
            <>
                <Header />
                <main className={styles.main}>
                    <div className={styles.notFound}>
                        <h1>Prompt Not Found</h1>
                        <p>The prompt you're looking for doesn't exist or has been removed.</p>
                        <Link href="/" className={styles.backBtn}>Back to Home</Link>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    const tags = prompt.prompt_tags?.map(pt => pt.tag) || [];

    return (
        <>
            <Header />
            <main className={styles.main}>
                <section className={styles.hero}>
                    <div className={`container ${styles.heroContainer}`}>
                        <div className={styles.imageCol}>
                            <div className={styles.imageBox}>
                                <Image
                                    src={prompt.image_url || "/placeholder-prompt.jpg"}
                                    alt={prompt.image_alt || prompt.title}
                                    width={600}
                                    height={800}
                                    className={styles.image}
                                    priority
                                />
                            </div>
                            <div className={styles.stats}>
                                <span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" />
                                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                    {formatNumber(prompt.view_count)}
                                </span>
                                <span className={isLiked ? styles.likedStat : ""}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"}>
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                    {formatNumber(localLikeCount)}
                                </span>
                            </div>
                        </div>

                        <div className={styles.infoCol}>
                            <nav className={styles.breadcrumb}>
                                <Link href="/">Home</Link> /
                                {prompt.category && (
                                    <Link href={`/category/${prompt.category.slug}`}>{prompt.category.name}</Link>
                                )}
                            </nav>

                            <h1 className={styles.title}>
                                {prompt.prompt_code && <span className={styles.promptCode}>#{prompt.prompt_code}</span>}
                                {prompt.title}
                            </h1>

                            <div className={styles.meta}>
                                <span className={styles.model}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                    {prompt.ai_model?.name || "AI Model"}
                                </span>
                                {prompt.aspect_ratio && <span className={styles.badge}>{prompt.aspect_ratio}</span>}
                                {prompt.style && <span className={styles.badge}>{prompt.style}</span>}
                            </div>

                            <div className={styles.promptBox}>
                                <div className={styles.promptHead}>
                                    <span>PROMPT</span>
                                    <button
                                        onClick={handleCopy}
                                        className={styles.copyBtn}
                                        disabled={!isPromptRevealed}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" />
                                        </svg>
                                        {copied ? "Copied!" : "Copy"}
                                    </button>
                                </div>
                                <div className={styles.promptBlurContainer}>
                                    <div className={`${styles.promptScrollArea} ${!isPromptRevealed ? styles.promptBlurred : ''}`}>
                                        <p className={styles.promptText}>
                                            {prompt.prompt_text}
                                        </p>
                                    </div>
                                    {!isPromptRevealed && (
                                        <div className={styles.promptRevealOverlay}>
                                            <button
                                                className={styles.revealBtn}
                                                onClick={handleRevealPrompt}
                                                disabled={isRevealing}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                                {isRevealing ? `Revealing in ${revealCountdown}s...` : "Reveal Prompt"}
                                            </button>
                                            {!isRevealing && (
                                                <span className={styles.revealHint}>Click to reveal the full prompt text</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {tags.length > 0 && (
                                <div className={styles.tags}>
                                    {tags.map(tag => (
                                        <Link key={tag.id} href={`/tag/${tag.name}`} className={styles.tag}>
                                            #{tag.name}
                                        </Link>
                                    ))}
                                </div>
                            )}

                            <div className={styles.actions}>
                                <button
                                    className={`${styles.saveBtnFull} ${isSaved ? styles.active : ""}`}
                                    onClick={handleSave}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                    </svg>
                                    {isSaved ? "Saved" : "Save to Collection"}
                                </button>
                                <button
                                    className={`${styles.likeBtn} ${isLiked ? styles.active : ""}`}
                                    onClick={handleLike}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                    </svg>
                                    {isLiked ? "Liked" : "Like"}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section className={styles.content}>
                    <div className="container">
                        <div className={styles.contentGrid}>
                            <article className={styles.article}>
                                <h2>About This Prompt</h2>
                                <div
                                    className={styles.description}
                                    dangerouslySetInnerHTML={{
                                        __html: prompt.description || `This ${prompt.ai_model?.name || "AI"} prompt is designed to help you create stunning, high-quality images. Use it with ${prompt.ai_model?.name || "your favorite AI model"} for best results.`
                                    }}
                                />

                                {prompt.ai_model && (
                                    <>
                                        <h3>How to Use for Best Quality</h3>
                                        <p>
                                            To achieve the best results with this prompt in <strong>{prompt.ai_model.name}</strong>,
                                            copy the full prompt text above and paste it directly into your AI image generator.
                                            {prompt.aspect_ratio && ` The recommended aspect ratio is ${prompt.aspect_ratio}.`}
                                        </p>
                                        <ul>
                                            <li><strong>Model:</strong> Optimized for {prompt.ai_model.name}</li>
                                            {prompt.aspect_ratio && <li><strong>Aspect Ratio:</strong> {prompt.aspect_ratio}</li>}
                                            {prompt.style && <li><strong>Style:</strong> {prompt.style}</li>}
                                        </ul>
                                    </>
                                )}
                            </article>

                            {relatedPrompts.length > 0 && (
                                <aside className={styles.related}>
                                    <h3>More in {prompt.category?.name || "This Category"}</h3>
                                    <div className={styles.relatedGrid}>
                                        {relatedPrompts.map(p => (
                                            <Link key={p.id} href={`/prompt/${p.slug}`} className={styles.relatedCard}>
                                                <Image
                                                    src={p.image_url || "/placeholder-prompt.jpg"}
                                                    alt={p.title}
                                                    width={200}
                                                    height={250}
                                                    className={styles.relatedImg}
                                                />
                                                <span>{p.title}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </aside>
                            )}
                        </div>
                    </div>
                </section>

                <CategoryShowcase />
            </main>
            <Footer />

            <AuthModal
                isOpen={showLoginPrompt}
                onClose={() => setShowLoginPrompt(false)}
                contextMessage="Sign in to save prompts in collection"
            />
        </>
    );
}
