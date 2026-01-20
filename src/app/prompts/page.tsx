"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PromptGrid from "@/components/PromptGrid";
import styles from "./page.module.css";

export default function AllPromptsPage() {
    return (
        <>
            <Header />
            <main className={styles.main}>
                <div className="container">
                    <PromptGrid
                        title="All Prompts"
                        isPageTitle={true}
                        showFilters={true}
                        showCategoryFilter={false}
                        showViewAll={false}
                        sectionType="all"
                    />
                </div>
            </main>
            <Footer />
        </>
    );
}
