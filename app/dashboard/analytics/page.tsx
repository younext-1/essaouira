'use client';

import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { useMyStore } from '@/hooks/useMyStore';
import { useSupabase } from '@/hooks/useSupabase';
import { 
  BarChart3, TrendingUp, DollarSign, ShoppingBag, 
  Loader2, Sparkles, Award, ShieldCheck, Percent 
} from 'lucide-react';

export default function DashboardAnalyticsPage() {
  const { user } = useUser();
  const { store } = useMyStore(user?.id);
  const supabase = useSupabase();

  // 1. Query order items sold belonging to products in this store
  const { data: salesItems = [], isLoading } = useQuery<any[]>({
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
            created_at
          ),
          products!inner (
            id,
            name,
            image_url,
            category:categories(id, name, slug)
          )
        `)
        .eq('products.store_id', store.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!store?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 select-none">
        <Loader2 className="h-8 w-8 animate-spin text-[#18181B]" />
      </div>
    );
  }

  // Calculate pricing matrices
  const totalEarnings = salesItems.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);
  const totalItemsSold = salesItems.reduce((acc, item) => acc + item.quantity, 0);

  // Group by unique orders
  const uniqueOrders = new Set(salesItems.map((item) => item.order_id));
  const totalOrders = uniqueOrders.size;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalEarnings / totalOrders) : 0;

  // 2. BUILD DAILY SALES (Past 7 Days) FOR CUSTOM SVG LINE CHART
  const dailyEarnings: { [key: string]: number } = {};
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Initialize last 7 days with zero
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = dayNames[d.getDay()];
    dailyEarnings[label] = 0;
  }

  salesItems.forEach((item) => {
    if (item.orders?.created_at) {
      const dayLabel = dayNames[new Date(item.orders.created_at).getDay()];
      if (dayLabel in dailyEarnings) {
        dailyEarnings[dayLabel] += Number(item.price) * item.quantity;
      }
    }
  });

  const chartData = Object.entries(dailyEarnings).map(([label, value]) => ({ label, value }));
  const maxVal = Math.max(...chartData.map((d) => d.value), 100);

  // Generate SVG Points coordinates for line chart (viewBox 0 0 500 200)
  const chartWidth = 500;
  const chartHeight = 150;
  const paddingX = 40;
  const paddingY = 20;

  const points = chartData.map((d, idx) => {
    const x = paddingX + (idx * (chartWidth - paddingX * 2)) / (chartData.length - 1);
    // invert Y since SVG coordinates start from top-left
    const y = chartHeight - paddingY - (d.value / maxVal) * (chartHeight - paddingY * 2);
    return { x, y, label: d.label, value: d.value };
  });

  const linePathD = points.reduce((acc, p, idx) => {
    return acc + `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y} `;
  }, '');

  // Dynamic area path under the spline
  const areaPathD = linePathD 
    ? `${linePathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
    : '';

  // 3. BUILD SALES VOLUME PER PRODUCT FOR BAR METER
  const productSalesMap: { [key: string]: number } = {};
  salesItems.forEach((item) => {
    if (item.products?.name) {
      productSalesMap[item.products.name] = (productSalesMap[item.products.name] || 0) + item.quantity;
    }
  });

  const productVolumeList = Object.entries(productSalesMap)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 4);

  const maxQty = Math.max(...productVolumeList.map((p) => p.qty), 1);

  return (
    <div className="space-y-8" >
      
      {/* Editorial Header */}
      <div className="border-b border-gray-150 pb-5 select-none space-y-1">
        <span className="text-[10px] font-bold tracking-widest text-[#18181B] uppercase">Sales Intelligence</span>
        <h1 className="text-3xl font-extrabold text-[#18181B]" >
          Business Analytics
        </h1>
      </div>

      {/* 1. KEY PERFORMANCE METRICS GRID */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none">
        
        {/* Earnings Card */}
        <div className="rounded-2xl border border-gray-150 bg-white p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest block">Gross Revenue</span>
            <span className="text-2xl font-extrabold text-[#18181B] block tracking-tight">{totalEarnings} DH</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-[#18181B]">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="rounded-2xl border border-gray-150 bg-white p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest block">Average Order Value</span>
            <span className="text-2xl font-extrabold text-[#18181B] block tracking-tight">{avgOrderValue} DH</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-[#18181B]">
            <Percent className="h-5 w-5" />
          </div>
        </div>

        {/* Fulfillments Rate */}
        <div className="rounded-2xl border border-gray-150 bg-white p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest block">Success Deliveries</span>
            <span className="text-2xl font-extrabold text-[#18181B] block tracking-tight">100.0% score</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-[#18181B]">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

      </section>

      {/* 2. CUSTOM SVG CHART BLOCKS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT 7 COLS: Custom spline line chart */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[rgba(232,227,216,0.45)] p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between select-none">
            <div className="space-y-0.5">
              <h2 className="text-lg font-bold text-[#18181B]" >
                Earnings Trend
              </h2>
              <span className="text-[10px] text-[#71717A] font-semibold">Weekly sales values plotted daily</span>
            </div>
            <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-[8px] font-extrabold text-[#18181B] uppercase tracking-wide">
              Live Feed
            </span>
          </div>

          {/* SVG Canvas Area */}
          <div className="w-full bg-[#F5F0E8]/50 rounded-2xl p-4 border border-[rgba(232,227,216,0.45)] flex items-center justify-center relative overflow-hidden">
            
            {totalEarnings === 0 ? (
              <div className="py-16 text-center select-none">
                <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <span className="text-xs font-bold text-[#71717A]">Waiting for first workshop purchase...</span>
              </div>
            ) : (
              <div className="w-full relative">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible select-none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#18181B" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#18181B" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid guide lines */}
                  {[0, 0.5, 1].map((r, i) => {
                    const y = chartHeight - paddingY - r * (chartHeight - paddingY * 2);
                    return (
                      <line 
                        key={i} 
                        x1={paddingX} 
                        y1={y} 
                        x2={chartWidth - paddingX} 
                        y2={y} 
                        stroke="#E5E7EB" 
                        strokeWidth="1" 
                        strokeDasharray="4 4" 
                      />
                    );
                  })}

                  {/* Line Gradient fill */}
                  {areaPathD && <path d={areaPathD} fill="url(#chartGradient)" />}

                  {/* Spline Curve Path */}
                  {linePathD && (
                    <path 
                      d={linePathD} 
                      fill="none" 
                      stroke="#18181B" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                  )}

                  {/* Custom Dot nodes and details badges */}
                  {points.map((p, idx) => (
                    <g key={idx} className="group cursor-pointer">
                      <circle 
                        cx={p.x} 
                        cy={p.y} 
                        r="4.5" 
                        fill="#FFFFFF" 
                        stroke="#18181B" 
                        strokeWidth="2.5" 
                      />
                      <circle 
                        cx={p.x} 
                        cy={p.y} 
                        r="9" 
                        fill="#18181B" 
                        className="opacity-0 hover:opacity-10 transition-opacity" 
                      />
                      
                      {/* Text value triggers */}
                      <text
                        x={p.x}
                        y={p.y - 12}
                        textAnchor="middle"
                        className="text-[8px] font-extrabold fill-[#18181B]"
                      >
                        {p.value > 0 ? `${p.value} DH` : ''}
                      </text>

                      {/* Day Label */}
                      <text
                        x={p.x}
                        y={chartHeight - 4}
                        textAnchor="middle"
                        className="text-[8px] font-extrabold fill-gray-400 uppercase"
                      >
                        {p.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            )}

          </div>
        </div>

        {/* RIGHT 5 COLS: Top product sold volume bars */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[rgba(232,227,216,0.45)] p-6 shadow-sm space-y-6">
          <div className="space-y-0.5 select-none">
            <h2 className="text-lg font-bold text-[#18181B]" >
              Top Sellers
            </h2>
            <span className="text-[10px] text-[#71717A] font-semibold">Highest velocity crafts listed</span>
          </div>

          {productVolumeList.length === 0 ? (
            <div className="text-center py-16 bg-[#F5F0E8]/50 rounded-2xl border border-dashed border-[rgba(232,227,216,0.8)] select-none">
              <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <span className="text-xs font-bold text-[#71717A]">Waiting for product purchases...</span>
            </div>
          ) : (
            <div className="space-y-5 select-none">
              {productVolumeList.map((p) => {
                const percent = Math.round((p.qty / maxQty) * 100);

                return (
                  <div key={p.name} className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <h4 className="font-extrabold text-gray-900 truncate max-w-[200px]">{p.name}</h4>
                      <span className="font-bold text-[#71717A] shrink-0">{p.qty} sold</span>
                    </div>

                    <div className="h-2 w-full bg-[#E8E3D8] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#18181B] rounded-full spring-transition"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Escrow guarantee disclaimer box */}
          <div className="bg-[#F5F0E8]/50 border border-gray-150 rounded-2xl p-4 text-[10px] text-[#71717A] font-semibold space-y-2 select-none leading-relaxed">
            <span className="flex items-center gap-1 text-[#18181B] font-bold">
              <Award className="h-4 w-4" /> Medina Artisan Guild
            </span>
            <p>
              Your metrics show organic community growth. Support local craft collectives by maintaining accurate stocks and prompt shipment updates.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
