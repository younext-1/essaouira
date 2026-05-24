'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useCart } from '@/hooks/useCart';
import { 
  ShoppingBag, Trash2, Plus, Minus, ArrowRight, Loader2, 
  ShieldCheck, HelpCircle, Truck, Sparkles 
} from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { cart: cartItems, loading: cartLoading, updateQuantity: updateCartItemQuantity, removeFromCart: deleteCartItem, clearCart } = useCart();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // 1. Loading & Auth State fallback
  if (cartLoading) {
    return (
      <div className="w-full min-h-screen bg-[#F9FAFB] flex flex-col" >
        <div className="flex-1 flex flex-col items-center justify-center py-20 select-none">
          <Loader2 className="h-10 w-10 animate-spin text-[#18181B]" />
          <p className="mt-4 text-xs font-extrabold text-[#71717A] uppercase tracking-widest animate-pulse">
            Loading Your Cart...
          </p>
        </div>
      </div>
    );
  }

  // Calculate pricing matrices
  const subtotal = cartItems.reduce((acc, item) => {
    const itemPrice = Number(item.products?.price) || 0;
    return acc + (itemPrice * item.quantity);
  }, 0);

  // Shipping logic: Free shipping above 50 DH, else flat 20 DH
  const shippingThreshold = 50;
  const isShippingFree = subtotal >= shippingThreshold;
  const shippingCost = subtotal === 0 ? 0 : (isShippingFree ? 0 : 20);
  const taxes = Math.round(subtotal * 0.05); // 5% Moroccan handicraft local tax
  const grandTotal = subtotal + shippingCost + taxes;

  const freeShippingProgress = Math.min(100, (subtotal / shippingThreshold) * 100);
  const remainingForFree = Math.max(0, shippingThreshold - subtotal);

  const handleQtyChange = async (itemId: string, currentQty: number, offset: number, stock: number) => {
    const nextQty = currentQty + offset;
    if (nextQty < 1 || nextQty > stock) return;
    setUpdatingId(itemId);
    try {
      await updateCartItemQuantity({ itemId, quantity: nextQty });
    } catch (err) {
      console.error(err);
      alert('Failed to update quantity.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (itemId: string) => {
    setUpdatingId(itemId);
    try {
      await deleteCartItem(itemId);
    } catch (err) {
      console.error(err);
      alert('Failed to remove item.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F9FAFB] pb-20" >

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header summary info */}
        <div className="border-b border-gray-150 pb-5 mb-8 select-none">
          <span className="text-[10px] font-bold tracking-widest text-[#18181B] uppercase">Shopping Cart</span>
          <h1 className="text-3xl font-extrabold text-[#18181B] mt-1" >
            Your Crafted Selection
          </h1>
        </div>

        {/* Empty state alert */}
        {cartItems.length === 0 ? (
          <div className="text-center py-20 px-4 bg-white border border-[rgba(232,227,216,0.45)] rounded-3xl max-w-md mx-auto shadow-sm select-none">
            <ShoppingBag className="w-12 h-12 text-[#71717A] mx-auto mb-4 animate-bounce" />
            <h3 className="font-bold text-lg text-[#18181B] mb-1" >Your cart is empty</h3>
            <p className="text-xs text-[#71717A] mb-6 leading-relaxed font-light">
              You haven't added any authentic Medina items to your cart yet. Explore our curated collections of mastercrafts to get started.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#18181B] hover:bg-[#18181B]/95 px-6 py-3 text-xs font-bold text-white shadow-md spring-transition cursor-pointer"
            >
              Browse Collections <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          /* Multi-column grid catalog */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT 8 COLS: Items rows list */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* Free shipping banner meter */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-4 select-none">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-2">
                  <span className="flex items-center gap-1.5 text-[#18181B]">
                    <Truck className="h-4.5 w-4.5" />
                    {isShippingFree ? 'You unlocked Free Medina Shipping!' : `Add ${remainingForFree} DH more for Free Shipping`}
                  </span>
                  <span className="text-[10px] text-[#71717A] font-extrabold">GOAL: 50 DH</span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#18181B] spring-transition"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>

              {/* Items mapping rows */}
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const p = item.products;
                  if (!p) return null;
                  const itemPrice = Number(p.price) || 0;
                  const totalItemPrice = itemPrice * item.quantity;
                  const isItemUpdating = updatingId === item.id;

                  return (
                    <div 
                      key={item.id}
                      className="rounded-2xl border border-gray-150 bg-white p-4 shadow-sm hover:shadow-md spring-transition flex flex-col sm:flex-row items-center gap-4 relative"
                    >
                      {isItemUpdating && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-2xl">
                          <Loader2 className="h-6 w-6 animate-spin text-[#18181B]" />
                        </div>
                      )}

                      {/* Cover Photo */}
                      <div className="h-20 w-20 rounded-xl overflow-hidden border border-[rgba(232,227,216,0.45)] bg-[#F5F0E8] shrink-0 select-none relative">
                        <img 
                          src={p.images?.[0] || '/placeholder.jpg'} 
                          alt={p.name} 
                          className="h-full w-full object-cover" 
                        />
                      </div>

                      {/* Meta information column */}
                      <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
                        {p.category?.name && (
                          <span className="rounded bg-indigo-50 px-2 py-0.5 text-[8.5px] font-bold text-[#18181B] uppercase">
                            {p.category.name}
                          </span>
                        )}
                        <h3 className="font-extrabold text-sm text-[#18181B] truncate mt-0.5" >
                          {p.name}
                        </h3>
                        
                        {/* Variant pills selected */}
                        {item.variant && Object.keys(item.variant).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start pt-1">
                            {Object.entries(item.variant).map(([key, val]) => (
                              <span key={key} className="rounded-lg border border-gray-250 bg-[#F5F0E8] px-2 py-0.5 text-[9px] font-semibold text-[#71717A] uppercase">
                                {key}: {String(val)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Interactive Qty stepper and totals row */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                        
                        {/* Stepper buttons */}
                        <div className="flex items-center rounded-xl border border-[rgba(232,227,216,0.8)] bg-[#F5F0E8] p-1 select-none">
                          <button
                            onClick={() => handleQtyChange(item.id, item.quantity, -1, p.stock)}
                            disabled={item.quantity <= 1 || isItemUpdating}
                            className="h-7 w-7 flex items-center justify-center rounded-lg text-[#71717A] hover:text-[#18181B] hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center font-bold text-xs text-[#18181B]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQtyChange(item.id, item.quantity, 1, p.stock)}
                            disabled={item.quantity >= p.stock || isItemUpdating}
                            className="h-7 w-7 flex items-center justify-center rounded-lg text-[#71717A] hover:text-[#18181B] hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right shrink-0">
                          <span className="block text-xs font-bold text-[#71717A]">{itemPrice} DH each</span>
                          <span className="block text-sm font-extrabold text-[#18181B] mt-0.5">{totalItemPrice} DH</span>
                        </div>

                        {/* Delete Trash Button */}
                        <button
                          onClick={() => handleRemove(item.id)}
                          disabled={isItemUpdating}
                          className="h-9 w-9 flex items-center justify-center rounded-xl border border-[rgba(232,227,216,0.8)] text-[#71717A] hover:text-red-500 hover:bg-red-50 hover:border-red-100 spring-transition cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>

                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* RIGHT 4 COLS: Pricing details summary panel */}
            <div className="lg:col-span-4 rounded-3xl border border-[rgba(232,227,216,0.45)] bg-white p-6 shadow-md space-y-6">
              
              <h2 className="text-lg font-bold text-[#18181B] select-none" >
                Summary
              </h2>

              <div className="space-y-4 border-b border-[rgba(232,227,216,0.45)] pb-5 text-xs text-[#71717A] select-none">
                <div className="flex justify-between items-center">
                  <span>Cart Subtotal</span>
                  <span className="font-bold text-[#18181B]">{subtotal} DH</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    Shipping & Handcraft Wrap
                    <HelpCircle className="h-3.5 w-3.5 text-[#71717A]" />
                  </span>
                  <span className={`font-bold ${shippingCost === 0 ? 'text-[#10B981]' : 'text-[#18181B]'}`}>
                    {shippingCost === 0 ? 'FREE' : `${shippingCost} DH`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Moroccan Handicraft Taxes (5%)</span>
                  <span className="font-bold text-[#18181B]">{taxes} DH</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-end select-none">
                <span className="text-xs font-extrabold text-[#71717A] uppercase tracking-widest">Total cost</span>
                <span className="text-2xl font-extrabold text-[#18181B] tracking-tight">{grandTotal} DH</span>
              </div>

              {/* Checkout link button */}
              <button
                onClick={() => router.push('/checkout')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#18181B] hover:bg-[#18181B]/90 py-3 text-xs font-bold text-white shadow-md active:scale-95 spring-transition cursor-pointer select-none"
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </button>

              {/* Safe checkout security badges */}
              <div className="rounded-2xl bg-[#F5F0E8] p-4 text-[10px] text-[#71717A] font-semibold leading-relaxed space-y-2 select-none">
                <span className="flex items-center gap-1.5 text-[#71717A] font-bold">
                  <ShieldCheck className="h-4.5 w-4.5 text-[#10B981]" /> Secure Transaction Protections
                </span>
                <p>
                  Your payment details are encrypted. Funds are held in escrow and disbursed to artisans only after delivery confirmation.
                </p>
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}
