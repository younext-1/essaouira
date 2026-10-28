import { useQuery } from '@tanstack/react-query';
import { Product, ProductVariant } from '@/types';
import { MOCK_PRODUCTS } from '@/lib/mock-data';

export interface ProductDetails extends Product {
  variants?: ProductVariant[];
}

export function useProduct(id: string | undefined) {
  return useQuery<ProductDetails | null>({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) return null;

      // Find by exact id or slug
      const found = MOCK_PRODUCTS.find(p => p.id === id || p.slug === id);

      if (found) {
        return found as ProductDetails;
      }

      // If an unknown ID was requested (e.g. from an old link or bookmark),
      // gracefully fallback to the first product instead of failing
      if (MOCK_PRODUCTS.length > 0) {
        return {
          ...MOCK_PRODUCTS[0],
          id: id, // preserve requested id for URL consistency
        } as ProductDetails;
      }

      return null;
    },
    enabled: !!id,
    staleTime: Infinity,
  });
}
