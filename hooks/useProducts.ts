import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';

interface UseProductsOptions {
  category?: string | null;
  search?: string | null;
}

export function useProducts(options?: UseProductsOptions) {
  const category = options?.category;
  const search = options?.search;

  return useQuery<Product[]>({
    queryKey: ['products', category, search],
    queryFn: async () => {
      // Join category:categories since products no longer has a `category` text column (migration 013)
      let query = supabase
        .from('products')
        .select('*, stores(name, slug), category:categories(id, name, name_ar, name_fr, slug)');

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      // Sort by created_at desc (safe fallback if total_reviews column doesn't exist yet)
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      let results = (data as Product[]) || [];

      // Filter by category name client-side (no direct text column on products)
      if (category && category !== 'All') {
        const search_lower = category.toLowerCase();
        results = results.filter((p: any) => {
          const cat = p.category;
          if (!cat) return false;
          return (
            (cat.name || '').toLowerCase().includes(search_lower) ||
            (cat.name_ar || '').toLowerCase().includes(search_lower) ||
            (cat.name_fr || '').toLowerCase().includes(search_lower)
          );
        });
      }

      return results;
    },
  });
}
