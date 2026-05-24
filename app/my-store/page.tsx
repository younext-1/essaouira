'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useMyStore } from '@/hooks/useMyStore';
import StoreForm from '@/components/StoreForm';
import StoreProductCard from '@/components/StoreProductCard';
import ProductFormModal from '@/components/ProductFormModal';
import { Product } from '@/types';
import { Edit2, Plus, AlertCircle, CheckCircle, Store, Trash2, Eye, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function MyStorePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Protect route
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [user, isLoaded, router]);

  const {
    store,
    products,
    loading,
    error,
    createStore,
    updateStore,
    addProduct,
    updateProduct,
    deleteProduct,
  } = useMyStore(user?.id);

  // Local UI States
  const [isEditingStore, setIsEditingStore] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Store update fields
  const [storeName, setStoreName] = useState('');
  const [storeDesc, setStoreDesc] = useState('');
  const [storeLogo, setStoreLogo] = useState('');
  const [storeCat, setStoreCat] = useState('');
  const [submittingStore, setSubmittingStore] = useState(false);

  // Prepopulate store values
  useEffect(() => {
    if (store) {
      setStoreName(store.name || '');
      setStoreDesc(store.description || '');
      setStoreLogo(store.logo_url || '');
      setStoreCat(store.category || '');
    }
  }, [store]);

  const triggerToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreateStore = async (data: { name: string; description: string; logo_url: string; category: string }) => {
    const generatedSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const finalSlug = generatedSlug || `store-${Date.now().toString(36)}`;
    const res = await createStore({
      ...data,
      slug: finalSlug,
      banner_url: '',
      location: 'Essaouira',
    });
    if (res.error) {
      triggerToast(res.error, 'error');
    } else {
      triggerToast('Artisan shop registered successfully!', 'success');
    }
    return res;
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      triggerToast('Store name cannot be empty!', 'error');
      return;
    }

    setSubmittingStore(true);
    const res = await updateStore({
      name: storeName,
      description: storeDesc,
      logo_url: storeLogo,
      category: storeCat,
    });

    if (res.error) {
      triggerToast(res.error, 'error');
    } else {
      triggerToast('Store details updated successfully!', 'success');
      setIsEditingStore(false);
    }
    setSubmittingStore(false);
  };

  const handleProductSubmit = async (data: Omit<Product, 'id' | 'store_id' | 'created_at'>) => {
    let res;
    if (editingProduct) {
      res = await updateProduct(editingProduct.id, data);
      if (res.error) {
        triggerToast(res.error, 'error');
      } else {
        triggerToast('Product listing updated successfully!', 'success');
      }
    } else {
      res = await addProduct(data);
      if (res.error) {
        triggerToast(res.error, 'error');
      } else {
        triggerToast('New product added to catalog!', 'success');
      }
    }
    return res;
  };

  const handleDeleteProduct = async () => {
    if (!deletingProductId) return;

    const res = await deleteProduct(deletingProductId);
    if (res.error) {
      triggerToast(res.error, 'error');
    } else {
      triggerToast('Product listing deleted successfully!', 'success');
    }
    setDeletingProductId(null);
  };

  if (!isLoaded || (isLoaded && !user) || loading) {
    return (
      <div className="w-full min-h-screen bg-[#FAFAF7] flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-[#CA8A04]" />
          <p className="mt-4 text-sm font-semibold text-[#71717A] uppercase tracking-wider animate-pulse">
            Loading Merchant Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#FAFAF7]">

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border bg-white p-4 shadow-xl animate-in slide-in-from-bottom duration-300 max-w-sm">
          {toast.type === 'success' ? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <CheckCircle className="h-5 w-5" />
            </div>
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-[#18181B]">
              {toast.type === 'success' ? 'Task Completed' : 'Task Failed'}
            </p>
            <p className="text-[11px] text-[#71717A] mt-0.5">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Overlay */}
      {deletingProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setDeletingProductId(null)}
            className="absolute inset-0 bg-[#18181B]/40 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md transform overflow-hidden rounded-3xl border border-[rgba(232,227,216,0.8)] bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-[#18181B]">
              Delete Catalog Listing?
            </h3>
            <p className="text-xs text-red-500 font-bold uppercase tracking-wider mt-0.5">
              هل أنت متأكد من حذف هذا المنتج؟
            </p>
            <p className="mt-3 text-sm text-[#71717A] leading-relaxed">
              This action is permanent and cannot be undone. The selected product will be permanently removed from your storefront and user searches.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeletingProductId(null)}
                className="rounded-xl border border-[rgba(232,227,216,0.8)] bg-white px-4 py-2 text-xs font-bold text-[#71717A]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700"
              >
                Delete Listing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Console Container */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        
        {/* CASE A: No Store Registered Yet */}
        {!store ? (
          <div className="py-8">
            <StoreForm onSubmit={handleCreateStore} />
          </div>
        ) : (
          /* CASE B: Store Exists */
          <div className="space-y-10 animate-in fade-in duration-300">
            
            {/* 1. Store Header Console Card */}
            <div className="rounded-3xl border border-[rgba(232,227,216,0.8)] bg-white p-8 shadow-sm">
              {!isEditingStore ? (
                // View Mode
                <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
                  <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                    {store.logo_url ? (
                      <img
                        src={store.logo_url}
                        alt={store.name}
                        className="h-24 w-24 rounded-2xl object-cover border border-[rgba(232,227,216,0.8)] bg-[#F5F0E8]"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EAA17C] to-[#CA8A04] font-display text-2xl font-bold text-white uppercase">
                        {store.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                        <h2 className="font-display text-2xl font-bold text-[#18181B]">
                          {store.name}
                        </h2>
                        {store.category && (
                          <span className="rounded-full bg-[#CA8A04]/10 px-3 py-1 text-[10px] font-bold text-[#CA8A04] uppercase tracking-wider">
                            {store.category}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-[#71717A] max-w-xl">
                        {store.description || 'No store description provided yet.'}
                      </p>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-wrap gap-2.5 shrink-0 mt-4 md:mt-0">
                    <Link
                      href={`/store/${store.slug || store.id}`}
                      className="flex items-center gap-1.5 rounded-xl border border-[rgba(232,227,216,0.8)] bg-white px-4 py-2.5 text-xs font-bold text-[#71717A] hover:border-[#CA8A04] hover:text-[#CA8A04]"
                    >
                      <Eye className="h-4 w-4" />
                      View Public Store
                    </Link>
                    <button
                      onClick={() => setIsEditingStore(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-[#CA8A04] bg-[#CA8A04]/5 px-4 py-2.5 text-xs font-bold text-[#CA8A04] hover:bg-[#CA8A04] hover:text-white"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit Details
                    </button>
                  </div>
                </div>
              ) : (
                // Edit Details Inline Mode
                <form onSubmit={handleUpdateStore} className="space-y-4">
                  <div className="border-b border-[#F5F0E8] pb-3">
                    <h3 className="font-display text-base font-bold text-[#18181B]">
                      Edit Store Details (تعديل تفاصيل المتجر)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#18181B]">
                        Store Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[rgba(232,227,216,0.8)] bg-[#F5F0E8] px-3.5 py-2.5 text-xs text-[#18181B]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#18181B]">
                        Category
                      </label>
                      <select
                        value={storeCat}
                        onChange={(e) => setStoreCat(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[rgba(232,227,216,0.8)] bg-[#F5F0E8] px-3.5 py-2.5 text-xs text-[#18181B]"
                      >
                        <option value="Argan & Cosmetics">Argan & Cosmetics</option>
                        <option value="Carpets & Rugs">Carpets & Rugs</option>
                        <option value="Handcrafted Pottery">Handcrafted Pottery</option>
                        <option value="Spices & Herbs">Spices & Herbs</option>
                        <option value="Leather & Bags">Leather & Bags</option>
                        <option value="Traditional Clothing">Traditional Clothing</option>
                        <option value="Wood & Thuya Crafts">Wood & Thuya Crafts</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#18181B]">
                      Logo Image URL
                    </label>
                    <input
                      type="url"
                      value={storeLogo}
                      onChange={(e) => setStoreLogo(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[rgba(232,227,216,0.8)] bg-[#F5F0E8] px-3.5 py-2.5 text-xs text-[#18181B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#18181B]">
                      Store Biography
                    </label>
                    <textarea
                      rows={3}
                      value={storeDesc}
                      onChange={(e) => setStoreDesc(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[rgba(232,227,216,0.8)] bg-[#F5F0E8] px-3.5 py-2.5 text-xs text-[#18181B]"
                    />
                  </div>

                  <div className="flex justify-end gap-2.5 border-t border-[#F5F0E8] pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditingStore(false)}
                      className="rounded-xl border border-[rgba(232,227,216,0.8)] bg-white px-4 py-2 text-xs font-bold text-[#71717A]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingStore}
                      className="rounded-xl bg-gradient-to-tr from-[#CA8A04] to-[#EAA17C] px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {submittingStore ? 'Saving... جاري الحفظ' : 'Save Details'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* 2. Product Catalog Console Grid */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[rgba(232,227,216,0.8)] pb-4 gap-3">
                <div>
                  <h3 className="font-display text-xl font-bold text-[#18181B]">
                    Product Inventory ({products.length})
                  </h3>
                  <p className="text-xs text-[#71717A] mt-0.5">أدر قائمة المنتجات المعروضة في متجرك الحرفي</p>
                </div>
                
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setIsProductModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-tr from-[#CA8A04] to-[#EAA17C] px-4 py-2.5 text-xs font-bold text-white shadow-md spring-transition hover:opacity-95"
                >
                  <Plus className="h-4 w-4" />
                  List New Product
                </button>
              </div>

              {/* Empty catalog warning */}
              {products.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[rgba(232,227,216,0.8)] bg-white p-12 text-center max-w-lg mx-auto shadow-sm">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#CA8A04]/10 text-[#CA8A04] mx-auto mb-4">
                    <Store className="h-7 w-7" />
                  </div>
                  <h4 className="font-display text-lg font-bold text-[#18181B]">
                    Your Store Catalog is Empty
                  </h4>
                  <p className="text-sm text-[#71717A] mt-2 leading-relaxed">
                    You haven't listed any artisanal crafts yet. Click the list button above to register your first authentic Essaouira product!
                  </p>
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setIsProductModalOpen(true);
                    }}
                    className="mt-6 inline-flex items-center gap-1 text-xs font-bold text-[#CA8A04]"
                  >
                    List your first item now
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                /* Listed Products Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((prod) => (
                    <StoreProductCard
                      key={prod.id}
                      product={prod}
                      isOwner={true}
                      onEdit={(p) => {
                        setEditingProduct(p);
                        setIsProductModalOpen(true);
                      }}
                      onDelete={(id) => setDeletingProductId(id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Product Create/Edit Modal */}
            <ProductFormModal
              isOpen={isProductModalOpen}
              onClose={() => {
                setIsProductModalOpen(false);
                setEditingProduct(null);
              }}
              product={editingProduct}
              onSubmit={handleProductSubmit}
            />

          </div>
        )}

      </main>
    </div>
  );
}
