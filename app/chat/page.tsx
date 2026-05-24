'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  Send, Compass, Sparkles, AlertCircle, RefreshCw, 
  MapPin, Store as StoreIcon, ShieldCheck, HeartHandshake,
  DollarSign, ArrowRight, User, Bot, HelpCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface RotatorKeyStats {
  keyIndex: number;
  requestsThisMinute: number;
  totalRequests: number;
  isRateLimited: boolean;
  errors: number;
  status: string;
}

export default function ChatPage() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `أهلاً بك يا صديقي! 🌊 أنا "مرشد موكادور" الرقمي، مرشدك ومفاوضك البلدي الخاص في أسواق الصويرة العتيقة. 

كيف يمكنني مساعدتك اليوم؟ يمكننا:
1. 🗺️ التخطيط لرحلة مثالية في أزقة المدينة القديمة.
2. 🪵 التعرف على سر خشب العرعر الفريد بورشات باب دكالة.
3. ⛺ البحث عن أفضل الزرابي البربرية الأصلية.
4. 🌳 مساومة وحساب أسعار منتجات الأركان الفاخرة!

أخبرني، ما الذي تبحث عنه؟ ✨`,
      timestamp: new Date()
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [telemetry, setTelemetry] = useState<RotatorKeyStats[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Fetch telemetry initial stats or whenever message completes
  const fetchTelemetry = async () => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'stats' }] })
      });
      const data = await response.json();
      if (data.rotatorStats) {
        setTelemetry(data.rotatorStats);
      }
    } catch (e) {
      console.warn('Failed to load initial rotator telemetry stats');
    }
  };

  useEffect(() => {
    // Gracefully load stats
    fetchTelemetry();
  }, []);

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
          userName: user?.fullName || 'Zائر موكادور'
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

      if (data.rotatorStats) {
        setTelemetry(data.rotatorStats);
      }

    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `عذراً يا صديقي، يبدو أن رياح موكادور العاتية عطلت الاتصال بالخادم مؤقتاً. أعد إرسال رسالتك وسأبذل قصارى جهدي لمساعدتك! 🌊`,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Bargain prompts assistant
  const BARGAIN_TEMPLATES = [
    { label: '🎫 خطط لي مسار يوم كامل بالصويرة', text: 'خطط لي مسار يوم كامل في الصويرة يشمل الميناء، المطاعم والورش الحرفية' },
    { label: '🪵 ابحث لي عن صناديق خشب العرعر', text: 'أريد شراء صندوق خشبي فاخر من خشب العرعر الأصلي (الثويا)، اقترح علي منتجات حرفية' },
    { label: '⛺ ساوم على زربية بربرية أصيلة', text: 'أريد معرفة أسعار الزرابي البربرية الأصلية بالمدينة العتيقة وكيف أساوم الحرفي؟' },
    { label: '🌳 أسعار زيت الأركان بالتعاونيات', text: 'ما هي أسعار زيت الأركان التجميلي وكيف أتأكد أنه أصلي من التعاونيات المحلية؟' }
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#18181B] flex flex-col">
      {/* Top Banner */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-150 px-4 sm:px-6 lg:px-8 py-4 shadow-sm select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#18181B] to-[#4F46E5] flex items-center justify-center text-white shadow-md">
              <Compass className="h-5 w-5 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg flex items-center gap-1.5" >
                مرشد موكادور الذكي <span className="text-[9px] bg-indigo-50 text-[#18181B] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Medina AI</span>
              </h1>
              <p className="text-[10px] text-[#71717A] font-light">
                مفاوضك ودليلك التفاعلي لأسواق وحرف مدينة الصويرة
              </p>
            </div>
          </div>
          
          <Link href="/" className="text-xs font-extrabold text-[#71717A] hover:text-[#71717A] transition-colors uppercase tracking-wider flex items-center gap-1.5">
            Back to Marketplace <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </header>

      {/* Main Grid View */}
      <div className="max-w-7xl mx-auto w-full flex-1 px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8 items-stretch overflow-hidden">
        
        {/* Left Column: Chat Window */}
        <div className="flex-1 bg-white border border-gray-150 rounded-3xl shadow-sm flex flex-col overflow-hidden min-h-[550px]">
          
          {/* Chat header area */}
          <div className="bg-[#F5F0E8] border-b border-gray-150 px-6 py-4 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-extrabold text-[#71717A] uppercase tracking-widest">
                Live Negotiating Assistant
              </span>
            </div>
            <span className="text-[10px] bg-[#18181B] text-white px-2.5 py-1 rounded-xl font-bold uppercase tracking-wider">
              {user ? `Welcome, ${user.firstName}` : 'Tourist Mode'}
            </span>
          </div>

          {/* Message Stream */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 max-h-[500px]">
            {messages.map((msg, index) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div 
                  key={index}
                  className={`flex gap-4 ${isAssistant ? 'justify-start' : 'justify-end'} animate-in fade-in duration-200`}
                >
                  {isAssistant && (
                    <div className="h-9 w-9 shrink-0 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#18181B]">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  
                  <div className="max-w-[80%] space-y-3">
                    <div 
                      className={`rounded-2xl p-4 text-sm leading-relaxed ${
                        isAssistant 
                          ? 'bg-[#F5F0E8] border border-gray-150 text-[#18181B] rounded-tl-none font-light' 
                          : 'bg-[#18181B] text-white rounded-tr-none font-bold'
                      }`}
                    >
                      {isAssistant ? (
                        <div className="prose prose-sm prose-slate max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>
                    
                    {/* Visual parsed components */}
                    {isAssistant && <MessageComponentsParser text={msg.content} />}

                    <span className="text-[9px] text-[#71717A] font-extrabold block px-1 select-none">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {!isAssistant && (
                    <div className="h-9 w-9 shrink-0 rounded-xl bg-[#E8E3D8] border border-[rgba(232,227,216,0.8)] flex items-center justify-center text-[#71717A]">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-4 justify-start animate-pulse">
                <div className="h-9 w-9 shrink-0 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#18181B]">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                </div>
                <div className="max-w-[70%] bg-[#F5F0E8] border border-gray-150 rounded-2xl rounded-tl-none p-4">
                  <span className="text-xs text-[#71717A] font-bold tracking-wider animate-bounce block">
                    مرشد موكادور يبحث في سجلات الحرفيين...
                  </span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Bargain Helper Prompts Box */}
          <div className="px-6 py-3 bg-[#F5F0E8] border-t border-gray-150 select-none">
            <span className="text-[8px] font-extrabold text-[#71717A] uppercase tracking-widest block mb-2">
              💡 Medina Bargain Helper Buttons / مساعدة المساومة
            </span>
            <div className="flex flex-wrap gap-2">
              {BARGAIN_TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(tpl.text)}
                  className="bg-white border border-[rgba(232,227,216,0.8)] hover:border-[#18181B] transition-colors rounded-xl px-3 py-1.5 text-[10px] font-extrabold cursor-pointer shadow-sm text-[#71717A] hover:text-[#18181B]"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Panel */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="p-4 bg-white border-t border-gray-150 flex items-center gap-3"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="اكتب سؤالك هنا باللغة العربية أو الدارجة..."
              className="flex-1 bg-[#F5F0E8] border border-[rgba(232,227,216,0.8)] focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B] rounded-2xl px-5 py-3.5 text-sm outline-none spring-transition"
              style={{ direction: 'rtl' }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="h-12 w-12 shrink-0 rounded-2xl bg-[#18181B] hover:bg-[#18181B] disabled:bg-[#E8E3D8] disabled:text-gray-300 text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>

        </div>

        {/* Right Column: Rotator Telemetry Monitoring Panel */}
        <div className="w-full lg:w-[350px] bg-white border border-gray-150 rounded-3xl p-6 shadow-sm flex flex-col justify-between select-none">
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-[#18181B] uppercase tracking-widest">
                Telemetry Dashboard
              </span>
              <h2 className="text-lg font-extrabold text-[#18181B]" >
                Gemini Key Rotator
              </h2>
              <p className="text-[11px] text-[#71717A] font-light leading-relaxed">
                Live monitoring of the process-level Gemini 2.5 API key status rotator, managing concurrency rate limiting under load.
              </p>
            </div>

            <div className="border-t border-[rgba(232,227,216,0.45)] pt-4 space-y-3">
              <span className="text-[9px] font-extrabold text-[#71717A] uppercase tracking-widest block">
                API Key Rotation Nodes
              </span>
              
              <div className="space-y-2.5">
                {telemetry.length === 0 ? (
                  <div className="p-4 text-center rounded-2xl border border-dashed border-[rgba(232,227,216,0.8)]">
                    <HelpCircle className="h-8 w-8 text-gray-300 mx-auto mb-1 animate-pulse" />
                    <span className="text-[10px] text-[#71717A] font-extrabold uppercase tracking-wide">
                      No request telemetry yet
                    </span>
                  </div>
                ) : (
                  telemetry.map((key) => (
                    <div 
                      key={key.keyIndex}
                      className="border border-[rgba(232,227,216,0.45)] bg-[#F5F0E8]/50 rounded-2xl p-3.5 flex items-center justify-between hover:bg-[#F5F0E8] transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#18181B]">
                            Key Node #{key.keyIndex}
                          </span>
                          <span className={`text-[8.5px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            key.isRateLimited 
                              ? 'bg-rose-50 text-rose-500 border border-rose-100'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}>
                            {key.status}
                          </span>
                        </div>
                        <span className="text-[9px] text-[#71717A] font-bold block">
                          RPM Load: {key.requestsThisMinute}/30 requests
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-gray-700 block">
                          {key.totalRequests}
                        </span>
                        <span className="text-[8px] text-[#71717A] font-extrabold uppercase tracking-wider block">
                          Total Calls
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          <div className="border-t border-[rgba(232,227,216,0.45)] pt-4 mt-6 flex items-center gap-3">
            <Compass className="h-5 w-5 text-gray-300" />
            <div>
              <span className="text-[8px] font-bold text-[#71717A] uppercase tracking-widest block">
                Load Balancing Mode
              </span>
              <span className="text-[10px] font-extrabold text-[#18181B] block">
                Round-Robin Rate-Limit-Aware Rotator
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

// 🗺️ PARSER SUB-COMPONENT
function MessageComponentsParser({ text }: { text: string }) {
  // 1. Parse Itinerary if present
  const itineraryMatch = text.match(/\[ITINERARY_START\]([\s\S]*?)\[ITINERARY_END\]/);
  
  // 2. Parse Product tags if present
  const productMatches = [...text.matchAll(/\[PRODUCT:([a-f0-9-]+)\]/gi)];
  
  // 3. Parse Artisan tags if present
  const artisanMatches = [...text.matchAll(/\[ARTISAN:([a-zA-Z0-9_]+)\]/gi)];

  const hasItinerary = !!itineraryMatch;
  const hasProducts = productMatches.length > 0;
  const hasArtisans = artisanMatches.length > 0;

  if (!hasItinerary && !hasProducts && !hasArtisans) return null;

  return (
    <div className="space-y-4 py-2 border-t border-[rgba(232,227,216,0.45)] select-none">
      
      {/* RENDER ITINERARY */}
      {hasItinerary && itineraryMatch[1] && (
        <div className="bg-gradient-to-tr from-indigo-50/50 to-white border border-indigo-100 rounded-2xl p-4 space-y-3">
          <span className="text-[9px] font-extrabold text-[#18181B] uppercase tracking-widest flex items-center gap-1.5">
            🗺️ Proposed Essaouira Timeline Day Plan / خطة اليوم المقترحة
          </span>
          <div className="relative pl-4 border-l border-indigo-200 ml-2 space-y-4">
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
                  <div key={idx} className="relative group">
                    {/* Dot */}
                    <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#18181B] border border-white group-hover:scale-125 transition-transform" />
                    <div>
                      <span className="text-[10px] font-extrabold text-[#18181B]">{time}</span>
                      <h4 className="text-xs font-extrabold text-gray-800 mt-0.5">{activity}</h4>
                      <p className="text-[11px] text-[#71717A] font-light mt-0.5">{desc}</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* RENDER DYNAMIC MOCK PRODUCT RECOMMENDATIONS CARDS */}
      {hasProducts && (
        <div className="space-y-2">
          <span className="text-[8.5px] font-extrabold text-[#71717A] uppercase tracking-widest block">
            🛒 Recommended Crafts / منتجات حرفية مقترحة
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {productMatches.map((m, idx) => {
              const prodId = m[1];
              // Render beautiful card
              return (
                <div key={idx} className="border border-gray-150 bg-white rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="h-24 w-full bg-[#E8E3D8] rounded-xl overflow-hidden mb-3 relative">
                      <div className="absolute inset-0 bg-gradient-to-tr from-gray-200 to-gray-50 opacity-20" />
                      {/* Decorative badge */}
                      <span className="absolute top-2 right-2 bg-indigo-50 border border-indigo-100 text-[#18181B] text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">
                        Vetted Genuine
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-gray-800 line-clamp-1">Bohemian Heritage Craft</h4>
                    <span className="text-[9px] text-[#71717A] font-bold block mt-0.5">Product ID: {prodId.slice(0, 8)}...</span>
                  </div>

                  <div className="border-t border-[rgba(232,227,216,0.45)] pt-3 mt-4 flex items-center justify-between">
                    <span className="text-xs font-black text-gray-700">COD Available</span>
                    <Link 
                      href={`/product/voyager-duffle`} // Fallback static path that always parses safely
                      className="text-[10px] font-extrabold text-[#18181B] uppercase flex items-center gap-0.5"
                    >
                      Inspect Item <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RENDER DYNAMIC MOCK ARTISAN RECOMMENDATIONS CARDS */}
      {hasArtisans && (
        <div className="space-y-2">
          <span className="text-[8.5px] font-extrabold text-[#71717A] uppercase tracking-widest block">
            ⛺ Recommended Master Artisans / المعلمين المقترحين
          </span>
          <div className="space-y-2.5">
            {artisanMatches.map((m, idx) => {
              const username = m[1];
              return (
                <div key={idx} className="border border-gray-150 bg-white rounded-2xl p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#E8E3D8] flex items-center justify-center text-[#71717A] font-bold uppercase text-xs border border-[rgba(232,227,216,0.8)]">
                      {username.slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1">
                        Maallem @{username} <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
                      </h4>
                      <span className="text-[9px] text-[#71717A] font-bold flex items-center gap-0.5 mt-0.5">
                        <MapPin className="h-3 w-3" /> Medina Souk Workshop, Essaouira
                      </span>
                    </div>
                  </div>

                  <Link 
                    href={`/store/${username}`} 
                    className="bg-[#F5F0E8] border border-gray-150 hover:bg-[#E8E3D8] hover:border-gray-300 text-[10px] font-extrabold px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                  >
                    Open Shop ⛺
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
