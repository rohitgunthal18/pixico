import { createBrowserClient } from '@supabase/ssr';

// Singleton instance - prevents multiple clients and auth race conditions
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
    // Return existing instance if available (singleton pattern)
    if (supabaseInstance) {
        return supabaseInstance;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        // Fallback for build time - don't cache placeholder client
        return createBrowserClient(
            'https://placeholder.supabase.co',
            'placeholder-key'
        );
    }

    // Create and cache the singleton instance
    supabaseInstance = createBrowserClient(url, key);
    return supabaseInstance;
}
