'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useUser, SignInButton } from '@clerk/nextjs'
import { Send, Trash2, Loader2, Lock, Sparkles, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_QUESTIONS = [
  '🎨 Who are the best artisans in Essaouira?',
  '🛍️ What should I buy as a gift?',
  '🏄 Where can I learn surfing?',
  '🎵 When is the Gnaoua Festival?',
  '🍜 What are the best restaurants?',
  '🏨 Where should I stay in Essaouira?',
]

// ============================================================================
// 1. INTERACTIVE ARTISAN WIDGET
// ============================================================================
function ArtisanWidget({ username }: { username: string }) {
  const [artisan, setArtisan] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single()
        setArtisan(data)
      } catch (err) {
        console.error('Error fetching artisan card:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [username])

  if (loading) {
    return (
      <div className="w-full max-w-sm bg-warm-sand/40 border border-warm-border rounded-2xl p-4 animate-pulse space-y-3 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-9 bg-gray-200 rounded w-full" />
      </div>
    )
  }

  if (!artisan) return null

  const whatsappUrl = artisan.whatsapp
    ? `https://wa.me/${artisan.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
        `Hello ${artisan.full_name}, I found your profile on essaouira.tech! I would love to learn more about your unique creations.`
      )}`
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[340px] bg-white border border-warm-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all mt-2 space-y-3"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-warm-border bg-gradient-to-br from-terracotta/20 to-saffron/20 flex items-center justify-center font-bold text-terracotta text-lg">
          {artisan.avatar_url ? (
            <img src={artisan.avatar_url} alt={artisan.full_name} className="w-full h-full object-cover" />
          ) : (
            artisan.full_name?.charAt(0).toUpperCase() || 'A'
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-text-primary text-[14px] truncate flex items-center gap-1">
            {artisan.full_name}
            {artisan.verified && <span className="text-ocean">✨</span>}
          </h4>
          <p className="text-text-muted text-[11px] truncate">{artisan.title || 'Local Artisan'}</p>
          {artisan.location && (
            <p className="text-text-secondary text-[10px] flex items-center gap-0.5 truncate">
              📍 {artisan.location}
            </p>
          )}
        </div>
      </div>

      {artisan.bio && (
        <p className="text-text-secondary text-[12px] line-clamp-2 leading-relaxed">
          {artisan.bio}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors shadow-sm"
          >
            💬 WhatsApp
          </a>
        )}
        <a
          href={`/profile/${artisan.username}`}
          className="flex-1 py-2 px-3 bg-ocean hover:bg-ocean/90 text-white rounded-xl text-[11px] font-bold flex items-center justify-center transition-colors shadow-sm text-center"
        >
          View Profile
        </a>
      </div>
    </motion.div>
  )
}

// ============================================================================
// 2. INTERACTIVE PRODUCT WIDGET
// ============================================================================
function ProductWidget({ productId }: { productId: string }) {
  const [product, setProduct] = useState<any>(null)
  const [seller, setSeller] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const supabase = createClient()
        const { data: p } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single()
        
        if (p) {
          setProduct(p)
          const { data: s } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', p.seller_id)
            .single()
          setSeller(s)
        }
      } catch (err) {
        console.error('Error fetching product card:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [productId])

  if (loading) {
    return (
      <div className="w-full max-w-sm bg-warm-sand/40 border border-warm-border rounded-2xl p-4 animate-pulse mt-2 space-y-3">
        <div className="w-full h-32 bg-gray-200 rounded-xl" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
      </div>
    )
  }

  if (!product) return null

  const whatsappUrl = seller?.whatsapp
    ? `https://wa.me/${seller.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
        `Hello! I would like to inquire about this gorgeous handcrafted piece: ${product.title} (${product.price_mad} MAD)`
      )}`
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[340px] bg-white border border-warm-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all mt-2"
    >
      <div className="relative w-full h-36 bg-warm-sand">
        {product.image_url ? (
          <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">
            🛍️ Craft Image
          </div>
        )}
        <div className="absolute top-2 right-2 bg-gradient-to-r from-terracotta to-saffron text-white text-[11px] font-bold px-2 py-1 rounded-lg shadow-md">
          {product.price_mad} MAD
        </div>
      </div>

      <div className="p-3 space-y-2">
        <div>
          <h4 className="font-semibold text-text-primary text-[13px] truncate">{product.title}</h4>
          <p className="text-text-muted text-[10px]">Category: {product.category || 'Handcraft'}</p>
        </div>

        {product.description && (
          <p className="text-text-secondary text-[11px] line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}

        <div className="flex gap-2 pt-1 border-t border-warm-border/50">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors shadow-sm"
            >
              💬 Inquire
            </a>
          )}
          <a
            href={`/marketplace/products/${product.id}`}
            className="flex-1 py-1.5 px-3 bg-ocean hover:bg-ocean/90 text-white rounded-lg text-[10px] font-bold flex items-center justify-center transition-colors shadow-sm text-center"
          >
            Details
          </a>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// 3. INTERACTIVE ITINERARY TIMELINE WIDGET
// ============================================================================
function ItineraryTimelineWidget({ rawText }: { rawText: string }) {
  const steps = rawText
    .replace('[ITINERARY_START]', '')
    .replace('[ITINERARY_END]', '')
    .trim()
    .split('\n')
    .map(line => {
      const parts = line.split('|')
      if (parts.length < 2) return null
      return {
        time: parts[0]?.trim() || '09:00',
        title: parts[1]?.trim() || 'Activity',
        desc: parts[2]?.trim() || '',
      }
    })
    .filter(Boolean) as Array<{ time: string; title: string; desc: string }>

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md bg-gradient-to-br from-warm-sand/20 to-white border border-warm-border rounded-2xl p-5 shadow-sm mt-3 space-y-4"
    >
      <div className="flex items-center gap-2 border-b border-warm-border/60 pb-3">
        <span className="text-xl">🗺️</span>
        <div>
          <h4 className="font-bold text-text-primary text-[14px]">Your Essaouira Day Plan</h4>
          <p className="text-text-muted text-[10px]">Curated itinerary for the ultimate coastal experience</p>
        </div>
      </div>

      <div className="relative pl-6 space-y-6">
        {/* Vertical line indicator */}
        <div className="absolute left-2.5 top-2 bottom-2 w-[1px] border-l border-dashed border-ocean/40" />

        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative space-y-1"
          >
            {/* Circle dot on line */}
            <div className="absolute -left-[20.5px] top-1 w-3 h-3 rounded-full border-[2.5px] border-white bg-ocean shadow-sm" />

            <div className="flex items-center gap-2">
              <span className="bg-ocean/10 text-ocean text-[10px] font-bold px-2 py-0.5 rounded-full">
                🕒 {step.time}
              </span>
              <h5 className="font-semibold text-text-primary text-[12px]">{step.title}</h5>
            </div>
            {step.desc && (
              <p className="text-text-secondary text-[11px] leading-relaxed pl-1">
                {step.desc}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      <div className="flex gap-2 pt-2 border-t border-warm-border/50">
        <a
          href="https://www.google.com/maps/place/Essaouira"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 px-3 bg-warm-sand hover:bg-warm-border/40 border border-warm-border text-text-secondary rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
        >
          📍 View Map
        </a>
        <a
          href="/book"
          className="flex-1 py-2 px-3 bg-gradient-to-r from-terracotta to-saffron text-white rounded-xl text-[10px] font-bold flex items-center justify-center transition-all shadow-md text-center"
        >
          Book Live Guide
        </a>
      </div>
    </motion.div>
  )
}

// ============================================================================
// MAIN PAGE CLIENT
// ============================================================================
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
        setError('Please sign in first')
        return
      }
      if (res.status === 503) {
        const errMsg = data.message || 'The guide is busy at the moment. Please try again in a moment.'
        setMessages(prev => [...prev, { role: 'assistant', content: `⏳ ${errMsg}` }])
        return
      }
      if (!res.ok || !data.reply) {
        throw new Error(data.error || 'Failed to get response')
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err: any) {
      console.error('AI Guide error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const clearConversation = async () => {
    if (!confirm('Do you want to clear the conversation?')) return
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

  // Beautiful parsing of interactive markdown vs widgets
  const renderMessageContent = (content: string) => {
    const regex = /(\[ARTISAN:\w+\]|\[PRODUCT:[\w-]+\]|\[ITINERARY_START[\s\S]*?ITINERARY_END\])/g
    const parts = content.split(regex)

    return parts.map((part, idx) => {
      if (part.startsWith('[ARTISAN:') && part.endsWith(']')) {
        const username = part.replace('[ARTISAN:', '').replace(']', '').trim()
        return <ArtisanWidget key={idx} username={username} />
      }
      if (part.startsWith('[PRODUCT:') && part.endsWith(']')) {
        const productId = part.replace('[PRODUCT:', '').replace(']', '').trim()
        return <ProductWidget key={idx} productId={productId} />
      }
      if (part.startsWith('[ITINERARY_START') && part.endsWith('ITINERARY_END]')) {
        return <ItineraryTimelineWidget key={idx} rawText={part} />
      }

      return (
        <div key={idx} className="prose prose-sm max-w-none [&_p]:mb-2 [&_ul]:mb-2 [&_li]:mb-1 [&_a]:text-ocean [&_a]:no-underline hover:[&_a]:underline">
          <ReactMarkdown>{part}</ReactMarkdown>
        </div>
      )
    })
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
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center" dir="ltr">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-ocean/20 to-seafoam/20 flex items-center justify-center text-4xl shadow-inner">
          🌊
        </div>
        <div>
          <h2 className="font-display text-2xl text-text-primary font-bold mb-2">
            Mogador Intelligent AI Guide
          </h2>
          <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
            Sign in to talk with our intelligent guide and discover the best artisans, surfing spots, and unique cultural experiences in Essaouira
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <SignInButton mode="modal">
            <button className="w-full py-3 rounded-xl bg-ocean text-white font-semibold flex items-center justify-center gap-2 hover:bg-ocean/90 transition-colors shadow-md">
              <Lock className="w-4 h-4" />
              Sign In to Continue
            </button>
          </SignInButton>
          <p className="text-text-muted text-xs">
            Don&apos;t have an account?{' '}
            <a href="/sign-up" className="text-ocean underline">Create a free account</a>
          </p>
        </div>

        {/* Preview conversation */}
        <div className="bg-white rounded-2xl p-4 max-w-xs w-full border border-warm-border shadow-sm" dir="ltr">
          <p className="text-text-muted text-xs mb-3 text-left">✨ Conversation Example</p>
          <div className="space-y-2 text-left">
            <div className="bg-ocean text-white text-xs p-2.5 rounded-xl rounded-tr-sm w-fit ml-auto">
              I want to buy a Thuya wood gift
            </div>
            <div className="bg-warm-sand text-text-primary text-xs p-2.5 rounded-xl rounded-tl-sm border border-warm-border mr-auto w-fit">
              I recommend visiting specialized Thuya artisans ⭐ they have beautiful carved boxes from 300 MAD...
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" dir="ltr">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-warm-border bg-white/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-ocean/20 to-seafoam/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-ocean" />
          </div>
          <div>
            <p className="font-semibold text-text-primary text-sm leading-tight">Mogador Guide</p>
            <p className="text-text-muted text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
              Online
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearConversation}
            className="p-2 rounded-lg hover:bg-warm-sand transition-colors text-text-muted hover:text-red-500"
            title="Clear Conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-warm-sand/20">

        {/* Welcome state */}
        {messages.length === 0 && (
          <div className="text-center py-10">
            <div className="text-5xl mb-4 animate-pulse">🌊</div>
            <h2 className="font-display text-xl text-text-primary font-bold mb-1">
              Hello {user?.firstName || ''}!
            </h2>
            <p className="text-text-secondary text-sm mb-6">
              I am your guide in Essaouira. How can I help you today?
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="text-xs bg-white border border-warm-border rounded-full px-3 py-1.5 text-text-secondary hover:bg-ocean hover:text-white hover:border-ocean transition-all shadow-sm"
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
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-ocean/10 flex items-center justify-center mr-2 mt-1 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-ocean" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                ${msg.role === 'user'
                  ? 'bg-ocean text-white rounded-tr-sm shadow-sm'
                  : 'bg-white border border-warm-border text-text-primary rounded-tl-sm shadow-sm'
                }`}
            >
              {msg.role === 'assistant' ? (
                <div className="space-y-3">
                  {renderMessageContent(msg.content)}
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-full bg-ocean/10 flex items-center justify-center mr-2 mt-1 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-ocean" />
            </div>
            <div className="bg-white border border-warm-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex gap-1 items-center">
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
        
        {/* Quick Day Plan Button Prompt */}
        <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => sendMessage('🗺️ Plan my day in Essaouira / خطط ليومي في الصويرة')}
            className="text-[12px] font-bold bg-gradient-to-r from-ocean/10 to-seafoam/10 text-ocean border border-ocean/20 hover:border-ocean/40 rounded-xl px-4 py-2 flex items-center gap-1.5 shrink-0 transition-all shadow-sm"
          >
            🗺️ Plan my day in Essaouira / خطط ليومي في الصويرة
          </motion.button>
        </div>

        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask about Essaouira, artisans, surfing, food..."
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
          The guide is specialized in Essaouira only 🌊
        </p>
      </div>
    </div>
  )
}
