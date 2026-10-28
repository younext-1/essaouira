import { useState, useEffect } from 'react';
import { Store } from '@/types';
import { MOCK_STORES } from '@/lib/mock-data';

export function useStore(identifier: string | undefined) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!identifier) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const found = MOCK_STORES.find(
        s => s.id === identifier || s.slug === identifier
      ) || MOCK_STORES[0];

      if (found) {
        const formattedStore: Store = {
          id: found.id,
          owner_id: found.owner_id,
          name: found.name,
          slug: found.slug,
          description: found.description,
          logo_url: found.logo_url,
          banner_url: found.banner_url || null,
          category: found.category,
          location: found.location || 'Essaouira Medina',
          total_sales: found.total_sales || 0,
          rating: found.rating || 4.9,
          review_count: found.review_count || 120,
          created_at: found.created_at || new Date().toISOString(),
          product_count: found.products ? found.products.length : 3,
          owner_name: (found.profiles && found.profiles.full_name) ? found.profiles.full_name : 'Local Artisan',
        };
        setStore(formattedStore);
      } else {
        setStore(null);
      }
    } catch (err: any) {
      console.error(`Error loading store ${identifier}:`, err);
      setError(err.message || 'Failed to fetch store');
    } finally {
      setLoading(false);
    }
  }, [identifier]);

  return { store, loading, error };
}
