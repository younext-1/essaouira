import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { keyRotator } from '@/lib/gemini/key-rotator'
import { fetchDatabaseContext, buildSystemPrompt } from '@/lib/gemini/db-context'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const maxDuration = 30

// ── POST — Send a message ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Auth check
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json(
      {
        error: 'unauthorized',
        message: 'يجب تسجيل الدخول أولاً للتحدث مع المرشد الذكي.',
        messageFr: 'Veuillez vous connecter pour utiliser le guide IA.',
        messageEn: 'Please sign in to use the AI Guide.',
        requiresAuth: true,
      },
      { status: 401 }
    )
  }

  // Check keys are available
  if (!keyRotator.hasKeys) {
    return NextResponse.json(
      {
        error: 'not_configured',
        message: 'المرشد الذكي غير مُهيَّأ بعد. يرجى إضافة مفاتيح Gemini API.',
      },
      { status: 503 }
    )
  }

  // Parse body
  let messages: Array<{ role: string; content: string }>
  try {
    const body = await req.json()
    messages = body.messages ?? []
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const userMessage = messages.at(-1)?.content?.trim()
  if (!userMessage) {
    return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })
  }

  // Get user display name
  const clerkUser = await currentUser()
  const userName = clerkUser?.firstName ?? clerkUser?.username ?? undefined

  // Fetch live DB context
  const dbContext = await fetchDatabaseContext(userMessage)
  const systemPrompt = buildSystemPrompt(dbContext, userName)

  // Convert prior messages to Gemini history format (exclude the latest user message)
  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  // Try each available key
  let response: string | null = null
  let lastError: Error | null = null
  const MAX_ATTEMPTS = 5

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const keyStatus = keyRotator.getAvailableKey()

    if (!keyStatus) {
      console.error('All API keys exhausted. Waiting 5s…')
      await new Promise(r => setTimeout(r, 5000))
      continue
    }

    try {
      console.log(
        `🔑 Using key ${keyStatus.index + 1} | Requests this minute: ${keyStatus.requestCount}/30`
      )
      keyRotator.useKey(keyStatus)

      const genAI = new GoogleGenerativeAI(keyStatus.key)
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      })

      const chat = model.startChat({ history })
      const result = await chat.sendMessage(userMessage)
      response = result.response.text()
      break // success

    } catch (error: any) {
      lastError = error
      console.error(`Key ${keyStatus.index + 1} failed:`, error?.message)

      const msg = String(error?.message ?? '')
      if (msg.includes('429') || msg.includes('RATE_LIMIT') || msg.includes('quota')) {
        keyRotator.markRateLimited(keyStatus)
        console.log(`🔄 Key ${keyStatus.index + 1} rate limited. Trying next…`)
        continue
      }

      keyRotator.markError(keyStatus)
      if (msg.includes('API_KEY_INVALID')) {
        console.error(`❌ Key ${keyStatus.index + 1} is invalid`)
        continue
      }

      break // unexpected error — stop
    }
  }

  if (!response) {
    console.error('All keys failed. Last error:', lastError)
    return NextResponse.json(
      {
        error: 'service_unavailable',
        message: 'المرشد الذكي مشغول حالياً. يرجى المحاولة بعد دقيقة.',
        retry: true,
      },
      { status: 503 }
    )
  }

  // Persist conversation to Supabase (non-blocking, best-effort)
  void (async () => {
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('clerk_id', userId)
        .single()

      if (profile) {
        const updatedMessages = [...messages, { role: 'assistant', content: response }]
        await supabaseAdmin
          .from('ai_conversations')
          .upsert(
            { user_id: profile.id, messages: updatedMessages, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
          )
      }
    } catch (dbError) {
      console.error('Failed to persist conversation:', dbError)
    }
  })()

  return NextResponse.json({
    reply: response,
    keyStats: keyRotator.getStats(),
  })
}

// ── GET — Load conversation history ───────────────────────────────────────────
export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ messages: [], requiresAuth: true }, { status: 401 })
  }

  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!profile) return NextResponse.json({ messages: [] })

    const { data: conversation } = await supabaseAdmin
      .from('ai_conversations')
      .select('messages')
      .eq('user_id', profile.id)
      .single()

    return NextResponse.json({ messages: conversation?.messages ?? [] })
  } catch {
    return NextResponse.json({ messages: [] })
  }
}

// ── DELETE — Clear conversation ────────────────────────────────────────────────
export async function DELETE() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (profile) {
      await supabaseAdmin
        .from('ai_conversations')
        .upsert(
          { user_id: profile.id, messages: [], updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )
    }
  } catch (e) {
    console.error('Failed to clear conversation:', e)
  }

  return NextResponse.json({ success: true })
}
