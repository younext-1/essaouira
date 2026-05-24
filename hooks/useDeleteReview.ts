import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUser } from '@clerk/nextjs';

interface DeleteReviewParams {
  id: string;
  productId: string;
}

export function useDeleteReview() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, productId }: DeleteReviewParams) => {
      if (!user) {
        throw new Error('You must be signed in to delete your review.');
      }

      // Resolve Clerk User ID to Supabase profiles UUID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_id', user.id)
        .maybeSingle();

      if (profileError || !profile) {
        throw new Error('Failed to locate your buyer profile. Please sign in again.');
      }

      const { error } = await supabase
        .from('product_reviews')
        .delete()
        .eq('id', id)
        .eq('buyer_id', profile.id);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['my-review', variables.productId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
    },
  });
}
