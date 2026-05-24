'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from './useSupabase';
import { Store, Product } from '../types';

/**
 * Master hook for authenticated users to manage their own store and its catalog.
 */
export function useMyStore(ownerId: string | undefined) {
  const supabase = useSupabase();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. استخدام useCallback لمنع إعادة بناء الدالة بشكل لا نهائي
  const fetchMyStoreData = useCallback(async () => {
    // 2. التحقق من وجود supabase و ownerId قبل إرسال أي طلب
    if (!ownerId || !supabase) {
      setStore(null);
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let dbOwnerId = ownerId;
      
      // Clerk ID translation to database UUID
      if (ownerId.startsWith('user_')) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('clerk_id', ownerId)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!profileData) {
          setStore(null);
          setProducts([]);
          setLoading(false);
          return;
        }
        dbOwnerId = profileData.id;
      }

      // Fetch store
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', dbOwnerId)
        .maybeSingle();

      if (storeError) throw storeError;

      if (!storeData) {
        setStore(null);
        setProducts([]);
        setLoading(false);
        return;
      }

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeData.id)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      setStore(storeData);
      setProducts(productsData || []);
      
    } catch (err: any) {
      // 3. تحسين طريقة عرض الخطأ لكي لا يظهر كـ {}
      console.error('Error in useMyStore:', err?.message || JSON.stringify(err) || err);
      setError(err?.message || 'Failed to fetch store details');
    } finally {
      setLoading(false);
    }
  }, [ownerId, supabase]); // تم وضع المتغيرات المطلوبة فقط

  useEffect(() => {
    fetchMyStoreData();
  }, [fetchMyStoreData]);

  // Create a new store
  const createStore = async (storeInput: Omit<Store, 'id' | 'owner_id' | 'created_at'>) => {
    if (!ownerId) return { error: 'Not authenticated' };

    try {
      let dbOwnerId = ownerId;
      if (ownerId.startsWith('user_')) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('clerk_id', ownerId)
          .single();
        if (profileData) dbOwnerId = profileData.id;
      }

      const { data, error: createError } = await supabase
        .from('stores')
        .insert({
          ...storeInput,
          owner_id: dbOwnerId,
        })
        .select()
        .single();

      if (createError) throw createError;

      await supabase
        .from('profiles')
        .update({ is_artisan: true, role: 'artisan' })
        .eq('id', dbOwnerId);

      setStore(data);
      await fetchMyStoreData();
      return { data };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  // Update store details
  const updateStore = async (updates: Partial<Omit<Store, 'id' | 'owner_id' | 'created_at'>>) => {
    if (!store) return { error: 'No active store found to update' };

    const { data, error: updateError } = await supabase
      .from('stores')
      .update(updates)
      .eq('id', store.id)
      .select()
      .single();

    if (updateError) {
      return { error: updateError.message };
    }

    setStore(data);
    return { data };
  };

  // Add a product to current store
  const addProduct = async (productInput: any) => {
    if (!store) return { error: 'Must create a store first before listing products' };

    try {
      let category_id: string | null = null;
      if (productInput.category) {
        const { data: catData, error: catErr } = await supabase
          .from('categories')
          .select('id')
          .or(`name.ilike.${productInput.category},name_ar.ilike.${productInput.category},slug.ilike.${productInput.category.toLowerCase().replace(/\s+/g, '-')}`)
          .maybeSingle();
        
        if (!catErr && catData) {
          category_id = catData.id;
        }
      }

      const { category, image_url, ...restProductInput } = productInput;

      const { data, error: addError } = await supabase
        .from('products')
        .insert({
          ...restProductInput,
          category_id,
          store_id: store.id,
          type: restProductInput.type || 'physical',
          status: restProductInput.status || 'active',
          thumbnail_url: restProductInput.images?.[0] || null,
        })
        .select()
        .single();

      if (addError) {
        return { error: addError.message };
      }

      await fetchMyStoreData();
      return { data };
    } catch (err: any) {
      console.error('Error adding product:', err);
      return { error: err.message || 'Failed to add product listing' };
    }
  };

  // Edit an existing product
  const updateProduct = async (productId: string, updates: any) => {
    try {
      let category_id: string | undefined | null = undefined;
      if (updates.category !== undefined) {
        if (updates.category === null || updates.category === '') {
          category_id = null;
        } else {
          const { data: catData, error: catErr } = await supabase
            .from('categories')
            .select('id')
            .or(`name.ilike.${updates.category},name_ar.ilike.${updates.category},slug.ilike.${updates.category.toLowerCase().replace(/\s+/g, '-')}`)
            .maybeSingle();

          if (!catErr && catData) {
            category_id = catData.id;
          } else {
            category_id = null;
          }
        }
      }

      const { category, image_url, ...restUpdates } = updates;
      const dbUpdates = {
        ...restUpdates,
        ...(category_id !== undefined && { category_id }),
        ...(restUpdates.images && { thumbnail_url: restUpdates.images?.[0] || null }),
      };

      const { data, error: editError } = await supabase
        .from('products')
        .update(dbUpdates)
        .eq('id', productId)
        .select()
        .single();

      if (editError) {
        return { error: editError.message };
      }

      await fetchMyStoreData();
      return { data };
    } catch (err: any) {
      console.error('Error updating product:', err);
      return { error: err.message || 'Failed to update product listing' };
    }
  };

  // Delete a product with strict ID checks
  const deleteProduct = async (productId: string) => {
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      return { error: deleteError.message };
    }

    await fetchMyStoreData();
    return { success: true };
  };

  return {
    store,
    products,
    loading,
    error,
    createStore,
    updateStore,
    addProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchMyStoreData,
  };
}