import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { keyRotator } from '@/lib/gemini/key-rotator';
import { fetchDatabaseContext, buildSystemPrompt } from '@/lib/gemini/db-context';

// Zod Input Validation Schema (FIX 6)
const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'model', 'system']),
        content: z.string().max(4000, { message: 'Message content cannot exceed 4000 characters.' }),
      })
    )
    .min(1, { message: 'At least one message must be provided.' }),
  userName: z.string().max(100, { message: 'User name cannot exceed 100 characters.' }).optional().default(''),
  pageContext: z
    .object({
      type: z.enum(['homepage', 'store', 'product']),
      // Homepage instructions properties
      // Storefront instructions properties
      storeName: z.string().optional(),
      storeSlug: z.string().optional(),
      storeBio: z.string().optional(),
      storeLocation: z.string().optional(),
      storeProducts: z.array(z.any()).optional(),
      // Product detail instructions properties
      productTitle: z.string().optional(),
      productPrice: z.union([z.number(), z.string()]).optional(),
      productCategory: z.string().optional(),
      sellerName: z.string().optional(),
      sellerUsername: z.string().optional(),
      productDescription: z.string().optional(),
    })
    .nullable()
    .optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate the incoming request payload with Zod
    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters.', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { messages, userName, pageContext } = parsed.data;

    const lastMessage = messages[messages.length - 1];
    const userMessageContent = lastMessage.content || '';

    // 1. Fetch live database context
    const dbContext = await fetchDatabaseContext(userMessageContent);
    let systemPrompt = buildSystemPrompt(dbContext, userName);

    // Dynamic Route Context Injection
    if (pageContext) {
      let pageContextInstructions = '\n\n';
      if (pageContext.type === 'homepage') {
        pageContextInstructions += `
[CURRENT CONTEXT: HOME PAGE / الصفحة الرئيسية]
The shopper is currently browsing the homepage of Mogador Connect (Essaouira's digital craft hub). 
Provide a warm welcome, highlight general crafts categories like Thuya wood, Moroccan rugs, organic cosmetic Argan oils. 
Offer to plan a custom day itinerary in Essaouira or suggest popular products. Recommend 1-3 best items.
`.trim();
      } else if (pageContext.type === 'store') {
        pageContextInstructions += `
[CURRENT CONTEXT: SHOP PAGE / صفحة المتجر]
The shopper is browsing the official storefront of vendor: "${pageContext.storeName || 'Unknown Shop'}" (@${pageContext.storeSlug || ''}).
Store Description/Bio: "${pageContext.storeBio || 'No description'}"
Location: "${pageContext.storeLocation || 'Essaouira Medina'}"
Available products belonging strictly to THIS shop:
${JSON.stringify(pageContext.storeProducts || [])}

RULES FOR THIS CONTEXT:
1. Focus your answers on recommending items from THIS store first.
2. Answer questions about this specific artisan/seller and their crafts.
3. Suggest their contact information or how to order. Encourage visiting their physical workshop if location is mentioned!
`.trim();
      } else if (pageContext.type === 'product') {
        pageContextInstructions += `
[CURRENT CONTEXT: PRODUCT DETAIL PAGE / صفحة تفاصيل المنتج]
The shopper is browsing the detail page of this specific product:
- Product Title: "${pageContext.productTitle}"
- Price: ${pageContext.productPrice || 'N/A'} MAD
- Category: "${pageContext.productCategory || 'Uncategorized'}"
- Seller: "${pageContext.sellerName || 'Unknown Artisan'}" (@${pageContext.sellerUsername || ''})
- Description: "${pageContext.productDescription || 'No description available.'}"

RULES FOR THIS CONTEXT:
1. Provide extremely detailed, expert information about THIS specific product (such as raw materials, handmade heritage, sizing/customization if relevant).
2. Help the shopper understand why this craft is special.
3. Answer shipping or COD payment questions specifically about this product.
4. Highlight that they can write a photo/video review or inspect active client attachments.
`.trim();
      }
      systemPrompt += pageContextInstructions;
    }

    // 2. Convert message history to Google Gemini Format
    // We only take the last 6 messages to keep tokens optimized and highly performant
    const contextMessages = messages.slice(-6);
    let geminiHistory = contextMessages.slice(0, -1).map((msg) => {
      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      };
    });

    // CRITICAL: Google Gemini requires the first message in the history to have the 'user' role.
    // If the first message in history is a 'model' role, we must remove it so Gemini doesn't crash!
    while (geminiHistory.length > 0 && geminiHistory[0].role !== 'user') {
      geminiHistory.shift();
    }

    // 3. Obtain active key and execute with robust rotation retry loop (FIX 9)
    let replyText = '';
    let success = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      const keyStatus = await keyRotator.getAvailableKey();
      if (!keyStatus) {
        console.warn('⚠️ All Gemini API keys are currently rate limited or exhausted.');
        break;
      }

      console.log(`📡 Attempting Gemini chat with key index ${keyStatus.index + 1} (Attempt ${attempts + 1}/${maxAttempts})`);

      try {
        const genAI = new GoogleGenerativeAI(keyStatus.key);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          systemInstruction: systemPrompt,
        });

        const chat = model.startChat({
          history: geminiHistory,
        });

        const result = await chat.sendMessage(userMessageContent);
        replyText = await result.response.text();

        // Register successful key usage
        await keyRotator.useKey(keyStatus);
        success = true;
        break; // Success! Exit loop
      } catch (apiError: any) {
        console.error(`🔴 Gemini API error on key index ${keyStatus.index + 1}:`, apiError);

        // Mark rate-limited, overloaded (503), invalid (400), or error accordingly
        const errorMsg = apiError?.message || '';
        const isQuotaOrLimit =
          errorMsg.includes('429') ||
          errorMsg.toLowerCase().includes('quota') ||
          errorMsg.toLowerCase().includes('limit') ||
          errorMsg.includes('503') ||
          errorMsg.toLowerCase().includes('overloaded') ||
          errorMsg.toLowerCase().includes('demand');

        const isInvalidKey =
          errorMsg.includes('400') ||
          errorMsg.toLowerCase().includes('key not valid') ||
          errorMsg.toLowerCase().includes('api_key_invalid') ||
          errorMsg.toLowerCase().includes('invalid key');

        if (isInvalidKey) {
          // Permanently disable the key by rate-limiting it for 24 hours in Redis/memory
          await keyRotator.disableKey(keyStatus, 24 * 60 * 60 * 1000);
          console.error(`⚠️ Key index ${keyStatus.index + 1} is INVALID. Blocked for 24 hours.`);
        } else if (isQuotaOrLimit) {
          await keyRotator.markRateLimited(keyStatus);
        } else {
          await keyRotator.markError(keyStatus);
        }

        attempts++;
      }
    }

    const rotatorStats = await keyRotator.getStats();

    if (success) {
      return NextResponse.json({
        content: replyText,
        rotatorStats,
      });
    }

    // Fallback response if all attempts fail
    return NextResponse.json({
      content: `مرحباً! 🌊 واجهت صعوبة في الاتصال بخادم الذكاء الاصطناعي بسبب الضغط المرتفع (رمز 503). ولكن يسعدني إخبارك أن معروضاتنا من خشب العرعر والزرابي جاهزة للتصفح والشحن المباشر! 

أعد كتابة سؤالك وسأجيبك فوراً! ✨`,
      rotatorStats,
    });
  } catch (globalError: any) {
    console.error('🔴 Critical Chat Route error:', globalError);
    return NextResponse.json(
      { error: 'An unexpected internal error occurred.' },
      { status: 500 }
    );
  }
}
