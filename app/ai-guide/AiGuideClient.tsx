'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useUser, SignInButton } from '@clerk/nextjs'
import { Send, Trash2, Loader2, Lock, Sparkles, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_QUESTIONS = [
  '🎨 ما هي أفضل الحرفيين في الصويرة؟',
  '🛍️ ماذا أشتري كهدية؟',
  '🏄 أين أتعلم التزلج على الأمواج؟',
  '🎵 متى مهرجان كناوة؟',
  '🍜 ما أفضل المطاعم؟',
  '🏨 أين أسكن في الصويرة؟',
]

export default function AiGuideClient() {
  const { isSignedIn, user, isLoaded } = useUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, isLoading, scrollToBottom])

  // Load conversation history
  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) { setIsLoadingHistory(false); return }

    fetch('/api/ai-guide')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          // Normalize legacy 'ai' role to 'assistant'
          setMessages(
            data.messages.map((m: any) => ({
              ...m,
              role: m.role === 'ai' ? 'assistant' : m.role,
            }))
          )
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingHistory(false))
  }, [isSignedIn, isLoaded])

  const sendMessage = async (content?: string) => {
    const text = (content ?? input).trim()
    if (!text || isLoading || !isSignedIn) return

    setError(null)
    const userMsg: Message = { role: 'user', content: text }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      })

      const data = await res.json()

      if (res.status === 401 && data.requiresAuth) {
        setError('يرجى تسجيل الدخول أولاً')
        return
      }
      if (res.status === 503) {
        const errMsg = data.message || 'المرشد مشغول حالياً. يرجى المحاولة بعد لحظة.'
        setMessages(prev => [...prev, { role: 'assistant', content: `⏳ ${errMsg}` }])
        return
      }
      if (!res.ok || !data.reply) {
        throw new Error(data.error || 'Failed to get response')
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err: any) {
      console.error('AI Guide error:', err)
      setError('حدث خطأ. يرجى المحاولة مجدداً.')
    } finally {
      setIsLoading(false)
    }
  }

  const clearConversation = async () => {
    if (!confirm('هل تريد مسح المحادثة؟')) return
    await fetch('/api/ai-guide', { method: 'DELETE' })
    setMessages([])
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Auto-grow textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
  }

  if (!isLoaded || isLoadingHistory) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-ocean opacity-60" />
      </div>
    )
  }

  // Auth wall
  if (!isSignedIn) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center" dir="rtl">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-ocean/20 to-seafoam/20 flex items-center justify-center text-4xl shadow-inner">
          🌊
        </div>
        <div>
          <h2 className="font-display text-2xl text-text-primary font-bold mb-2">
            مرشد موكادور الذكي
          </h2>
          <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
            سجل دخولك للتحدث مع مرشدنا الذكي واكتشف أفضل ما تقدمه الصويرة من حرفيين وتجارب فريدة
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <SignInButton mode="modal">
            <button className="w-full py-3 rounded-xl bg-ocean text-white font-semibold flex items-center justify-center gap-2 hover:bg-ocean/90 transition-colors shadow-md">
              <Lock className="w-4 h-4" />
              تسجيل الدخول للمتابعة
            </button>
          </SignInButton>
          <p className="text-text-muted text-xs">
            ليس لديك حساب؟{' '}
            <a href="/sign-up" className="text-ocean underline">إنشاء حساب مجاني</a>
          </p>
        </div>

        {/* Preview conversation */}
        <div className="bg-white rounded-2xl p-4 max-w-xs w-full border border-warm-border shadow-sm" dir="rtl">
          <p className="text-text-muted text-xs mb-3 text-right">✨ مثال على محادثة</p>
          <div className="space-y-2 text-right">
            <div className="bg-ocean text-white text-xs p-2.5 rounded-xl rounded-tl-sm w-fit mr-auto">
              أريد شراء هدية من خشب الثويا
            </div>
            <div className="bg-warm-sand text-text-primary text-xs p-2.5 rounded-xl rounded-tr-sm border border-warm-border">
              أنصحك بزيارة الحرفيين المتخصصين في الثويا ⭐ لديهم صناديق من 300 درهم وأعمال محفورة رائعة...
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-warm-border bg-white/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-ocean/20 to-seafoam/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-ocean" />
          </div>
          <div>
            <p className="font-semibold text-text-primary text-sm leading-tight">مرشد موكادور</p>
            <p className="text-text-muted text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
              متصل
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearConversation}
            className="p-2 rounded-lg hover:bg-warm-sand transition-colors text-text-muted hover:text-red-500"
            title="مسح المحادثة"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Welcome state */}
        {messages.length === 0 && (
          <div className="text-center py-10">
            <div className="text-5xl mb-4">🌊</div>
            <h2 className="font-display text-xl text-text-primary font-bold mb-1">
              أهلاً {user?.firstName || ''}!
            </h2>
            <p className="text-text-secondary text-sm mb-6">
              أنا مرشدك في الصويرة. كيف يمكنني مساعدتك؟
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="text-xs bg-white border border-warm-border rounded-full px-3 py-1.5 text-text-secondary hover:bg-ocean hover:text-white hover:border-ocean transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-ocean/10 flex items-center justify-center ml-2 mt-1 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-ocean" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                ${msg.role === 'user'
                  ? 'bg-ocean text-white rounded-tl-sm'
                  : 'bg-white border border-warm-border text-text-primary rounded-tr-sm shadow-sm'
                }`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none [&_p]:mb-2 [&_ul]:mb-2 [&_li]:mb-1 [&_a]:text-ocean [&_a]:no-underline hover:[&_a]:underline">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-end">
            <div className="w-6 h-6 rounded-full bg-ocean/10 flex items-center justify-center ml-2 mt-1 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-ocean" />
            </div>
            <div className="bg-white border border-warm-border rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm flex gap-1 items-center">
              {[0, 150, 300].map((delay, i) => (
                <span
                  key={i}
                  className="w-2 h-2 bg-text-muted/60 rounded-full animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center">
            <p className="text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2 inline-block border border-red-100">
              {error}
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-warm-border bg-white shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="اسأل عن الصويرة، الحرفيين، التجارب…"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-warm-border px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-ocean bg-warm-white leading-relaxed transition-colors"
            style={{ minHeight: '48px', maxHeight: '128px' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            className="w-12 h-12 rounded-xl bg-ocean text-white flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ocean/90 transition-colors shadow-md"
          >
            {isLoading
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <Send className="w-5 h-5" />
            }
          </button>
        </div>
        <p className="text-center text-text-muted text-[11px] mt-2">
          المرشد متخصص في الصويرة فقط 🌊
        </p>
      </div>
    </div>
  )
}
