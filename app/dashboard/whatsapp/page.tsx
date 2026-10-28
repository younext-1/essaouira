'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import WhatsAppIntegration from '@/components/features/WhatsAppIntegration';
import { useMyStore } from '@/hooks/useMyStore';
import { useSupabase } from '@/hooks/useSupabase';
import { 
  Loader2, Bot, Save, Sparkles, HelpCircle, 
  MessageSquare, VolumeX, Volume2, Megaphone, 
  Users, Send, ShieldAlert, CheckCircle2, User, ChevronRight, Clock, Plus, Trash2, X
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_WA_BACKEND_URL || 'http://localhost:3000';

export default function WhatsAppDashboardPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { store, loading: isStoreLoading, updateStore } = useMyStore(user?.id);
  const supabase = useSupabase();

  // Tab State
  const [activeSubTab, setActiveSubTab] = useState<'bot' | 'inbox' | 'campaign'>('bot');

  // AI Instructions States
  const [aiInstructions, setAiInstructions] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isImproving, setIsImproving] = useState(false);

  // Active Chats States (Inbox & Takeover)
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [selectedChatJid, setSelectedChatJid] = useState<string | null>(null);
  const [selectedMuteDuration, setSelectedMuteDuration] = useState(60); // default 60 mins
  const [isTogglingMute, setIsTogglingMute] = useState(false);

  // Campaign States
  const [campaignText, setCampaignText] = useState('');
  const [pastBuyers, setPastBuyers] = useState<any[]>([]);
  const [selectedBuyers, setSelectedBuyers] = useState<string[]>([]); // Phone numbers of selected past buyers
  const [manualNumbers, setManualNumbers] = useState<string[]>([]);
  const [newNumberInput, setNewNumberInput] = useState('');
  const [isLaunchingCampaign, setIsLaunchingCampaign] = useState(false);
  const [campaignSuccess, setCampaignSuccess] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [loadingBuyers, setLoadingBuyers] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // 1. Fetch Sales Analytics from Supabase (WhatsApp AI tagged orders)
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!store?.id || !supabase) return;
      setLoadingAnalytics(true);
      try {
        const { data, error } = await supabase
          .from('child_orders')
          .select('subtotal, status')
          .eq('store_id', store.id)
          .ilike('seller_notes', '%WhatsApp AI%');

        if (error) throw error;

        if (data) {
          const total = data.length;
          const revenue = data
            .filter((o) => o.status !== 'cancelled')
            .reduce((sum, o) => sum + parseFloat(o.subtotal || 0), 0);
          const pending = data.filter((o) => o.status === 'pending').length;
          const completed = data.filter((o) => ['completed', 'delivered'].includes(o.status)).length;

          setAnalytics({
            totalOrders: total,
            totalRevenue: revenue,
            pendingOrders: pending,
            completedOrders: completed,
          });
        }
      } catch (err) {
        console.error('Failed to load WhatsApp analytics:', err);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    fetchAnalytics();
  }, [store?.id, supabase, activeSubTab]);

  // 2. Fetch Past Buyers from Supabase Orders (for Broadcast Campaigns)
  useEffect(() => {
    const fetchPastBuyers = async () => {
      if (!store?.id || !supabase) return;
      setLoadingBuyers(true);
      try {
        const { data, error } = await supabase
          .from('child_orders')
          .select(`
            id,
            parent_orders (
              id,
              shipping_address
            )
          `)
          .eq('store_id', store.id);

        if (error) throw error;

        if (data) {
          const buyers = data
            .map((co: any) => {
              const parent = co.parent_orders || {};
              const shippingAddr = parent.shipping_address || {};
              return {
                name: shippingAddr.name || 'Zouiri Buyer',
                phone: shippingAddr.phone || '',
              };
            })
            .filter((b) => b.phone && b.phone.length > 5)
            .reduce((unique: any[], item) => {
              if (!unique.some((obj) => obj.phone === item.phone)) {
                unique.push(item);
              }
              return unique;
            }, []);
          setPastBuyers(buyers);
        }
      } catch (err) {
        console.error('Failed to load past buyers:', err);
      } finally {
        setLoadingBuyers(false);
      }
    };

    if (activeSubTab === 'campaign') {
      fetchPastBuyers();
    }
  }, [store?.id, supabase, activeSubTab]);

  // 3. Fetch Active Chats from Baileys Engine (Shared Inbox & Takeover)
  const fetchActiveChats = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/session/chats/${user.id}`);
      if (!response.ok) return;
      const data = await response.json();
      if (data.success && data.chats) {
        setActiveChats(data.chats);
      }
    } catch (err) {
      console.log('Failed to fetch active chats:', err);
    }
  };

  useEffect(() => {
    if (user?.id && activeSubTab === 'inbox') {
      fetchActiveChats();
      const interval = setInterval(fetchActiveChats, 5000);
      return () => clearInterval(interval);
    }
  }, [user?.id, activeSubTab]);

  // Initialize instructions from store
  useEffect(() => {
    if (store) {
      setAiInstructions(store.ai_instructions || '');
    }
  }, [store]);

  // Save custom bot instructions
  const handleSaveInstructions = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const result = await updateStore({
        ai_instructions: aiInstructions,
      });

      if (result.error) {
        setSaveError(result.error);
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save instructions');
    } finally {
      setIsSaving(false);
    }
  };

  // AI Prompt Improver
  const handleImprovePrompt = async () => {
    if (!aiInstructions.trim()) return;
    setIsImproving(true);
    try {
      const response = await fetch('/api/whatsapp/improve-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions: aiInstructions }),
      });
      const data = await response.json();
      if (data.improvedInstructions) {
        setAiInstructions(data.improvedInstructions);
      }
    } catch (err) {
      console.error('Failed to improve prompt:', err);
    } finally {
      setIsImproving(false);
    }
  };

  // Mute / Unmute AI for specific customer JID
  const handleToggleMute = async (chat: any) => {
    if (!user?.id) return;
    setIsTogglingMute(true);
    const endpoint = chat.isMuted ? '/api/session/unmute' : '/api/session/mute';
    const body = chat.isMuted 
      ? { userId: user.id, senderJid: chat.senderJid }
      : { userId: user.id, senderJid: chat.senderJid, durationMinutes: selectedMuteDuration };

    try {
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (data.success) {
        await fetchActiveChats();
      }
    } catch (err) {
      console.error('Failed to toggle mute state:', err);
    } finally {
      setIsTogglingMute(false);
    }
  };

  // Add Manual Number Tag
  const handleAddManualNumber = () => {
    const trimmed = newNumberInput.trim().replace(/[^0-9+]/g, '');
    if (!trimmed) return;
    if (!manualNumbers.includes(trimmed)) {
      setManualNumbers(prev => [...prev, trimmed]);
    }
    setNewNumberInput('');
  };

  // Remove Manual Number Tag
  const handleRemoveManualNumber = (num: string) => {
    setManualNumbers(prev => prev.filter(n => n !== num));
  };

  // Launch anti-ban sequential campaign
  const handleLaunchCampaign = async () => {
    if (!campaignText.trim() || !user?.id) return;
    setIsLaunchingCampaign(true);
    setCampaignError(null);
    setCampaignSuccess(false);

    // Collect all unique phone numbers into WhatsApp JIDs
    const jidsSet = new Set<string>();

    // 1. Process selected past buyers
    selectedBuyers.forEach((phone) => {
      let clean = phone.replace(/[^0-9]/g, '');
      if (clean.startsWith('0')) {
        clean = '212' + clean.substring(1);
      }
      if (clean.length > 5) {
        jidsSet.add(`${clean}@s.whatsapp.net`);
      }
    });

    // 2. Process manual numbers
    manualNumbers.forEach((num) => {
      let clean = num.replace(/[^0-9]/g, '');
      if (clean.startsWith('0')) {
        clean = '212' + clean.substring(1);
      }
      if (clean.length > 5) {
        jidsSet.add(`${clean}@s.whatsapp.net`);
      }
    });

    const recipientJids = Array.from(jidsSet);

    if (recipientJids.length === 0) {
      setCampaignError('Please select or enter at least one recipient.');
      setIsLaunchingCampaign(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/campaign/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          recipientJids,
          message: { text: campaignText }
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setCampaignSuccess(true);
        setCampaignText('');
        setSelectedBuyers([]);
        setManualNumbers([]);
        setTimeout(() => setCampaignSuccess(false), 5000);
      } else {
        setCampaignError(data.message || 'Failed to launch broadcast campaign.');
      }
    } catch (err: any) {
      setCampaignError(err?.message || 'Error communicating with WhatsApp engine.');
    } finally {
      setIsLaunchingCampaign(false);
    }
  };

  const handleSelectBuyerToggle = (phone: string) => {
    setSelectedBuyers(prev => 
      prev.includes(phone) ? prev.filter(p => p !== phone) : [...prev, phone]
    );
  };

  const handleSelectAllBuyers = () => {
    if (selectedBuyers.length === pastBuyers.length) {
      setSelectedBuyers([]);
    } else {
      setSelectedBuyers(pastBuyers.map(b => b.phone));
    }
  };

  const formatJid = (jid: string) => {
    const clean = jid.split('@')[0];
    if (clean.startsWith('212')) {
      return `+212 ${clean.substring(3, 4)} ${clean.substring(4, 6)} ${clean.substring(6, 8)} ${clean.substring(8, 10)}`;
    }
    return `+${clean}`;
  };

  const getRelativeTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const isLoading = !isUserLoaded || isStoreLoading;

  // Selected chat metadata
  const selectedChat = activeChats.find(c => c.senderJid === selectedChatJid) || activeChats[0] || null;

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="border-b border-gray-150 pb-5 select-none space-y-1">
        <span className="text-[10px] font-bold tracking-widest text-[#18181B] uppercase">Messaging & Automation</span>
        <h1 className="text-3xl font-extrabold text-[#18181B]">
          WhatsApp & AI Bot Settings
        </h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#18181B]" />
        </div>
      ) : !user?.id ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-500">
          Could not retrieve authenticated user.
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* Sleek Sub-navigation Tabs */}
          <div className="flex border-b border-[rgba(232,227,216,0.45)] pb-3 select-none gap-2">
            <button
              onClick={() => setActiveSubTab('bot')}
              className={`rounded-xl px-5 py-2.5 text-xs font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'bot'
                  ? 'bg-[#18181B] text-white shadow-sm'
                  : 'bg-white border border-[rgba(232,227,216,0.8)] text-[#71717A] hover:bg-[#F5F0E8]'
              }`}
            >
              <Bot className="h-4 w-4" />
              AI Bot & Setup
            </button>
            
            <button
              onClick={() => {
                setActiveSubTab('inbox');
                fetchActiveChats();
              }}
              className={`rounded-xl px-5 py-2.5 text-xs font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer relative ${
                activeSubTab === 'inbox'
                  ? 'bg-[#18181B] text-white shadow-sm'
                  : 'bg-white border border-[rgba(232,227,216,0.8)] text-[#71717A] hover:bg-[#F5F0E8]'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              Shared Inbox & Takeover
              {activeChats.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center border-2 border-white animate-pulse">
                  {activeChats.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSubTab('campaign')}
              className={`rounded-xl px-5 py-2.5 text-xs font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'campaign'
                  ? 'bg-[#18181B] text-white shadow-sm'
                  : 'bg-white border border-[rgba(232,227,216,0.8)] text-[#71717A] hover:bg-[#F5F0E8]'
              }`}
            >
              <Megaphone className="h-4 w-4" />
              Broadcast Campaigns
            </button>
          </div>

          {/* TAB 1: AI BOT & SETUP */}
          {activeSubTab === 'bot' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Sales Analytics Overview */}
              {store?.id && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
                  {/* Card 1: Revenue */}
                  <div className="relative overflow-hidden bg-white rounded-3xl border border-[rgba(232,227,216,0.45)] p-6 shadow-sm group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-[#128C7E] group-hover:scale-110 transition-transform duration-300">
                      <Sparkles className="h-16 w-16" />
                    </div>
                    <span className="text-[9px] font-bold tracking-widest text-[#71717A] uppercase">AI Revenue</span>
                    <div className="text-2xl font-extrabold text-[#18181B] mt-1">
                      {loadingAnalytics ? '...' : `${analytics.totalRevenue.toLocaleString()} MAD`}
                    </div>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                      ✓ WhatsApp Direct Sales
                    </p>
                  </div>

                  {/* Card 2: Total Orders */}
                  <div className="bg-white rounded-3xl border border-[rgba(232,227,216,0.45)] p-6 shadow-sm hover:shadow-md transition-shadow">
                    <span className="text-[9px] font-bold tracking-widest text-[#71717A] uppercase">AI Orders</span>
                    <div className="text-2xl font-extrabold text-[#18181B] mt-1">
                      {loadingAnalytics ? '...' : analytics.totalOrders}
                    </div>
                    <p className="text-[10px] text-[#71717A] mt-1">
                      Automated bookings logged
                    </p>
                  </div>

                  {/* Card 3: Pending */}
                  <div className="bg-white rounded-3xl border border-[rgba(232,227,216,0.45)] p-6 shadow-sm hover:shadow-md transition-shadow">
                    <span className="text-[9px] font-bold tracking-widest text-[#71717A] uppercase">Pending Review</span>
                    <div className="text-2xl font-extrabold text-[#18181B] mt-1">
                      {loadingAnalytics ? '...' : analytics.pendingOrders}
                    </div>
                    <p className="text-[10px] text-amber-600 font-semibold mt-1">
                      ⏳ Needs seller confirmation
                    </p>
                  </div>

                  {/* Card 4: Conversion Rate */}
                  <div className="bg-white rounded-3xl border border-[rgba(232,227,216,0.45)] p-6 shadow-sm hover:shadow-md transition-shadow">
                    <span className="text-[9px] font-bold tracking-widest text-[#71717A] uppercase">AI Success Rate</span>
                    <div className="text-2xl font-extrabold text-[#18181B] mt-1">
                      {loadingAnalytics ? '...' : analytics.totalOrders > 0 ? `${Math.round((analytics.completedOrders / analytics.totalOrders) * 100)}%` : '0%'}
                    </div>
                    <p className="text-[10px] text-indigo-600 font-semibold mt-1">
                      🎯 Confirmed order rate
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT: WhatsApp Integration Connection (Baileys Widget) */}
                <div className="lg:col-span-5 flex flex-col justify-center">
                  <WhatsAppIntegration userId={user.id} />
                </div>

                {/* RIGHT: Bot Instructions & Training Form */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white rounded-3xl border border-[rgba(232,227,216,0.45)] p-6 sm:p-8 shadow-sm space-y-6">
                    <h2 className="text-lg font-bold text-[#18181B] flex items-center gap-2 select-none">
                      <Bot className="h-5 w-5 text-[#128C7E]" />
                      AI Sales Assistant Instructions
                    </h2>

                    <p className="text-xs text-[#71717A] leading-relaxed">
                      Train your AI Bot to speak to WhatsApp customers exactly like a human agent!
                      The bot automatically reads your <strong>store details</strong> and <strong>live product catalog</strong> (prices, stock, description) from your database.
                    </p>

                    {saveSuccess && (
                      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-[#10B981] animate-in fade-in slide-in-from-top-2 duration-300">
                        ✓ AI Assistant instructions updated successfully!
                      </div>
                    )}

                    {saveError && (
                      <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs font-bold text-red-700">
                        {saveError.includes('relation "stores" does not exist') || saveError.includes('column stores.ai_instructions does not exist') || saveError.includes('ai_instructions') ? (
                          <div className="space-y-2">
                            <p>⚠️ Column `ai_instructions` is missing in database!</p>
                            <p className="font-light text-[10px]">Please run this SQL query in your Supabase SQL Editor to enable this feature:</p>
                            <pre className="bg-gray-100 p-3 rounded text-[10px] select-all font-mono border border-red-200 overflow-x-auto whitespace-pre">
                              ALTER TABLE stores ADD COLUMN IF NOT EXISTS ai_instructions TEXT DEFAULT '';
                            </pre>
                          </div>
                        ) : (
                          `Failed to save: ${saveError}`
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between items-center select-none mb-1.5">
                        <label className="block text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest">
                          Custom Bot Personality & Rules (in Arabic, Darija, or French)
                        </label>
                        <button
                          type="button"
                          onClick={handleImprovePrompt}
                          disabled={isImproving || !aiInstructions.trim()}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-[#128C7E] hover:text-[#128C7E]/80 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        >
                          {isImproving ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Improving...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3 text-amber-500 animate-pulse animate-duration-1000" />
                              Improve with AI ✨
                            </>
                          )}
                        </button>
                      </div>
                      <textarea
                        rows={8}
                        placeholder="مثال:
- دوي بالدارجة المغربية بأسلوب ودود ومحترم جداً.
- ركز على جودة قفاطيننا لي مخدومة باليد بالصويرة.
- اعطي الزبون ديما عروض تخفيضية إذا طلب كثر من بياسة.
- ماتقولش ليهم أنت بوت، أنت سميتك فاطمة مساعدة مبيعات."
                        value={aiInstructions}
                        onChange={(e) => setAiInstructions(e.target.value)}
                        className="w-full rounded-xl border border-gray-250 bg-white px-4 py-3 text-xs text-[#18181B] font-medium focus:border-[#18181B] focus:outline-none focus:ring-1 focus:ring-[#18181B] leading-relaxed placeholder:text-gray-300"
                      />
                    </div>

                    {/* Action Button */}
                    <div className="border-t border-[rgba(232,227,216,0.45)] pt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveInstructions}
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#18181B] hover:bg-[#18181B]/95 px-6 py-3 text-xs font-bold text-white shadow-md active:scale-95 spring-transition cursor-pointer"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving Bot Rules...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save Instructions
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Help guidelines & tips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#F5F0E8]/50 border border-[rgba(232,227,216,0.8)] rounded-3xl p-6 space-y-3 leading-relaxed">
                      <h4 className="font-bold text-xs text-[#18181B] flex items-center gap-1">
                        <Sparkles className="h-4 w-4 text-[#128C7E]" /> Live Store Context
                      </h4>
                      <p className="text-[10px] text-[#71717A] font-light leading-relaxed">
                        Your AI sales bot reads live products and stock directly. If you change a price or add a new rug in your shop, the bot knows it instantly!
                      </p>
                    </div>

                    <div className="bg-[#F5F0E8]/50 border border-[rgba(232,227,216,0.8)] rounded-3xl p-6 space-y-3 leading-relaxed">
                      <h4 className="font-bold text-xs text-[#18181B] flex items-center gap-1">
                        <HelpCircle className="h-4 w-4 text-[#71717A]" /> Pro-Tips
                      </h4>
                      <p className="text-[10px] text-[#71717A] font-light leading-relaxed">
                        Write the rules in the exact dialect or language you want the bot to emphasize. Tell the bot how to greet people, and what contact information or shipping terms to offer!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SHARED INBOX & TAKEPLAY */}
          {activeSubTab === 'inbox' && (
            <div className="animate-in fade-in duration-300">
              {activeChats.length === 0 ? (
                <div className="text-center py-20 bg-white border border-[rgba(232,227,216,0.45)] rounded-3xl max-w-md mx-auto shadow-sm select-none">
                  <MessageSquare className="w-12 h-12 text-[#71717A]/40 mx-auto mb-4" />
                  <h3 className="font-bold text-lg text-[#18181B]">Shared Inbox is Quiet</h3>
                  <p className="text-xs text-[#71717A] mt-2 font-light leading-relaxed px-4">
                    No active AI chat conversations found in this session. The AI sales bot handles incoming WhatsApp messages automatically. When customers ask about items, their conversations will populate here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* LEFT COLUMN: Active Chats List */}
                  <div className="lg:col-span-5 bg-white rounded-3xl border border-[rgba(232,227,216,0.45)] p-4 shadow-sm space-y-3">
                    <span className="block text-[9px] font-extrabold text-[#71717A] uppercase tracking-widest select-none px-2 pt-2">
                      Active Customer Dialogues ({activeChats.length})
                    </span>

                    <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto pr-1">
                      {activeChats.map((chat) => {
                        const isSelected = selectedChatJid === chat.senderJid || (!selectedChatJid && activeChats[0]?.senderJid === chat.senderJid);
                        return (
                          <button
                            key={chat.senderJid}
                            onClick={() => setSelectedChatJid(chat.senderJid)}
                            className={`w-full text-left p-3.5 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 mt-1 first:mt-0 ${
                              isSelected 
                                ? 'bg-[#F5F0E8]/70 border border-[rgba(232,227,216,0.7)]' 
                                : 'hover:bg-gray-50/70 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 font-bold shrink-0 relative select-none">
                                <User className="h-5 w-5 text-neutral-400" />
                                {chat.isMuted && (
                                  <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-amber-500 border border-white flex items-center justify-center text-[8px] text-white">
                                    🔇
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-extrabold text-xs text-[#18181B] truncate">
                                  {formatJid(chat.senderJid)}
                                </h4>
                                <p className="text-[10px] text-[#71717A] truncate font-light mt-0.5">
                                  {chat.lastMessage || 'Connected to AI Bot'}
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0 flex flex-col items-end gap-1.5 select-none">
                              <span className="text-[8px] font-bold text-[#71717A]">
                                {getRelativeTime(chat.lastActivity)}
                              </span>
                              {chat.isMuted ? (
                                <span className="rounded bg-amber-50 border border-amber-200 text-[8px] font-extrabold px-1.5 py-0.5 text-amber-600 uppercase tracking-wide">
                                  Muted
                                </span>
                              ) : (
                                <span className="rounded bg-emerald-50 border border-emerald-100 text-[8px] font-extrabold px-1.5 py-0.5 text-emerald-600 uppercase tracking-wide">
                                  AI Live
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Takeover Control Panel */}
                  <div className="lg:col-span-7 space-y-6">
                    {selectedChat && (
                      <div className="bg-white rounded-3xl border border-[rgba(232,227,216,0.45)] p-6 sm:p-8 shadow-sm space-y-6">
                        
                        <div className="border-b border-[rgba(232,227,216,0.45)] pb-5 select-none">
                          <span className="text-[9px] font-bold tracking-widest text-[#71717A] uppercase">Active Session Details</span>
                          <h3 className="text-lg font-extrabold text-[#18181B] mt-1">
                            {formatJid(selectedChat.senderJid)}
                          </h3>
                        </div>

                        {/* Status Widget */}
                        <div className={`rounded-2xl p-5 border flex items-start gap-4 select-none ${
                          selectedChat.isMuted 
                            ? 'bg-amber-50/50 border-amber-200 text-amber-800' 
                            : 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
                        }`}>
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                            selectedChat.isMuted ? 'bg-amber-100' : 'bg-emerald-100'
                          }`}>
                            {selectedChat.isMuted ? (
                              <VolumeX className="h-5 w-5 text-amber-600" />
                            ) : (
                              <Bot className="h-5 w-5 text-emerald-600 animate-bounce" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm">
                              {selectedChat.isMuted ? 'AI Bot Response Muted 🔇' : 'AI Sales Assistant Active 🤖'}
                            </h4>
                            <p className="text-[11px] text-[#71717A] font-light mt-1 leading-relaxed">
                              {selectedChat.isMuted 
                                ? 'The AI Sales Bot has been silenced for this client. You can chat manually from your phone without bot interference.'
                                : 'The AI Bot is reading your Medina catalogs and answering live client inquiries in Darija/Arabic.'
                              }
                            </p>
                          </div>
                        </div>

                        {/* Message Preview */}
                        <div className="space-y-2">
                          <span className="block text-[9px] font-extrabold text-[#71717A] uppercase tracking-widest select-none">
                            Last Conversation turn
                          </span>
                          <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-4 font-medium text-xs leading-relaxed text-[#18181B]">
                            {selectedChat.lastMessage ? (
                              <p className="italic">"{selectedChat.lastMessage}"</p>
                            ) : (
                              <p className="text-[#71717A] font-light">Dialogue established. Waiting for prompt turn.</p>
                            )}
                          </div>
                        </div>

                        {/* Mute controls */}
                        <div className="space-y-4 pt-2">
                          <span className="block text-[9px] font-extrabold text-[#71717A] uppercase tracking-widest select-none">
                            Mute Bot duration (Human Takeover)
                          </span>

                          <div className="grid grid-cols-4 gap-3 select-none">
                            {[
                              { label: '15 Min', val: 15 },
                              { label: '1 Hour', val: 60 },
                              { label: '6 Hours', val: 360 },
                              { label: '24 Hours', val: 1440 },
                            ].map((dur) => (
                              <button
                                key={dur.val}
                                onClick={() => setSelectedMuteDuration(dur.val)}
                                disabled={selectedChat.isMuted}
                                className={`rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
                                  selectedMuteDuration === dur.val && !selectedChat.isMuted
                                    ? 'bg-[#18181B] text-white shadow-sm border border-[#18181B]'
                                    : 'bg-white border border-gray-250 text-[#71717A] hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed'
                                }`}
                              >
                                {dur.label}
                              </button>
                            ))}
                          </div>

                          <div className="pt-4 border-t border-[rgba(232,227,216,0.45)] flex justify-end">
                            <button
                              onClick={() => handleToggleMute(selectedChat)}
                              disabled={isTogglingMute}
                              className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95 ${
                                selectedChat.isMuted 
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                  : 'bg-amber-600 hover:bg-amber-700 text-white'
                              }`}
                            >
                              {isTogglingMute ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Updating...
                                </>
                              ) : selectedChat.isMuted ? (
                                <>
                                  <Volume2 className="h-4 w-4" />
                                  Resume AI Bot 🤖
                                </>
                              ) : (
                                <>
                                  <VolumeX className="h-4 w-4" />
                                  Mute AI & Take Over 🔇
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB 3: BROADCAST CAMPAIGNS */}
          {activeSubTab === 'campaign' && (
            <div className="animate-in fade-in duration-300 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT: Broadcast details & picker */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-3xl border border-[rgba(232,227,216,0.45)] p-6 sm:p-8 shadow-sm space-y-6">
                  <h2 className="text-lg font-bold text-[#18181B] flex items-center gap-2 select-none">
                    <Megaphone className="h-5 w-5 text-[#128C7E]" />
                    Compose Marketing Broadcast
                  </h2>

                  {campaignSuccess && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-[#10B981] animate-in fade-in duration-300">
                      ✓ Marketing Campaign dispatched! Enqueued messages sequentially with anti-ban delay.
                    </div>
                  )}

                  {campaignError && (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs font-bold text-red-700">
                      ⚠️ {campaignError}
                    </div>
                  )}

                  {/* Message templates inputs */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest select-none">
                      Campaign Broadcast Pitch Message
                    </label>
                    <textarea
                      rows={6}
                      placeholder="مثال:
مرحباً يا زبوننا العزيز! بمناسبة الصيف، وجدنا لك تشكيلة رائعة ومميزة من الجلابيب الصويرية التقليدية الفاخرة بخصم 15% حصرياً لك. 
جاوب على هاد الميساج دابا باش تستافد وتشوف الصور! 😊✨"
                      value={campaignText}
                      onChange={(e) => setCampaignText(e.target.value)}
                      className="w-full rounded-xl border border-gray-250 bg-white px-4 py-3 text-xs text-[#18181B] font-medium focus:border-[#18181B] focus:outline-none focus:ring-1 focus:ring-[#18181B] leading-relaxed placeholder:text-gray-300"
                    />
                  </div>

                  {/* Interactive Contacts Pickers */}
                  <div className="space-y-4 border-t border-[rgba(232,227,216,0.45)] pt-6">
                    <span className="block text-[9px] font-extrabold text-[#71717A] uppercase tracking-widest select-none">
                      Manual Recipients List
                    </span>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add manual number (e.g. 0612345678)"
                        value={newNumberInput}
                        onChange={(e) => setNewNumberInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddManualNumber();
                          }
                        }}
                        className="flex-1 rounded-xl border border-gray-250 bg-white px-3.5 py-2.5 text-xs text-[#18181B] font-semibold focus:outline-none focus:border-[#18181B]"
                      />
                      <button
                        type="button"
                        onClick={handleAddManualNumber}
                        className="rounded-xl bg-[#18181B] text-white p-2.5 hover:bg-[#18181B]/95 cursor-pointer shadow-sm active:scale-95 transition-all"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Manual tags listing */}
                    {manualNumbers.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1 select-none">
                        {manualNumbers.map((num) => (
                          <span
                            key={num}
                            className="inline-flex items-center gap-1 bg-[#F5F0E8] border border-[rgba(232,227,216,0.7)] text-xs font-bold text-[#18181B] px-3 py-1 rounded-full"
                          >
                            {num}
                            <button
                              type="button"
                              onClick={() => handleRemoveManualNumber(num)}
                              className="text-neutral-500 hover:text-red-500 cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Past Buyers Multiselect Table */}
                  <div className="space-y-3 border-t border-[rgba(232,227,216,0.45)] pt-6">
                    <div className="flex justify-between items-center select-none mb-1">
                      <span className="block text-[9px] font-extrabold text-[#71717A] uppercase tracking-widest">
                        Past Medina Buyers ({pastBuyers.length})
                      </span>
                      {pastBuyers.length > 0 && (
                        <button
                          type="button"
                          onClick={handleSelectAllBuyers}
                          className="text-[10px] font-bold text-[#128C7E] hover:text-[#128C7E]/80 transition-colors cursor-pointer"
                        >
                          {selectedBuyers.length === pastBuyers.length ? 'Deselect All' : 'Select All'}
                        </button>
                      )}
                    </div>

                    {loadingBuyers ? (
                      <div className="text-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-neutral-400 mx-auto" />
                      </div>
                    ) : pastBuyers.length === 0 ? (
                      <div className="rounded-2xl bg-neutral-50 border border-dashed border-neutral-200 p-6 text-center select-none text-[10px] font-semibold text-[#71717A]">
                        No past order clients found to target. Use manual number picker above.
                      </div>
                    ) : (
                      <div className="max-h-[220px] overflow-y-auto border border-gray-150 rounded-2xl divide-y divide-gray-100 pr-1">
                        {pastBuyers.map((buyer) => {
                          const isChecked = selectedBuyers.includes(buyer.phone);
                          return (
                            <label
                              key={buyer.phone}
                              className="flex items-center gap-3 p-3 text-xs hover:bg-[#F5F0E8]/20 cursor-pointer select-none"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleSelectBuyerToggle(buyer.phone)}
                                className="rounded text-[#128C7E] focus:ring-[#128C7E] h-4 w-4"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-extrabold text-gray-900 truncate">{buyer.name}</h4>
                                <span className="text-[10px] text-[#71717A] font-semibold">{buyer.phone}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Campaign summary trigger */}
                  <div className="border-t border-[rgba(232,227,216,0.45)] pt-6 flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-[#71717A] uppercase select-none">
                      Total targeted: <span className="text-[#18181B] font-black">{selectedBuyers.length + manualNumbers.length} clients</span>
                    </span>
                    
                    <button
                      type="button"
                      onClick={handleLaunchCampaign}
                      disabled={isLaunchingCampaign || !campaignText.trim() || (selectedBuyers.length + manualNumbers.length === 0)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#18181B] hover:bg-[#18181B]/95 px-6 py-3 text-xs font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLaunchingCampaign ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Launching Pitch...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Launch Campaign 🚀
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT: Safe compliance reminders */}
              <div className="lg:col-span-5 space-y-6 select-none">
                <div className="bg-[#F5F0E8]/50 border border-[rgba(232,227,216,0.8)] rounded-3xl p-6 sm:p-8 space-y-5 leading-relaxed">
                  <h3 className="font-extrabold text-sm text-[#18181B] flex items-center gap-1.5 border-b border-[rgba(232,227,216,0.45)] pb-3">
                    <ShieldAlert className="h-5 w-5 text-amber-600 animate-pulse" />
                    Anti-Ban Safety Compliance
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-1 text-xs">
                      <h4 className="font-extrabold text-gray-900 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Random Anti-Ban Delays
                      </h4>
                      <p className="text-[10px] text-[#71717A] leading-relaxed font-light pl-5">
                        To align with WhatsApp API spam regulations, our backend sequential queue manager schedules each message message with a randomized <strong>2 to 5-second anti-ban delay</strong>.
                      </p>
                    </div>

                    <div className="space-y-1 text-xs">
                      <h4 className="font-extrabold text-gray-900 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Target Engaged Leads
                      </h4>
                      <p className="text-[10px] text-[#71717A] leading-relaxed font-light pl-5">
                        Only dispatch campaigns to customers who ordered or conversed with your Medina store previously. Cold messaging unknown numbers increases report risk.
                      </p>
                    </div>

                    <div className="space-y-1 text-xs">
                      <h4 className="font-extrabold text-gray-900 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Call-to-Action Emphasis
                      </h4>
                      <p className="text-[10px] text-[#71717A] leading-relaxed font-light pl-5">
                        Keep templates highly inviting and end with questions, encouraging the customers to respond. When users reply back, it builds positive WhatsApp credibility parameters!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
}
