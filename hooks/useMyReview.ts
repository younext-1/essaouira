import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Review } from '@/types';
import { useUser } from '@clerk/nextjs';

export function useMyReview(productId: string | undefined) {
  const { user } = useUser();
  const userId = user?.id;

  return useQuery<Review | null>({
    queryKey: ['my-review', productId, userId],
    queryFn: async () => {
      if (!productId || !userId) return null;

      // 1. Resolve Clerk User ID to Supabase profiles UUID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_id', userId)
        .maybeSingle();

      if (profileError) {
        throw new Error(profileError.message);
      }

      if (!profile) return null;

      // 2. Fetch review using the resolved profile UUID
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('buyer_id', profile.id)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return (data as Review) || null;
    },
    enabled: !!productId && !!userId,
  });
}
