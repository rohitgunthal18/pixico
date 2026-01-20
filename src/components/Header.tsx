"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import AuthModal from "./AuthModal";
import styles from "./Header.module.css";

interface Category {
    id: string;
    name: string;
    slug: string;
}

interface SearchResult {
    id: string;
    title: string;
    slug: string;
    type: "prompt" | "blog";
    image_url?: string | null;
}

export default function Header() {
    const router = useRouter();
    const { user, profile, isLoading, isAdmin, signOut } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const categoriesRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [mobileMenuOpen]);

    const fetchCategories = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("categories")
            .select("id, name, slug")
            .eq("show_in_header", true)
            .order("sort_order");

        if (!error && data) {
            setCategories(data);
        }
    };

    // Debounced search
    const performSearch = useCallback(async (query: string) => {
        if (!query.trim() || query.length < 2) {
            setSearchResults([]);
            setShowSearchDropdown(false);
            return;
        }

        // Check if searching by 4-digit prompt code
        const promptCodeMatch = query.match(/^#?(\d{4})$/);

        if (promptCodeMatch) {
            // Search by prompt code and redirect directly if found
            setIsSearching(true);
            const supabase = createClient();
            const code = promptCodeMatch[1];

            const { data } = await supabase
                .from("prompts")
                .select("slug")
                .eq("status", "published")
                .eq("prompt_code", code)
                .single();

            setIsSearching(false);

            if (data?.slug) {
                // Direct redirect to prompt page
                router.push(`/prompt/${data.slug}`);
                setSearchQuery("");
                setShowSearchDropdown(false);
                setMobileSearchOpen(false);
                return;
            }
            // If not found, show no results
            setSearchResults([]);
            setShowSearchDropdown(false);
            return;
        }

        setIsSearching(true);
        const supabase = createClient();
        const searchTerm = `%${query}%`;

        // Search prompts and blogs in parallel
        const [promptsRes, blogsRes] = await Promise.all([
            supabase
                .from("prompts")
                .select("id, title, slug, image_url")
                .eq("status", "published")
                .or(`title.ilike.${searchTerm},slug.ilike.${searchTerm},description.ilike.${searchTerm},prompt_text.ilike.${searchTerm}`)
                .limit(5),
            supabase
                .from("blogs")
                .select("id, title, slug, featured_image")
                .eq("status", "published")
                .or(`title.ilike.${searchTerm},slug.ilike.${searchTerm},excerpt.ilike.${searchTerm},content.ilike.${searchTerm}`)
                .limit(3)
        ]);

        const results: SearchResult[] = [
            ...(promptsRes.data || []).map(p => ({ ...p, type: "prompt" as const })),
            ...(blogsRes.data || []).map(b => ({ id: b.id, title: b.title, slug: b.slug, type: "blog" as const, image_url: b.featured_image }))
        ];

        setSearchResults(results);
        setShowSearchDropdown(results.length > 0);
        setIsSearching(false);
    }, [router]);

    const handleSearchInput = (value: string) => {
        setSearchQuery(value);

        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Don't search if empty
        if (!value.trim()) {
            setSearchResults([]);
            setShowSearchDropdown(false);
            return;
        }

        // Debounce search - 250ms for faster response
        searchTimeoutRef.current = setTimeout(() => {
            performSearch(value);
        }, 250);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setShowSearchDropdown(false);
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    const handleResultClick = (result: SearchResult) => {
        setShowSearchDropdown(false);
        setSearchQuery("");
        router.push(result.type === "prompt" ? `/prompt/${result.slug}` : `/blog/${result.slug}`);
    };

    const handleCategoryClick = (slug: string) => {
        router.push(`/category/${slug}`);
    };

    const scrollCategories = (direction: "left" | "right") => {
        if (categoriesRef.current) {
            const scrollAmount = 200;
            categoriesRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };

    const handleSignOut = async () => {
        await signOut();
        setUserMenuOpen(false);
    };

    return (
        <>
            <header className={styles.header}>
                {/* Primary Navigation Layer */}
                <div className={styles.primaryLayer}>
                    <div className={`container ${styles.primaryContainer}`}>
                        {/* Left Section: Menu + Logo + Nav */}
                        <div className={styles.leftSection}>
                            {/* Mobile Menu Button */}
                            <button
                                className={styles.mobileMenuBtn}
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                aria-label="Menu"
                            >
                                {mobileMenuOpen ? (
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M6 6L18 18M6 18L18 6" strokeLinecap="round" />
                                    </svg>
                                ) : (
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
                                    </svg>
                                )}
                            </button>

                            {/* Logo */}
                            <Link href="/" className={styles.logo}>
                                <div className={styles.logoMark}>
                                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                        <rect width="28" height="28" fill="url(#logoGrad)" />
                                        <path d="M7 7H13V13H7V7Z" fill="white" fillOpacity="0.9" />
                                        <path d="M15 7H21V13H15V7Z" fill="white" fillOpacity="0.6" />
                                        <path d="M7 15H13V21H7V15Z" fill="white" fillOpacity="0.6" />
                                        <path d="M15 15H21V21H15V15Z" fill="white" fillOpacity="0.3" />
                                        <defs>
                                            <linearGradient id="logoGrad" x1="0" y1="0" x2="28" y2="28">
                                                <stop stopColor="#a855f7" />
                                                <stop offset="1" stopColor="#06b6d4" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                </div>
                                <span className={styles.logoText}>Pixico</span>
                            </Link>

                            {/* Desktop Nav - Main Links */}
                            <nav className={styles.mainNav}>
                                <Link href="/#featured-prompts" className={styles.navItem}>
                                    Explore
                                </Link>
                                <Link href="/#trending" className={styles.navItem}>
                                    Trending
                                </Link>
                                <Link href="/blog" className={styles.navItem}>
                                    Blog
                                </Link>
                                <Link href="/about" className={styles.navItem}>
                                    About
                                </Link>
                                <Link href="/contact" className={styles.navItem}>
                                    Contact
                                </Link>
                            </nav>
                        </div>

                        {/* Right Section: Search + Generate + User */}
                        <div className={styles.rightSection}>
                            {/* Desktop Static Search Bar with Dropdown */}
                            <div className={styles.searchWrapper} ref={searchRef}>
                                <form onSubmit={handleSearch} className={styles.searchBar} suppressHydrationWarning>
                                    <input
                                        type="text"
                                        className={styles.searchInput}
                                        placeholder="Search prompts & blogs..."
                                        value={searchQuery}
                                        onChange={(e) => handleSearchInput(e.target.value)}
                                        onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                                        suppressHydrationWarning
                                    />
                                    <button type="submit" className={styles.searchBtn} aria-label="Search">
                                        {isSearching ? (
                                            <div className={styles.searchSpinner}></div>
                                        ) : (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                                                <path d="M16 16L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        )}
                                    </button>
                                </form>

                                {/* Search Dropdown */}
                                {showSearchDropdown && (
                                    <div className={styles.searchDropdown}>
                                        {searchResults.map((result) => (
                                            <button
                                                key={`${result.type}-${result.id}`}
                                                className={styles.searchResultItem}
                                                onClick={() => handleResultClick(result)}
                                            >
                                                <div className={styles.resultImage}>
                                                    {result.image_url ? (
                                                        <Image src={result.image_url} alt="" width={40} height={40} style={{ objectFit: "cover" }} />
                                                    ) : (
                                                        <div className={styles.resultPlaceholder}>
                                                            {result.type === "prompt" ? (
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                                                </svg>
                                                            ) : (
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={styles.resultInfo}>
                                                    <span className={styles.resultTitle}>{result.title}</span>
                                                    <span className={styles.resultType}>{result.type === "prompt" ? "Prompt" : "Blog"}</span>
                                                </div>
                                            </button>
                                        ))}
                                        <Link href={`/search?q=${encodeURIComponent(searchQuery)}`} className={styles.viewAllResults} onClick={() => setShowSearchDropdown(false)}>
                                            View all results →
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Mobile Search Icon */}
                            <button
                                className={styles.mobileSearchBtn}
                                onClick={() => setMobileSearchOpen(true)}
                                aria-label="Search"
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                                    <path d="M16 16L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>

                            <Link href="/generate" className={styles.generateBtn}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2l1.5 8.5L22 12l-8.5 1.5L12 22l-1.5-8.5L2 12l8.5-1.5L12 2z" />
                                </svg>
                                <span>Pixico AI</span>
                            </Link>

                            {/* User Button / Login */}
                            {isLoading ? (
                                <div className={styles.userBtn} aria-label="Loading">
                                    <div className={styles.userLoading}></div>
                                </div>
                            ) : user ? (
                                <div className={styles.userContainer}>
                                    <button
                                        className={styles.userBtn}
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        aria-label="User menu"
                                    >
                                        {profile?.avatar_url ? (
                                            <Image
                                                src={profile.avatar_url}
                                                alt={profile.full_name || "User"}
                                                width={32}
                                                height={32}
                                                className={styles.userAvatar}
                                            />
                                        ) : (
                                            <div className={styles.userInitial}>
                                                {profile?.full_name?.[0] || profile?.email?.[0] || "U"}
                                            </div>
                                        )}
                                    </button>

                                    {userMenuOpen && (
                                        <>
                                            <div className={styles.menuBackdrop} onClick={() => setUserMenuOpen(false)} />
                                            <div className={styles.userMenu}>
                                                <div className={styles.menuHeader}>
                                                    <span className={styles.menuName}>{profile?.full_name || "User"}</span>
                                                    <span className={styles.menuEmail}>{profile?.email}</span>
                                                </div>
                                                <div className={styles.menuDivider} />
                                                <Link href="/profile" className={styles.menuItem} onClick={() => setUserMenuOpen(false)}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="12" cy="8" r="4" />
                                                        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                                                    </svg>
                                                    My Profile
                                                </Link>
                                                <Link href="/profile/saved" className={styles.menuItem} onClick={() => setUserMenuOpen(false)}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                                    </svg>
                                                    Saved Prompts
                                                </Link>
                                                {isAdmin && (
                                                    <>
                                                        <div className={styles.menuDivider} />
                                                        <Link href="/admin" className={styles.menuItem} onClick={() => setUserMenuOpen(false)}>
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M12 2l3 7h7l-5.5 5 2 7-6.5-4.5-6.5 4.5 2-7L2 9h7l3-7z" />
                                                            </svg>
                                                            Admin Dashboard
                                                        </Link>
                                                    </>
                                                )}
                                                <div className={styles.menuDivider} />
                                                <button className={styles.menuItem} onClick={handleSignOut}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                                        <polyline points="16,17 21,12 16,7" />
                                                        <line x1="21" y1="12" x2="9" y2="12" />
                                                    </svg>
                                                    Sign Out
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <button
                                    className={styles.loginBtn}
                                    onClick={() => setAuthModalOpen(true)}
                                    aria-label="Sign in"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                                        <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    <span>Sign In</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Mobile Search Overlay */}
                    {mobileSearchOpen && (
                        <div className={styles.mobileSearchOverlay}>
                            <form onSubmit={handleSearch} className={styles.mobileSearchForm}>
                                <input
                                    type="text"
                                    className={styles.mobileSearchInput}
                                    placeholder="Search prompts & blogs..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearchInput(e.target.value)}
                                    autoFocus
                                />
                                {isSearching ? (
                                    <div className={styles.mobileSearchSpinner}></div>
                                ) : (
                                    <button type="submit" className={styles.mobileSearchSubmit} aria-label="Search">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                                            <path d="M16 16L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className={styles.mobileSearchClose}
                                    onClick={() => setMobileSearchOpen(false)}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </form>
                            {/* Mobile Search Dropdown */}
                            {showSearchDropdown && searchResults.length > 0 && (
                                <div className={styles.mobileSearchDropdown}>
                                    {searchResults.map((result) => (
                                        <button
                                            key={`${result.type}-${result.id}`}
                                            className={styles.searchResultItem}
                                            onClick={() => handleResultClick(result)}
                                        >
                                            <div className={styles.resultImage}>
                                                {result.image_url ? (
                                                    <Image src={result.image_url} alt="" width={40} height={40} style={{ objectFit: "cover" }} />
                                                ) : (
                                                    <div className={styles.resultPlaceholder}>
                                                        {result.type === "prompt" ? (
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                                            </svg>
                                                        ) : (
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={styles.resultInfo}>
                                                <span className={styles.resultTitle}>{result.title}</span>
                                                <span className={styles.resultType}>{result.type === "prompt" ? "Prompt" : "Blog"}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Categories Layer */}
                <div className={styles.categoriesLayer}>
                    <div className={`container ${styles.categoriesContainer}`}>
                        <button
                            className={styles.scrollBtn}
                            onClick={() => scrollCategories("left")}
                            aria-label="Scroll left"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>

                        <div className={styles.categoriesScroll} ref={categoriesRef}>
                            {categories.map((category) => (
                                <button
                                    key={category.slug}
                                    className={styles.categoryPill}
                                    onClick={() => handleCategoryClick(category.slug)}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>

                        <button
                            className={styles.scrollBtn}
                            onClick={() => scrollCategories("right")}
                            aria-label="Scroll right"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className={styles.mobileMenuOverlay}>
                    <div className={styles.mobileMenuContent}>
                        {/* Nav Links */}
                        <nav className={styles.mobileNav}>
                            <Link href="/#featured-prompts" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="7" height="7" />
                                    <rect x="14" y="3" width="7" height="7" />
                                    <rect x="3" y="14" width="7" height="7" />
                                    <rect x="14" y="14" width="7" height="7" />
                                </svg>
                                Explore
                            </Link>
                            <Link href="/#trending" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                </svg>
                                Trending
                            </Link>
                            <Link href="/blog" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14,2 14,8 20,8" />
                                </svg>
                                Blog
                            </Link>
                            <Link href="/about" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 16v-4M12 8h.01" />
                                </svg>
                                About
                            </Link>
                            <Link href="/generate" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    <path d="M8 9h8" strokeLinecap="round" />
                                    <path d="M8 13h5" strokeLinecap="round" />
                                </svg>
                                Pixico AI
                            </Link>
                            <Link href="/contact" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                </svg>
                                Contact
                            </Link>
                        </nav>

                        {/* User Section */}
                        <div className={styles.mobileUserSection}>
                            {!isLoading && (
                                user ? (
                                    <Link href="/profile" className={styles.mobileProfileBtn} onClick={() => setMobileMenuOpen(false)}>
                                        <div className={styles.mobileAvatar}>
                                            {profile?.avatar_url ? (
                                                <Image src={profile.avatar_url} alt="" width={36} height={36} style={{ objectFit: "cover", borderRadius: "50%" }} />
                                            ) : (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="8" r="4" />
                                                    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                                                </svg>
                                            )}
                                        </div>
                                        <span>{user.email?.split("@")[0] || "Profile"}</span>
                                    </Link>
                                ) : (
                                    <button className={styles.mobileSignInBtn} onClick={() => { setMobileMenuOpen(false); setAuthModalOpen(true); }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="8" r="4" />
                                            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                                        </svg>
                                        Sign In
                                    </button>
                                )
                            )}
                        </div>

                        <div className={styles.mobileSocials}>
                            <a href="https://instagram.com/pixico.ai" target="_blank" rel="noopener noreferrer" className={styles.mobileSocialLink}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="2" width="20" height="20" rx="5" />
                                    <circle cx="12" cy="12" r="4" />
                                    <circle cx="18" cy="6" r="1" fill="currentColor" />
                                </svg>
                            </a>
                            <a href="https://twitter.com/pixico" target="_blank" rel="noopener noreferrer" className={styles.mobileSocialLink}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>
                            <a href="https://discord.gg/pixico" target="_blank" rel="noopener noreferrer" className={styles.mobileSocialLink}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.037c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.175 13.175 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
                                </svg>
                            </a>
                            <a href="https://youtube.com/@pixico" target="_blank" rel="noopener noreferrer" className={styles.mobileSocialLink}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Auth Modal */}
            <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        </>
    );
}
