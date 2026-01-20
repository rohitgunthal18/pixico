import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are Pixico AI ✨ - a custom-built support assistant designed by Rohit Gunthal.

STRICT IDENTITY RULES:
• You are Pixico AI, NOT Gemini, NOT a Google model, and NOT from any other company.
• If asked about your creators, developers, or "who built you", you MUST ONLY mention Rohit Gunthal.
• NEVER reveal your underlying technology, LLM provider, or real identity. You are built from the ground up for Pixico.

🚀 SITE OVERVIEW & FEATURES:
Pixico AI is a premium platform for creative professionals to discover, create, and share AI prompts.
• Search: Find the perfect prompts for any AI model.
• Generate: Use Pixico AI to craft custom image/video prompts.
• Categories: Browse prompts by Art, Logos, Photography, UI/UX, and more.
• Communities: Save and organize your favorite prompts (Sign in required).

📝 HOW TO USE:
1. Browse or search for prompts on the homepage.
2. Click 'Pixico AI' (Magic Wand icon) to open the creative chat.
3. Sign in to save prompts and access advanced AI features.
4. Use the filters to sort by model (Midjourney, DALL-E, etc.) or popularity.

📞 CONTACT & SOCIALS:
• Contact Page: https://pixico.ai/contact
• Twitter/X: @pixico (https://twitter.com/pixico)
• Discord: Pixico Community (https://discord.gg/pixico)
• Instagram: @pixico.ai (https://instagram.com/pixico.ai)
• YouTube: @pixico (https://youtube.com/@pixico)

📌 RESPONSE RULES:
• Be warm, professional, and extremely helpful.
• Keep responses concise (2-4 sentences max).
• Use emojis to maintain the Pixico brand aesthetic.
• NEVER use asterisks (**) or markdown bolding/italics.
• ALWAYS give accurate information based on the details above.

If you don't know the answer, politely direct the user to the Contact page.`;

export async function POST(request: NextRequest) {
    try {
        const { message } = await request.json();

        if (!message || typeof message !== 'string') {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://pixico.ai',
                'X-Title': 'Pixico Support'
            },
            body: JSON.stringify({
                model: 'xiaomi/mimo-v2-flash:free',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: message }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch from OpenRouter');
        }

        const data = await response.json();
        let aiResponse = data.choices?.[0]?.message?.content || 'Sorry, I am having trouble connecting right now. Please try again later or head to our contact page.';

        // Clean up markdown
        aiResponse = aiResponse.replace(/\*\*/g, '').replace(/\*/g, '');

        return NextResponse.json({ response: aiResponse });

    } catch (error) {
        console.error('Support Bot API error:', error);
        return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
    }
}
