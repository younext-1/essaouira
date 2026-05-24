import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Store } from '@/types';

export function useStore(identifier: string | undefined) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!identifier) {
      setLoading(false);
      return;
    }

    async function fetchStore() {
      try {
        setLoading(true);
        setError(null);

        // Detect if the identifier is a UUID or a URL slug
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier as string);

        const { data, error: fetchError } = await supabase
          .from('stores')
          .select('*, profiles(full_name), products(id)')
          .eq(isUuid ? 'id' : 'slug', identifier as string)
          .maybeSingle();

        if (fetchError) {
          throw fetchError;
        }

        if (data) {
          const formattedStore: Store = {
            id: data.id,
            owner_id: data.owner_id,
            name: data.name,
            slug: data.slug,
            description: data.description,
            logo_url: data.logo_url,
            banner_url: data.banner_url || null,
            category: data.category,
            location: data.location || 'Essaouira Medina',
            total_sales: data.total_sales || 0,
            rating: data.rating || 0,
            review_count: data.review_count || 0,
            created_at: data.created_at,
            product_count: data.products ? data.products.length : 0,
            owner_name: data.profiles ? data.profiles.full_name : 'Local Artisan',
          };
          setStore(formattedStore);
        } else {
          setStore(null);
        }
      } catch (err: any) {
        console.error(`Error fetching store ${identifier}:`, err);
        setError(err.message || 'Failed to fetch store');
      } finally {
        setLoading(false);
      }
    }

    fetchStore();
  }, [identifier]);

  return { store, loading, error };
}
