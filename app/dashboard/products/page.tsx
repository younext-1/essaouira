'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { useMyStore } from '@/hooks/useMyStore';
import { useSupabase } from '@/hooks/useSupabase';
import { 
  Package, Search, Plus, Edit2, Trash2, ArrowUpDown, 
  Loader2, AlertTriangle, Sparkles, Inbox, ShieldCheck 
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardProductsPage() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { store } = useMyStore(user?.id);
  const supabase = useSupabase();

  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // 1. Query products listed in this workshop
  const { data: products = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['merchant-products', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error: err } = await supabase
        .from('products')
        .select('*, category:categories(id, name, name_ar, name_fr, slug)')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });
      if (err) throw err;
      return data || [];
    },
    enabled: !!store?.id,
  });

  // 2. Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: err } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (err) throw err;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-products', store?.id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleteConfirmId(null);
    },
  });

  // Client-side quick filter
  const filteredProducts = products.filter((p) => {
    const catName = p.category?.name || '';
    return p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           catName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDeleteProduct = () => {
    if (!deleteConfirmId) return;
    deleteProductMutation.mutate(deleteConfirmId);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
        <div className="space-y-1">
          <span className="text-[10px] font-bold tracking-widest text-[#18181B] uppercase">Inventory Management</span>
          <h1 className="text-3xl font-extrabold text-[#18181B]" >
            Products Catalog
          </h1>
        </div>

        <Link
          href="/dashboard/products/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#18181B] hover:bg-[#18181B]/95 px-4 py-2.5 text-xs font-bold text-white shadow-md spring-transition cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-[rgba(232,227,216,0.45)] shadow-sm overflow-hidden p-6 space-y-6">
        
        {/* Controls row: search bar */}
        <div className="flex flex-col sm:flex-row items-center gap-4 select-none">
          <div className="relative rounded-xl border border-gray-250 overflow-hidden focus-within:ring-1 focus-within:ring-[#18181B] focus-within:border-[#18181B] spring-transition flex-1 w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717A]">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search products by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white pl-12 pr-4 py-2.5 text-xs text-[#18181B] font-semibold focus:outline-none"
            />
          </div>
          <span className="text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest shrink-0">
            {filteredProducts.length} Items Listed
          </span>
        </div>

        {/* Empty Catalog alert */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 px-4 bg-[#F5F0E8]/50 rounded-2xl border border-dashed border-[rgba(232,227,216,0.8)] select-none">
            <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-bold text-sm text-[#18181B]" >No Products Found</h3>
            <p className="text-xs text-[#71717A] mt-1 max-w-sm mx-auto font-light leading-relaxed">
              {searchQuery ? "No products matching your search query are currently listed." : "You haven't listed any artisan crafts yet. Click 'Add Product' above to begin."}
            </p>
          </div>
        ) : (
          /* Products listings grid table */
          <div className="overflow-x-auto select-none">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-150 text-[#71717A] font-extrabold uppercase tracking-wider text-[9px]">
                  <th className="pb-3 pl-2">Product Details</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Stock Inventory</th>
                  <th className="pb-3">Listed Date</th>
                  <th className="pb-3 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProducts.map((p) => {
                  const isLowStock = p.stock < 5;
                  const formattedPrice = Number(p.price).toFixed(0);

                  return (
                    <tr key={p.id} className="group hover:bg-[#F5F0E8]/50 transition-colors">
                      
                      {/* Product details thumbnail & name */}
                      <td className="py-4 pl-2 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg overflow-hidden border border-[rgba(232,227,216,0.45)] bg-[#F5F0E8] shrink-0 relative">
                          <img 
                            src={p.image_url || '/placeholder.jpg'} 
                            alt={p.name} 
                            className="h-full w-full object-cover" 
                          />
                        </div>
                        <div className="min-w-0 pr-2">
                          <h4 className="font-extrabold text-xs text-[#18181B] truncate max-w-[200px]" >
                            {p.name}
                          </h4>
                          <span className="text-[9.5px] font-mono text-[#71717A] tracking-wider">#{p.id.slice(0, 8)}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4">
                        <span className="rounded bg-indigo-50 px-2 py-0.5 text-[8.5px] font-bold text-[#18181B] uppercase">
                          {p.category?.name || '—'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-4 font-bold text-gray-900">
                        {formattedPrice} DH
                      </td>

                      {/* Stock level */}
                      <td className="py-4">
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-red-500 uppercase">
                            <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                            {p.stock} Left (Low)
                          </span>
                        ) : (
                          <span className="font-bold text-[#71717A]">{p.stock} units</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-4 text-[#71717A] font-semibold">
                        {new Date(p.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Controls */}
                      <td className="py-4 text-right pr-2">
                        <div className="flex items-center justify-end gap-2.5">
                          <Link
                            href={`/dashboard/products/${p.id}/edit`}
                            className="h-7 w-7 flex items-center justify-center rounded-lg border border-[rgba(232,227,216,0.8)] text-[#71717A] hover:text-[#18181B] hover:bg-indigo-50 hover:border-indigo-100 spring-transition"
                            aria-label={`Edit ${p.name}`}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(p.id)}
                            className="h-7 w-7 flex items-center justify-center rounded-lg border border-[rgba(232,227,216,0.8)] text-[#71717A] hover:text-red-500 hover:bg-red-50 hover:border-red-100 spring-transition cursor-pointer"
                            aria-label={`Delete ${p.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Delete Confirmation Alert Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18181B]/60 backdrop-blur-sm animate-fade-in select-none">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-[rgba(232,227,216,0.45)] p-6 shadow-2xl animate-scale-up text-center">
            <Trash2 className="mx-auto h-10 w-10 text-red-500 mb-4 animate-bounce" />
            <h4 className="font-bold text-lg text-[#18181B]" >Delete Craft Listing?</h4>
            <p className="mt-2 text-xs leading-relaxed text-[#71717A] font-light">
              Are you sure you want to permanently delete this product from your public catalog workshop? This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl border border-[rgba(232,227,216,0.8)] px-4 py-2 text-xs font-bold text-[#71717A] hover:bg-[#F5F0E8] spring-transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProduct}
                disabled={deleteProductMutation.isPending}
                className="rounded-xl bg-red-500 px-5 py-2 text-xs font-bold text-white hover:bg-red-600 spring-transition disabled:opacity-50 cursor-pointer"
              >
                {deleteProductMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
