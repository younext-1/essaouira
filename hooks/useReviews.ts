import { useQuery } from '@tanstack/react-query';
import { Review } from '@/types';
import { useUser } from '@clerk/nextjs';
import { getMockReviewsForProduct } from '@/lib/mock-data';

interface UseReviewsOptions {
  productId: string;
  sortBy?: 'recent' | 'highest' | 'helpful';
  starFilter?: number | null;
  limit?: number;
}

export function useReviews({ productId, sortBy = 'recent', starFilter = null, limit = 10 }: UseReviewsOptions) {
  const { user } = useUser();
  const userId = user?.id;

  return useQuery<Review[]>({
    queryKey: ['reviews', productId, sortBy, starFilter, limit, userId],
    queryFn: async () => {
      if (!productId) return [];

      let list = getMockReviewsForProduct(productId);

      if (starFilter !== null) {
        list = list.filter(r => r.rating === starFilter);
      }

      if (sortBy === 'recent') {
        list = [...list].sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
      } else if (sortBy === 'highest') {
        list = [...list].sort((a, b) => b.rating - a.rating);
      } else if (sortBy === 'helpful') {
        list = [...list].sort((a, b) => (b.helpful_count || 0) - (a.helpful_count || 0));
      }

      return list.slice(0, limit);
    },
    enabled: !!productId,
    staleTime: Infinity,
  });
}
