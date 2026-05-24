'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { useMyStore } from '@/hooks/useMyStore';
import { useSupabase } from '@/hooks/useSupabase';
import { 
  ShoppingBag, Phone, MapPin, Truck, Clock, 
  CheckCircle2, Loader2, ArrowRight, ShieldCheck, Mail 
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardOrdersPage() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { store } = useMyStore(user?.id);
  const supabase = useSupabase();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<{ [key: string]: string }>({});

  // 1. Query child orders belonging to this store
  const { data: salesItems = [], isLoading } = useQuery<any[]>({
    queryKey: ['merchant-sales', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase
        .from('child_orders')
        .select(`
          id,
          status,
          created_at,
          subtotal,
          shipping_cost,
          parent_orders (
            id,
            shipping_address
          ),
          order_items (
            id,
            quantity,
            unit_price,
            selected_options,
            products (
              id,
              name,
              images,
              thumbnail_url
            )
          )
        `)
        .eq('store_id', store.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!store?.id,
  });

  // 2. Status updater mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from('child_orders')
        .update({ status })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-sales', store?.id] });
      queryClient.invalidateQueries({ queryKey: ['buyer-orders'] });
    },
  });

  // Map database child orders to flat component order layout format
  const allOrders = (salesItems || []).map((co: any) => {
    const parent = co.parent_orders || {};
    const shippingAddr = parent.shipping_address || {};
    const itemsList = (co.order_items || []).map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.unit_price,
      variant: item.selected_options,
      products: {
        id: item.products?.id,
        name: item.products?.name,
        image_url: item.products?.images?.[0] || item.products?.thumbnail_url || '/placeholder.jpg'
      }
    }));

    return {
      id: co.id,
      status: co.status,
      created_at: co.created_at,
      shipping_address: shippingAddr.addressLine1 || shippingAddr.address || 'Essaouira Medina',
      shipping_city: shippingAddr.city || 'Essaouira',
      phone: shippingAddr.phone || '0600000000',
      totalPrice: Number(co.subtotal) + Number(co.shipping_cost),
      items: itemsList
    };
  }).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Filter orders by active tab
  const filteredOrders = allOrders.filter((order) => {
    if (activeTab === 'all') return true;
    return order.status === activeTab;
  });

  const handleStatusTransition = async (orderId: string, nextStatus: string) => {
    setUpdatingId(orderId);
    try {
      await updateStatusMutation.mutateAsync({ orderId, status: nextStatus });
    } catch (err) {
      console.error(err);
      alert('Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleTrackingChange = (orderId: string, val: string) => {
    setTrackingInputs((prev) => ({ ...prev, [orderId]: val }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 select-none">
        <Loader2 className="h-8 w-8 animate-spin text-[#18181B]" />
      </div>
    );
  }

  return (
    <div className="space-y-8" >
      
      {/* Editorial Header */}
      <div className="border-b border-gray-150 pb-5 select-none space-y-1">
        <span className="text-[10px] font-bold tracking-widest text-[#18181B] uppercase">Fulfillment Portal</span>
        <h1 className="text-3xl font-extrabold text-[#18181B]" >
          Manage Shop Orders
        </h1>
      </div>

      {/* Tabs selectors row */}
      <div className="flex flex-wrap gap-2 border-b border-[rgba(232,227,216,0.45)] pb-3 select-none">
        {(['all', 'pending', 'processing', 'shipped', 'delivered'] as const).map((tab) => {
          const count = tab === 'all' 
            ? allOrders.length 
            : allOrders.filter((o) => o.status === tab).length;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-2 text-xs font-bold spring-transition cursor-pointer capitalize ${
                activeTab === tab
                  ? 'bg-[#18181B] text-white shadow-sm'
                  : 'bg-white border border-[rgba(232,227,216,0.8)] text-[#71717A] hover:bg-[#F5F0E8]'
              }`}
            >
              {tab} ({count})
            </button>
          );
        })}
      </div>

      {/* Empty listings alert */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 px-4 bg-white border border-[rgba(232,227,216,0.45)] rounded-3xl max-w-md mx-auto shadow-sm select-none">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-bold text-lg text-[#18181B]" >No orders found</h3>
          <p className="text-xs text-[#71717A] mt-2 font-light leading-relaxed">
            There are no active orders matching "{activeTab}" in your workshop dashboard right now.
          </p>
        </div>
      ) : (
        /* Orders card stack mapping */
        <div className="space-y-6 max-w-4xl">
          {filteredOrders.map((order) => {
            const isUpdating = updatingId === order.id;
            const trackingNum = trackingInputs[order.id] || '';

            return (
              <div 
                key={order.id} 
                className="rounded-3xl border border-gray-150 bg-white shadow-sm overflow-hidden relative"
              >
                {isUpdating && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-[#18181B]" />
                  </div>
                )}

                {/* Card header */}
                <div className="bg-[#F5F0E8]/50 border-b border-gray-150 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#71717A]">ORDER:</span>
                      <code className="text-xs font-bold text-[#18181B] uppercase">#{order.id.slice(0, 8)}</code>
                      <span className={`inline-block rounded-lg px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-widest ${
                        order.status === 'delivered'
                          ? 'bg-emerald-50 text-[#10B981]'
                          : order.status === 'shipped'
                            ? 'bg-indigo-50 text-[#18181B]'
                            : 'bg-amber-50 text-[#CA8A04]'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <span className="block text-[10.5px] text-[#71717A] font-semibold">
                      Placed: {new Date(order.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="block text-[9px] font-extrabold text-[#71717A] uppercase tracking-widest">Store Revenue</span>
                    <span className="block text-lg font-extrabold text-[#18181B] mt-0.5">{order.totalPrice} DH</span>
                  </div>
                </div>

                {/* Card details panels */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-[rgba(232,227,216,0.45)]">
                  
                  {/* LEFT COLUMN: Customer & Shipping parameters */}
                  <div className="space-y-4 select-none">
                    <span className="block text-[9px] font-extrabold text-[#71717A] uppercase tracking-widest">
                      Shipping Details
                    </span>

                    <div className="space-y-2.5 text-xs text-[#71717A] font-semibold">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#18181B]" />
                        <span className="text-[#18181B]">{order.shipping_address}, {order.shipping_city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-[#18181B]" />
                        <span className="text-[#18181B]">{order.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Action parameters triggers */}
                  <div className="bg-[#F5F0E8]/50 rounded-2xl p-4 border border-gray-150 space-y-4">
                    <span className="block text-[9px] font-extrabold text-[#71717A] uppercase tracking-widest select-none">
                      Fulfillment Action
                    </span>

                    <div className="flex flex-col gap-3">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleStatusTransition(order.id, 'processing')}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white py-2.5 text-xs font-bold shadow-sm spring-transition cursor-pointer"
                        >
                          <Clock className="h-4 w-4" /> Start Processing Order
                        </button>
                      )}

                      {order.status === 'processing' && (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Optional tracking (e.g. DHL-83749)"
                            value={trackingNum}
                            onChange={(e) => handleTrackingChange(order.id, e.target.value)}
                            className="w-full rounded-lg border border-gray-250 bg-white px-3 py-2 text-xs text-[#18181B] font-semibold focus:outline-none"
                          />
                          <button
                            onClick={() => handleStatusTransition(order.id, 'shipped')}
                            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#18181B] hover:bg-[#18181B]/95 text-white py-2.5 text-xs font-bold shadow-sm spring-transition cursor-pointer"
                          >
                            <Truck className="h-4 w-4" /> Ship Package
                          </button>
                        </div>
                      )}

                      {order.status === 'shipped' && (
                        <button
                          onClick={() => handleStatusTransition(order.id, 'delivered')}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#10B981] hover:bg-[#10B981]/95 text-white py-2.5 text-xs font-bold shadow-sm spring-transition cursor-pointer"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Confirm Delivered (Payout Release)
                        </button>
                      )}

                      {order.status === 'delivered' && (
                        <div className="rounded-xl bg-emerald-50 text-[#10B981] font-bold text-xs p-3 text-center border border-emerald-100 flex items-center justify-center gap-1.5 select-none">
                          <ShieldCheck className="h-4.5 w-4.5" /> Fulfillments Completed & Funds Released
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Card items mapping */}
                <div className="p-5 space-y-3">
                  <span className="block text-[9px] font-extrabold text-[#71717A] uppercase tracking-widest select-none">
                    Items to Fulfill ({order.items.length})
                  </span>

                  <div className="divide-y divide-gray-100">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex justify-between items-center text-xs">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg border border-[rgba(232,227,216,0.45)] bg-[#F5F0E8] overflow-hidden shrink-0 select-none relative">
                            <img src={item.products?.image_url || '/placeholder.jpg'} alt="item" className="h-full w-full object-cover" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-gray-900 line-clamp-1 max-w-[250px]">{item.products?.name}</h4>
                            <span className="text-[10px] text-[#71717A]">Quantity: {item.quantity} units</span>
                            {item.variant && Object.keys(item.variant).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-0.5 select-none">
                                {Object.entries(item.variant).map(([k, v]: any) => (
                                  <span key={k} className="rounded bg-[#E8E3D8] px-1 py-0.5 text-[8px] font-medium text-[#71717A] uppercase">
                                    {k}: {v}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <span className="font-extrabold text-gray-900 shrink-0">
                          {Number(item.price) * item.quantity} DH
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
