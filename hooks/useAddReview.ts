import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUser } from '@clerk/nextjs';

interface AddReviewParams {
  productId: string;
  rating: number;
  title: string;
  body: string;
}

export function useAddReview() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, rating, title, body }: AddReviewParams) => {
      if (!user) {
        throw new Error('You must be signed in to submit a review.');
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

      // 2. Look up a completed or delivered order for this product by this user
      const { data: parentOrders, error: parentErr } = await supabase
        .from('parent_orders')
        .select('id')
        .eq('buyer_id', profile.id);

      if (parentErr || !parentOrders || parentOrders.length === 0) {
        throw new Error('You can only review products you have purchased and that have been delivered.');
      }

      const parentIds = parentOrders.map(po => po.id);
      const { data: childOrders, error: childErr } = await supabase
        .from('child_orders')
        .select('id')
        .in('parent_id', parentIds)
        .in('status', ['delivered', 'completed']);

      if (childErr || !childOrders || childOrders.length === 0) {
        throw new Error('You can only review products you have purchased and that have been delivered.');
      }

      const childIds = childOrders.map(co => co.id);
      const { data: orderItem, error: itemErr } = await supabase
        .from('order_items')
        .select('child_order_id')
        .eq('product_id', productId)
        .in('child_order_id', childIds)
        .limit(1)
        .maybeSingle();

      if (itemErr || !orderItem) {
        throw new Error('You can only review products you have purchased and that have been delivered.');
      }

      // 3. Insert review into product_reviews
      const { data, error } = await supabase
        .from('product_reviews')
        .insert({
          child_order_id: orderItem.child_order_id,
          product_id: productId,
          buyer_id: profile.id,
          rating,
          title,
          body,
        })
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
