"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

interface SiteSettings {
    site_name: string;
    site_tagline: string;
    default_meta_title: string;
    default_meta_description: string;
    contact_email: string;
    social_twitter: string;
    social_instagram: string;
    social_discord: string;
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<SiteSettings>({
        site_name: "Pixico",
        site_tagline: "Discover the perfect AI prompts for stunning image and video generation.",
        default_meta_title: "Pixico - AI Image Prompts Library",
        default_meta_description: "Discover thousands of curated AI prompts for Midjourney, FLUX, Stable Diffusion, DALL-E and more.",
        contact_email: "hello@pixico.com",
        social_twitter: "https://twitter.com/pixico",
        social_instagram: "https://instagram.com/pixico",
        social_discord: "https://discord.gg/pixico",
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Settings could be stored in a settings table or localStorage
        // For now, we'll use localStorage as a simple solution
        const savedSettings = localStorage.getItem("siteSettings");
        if (savedSettings) {
            try {
                setSettings(JSON.parse(savedSettings));
            } catch {
                // Use defaults
            }
        }
        setIsLoading(false);
    }, []);

    const handleChange = (field: keyof SiteSettings, value: string) => {
        setSettings({ ...settings, [field]: value });
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);

        try {
            // Save to localStorage
            localStorage.setItem("siteSettings", JSON.stringify(settings));
            setSuccess("Settings saved successfully!");
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError("Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetDefaults = () => {
        if (!confirm("Reset all settings to defaults?")) return;

        const defaults: SiteSettings = {
            site_name: "Pixico",
            site_tagline: "Discover the perfect AI prompts for stunning image and video generation.",
            default_meta_title: "Pixico - AI Image Prompts Library",
            default_meta_description: "Discover thousands of curated AI prompts for Midjourney, FLUX, Stable Diffusion, DALL-E and more.",
            contact_email: "hello@pixico.com",
            social_twitter: "https://twitter.com/pixico",
            social_instagram: "https://instagram.com/pixico",
            social_discord: "https://discord.gg/pixico",
        };
        setSettings(defaults);
        localStorage.setItem("siteSettings", JSON.stringify(defaults));
        setSuccess("Settings reset to defaults");
        setTimeout(() => setSuccess(null), 3000);
    };

    if (isLoading) {
        return (
            <div className={styles.loadingPage}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading settings...</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.headerTitle}>
                        <h1>Settings</h1>
                        <p>Configure site-wide settings and preferences</p>
                    </div>
                </div>
            </header>

            {/* Alerts */}
            {error && (
                <div className={styles.alert + " " + styles.alertError}>
                    <span>{error}</span>
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            {success && (
                <div className={styles.alert + " " + styles.alertSuccess}>
                    <span>{success}</span>
                </div>
            )}

            {/* Settings Form */}
            <div className={styles.settingsGrid}>
                {/* General Settings */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2>General</h2>
                        <p>Basic site information</p>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.formGroup}>
                            <label>Site Name</label>
                            <input
                                type="text"
                                value={settings.site_name}
                                onChange={(e) => handleChange("site_name", e.target.value)}
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Tagline</label>
                            <textarea
                                value={settings.site_tagline}
                                onChange={(e) => handleChange("site_tagline", e.target.value)}
                                className={styles.textarea}
                                rows={2}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Contact Email</label>
                            <input
                                type="email"
                                value={settings.contact_email}
                                onChange={(e) => handleChange("contact_email", e.target.value)}
                                className={styles.input}
                            />
                        </div>
                    </div>
                </div>

                {/* SEO Settings */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2>SEO Defaults</h2>
                        <p>Default meta tags for pages</p>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.formGroup}>
                            <label>Default Meta Title</label>
                            <input
                                type="text"
                                value={settings.default_meta_title}
                                onChange={(e) => handleChange("default_meta_title", e.target.value)}
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Default Meta Description</label>
                            <textarea
                                value={settings.default_meta_description}
                                onChange={(e) => handleChange("default_meta_description", e.target.value)}
                                className={styles.textarea}
                                rows={3}
                            />
                        </div>
                    </div>
                </div>

                {/* Social Links */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2>Social Links</h2>
                        <p>Social media profile URLs</p>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.formGroup}>
                            <label>Twitter / X</label>
                            <input
                                type="url"
                                value={settings.social_twitter}
                                onChange={(e) => handleChange("social_twitter", e.target.value)}
                                className={styles.input}
                                placeholder="https://twitter.com/..."
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Instagram</label>
                            <input
                                type="url"
                                value={settings.social_instagram}
                                onChange={(e) => handleChange("social_instagram", e.target.value)}
                                className={styles.input}
                                placeholder="https://instagram.com/..."
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Discord</label>
                            <input
                                type="url"
                                value={settings.social_discord}
                                onChange={(e) => handleChange("social_discord", e.target.value)}
                                className={styles.input}
                                placeholder="https://discord.gg/..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
                <button className={styles.resetBtn} onClick={handleResetDefaults}>
                    Reset to Defaults
                </button>
                <button className={styles.saveBtn} onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Settings"}
                </button>
            </div>
        </div>
    );
}
