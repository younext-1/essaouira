'use client';

import { useUser } from '@clerk/nextjs';
import { useMyStore } from '@/hooks/useMyStore';
import { useSupabase } from '@/hooks/useSupabase';
import ProductForm from '@/components/product/ProductForm';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewProductPage() {
  const { user } = useUser();
  const { store, loading } = useMyStore(user?.id);
  const supabase = useSupabase();

  // Unified callback to save the product and its variants to Supabase
  const handleProductSubmit = async (productPayload: any, variants: any[]) => {
    if (!store?.id) throw new Error('Workshop credentials not found.');

    // 1. Resolve category_id from the selected category name
    let category_id: string | null = null;
    if (productPayload.category) {
      const { data: catData } = await supabase
        .from('categories')
        .select('id')
        .or(`name.ilike.${productPayload.category},name_ar.ilike.${productPayload.category},slug.ilike.${productPayload.category.toLowerCase().replace(/\s+/g, '-')}`)        
        .maybeSingle();
      category_id = catData?.id || null;
    }

    // 2. Insert product record to Supabase products table
    const { data: product, error: productErr } = await supabase
      .from('products')
      .insert({
        name: productPayload.name,
        description: productPayload.description,
        price: productPayload.price,
        compare_at_price: productPayload.compare_price,
        category_id,
        stock: productPayload.stock,
        images: productPayload.images,
        thumbnail_url: productPayload.images?.[0] || null,
        type: 'physical',
        status: 'active',
        store_id: store.id,
      })
      .select()
      .single();

    if (productErr) throw productErr;

    // 2. Insert option variants by grouping flat variant inputs into structured arrays
    if (variants && variants.length > 0) {
      const grouped: Record<string, string[]> = {};
      variants.forEach((v) => {
        if (!grouped[v.name]) {
          grouped[v.name] = [];
        }
        if (v.value && !grouped[v.name].includes(v.value)) {
          grouped[v.name].push(v.value);
        }
      });

      const variantsPayload = Object.entries(grouped).map(([name, options]) => ({
        product_id: product.id,
        name,
        options,
        sku: `SKU-${product.id.slice(0, 8)}-${name.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      }));

      const { error: variantErr } = await supabase
        .from('product_variants')
        .insert(variantsPayload);

      if (variantErr) throw variantErr;
    }

    return product;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 select-none">
        <Loader2 className="h-8 w-8 animate-spin text-[#18181B]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Navigation & Header */}
      <div className="border-b border-gray-150 pb-5 select-none space-y-1">
        <Link
          href="/dashboard/products"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#71717A] hover:text-[#18181B] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Catalog
        </Link>
        
        <div className="pt-2">
          <span className="text-[10px] font-bold tracking-widest text-[#18181B] uppercase">Launch Item</span>
          <h1 className="text-3xl font-extrabold text-[#18181B] mt-0.5" >
            List New Product
          </h1>
        </div>
      </div>

      {/* Main product form wrapper */}
      <div className="max-w-5xl">
        <ProductForm onSubmit={handleProductSubmit} />
      </div>

    </div>
  );
}
