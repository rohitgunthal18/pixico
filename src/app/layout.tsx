import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import JsonLd from "@/components/JsonLd";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-inter"
});


export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://pixico-w3us.vercel.app'),
  title: {
    default: "Pixico - #1 Gemini Prompt Copy Paste Library | Free AI Photo Prompts",
    template: "%s | Pixico AI Prompts",
  },
  description:
    "Free Gemini prompt copy paste library with 1000+ trending AI photo prompts. Get instant access to couple prompts, saree prompts, retro styles for Google Gemini AI. Copy-paste and create stunning images now!",
  keywords: [
    // Tier 1 - Core Explosive Growth (4000%+ increase)
    "gemini",
    "prompt gemini",
    "gemini prompt",
    "gemini ai prompt",
    "ai gemini prompt",
    "prompt for gemini",
    "google gemini prompt",
    "google gemini",
    "gemini ai",
    "ai gemini",
    "prompt ai",

    // Tier 2 - Copy-Paste Intent (Breakout Keywords)
    "gemini prompt copy paste",
    "couple prompt gemini",
    "couple gemini prompt",
    "gemini ai prompt copy paste",
    "gemini ai photo prompt copy paste",
    "gemini photo editing prompt",
    "gemini trending photo prompt",
    "google gemini ai photo prompt",
    "gemini ai couple photo prompt copy paste",
    "gemini ai photo prompt copy paste trending",

    // Photo Generation (High Volume)
    "gemini photo prompt",
    "gemini ai photo",
    "gemini ai photo prompt",
    "photo prompt",
    "ai photo prompt",
    "gemini ai couple photo prompt",
    "gemini couple photo prompt",
    "google gemini ai photo",
    "gemini boy photo prompt",
    "gemini prompt for photo editing",
    "gemini ai photo editor prompt",
    "gemini ai photo editor",

    // Specific/Niche Prompts (Long-tail, High Conversion)
    "gemini saree prompt",
    "saree prompt",
    "nano banana prompt",
    "nano banana ai",
    "gemini nano banana",
    "retro prompt for gemini",
    "gemini prompt for men",
    "gemini prompt for boys",
    "gemini prompt for girls",
    "gemini prompt girl",
    "prompt for gemini ai girl",
    "prompt for gemini ai boy",
    "gemini ai prompt for boys",
    "prompt for gemini for couple",
    "gemini prompt couple",
    "couple prompt for gemini ai",
    "gemini prompt for couple photo",
    "prompt for gemini ai couple photo",
    "gemini ai couple photo prompt",

    // Trending & New Prompts
    "trending gemini prompt",
    "new gemini trend prompt",
    "trending ai photo prompt",
    "trending prompt",
    "google gemini trending photo prompt",
    "trending gemini photo prompt",
    "new prompt",
    "prompt seen",

    // Editing & Photo Manipulation
    "editing prompt",
    "photo editing prompt",
    "chatgpt prompt for photo editing",
    "ai photo editor prompt",
    "prompt for chatgpt",

    // General AI Prompts
    "AI prompts",
    "ai prompt",
    "prompt generator",
    "prompt engineering",
    "prompt meaning",
    "what is prompt",
    "prompt generator ai",
    "ai prompt generator",

    // Platform Specific
    "Midjourney prompts",
    "Stable Diffusion prompts",
    "FLUX prompts",
    "DALL-E prompts",
    "chatgpt prompt",
    "chat gpt prompt",

    // Content Types
    "image prompt",
    "ai image prompt",
    "video prompts",
    "couple prompt",
    "command prompt",
    "image to prompt",
    "prompt to image",

    // Additional High-Value
    "gemini google",
    "google gemini ai",
    "gemini ai photo prompt copy paste couple",
    "prompt for gemini ai retro style",
    "gemini ai photo prompt trending boy",
    "text to image prompts",
    "AI video generation prompts",
    "best ai prompts",
    "creative ai prompts",

    // ChatGPT Photo Prompts (Global Volume)
    "chatgpt photo prompts",
    "trending chatgpt photo prompts",
    "photo prompts chatgpt",
    "chatgpt best photo prompts",
    "chatgpt ai photo prompts",
    "photography prompts chatgpt",
    "best photo prompts for chatgpt",
    "best couple photo prompts for chatgpt",
    "aesthetic photo prompts for chatgpt",
    "different photo prompts for chatgpt",

    // Seasonal & Holiday (Global Searches)
    "chatgpt christmas photo prompts",
    "chatgpt christmas photo prompts free",
    "christmas photo prompts",
    "christmas ai photo prompts",
    "ai halloween photo prompts",
    "diwali photo prompts",
    "diwali couple photo prompts",

    // Baby & Family Prompts
    "baby photo prompts",
    "baby photo prompts chatgpt",
    "photo prompt baby",
    "photo prompt baby girl",
    "photo prompt birthday",
    "extended family photo prompts",
    "engagement photo prompts",
    "engagement photo prompts for couples",

    // Photo Editing Specific (Global)
    "photo editing prompts for gemini",
    "photo editing prompts for chatgpt",
    "photo editing prompts for gemini boys",
    "photo editing prompts for gemini ai",
    "photo editing prompts for men",
    "photo prompt editing",
    "photo prompt editor ai",
    "photo prompt editor free",
    "photo prompt enhancer",
    "enhance photo prompts gemini",

    // Photo Prompts Variations (AI Free, Generator, etc.)
    "photo prompts ai",
    "photo prompts ai free",
    "photo prompt ai generator",
    "ai photo prompts generator",
    "photography prompts ai",
    "photo prompt ai boy",
    "photo prompt ai for men",
    "photo prompt ai couple",
    "photo prompt ai girl",
    "photo prompt ai gemini",

    // Best/Top Prompts (Global Intent)
    "best photo prompts",
    "best photo prompts for gemini",
    "best ai photo prompts",
    "best ai photo prompts for men",
    "best gemini prompts",
    "best chatgpt prompts",
    "photo prompt best",
    "cool ai photo prompts",

    // Aesthetic & Style Specific
    "aesthetic photo prompts for chatgpt",
    "photo prompt cinematic",
    "photo prompt black and white",
    "dark photo prompts",
    "photo prompt background",
    "photo prompt design",

    // Trending & Viral
    "banana prompts",
    "nano banana",
    "banana ai",
    "nano banana prompts",
    "photo prompt banana",
    "prompts nano banana",
    "nano banana prompts for men",
    "banana prompt",

    // Specific Objects/Themes
    "photo prompt bike",
    "photo prompt car",
    "photo prompts boys",
    "photo prompt boys free",

    // Copy/Download Intent
    "photo prompt copy paste",
    "photo prompt copy paste gemini ai",
    "photo prompt copy",
    "photo prompt download",

    // General Platform Terms
    "gemini prompts",
    "prompts gemini",
    "chatgpt prompts",
    "prompts chatgpt",
    "prompts for gemini",
    "different photo prompts for gemini",
    "different ai photo prompts",
    "gemini prompts for image generation",
    "gemini prompts for boys",
    "gemini prompts for girls",
    "art prompts"
  ],
  authors: [{ name: "Pixico" }],
  creator: "Pixico",
  publisher: "Pixico",
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://pixico-w3us.vercel.app",
    siteName: "Pixico",
    title: "Pixico - Free AI Prompt Library & Generator",
    description:
      "Thousands of curated AI prompts for Midjourney, FLUX, Gemini, and more. Generate stunning AI art with our trending prompt library.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pixico - Explore Trending AI Prompts",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pixico - Trending AI Prompts",
    description: "Discover and copy-paste the best AI prompts for image & video generation.",
    images: ["/og-image.png"],
  },
  verification: {
    google: "vG1G-your-actual-verification-code",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
};

// Sitelinks schema for Google Search
const siteNavigationSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "itemListElement": [
    {
      "@type": "SiteNavigationElement",
      "position": 1,
      "name": "Pixico AI Generator",
      "description": "Free AI chatbot for generating custom prompts",
      "url": "https://pixico-w3us.vercel.app/generate"
    },
    {
      "@type": "SiteNavigationElement",
      "position": 2,
      "name": "Browse All Prompts",
      "description": "Explore 1000+ AI image and video prompts",
      "url": "https://pixico-w3us.vercel.app/prompts"
    },
    {
      "@type": "SiteNavigationElement",
      "position": 3,
      "name": "Blog & Tutorials",
      "description": "Learn AI prompt engineering and tips",
      "url": "https://pixico-w3us.vercel.app/blog"
    },
    {
      "@type": "SiteNavigationElement",
      "position": 4,
      "name": "FAQ",
      "description": "Frequently asked questions about AI prompts",
      "url": "https://pixico-w3us.vercel.app/faq"
    },
    {
      "@type": "SiteNavigationElement",
      "position": 5,
      "name": "About Pixico",
      "description": "Learn about our AI prompt library platform",
      "url": "https://pixico-w3us.vercel.app/about"
    },
    {
      "@type": "SiteNavigationElement",
      "position": 6,
      "name": "Contact Us",
      "description": "Get in touch with the Pixico team",
      "url": "https://pixico-w3us.vercel.app/contact"
    }
  ]
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Pixico",
  "url": "https://pixico-w3us.vercel.app",
  "logo": "https://pixico-w3us.vercel.app/icon.svg",
  "description": "Free Gemini prompt copy paste library with 1000+ trending AI photo prompts for image and video generation",
  "sameAs": [
    "https://twitter.com/pixico",
    "https://instagram.com/pixico.ai",
    "https://discord.gg/pixico",
    "https://youtube.com/@pixico"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "url": "https://pixico-w3us.vercel.app/contact"
  }
};

import AIBots from "@/components/AIBots";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0a0a0f" />
        <JsonLd data={siteNavigationSchema} />
        <JsonLd data={organizationSchema} />
      </head>
      <body>
        <AuthProvider>
          {children}
          <AIBots />
        </AuthProvider>
      </body>
    </html>
  );
}

