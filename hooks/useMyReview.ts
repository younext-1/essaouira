import { useQuery } from '@tanstack/react-query';
import { Review } from '@/types';
import { useUser } from '@clerk/nextjs';

export function useMyReview(productId: string | undefined) {
  const { user } = useUser();
  const userId = user?.id;

  return useQuery<Review | null>({
    queryKey: ['my-review', productId, userId],
    queryFn: async () => {
      // Standalone mode without Supabase dependency
      return null;
    },
    enabled: !!productId && !!userId,
  });
}
