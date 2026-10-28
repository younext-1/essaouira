import { useQuery } from '@tanstack/react-query';
import { Product } from '@/types';
import { MOCK_PRODUCTS } from '@/lib/mock-data';

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
      // Simulate quick async load for snappy feel
      let results = [...MOCK_PRODUCTS];

      // 1. Filter by search term
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        results = results.filter((p) => {
          const matchName = p.name.toLowerCase().includes(q);
          const matchNameAr = (p.name_ar || '').toLowerCase().includes(q);
          const matchNameFr = (p.name_fr || '').toLowerCase().includes(q);
          const matchDesc = (p.description || '').toLowerCase().includes(q);
          const matchDescAr = (p.description_ar || '').toLowerCase().includes(q);
          const matchTags = (p.tags || []).some(t => t.toLowerCase().includes(q));
          const matchStore = (p.stores?.name || '').toLowerCase().includes(q);

          return matchName || matchNameAr || matchNameFr || matchDesc || matchDescAr || matchTags || matchStore;
        });
      }

      // 2. Filter by category
      if (category && category !== 'All') {
        const catLow = category.toLowerCase().trim();

        results = results.filter((p) => {
          const c = p.category;
          const catName = (c?.name || '').toLowerCase();
          const catNameAr = (c?.name_ar || '').toLowerCase();
          const catNameFr = (c?.name_fr || '').toLowerCase();
          const catSlug = (c?.slug || '').toLowerCase();
          const tags = (p.tags || []).map(t => t.toLowerCase());

          // Direct inclusion check
          if (
            catName.includes(catLow) ||
            catNameAr.includes(catLow) ||
            catNameFr.includes(catLow) ||
            catSlug.includes(catLow)
          ) {
            return true;
          }

          // Keyword semantic matching across alias naming
          if ((catLow.includes('wood') || catLow.includes('thuya') || catLow.includes('artisan')) &&
              (catName.includes('wood') || tags.includes('wood') || tags.includes('thuya'))) {
            return true;
          }
          if ((catLow.includes('oil') || catLow.includes('cosmetic') || catLow.includes('argan')) &&
              (catName.includes('oil') || tags.includes('argan') || tags.includes('cosmetics'))) {
            return true;
          }
          if ((catLow.includes('rug') || catLow.includes('carpet') || catLow.includes('tapestr')) &&
              (catName.includes('rug') || tags.includes('rug') || tags.includes('carpet'))) {
            return true;
          }
          if ((catLow.includes('surf') || catLow.includes('water') || catLow.includes('gear')) &&
              (catName.includes('surf') || tags.includes('surf') || tags.includes('kitesurf'))) {
            return true;
          }
          if (catLow.includes('leather') &&
              (catName.includes('leather') || tags.includes('leather'))) {
            return true;
          }
          if ((catLow.includes('culinary') || catLow.includes('cooking') || catLow.includes('spice') || catLow.includes('food')) &&
              (catName.includes('culinary') || tags.includes('culinary') || tags.includes('cooking class') || tags.includes('spices'))) {
            return true;
          }
          if ((catLow.includes('excursion') || catLow.includes('tour') || catLow.includes('camel')) &&
              (catName.includes('excursion') || tags.includes('tour') || tags.includes('camel'))) {
            return true;
          }
          if ((catLow.includes('pottery') || catLow.includes('ceramic')) &&
              (catName.includes('pottery') || tags.includes('pottery') || tags.includes('ceramic'))) {
            return true;
          }

          return false;
        });
      }

      return results;
    },
    // Instant initial data and cache
    staleTime: Infinity,
  });
}
