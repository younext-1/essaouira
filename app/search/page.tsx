'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import { Compass, Loader2, SlidersHorizontal, Search, Trash2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = [
  'Artisanal Wood',
  'Cosmetics & Oils',
  'Surf Gear',
  'Leather Goods',
  'Moroccan Rugs',
  'Pottery & Ceramic',
];

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  // 1. Dynamic States
  const [searchInput, setSearchInput] = useState(query);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category') || null);
  const [priceMax, setPriceMax] = useState<number>(2000);
  const [sortBy, setSortBy] = useState<string>('newest');

  // 2. Fetch products using React Query hook
  const { data: products = [], isLoading, error } = useProducts({
    search: query,
    category: selectedCategory,
  });

  // 3. Filter and sort locally
  const filteredProducts = products
    .filter((p: any) => {
      const price = Number(p.price) || 0;
      return price <= priceMax;
    })
    .sort((a: any, b: any) => {
      if (sortBy === 'price-asc') return (Number(a.price) || 0) - (Number(b.price) || 0);
      if (sortBy === 'price-desc') return (Number(b.price) || 0) - (Number(a.price) || 0);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchInput.trim()) params.set('q', searchInput.trim());
    if (selectedCategory) params.set('category', selectedCategory);
    router.push(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setPriceMax(2000);
    setSearchInput('');
    router.push('/search');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20" >

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        
        {/* Results title summary */}
        <div className="border-b border-gray-150 pb-5 mb-8 select-none">
          <span className="text-[10px] font-bold tracking-widest text-[#18181B] uppercase">Artisan Engine</span>
          <h1 className="text-3xl font-extrabold text-[#18181B] mt-1" >
            {query ? `Search results for "${query}"` : 'Explore the Workshop Collections'}
          </h1>
          <p className="text-xs text-[#71717A] mt-1">
            Browse through items handcrafted by verified Moroccan master artisans.
          </p>
        </div>

        {/* Two-Column Search Portal Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT 3 COLS: Sidebar Filters Panel */}
          <div className="lg:col-span-3 rounded-2xl border border-[rgba(232,227,216,0.45)] bg-white p-5 shadow-sm space-y-6 md:sticky md:top-28 select-none">
            
            {/* Filter Title Header */}
            <div className="flex items-center justify-between border-b border-[rgba(232,227,216,0.45)] pb-3">
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#18181B] uppercase tracking-wider">
                <SlidersHorizontal className="h-4 w-4 text-[#18181B]" />
                Filters
              </span>
              <button 
                onClick={clearFilters}
                className="text-[10px] font-bold text-[#71717A] hover:text-red-500 transition-colors flex items-center gap-0.5 cursor-pointer"
              >
                <Trash2 className="h-3 w-3" /> Clear
              </button>
            </div>

            {/* Keyword Search Input Box inside sidebar */}
            <form onSubmit={handleSearchSubmit} className="space-y-1.5">
              <label className="block text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest">
                Keyword Query
              </label>
              <div className="relative rounded-xl border border-[rgba(232,227,216,0.8)] overflow-hidden focus-within:ring-1 focus-within:ring-[#18181B] focus-within:border-[#18181B] spring-transition">
                <input
                  type="text"
                  placeholder="e.g. Thuya, Argan..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-white pl-4 pr-10 py-2.5 text-xs text-[#18181B] focus:outline-none"
                />
                <button type="submit" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#18181B] cursor-pointer">
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </form>

            {/* Categories select options list */}
            <div className="space-y-2.5">
              <span className="block text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest">
                Specialty Category
              </span>
              <div className="space-y-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold spring-transition border text-left cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-indigo-50/50 border-[#18181B] text-[#18181B]'
                        : 'bg-white hover:bg-[#F5F0E8] border-[rgba(232,227,216,0.8)] text-[#71717A]'
                    }`}
                  >
                    <span>{cat}</span>
                    {selectedCategory === cat && <span className="text-[10px] font-extrabold">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Max slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest">
                <span>Max Price Limit</span>
                <span className="text-gray-900 font-bold">{priceMax} DH</span>
              </div>
              <input
                type="range"
                min="0"
                max="5000"
                step="50"
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#18181B]"
              />
              <div className="flex justify-between text-[9px] text-[#71717A] font-bold">
                <span>0 DH</span>
                <span>5000 DH</span>
              </div>
            </div>

            {/* Sorter Selector */}
            <div className="space-y-2">
              <span className="block text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest">
                Sort Options
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-xl border border-gray-250 bg-white px-3 py-2.5 text-xs font-bold text-[#18181B] focus:outline-none"
              >
                <option value="newest">Newest Additions</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>

          </div>

          {/* RIGHT 9 COLS: Results Listing Grid */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* Header bar */}
            <div className="flex items-center justify-between border-b border-[rgba(232,227,216,0.45)] pb-3 select-none">
              <span className="text-xs font-extrabold text-[#71717A] uppercase tracking-wider">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'Match' : 'Matches'} Found
              </span>
            </div>

            {/* Loading spinner */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-[rgba(232,227,216,0.45)] h-96 animate-pulse p-4 flex flex-col justify-between">
                    <div className="aspect-square bg-gray-200 rounded-xl mb-4" />
                    <div className="space-y-2">
                      <div className="h-4 w-2/3 bg-gray-200 rounded" />
                      <div className="h-3 w-1/3 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error Callout */}
            {error && !isLoading && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-8 text-center max-w-lg mx-auto shadow-sm select-none">
                <h3 className="font-bold text-lg mb-2" >Search Error</h3>
                <p className="text-xs leading-normal">{error instanceof Error ? error.message : 'Failed to query database matches.'}</p>
              </div>
            )}

            {/* Empty Search State */}
            {!isLoading && !error && filteredProducts.length === 0 && (
              <div className="text-center py-20 px-4 bg-white border border-[rgba(232,227,216,0.45)] rounded-3xl max-w-md mx-auto shadow-sm select-none">
                <Compass className="w-12 h-12 text-[#71717A] mx-auto mb-4 animate-bounce" />
                <h3 className="font-bold text-lg text-[#18181B] mb-1" >No matches found</h3>
                <p className="text-xs text-[#71717A] mb-6 leading-relaxed font-light">
                  We couldn't find any premium products matching your filters. Try widening your price bar or resetting your categories selections.
                </p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#18181B] border-b border-[#18181B] pb-0.5 hover:text-[#18181B] hover:border-[#18181B] spring-transition cursor-pointer"
                >
                  Clear Filters <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Grid match displays */}
            {!isLoading && !error && filteredProducts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]" >
        <Loader2 className="h-10 w-10 animate-spin text-[#18181B]" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
