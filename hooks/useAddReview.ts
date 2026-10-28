import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';

interface AddReviewParams {
  productId: string;
  rating: number;
  title: string;
  body: string;
  images?: string[];
}

export function useAddReview() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, rating, title, body, images = [] }: AddReviewParams) => {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          clerkUserId: user?.id || null,
          rating,
          title,
          body,
          userName: user?.fullName || 'زائر موكادور',
          images,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review.');
      }

      return data.review;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['my-review', variables.productId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
    },
  });
}
