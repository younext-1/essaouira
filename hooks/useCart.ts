import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { useSupabase } from '@/hooks/useSupabase';
import { CartItem } from '@/types';
import { useProfile } from '@/hooks/useProfile';

export function useCart() {
  const { user } = useUser();
  const { profile, loading: profileLoading } = useProfile(user?.id);
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  const userId = profile?.id; // Secure DB UUID

  /**
   * Resiliently resolves the current user's profile UUID in Supabase.
   * If not immediately resolved from the useProfile hook state:
   * 1. Performs an instant DB lookup on profiles using the Clerk ID.
   * 2. If missing, proactively triggers the server-side session sync API to sync/create it inline.
   */
  const resolveProfileId = async (): Promise<string> => {
    if (userId) return userId;
    if (!user?.id) throw new Error('User not authenticated with Clerk');

    try {
      // 1. Instant DB lookup using Clerk ID via authenticated client
      const { data: profData, error: lookupError } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_id', user.id)
        .maybeSingle();

      if (!lookupError && profData?.id) {
        return profData.id;
      }

      // 2. Proactive server-side sync API fallback
      const response = await fetch('/api/v1/users/sync-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const res = await response.json();
        if (res.success && res.data?.id) {
          return res.data.id;
        }
      }
    } catch (err) {
      console.error('Failed to inline sync/resolve profile UUID:', err);
    }

    throw new Error('User profile record could not be resolved in the database');
  };

  // 1. Fetch Cart Items
  const { data: cart = [], isLoading: cartLoading, refetch } = useQuery<CartItem[]>({
    queryKey: ['cart', userId || user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      let activeUserId: string;
      try {
        activeUserId = await resolveProfileId();
      } catch (e) {
        console.error('Failed to resolve active profile ID for cart fetch:', e);
        return [];
      }

      // Fetch active parent cart
      const { data: cartData, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('buyer_id', activeUserId)
        .eq('status', 'active')
        .maybeSingle();

      if (cartError) throw new Error(cartError.message);
      if (!cartData) return [];

      // Fetch child cart items with variants joined in
      const { data, error } = await supabase
        .from('cart_items')
        .select('*, products(*, stores(name), category:categories(id, name, name_ar, name_fr, slug)), variant:product_variants(*)')
        .eq('cart_id', cartData.id)
        .order('added_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      // Map dynamic variant selections from joined table to { [name]: value } format for CartDrawer backward compatibility
      const mappedData = (data || []).map((item: any) => {
        const variantObj = item.variant; // Joined variant record
        const mappedVariant = variantObj && variantObj.name && variantObj.value
          ? { [variantObj.name]: variantObj.value }
          : null;

        return {
          ...item,
          variant: mappedVariant,
        };
      });

      return mappedData as CartItem[];
    },
    enabled: !!user?.id,
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
      const activeUserId = await resolveProfileId();

      // Retrieve or create active parent cart
      let { data: cartData, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('buyer_id', activeUserId)
        .eq('status', 'active')
        .maybeSingle();

      if (cartError) throw new Error(cartError.message);

      if (!cartData) {
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert({
            buyer_id: activeUserId,
            status: 'active',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 Days expiry
          })
          .select()
          .single();
        if (createError || !newCart) throw new Error(createError?.message || 'Failed to create active cart session');
        cartData = newCart;
      }

      const cartId = cartData?.id;
      if (!cartId) throw new Error('Cart session could not be resolved');

      // Fetch product pricing and store_id metadata (required columns!)
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('store_id, price')
        .eq('id', productId)
        .single();
      
      if (prodError || !prodData) throw new Error('Product not found in Medina catalog');

      // 1. Resolve selected variant to a valid variant_id UUID inside product_variants
      let resolvedVariantId: string | null = null;
      if (variant && Object.keys(variant).length > 0) {
        const firstEntry = Object.entries(variant)[0];
        if (firstEntry) {
          const [optName, optVal] = firstEntry;
          const { data: matchedVar } = await supabase
            .from('product_variants')
            .select('id')
            .eq('product_id', productId)
            .eq('name', optName)
            .eq('value', optVal)
            .maybeSingle();

          if (matchedVar) {
            resolvedVariantId = matchedVar.id;
          }
        }
      }

      // 2. Check if identical item with same variant_id already exists in this cart
      let checkQuery = supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartId)
        .eq('product_id', productId);

      if (resolvedVariantId) {
        checkQuery = checkQuery.eq('variant_id', resolvedVariantId);
      } else {
        checkQuery = checkQuery.is('variant_id', null);
      }

      const { data: existing, error: checkError } = await checkQuery.maybeSingle();
      if (checkError) throw new Error(checkError.message);

      if (existing) {
        // Update quantity inline
        const { data, error } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data;
      } else {
        // Insert new cart item with resolved variant_id UUID (avoiding variant column missing schema cache error!)
        const { data, error } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cartId,
            product_id: productId,
            quantity,
            price_at_add: Number(prodData.price) || 0,
            store_id: prodData.store_id,
            variant_id: resolvedVariantId,
          })
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', userId || user?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['cart', userId || user?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['cart', userId || user?.id] });
    },
  });

  // 5. Clear Cart Mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const activeUserId = await resolveProfileId();

      const { data: cartData } = await supabase
        .from('carts')
        .select('id')
        .eq('buyer_id', activeUserId)
        .eq('status', 'active')
        .maybeSingle();

      if (cartData) {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', cartData.id);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', userId || user?.id] });
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
