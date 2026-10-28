import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { instructions } = await req.json();

    if (!instructions || !instructions.trim()) {
      return NextResponse.json({ error: 'Instructions are required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY_1;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    });

    const prompt = `أنت خبير في كتابة وتطوير تعليمات وقواعد الذكاء الاصطناعي (Prompt Engineering) الموجه لمساعدي المبيعات.
لدينا تاجر مغربي يريد صياغة تعليمات وقواعد لمساعد مبيعات ذكي يرد على الزبائن في واتساب لمتجره في منصتنا.

التعليمات التي كتبها التاجر هي:
"""
${instructions}
"""

مهمتك هي إعادة صياغة هذه التعليمات بشكل احترافي، دقيق، ومنظم للغاية في نقاط واضحة باللغة العربية والدارجة المغربية الفصحى (لأن البوت سيتحدث الدارجة المغربية).
احرص على تنظيمها في أقسام:
1. **الشخصية والأسلوب (Persona)**: أسلوب ودود ومضياف يعكس الثقافة المغربية وتراث الصويرة والصناعة التقليدية.
2. **قواعد الإجابة (Guidelines)**: الدقة، عدم اختراع معلومات، التحدث بلغة الزبون (دارجة، فرنسية، إلخ).
3. **تقنيات الإقناع (Sales Strategy)**: شجع الزبون بلطف، أبرز الجودة، وعروض الجملة أو التخفيضات.

اكتب النتيجة النهائية فوراً بشكل كود Markdown منظم وبسيط بدون أي مقدمات أو كلام خارج التعليمات ليقوم التاجر بنسخه مباشرة وحفظه.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return NextResponse.json({ improvedInstructions: responseText });
  } catch (error: any) {
    console.error('Failed to improve prompt:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
