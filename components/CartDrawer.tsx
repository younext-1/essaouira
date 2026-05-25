'use client';

import { X, Plus, Minus, Trash2, ShoppingBag, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { 
    cart, 
    loading, 
    updateQuantity, 
    removeFromCart, 
    cartSubtotal, 
    shippingCost, 
    cartTotal,
    addToCart
  } = useCart();

  const [addingCrossSellId, setAddingCrossSellId] = useState<string | null>(null);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Mock cross-selling small artisan items (highly authentic and cheap, encouraging 1-click impulse additions)
  const crossSellItems = [
    {
      id: 'prod-argan-lip', // or dynamic item fallback
      name: 'Organic Argan Lip Balm',
      nameAr: 'مرطب شفاه بالأركان الطبيعي',
      price: 25,
      imageUrl: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=200',
    },
    {
      id: 'prod-thuya-coaster',
      name: 'Mini Thuya Wood Coaster',
      nameAr: 'قاعدة كؤوس صغيرة من العرعر',
      price: 35,
      imageUrl: 'https://images.unsplash.com/photo-1532372320978-9b4d7a92b24d?w=200',
    }
  ];

  const handleAddCrossSell = async (itemId: string) => {
    try {
      setAddingCrossSellId(itemId);
      await addToCart({ productId: itemId, quantity: 1, variant: null });
    } catch (err) {
      console.error('Cross-sell add failed:', err);
    } finally {
      setAddingCrossSellId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden font-sans select-none" style={{ fontFamily: 'var(--font-sans), sans-serif' }}>
      
      {/* Dark backdrop overlay with fade in */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 animate-in fade-in"
      />

      {/* Drawer Container sliding from right */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAFAF7] border-l border-warm-border shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300 ease-out">
          
          {/* 1. Header Area */}
          <div className="p-5 border-b border-warm-border/60 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-[#CA8A04]" />
              <h2 className="text-sm font-extrabold text-[#1C1917] uppercase tracking-wider">
                Your Shopping Cart / سلة المشتريات
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-black transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 2. Cart Content / Items list */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {loading && cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-black border-t-transparent" />
                <span className="text-[10px] uppercase font-bold text-gray-400 mt-3 tracking-widest animate-pulse">
                  Syncing basket...
                </span>
              </div>
            ) : cart.length === 0 ? (
              <div className="h-[60%] flex flex-col items-center justify-center text-center py-10 space-y-4">
                <div className="h-16 w-16 rounded-full bg-[#FAFAF7] border border-warm-border flex items-center justify-center text-gray-400">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-[#1C1917]">Your Cart is Empty</h3>
                  <p className="text-[10px] text-gray-400 font-medium mt-1">Add items from the catalog to see them here.</p>
                </div>
                <button 
                  onClick={onClose}
                  className="rounded-xl bg-[#1C1917] px-5 py-2 text-[10px] font-black text-white hover:bg-[#CA8A04] uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* List of items */}
                {cart.map((item) => {
                  const p = item.products;
                  if (!p) return null;
                  const price = Number(p.price) || 0;

                  return (
                    <div 
                      key={item.id} 
                      className="flex gap-4 bg-white border border-warm-border/50 rounded-2xl p-3 shadow-sm hover:shadow transition-shadow relative"
                    >
                      {/* Product Thumbnail image */}
                      <div className="h-16 w-16 rounded-xl bg-[#FAFAF7] border border-warm-border overflow-hidden shrink-0">
                        <img 
                          src={p.images?.[0] || '/placeholder.jpg'} 
                          alt={p.name} 
                          className="h-full w-full object-cover"
                        />
                      </div>

                      {/* Product Metadata Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="font-bold text-xs text-[#1C1917] truncate leading-tight">
                              {p.name}
                            </h4>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="text-gray-400 hover:text-red-500 shrink-0 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          
                          {/* Store and Variant tags */}
                          <span className="text-[9px] text-gray-400 font-semibold block mt-0.5">
                            by {p.stores?.name || 'Local Workshop'}
                          </span>
                          
                          {item.variant && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(item.variant as Record<string, string>).map(([k, v]) => (
                                <span key={k} className="text-[8px] font-bold text-gray-500 bg-gray-100 rounded px-1.5 py-0.5">
                                  {k}: {v}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Price & Quantity Adjuster */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                          <span className="font-extrabold text-xs text-red-500 font-display">
                            MAD {price * item.quantity}
                          </span>
                          
                          {/* Mini Stepper controls */}
                          <div className="flex items-center border border-gray-200 rounded-lg bg-gray-550/10 p-0.5 scale-90">
                            <button
                              onClick={() => updateQuantity({ itemId: item.id, quantity: item.quantity - 1 })}
                              className="h-6 w-6 flex items-center justify-center text-gray-500 hover:text-black transition-colors cursor-pointer"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-[10px] font-black text-gray-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity({ itemId: item.id, quantity: item.quantity + 1 })}
                              className="h-6 w-6 flex items-center justify-center text-gray-500 hover:text-black transition-colors cursor-pointer"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}

              </div>
            )}

            {/* 3. Dynamic Cross-Selling Section */}
            {cart.length > 0 && (
              <div className="border-t border-warm-border/50 pt-5 space-y-3">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#CA8A04] animate-pulse" />
                  Frequently Bought Together
                </span>
                
                <div className="grid grid-cols-1 gap-2.5">
                  {crossSellItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-2.5 bg-[#FAFAF7] border border-warm-border/40 rounded-xl"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="h-10 w-10 rounded-lg object-cover border border-warm-border/40 shrink-0" 
                        />
                        <div className="min-w-0">
                          <h5 className="font-bold text-[10px] text-[#1C1917] truncate leading-tight">{item.name}</h5>
                          <span className="text-[9px] text-red-500 font-extrabold">MAD {item.price}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleAddCrossSell(item.id)}
                        disabled={addingCrossSellId === item.id}
                        className="rounded-lg bg-[#1C1917] hover:bg-[#CA8A04] text-white text-[8px] font-black uppercase tracking-wider py-1.5 px-3 transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                      >
                        {addingCrossSellId === item.id ? 'Adding...' : '+ Add'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* 4. Checkout Summary & Escrow Guarantee Footer (only if items present) */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-warm-border bg-white space-y-4">
              
              {/* Recalculation matrices */}
              <div className="space-y-2 text-xs text-gray-500 select-none">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#1C1917]">{cartSubtotal} DH</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Medina Shipping</span>
                  <span className={`font-bold ${shippingCost === 0 ? 'text-[#10B981]' : 'text-[#1C1917]'}`}>
                    {shippingCost === 0 ? 'FREE' : `${shippingCost} DH`}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-100 pt-2 text-sm text-[#1C1917] font-extrabold">
                  <span className="uppercase text-[10px] tracking-wider text-gray-400">Total Price</span>
                  <span className="text-lg">{cartSubtotal + shippingCost} DH</span>
                </div>
              </div>

              {/* Dynamic Free Shipping Threshold Slider Indicator */}
              <div className="rounded-xl bg-orange-50/40 border border-orange-100 p-2.5 text-[9px] font-medium text-orange-600 flex items-center justify-between">
                {cartSubtotal >= 50 ? (
                  <span>🎉 Your order qualifies for free Medina Express shipping!</span>
                ) : (
                  <span>💡 Add <strong className="font-extrabold">{50 - cartSubtotal} DH</strong> more to unlock FREE shipping!</span>
                )}
              </div>

              {/* Direct Checkout Action triggers */}
              <div className="space-y-2">
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1C1917] hover:bg-[#CA8A04] py-3 text-xs font-black text-white uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  onClick={onClose}
                  className="w-full text-center text-[10px] font-bold text-gray-400 hover:text-black py-1.5 transition-colors cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>

              {/* Secure guarantee signature */}
              <div className="flex items-center justify-center gap-1.5 text-[8.5px] font-bold text-gray-400 select-none border-t border-gray-50 pt-3">
                <ShieldCheck className="h-4 w-4 text-[#10B981]" />
                <span>100% Secure Escrow Trade Guarantee. Pay on delivery.</span>
              </div>

            </div>
          )}

        </div>
      </div>

    </div>
  );
}
