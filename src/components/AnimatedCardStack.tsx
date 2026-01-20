"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useSpring, animated, config } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import styles from './AnimatedCardStack.module.css';

interface TrendingPrompt {
    id: string;
    title: string;
    slug: string;
    image_url: string;
    category_name: string;
}

interface AnimatedCardStackProps {
    prompts: TrendingPrompt[];
}

const ROTATION_RANGE = 15; // degrees
const SCALE_RANGE = [0.85, 0.93, 1]; // bottom, middle, top
const SWIPE_THRESHOLD = 100; // px
const SWIPE_VELOCITY_THRESHOLD = 0.3; // px/ms

export default function AnimatedCardStack({ prompts }: AnimatedCardStackProps) {
    const [cards, setCards] = useState<TrendingPrompt[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const autoRotateRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize cards (show 3 at a time from prompts array)
    useEffect(() => {
        if (prompts.length > 0) {
            const initialCards = [
                prompts[0],
                prompts[1 % prompts.length],
                prompts[2 % prompts.length],
            ];
            setCards(initialCards);
        }
    }, [prompts]);

    // Move to next card
    const nextCard = useCallback(() => {
        if (prompts.length === 0) return;

        setCurrentIndex((prev) => {
            const newIndex = (prev + 1) % prompts.length;

            // Update cards array - remove first, shift others, add new one at end
            setCards((currentCards) => {
                const newCardIndex = (newIndex + 2) % prompts.length;
                return [
                    currentCards[1],
                    currentCards[2],
                    prompts[newCardIndex],
                ];
            });

            return newIndex;
        });
    }, [prompts]);

    // Auto-rotation
    useEffect(() => {
        if (isPaused || prompts.length === 0) {
            if (autoRotateRef.current) {
                clearInterval(autoRotateRef.current);
                autoRotateRef.current = null;
            }
            return;
        }

        autoRotateRef.current = setInterval(() => {
            nextCard();
        }, 4000); // 4 seconds

        return () => {
            if (autoRotateRef.current) {
                clearInterval(autoRotateRef.current);
            }
        };
    }, [isPaused, nextCard, prompts.length]);

    // Pause auto-rotation on interaction
    const handleInteractionStart = () => {
        setIsPaused(true);
    };

    const handleInteractionEnd = () => {
        // Resume after 2 seconds
        setTimeout(() => {
            setIsPaused(false);
        }, 2000);
    };

    // Manual navigation
    const handlePrevious = () => {
        handleInteractionStart();
        // TODO: Implement previous card logic
        handleInteractionEnd();
    };

    const handleNext = () => {
        handleInteractionStart();
        nextCard();
        handleInteractionEnd();
    };

    if (cards.length === 0) {
        return (
            <div className={styles.cardStack} style={{ height: '400px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'var(--text-secondary)'
                }}>
                    Loading amazing prompts...
                </div>
            </div>
        );
    }

    return (
        <div className={styles.cardStack}>
            {/* Render 3 cards in stack */}
            {cards.map((prompt, index) => (
                <SwipeableCard
                    key={`${prompt.id}-${index}`}
                    prompt={prompt}
                    index={index}
                    onSwipeComplete={index === 0 ? nextCard : undefined}
                    onInteractionStart={handleInteractionStart}
                    onInteractionEnd={handleInteractionEnd}
                />
            ))}

            {/* Navigation Arrows */}
            <div className={styles.navArrows}>
                <button
                    className={styles.navArrow}
                    onClick={handlePrevious}
                    aria-label="Previous card"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <button
                    className={styles.navArrow}
                    onClick={handleNext}
                    aria-label="Next card"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>

            {/* Progress Indicator */}
            <div className={styles.progressIndicator}>
                {prompts.slice(0, Math.min(prompts.length, 10)).map((_, i) => (
                    <div
                        key={i}
                        className={`${styles.progressDot} ${i === currentIndex % prompts.length ? styles.active : ''}`}
                    />
                ))}
            </div>
        </div>
    );
}

// Individual Swipeable Card Component
interface SwipeableCardProps {
    prompt: TrendingPrompt;
    index: number;
    onSwipeComplete?: () => void;
    onInteractionStart?: () => void;
    onInteractionEnd?: () => void;
}

function SwipeableCard({
    prompt,
    index,
    onSwipeComplete,
    onInteractionStart,
    onInteractionEnd
}: SwipeableCardProps) {
    const [gone, setGone] = useState(false);

    // Card position based on stack index
    const getCardStyle = (idx: number) => {
        const positions = [
            { x: 0, y: 60, z: 30, scale: SCALE_RANGE[2], rotation: -5 }, // Top (left)
            { x: 130, y: 0, z: 20, scale: SCALE_RANGE[1], rotation: 0 }, // Middle (center)
            { x: 260, y: 70, z: 10, scale: SCALE_RANGE[0], rotation: 5 }, // Bottom (right)
        ];
        return positions[idx] || positions[2];
    };

    const cardStyle = getCardStyle(index);

    // Spring animation
    const [{ x, y, rotateZ, scale, opacity }, api] = useSpring(() => ({
        x: cardStyle.x,
        y: cardStyle.y,
        rotateZ: cardStyle.rotation,
        scale: cardStyle.scale,
        opacity: index === 0 ? 1 : index === 1 ? 0.8 : 0.5,
        config: config.wobbly,
    }));

    // Update position when index changes
    useEffect(() => {
        const newStyle = getCardStyle(index);
        api.start({
            x: newStyle.x,
            y: newStyle.y,
            rotateZ: newStyle.rotation,
            scale: newStyle.scale,
            opacity: index === 0 ? 1 : index === 1 ? 0.8 : 0.5,
        });
    }, [index, api]);

    // Drag gesture (only for top card)
    const bind = useDrag(
        ({ active, movement: [mx, my], direction: [xDir], velocity: [vx] }) => {
            if (index !== 0) return; // Only top card is draggable

            const trigger = Math.abs(mx) > SWIPE_THRESHOLD || Math.abs(vx) > SWIPE_VELOCITY_THRESHOLD;

            if (!active && trigger) {
                // Card swiped!
                setGone(true);
                const flyOutX = (200 + window.innerWidth) * xDir;
                api.start({
                    x: flyOutX,
                    rotateZ: mx > 0 ? ROTATION_RANGE : -ROTATION_RANGE,
                    opacity: 0,
                    config: { ...config.default, friction: 35 },
                    onRest: () => {
                        onSwipeComplete?.();
                        setGone(false);
                    },
                });
            } else {
                // Card being dragged or released without trigger
                api.start({
                    x: active ? mx : cardStyle.x,
                    y: active ? cardStyle.y + my * 0.1 : cardStyle.y,
                    rotateZ: active ? (mx / 100) * ROTATION_RANGE : cardStyle.rotation,
                    scale: active ? 1.05 : cardStyle.scale,
                    opacity: 1,
                    config: active ? { ...config.stiff, friction: 50 } : config.wobbly,
                });
            }

            // Handle interaction callbacks
            if (active && onInteractionStart) {
                onInteractionStart();
            } else if (!active && onInteractionEnd) {
                onInteractionEnd();
            }
        },
        {
            filterTaps: true,
            from: () => [x.get(), y.get()],
        }
    );

    return (
        <animated.div
            {...(index === 0 ? bind() : {})}
            className={styles.card}
            style={{
                x,
                y,
                rotateZ,
                scale,
                opacity,
                zIndex: 10 - index,
            }}
        >
            <div className={styles.cardInner}>
                <Image
                    src={prompt.image_url}
                    alt={prompt.title}
                    width={220}
                    height={300}
                    className={styles.cardImage}
                    draggable={false}
                    priority={index === 0}
                />
                <div className={styles.cardOverlay}>
                    <span className={styles.cardCategory}>{prompt.category_name}</span>
                    <h3 className={styles.cardTitle}>{prompt.title}</h3>
                </div>
            </div>
        </animated.div>
    );
}
