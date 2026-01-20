"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./page.module.css";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        message: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus("idle");

        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("contact_queries")
                .insert({
                    name: formData.name,
                    email: formData.email,
                    message: formData.message,
                    status: "new",
                });

            if (error) throw error;

            setSubmitStatus("success");
            setFormData({ name: "", email: "", message: "" });
        } catch {
            setSubmitStatus("error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Header />
            <main className={styles.main}>
                <div className="container">
                    {/* Hero Section */}
                    <section className={styles.hero}>
                        <h1 className={styles.title}>Get In Touch</h1>
                        <p className={styles.subtitle}>
                            Have questions or feedback? We&apos;d love to hear from you.
                        </p>
                    </section>

                    {/* Main Content */}
                    <div className={styles.content}>
                        {/* Contact Info Column */}
                        <aside className={styles.infoColumn}>
                            <div className={styles.infoCard}>
                                <div className={styles.infoIcon}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                </div>
                                <div>
                                    <h3>Email</h3>
                                    <a href="mailto:contact.pixico@gmail.com">contact.pixico@gmail.com</a>
                                </div>
                            </div>

                            <div className={styles.infoCard}>
                                <div className={styles.infoIcon}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3>Phone</h3>
                                    <a href="tel:+917218616190">+91 72186 16190</a>
                                </div>
                            </div>

                            <div className={styles.infoCard}>
                                <div className={styles.infoIcon}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                </div>
                                <div>
                                    <h3>Address</h3>
                                    <p>Shivkrupa Heights, 102, Mokarwadi<br />Pune, Maharashtra</p>
                                </div>
                            </div>

                            <div className={styles.infoCard}>
                                <div className={styles.infoIcon}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                </div>
                                <div>
                                    <h3>Response Time</h3>
                                    <p>Within 24 hours</p>
                                </div>
                            </div>

                        </aside>

                        {/* Form Column */}
                        <div className={styles.formColumn}>
                            {submitStatus === "success" ? (
                                <div className={styles.successPanel}>
                                    <div className={styles.successIcon}>
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                    </div>
                                    <h2>Message Sent!</h2>
                                    <p>Thank you for reaching out. We&apos;ll get back to you within <strong>24 hours</strong>.</p>
                                    <button onClick={() => setSubmitStatus("idle")} className={styles.newMsgBtn}>
                                        Send Another Message
                                    </button>
                                </div>
                            ) : (
                                <form className={styles.form} onSubmit={handleSubmit}>
                                    <h2 className={styles.formTitle}>Send a Message</h2>

                                    {submitStatus === "error" && (
                                        <div className={styles.errorMessage}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <path d="M12 8v4M12 16h.01" />
                                            </svg>
                                            Something went wrong. Please try again.
                                        </div>
                                    )}

                                    <div className={styles.field}>
                                        <label htmlFor="name">Name</label>
                                        <input
                                            type="text"
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            placeholder="Your name"
                                        />
                                    </div>

                                    <div className={styles.field}>
                                        <label htmlFor="email">Email</label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                            placeholder="your@email.com"
                                        />
                                    </div>

                                    <div className={styles.field}>
                                        <label htmlFor="message">Message</label>
                                        <textarea
                                            id="message"
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            required
                                            placeholder="How can we help you?"
                                            rows={4}
                                        />
                                    </div>

                                    <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <div className={styles.spinner}></div>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                                                </svg>
                                                Send Message
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
