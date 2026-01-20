"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "./Footer.module.css";

interface Category {
    name: string;
    slug: string;
}

const aiModels = [
    { name: "Midjourney Prompts", slug: "midjourney" },
    { name: "FLUX Prompts", slug: "flux" },
    { name: "Stable Diffusion Prompts", slug: "stable-diffusion" },
    { name: "DALL-E Prompts", slug: "dall-e" },
    { name: "Sora Prompts", slug: "sora" },
    { name: "Leonardo AI Prompts", slug: "leonardo-ai" },
];

const resources = [
    { name: "Pixico AI Generator", slug: "generate" },
    { name: "Prompt Guide", slug: "prompt-guide" },
    { name: "Tutorials", slug: "blog" },
    { name: "FAQ", slug: "faq" },
];

const company = [
    { name: "About Us", slug: "about" },
    { name: "Contact", slug: "contact" },
    { name: "Privacy Policy", slug: "privacy" },
    { name: "Terms of Service", slug: "terms" },
];

export default function Footer() {
    const currentYear = new Date().getFullYear();
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("categories")
            .select("name, slug")
            .eq("show_in_footer", true)
            .order("sort_order")
            .limit(6);

        if (!error && data) {
            setCategories(data);
        }
    };

    return (
        <footer className={styles.footer}>
            <div className="container">
                {/* Main Footer Content */}
                <div className={styles.content}>
                    {/* Brand Column */}
                    <div className={styles.brand}>
                        <Link href="/" className={styles.logo}>
                            <div className={styles.logoMark}>
                                <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                                    <rect width="28" height="28" fill="url(#footerLogoGrad)" />
                                    <path d="M7 7H13V13H7V7Z" fill="white" fillOpacity="0.9" />
                                    <path d="M15 7H21V13H15V7Z" fill="white" fillOpacity="0.6" />
                                    <path d="M7 15H13V21H7V15Z" fill="white" fillOpacity="0.6" />
                                    <path d="M15 15H21V21H15V15Z" fill="white" fillOpacity="0.3" />
                                    <defs>
                                        <linearGradient id="footerLogoGrad" x1="0" y1="0" x2="28" y2="28">
                                            <stop stopColor="#a855f7" />
                                            <stop offset="1" stopColor="#06b6d4" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                            <span>Pixico</span>
                        </Link>
                        <p className={styles.tagline}>
                            Discover the perfect AI prompts for stunning image and video generation.
                            Explore thousands of curated prompts or generate custom ones with Pixico AI.
                        </p>
                        <div className={styles.social}>
                            <a href="https://twitter.com/pixico" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className={styles.socialLink}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>
                            <a href="https://discord.gg/pixico" target="_blank" rel="noopener noreferrer" aria-label="Discord" className={styles.socialLink}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.037c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.175 13.175 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
                                </svg>
                            </a>
                            <a href="https://instagram.com/pixico.ai" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={styles.socialLink}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                                </svg>
                            </a>
                            <a href="https://youtube.com/@pixico" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className={styles.socialLink}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div className={styles.linksGrid}>
                        <div className={styles.column}>
                            <h3 className={styles.columnTitle}>AI Models</h3>
                            <ul className={styles.linkList}>
                                {aiModels.map((item) => (
                                    <li key={item.slug}>
                                        <Link href={`/search?q=${encodeURIComponent(item.slug)}`} className={styles.link}>
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className={styles.column}>
                            <h3 className={styles.columnTitle}>Categories</h3>
                            <ul className={styles.linkList}>
                                {categories.map((item) => (
                                    <li key={item.slug}>
                                        <Link href={`/category/${item.slug}`} className={styles.link}>
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className={styles.column}>
                            <h3 className={styles.columnTitle}>Resources</h3>
                            <ul className={styles.linkList}>
                                {resources.map((item) => (
                                    <li key={item.slug}>
                                        <Link href={`/${item.slug}`} className={styles.link}>
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className={styles.column}>
                            <h3 className={styles.columnTitle}>Company</h3>
                            <ul className={styles.linkList}>
                                {company.map((item) => (
                                    <li key={item.slug}>
                                        <Link href={`/${item.slug}`} className={styles.link}>
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className={styles.bottom}>
                    <p className={styles.copyright}>
                        © {currentYear} Pixico. All rights reserved.
                    </p>
                    <p className={styles.made}>
                        Made with ❤️ for AI creators worldwide
                    </p>
                </div>
            </div>
        </footer>
    );
}
