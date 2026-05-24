import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Review } from '@/types';
import { useUser } from '@clerk/nextjs';

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

      let query = supabase
        .from('product_reviews')
        .select('*, profiles:buyer_id(id, full_name, avatar_url)')
        .eq('product_id', productId);

      if (starFilter !== null) {
        query = query.eq('rating', starFilter);
      }

      if (sortBy === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'highest') {
        query = query.order('rating', { ascending: false });
      } else if (sortBy === 'helpful') {
        query = query.order('helpful_count', { ascending: false });
      }

      query = query.limit(limit);

      const { data: reviewsData, error: reviewsError } = await query;

      if (reviewsError) {
        throw new Error(reviewsError.message);
      }

      const reviews = (reviewsData as any[]) || [];

      // If user is authenticated, check which reviews they already marked as helpful
      if (userId && reviews.length > 0) {
        // Resolve Clerk User ID to Supabase profiles UUID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('clerk_id', userId)
          .maybeSingle();

        if (profile) {
          const reviewIds = reviews.map((r) => r.id);
          const { data: votesData, error: votesError } = await supabase
            .from('review_helpful_votes')
            .select('review_id')
            .eq('profile_id', profile.id)
            .in('review_id', reviewIds);

          if (!votesError && votesData) {
            const votedReviewIds = new Set(votesData.map((v) => v.review_id));
            reviews.forEach((r) => {
              r.has_voted = votedReviewIds.has(r.id);
            });
          }
        }
      }

      return reviews as Review[];
    },
    enabled: !!productId,
  });
}
