import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./page.module.css";

export const metadata = {
    title: "About Us | Pixico - AI Prompt Library",
    description: "Learn about Pixico, the ultimate AI prompt library for Midjourney, DALL-E, Stable Diffusion, and more.",
};

export default function AboutPage() {
    return (
        <>
            <Header />
            <main className={styles.main}>
                <div className="container">
                    <section className={styles.hero}>
                        <h1 className={styles.title}>About Pixico</h1>
                        <p className={styles.subtitle}>
                            Your ultimate destination for AI-generated art prompts
                        </p>
                    </section>

                    <section className={styles.content}>
                        <div className={styles.card}>
                            <h2>Our Mission</h2>
                            <p>
                                Pixico was created to democratize AI art creation. We believe everyone should have
                                access to high-quality prompts that produce stunning results, whether you&apos;re a
                                professional artist or just getting started with AI image generation.
                            </p>
                        </div>

                        <div className={styles.card}>
                            <h2>What We Offer</h2>
                            <ul>
                                <li>
                                    <strong>Curated Prompt Library</strong> - Thousands of tested prompts for
                                    Midjourney, DALL-E, Stable Diffusion, and other AI models
                                </li>
                                <li>
                                    <strong>Category Organization</strong> - Browse by style, subject, or AI model
                                    to find exactly what you need
                                </li>
                                <li>
                                    <strong>Pixico AI</strong> - Our built-in AI assistant helps you generate
                                    and refine prompts for any creative vision
                                </li>
                                <li>
                                    <strong>Community Driven</strong> - Save your favorites and discover what&apos;s
                                    trending in the AI art community
                                </li>
                            </ul>
                        </div>

                        <div className={styles.card}>
                            <h2>Why Choose Pixico?</h2>
                            <p>
                                With thousands of prompts across dozens of categories, Pixico saves you hours of
                                trial and error. Our prompts are carefully crafted and tested to produce consistent,
                                beautiful results across different AI platforms.
                            </p>
                            <p>
                                Whether you&apos;re creating concept art, character designs, landscapes, or abstract
                                compositions, we have the perfect prompt to bring your vision to life.
                            </p>
                        </div>
                    </section>
                </div>
            </main>
            <Footer />
        </>
    );
}
