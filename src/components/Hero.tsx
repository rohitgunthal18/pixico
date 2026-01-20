"use client";

import Link from "next/link";
import styles from "./Hero.module.css";
import SwipeableHeroCards from "./SwipeableHeroCards";

export default function Hero() {
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
                            {/* First set of icons */}
                            <div className={styles.marqueeContent}>
                                {/* OpenAI / ChatGPT - Official Logo */}
                                <div className={styles.platformIcon} title="OpenAI">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
                                    </svg>
                                </div>
                                {/* Midjourney - Boat Logo */}
                                <div className={styles.platformIcon} title="Midjourney">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 1.5c4.694 0 8.5 3.806 8.5 8.5s-3.806 8.5-8.5 8.5-8.5-3.806-8.5-8.5 3.806-8.5 8.5-8.5zM9 8v8l7-4-7-4z" />
                                    </svg>
                                </div>
                                {/* DALL-E - Frame Logo */}
                                <div className={styles.platformIcon} title="DALL-E">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <rect x="3" y="3" width="18" height="18" />
                                        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                                        <path d="M21 15l-5-5L5 21" />
                                    </svg>
                                </div>
                                {/* Stable Diffusion - SD Logo */}
                                <div className={styles.platformIcon} title="Stable Diffusion">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l6.9 3.45L12 11.09 5.1 7.63 12 4.18zM4 8.82l7 3.5v7.36l-7-3.5V8.82zm9 10.86v-7.36l7-3.5v7.36l-7 3.5z" />
                                    </svg>
                                </div>
                                {/* Google Gemini - Star Logo */}
                                <div className={styles.platformIcon} title="Gemini">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm0 3.6c4.6 0 8.4 3.8 8.4 8.4s-3.8 8.4-8.4 8.4-8.4-3.8-8.4-8.4 3.8-8.4 8.4-8.4zm0 2.4c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 2.4c2 0 3.6 1.6 3.6 3.6s-1.6 3.6-3.6 3.6-3.6-1.6-3.6-3.6 1.6-3.6 3.6-3.6z" />
                                    </svg>
                                </div>
                                {/* Leonardo AI */}
                                <div className={styles.platformIcon} title="Leonardo AI">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2L4 6v12l8 4 8-4V6l-8-4zm0 2.18L18 7v10l-6 3-6-3V7l6-2.82z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                </div>
                                {/* Adobe Firefly */}
                                <div className={styles.platformIcon} title="Adobe Firefly">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M13.966 22.624l-1.69-4.281H8.122l3.892-9.144 5.662 13.425h-3.71zm.83-17.248L19.2 17.9h3.5L14.795 2H9.205L1.299 17.9H4.8l4.405-12.524h5.591z" />
                                    </svg>
                                </div>
                            </div>
                            {/* Duplicate for seamless loop */}
                            <div className={styles.marqueeContent}>
                                <div className={styles.platformIcon} title="OpenAI">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
                                    </svg>
                                </div>
                                <div className={styles.platformIcon} title="Midjourney">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 1.5c4.694 0 8.5 3.806 8.5 8.5s-3.806 8.5-8.5 8.5-8.5-3.806-8.5-8.5 3.806-8.5 8.5-8.5zM9 8v8l7-4-7-4z" />
                                    </svg>
                                </div>
                                <div className={styles.platformIcon} title="DALL-E">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <rect x="3" y="3" width="18" height="18" />
                                        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                                        <path d="M21 15l-5-5L5 21" />
                                    </svg>
                                </div>
                                <div className={styles.platformIcon} title="Stable Diffusion">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l6.9 3.45L12 11.09 5.1 7.63 12 4.18zM4 8.82l7 3.5v7.36l-7-3.5V8.82zm9 10.86v-7.36l7-3.5v7.36l-7 3.5z" />
                                    </svg>
                                </div>
                                <div className={styles.platformIcon} title="Gemini">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm0 3.6c4.6 0 8.4 3.8 8.4 8.4s-3.8 8.4-8.4 8.4-8.4-3.8-8.4-8.4 3.8-8.4 8.4-8.4zm0 2.4c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 2.4c2 0 3.6 1.6 3.6 3.6s-1.6 3.6-3.6 3.6-3.6-1.6-3.6-3.6 1.6-3.6 3.6-3.6z" />
                                    </svg>
                                </div>
                                <div className={styles.platformIcon} title="Leonardo AI">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2L4 6v12l8 4 8-4V6l-8-4zm0 2.18L18 7v10l-6 3-6-3V7l6-2.82z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                </div>
                                <div className={styles.platformIcon} title="Adobe Firefly">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M13.966 22.624l-1.69-4.281H8.122l3.892-9.144 5.662 13.425h-3.71zm.83-17.248L19.2 17.9h3.5L14.795 2H9.205L1.299 17.9H4.8l4.405-12.524h5.591z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Prompt Preview Cards */}
                <div className={styles.visualSide}>
                    <SwipeableHeroCards />
                </div>
            </div>
        </section>
    );
}
