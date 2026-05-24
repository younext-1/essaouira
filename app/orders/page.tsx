'use client';

import { useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useOrders } from '@/hooks/useOrders';
import { 
  Package, Clock, Truck, ShieldCheck, CheckCircle2, 
  ArrowRight, Loader2, Calendar, ShoppingBag, Store,
  MessageSquare, Smartphone, Check
} from 'lucide-react';
import Link from 'next/link';

const STATUS_STEPS = [
  { key: 'pending', label: 'Receipt Printed / تأكيد الطلب', icon: Calendar, color: 'text-amber-500' },
  { key: 'processing', label: 'Medina Workshop / قيد التجهيز', icon: Clock, color: 'text-indigo-500' },
  { key: 'shipped', label: 'Amana Express / شحن أمانة', icon: Truck, color: 'text-indigo-500' },
  { key: 'delivered', label: 'Handover & COD / الاستلام والدفع', icon: CheckCircle2, color: 'text-emerald-500' },
];

export default function OrdersPage() {
  const { user, isLoaded: userLoaded, isSignedIn } = useUser();
  const { buyerOrders, buyerOrdersLoading } = useOrders();
  const clerk = useClerk();
  const [openWhatsAppId, setOpenWhatsAppId] = useState<string | null>(null);

  // 1. Loading fallbacks
  if (!userLoaded || buyerOrdersLoading) {
    return (
      <div className="w-full min-h-screen bg-[#F9FAFB] flex flex-col" >
        <div className="flex-1 flex flex-col items-center justify-center py-20 select-none">
          <Loader2 className="h-10 w-10 animate-spin text-[#18181B]" />
          <p className="mt-4 text-xs font-extrabold text-[#71717A] uppercase tracking-widest animate-pulse">
            Loading Your Orders...
          </p>
        </div>
      </div>
    );
  }

  // 2. Authentication locks
  if (!isSignedIn) {
    return (
      <div className="w-full min-h-screen bg-[#F9FAFB] flex flex-col" >
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center select-none">
          <div className="rounded-3xl border border-[rgba(232,227,216,0.45)] bg-white p-8 max-w-sm shadow-md">
            <Package className="w-12 h-12 text-[#18181B] mx-auto mb-4 animate-bounce" />
            <h3 className="font-bold text-lg text-[#18181B]" >Access Protected</h3>
            <p className="text-xs text-[#71717A] mt-2 mb-6 leading-relaxed">
              Please sign in to your verified account to view your purchase history and trace transit shipments.
            </p>
            <button
              onClick={() => clerk.openSignIn()}
              className="w-full inline-flex items-center justify-center rounded-xl bg-[#18181B] px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-[#18181B]/90"
            >
              Sign In to Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const orders = buyerOrders || [];

  return (
    <div className="w-full min-h-screen bg-[#F9FAFB] pb-20" >

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header tracker info */}
        <div className="border-b border-gray-150 pb-5 mb-8 select-none">
          <span className="text-[10px] font-bold tracking-widest text-[#18181B] uppercase">Purchase History</span>
          <h1 className="text-3xl font-extrabold text-[#18181B] mt-1" >
            Track Your Orders
          </h1>
        </div>

        {/* Empty orders history */}
        {orders.length === 0 ? (
          <div className="text-center py-20 px-4 bg-white border border-[rgba(232,227,216,0.45)] rounded-3xl max-w-md mx-auto shadow-sm select-none">
            <ShoppingBag className="w-12 h-12 text-[#71717A] mx-auto mb-4 animate-bounce" />
            <h3 className="font-bold text-lg text-[#18181B]" >No orders found</h3>
            <p className="text-xs text-[#71717A] mb-6 leading-relaxed font-light">
              You haven't placed any handcrafted orders yet. Explore independent artisan listings to make your first purchase.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#18181B] hover:bg-[#18181B]/95 px-6 py-3 text-xs font-bold text-white shadow-md spring-transition cursor-pointer"
            >
              Explore Medina Crafts <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          /* Orders cards list stack */
          <div className="space-y-6 max-w-4xl mx-auto">
            {orders.map((order) => {
              const items = order.order_items || [];
              const orderDate = order.created_at
                ? new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Pending Date';

              // Get active status index for step timeline trackers
              const currentStatus = order.status || 'pending';
              const activeIdx = STATUS_STEPS.findIndex((s) => s.key === currentStatus);

              return (
                <div 
                  key={order.id} 
                  className="rounded-3xl border border-[rgba(232,227,216,0.45)] bg-white shadow-sm overflow-hidden"
                >
                  
                  {/* Top card stats bar */}
                  <div className="bg-[#F5F0E8]/50 border-b border-[rgba(232,227,216,0.45)] p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#71717A]">ORDER ID:</span>
                        <code className="text-xs font-bold text-[#18181B] uppercase">#{order.id.slice(0, 8)}</code>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#71717A] font-semibold">
                        <span>Placed on: {orderDate}</span>
                        <span>•</span>
                        <span>To: {order.shipping_city}</span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <span className="block text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest">Total Amount</span>
                      <span className="block text-lg font-extrabold text-[#18181B] mt-0.5">{order.total_price} DH</span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 space-y-6">
                    
                    {/* Visual Status timelines */}
                    <div className="border-b border-[rgba(232,227,216,0.45)] pb-6 select-none max-w-xl mx-auto pt-2">
                      <div className="flex items-center justify-between relative">
                        {/* Connecting background bar */}
                        <div className="absolute top-4 left-0 right-0 h-1 bg-gray-150 rounded -z-10" />
                        <div 
                          className="absolute top-4 left-0 h-1 bg-[#18181B] rounded -z-10 spring-transition"
                          style={{ width: `${(activeIdx / (STATUS_STEPS.length - 1)) * 100}%` }}
                        />

                        {STATUS_STEPS.map((step, idx) => {
                          const Icon = step.icon;
                          const isCompleted = idx <= activeIdx;
                          const isActive = idx === activeIdx;

                          return (
                            <div key={step.key} className="flex flex-col items-center">
                              <div 
                                className={`h-9 w-9 rounded-full flex items-center justify-center spring-transition ${
                                  isActive
                                    ? 'bg-[#18181B] text-white ring-4 ring-[#18181B]/10 scale-110 shadow-sm'
                                    : isCompleted
                                      ? 'bg-indigo-50 text-[#18181B] border-2 border-[#18181B]'
                                      : 'bg-white text-gray-300 border-2 border-gray-150'
                                }`}
                              >
                                <Icon className="h-4.5 w-4.5" />
                              </div>
                              <span 
                                className={`text-[10px] font-bold mt-2 tracking-wide uppercase ${
                                  isActive 
                                    ? 'text-[#18181B]' 
                                    : isCompleted 
                                      ? 'text-gray-900' 
                                      : 'text-gray-300'
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Order items lists display */}
                    <div className="space-y-4">
                      <span className="block text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest select-none">
                        Purchased Items ({items.length})
                      </span>
                      
                      <div className="divide-y divide-gray-100">
                        {items.map((item) => {
                          const p = item.products;
                          if (!p) return null;
                          return (
                            <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                {/* Photo */}
                                <div className="h-14 w-14 rounded-xl border border-[rgba(232,227,216,0.45)] bg-[#F5F0E8] overflow-hidden shrink-0 select-none relative">
                                  <img 
                                    src={p.image_url || '/placeholder.jpg'} 
                                    alt={p.name} 
                                    className="h-full w-full object-cover" 
                                  />
                                </div>

                                <div className="space-y-1">
                                  <h4 className="font-extrabold text-xs text-[#18181B] max-w-sm line-clamp-1">
                                    {p.name}
                                  </h4>
                                  
                                  {/* Qty & Price details */}
                                  <div className="flex items-center gap-2 text-[10px] text-[#71717A] font-semibold select-none">
                                    <span>Quantity: {item.quantity}</span>
                                    <span>•</span>
                                    <span>{item.price_at_purchase} DH each</span>
                                  </div>

                                  {/* Variant details */}
                                  {item.variant && Object.keys(item.variant).length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-0.5 select-none">
                                      {Object.entries(item.variant).map(([k, v]) => (
                                        <span key={k} className="rounded bg-[#E8E3D8] px-1.5 py-0.5 text-[8.5px] font-medium text-[#71717A] uppercase">
                                          {k}: {v}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Button navigation links */}
                              <div className="flex items-center gap-2">
                                {p.stores && (
                                  <Link
                                    href={`/store/${p.stores.slug}`}
                                    className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-gray-250 hover:bg-[#F5F0E8] px-2.5 py-1.5 text-[10px] font-bold text-[#71717A] transition-colors"
                                  >
                                    <Store className="h-3.5 w-3.5" /> Visit Shop
                                  </Link>
                                )}
                                <Link
                                  href={`/product/${p.id}`}
                                  className="inline-flex items-center gap-1 rounded-lg bg-[#18181B] hover:bg-[#18181B] px-3 py-1.5 text-[10px] font-bold text-white spring-transition shadow-sm"
                                >
                                  View Item
                                </Link>
                              </div>

                            </div>
                          );
                        })}
                      </div>

                    </div>

                    {/* WhatsApp simulated tracker alert section */}
                    <div className="border-t border-[rgba(232,227,216,0.45)] pt-4 space-y-4 select-none">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest">
                          Simulated Notifications
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => setOpenWhatsAppId(openWhatsAppId === order.id ? null : order.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#25D366]/20 bg-[#25D366]/5 hover:bg-[#25D366]/10 px-3 py-1.5 text-[10px] font-bold text-[#15A850] transition-colors cursor-pointer"
                        >
                          <MessageSquare className="h-3.5 w-3.5" /> 
                          {openWhatsAppId === order.id ? 'Close Alert Preview' : 'Preview WhatsApp Alert'}
                        </button>
                      </div>

                      {openWhatsAppId === order.id && (
                        <div className="rounded-2xl border border-[#25D366]/20 bg-[#25D366]/5 p-4 space-y-3 animate-in slide-in-from-top duration-300">
                          <div className="flex items-center gap-2 text-[#15A850]">
                            <Smartphone className="h-4 w-4" />
                            <span className="text-[10px] font-extrabold uppercase tracking-wider">
                              Automated Amana WhatsApp Dispatch (Simulated)
                            </span>
                          </div>

                          {/* WhatsApp Chat Bubble */}
                          <div className="relative bg-white border border-gray-150 rounded-2xl p-4 shadow-sm max-w-md ml-3">
                            {/* Little speech bubble tail */}
                            <div className="absolute top-3 -left-2 h-4 w-4 bg-white border-l border-b border-gray-150 rotate-45" />
                            
                            <div className="relative z-10 space-y-2">
                              <p className="text-xs text-gray-800 leading-relaxed font-semibold font-sans" style={{ direction: 'rtl' }}>
                                مرحباً بك يا {user?.firstName || 'صديقنا الحرفي'}! 🌊 
                                <br />
                                تم شحن طلبك الحرفي الفاخر رقم <code className="text-[#18181B] font-bold font-mono">#{order.id.slice(0, 8)}</code> بنجاح من ورشات الصويرة العتيقة وهو الآن في طريقه إليك عبر <span className="text-[#18181B] font-bold">أمانة إكسبريس (Amana Express)</span>.
                                <br /><br />
                                🚚 الدفع عند الاستلام (COD): <span className="font-extrabold text-[#15A850]">{order.total_price} DH</span>.
                                <br />
                                📍 مدينة الشحن: <span className="font-bold">{order.shipping_city}</span>.
                                <br /><br />
                                يمكنك تتبع شحنتك وتجهيز الورشة في أي وقت عبر مرشد موكادور الذكي! طاب يومك! ⚓
                              </p>

                              <div className="flex items-center justify-end gap-1 select-none">
                                <span className="text-[9px] text-[#71717A]">12:30 PM</span>
                                <span className="flex text-[#34B7F1]"><Check className="h-3 w-3" /><Check className="h-3 w-3 -ml-1.5" /></span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-[9px] font-extrabold text-[#71717A] uppercase tracking-widest">
                              Mock Action Triggered
                            </span>
                            <span className="h-2 w-2 rounded-full bg-[#25D366] animate-ping" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Escrow assurance note */}
                    <div className="border-t border-[rgba(232,227,216,0.45)] pt-4 flex items-center gap-1.5 text-[9.5px] text-[#71717A] font-semibold select-none">
                      <ShieldCheck className="h-4.5 w-4.5 text-[#10B981]" />
                      Funds held securely under Escrow Guarantee. Paid to artisans upon validated courier deliveries.
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}
