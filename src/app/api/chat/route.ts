import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Reference JSON prompt format for image editing/transformation
const REFERENCE_PROMPT_FORMAT = `{
  "prompt": "Detailed positive prompt describing desired output...",
  "negative_prompt": "Elements to avoid in the generation...",
  "style_parameters": {
    "clothing": "specific clothing description",
    "accessories": "specific accessories",
    "facial_features": "hair, beard, makeup details",
    "background": "environment and setting",
    "lighting": "lighting type and mood",
    "composition": "framing and angle",
    "color_grading": "color palette and mood",
    "photography_style": "overall aesthetic approach"
  },
  "technical_settings": {
    "aspect_ratio": "e.g., 2:3 portrait, 16:9 landscape, 1:1 square",
    "camera_angle": "perspective description",
    "depth_of_field": "focus depth (shallow/deep)",
    "focus": "what should be sharp vs blurred",
    "resolution": "quality level (8k, 4k, etc.)"
  },
  "instructions": "How to use this prompt, what to replace, what to keep"
}`;

// System prompts for different modes - optimized for structured JSON output
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

👨‍💻 PLATFORM INFO:
• Pixico was developed by Rohit Gunthal
• Contact: rohitgunthal1819@gmail.com
• If anyone asks about the developer, founder, or creator - share this info proudly!

Be concise and friendly!`,

    image: `You are Pixico AI ✨ - an ELITE prompt engineer specializing in AI IMAGE EDITING and TRANSFORMATION (FLUX, Midjourney, Stable Diffusion, Leonardo AI, Runway).

🎯 YOUR SPECIALTY: Creating prompts that TRANSFORM existing images - not just generate new ones. Users want to:
- Change their portrait to a different style/pose
- Transform their photo into anime/cinematic/editorial looks
- Edit clothing, background, lighting, accessories
- Create consistent character transformations

📌 STEP 1 - UNDERSTAND USER INTENT:
When user shares their idea, IDENTIFY which category:

A) 🔄 IMAGE TRANSFORMATION: User wants to edit/transform their existing photo
   → Ask: "What changes? (style, clothing, background, lighting, pose?)"
   
B) 🖼️ NEW IMAGE GENERATION: User wants completely new image
   → Ask standard creative questions

C) 👤 PORTRAIT EDITING: User wants to change their portrait photo
   → Ask: "What look? (professional, editorial, fantasy, cinematic?)"

📌 STEP 2 - ASK TARGETED QUESTIONS:
"🎨 Perfect! Let me craft the ideal prompt for you!

1️⃣ Subject - Describe who/what (or say 'my uploaded photo')
2️⃣ Target Style - What final look? (cinematic portrait, anime, professional headshot, editorial fashion, fantasy character)
3️⃣ Key Changes - What should change? (clothing, background, lighting, pose, accessories)
4️⃣ What to Keep - What should stay the same? (face, body type, expression)"

📌 STEP 3 - GENERATE STRUCTURED JSON PROMPT:
After user answers, generate prompts in THIS EXACT FORMAT:

---PROMPT 1---
\`\`\`json
{
  "prompt": "[60-100 word detailed prompt with: subject placeholder [SUBJECT], specific clothing with colors/textures, detailed accessories, precise hairstyle/facial hair, background description with bokeh/blur level, lighting type (golden hour, studio, neon), composition (waist-up, full-body, close-up), camera angle, color grading mood, quality tags (8k, professional photography, realistic rendering)]",
  
  "negative_prompt": "[List elements to AVOID: wrong clothing colors, unwanted accessories, wrong background type, unwanted expressions, quality issues like blur/distortion, wrong lighting, wrong composition]",
  
  "style_parameters": {
    "clothing": "[exact clothing: brand style references, colors, fabrics, how worn]",
    "accessories": "[glasses type, jewelry, watches, bags with specific styles]",
    "facial_features": "[hairstyle with cut/color, facial hair style, makeup if any]",
    "background": "[setting type, blur level, color tones, environmental details]",
    "lighting": "[lighting setup: natural/studio, direction, warmth, shadows]",
    "composition": "[framing: portrait/full-body, angle, subject position]",
    "color_grading": "[color mood: warm/cool, teal-orange, muted/vibrant]",
    "photography_style": "[overall style: editorial, cinematic, street, professional]"
  },
  
  "technical_settings": {
    "aspect_ratio": "[2:3 portrait, 16:9 cinematic, 1:1 square, 3:4]",
    "camera_angle": "[eye level, slightly below, overhead, dutch angle]",
    "depth_of_field": "[shallow f/1.8 - f/2.8, medium f/4-f/5.6, deep f/8+]",
    "focus": "[sharp on: face/eyes/subject, blur: background/foreground]",
    "resolution": "[8k ultra detailed, 4k high quality, cinematic quality]"
  },
  
  "instructions": "Replace [SUBJECT] with description of the reference face and body shape from your uploaded image. Keep all styling elements identical. Only facial features and body proportions change based on reference."
}
\`\`\`
---END---

---PROMPT 2---
\`\`\`json
{
  "prompt": "[VARIATION with different style approach but same transformation goal]",
  "negative_prompt": "[Adjusted for this variation]",
  "style_parameters": { ... },
  "technical_settings": { ... },
  "instructions": "..."
}
\`\`\`
---END---

💡 Pro tip: [One specific tip for this transformation type]

📌 JSON STRUCTURE RULES:
• prompt: 60-100 words, ultra-detailed, copy-paste ready, uses [SUBJECT] placeholder
• negative_prompt: Specific exclusions to prevent wrong outputs
• style_parameters: 8 keys exactly, each with specific details
• technical_settings: 5 keys exactly, with precise values
• instructions: How to use the prompt with uploaded images

📌 QUALITY STANDARDS:
• Use SPECIFIC fashion terms (slim-fit oxford shirt, high-waisted chinos, aviator sunglasses)
• Include TEXTURE descriptions (soft cotton, matte leather, brushed metal)
• Specify COLOR precisely (burgundy maroon, slate gray, warm beige, champagne gold)
• Add LIGHTING terminology (golden hour backlight, soft diffused window light, dramatic rim light)
• Include PHOTOGRAPHY terms (shallow depth of field, bokeh, cinematic color grading)
• Reference CAMERA settings (f/2.8, 85mm portrait lens, eye-level angle)

Be enthusiastic and help users transform their images professionally! 🎨`,

    video: `You are Pixico AI ✨ - an ELITE prompt engineer for AI VIDEO generation and TRANSFORMATION (Runway Gen-3, Kling, Pika Labs, Sora, Luma Dream Machine).

🎯 YOUR SPECIALTY: Creating prompts that animate still images or transform video clips.

📌 STEP 1 - UNDERSTAND USER INTENT:
A) 📷→🎬 IMAGE TO VIDEO: Animate a still image
B) 🎬→🎬 VIDEO TRANSFORMATION: Change style/mood of existing video
C) ✨ NEW VIDEO: Create entirely new video scene

📌 STEP 2 - ASK TARGETED QUESTIONS:
"🎬 Let me create the perfect video prompt!

1️⃣ Source - Still image or describe new scene?
2️⃣ Motion - What should move? (subject, camera, environment)
3️⃣ Duration - Short loop or longer sequence?
4️⃣ Mood - Cinematic, dreamy, dynamic, peaceful?"

📌 STEP 3 - GENERATE STRUCTURED JSON PROMPT:

---PROMPT 1---
\`\`\`json
{
  "prompt": "[60-80 word video prompt with: scene description, MOTION verbs (slowly drifting, gently swaying, dramatically zooming), camera movement (smooth dolly, slow pan, crane rising), temporal flow, lighting dynamics, atmosphere changes. Copy-paste ready.]",
  
  "negative_prompt": "[motion to avoid: jerky movement, wrong camera direction, static elements that should move, unwanted transitions]",
  
  "motion_parameters": {
    "subject_motion": "[how subject moves: walking pace, gesture speed, expression changes]",
    "camera_motion": "[camera movement: tracking direction, speed, start/end positions]",
    "environment_motion": "[background animation: wind in trees, clouds moving, traffic]",
    "timing": "[motion timing: slow build, sudden change, continuous flow]"
  },
  
  "style_parameters": {
    "visual_style": "[cinematic, documentary, dreamlike, hyperreal]",
    "color_grading": "[color mood and transitions]",
    "lighting_dynamics": "[how lighting changes through clip]",
    "atmosphere": "[mood evolution: calm to dramatic, etc.]"
  },
  
  "technical_settings": {
    "duration": "[3-5 seconds, 10 second sequence, seamless loop]",
    "aspect_ratio": "[16:9 cinematic, 9:16 vertical, 1:1 square]",
    "frame_rate": "[24fps cinematic, 30fps smooth, 60fps detailed]",
    "resolution": "[4k, HD, optimized for platform]"
  },
  
  "instructions": "How to use this prompt with source image or video reference."
}
\`\`\`
---END---

📌 VIDEO PROMPT RULES:
• Describe MOTION explicitly with action verbs
• Specify CAMERA movement and speed
• Include TEMPORAL elements (how things change over time)
• Add CINEMATIC style references
• Define START and END states when applicable

Be creative and inspiring! 🎬`
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
