import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // In a real app, this would use a secure environment variable for the API key:
    // const apiKey = process.env.ANTHROPIC_API_KEY;
    // For this prototype, we'll mock the response to avoid exposing real keys
    // or causing build failures if the key isn't provided.
    
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock AI response
    return NextResponse.json({
      content: "هذا مجرد رد تجريبي. في بيئة الإنتاج، سيتم توصيل هذا بمفتاح API الخاص بـ Anthropic للرد بشكل حقيقي. \n\n الصويرة رائعة جداً، هل زرت الشاطئ اليوم؟"
    });

    /* 
    // REAL IMPLEMENTATION (Uncomment when API key is available in .env.local):
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1000,
        system: `You are Mogador AI Guide, an expert about Essaouira (Mogador) Morocco. You know everything about local culture, artisans, surf spots, music festivals (especially Gnaoua), traditional crafts like Thuya wood, local food, and tourism. Always respond in the same language the user writes in (Arabic or French or English). Be warm, helpful, and local.`,
        messages: messages.map((m: any) => ({
          role: m.role === "ai" ? "assistant" : "user",
          content: m.content
        }))
      })
    });

    const data = await response.json();
    return NextResponse.json({ content: data.content[0].text });
    */

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch response" }, { status: 500 });
  }
}
