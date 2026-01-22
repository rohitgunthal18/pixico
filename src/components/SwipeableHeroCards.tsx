"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import styles from "./SwipeableHeroCards.module.css";

interface TrendingPrompt {
    id: string;
    title: string;
    slug: string;
    image_url: string;
    category: string;
}

// Fallback images if database is empty
const fallbackPrompts: TrendingPrompt[] = [
    { id: "f1", title: "Portrait", slug: "", image_url: "https://picsum.photos/seed/hp1/300/400", category: "Portrait" },
    { id: "f2", title: "Anime", slug: "", image_url: "https://picsum.photos/seed/hp2/300/380", category: "Anime" },
    { id: "f3", title: "Landscape", slug: "", image_url: "https://picsum.photos/seed/hp3/300/420", category: "Landscape" },
    { id: "f4", title: "Concept Art", slug: "", image_url: "https://picsum.photos/seed/hp4/300/400", category: "Concept Art" },
    { id: "f5", title: "3D Render", slug: "", image_url: "https://picsum.photos/seed/hp5/300/380", category: "3D Renders" },
    { id: "f6", title: "Photography", slug: "", image_url: "https://picsum.photos/seed/hp6/300/420", category: "Photography" },
    { id: "f7", title: "Sci-Fi", slug: "", image_url: "https://picsum.photos/seed/hp7/300/400", category: "Sci-Fi" },
    { id: "f8", title: "Fantasy", slug: "", image_url: "https://picsum.photos/seed/hp8/300/380", category: "Fantasy" },
    { id: "f9", title: "Abstract", slug: "", image_url: "https://picsum.photos/seed/hp9/300/420", category: "Abstract" },
    { id: "f10", title: "Retro", slug: "", image_url: "https://picsum.photos/seed/hp10/300/400", category: "Logos & Icons" },
];

export default function SwipeableHeroCards() {
    const [trendingPool, setTrendingPool] = useState<TrendingPrompt[]>(fallbackPrompts);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
    const [isNewCardEntering, setIsNewCardEntering] = useState(false);
    const [isPaused, setIsPaused] = useState(false); // For pausing auto-swipe

    // Drag state
    const [dragState, setDragState] = useState({
        isDragging: false,
        startX: 0,
        currentX: 0,
    });
    const [lastDragState, setLastDragState] = useState<{ x: number; rotate: number; opacity: number } | null>(null);

    const cardRef = useRef<HTMLDivElement>(null);
    const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Clear pause timeout on unmount
    useEffect(() => {
        return () => {
            if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
        };
    }, []);

    // Fetch trending prompts from database
    useEffect(() => {
        const fetchTrendingPrompts = async () => {
            const supabase = createClient();

            const { data, error } = await supabase
                .from("prompts")
                .select(`
                    id, title, slug, image_url,
                    category:categories!category_id(name)
                `)
                .eq("status", "published")
                .not("image_url", "is", null)
                .order("view_count", { ascending: false })
                .limit(20); // Fetch more to filter by aspect ratio

            if (!error && data && data.length > 0) {
                const formattedPrompts = (data as any[]).map((p) => ({
                    id: p.id,
                    title: p.title,
                    slug: p.slug,
                    image_url: p.image_url || "https://picsum.photos/seed/default/300/400",
                    category: (p.category as any)?.name || "Uncategorized",
                }));

                // Filter out landscape images with low aspect ratio
                // We want square (1:1) and portrait (taller than wide)
                const filteredPrompts = await Promise.all(
                    formattedPrompts.map(async (prompt) => {
                        try {
                            const img = document.createElement('img');
                            img.src = prompt.image_url;
                            await new Promise<void>((resolve) => {
                                img.onload = () => resolve();
                                img.onerror = () => resolve();
                            });
                            const aspectRatio = img.width / img.height;
                            // Keep only square (0.9-1.1) and portrait (< 0.9)
                            return aspectRatio <= 1.1 ? prompt : null;
                        } catch {
                            return prompt; // Keep on error
                        }
                    })
                );

                const validPrompts = filteredPrompts.filter((p): p is TrendingPrompt => p !== null).slice(0, 10);
                setTrendingPool(validPrompts.length > 0 ? validPrompts : formattedPrompts.slice(0, 10));
            } else {
                // Use fallback if database is empty
                setTrendingPool(fallbackPrompts);
            }
        };

        fetchTrendingPrompts();
    }, []);

    // Auto-swipe feature - swipe every 2 seconds when not paused
    useEffect(() => {
        if (trendingPool.length === 0 || isPaused || isAnimating) return;

        const autoSwipeInterval = setInterval(() => {
            handleSwipe("left"); // Changed to left swipe
        }, 2000); // 2 seconds

        return () => clearInterval(autoSwipeInterval);
    }, [trendingPool.length, isPaused, isAnimating]);

    // Get current 4 visible cards (4th is hidden but preloaded)
    const getVisibleCards = () => {
        if (trendingPool.length === 0) return [];
        return [
            trendingPool[currentIndex % trendingPool.length],
            trendingPool[(currentIndex + 1) % trendingPool.length],
            trendingPool[(currentIndex + 2) % trendingPool.length],
            trendingPool[(currentIndex + 3) % trendingPool.length], // 4th card preloaded
        ];
    };

    const visibleCards = getVisibleCards();

    // Handle swipe
    const handleSwipe = (direction: "left" | "right", dragRelease?: { x: number; rotate: number; opacity: number }) => {
        if (isAnimating || trendingPool.length === 0) return;

        if (dragRelease) {
            setLastDragState(dragRelease);
        }

        setIsAnimating(true);
        setSwipeDirection(direction);
        setIsNewCardEntering(true); // Trigger smooth fade-in for new bottom card

        // After animation completes, update index
        setTimeout(() => {
            // Both directions now advance the queue to prevent images from "coming back"
            // specifically requested by user feedback
            setCurrentIndex((prev) => (prev + 1) % trendingPool.length);

            setSwipeDirection(null);
            setLastDragState(null); // Clear the last drag state
            setIsAnimating(false);
            setIsNewCardEntering(false);
        }, 300); // Synchronized with CSS animation (0.3s)
    };

    // Mouse/Touch event handlers
    const handleDragStart = (clientX: number) => {
        // Removed isAnimating block to allow instant turnaround during fast manual swipes


        // Stop any pending resume timer
        if (pauseTimeoutRef.current) {
            clearTimeout(pauseTimeoutRef.current);
            pauseTimeoutRef.current = null;
        }

        setIsPaused(true); // Explicitly pause auto-swipe
        setDragState({
            isDragging: true,
            startX: clientX,
            currentX: clientX,
        });
    };

    const handleDragMove = (clientX: number) => {
        if (!dragState.isDragging) return;
        setDragState((prev) => ({ ...prev, currentX: clientX }));
    };

    const handleDragEnd = () => {
        if (!dragState.isDragging) return;

        const dragDistance = dragState.currentX - dragState.startX;
        const threshold = 15; // Further reduced from 30 for ultra-sensitive flick recognition

        if (Math.abs(dragDistance) > threshold) {
            // Capture final state for seamless animation handover
            const finalX = dragDistance;
            const finalRotate = dragDistance * 0.08;
            const finalOpacity = Math.max(0.3, 1 - Math.abs(dragDistance) / 400);

            handleSwipe(dragDistance < 0 ? "left" : "right", {
                x: finalX,
                rotate: finalRotate,
                opacity: finalOpacity
            });
        }

        setDragState({
            isDragging: false,
            startX: 0,
            currentX: 0,
        });

        // Start/Reset the 5-second idle resume timer
        if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = setTimeout(() => {
            setIsPaused(false);
            pauseTimeoutRef.current = null;
        }, 5000); // 5 seconds of idle before resuming auto-swipe
    };

    // Mouse events
    const onMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        handleDragStart(e.clientX);
    };

    const onMouseMove = (e: React.MouseEvent) => {
        handleDragMove(e.clientX);
    };

    const onMouseUp = () => {
        handleDragEnd();
    };

    const onMouseLeave = () => {
        if (dragState.isDragging) {
            handleDragEnd();
        }
    };

    // Touch events
    const onTouchStart = (e: React.TouchEvent) => {
        handleDragStart(e.touches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        handleDragMove(e.touches[0].clientX);
    };

    const onTouchEnd = () => {
        handleDragEnd();
    };

    // Calculate drag offset for visual feedback
    const dragOffset = dragState.isDragging ? dragState.currentX - dragState.startX : 0;

    if (trendingPool.length === 0) {
        return null; // Loading state
    }

    return (
        <>
            <div
                className={styles.cardsContainer}
            >
                {visibleCards.map((prompt, index) => {
                    const isTopCard = index === 0;
                    const isDraggingTopCard = isTopCard && dragState.isDragging;
                    const isSwipingTopCard = isTopCard && swipeDirection;
                    const isNewBottomCard = index === 3 && isNewCardEntering; // 4th card

                    let cardClass = styles.card;
                    if (index === 0) cardClass += ` ${styles.cardTop}`;
                    if (index === 1) cardClass += ` ${styles.cardMiddle}`;
                    if (index === 2) cardClass += ` ${styles.cardBottom}`;
                    if (index === 3) cardClass += ` ${styles.cardHidden}`;

                    // Disable transitions during any active movement (drag or animation)
                    if (isAnimating || dragState.isDragging) {
                        cardClass += ` ${styles.noTransition}`;
                    }

                    // Apply animation classes
                    if (isSwipingTopCard) {
                        cardClass += swipeDirection === "left" ? ` ${styles.swipeLeft}` : ` ${styles.swipeRight}`;
                    } else if (isAnimating && index === 1) {
                        cardClass += ` ${styles.moveToTop}`;
                    } else if (isAnimating && index === 2) {
                        cardClass += ` ${styles.moveToMiddle}`;
                    } else if (isAnimating && index === 3) {
                        cardClass += ` ${styles.moveToBottom}`;
                    }

                    // Add smooth fade-in for new 4th card
                    if (isNewBottomCard) {
                        cardClass += ` ${styles.fadeInHidden}`;
                    }

                    return (
                        <div
                            key={prompt.id}
                            ref={isTopCard ? cardRef : null}
                            className={cardClass}
                            style={{
                                ...(isDraggingTopCard
                                    ? {
                                        transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.08}deg) scale(1)`,
                                        opacity: Math.max(0.3, 1 - Math.abs(dragOffset) / 400),
                                        cursor: "grabbing",
                                        transition: "none", // Prevent laggy thumb following
                                    }
                                    : {}),
                                ...(lastDragState && isTopCard && isAnimating ? {
                                    "--drag-x": `${lastDragState.x}px`,
                                    "--drag-rotate": `${lastDragState.rotate}deg`,
                                    "--drag-opacity": lastDragState.opacity,
                                } as React.CSSProperties : {}),
                                willChange: "transform, opacity",
                            }}
                            onMouseDown={isTopCard ? onMouseDown : undefined}
                            onMouseMove={isTopCard ? onMouseMove : undefined}
                            onMouseUp={isTopCard ? onMouseUp : undefined}
                            onMouseLeave={isTopCard ? onMouseLeave : undefined}
                            onTouchStart={isTopCard ? onTouchStart : undefined}
                            onTouchMove={isTopCard ? onTouchMove : undefined}
                            onTouchEnd={isTopCard ? onTouchEnd : undefined}
                        >
                            <Image
                                src={prompt.image_url}
                                alt={prompt.title}
                                width={300}
                                height={400}
                                className={styles.cardImage}
                                sizes="(max-width: 480px) 115px, (max-width: 768px) 160px, (max-width: 1024px) 180px, 220px"
                                priority={index < 3}
                                loading={index < 3 ? "eager" : "lazy"}
                                {...(index === 0 ? { fetchPriority: "high" } : {})}
                            />
                            <div className={styles.cardOverlay}>
                                <span className={styles.cardCategory}>{prompt.category}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
