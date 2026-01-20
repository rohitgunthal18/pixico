import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "@/components/SitePage.module.css";

async function getPageData(slug: string) {
    const supabase = await createClient();
    const { data } = await supabase
        .from("site_pages")
        .select("*")
        .eq("slug", slug)
        .single();
    return data;
}

export default async function Page(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    const page = await getPageData(params.slug);

    if (!page) {
        return (
            <>
                <Header />
                <main className={styles.errorPage}>
                    <div className="container">
                        <h1>Page Not Found</h1>
                        <p>The page you are looking for does not exist.</p>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <main className={styles.main}>
                <div className="container">
                    <section className={styles.hero}>
                        <h1 className={styles.title}>{page.title}</h1>
                        {page.meta_description && (
                            <p className={styles.subtitle}>{page.meta_description}</p>
                        )}
                    </section>

                    <section className={styles.content}>
                        {page.content.sections?.map((section: any, index: number) => (
                            <div key={index} className={styles.card}>
                                <h2>{section.title}</h2>
                                <p>{section.text}</p>
                            </div>
                        ))}

                        {page.content.faqs?.map((faq: any, index: number) => (
                            <div key={index} className={styles.card}>
                                <h2>{faq.question}</h2>
                                <p>{faq.answer}</p>
                            </div>
                        ))}
                    </section>
                </div>
            </main>
            <Footer />
        </>
    );
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    const page = await getPageData(params.slug);
    if (!page) return { title: 'Page Not Found' };

    return {
        title: page.meta_title || page.title,
        description: page.meta_description,
    };
}
