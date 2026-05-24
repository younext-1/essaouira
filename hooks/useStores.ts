'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Store } from '../types';

/**
 * Hook to query all stores from Supabase, filtering by category optionally.
 * Computes product counts dynamically by left-joining products.
 */
export function useStores(category?: string) {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStores() {
      setLoading(true);
      setError(null);

      // Select stores and left join products to compute length
      let query = supabase
        .from('stores')
        .select(`
          *,
          products (id)
        `);

      if (category && category !== 'All') {
        query = query.eq('category', category);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
      } else if (data) {
        const storesWithCount: Store[] = data.map((item: any) => ({
          id: item.id,
          owner_id: item.owner_id,
          name: item.name,
          slug: item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: item.description,
          logo_url: item.logo_url,
          banner_url: item.banner_url || null,
          category: item.category,
          location: item.location || 'Essaouira Medina',
          total_sales: item.total_sales || 0,
          rating: item.rating || 0,
          review_count: item.review_count || 0,
          created_at: item.created_at,
          product_count: item.products?.length || 0,
        }));
        setStores(storesWithCount);
      }
      setLoading(false);
    }

    fetchStores();
  }, [category]);

  return { stores, loading, error };
}
