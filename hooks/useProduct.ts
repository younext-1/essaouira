import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Product, ProductVariant } from '@/types';

export interface ProductDetails extends Product {
  variants?: ProductVariant[];
}

export function useProduct(id: string | undefined) {
  return useQuery<ProductDetails | null>({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) return null;

      // 1. Fetch product and join store details
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('*, stores(*), category:categories(id, name, name_ar, name_fr, slug)')
        .eq('id', id)
        .maybeSingle();

      if (prodError) {
        throw new Error(prodError.message);
      }

      if (!prodData) return null;

      // 2. Fetch product variants in parallel
      const { data: varData, error: varError } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', id);

      if (varError) {
        console.error('Error fetching variants:', varError.message);
      }

      return {
        ...(prodData as Product),
        variants: (varData as ProductVariant[]) || [],
      } as ProductDetails;
    },
    enabled: !!id,
  });
}
