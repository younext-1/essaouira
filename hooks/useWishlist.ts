import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';
import { WishlistItem } from '@/types';
import { useProfile } from '@/hooks/useProfile';

export function useWishlist() {
  const { user } = useUser();
  const { profile, loading: profileLoading } = useProfile(user?.id);
  const queryClient = useQueryClient();

  const userId = profile?.id; // Secure DB UUID

  // 1. Fetch Wishlist Items
  const { data: wishlist = [], isLoading: wishlistLoading } = useQuery<WishlistItem[]>({
    queryKey: ['wishlist', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('wishlist')
        .select('*, products(*, stores(name))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data as WishlistItem[]) || [];
    },
    enabled: !!userId,
  });

  // 2. Toggle Wishlist Mutation
  const toggleWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!userId) throw new Error('User profile not resolved');

      // Check if item exists
      const { data: existing, error: checkError } = await supabase
        .from('wishlist')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        // Remove from wishlist
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        return { productId, added: false };
      } else {
        // Add to wishlist
        const { error } = await supabase
          .from('wishlist')
          .insert({
            user_id: userId,
            product_id: productId,
          });

        if (error) throw error;
        return { productId, added: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', userId] });
    },
  });

  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => item.product_id === productId);
  };

  return {
    wishlist,
    loading: profileLoading || wishlistLoading,
    toggleWishlist: toggleWishlistMutation.mutateAsync,
    toggleWishlistLoading: toggleWishlistMutation.isPending,
    isInWishlist,
  };
}
