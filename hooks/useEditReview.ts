import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUser } from '@clerk/nextjs';

interface EditReviewParams {
  id: string;
  productId: string;
  rating: number;
  title: string;
  body: string;
}

export function useEditReview() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, productId, rating, title, body }: EditReviewParams) => {
      if (!user) {
        throw new Error('You must be signed in to edit your review.');
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

      const { data, error } = await supabase
        .from('product_reviews')
        .update({
          rating,
          title,
          body,
        })
        .eq('id', id)
        .eq('buyer_id', profile.id) // Secure verification
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['my-review', variables.productId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
    },
  });
}
