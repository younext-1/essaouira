'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { 
  Send, Compass, Sparkles, AlertCircle, RefreshCw, 
  MapPin, Store as StoreIcon, ShieldCheck, HeartHandshake,
  ArrowRight, User, Bot, HelpCircle, MessageSquare, X, Minimize2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function GlobalChatbot() {
  const { user } = useUser();
  const pathname = usePathname();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeContext, setActiveContext] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Track path change to capture new page context
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect Context based on active route
    const detectContext = () => {
      let ctx: any = null;

      // 1. Check if window state has exact contextual variables registered by the page
      if (pathname.startsWith('/product/') && (window as any).__PRODUCT_CONTEXT__) {
        ctx = { type: 'product', ...(window as any).__PRODUCT_CONTEXT__ };
      } else if (pathname.startsWith('/store/') && (window as any).__STORE_CONTEXT__) {
        ctx = { type: 'store', ...(window as any).__STORE_CONTEXT__ };
      } else if (pathname === '/') {
        ctx = { type: 'homepage' };
      } else {
        // 2. Scraper fallback to query details directly from DOM
        if (pathname.startsWith('/product/')) {
          const productTitle = document.querySelector('h1')?.textContent?.trim() || 'صناعة تقليدية فاخرة';
          let productPrice = 250;
          const priceElement = document.querySelector('.text-3xl.font-extrabold, [data-product-price], span.text-sm.font-extrabold');
          if (priceElement) {
            const priceText = priceElement.textContent || '';
            const match = priceText.match(/(\d+)/);
            if (match) productPrice = parseInt(match[1]);
          }
          ctx = {
            type: 'product',
            productTitle,
            productPrice,
            productCategory: 'صناعة الخشب العتيقة',
            sellerName: 'معلم الصويرة المحلي',
            sellerUsername: 'souk_artisan',
            productDescription: 'تحفة يدوية ممتازة تم تشكيلها من خشب العرعر والصناعات المحلية بالصويرة.'
          };
        } else if (pathname.startsWith('/store/')) {
          const slug = pathname.split('/store/')[1] || 'artisan';
          const storeName = document.querySelector('h1')?.textContent?.trim() || 'متجر ورشة الصويرة';
          ctx = {
            type: 'store',
            storeName,
            storeSlug: slug,
            storeBio: 'مساحة إبداعية أصيلة لعرض أروع أعمال الفنون والمنسوجات المغربية.',
            storeLocation: 'الملاح القديم، الصويرة',
            storeProducts: []
          };
        } else {
          ctx = { type: 'homepage' };
        }
      }

      setActiveContext(ctx);
    };

    // Delay slightly to ensure DOM is fully populated and mounted
    const timer = setTimeout(detectContext, 800);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Set up initial greeting based on context
  useEffect(() => {
    let welcomeMessage = '';

    if (activeContext?.type === 'product') {
      welcomeMessage = `أهلاً بك! 🌊 أنا أرى أنك تتصفح الآن تحفة: **"${activeContext.productTitle}"** (${activeContext.productPrice} درهم) 📦.
      
هل تريد أن تسألني عن طريقة صنعها؟ أم ترغب في معرفة المزيد عن هذا الحرفي وخيارات التخصيص والشحن COD؟ أنا هنا لمساعدتك! ✨`;
    } else if (activeContext?.type === 'store') {
      welcomeMessage = `مرحباً بك في ورشة الحرفي الممتاز: **"${activeContext.storeName}"** (@${activeContext.storeSlug}) ⛺.
      
يسعدني إرشادك حول المنتجات المتاحة في هذا المتجر بالذات، وموقع ورشتهم الفعلية بالمدينة العتيقة، أو مساعدتك في مساومة السعر والحصول على أفضل عرض! ما الذي يثير اهتمامك هنا؟ ✨`;
    } else {
      welcomeMessage = `أهلاً بك يا صديقي! 🌊 أنا "مرشد موكادور" الرقمي، دليلك ومساعدك الذكي في متجر ومنصة الصويرة.

أنا هنا للإجابة على جميع تساؤلاتك حول السياحة، الحرف التراثية، خشب العرعر، الأركان الأصيل، أو مساعدتك في العثور على أفضل الحرفيين والمنتجات! 🗺️✨`;
    }

    setMessages([
      {
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date()
      }
    ]);
  }, [activeContext]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const userPayload = [
        ...messages,
        userMsg
      ].map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: userPayload,
          userName: user?.fullName || 'زائر موكادور',
          pageContext: activeContext
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.content,
        timestamp: new Date()
      }]);

    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `عذراً يا صديقي، يبدو أن رياح موكادور العاتية عطلت الاتصال مؤقتاً. أعد إرسال رسالتك وسأجيبك فوراً! 🌊`,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const getContextPillLabel = () => {
    if (!activeContext) return 'الرئيسية 🌊';
    if (activeContext.type === 'product') return `تصفح منتج: ${activeContext.productTitle.slice(0, 18)}... 📦`;
    if (activeContext.type === 'store') return `تصفح متجر: ${activeContext.storeName.slice(0, 18)}... ⛺`;
    return 'سياق الصويرة العام 🗺️';
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none font-sans">
      
      {/* 1. FLOATING BUBBLE BUTTON */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-gradient-to-tr from-[#4F46E5] to-[#18181B] text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform cursor-pointer relative group border border-white/20"
        >
          <Compass className="h-6 w-6 animate-spin" style={{ animationDuration: '10s' }} />
          
          {/* Glowing Ping Aura */}
          <span className="absolute -inset-1 rounded-full bg-indigo-500/30 animate-ping -z-10" />

          {/* Quick Notification Dot */}
          <span className="absolute top-0 right-0 h-3.5 w-3.5 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          </span>

          {/* Hover Tooltip */}
          <div className="absolute right-16 top-1/2 -translate-y-1/2 bg-[#18181B] text-white text-xs font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">
            اسأل مرشد موكادور الذكي 💬
          </div>
        </button>
      )}

      {/* 2. CHAT DRAWER PANEL */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[550px] bg-white border border-[rgba(232,227,216,0.45)] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#18181B] to-[#1F2937] text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Compass className="h-5 w-5 animate-spin" style={{ animationDuration: '12s' }} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                  مرشد موكادور الذكي
                  <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Live</span>
                </h3>
                <span className="text-[9px] text-[#71717A] block font-light">مساعدك السياحي والتجاري المباشر بالصويرة</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-[#71717A] hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Page Context Detection Pill bar */}
          <div className="bg-[#F5F0E8] border-b border-[rgba(232,227,216,0.45)] px-4 py-2 flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5 text-[#71717A] font-bold">
              <Sparkles className="h-3 w-3 text-indigo-500" />
              <span>موقعك الحالي:</span>
            </div>
            <span className="bg-indigo-50 border border-indigo-100 text-[#18181B] px-2 py-0.5 rounded-full font-bold">
              {getContextPillLabel()}
            </span>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[380px] bg-[#F5F0E8]/50">
            {messages.map((msg, index) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div 
                  key={index}
                  className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'} animate-in fade-in duration-200`}
                >
                  {isAssistant && (
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#18181B]">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div className="max-w-[85%] space-y-1.5">
                    <div 
                      className={`rounded-2xl p-3 text-xs leading-relaxed ${
                        isAssistant 
                          ? 'bg-white border border-gray-150 text-[#18181B] rounded-tl-none font-normal' 
                          : 'bg-[#18181B] text-white rounded-tr-none font-semibold'
                      }`}
                    >
                      {isAssistant ? (
                        <div className="prose prose-sm max-w-none text-gray-800">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>

                    {/* Renders Custom Visual recommended cards in response */}
                    {isAssistant && <MessageComponentsParser text={msg.content} />}

                    <span className="text-[8px] text-[#71717A] font-bold block px-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {!isAssistant && (
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-gray-200 border border-gray-300 flex items-center justify-center text-[#71717A]">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 justify-start animate-pulse">
                <div className="h-8 w-8 shrink-0 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#18181B]">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                </div>
                <div className="max-w-[75%] bg-white border border-gray-150 rounded-2xl rounded-tl-none p-3">
                  <span className="text-[10px] text-[#71717A] font-bold animate-bounce block">
                    مرشد موكادور يتأمل التفاصيل...
                  </span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Helper Bargain buttons */}
          <div className="px-4 py-2 bg-[#F5F0E8] border-t border-[rgba(232,227,216,0.45)] flex gap-2 overflow-x-auto select-none no-scrollbar">
            <button
              onClick={() => handleSendMessage('كيف يمكنني مساومة بائع خشب العرعر؟ 🪵')}
              className="bg-white border border-[rgba(232,227,216,0.8)] hover:border-[#18181B] transition-colors rounded-xl px-2.5 py-1 text-[9px] font-bold text-[#71717A] shrink-0 cursor-pointer shadow-sm hover:text-[#18181B]"
            >
              🪵 نصائح المساومة
            </button>
            <button
              onClick={() => handleSendMessage('خطط ليوم كامل في الصويرة 🗺️')}
              className="bg-white border border-[rgba(232,227,216,0.8)] hover:border-[#18181B] transition-colors rounded-xl px-2.5 py-1 text-[9px] font-bold text-[#71717A] shrink-0 cursor-pointer shadow-sm hover:text-[#18181B]"
            >
              🗺️ خطة يوم بالصويرة
            </button>
            <button
              onClick={() => handleSendMessage('كيف أتأكد أن زيت الأركان أصلي؟ 🌳')}
              className="bg-white border border-[rgba(232,227,216,0.8)] hover:border-[#18181B] transition-colors rounded-xl px-2.5 py-1 text-[9px] font-bold text-[#71717A] shrink-0 cursor-pointer shadow-sm hover:text-[#18181B]"
            >
              🌳 زيت الأركان الأصلي
            </button>
          </div>

          {/* Input Panel Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="p-3 bg-white border-t border-[rgba(232,227,216,0.45)] flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="اكتب رسالتك للمفاوض الذكي..."
              className="flex-1 bg-[#F5F0E8] border border-[rgba(232,227,216,0.8)] focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B] rounded-xl px-3.5 py-2.5 text-xs outline-none spring-transition"
              style={{ direction: 'rtl' }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="h-9 w-9 shrink-0 rounded-xl bg-[#18181B] hover:bg-[#18181B] disabled:bg-[#E8E3D8] disabled:text-gray-300 text-white flex items-center justify-center transition-colors cursor-pointer shadow"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
}

// Visual Cards Parser Sub-Component for Floating Widget
function MessageComponentsParser({ text }: { text: string }) {
  const itineraryMatch = text.match(/\[ITINERARY_START\]([\s\S]*?)\[ITINERARY_END\]/);
  const productMatches = [...text.matchAll(/\[PRODUCT:([a-f0-9-]+)\]/gi)];
  const artisanMatches = [...text.matchAll(/\[ARTISAN:([a-zA-Z0-9_]+)\]/gi)];

  const hasItinerary = !!itineraryMatch;
  const hasProducts = productMatches.length > 0;
  const hasArtisans = artisanMatches.length > 0;

  if (!hasItinerary && !hasProducts && !hasArtisans) return null;

  return (
    <div className="space-y-3 py-2 border-t border-[rgba(232,227,216,0.45)] select-none">
      
      {/* 1. ITINERARY TIMELINE */}
      {hasItinerary && itineraryMatch[1] && (
        <div className="bg-gradient-to-tr from-indigo-50/50 to-white border border-indigo-100 rounded-xl p-3 space-y-2">
          <span className="text-[8px] font-extrabold text-[#18181B] uppercase tracking-wider block">
            🗺️ خطة اليوم المقترحة بالصويرة:
          </span>
          <div className="relative pl-3 border-l border-indigo-200 ml-1.5 space-y-3">
            {itineraryMatch[1]
              .trim()
              .split('\n')
              .map((line, idx) => {
                const parts = line.split('|');
                if (parts.length < 3) return null;
                const time = parts[0].trim();
                const activity = parts[1].trim();
                const desc = parts[2].trim();
                return (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-[#18181B] border border-white" />
                    <div>
                      <span className="text-[9px] font-extrabold text-[#18181B]">{time}</span>
                      <h4 className="text-[11px] font-bold text-gray-800">{activity}</h4>
                      <p className="text-[10px] text-[#71717A] font-light mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 2. RECOMENDED PRODUCT CARD */}
      {hasProducts && (
        <div className="space-y-1.5">
          <span className="text-[8px] font-extrabold text-[#71717A] uppercase tracking-widest block">
            📦 منتجات تقليدية موصى بها:
          </span>
          <div className="space-y-2">
            {productMatches.slice(0, 2).map((m, idx) => {
              const prodId = m[1];
              return (
                <div key={idx} className="border border-gray-150 bg-white rounded-xl p-2.5 flex items-center justify-between hover:shadow transition-shadow">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 bg-[#E8E3D8] rounded-lg overflow-hidden flex items-center justify-center text-[#71717A]">
                      <StoreIcon className="h-5 w-5 text-[#71717A]" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-gray-800">تحفة خشبية معتمدة</h4>
                      <span className="text-[8px] text-[#71717A] font-bold block">معرف المنتج: {prodId.slice(0, 8)}...</span>
                    </div>
                  </div>
                  <Link 
                    href={`/product/${prodId}`}
                    className="text-[9px] font-extrabold text-[#18181B] hover:underline uppercase flex items-center gap-0.5 cursor-pointer shrink-0"
                  >
                    تفاصيل <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. RECOMMENDED ARTISAN CARD */}
      {hasArtisans && (
        <div className="space-y-1.5">
          <span className="text-[8px] font-extrabold text-[#71717A] uppercase tracking-widest block">
            ⛺ الحرفيين الموصى بزيارتهم:
          </span>
          <div className="space-y-2">
            {artisanMatches.slice(0, 2).map((m, idx) => {
              const username = m[1];
              return (
                <div key={idx} className="border border-gray-150 bg-white rounded-xl p-2.5 flex items-center justify-between hover:shadow transition-shadow">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#18181B] font-bold uppercase text-[10px]">
                      {username.slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-gray-800 flex items-center gap-1">
                        المعلم @{username}
                      </h4>
                      <span className="text-[8px] text-[#71717A] font-bold block">المدينة العتيقة، الصويرة</span>
                    </div>
                  </div>
                  <Link 
                    href={`/store/${username}`}
                    className="bg-[#F5F0E8] border border-gray-150 hover:bg-[#E8E3D8] text-[9px] font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                  >
                    زيارة المتجر ⛺
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
