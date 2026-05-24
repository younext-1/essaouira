'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { useMyStore } from '@/hooks/useMyStore';
import { useSupabase } from '@/hooks/useSupabase';
import ProductForm from '@/components/product/ProductForm';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const { user } = useUser();
  const { store, loading: storeLoading } = useMyStore(user?.id);
  const supabase = useSupabase();

  // 1. Query the base product credentials and child variants together
  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ['merchant-edit-product', productId],
    queryFn: async () => {
      // Query product
      const { data: product, error: pErr } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (pErr) throw pErr;

      // Query its variants
      const { data: dbVariants, error: vErr } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId);

      if (vErr) throw vErr;

      // Translate from database array options (TEXT[]) to form-compatible flat variants format
      const formVariants: any[] = [];
      (dbVariants || []).forEach((v) => {
        if (v.options && Array.isArray(v.options)) {
          v.options.forEach((opt: string) => {
            formVariants.push({
              name: v.name,
              value: opt,
              price_modifier: 0,
              stock: 10,
            });
          });
        }
      });

      return {
        ...product,
        variants: formVariants,
      };
    },
    enabled: !!productId,
  });

  // 2. Submit changes to Supabase
  const handleProductSubmit = async (productPayload: any, variants: any[]) => {
    if (!store?.id) throw new Error('Workshop credentials not found.');

    // Resolve category_id from the selected category name
    let category_id: string | null = null;
    if (productPayload.category) {
      const { data: catData } = await supabase
        .from('categories')
        .select('id')
        .or(`name.ilike.${productPayload.category},slug.ilike.${productPayload.category.toLowerCase().replace(/\s+/g, '-')}`)
        .maybeSingle();
      category_id = catData?.id || null;
    }

    // Update base product fields
    const { error: productErr } = await supabase
      .from('products')
      .update({
        name: productPayload.name,
        description: productPayload.description,
        price: productPayload.price,
        compare_at_price: productPayload.compare_price,
        category_id,
        stock: productPayload.stock,
        images: productPayload.images,
        thumbnail_url: productPayload.images?.[0] || null,
      })
      .eq('id', productId)
      .eq('store_id', store.id);

    if (productErr) throw productErr;

    // Synchronize variants: drop older option records, populate new set cleanly
    const { error: dropErr } = await supabase
      .from('product_variants')
      .delete()
      .eq('product_id', productId);

    if (dropErr) throw dropErr;

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
        product_id: productId,
        name,
        options,
        sku: `SKU-${productId.slice(0, 8)}-${name.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      }));

      const { error: variantErr } = await supabase
        .from('product_variants')
        .insert(variantsPayload);

      if (variantErr) throw variantErr;
    }

    return { success: true };
  };

  const isLoading = storeLoading || productLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 select-none">
        <Loader2 className="h-8 w-8 animate-spin text-[#18181B]" />
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="text-center py-20 px-4 bg-white border border-[rgba(232,227,216,0.45)] rounded-3xl max-w-md mx-auto shadow-sm select-none">
        <h3 className="font-bold text-lg text-red-500">Listing Not Found</h3>
        <p className="text-xs text-[#71717A] mt-2">The product you are trying to edit does not exist or belongs to another merchant store.</p>
        <Link
          href="/dashboard/products"
          className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-[#18181B] px-5 py-2.5 text-xs font-bold text-white shadow-md"
        >
          Return to Catalog
        </Link>
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
          <span className="text-[10px] font-bold tracking-widest text-[#18181B] uppercase">Modify Item</span>
          <h1 className="text-3xl font-extrabold text-[#18181B] mt-0.5" >
            Edit Product
          </h1>
        </div>
      </div>

      {/* Main product form wrapper */}
      <div className="max-w-5xl">
        <ProductForm initialData={productData} onSubmit={handleProductSubmit} />
      </div>

    </div>
  );
}
