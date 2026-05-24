'use client';

import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { useMyStore } from '@/hooks/useMyStore';
import { useSupabase } from '@/hooks/useSupabase';
import { 
  DollarSign, Package, ShoppingBag, AlertTriangle, 
  ArrowUpRight, Clock, CheckCircle2, TrendingUp, Inbox, ArrowRight 
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardOverviewPage() {
  const { user } = useUser();
  const { store } = useMyStore(user?.id);
  const supabase = useSupabase();

  // 1. Query products listed in this workshop
  const { data: products = [], isLoading: productsLoading } = useQuery<any[]>({
    queryKey: ['merchant-products', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!store?.id,
  });

  // 2. Query order items sold belonging to products in this store
  const { data: salesItems = [], isLoading: salesLoading } = useQuery<any[]>({
    queryKey: ['merchant-sales', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          id,
          quantity,
          price,
          variant,
          order_id,
          orders (
            id,
            status,
            created_at,
            shipping_address,
            shipping_city,
            phone
          ),
          products!inner (
            id,
            name,
            image_url,
            store_id
          )
        `)
        .eq('products.store_id', store.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!store?.id,
  });

  const isLoading = productsLoading || salesLoading;

  // Calculate stats parameters
  const totalEarnings = salesItems.reduce((acc, item) => {
    return acc + (Number(item.price) * item.quantity);
  }, 0);

  const totalItemsSold = salesItems.reduce((acc, item) => acc + item.quantity, 0);

  // Group by unique order IDs
  const uniqueOrdersMap: { [key: string]: any } = {};
  salesItems.forEach((item) => {
    if (item.orders) {
      uniqueOrdersMap[item.order_id] = {
        ...item.orders,
        itemsCount: (uniqueOrdersMap[item.order_id]?.itemsCount || 0) + item.quantity,
        totalPrice: (uniqueOrdersMap[item.order_id]?.totalPrice || 0) + (Number(item.price) * item.quantity),
      };
    }
  });
  const recentOrders = Object.values(uniqueOrdersMap).sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const activeOrdersCount = recentOrders.filter((o) => o.status !== 'delivered').length;
  const lowStockProducts = products.filter((p) => p.stock < 5);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse select-none">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white border border-[rgba(232,227,216,0.45)] rounded-2xl p-6" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 h-96 bg-white border border-gray-150 rounded-3xl" />
          <div className="lg:col-span-4 h-96 bg-white border border-gray-150 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Editorial Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
        <div className="space-y-1">
          <span className="text-[10px] font-bold tracking-widest text-[#18181B] uppercase">Workshop Control Panel</span>
          <h1 className="text-3xl font-extrabold text-[#18181B]" >
            Merchant Overview
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/products/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#18181B] hover:bg-[#18181B]/95 px-4 py-2.5 text-xs font-bold text-white shadow-md spring-transition cursor-pointer"
          >
            <Package className="h-4 w-4" /> Add Craft Item
          </Link>
        </div>
      </div>

      {/* 1. FOUR STATS VITALS GRID */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
        
        {/* Earnings Card */}
        <div className="rounded-2xl border border-gray-150 bg-white p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest block">Total Revenue</span>
            <span className="text-2xl font-extrabold text-[#18181B] block tracking-tight">{totalEarnings} DH</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-[#18181B]">
            <DollarSign className="h-5 w-5 animate-pulse" />
          </div>
        </div>

        {/* Sold Count Card */}
        <div className="rounded-2xl border border-gray-150 bg-white p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest block">Items Sold</span>
            <span className="text-2xl font-extrabold text-[#18181B] block tracking-tight">{totalItemsSold} pieces</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-[#18181B]">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        {/* Active Orders Card */}
        <div className="rounded-2xl border border-gray-150 bg-white p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest block">Active Orders</span>
            <span className="text-2xl font-extrabold text-[#18181B] block tracking-tight">{activeOrdersCount} packages</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-[#18181B]">
            <ShoppingBag className="h-5 w-5 animate-bounce" />
          </div>
        </div>

        {/* Products Count Card */}
        <div className="rounded-2xl border border-gray-150 bg-white p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest block">Active Catalog</span>
            <span className="text-2xl font-extrabold text-[#18181B] block tracking-tight">{products.length} listed</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-[#18181B]">
            <Package className="h-5 w-5" />
          </div>
        </div>

      </section>

      {/* 2. SPLIT LAYOUT FOR ORDERS AND VITALS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT 8 COLS: Recent Orders Received */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[rgba(232,227,216,0.45)] p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between select-none">
            <h2 className="text-lg font-bold text-[#18181B]" >
              Recent Orders
            </h2>
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#18181B] hover:text-[#18181B] transition-colors"
            >
              Fulfill Orders <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-16 bg-[#F5F0E8]/50 rounded-2xl border border-dashed border-[rgba(232,227,216,0.8)] select-none">
              <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="font-bold text-sm text-[#18181B]">No Orders Yet</h3>
              <p className="text-xs text-[#71717A] mt-1 max-w-xs mx-auto">
                Once customers purchase your listed crafts, their delivery requests will populate here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto select-none">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[rgba(232,227,216,0.45)] text-[#71717A] font-extrabold uppercase tracking-wider text-[9px]">
                    <th className="pb-3">Order ID</th>
                    <th className="pb-3">Placed Date</th>
                    <th className="pb-3 text-center">Items</th>
                    <th className="pb-3">Fulfillment</th>
                    <th className="pb-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.slice(0, 5).map((order) => {
                    const statusColors = 
                      order.status === 'delivered'
                        ? 'bg-emerald-50 text-[#10B981]'
                        : order.status === 'shipped'
                          ? 'bg-indigo-50 text-[#18181B]'
                          : 'bg-amber-50 text-[#CA8A04]';

                    return (
                      <tr key={order.id} className="group hover:bg-[#F5F0E8]/50">
                        <td className="py-3.5 font-mono font-bold text-[#18181B]">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="py-3.5 text-[#71717A] font-semibold">
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 text-center font-bold text-[#18181B]">
                          {order.itemsCount}
                        </td>
                        <td className="py-3.5">
                          <span className={`inline-block rounded-lg px-2 py-0.5 font-bold text-[9px] uppercase tracking-wide ${statusColors}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-extrabold text-[#18181B]">
                          {order.totalPrice} DH
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RIGHT 4 COLS: Low Stock Alerts & Quick Tips */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Low inventory alerts panel */}
          <div className="bg-white rounded-3xl border border-[rgba(232,227,216,0.45)] p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-[#18181B] flex items-center gap-1.5 select-none" >
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Stock Alerts
            </h2>

            {lowStockProducts.length === 0 ? (
              <div className="rounded-2xl bg-emerald-50/30 border border-emerald-100 p-4 text-[10px] text-[#71717A] font-semibold select-none leading-relaxed">
                <span className="flex items-center gap-1.5 text-[#10B981] font-extrabold uppercase">
                  <CheckCircle2 className="h-4.5 w-4.5" /> Inventory Healthy
                </span>
                <p className="mt-1">
                  All listed products in your Medina catalog are well stocked. Excellent work monitoring supply pipelines!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className="rounded-xl border border-red-100 bg-red-50/20 p-3 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <h4 className="font-bold text-gray-900 truncate">{p.name}</h4>
                      <span className="text-[10px] text-red-500 font-bold">Only {p.stock} remaining</span>
                    </div>
                    <Link
                      href={`/dashboard/products`}
                      className="rounded-lg bg-[#18181B] hover:bg-[#18181B] px-2.5 py-1.5 text-[9px] font-bold text-white tracking-wide shrink-0 transition-colors shadow-sm"
                    >
                      Update
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Independent Artisan Tips */}
          <div className="bg-indigo-50/30 border border-indigo-100 rounded-3xl p-6 space-y-3 select-none">
            <h3 className="font-bold text-sm text-[#18181B]" >
              Artisan Academy
            </h3>
            <p className="text-[10px] text-[#71717A] leading-relaxed font-light">
              Fulfilling orders promptly builds customer loyalty. Mark items as "Shipped" and add tracking numbers once you deliver them to courier counters inside Essaouira.
            </p>
            <div className="flex gap-4 text-[10px] font-bold text-[#18181B] pt-1">
              <Link href="/dashboard/products" className="hover:text-[#18181B] border-b border-[#18181B] hover:border-[#18181B] pb-0.5">My Products</Link>
              <Link href="/dashboard/store" className="hover:text-[#18181B] border-b border-[#18181B] hover:border-[#18181B] pb-0.5">Edit Workshop</Link>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
