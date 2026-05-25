'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useCart } from '@/hooks/useCart';
import { useOrders } from '@/hooks/useOrders';
import { 
  ArrowLeft, Loader2, CreditCard, ShieldCheck, MapPin, 
  ShoppingBag, Phone, CheckCircle, Sparkles 
} from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const { cart: cartItems, loading: cartLoading } = useCart();
  const { placeOrder } = useOrders();

  // 1. Form inputs states
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Essaouira');
  const [country, setCountry] = useState('Morocco');
  const [zip, setZip] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  const getDialCode = (c: string) => {
    switch (c) {
      case 'Morocco': return '+212';
      case 'France': return '+33';
      case 'Spain': return '+34';
      case 'Germany': return '+49';
      case 'United Kingdom': return '+44';
      case 'United States': return '+1';
      default: return '+212';
    }
  };

  // 2. Loading state fallback
  if (cartLoading) {
    return (
      <div className="w-full min-h-screen bg-[#F9FAFB] flex flex-col" >
        <div className="flex-1 flex flex-col items-center justify-center py-20 select-none">
          <Loader2 className="h-10 w-10 animate-spin text-[#18181B]" />
          <p className="mt-4 text-xs font-extrabold text-[#71717A] uppercase tracking-widest animate-pulse">
            Loading Checkout Info...
          </p>
        </div>
      </div>
    );
  }

  // If cart is empty, redirect home
  if (cartItems.length === 0) {
    return (
      <div className="w-full min-h-screen bg-[#F9FAFB] flex flex-col" >
        <div className="mx-auto max-w-md px-4 py-20 text-center select-none">
          <div className="rounded-3xl border border-gray-150 bg-white p-8 shadow-sm">
            <ShoppingBag className="w-12 h-12 text-[#71717A] mx-auto mb-4 animate-bounce" />
            <h3 className="font-bold text-lg text-[#18181B]" >Your cart is empty</h3>
            <p className="text-xs text-[#71717A] mt-2">You cannot proceed to checkout without items in your cart.</p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-[#18181B] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#18181B]/90"
            >
              <ArrowLeft className="h-4 w-4" /> Return to Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate pricing matrices
  const subtotal = cartItems.reduce((acc, item) => {
    const itemPrice = Number(item.products?.price) || 0;
    return acc + (itemPrice * item.quantity);
  }, 0);

  const shippingThreshold = 50;
  const isShippingFree = subtotal >= shippingThreshold;
  const shippingCost = subtotal === 0 ? 0 : (isShippingFree ? 0 : 20);
  const taxes = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + shippingCost + taxes;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return setError('Please enter your full name.');
    if (!phone.trim()) return setError('Please enter your phone number.');
    if (!address.trim()) return setError('Please enter your shipping address.');
    if (!city.trim()) return setError('Please enter your shipping city.');

    // Sanitize and validate phone number
    let sanitizedPhone = phone.trim().replace(/\s+/g, '');
    const dialCode = getDialCode(country);
    
    // Strip duplicate dial code if entered
    if (sanitizedPhone.startsWith(dialCode)) {
      sanitizedPhone = sanitizedPhone.slice(dialCode.length);
    } else if (sanitizedPhone.startsWith('00' + dialCode.replace('+', ''))) {
      sanitizedPhone = sanitizedPhone.slice(('00' + dialCode.replace('+', '')).length);
    }
    
    // Strip leading zero
    if (sanitizedPhone.startsWith('0')) {
      sanitizedPhone = sanitizedPhone.slice(1);
    }

    if (sanitizedPhone.length < 8 || sanitizedPhone.length > 12 || !/^\d+$/.test(sanitizedPhone)) {
      return setError(`Please enter a valid phone number (8 to 12 digits, without international prefix).`);
    }

    const finalPhone = `${dialCode}${sanitizedPhone}`;

    setPlacingOrder(true);
    setError(null);

    try {
      const itemsPayload = cartItems.map((item) => ({
        productId: item.product_id,
        storeId: item.products?.store_id || '',
        quantity: item.quantity,
        priceAtPurchase: Number(item.products?.price) || 0,
        variant: item.variant,
      }));

      const shippingAddressPayload = {
        fullName: fullName.trim(),
        addressLine1: address.trim(),
        city: city.trim(),
        country: country.trim(),
        zip: zip.trim(),
        phone: finalPhone,
      };

      // Execute the unified custom atomic place order transaction!
      const placed = await placeOrder({
        items: itemsPayload,
        shippingAddress: shippingAddressPayload,
      });
      
      if (placed && placed.length > 0) {
        setPlacedOrderId(placed[0].id);
        setShowSuccessModal(true);
      } else {
        router.push('/orders');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to place order transaction. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F9FAFB] pb-20" >

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header navigation bar */}
        <div className="mb-6 select-none flex items-center justify-between">
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#71717A] hover:text-[#18181B] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Cart
          </Link>
          <span className="text-[10px] font-bold tracking-widest text-[#71717A] uppercase">Checkout Details</span>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-bold text-red-700 mb-6 select-none">
            {error}
          </div>
        )}

        {/* 2-Column Split Details Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT 7 COLS: Shipping Address Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[rgba(232,227,216,0.45)] p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-[#18181B] mb-6 flex items-center gap-2 select-none" >
              <MapPin className="h-5 w-5 text-[#18181B]" />
              Shipping Destination
            </h2>

            <form onSubmit={handlePlaceOrder} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest mb-1.5">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amina El Kadiri"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(232,227,216,0.8)] bg-white px-4 py-2.5 text-sm text-[#18181B] focus:border-[#18181B] focus:outline-none focus:ring-1 focus:ring-[#18181B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest mb-1.5">
                    Phone Number *
                  </label>
                  <div className="relative rounded-xl border border-[rgba(232,227,216,0.8)] overflow-hidden focus-within:ring-1 focus-within:ring-[#18181B] focus-within:border-[#18181B] spring-transition">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#71717A] select-none">
                      {getDialCode(country)}
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="600-000000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white pl-16 pr-4 py-2.5 text-sm text-[#18181B] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest mb-1.5">
                    Postal Zip Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 44000"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className="w-full rounded-xl border border-[rgba(232,227,216,0.8)] bg-white px-4 py-2.5 text-sm text-[#18181B] focus:border-[#18181B] focus:outline-none focus:ring-1 focus:ring-[#18181B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest mb-1.5">
                  Street Address & Medina Details *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rue de la Sqala, No. 24, Essaouira Medina"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(232,227,216,0.8)] bg-white px-4 py-2.5 text-sm text-[#18181B] focus:border-[#18181B] focus:outline-none focus:ring-1 focus:ring-[#18181B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest mb-1.5">
                    City *
                  </label>
                  {country === 'Morocco' ? (
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl border border-[rgba(232,227,216,0.8)] bg-white px-4 py-2.5 text-sm text-[#18181B] focus:border-[#18181B] focus:outline-none"
                    >
                      <option value="Essaouira">Essaouira</option>
                      <option value="Marrakech">Marrakech</option>
                      <option value="Casablanca">Casablanca</option>
                      <option value="Rabat">Rabat</option>
                      <option value="Agadir">Agadir</option>
                      <option value="Tangier">Tangier</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="e.g. Paris, New York, Madrid"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl border border-[rgba(232,227,216,0.8)] bg-white px-4 py-2.5 text-sm text-[#18181B] focus:border-[#18181B] focus:outline-none focus:ring-1 focus:ring-[#18181B]"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest mb-1.5">
                    Country *
                  </label>
                  <select
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value);
                      if (e.target.value !== 'Morocco') {
                        setCity('');
                      } else {
                        setCity('Essaouira');
                      }
                    }}
                    className="w-full rounded-xl border border-[rgba(232,227,216,0.8)] bg-white px-4 py-2.5 text-sm text-[#18181B] focus:border-[#18181B] focus:outline-none focus:ring-1 focus:ring-[#18181B]"
                  >
                    <option value="Morocco">Morocco (المغرب)</option>
                    <option value="France">France (فرنسا)</option>
                    <option value="Spain">Spain (إسبانيا)</option>
                    <option value="Germany">Germany (ألمانيا)</option>
                    <option value="United Kingdom">United Kingdom (بريطانيا)</option>
                    <option value="United States">United States (أمريكا)</option>
                  </select>
                </div>
              </div>

              {/* Payment Methods (Physical Verification COD) */}
              <div className="border-t border-[rgba(232,227,216,0.45)] pt-6 mt-6 space-y-4 select-none">
                <span className="block text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest">
                  Secure Purchase Guarantee
                </span>
                <div className="rounded-2xl border border-[#18181B] bg-indigo-50/20 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center text-[#18181B]">
                      <CreditCard className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#18181B]">Cash On Delivery (COD)</span>
                      <span className="text-[9px] text-[#18181B] font-extrabold uppercase">
                        {country === 'Morocco' ? 'Amana Medina Express' : 'DHL Global Express'}
                      </span>
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-[#18181B] fill-current" />
                </div>
                <p className="text-[10px] text-[#71717A] leading-relaxed">
                  {country === 'Morocco' 
                    ? "Safe Trade Guarantee: Pay in cash directly to the Amana courier agent only after you inspect the product's physical quality and ensure you are 100% satisfied." 
                    : "International Delivery Protection: Your order will be shipped via DHL Premium Express. You will pay the courier agent upon arrival after physical inspection."}
                </p>
              </div>
            </form>
          </div>

          {/* RIGHT 5 COLS: Checkout Items lists & Pricing total */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-[rgba(232,227,216,0.45)] p-6 shadow-md space-y-6">
            <h2 className="text-lg font-bold text-[#18181B] select-none" >
              Order Review
            </h2>

            {/* Cart item catalog rows list */}
            <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
              {cartItems.map((item) => {
                const p = item.products;
                if (!p) return null;
                const price = Number(p.price) || 0;
                return (
                  <div key={item.id} className="flex items-center gap-3 text-xs">
                    <div className="h-12 w-12 rounded-lg overflow-hidden border border-[rgba(232,227,216,0.45)] bg-[#F5F0E8] shrink-0 select-none relative">
                      <img src={p.images?.[0] || '/placeholder.jpg'} alt={p.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 truncate">{p.name}</h4>
                      <span className="text-[10px] text-[#71717A]">Qty: {item.quantity}</span>
                    </div>
                    <span className="font-bold text-gray-900 shrink-0">{price * item.quantity} DH</span>
                  </div>
                );
              })}
            </div>

            {/* Calculations summaries */}
            <div className="space-y-3 border-t border-[rgba(232,227,216,0.45)] pt-4 text-xs text-[#71717A] select-none">
              <div className="flex justify-between items-center">
                <span>Items Subtotal</span>
                <span className="font-bold text-[#18181B]">{subtotal} DH</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Medina Shipping Fee</span>
                <span className={`font-bold ${shippingCost === 0 ? 'text-[#10B981]' : 'text-[#18181B]'}`}>
                  {shippingCost === 0 ? 'FREE' : `${shippingCost} DH`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Local Craft Taxes (5%)</span>
                <span className="font-bold text-[#18181B]">{taxes} DH</span>
              </div>
              <div className="flex justify-between items-center border-t border-[rgba(232,227,216,0.45)] pt-3 text-sm text-[#18181B] font-extrabold select-none">
                <span className="uppercase text-xs tracking-wider text-[#71717A]">Grand Total</span>
                <span className="text-xl tracking-tight">{grandTotal} DH</span>
              </div>
            </div>

            {/* Transaction Action */}
            <button
              onClick={handlePlaceOrder}
              disabled={placingOrder}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#18181B] hover:bg-[#18181B]/90 py-3 text-xs font-bold text-white shadow-md active:scale-95 spring-transition cursor-pointer select-none"
            >
              {placingOrder ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing Escrow Transaction...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Place Order ({grandTotal} DH)
                </>
              )}
            </button>

            {/* Trust badge */}
            <div className="rounded-2xl bg-indigo-50/30 border border-indigo-100 p-4 text-[10px] text-[#71717A] font-semibold space-y-2 select-none">
              <span className="flex items-center gap-1.5 text-[#18181B] font-bold">
                <Sparkles className="h-4.5 w-4.5" /> Fair Trade Verification
              </span>
              <p>
                By placing your order, you help support heritage master artisans in Essaouira Medina directly. Direct fair payments, zero broker cuts.
              </p>
            </div>

          </div>

        </div>

      {/* 5. GORGEOUS WhatsApp COD Order Confirmation Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md select-none font-sans">
          <div className="bg-white rounded-[32px] border border-warm-border p-8 max-w-md w-full shadow-2xl space-y-6 text-center animate-in zoom-in duration-300">
            
            {/* Success Animation Badge */}
            <div className="mx-auto h-20 w-20 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-500 shadow-sm">
              <CheckCircle className="h-10 w-10 text-green-600 fill-current" />
            </div>

            {/* Success Titles */}
            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-[#18181B]">
                Order Placed Successfully!
              </h3>
              <h4 className="text-sm font-bold text-green-600 uppercase tracking-widest">
                تم تسجيل طلبك بنجاح!
              </h4>
            </div>

            <p className="text-xs text-[#71717A] leading-relaxed">
              Thank you for supporting Essaouira's master artisans. Your Cash on Delivery (COD) order has been secured in escrow. 
              To guarantee fast processing, please click below to confirm your delivery address on WhatsApp directly.
            </p>

            {/* Price tag total review */}
            <div className="rounded-2xl bg-gray-50 border border-gray-150 p-4 flex justify-between items-center text-xs font-bold">
              <span className="text-[#71717A] uppercase text-[10px] tracking-wide">Total Order Price</span>
              <span className="text-lg text-red-500">{grandTotal} DH</span>
            </div>

            {/* Actions: Primary green WhatsApp confirmation */}
            <div className="space-y-2 pt-2">
              <a
                href={`https://wa.me/212608078652?text=${encodeURIComponent(
                  `السلام عليكم، قمت للتو بطلب المنتجات التالية عبر موقع موكادور Mogador:\n\nالاسم: ${fullName}\nالهاتف: ${getDialCode(country)}${phone.trim()}\nالعنوان: ${address}, ${city}\n\nالمنتجات:\n${cartItems.map(item => `- ${item.products?.name} x${item.quantity}`).join('\n')}\n\nالمجموع الإجمالي: ${grandTotal} DH\n\nالرجاء تأكيد الطلب وبدء عملية التوصيل!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] hover:bg-[#20BA5A] py-3.5 text-xs font-extrabold text-white shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Confirm Order on WhatsApp
              </a>

              <Link
                href="/orders"
                onClick={() => {
                  setShowSuccessModal(false);
                }}
                className="w-full flex items-center justify-center rounded-2xl bg-gray-100 hover:bg-gray-200 py-3 text-xs font-bold text-[#18181B] active:scale-95 transition-all cursor-pointer"
              >
                Go to Order Timeline / تتبع الطلب
              </Link>
            </div>

          </div>
        </div>
      )}
      </main>
    </div>
  );
}
