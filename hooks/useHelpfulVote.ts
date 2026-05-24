import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUser } from '@clerk/nextjs';

interface VoteParams {
  reviewId: string;
  hasVoted: boolean;
}

export function useHelpfulVote(productId: string) {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, hasVoted }: VoteParams) => {
      if (!user) {
        throw new Error('Authentication required to mark reviews as helpful.');
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

      if (hasVoted) {
        // User is unvoting helpfulness
        const { error: deleteVoteError } = await supabase
          .from('review_helpful_votes')
          .delete()
          .eq('review_id', reviewId)
          .eq('profile_id', profile.id);

        if (deleteVoteError) throw deleteVoteError;

        // Fetch current helpful count
        const { data: reviewData, error: fetchError } = await supabase
          .from('product_reviews')
          .select('helpful_count')
          .eq('id', reviewId)
          .single();

        if (fetchError) throw fetchError;

        const currentCount = reviewData?.helpful_count || 0;

        // Decrement helpful count (min 0)
        const { error: updateError } = await supabase
          .from('product_reviews')
          .update({ helpful_count: Math.max(0, currentCount - 1) })
          .eq('id', reviewId);

        if (updateError) throw updateError;
      } else {
        // User is voting helpfulness
        const { error: insertVoteError } = await supabase
          .from('review_helpful_votes')
          .insert({
            review_id: reviewId,
            profile_id: profile.id,
          });

        if (insertVoteError) throw insertVoteError;

        // Fetch current helpful count
        const { data: reviewData, error: fetchError } = await supabase
          .from('product_reviews')
          .select('helpful_count')
          .eq('id', reviewId)
          .single();

        if (fetchError) throw fetchError;

        const currentCount = reviewData?.helpful_count || 0;

        // Increment helpful count
        const { error: updateError } = await supabase
          .from('product_reviews')
          .update({ helpful_count: currentCount + 1 })
          .eq('id', reviewId);

        if (updateError) throw updateError;
      }
    },
    onSuccess: () => {
      // Invalidate queries starting with this product id to update all states in the feed
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
    },
  });
}
