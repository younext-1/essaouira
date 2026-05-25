'use client';

import { useState, useEffect } from 'react';
import { Sparkles, X, ShoppingCart, Loader2, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { useCart } from '@/hooks/useCart';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface FlashDealModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FlashDealModal({ isOpen, onClose }: FlashDealModalProps) {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ minutes: 8, seconds: 45 });

  // 1. Fetch a featured product dynamically when opened
  useEffect(() => {
    if (!isOpen) return;

    const fetchDealProduct = async () => {
      try {
        setLoadingProduct(true);
        // Fetch a premium wood carvings or argan oil product
        const { data, error } = await supabase
          .from('products')
          .select('*, stores(name)')
          .limit(5);

        if (error) throw error;
        
        if (data && data.length > 0) {
          // Select a random product from the list to make it dynamic
          const randomIndex = Math.floor(Math.random() * data.length);
          setProduct(data[randomIndex]);
        }
      } catch (err) {
        console.error('Failed to fetch flash deal product:', err);
      } finally {
        setLoadingProduct(false);
      }
    };

    fetchDealProduct();
    // Reset countdown
    setTimeLeft({ minutes: 8, seconds: 45 });
  }, [isOpen]);

  // 2. Countdown loop
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        } else {
          clearInterval(interval);
          return { minutes: 0, seconds: 0 };
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate the 50% discount price
  const originalPrice = product ? Number(product.price) : 0;
  const dealPrice = Math.round(originalPrice * 0.5); // 50% discount!

  const handleBuyNow = async () => {
    if (!isSignedIn) {
      onClose();
      router.push('/sign-in');
      return;
    }

    if (!product) return;

    try {
      setAddingToCart(true);
      // Add the item to cart dynamically
      await addToCart({ productId: product.id, quantity: 1, variant: null });
      setAddedSuccess(true);
      
      // Auto close modal after successful add to cart
      setTimeout(() => {
        setAddedSuccess(false);
        onClose();
        router.push('/cart'); // redirect directly to checkout/cart!
      }, 1500);

    } catch (err) {
      console.error('Failed to buy flash deal:', err);
    } finally {
      setAddingToCart(false);
    }
  };

  const coverImage = product?.images && product.images.length > 0 
    ? product.images[0] 
    : '/placeholder.jpg';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans select-none animate-in fade-in duration-300">
      
      {/* Outer Close Trigger */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Card Content Wrapper */}
      <div 
        className="relative w-full max-w-sm bg-[#FAFAF7] border border-[rgba(232,227,216,0.45)] rounded-[32px] overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom-8 duration-300 z-10"
        style={{ direction: 'rtl' }}
      >
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#E61E42] to-amber-500 text-white px-5 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="h-4.5 w-4.5 text-[#FFD43F] animate-bounce" />
            </div>
            <div>
              <h3 className="font-sans font-black text-sm">صفقة Choice الخاطفة! ⚡</h3>
              <span className="text-[9.5px] text-red-100 block font-light">خصم فوري 50% بمناسبة الافتتاح</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-red-100 hover:text-white transition-all cursor-pointer active-push"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-center">
          
          {loadingProduct && (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 text-[#E61E42] animate-spin" />
              <p className="text-xs font-black text-gray-500">نبحث لك عن أفضل عرض بقاعدة البيانات...</p>
            </div>
          )}

          {!loadingProduct && product && (
            <>
              {/* Deal Product Card Preview Frame */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#EBEAE4] bg-white shadow-sm shrink-0">
                <img src={coverImage} alt={product.name} className="w-full h-full object-cover" />
                
                {/* 50% Off Seal */}
                <div className="absolute top-3 right-3 bg-[#E61E42] text-white font-black text-xs px-3 py-1 rounded-full shadow-md animate-pulse">
                  خصم 50%-
                </div>

                {/* Micro Live Countdown overlay */}
                <div className="absolute bottom-3 left-3 bg-[#1C1917]/80 backdrop-blur-xs text-white font-mono text-[9px] font-black px-2.5 py-1 rounded-full shadow-sm">
                  تنتهي الصفقة خلال: {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-1 text-right">
                <span className="inline-block bg-[#FFF5C2] text-[#78350F] text-[8px] font-black px-1.5 py-0.5 rounded border border-[#FDE68A] uppercase">
                  عرض حصرى
                </span>
                <h4 className="text-xs font-black text-gray-800 line-clamp-1 leading-tight">{product.name}</h4>
                <p className="text-[10px] text-gray-400 font-light">بواسطة: {product.stores?.name || 'ورشة الصويرة'}</p>
              </div>

              {/* Price Details */}
              <div className="flex items-center justify-center gap-4 bg-[#F5F0E8] border border-[rgba(232,227,216,0.45)] rounded-2xl py-3 px-4 shadow-inner">
                <div className="flex flex-col text-right">
                  <span className="text-[9px] text-gray-400 font-bold line-through">السعر الأصلي: {originalPrice} DH</span>
                  <span className="text-lg font-black text-[#E61E42] font-display">سعر العرض: {dealPrice} DH</span>
                </div>
                <div className="w-[1px] h-8 bg-gray-200" />
                <div className="text-[9px] text-emerald-600 font-black flex flex-col justify-center text-center">
                  <span>توفير فوري</span>
                  <span>{originalPrice - dealPrice} DH!</span>
                </div>
              </div>

              {/* CTA Action button */}
              <button 
                onClick={handleBuyNow}
                disabled={addingToCart}
                className="w-full h-11.5 rounded-full bg-[#E61E42] hover:bg-[#D91B3D] text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-colors active-push cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {addingToCart ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : addedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>تم الحفظ والانتقال للدفع!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 shrink-0" />
                    <span>أضف للسلة واشترِ الآن بـ 50%- 🚀</span>
                  </>
                )}
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
