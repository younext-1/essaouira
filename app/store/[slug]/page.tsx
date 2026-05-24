'use client';

import { use } from 'react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/hooks/useStore';
import ProductCard from '@/components/ProductCard';
import { 
  ArrowLeft, User, MapPin, Tag, SlidersHorizontal, Loader2, Sparkles, 
  Star, Package, QrCode, Printer, X, ChefHat, Utensils, Compass 
} from 'lucide-react';
import Link from 'next/link';
import WhatsAppButton from '@/components/ui/whatsapp-button';
import { StoreContext } from '@/lib/whatsapp/types';


interface StorePageProps {
  params: Promise<{ slug: string }>;
}

export default function StorePage({ params }: StorePageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  // Retrieve store info (automatically maps owner_name and supports slug lookups)
  const { store, loading: storeLoading, error: storeError } = useStore(slug);

  // Sorting, Filtering & Modals state
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'menu'>('grid');

  // Detect culinary/restaurant/cafe store type for responsive specialized layout rendering
  const isFoodCategory = ['food', 'kitchen', 'cooking', 'cuisine', 'restaurant', 'bakery', 'طبخ', 'مأكولات', 'مطابخ', 'حلويات', 'مقهى', 'cafe', 'culinary', 'طعام', 'مطبخ', 'أكل']
    .some(cat => store?.category?.toLowerCase().includes(cat) || false);

  // Automatically default layout to 'menu' if food-focused, otherwise 'grid'
  useEffect(() => {
    if (store?.category) {
      const isFood = ['food', 'kitchen', 'cooking', 'cuisine', 'restaurant', 'bakery', 'طبخ', 'مأكولات', 'مطابخ', 'حلويات', 'مقهى', 'cafe', 'culinary', 'طعام', 'مطبخ', 'أكل']
        .some(cat => store.category?.toLowerCase().includes(cat) || false);
      setLayoutMode(isFood ? 'menu' : 'grid');
    }
  }, [store]);

  // Fetch store products based on filters
  const { data: products = [], isLoading: productsLoading } = useQuery<any[]>({
    queryKey: ['store-products', store?.id, selectedCategory, sortBy],
    queryFn: async () => {
      if (!store?.id) return [];

      let query = supabase
        .from('products')
        .select('*, stores(name, slug), category:categories(id, name, name_ar, name_fr, slug)')
        .eq('store_id', store.id);

      const { data, error } = await query;
      if (error) throw error;

      // Filter by category name client-side (no direct category text column on products)
      let items = data || [];
      if (selectedCategory && selectedCategory !== 'All') {
        const sel = selectedCategory.toLowerCase();
        items = items.filter((p: any) => {
          const cat = p.category;
          if (!cat) return false;
          return (
            (cat.name || '').toLowerCase().includes(sel) ||
            (cat.name_ar || '').toLowerCase().includes(sel) ||
            (cat.name_fr || '').toLowerCase().includes(sel)
          );
        });
      }

      // Sort logic
      if (sortBy === 'price-asc') {
        items.sort((a: any, b: any) => (Number(a.price) || 0) - (Number(b.price) || 0));
      } else if (sortBy === 'price-desc') {
        items.sort((a: any, b: any) => (Number(b.price) || 0) - (Number(a.price) || 0));
      } else if (sortBy === 'name') {
        items.sort((a: any, b: any) => a.name.localeCompare(b.name));
      } else {
        items.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      return items;
    },
    enabled: !!store?.id,
  });

  if (storeLoading) {
    return (
      <div className="w-full min-h-screen bg-[#FAFAF7] flex flex-col" >
        <div className="flex-1 flex flex-col items-center justify-center py-20 select-none">
          <Loader2 className="h-10 w-10 animate-spin text-[#1C1917]" />
          <p className="mt-4 text-xs font-extrabold text-[#71717A] uppercase tracking-widest animate-pulse">
            Loading Store Catalog...
          </p>
        </div>
      </div>
    );
  }

  if (storeError || !store) {
    return (
      <div className="w-full min-h-screen bg-[#FAFAF7] flex flex-col" >
        <div className="mx-auto max-w-xl px-4 py-20 text-center select-none">
          <div className="rounded-3xl bg-red-50 border border-red-200 p-8 shadow-sm">
            <h3 className="font-bold text-lg text-red-800" >Artisan Shop Not Found</h3>
            <p className="text-xs text-red-600 mt-2">
              {storeError || 'The requested local artisan shop does not exist or has been removed.'}
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#1C1917] hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get distinct categories in this store's catalog (category is a joined object)
  const storeCategories = ['All', ...Array.from(new Set(
    products.map((p: any) => p.category?.name).filter(Boolean)
  ))];

  const storeContext: StoreContext = {
    pageType: 'store',
    storeId: store.id,
    storeName: store.name,
    storeCategory: store.category || 'General Store',
    storeLocation: store.location || 'Essaouira Medina',
    storeRating: store.rating || 5.0,
    totalReviews: store.review_count || 0,
    totalProducts: products.length,
  };


  return (
    <div className="w-full min-h-screen bg-[#FAFAF7]" >

      {/* Decorative Store Banner Cover */}
      <div className="relative h-48 sm:h-64 w-full bg-[#FAFAF7] overflow-hidden select-none">
        <img
          src={store.banner_url || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200'}
          alt={`${store.name} Banner`}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-7xl w-full px-4 sm:px-6 lg:px-8 flex items-end justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white hover:text-[#18181B] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Marketplace
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-16 pb-20 relative z-10">
        
        {/* Store Profile Showcase Header */}
        <div className="rounded-3xl border border-[rgba(232,227,216,0.45)] bg-white p-6 sm:p-8 shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            <div className="flex flex-col md:flex-row items-center md:items-start gap-5 text-center md:text-left">
              {/* Logo block */}
              <div className="h-24 w-24 rounded-2xl overflow-hidden border-4 border-white bg-white shadow-md relative z-10 shrink-0">
                <img
                  src={store.logo_url || 'https://images.unsplash.com/photo-1546213290-e1b492ab3eee?w=300'}
                  alt={store.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <h1 className="text-2xl font-extrabold text-[#18181B] sm:text-3xl" >
                    {store.name}
                  </h1>
                  {store.category && (
                    <span className="rounded-lg bg-[#18181B]/10 px-2.5 py-1 text-[9px] font-bold text-[#18181B] uppercase tracking-wide flex items-center gap-1 select-none">
                      {isFoodCategory ? <ChefHat className="h-3 w-3" /> : <Compass className="h-3 w-3" />}
                      {store.category}
                    </span>
                  )}
                </div>

                <p className="mt-2 text-xs leading-relaxed text-[#71717A] max-w-xl">
                  {store.description || 'Welcome to our workshop. We list only original, locally crafted goods from Essaouira.'}
                </p>

                {/* Artisan Owner Name and meta details row */}
                <div className="mt-4 flex flex-wrap justify-center md:justify-start items-center gap-4 text-xs font-semibold text-[#71717A]">
                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-[#18181B]" />
                    <span>Owner / Artisan: <strong className="text-[#18181B]">{store.owner_name}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-[#18181B]" />
                    <span>{store.location || 'Essaouira Medina'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Metrics & QR Action Card Column */}
            <div className="w-full md:w-auto flex flex-col sm:flex-row md:flex-col items-center md:items-end gap-4 border-t md:border-t-0 md:border-l border-[rgba(232,227,216,0.45)] pt-4 md:pt-0 md:pl-8">
              
              {/* QR Code Action */}
              <button
                onClick={() => setIsQrModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[#FAFAF7] hover:bg-[#F5F0E8] px-5 py-3 text-xs font-extrabold text-[#1C1917] spring-transition hover:scale-105 active:scale-95 cursor-pointer shadow-sm select-none border border-warm-border"
              >
                <QrCode className="h-4 w-4" />
                {isFoodCategory ? 'Table QR Digital Menu' : 'Print Boutique QR'}
              </button>

              {/* WhatsApp Contact Action */}
              <div className="w-full sm:w-auto">
                <WhatsAppButton 
                  context={storeContext} 
                  variant="inline" 
                  size="md" 
                />
              </div>


              <div className="flex items-center gap-4 select-none mt-2 sm:mt-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAFAF7] text-[#CA8A04] border border-warm-border">
                    <Star className="h-4.5 w-4.5 fill-current" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#18181B]">
                      {store.rating ? store.rating.toFixed(1) : '5.0'}
                    </span>
                    <span className="text-[9px] text-[#71717A] font-semibold uppercase">
                      {store.review_count || 0} reviews
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-[#10B981]">
                    <Package className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#18181B]">
                      {store.total_sales || 0} Sales
                    </span>
                    <span className="text-[9px] text-[#71717A] font-semibold uppercase">
                      Vetted Shop
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Catalog / Culinary Digital Menu Grid */}
        <div className="mt-12 space-y-6">
          
          {/* Filters controls Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-150 pb-4 gap-4 select-none">
            <div>
              <span className="text-[10px] font-bold text-[#18181B] uppercase tracking-widest">
                {layoutMode === 'menu' ? 'Menu list / القائمة الرقمية' : 'Catalog Products'}
              </span>
              <h2 className="text-xl font-bold text-[#18181B] mt-0.5" >
                {layoutMode === 'menu' ? 'Detailed Menu Card / لائحة مصورة' : "Artisan's Catalog Collection"}
              </h2>
            </div>

            {/* Layout switch segment & Sorter Dropdown */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-[#71717A]">
              
              {/* Segmented Layout Mode Switcher */}
              <div className="flex rounded-xl bg-[#E8E3D8] p-1 border border-gray-250 select-none">
                <button
                  type="button"
                  onClick={() => setLayoutMode('grid')}
                  className={`rounded-lg px-3 py-1.5 spring-transition text-[9px] uppercase tracking-wider font-extrabold flex items-center gap-1.5 cursor-pointer ${
                    layoutMode === 'grid'
                      ? 'bg-white text-[#18181B] shadow-sm'
                      : 'text-[#71717A] hover:text-[#71717A]'
                  }`}
                >
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('menu')}
                  className={`rounded-lg px-3 py-1.5 spring-transition text-[9px] uppercase tracking-wider font-extrabold flex items-center gap-1.5 cursor-pointer ${
                    layoutMode === 'menu'
                      ? 'bg-white text-[#18181B] shadow-sm'
                      : 'text-[#71717A] hover:text-[#71717A]'
                  }`}
                >
                  Menu / List
                </button>
              </div>

              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#18181B]" />
                <span>Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-xl border border-gray-250 bg-white px-3 py-2 text-xs font-bold text-[#18181B] focus:outline-none focus:ring-1 focus:ring-[#18181B]"
                >
                  <option value="newest">Newest Listed</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name">Alphabetical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Scrolling categories selector tags */}
          {storeCategories.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 select-none shrink-0 no-scrollbar">
              {storeCategories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold spring-transition border shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#18181B] text-white border-[#18181B] shadow-sm'
                        : 'bg-white hover:bg-[#F5F0E8] text-[#71717A] border-[rgba(232,227,216,0.8)]'
                    }`}
                  >
                    {isFoodCategory && cat === 'All' ? '🍽️ Full Menu' : cat}
                  </button>
                );
              })}
            </div>
          )}

          {/* Skeletons load catalog */}
          {productsLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-[rgba(232,227,216,0.45)] aspect-square flex flex-col justify-between overflow-hidden animate-pulse p-4">
                  <div className="aspect-square bg-gray-200 rounded-xl mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 w-2/3 bg-gray-200 rounded" />
                    <div className="h-3 w-1/3 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty catalog alert */}
          {!productsLoading && products.length === 0 && (
            <div className="text-center py-16 px-4 bg-white border border-[rgba(232,227,216,0.45)] rounded-3xl max-w-md mx-auto shadow-sm select-none">
              <Tag className="w-10 h-10 text-[#71717A] mx-auto mb-3" />
              <h4 className="font-bold text-base text-[#18181B]" >No Catalog Listings</h4>
              <p className="text-xs text-[#71717A] mt-1.5 leading-relaxed">
                This store doesn't have any products matching the active filters right now.
              </p>
            </div>
          )}

          {/* Public Store Grid */}
          {!productsLoading && products.length > 0 && (
            layoutMode === 'menu' ? (
              /* PURE SQUARE OVERLAY MENU LIST LAYOUT (ONLY IMAGE WITH PRICE & TITLE OVERLAY) */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
                {products.map((prod) => (
                  <Link
                    key={prod.id}
                    href={`/product/${prod.id}`}
                    className="relative aspect-square rounded-3xl overflow-hidden shadow-md group border border-[rgba(232,227,216,0.45)]/50 cursor-pointer block"
                  >
                    {/* Image */}
                    <img
                      src={prod.images?.[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=450'}
                      alt={prod.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent transition-opacity duration-300 group-hover:from-black/90" />

                    {/* Info Overlay (Floating inside image at bottom) */}
                    <div className="absolute inset-x-0 bottom-0 p-5 space-y-1.5 select-none">
                      <div className="flex flex-col gap-0.5">
                        {prod.category?.name && (
                          <span className="text-[9px] font-extrabold text-[#CA8A04] uppercase tracking-widest block">
                            {prod.category.name}
                          </span>
                        )}
                        <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight leading-snug truncate" >
                          {prod.name}
                        </h3>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-sm font-extrabold text-white bg-white/10 backdrop-blur-md rounded-xl px-3 py-1 shadow-sm border border-white/10">
                          {prod.price} <span className="text-[10px] text-white/80">DH</span>
                        </span>
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#CA8A04] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
                          View ✦
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              /* STANDARD RETAIL CATALOG GRID LAYOUT */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-300">
                {products.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            )
          )}

        </div>

      </main>

      {/* QR Code Tent Card Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#18181B]/60 backdrop-blur-md backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-150 pb-4 select-none">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-[#18181B]" />
                <h3 className="font-extrabold text-base text-[#18181B]" >
                  {isFoodCategory ? 'Generate Table QR Menu' : 'Generate Boutique QR Code'}
                </h3>
              </div>
              <button 
                onClick={() => setIsQrModalOpen(false)}
                className="h-8 w-8 rounded-xl hover:bg-[#E8E3D8] flex items-center justify-center text-[#71717A] hover:text-[#71717A] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Inputs (Table number if food store) */}
            {isFoodCategory && (
              <div className="space-y-2 select-none">
                <label className="block text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest">
                  Table Number (Optional) / رقم الطاولة
                </label>
                <input
                  type="text"
                  placeholder="e.g. Table 5, Table 12"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(232,227,216,0.8)] bg-white px-4 py-2.5 text-sm text-[#18181B] focus:border-[#18181B] focus:outline-none"
                />
                <p className="text-[10px] text-[#71717A] leading-relaxed font-light">
                  Entering a table number will embed it in the QR link so when customers scan and order, the chef knows exactly which table placed it!
                </p>
              </div>
            )}

            {/* Table Tent Card Mockup frame to Print */}
            <div id="printable-qr-card" className="border-4 border-double border-[#CA8A04]/40 rounded-3xl p-6 bg-gradient-to-br from-[#FAFAF7] to-white text-center space-y-4 select-none relative shadow-inner">
              
              {/* Decorative corner borders */}
              <div className="absolute top-3 left-3 text-[#CA8A04]/50 font-display text-sm">✦</div>
              <div className="absolute top-3 right-3 text-[#CA8A04]/50 font-display text-sm">✦</div>
              <div className="absolute bottom-3 left-3 text-[#CA8A04]/50 font-display text-sm">✦</div>
              <div className="absolute bottom-3 right-3 text-[#CA8A04]/50 font-display text-sm">✦</div>

              {/* Branding header */}
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold tracking-widest text-[#1C1917] uppercase">
                  {isFoodCategory ? 'Essaouira Medina Food QR Card' : 'Essaouira Medina Boutique QR'}
                </span>
                <h4 className="text-lg font-extrabold text-[#1C1917]" >
                  {store.name}
                </h4>
                {tableNumber && (
                  <span className="inline-block rounded-full bg-[#FAFAF7] border border-warm-border text-[#1C1917] px-3 py-1 text-xs font-bold mt-1">
                    Table / طاولة: {tableNumber}
                  </span>
                )}
              </div>

              {/* Real Dynamic QR Image using public free server API */}
              <div className="mx-auto h-44 w-44 rounded-2xl border border-warm-border bg-white p-3 flex items-center justify-center shadow-md">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                    typeof window !== 'undefined' 
                      ? `${window.location.origin}/store/${slug}${tableNumber ? `?table=${tableNumber}` : ''}`
                      : `https://essaouira.tech/store/${slug}`
                  )}`}
                  alt="Store QR Code"
                  className="h-full w-full object-contain"
                />
              </div>

              {/* Instructions */}
              <div className="space-y-1">
                <span className="block text-xs font-bold text-gray-700">
                  {isFoodCategory ? 'Scan to View Digital Menu & Order' : 'Scan to Visit Our Medina Boutique'}
                </span>
                <span className="block text-[9px] font-extrabold text-[#71717A] uppercase tracking-widest">
                  {isFoodCategory ? 'مسح لمشاهدة المنيو والطلب مباشرة' : 'مسح لزيارة متجرنا الرقمي ومواصفات المعرض'}
                </span>
              </div>

              {/* Footer verification */}
              <div className="pt-2 border-t border-warm-border flex items-center justify-center gap-1.5 text-[8.5px] font-bold text-[#71717A] uppercase tracking-wider">
                <Sparkles className="h-3 w-3 text-[#1C1917]" /> Mogador Smart Market Protection
              </div>
            </div>

            {/* Print Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const printContent = document.getElementById('printable-qr-card');
                  const WinPrint = window.open('', '', 'width=900,height=650');
                  if (WinPrint && printContent) {
                    WinPrint.document.write(`
                      <html>
                        <head>
                          <title>Print QR Card - ${store.name}</title>
                          <style>
                            body { 
                              display: flex; 
                              justify-content: center; 
                              align-items: center; 
                              height: 100vh; 
                              margin: 0; 
                              font-family: 'Outfit', sans-serif;
                              background: #f9fafb;
                            }
                            #printable-qr-card {
                              border: 6px double #ca8a04;
                              border-radius: 24px;
                              padding: 32px;
                              background: white;
                              text-align: center;
                              max-width: 350px;
                              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                              position: relative;
                            }
                            .text-indigo-300 { color: #ca8a04; }
                            h4 { font-size: 24px; margin: 8px 0; color: #18181B; font-family: 'Syne', sans-serif; }
                            .table-badge { background: #FAFAF7; color: #ca8a04; border: 1px solid #e8e3d8; padding: 6px 12px; border-radius: 9999px; font-weight: bold; font-size: 14px; display: inline-block; margin-top: 4px; }
                            .qr-frame { margin: 20px auto; border: 1px solid #e8e3d8; padding: 12px; border-radius: 16px; background: white; width: 200px; height: 200px; }
                            .qr-frame img { width: 100%; height: 100%; object-fit: contain; }
                            .label-main { font-weight: bold; font-size: 14px; color: #374151; display: block; }
                            .label-sub { font-size: 10px; color: #9ca3af; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 800; display: block; margin-top: 2px; }
                            .footer { border-top: 1px solid #f3f4f6; margin-top: 16px; padding-top: 12px; font-size: 10px; color: #9ca3af; font-weight: bold; text-transform: uppercase; }
                          </style>
                        </head>
                        <body>
                          <div id="printable-qr-card">
                            <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.1em; color: #ca8a04; text-transform: uppercase;">
                              ${isFoodCategory ? 'Mogador Medina Food QR Card' : 'Essaouira Medina Boutique QR'}
                            </div>
                            <h4>${store.name}</h4>
                            ${tableNumber ? `<div class="table-badge">Table / طاولة: ${tableNumber}</div>` : ''}
                            <div class="qr-frame">
                              <img src="${printContent.querySelector('img')?.src}" />
                            </div>
                            <span class="label-main">
                              ${isFoodCategory ? 'Scan to View Digital Menu & Order' : 'Scan to Visit Our Medina Boutique'}
                            </span>
                            <span class="label-sub">
                              ${isFoodCategory ? 'مسح لمشاهدة المنيو والطلب مباشرة' : 'مسح لزيارة متجرنا الرقمي ومواصفات المعرض'}
                            </span>
                            <div class="footer">✦ Mogador Smart Market Protection ✦</div>
                          </div>
                          <script>
                            window.onload = function() {
                              window.print();
                              setTimeout(function() { window.close(); }, 500);
                            };
                          </script>
                        </body>
                      </html>
                    `);
                    WinPrint.document.close();
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#1C1917] hover:bg-[#CA8A04] text-white py-3 text-xs font-bold shadow-md cursor-pointer select-none"
              >
                <Printer className="h-4 w-4" /> Print QR Card
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
