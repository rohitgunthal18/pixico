import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Pixico - AI Prompt Library',
        short_name: 'Pixico',
        description: 'Free Gemini prompt copy paste library with 1000+ trending AI photo prompts for image and video generation.',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0f',
        theme_color: '#a855f7',
        orientation: 'portrait-primary',
        categories: ['productivity', 'utilities', 'entertainment'],
        icons: [
            {
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'any'
            },
            {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
            },
            {
                src: '/apple-touch-icon.png',
                sizes: '180x180',
                type: 'image/png',
                purpose: 'any'
            }
        ],
        screenshots: [
            {
                src: '/og-image.png',
                sizes: '1200x630',
                type: 'image/png'
            }
        ]
    };
}
