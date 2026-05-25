import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { keyRotator } from '@/lib/gemini/key-rotator';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'Image is required.' }, { status: 400 });
    }

    // Parse base64 image
    const parts = image.split(';base64,');
    if (parts.length < 2) {
      return NextResponse.json({ error: 'Invalid base64 image format.' }, { status: 400 });
    }
    const mimeType = parts[0].split(':')[1] || 'image/jpeg';
    const base64Data = parts[1];

    let replyText = '';
    let success = false;
    let attempts = 0;
    const maxAttempts = 3;

    const prompt = `Analyze this image of a Moroccan craft item or local Essaouira experience.
Identify what category of craft or service it is, and map it to one of these exact categories:
['Rugs & Tapestries', 'Wood Carvings', 'Oils & Cosmetics', 'Excursions & Guided Tours', 'Surf & Water Sports Lessons', 'Culinary Arts & Cooking Classes']

Also suggest 2-3 keywords in English representing this item (e.g. "Thuya", "Argan", "carpet", "surfboard").
Return ONLY a valid JSON object matching this schema:
{
  "category": "category name",
  "keywords": ["keyword1", "keyword2"]
}
Do not return any markdown wraps (like \`\`\`json) or extra explanation text. Just raw JSON.`;

    // Rotation key attempt loop
    while (attempts < maxAttempts) {
      const keyStatus = await keyRotator.getAvailableKey();
      if (!keyStatus) {
        console.warn('⚠️ All Gemini API keys are currently rate limited or exhausted.');
        break;
      }

      console.log(`📡 Attempting Gemini Image Search with key index ${keyStatus.index + 1} (Attempt ${attempts + 1}/${maxAttempts})`);

      try {
        const genAI = new GoogleGenerativeAI(keyStatus.key);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const result = await model.generateContent([
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          prompt
        ]);

        replyText = await result.response.text();
        await keyRotator.useKey(keyStatus);
        success = true;
        break; // Exit loop on success
      } catch (err: any) {
        console.error(`🔴 Gemini API error on key index ${keyStatus.index + 1}:`, err);
        attempts++;
      }
    }

    if (!success) {
      return NextResponse.json({ error: 'Failed to communicate with AI search engine.' }, { status: 503 });
    }

    // Clean Gemini text responses (sometimes it puts markdown wraps despite instructions)
    let cleanText = replyText.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(cleanText);
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON output:', cleanText);
      return NextResponse.json({ error: 'AI output classification was malformed.' }, { status: 500 });
    }

    const { category, keywords = [] } = parsedResult;
    console.log(`🔍 AI Image Search Classified: Category="${category}", Keywords=${JSON.stringify(keywords)}`);

    // Fetch database products
    const { data: dbProducts, error: dbError } = await supabase
      .from('products')
      .select('*, stores(name, slug), category:categories(id, name, name_ar, name_fr, slug)')
      .order('created_at', { ascending: false });

    if (dbError) {
      throw new Error(dbError.message);
    }

    const products = dbProducts || [];

    // Filter products matching category OR keywords
    let matchingProducts = products.filter((p: any) => {
      // 1. Match category
      const productCatName = p.category?.name || '';
      if (category && productCatName.toLowerCase().includes(category.toLowerCase())) {
        return true;
      }

      // 2. Match keywords against product name or description
      const name = (p.name || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();

      return keywords.some((kw: string) => {
        const kwLower = kw.toLowerCase();
        return name.includes(kwLower) || desc.includes(kwLower);
      });
    });

    // Limit matching products to top 6
    matchingProducts = matchingProducts.slice(0, 6);

    return NextResponse.json({
      category,
      keywords,
      products: matchingProducts
    });

  } catch (err: any) {
    console.error('🔴 Image Search API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
