"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AIBots.module.css";

interface Message {
    id: number;
    text: string;
    sender: "bot" | "user";
}

export default function AIBots() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: "Hi! How can I help you today?", sender: "bot" }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Handle Visibility on Scroll
    useEffect(() => {
        const handleScroll = () => {
            // Show bots when scrolled down 300px (past hero)
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
                setIsOpen(false); // Auto-close chat if they scroll back up
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Prevent background scrolling on mobile when chat is open
    useEffect(() => {
        // Only apply on mobile devices
        const isMobile = window.innerWidth <= 768;

        if (isOpen && isMobile) {
            // Store original overflow value
            const originalOverflow = document.body.style.overflow;
            // Prevent background scrolling
            document.body.style.overflow = 'hidden';

            // Cleanup: restore original overflow when chat closes
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isOpen]);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userText = inputValue.trim();
        const userMsg: Message = { id: Date.now(), text: userText, sender: "user" };
        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setIsLoading(true);

        try {
            const response = await fetch('/api/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userText })
            });

            const data = await response.json();

            const botMsg: Message = {
                id: Date.now() + 1,
                text: data.response || "Sorry, I'm having some trouble. Please try again later.",
                sender: "bot"
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            const errorMsg: Message = {
                id: Date.now() + 1,
                text: "Failed to connect. Please check your internet and try again.",
                sender: "bot"
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    // Hide on /generate page (Pixico AI chat page) or admin routes to prevent overlap/interference
    if (pathname === "/generate" || pathname.startsWith("/admin")) return null;

    if (!isVisible) return null;

    return (
        <div className={styles.botContainer}>
            {/* Support Chat Window */}
            {isOpen && (
                <div className={styles.chatWindow}>
                    <div className={styles.chatHeader}>
                        <div className={styles.headerInfo}>
                            <div className={styles.botAvatar}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
                                    <path d="M12 6v6l4 2" />
                                </svg>
                            </div>
                            <div className={styles.status}>
                                <span>Pixico Support</span>
                                <span>Online</span>
                            </div>
                        </div>
                        <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className={styles.chatBody}>
                        {messages.map(msg => (
                            <div key={msg.id} className={`${styles.message} ${msg.sender === "bot" ? styles.botMsg : styles.userMsg}`}>
                                {msg.text}
                            </div>
                        ))}
                        {isLoading && (
                            <div className={styles.typing}>
                                <div className={styles.typingDot}></div>
                                <div className={styles.typingDot}></div>
                                <div className={styles.typingDot}></div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className={styles.chatInput}>
                        <input
                            type="text"
                            placeholder="Type your message..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSend()}
                        />
                        <button className={styles.sendBtn} onClick={handleSend} disabled={isLoading}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Horizontal Alignment for Mobile Buttons */}
            <div className={styles.actionRow}>
                <Link href="/generate" className={styles.promptBot}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className={styles.magicIcon}>
                        <path d="M12 2l1.5 8.5L22 12l-8.5 1.5L12 22l-1.5-8.5L2 12l8.5-1.5L12 2z" />
                    </svg>
                    Pixico AI
                </Link>

                <div className={styles.botIcon} onClick={() => setIsOpen(!isOpen)}>
                    <div className={styles.badge} />
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        <circle cx="9" cy="9" r="1" fill="currentColor" />
                        <circle cx="15" cy="9" r="1" fill="currentColor" />
                        <path d="M9 13c1.5 1 4.5 1 6 0" strokeLinecap="round" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
