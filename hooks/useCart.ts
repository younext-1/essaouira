import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';
import { CartItem } from '@/types';
import { useProfile } from '@/hooks/useProfile';

export function useCart() {
  const { user } = useUser();
  const { profile, loading: profileLoading } = useProfile(user?.id);
  const queryClient = useQueryClient();

  const userId = profile?.id; // Secure DB UUID

  // 1. Fetch Cart Items
  const { data: cart = [], isLoading: cartLoading, refetch } = useQuery<CartItem[]>({
    queryKey: ['cart', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('cart_items')
        .select('*, products(*, stores(name), category:categories(id, name, name_ar, name_fr, slug))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data as CartItem[]) || [];
    },
    enabled: !!userId,
  });

  // 2. Add to Cart Mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({
      productId,
      quantity = 1,
      variant = null,
    }: {
      productId: string;
      quantity?: number;
      variant?: Record<string, string> | null;
    }) => {
      if (!userId) throw new Error('User profile not resolved');

      // Check if item with same product and variant already exists in cart
      const { data: existing, error: checkError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .maybeSingle();

      if (checkError) throw new Error(checkError.message);

      // Deep compare variants if exists
      const match = existing && JSON.stringify(existing.variant) === JSON.stringify(variant);

      if (existing && match) {
        // Update quantity
        const { data, error } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data;
      } else {
        // Insert new cart item
        const { data, error } = await supabase
          .from('cart_items')
          .insert({
            user_id: userId,
            product_id: productId,
            quantity,
            variant,
          })
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', userId] });
    },
  });

  // 3. Update Quantity Mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (quantity <= 0) {
        // Delete item if quantity goes to 0 or below
        const { error } = await supabase.from('cart_items').delete().eq('id', itemId);
        if (error) throw error;
        return null;
      }

      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', userId] });
    },
  });

  // 4. Remove from Cart Mutation
  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from('cart_items').delete().eq('id', itemId);
      if (error) throw error;
      return itemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', userId] });
    },
  });

  // 5. Clear Cart Mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const { error } = await supabase.from('cart_items').delete().eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', userId] });
    },
  });

  // Calculation helpers
  const cartSubtotal = cart.reduce((sum, item) => {
    const price = item.products?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  const shippingCost = cartSubtotal >= 50 ? 0 : cart.length > 0 ? 5 : 0;
  const cartTotal = cartSubtotal + shippingCost;
  const cartItemsCount = cart.reduce((count, item) => count + item.quantity, 0);

  return {
    cart,
    loading: profileLoading || cartLoading,
    addToCart: addToCartMutation.mutateAsync,
    addToCartLoading: addToCartMutation.isPending,
    updateQuantity: updateQuantityMutation.mutateAsync,
    removeFromCart: removeFromCartMutation.mutateAsync,
    clearCart: clearCartMutation.mutateAsync,
    cartSubtotal,
    shippingCost,
    cartTotal,
    cartItemsCount,
    refetch,
  };
}
