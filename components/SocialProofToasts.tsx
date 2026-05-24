'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag, Sparkles, Store, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ToastEvent {
  id: number;
  type: 'purchase' | 'registration' | 'badge';
  title: string;
  body: string;
  timeText: string;
  linkUrl: string;
  linkText: string;
}

const FIRST_NAMES = [
  'أحمد', 'Fatima', 'Youssef', 'سناء', 'Karim', 'أمينة', 
  'ياسين', 'Meryem', 'Mehdi', 'خديجة', 'Anass', 'Salma'
];

const CITIES = [
  'Essaouira', 'Casablanca', 'Marrakech', 'Rabat', 
  'Agadir', 'Tangier', 'Sidi Kaouki', 'Fes'
];

const PURCHASES = [
  { name: 'Thuya Wood Jewelry Box', category: 'Artisanal Wood', price: 340, url: '/category/Artisanal%20Wood' },
  { name: '100% Organic Argan Cosmetic Elixir', category: 'Cosmetics & Oils', price: 180, url: '/category/Cosmetics%20&%20Oils' },
  { name: 'Hand-tanned Leather Messenger Bag', category: 'Leather Goods', price: 850, url: '/category/Leather%20Goods' },
  { name: 'Bespoke Woven Berber Rug', category: 'Moroccan Rugs', price: 2100, url: '/category/Moroccan%20Rugs' },
  { name: 'Custom Sidi Kaouki Fish Surfboard', category: 'Surf Gear', price: 3200, url: '/category/Surf%20Gear' },
  { name: 'Hand-sculpted Thuya Chess Board Set', category: 'Artisanal Wood', price: 750, url: '/category/Artisanal%20Wood' }
];

const STORES = [
  { name: 'Mogador Wools', category: 'Moroccan Rugs', url: '/search' },
  { name: 'Sidi Kaouki Boardriders', category: 'Surf Gear', url: '/search' },
  { name: 'Atlas Botanicals', category: 'Cosmetics & Oils', url: '/search' },
  { name: 'Medina Tannery Collective', category: 'Leather Goods', url: '/search' }
];

export default function SocialProofToasts() {
  const [activeToast, setActiveToast] = useState<ToastEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Generate a random event
    const generateEvent = (): ToastEvent => {
      const isPurchase = Math.random() > 0.35;
      const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      const id = Date.now();

      if (isPurchase) {
        const item = PURCHASES[Math.floor(Math.random() * PURCHASES.length)];
        const minutesAgo = Math.floor(Math.random() * 8) + 1;
        return {
          id,
          type: 'purchase',
          title: 'Recent Purchase',
          body: `${firstName} from ${city} bought a "${item.name}" for ${item.price} DH!`,
          timeText: `${minutesAgo}m ago`,
          linkUrl: item.url,
          linkText: `Shop ${item.category}`
        };
      } else {
        const store = STORES[Math.floor(Math.random() * STORES.length)];
        return {
          id,
          type: 'registration',
          title: 'New Store Registered',
          body: `Independent artisan "${store.name}" opened a boutique selling "${store.category}"!`,
          timeText: 'Just Now',
          linkUrl: store.url,
          linkText: 'Explore Boutique'
        };
      }
    };

    const triggerCycle = () => {
      // 1. Generate event
      const newEvent = generateEvent();
      setActiveToast(newEvent);
      
      // 2. Animate entry
      setTimeout(() => setVisible(true), 200);

      // 3. Keep open for 6 seconds, then animate exit
      setTimeout(() => {
        setVisible(false);
      }, 6200);
    };

    // First toast fires after 12 seconds
    const initialDelayTimer = setTimeout(triggerCycle, 12000);

    // Regular interval repeats every 24 seconds
    const intervalTimer = setInterval(triggerCycle, 24000);

    return () => {
      clearTimeout(initialDelayTimer);
      clearInterval(intervalTimer);
    };
  }, []);

  if (!activeToast) return null;

  return (
    <div
      className={`fixed bottom-6 left-6 z-50 max-w-sm rounded-2xl border border-gray-150 bg-white/95 backdrop-blur-md p-4 shadow-2xl transition-all duration-500 ease-out select-none ${
        visible 
          ? 'translate-y-0 opacity-100 scale-100' 
          : 'translate-y-8 opacity-0 scale-95 pointer-events-none'
      }`}
    >
      <div className="flex gap-3 items-start">
        
        {/* Animated Badge Icon Box */}
        <div className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center text-white relative shadow-md ${
          activeToast.type === 'purchase' 
            ? 'bg-[#10B981]' 
            : 'bg-[#6366F1]'
        }`}>
          {activeToast.type === 'purchase' ? (
            <ShoppingBag className="h-4.5 w-4.5" />
          ) : (
            <Store className="h-4.5 w-4.5" />
          )}
          
          {/* Active green radar pulse */}
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </div>

        {/* Content text */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] font-extrabold text-[#6366F1] uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {activeToast.title}
            </span>
            <span className="text-[8px] font-bold text-gray-400">
              {activeToast.timeText}
            </span>
          </div>

          <p className="text-[11px] text-gray-600 font-semibold leading-relaxed">
            {activeToast.body}
          </p>

          <div className="pt-1.5 flex items-center justify-between border-t border-gray-100 mt-2">
            <Link
              href={activeToast.linkUrl}
              className="text-[9px] font-extrabold text-[#6366F1] hover:text-[#111827] uppercase tracking-wider inline-flex items-center gap-1 group/btn"
            >
              {activeToast.linkText}
              <ArrowRight className="h-2.5 w-2.5 group-hover/btn:translate-x-0.5 transition-transform" />
            </Link>
            
            <div className="flex items-center gap-0.5 text-[8px] text-gray-400 font-bold uppercase">
              <CheckCircle className="h-3 w-3 text-[#10B981]" /> Verified
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
