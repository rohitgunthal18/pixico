"use client";

import Link from "next/link";
import styles from "./Hero.module.css";
import SwipeableHeroCards from "./SwipeableHeroCards";
import {
    OpenAIIcon,
    MidjourneyIcon,
    DalleIcon,
    StableDiffusionIcon,
    GeminiIcon,
    LeonardoIcon,
    AdobeIcon
} from "./icons/PlatformIcons";

interface HeroPrompt {
    id: string;
    title: string;
    slug: string;
    image_url: string;
    category: { name: string } | null;
}

interface HeroProps {
    initialHeroImages?: HeroPrompt[];
}

const PLATFORMS = [
    { name: "OpenAI", Icon: OpenAIIcon },
    { name: "Midjourney", Icon: MidjourneyIcon },
    { name: "DALL-E", Icon: DalleIcon },
    { name: "Stable Diffusion", Icon: StableDiffusionIcon },
    { name: "Gemini", Icon: GeminiIcon },
    { name: "Leonardo AI", Icon: LeonardoIcon },
    { name: "Adobe Firefly", Icon: AdobeIcon },
];

export default function Hero({ initialHeroImages }: HeroProps) {
    return (
        <section className={styles.hero}>
            <div className={`container ${styles.container}`}>
                {/* Left: Text Content */}
                <div className={styles.textSide}>
                    <h1 className={styles.headline}>
                        Find the
                        <span className={styles.gradientText}> Perfect Prompt </span>
                        for Your Next Creation
                    </h1>

                    <p className={styles.subtitle}>
                        Browse thousands of curated prompts and discover exactly what you need.
                    </p>

                    {/* CTAs */}
                    <div className={styles.ctas}>
                        <Link href="/prompts" className={styles.primaryCta}>
                            Start Exploring
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </Link>
                        <Link href="/generate" className={styles.secondaryCta}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2l1.5 8.5L22 12l-8.5 1.5L12 22l-1.5-8.5L2 12l8.5-1.5L12 2z" />
                            </svg>
                            Prompt Builder AI
                        </Link>
                    </div>

                    {/* Platform Icons - Marquee with Blur Fade */}
                    <div className={styles.platformMarquee}>
                        <div className={styles.marqueeTrack}>
                            {/* Render two sets of icons for seamless looping */}
                            {[1, 2].map((set) => (
                                <div key={set} className={styles.marqueeContent}>
                                    {PLATFORMS.map(({ name, Icon }) => (
                                        <div key={name} className={styles.platformIcon} title={name}>
                                            <Icon />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Prompt Preview Cards */}
                <div className={styles.visualSide}>
                    <SwipeableHeroCards initialPrompts={initialHeroImages} />
                </div>
            </div>
        </section>
    );
}
