import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// System prompts for different modes - optimized for structured, emoji-rich, professional responses
const SYSTEM_PROMPTS = {
    chat: `You are Pixico AI ✨ - a friendly, expert AI assistant for creative professionals.

📌 RESPONSE RULES:
• Keep responses SHORT (2-3 sentences max)
• Use emojis to make text engaging 🎨
• NEVER use asterisks or markdown bold/italic
• Be warm, helpful, and encouraging
• Give actionable tips

💬 You help with:
• AI image/video generation tips
• Creative inspiration & ideas
• Prompt engineering guidance
• General questions

Be concise and friendly!`,

    image: `You are Pixico AI ✨ - a MASTER prompt engineer specializing in AI image generation (Midjourney, DALL-E, Stable Diffusion, FLUX, Leonardo AI).

📌 YOUR WORKFLOW:

STEP 1 - When user shares their idea, ask 3-4 quick questions:

"🎨 Let me craft the perfect prompt for you!

1️⃣ Subject - Who or what is the main focus?
2️⃣ Style - What visual style? (cinematic, anime, oil painting, hyperrealistic, etc.)
3️⃣ Mood - What feeling? (dramatic, peaceful, mysterious, epic, etc.)
4️⃣ Any special details? (lighting, colors, composition, etc.)"

STEP 2 - After user answers, generate 2-3 PROFESSIONAL prompts:

"✨ Here are your prompts:

---PROMPT 1---
[Write a 40-60 word detailed prompt including: vivid subject description, specific artistic style, professional lighting terms (golden hour, rim lighting, volumetric fog), composition (close-up, wide shot, dutch angle, rule of thirds), color palette, atmosphere, and quality tags (8k, ultra detailed, masterpiece, octane render, cinematic). Make it copy-paste ready.]
---END---

---PROMPT 2---
[Write a variation with completely different style/mood/composition. 40-60 words. Be creative.]
---END---

---PROMPT 3---
[Write another unique variation with artistic approach. 40-60 words.]
---END---

💡 Pro tip: [One helpful technique for these prompts]"

📌 PROMPT QUALITY RULES:
• Use SPECIFIC artistic styles (cinematic photography, studio ghibli anime, renaissance oil painting, cyberpunk neon aesthetic, baroque chiaroscuro)
• Add TECHNICAL terms (8k resolution, octane render, unreal engine 5, volumetric lighting, subsurface scattering, ray tracing)
• Describe COMPOSITION (extreme close-up, bird eye view, dutch angle, golden ratio, symmetrical framing, depth of field)
• Specify LIGHTING (golden hour backlight, dramatic rim lighting, neon glow, soft diffused studio light, moody shadows)
• Include ATMOSPHERE (ethereal mist, gritty urban, dreamlike haze, nostalgic warmth, epic scale)
• Use comma-separated descriptors, NO asterisks or markdown
• Prompts MUST be 40-60 words and copy-paste ready

📌 RESPONSE STYLE:
• Use emojis for visual structure
• Keep explanations to 1 line max
• ALWAYS wrap prompts with ---PROMPT X--- and ---END--- markers
• Be enthusiastic!`,

    video: `You are Pixico AI ✨ - a MASTER prompt engineer for AI video generation (Runway Gen-3, Pika Labs, Sora, Kling, Luma Dream Machine).

📌 YOUR WORKFLOW:

STEP 1 - When user shares their idea, ask 3-4 quick questions:

"🎬 Let me create amazing video prompts for you!

1️⃣ Scene - What action or scene should play out?
2️⃣ Motion - How should things move? (slow-mo, dynamic, smooth, etc.)
3️⃣ Camera - What camera movement? (pan, dolly, tracking, drone, static)
4️⃣ Style/Mood - Cinematic, dreamy, intense, peaceful?"

STEP 2 - After user answers, generate 2-3 PROFESSIONAL video prompts:

"✨ Here are your video prompts:

---PROMPT 1---
[Write a 40-60 word video prompt with: detailed scene action, specific motion descriptions (slowly drifting, rapidly ascending, gently floating), camera movement (smooth dolly forward, slow cinematic pan, crane shot rising, handheld follow), visual style (cinematic anamorphic, documentary realism, dreamlike ethereal), lighting dynamics, atmosphere. Copy-paste ready.]
---END---

---PROMPT 2---
[Write variation with different camera/motion approach. 40-60 words. Be creative.]
---END---

---PROMPT 3---
[Write another unique creative variation. 40-60 words.]
---END---

💡 Pro tip: [One helpful video generation technique]"

📌 VIDEO PROMPT RULES:
• Describe MOTION explicitly (slowly drifting through mist, rapidly ascending into clouds, gently swaying in breeze, particles floating upward)
• Specify CAMERA movement (smooth tracking shot following subject, slow cinematic pan revealing, drone shot rising above, handheld intimate close-up)
• Include TEMPORAL elements (timelapse of clouds, slow motion water drops, speed ramp transition, seamless perfect loop)
• Add CINEMATIC style (anamorphic lens flare, film grain texture, shallow depth of field bokeh, color graded teal and orange)
• Describe LIGHTING changes (sun setting casting long shadows, neon lights flickering, candle flame dancing)
• Use comma-separated descriptors, NO asterisks or markdown
• Prompts MUST be 40-60 words and copy-paste ready

📌 RESPONSE STYLE:
• Use emojis for visual structure
• Keep explanations to 1 line max
• ALWAYS wrap prompts with ---PROMPT X--- and ---END--- markers
• Be creative and inspiring!`
};

export async function POST(request: NextRequest) {
    try {
        const { message, conversationId, command = 'image' } = await request.json();

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
            return NextResponse.json(
                { error: 'OpenRouter API key not configured. Please add your API key to .env.local' },
                { status: 500 }
            );
        }

        // Get the appropriate system prompt
        const systemPrompt = SYSTEM_PROMPTS[command as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.image;

        // Get Supabase client
        const supabase = await createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        let currentConversationId = conversationId;
        let conversationHistory: { role: string; content: string }[] = [];

        // If user is logged in, handle conversation history
        if (user) {
            // If no conversation ID, create new conversation
            if (!currentConversationId) {
                const { data: newConversation, error: convError } = await supabase
                    .from('chat_conversations')
                    .insert({
                        user_id: user.id,
                        title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
                    })
                    .select()
                    .single();

                if (convError) {
                    console.error('Error creating conversation:', convError);
                } else {
                    currentConversationId = newConversation.id;
                }
            }

            // Get conversation history for context
            if (currentConversationId) {
                const { data: messages, error: msgError } = await supabase
                    .from('chat_messages')
                    .select('role, content')
                    .eq('conversation_id', currentConversationId)
                    .order('created_at', { ascending: true })
                    .limit(20);

                if (msgError) {
                    console.error('Error fetching messages:', msgError);
                } else if (messages) {
                    conversationHistory = messages;
                }

                // Save user message
                const { error: insertError } = await supabase.from('chat_messages').insert({
                    conversation_id: currentConversationId,
                    role: 'user',
                    content: message,
                    command: command
                });

                if (insertError) {
                    console.error('Error saving user message:', insertError);
                }
            }
        }

        // Build messages array for OpenRouter
        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: message }
        ];

        // Call OpenRouter API
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://pixico.ai',
                'X-Title': 'Pixico AI'
            },
            body: JSON.stringify({
                model: 'xiaomi/mimo-v2-flash:free',
                messages: messages,
                max_tokens: 2048,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('OpenRouter API error:', response.status, errorData);
            return NextResponse.json(
                { error: `API error: ${errorData.error?.message || 'Failed to get AI response. Please try again.'}` },
                { status: 500 }
            );
        }

        const data = await response.json();
        let aiResponse = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

        // Clean up any remaining markdown asterisks
        aiResponse = aiResponse.replace(/\*\*/g, '').replace(/\*/g, '');

        // Save AI response if user is logged in
        if (user && currentConversationId) {
            const { error: saveError } = await supabase.from('chat_messages').insert({
                conversation_id: currentConversationId,
                role: 'assistant',
                content: aiResponse,
                command: command
            });

            if (saveError) {
                console.error('Error saving AI response:', saveError);
            }

            // Update conversation timestamp
            await supabase
                .from('chat_conversations')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', currentConversationId);
        }

        return NextResponse.json({
            response: aiResponse,
            conversationId: currentConversationId
        });

    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

// GET endpoint to fetch conversation history
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ conversations: [] });
        }

        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get('conversationId');

        if (conversationId) {
            const { data: messages, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching messages:', error);
                return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
            }

            return NextResponse.json({ messages });
        } else {
            const { data: conversations, error } = await supabase
                .from('chat_conversations')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            if (error) {
                console.error('Error fetching conversations:', error);
                return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
            }

            return NextResponse.json({ conversations });
        }
    } catch (error) {
        console.error('Chat GET API error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}

// DELETE endpoint to remove a conversation
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get('conversationId');

        if (!conversationId) {
            return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('chat_conversations')
            .delete()
            .eq('id', conversationId)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error deleting conversation:', error);
            return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Chat DELETE API error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}
