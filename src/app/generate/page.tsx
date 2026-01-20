"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import styles from "./page.module.css";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    command?: string;
    created_at?: string;
}

interface Conversation {
    id: string;
    title: string;
    updated_at: string;
}

type CommandType = "chat" | "image" | "video";

const COMMANDS: { id: CommandType; label: string; icon: React.ReactNode; description: string }[] = [
    {
        id: "chat",
        label: "Chat",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        ),
        description: "General conversation"
    },
    {
        id: "image",
        label: "Image Prompt",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
            </svg>
        ),
        description: "Generate image prompts"
    },
    {
        id: "video",
        label: "Video Prompt",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
        ),
        description: "Generate video prompts"
    },
];

export default function GeneratePage() {
    const { user, isLoading: authLoading } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedCommand, setSelectedCommand] = useState<CommandType>("image");
    const [commandDropdownOpen, setCommandDropdownOpen] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Prompt usage limit for non-logged-in users
    const [showAuthModal, setShowAuthModal] = useState(false);
    const FREE_PROMPT_LIMIT = 3;

    // Parse prompts from AI response
    const parsePrompts = (content: string): { intro: string; prompts: { id: number; text: string }[]; outro: string } => {
        const prompts: { id: number; text: string }[] = [];
        let intro = content;
        let outro = '';

        // Extract prompts using regex
        const promptRegex = /---PROMPT\s*(\d+)---([\s\S]*?)---END---/gi;
        let match;
        let lastIndex = 0;
        let firstMatchStart = -1;

        while ((match = promptRegex.exec(content)) !== null) {
            if (firstMatchStart === -1) {
                firstMatchStart = match.index;
                intro = content.substring(0, firstMatchStart).trim();
            }
            prompts.push({
                id: parseInt(match[1]) || prompts.length + 1,
                text: match[2].trim()
            });
            lastIndex = match.index + match[0].length;
        }

        if (lastIndex > 0) {
            outro = content.substring(lastIndex).trim();
        }

        return { intro, prompts, outro };
    };

    // Copy prompt with feedback
    const copyPromptToClipboard = (text: string, promptId: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(promptId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Load conversations on mount
    useEffect(() => {
        if (user) {
            loadConversations();
        }
    }, [user]);

    // Scroll to bottom on new messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
        }
    }, [inputValue]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setCommandDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loadConversations = async () => {
        try {
            const response = await fetch("/api/chat");
            const data = await response.json();
            if (data.conversations) {
                setConversations(data.conversations);
            }
        } catch (error) {
            console.error("Failed to load conversations:", error);
        }
    };

    const loadConversation = async (conversationId: string) => {
        try {
            const response = await fetch(`/api/chat?conversationId=${conversationId}`);
            const data = await response.json();
            if (data.messages) {
                setMessages(data.messages);
                setCurrentConversationId(conversationId);
                setSidebarOpen(false);
            }
        } catch (error) {
            console.error("Failed to load conversation:", error);
        }
    };

    const startNewConversation = () => {
        setMessages([]);
        setCurrentConversationId(null);
        setSidebarOpen(false);
    };

    const deleteConversation = async (conversationId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await fetch(`/api/chat?conversationId=${conversationId}`, {
                method: "DELETE"
            });
            setConversations(prev => prev.filter(c => c.id !== conversationId));
            if (currentConversationId === conversationId) {
                startNewConversation();
            }
        } catch (error) {
            console.error("Failed to delete conversation:", error);
        }
    };

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;

        // Check usage limit for non-logged-in users
        if (!user) {
            const usageKey = 'pixico_ai_usage_count';
            const currentUsage = parseInt(localStorage.getItem(usageKey) || '0', 10);

            if (currentUsage >= FREE_PROMPT_LIMIT) {
                setShowAuthModal(true);
                return;
            }
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: inputValue.trim(),
            command: selectedCommand
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue("");
        setIsLoading(true);

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage.content,
                    conversationId: currentConversationId,
                    command: selectedCommand
                })
            });

            const data = await response.json();

            if (data.error) {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: "assistant",
                    content: `Error: ${data.error}`
                }]);
            } else {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: "assistant",
                    content: data.response,
                    command: selectedCommand
                }]);

                if (data.conversationId && !currentConversationId) {
                    setCurrentConversationId(data.conversationId);
                    loadConversations();
                }

                // Increment usage count for non-logged-in users
                if (!user) {
                    const usageKey = 'pixico_ai_usage_count';
                    const currentUsage = parseInt(localStorage.getItem(usageKey) || '0', 10);
                    localStorage.setItem(usageKey, (currentUsage + 1).toString());
                }
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: "assistant",
                content: "Sorry, something went wrong. Please try again."
            }]);
        }

        setIsLoading(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return "Today";
        if (days === 1) return "Yesterday";
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString();
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const getCommandIcon = (command: CommandType) => {
        return COMMANDS.find(c => c.id === command)?.icon || (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        );
    };

    return (
        <div className={styles.pageWrapper}>
            <main className={styles.main}>
                {/* Sidebar */}
                <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
                    <div className={styles.sidebarHeader}>
                        <button className={styles.newChatBtn} onClick={startNewConversation}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            New Chat
                        </button>
                        <button className={styles.closeSidebar} onClick={() => setSidebarOpen(false)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className={styles.conversationList}>
                        {!user && !authLoading && (
                            <div className={styles.loginPrompt}>
                                <p>Sign in to save your chat history</p>
                            </div>
                        )}
                        {conversations.map(conv => (
                            <div
                                key={conv.id}
                                className={`${styles.conversationItem} ${currentConversationId === conv.id ? styles.active : ""}`}
                                onClick={() => loadConversation(conv.id)}
                            >
                                <div className={styles.conversationInfo}>
                                    <span className={styles.conversationTitle}>{conv.title}</span>
                                    <span className={styles.conversationDate}>{formatDate(conv.updated_at)}</span>
                                </div>
                                <button
                                    className={styles.deleteBtn}
                                    onClick={(e) => deleteConversation(conv.id, e)}
                                    title="Delete conversation"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Sidebar Overlay (Mobile) */}
                {sidebarOpen && <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}

                {/* Chat Area */}
                <div className={styles.chatContainer}>
                    {/* Main Chat Header */}
                    <div className={styles.chatHeader}>
                        <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)} title="Open Sidebar">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                        <div className={styles.chatTitle}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2l1.5 8.5L22 12l-8.5 1.5L12 22l-1.5-8.5L2 12l8.5-1.5L12 2z" />
                            </svg>
                            <span>Pixico AI</span>
                        </div>
                        <Link href="/" className={styles.backBtnHeader} title="Back to Home">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                        </Link>
                    </div>

                    {/* Messages Area */}
                    <div className={styles.messagesArea}>
                        {messages.length === 0 ? (
                            <div className={styles.welcomeScreen}>
                                <div className={styles.welcomeIcon}>
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2l1.5 8.5L22 12l-8.5 1.5L12 22l-1.5-8.5L2 12l8.5-1.5L12 2z" />
                                    </svg>
                                </div>
                                <h1 className={styles.welcomeTitle}>Pixico AI</h1>
                                <p className={styles.welcomeSubtitle}>Your AI-powered prompt engineering assistant</p>

                                <div className={styles.modeCards}>
                                    {COMMANDS.map(cmd => (
                                        <button
                                            key={cmd.id}
                                            className={`${styles.modeCard} ${selectedCommand === cmd.id ? styles.modeCardActive : ""}`}
                                            onClick={() => setSelectedCommand(cmd.id)}
                                        >
                                            <span className={styles.modeIcon}>{cmd.icon}</span>
                                            <span className={styles.modeLabel}>{cmd.label}</span>
                                            <span className={styles.modeDesc}>{cmd.description}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className={styles.suggestions}>
                                    <button
                                        className={styles.suggestionBtn}
                                        onClick={() => setInputValue("Create a prompt for a cyberpunk city at night")}
                                    >
                                        <span>🌃</span> Cyberpunk city
                                    </button>
                                    <button
                                        className={styles.suggestionBtn}
                                        onClick={() => setInputValue("Generate a portrait prompt with dramatic lighting")}
                                    >
                                        <span>👤</span> Dramatic portrait
                                    </button>
                                    <button
                                        className={styles.suggestionBtn}
                                        onClick={() => setInputValue("Help me create a fantasy landscape prompt")}
                                    >
                                        <span>🏔️</span> Fantasy landscape
                                    </button>
                                    <button
                                        className={styles.suggestionBtn}
                                        onClick={() => setInputValue("I need a product photography prompt")}
                                    >
                                        <span>📸</span> Product photo
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.messagesList}>
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`${styles.message} ${styles[msg.role]}`}>
                                        <div className={styles.messageAvatar}>
                                            {msg.role === "assistant" ? (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 2l1.5 8.5L22 12l-8.5 1.5L12 22l-1.5-8.5L2 12l8.5-1.5L12 2z" />
                                                </svg>
                                            ) : (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="8" r="4" />
                                                    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className={styles.messageContent}>
                                            {msg.role === "assistant" ? (() => {
                                                const { intro, prompts, outro } = parsePrompts(msg.content);
                                                if (prompts.length === 0) {
                                                    return (
                                                        <>
                                                            <div className={styles.messageText}>{msg.content}</div>
                                                            <button
                                                                className={styles.copyBtn}
                                                                onClick={() => copyPromptToClipboard(msg.content, msg.id)}
                                                                title="Copy response"
                                                            >
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                                </svg>
                                                                {copiedId === msg.id ? "Copied!" : "Copy"}
                                                            </button>
                                                        </>
                                                    );
                                                }
                                                return (
                                                    <div className={styles.parsedResponse}>
                                                        {intro && <div className={styles.messageText}>{intro}</div>}
                                                        {prompts.map((prompt) => {
                                                            const promptKey = `${msg.id}-prompt-${prompt.id}`;
                                                            return (
                                                                <div key={promptKey} className={styles.promptBlock}>
                                                                    <div className={styles.promptHeader}>
                                                                        <span className={styles.promptLabel}>✨ Prompt {prompt.id}</span>
                                                                        <button
                                                                            className={`${styles.promptCopyBtn} ${copiedId === promptKey ? styles.promptCopied : ''}`}
                                                                            onClick={() => copyPromptToClipboard(prompt.text, promptKey)}
                                                                        >
                                                                            {copiedId === promptKey ? (
                                                                                <>
                                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                        <polyline points="20 6 9 17 4 12" />
                                                                                    </svg>
                                                                                    Copied!
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                                                    </svg>
                                                                                    Copy
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                    <div className={styles.promptText}>{prompt.text}</div>
                                                                </div>
                                                            );
                                                        })}
                                                        {outro && <div className={styles.messageText}>{outro}</div>}
                                                    </div>
                                                );
                                            })() : (
                                                <div className={styles.messageText}>{msg.content}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className={`${styles.message} ${styles.assistant}`}>
                                        <div className={styles.messageAvatar}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2l1.5 8.5L22 12l-8.5 1.5L12 22l-1.5-8.5L2 12l8.5-1.5L12 2z" />
                                            </svg>
                                        </div>
                                        <div className={styles.messageContent}>
                                            <div className={styles.typingIndicator}>
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className={styles.inputArea}>
                        {/* Command Selector */}
                        <div className={styles.commandSelector} ref={dropdownRef}>
                            <button
                                className={styles.commandBtn}
                                onClick={() => setCommandDropdownOpen(!commandDropdownOpen)}
                            >
                                <span className={styles.commandIcon}>{getCommandIcon(selectedCommand)}</span>
                                <span className={styles.commandLabel}>
                                    {COMMANDS.find(c => c.id === selectedCommand)?.label}
                                </span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={commandDropdownOpen ? styles.chevronUp : ""}>
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                            </button>
                            {commandDropdownOpen && (
                                <div className={styles.commandDropdown}>
                                    {COMMANDS.map(cmd => (
                                        <button
                                            key={cmd.id}
                                            className={`${styles.commandOption} ${selectedCommand === cmd.id ? styles.commandOptionActive : ""}`}
                                            onClick={() => {
                                                setSelectedCommand(cmd.id);
                                                setCommandDropdownOpen(false);
                                            }}
                                        >
                                            <span className={styles.commandOptionIcon}>{cmd.icon}</span>
                                            <div className={styles.commandOptionText}>
                                                <span className={styles.commandOptionLabel}>{cmd.label}</span>
                                                <span className={styles.commandOptionDesc}>{cmd.description}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={styles.inputWrapper}>
                            <textarea
                                ref={textareaRef}
                                className={styles.input}
                                placeholder={`Describe what you want to create...`}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={1}
                                disabled={isLoading}
                                suppressHydrationWarning
                            />
                            <button
                                className={styles.sendBtn}
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isLoading}
                            >
                                {isLoading ? (
                                    <div className={styles.sendSpinner}></div>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        <p className={styles.disclaimer}>
                            Pixico AI helps create prompts for AI image generators. Always review generated prompts.
                        </p>
                    </div>
                </div>
            </main>

            {/* Auth Modal for usage limit */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                contextMessage="Sign in to continue using Pixico AI"
            />
        </div>
    );
}
