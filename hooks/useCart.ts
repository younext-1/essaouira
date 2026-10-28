import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { useSupabase } from '@/hooks/useSupabase';
import { CartItem } from '@/types';
import { useProfile } from '@/hooks/useProfile';
import { MOCK_PRODUCTS } from '@/lib/mock-data';

const LOCAL_CART_KEY = 'mogador_local_cart';

function getLocalCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save cart to localStorage:', e);
  }
}

export function useCart() {
  const { user } = useUser();
  const { profile, loading: profileLoading } = useProfile(user?.id);
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  const userId = profile?.id;

  // 1. Fetch Cart Items
  const { data: cart = [], isLoading: cartLoading, refetch } = useQuery<CartItem[]>({
    queryKey: ['cart', userId || user?.id || 'anonymous'],
    queryFn: async () => {
      // Try to load from localStorage first for instant snappy response
      const localItems = getLocalCart();

      // If user not signed in or offline, return local items
      if (!user?.id) {
        return localItems;
      }

      try {
        const { data: cartData, error: cartError } = await supabase
          .from('carts')
          .select('id')
          .eq('buyer_id', userId || user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (cartError || !cartData) {
          return localItems;
        }

        const { data, error } = await supabase
          .from('cart_items')
          .select('*, products(*, stores(name), category:categories(id, name, name_ar, name_fr, slug)), variant:product_variants(*)')
          .eq('cart_id', cartData.id)
          .order('added_at', { ascending: false });

        if (error || !data || data.length === 0) {
          return localItems;
        }

        return data as CartItem[];
      } catch (err) {
        console.warn('Cart fallback to local storage:', err);
        return localItems;
      }
    },
    staleTime: 5000,
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
      // Find product in mock products catalog
      const prod = MOCK_PRODUCTS.find(p => p.id === productId) || {
        id: productId,
        name: 'Produit Mogador',
        price: 150,
        images: ['/placeholder.jpg'],
        stores: { name: 'Artisan Workshop' },
        stock: 50
      };

      const localItems = getLocalCart();
      const existingIdx = localItems.findIndex(i => i.product_id === productId);

      let updatedList: CartItem[];
      if (existingIdx >= 0) {
        updatedList = [...localItems];
        updatedList[existingIdx].quantity += quantity;
      } else {
        const newItem: any = {
          id: `local-item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          cart_id: 'local-cart',
          product_id: productId,
          quantity,
          price_at_add: prod.price,
          products: prod,
          variant,
          added_at: new Date().toISOString()
        };
        updatedList = [newItem, ...localItems];
      }

      saveLocalCart(updatedList);
      return updatedList;
    },
    onSuccess: (updatedList) => {
      queryClient.setQueryData(['cart', userId || user?.id || 'anonymous'], updatedList);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // 3. Update Quantity Mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const localItems = getLocalCart();
      let updated: CartItem[];
      if (quantity <= 0) {
        updated = localItems.filter(i => i.id !== itemId);
      } else {
        updated = localItems.map(i => i.id === itemId ? { ...i, quantity } : i);
      }
      saveLocalCart(updated);
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['cart', userId || user?.id || 'anonymous'], updated);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // 4. Remove from Cart Mutation
  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const localItems = getLocalCart();
      const updated = localItems.filter(i => i.id !== itemId);
      saveLocalCart(updated);
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['cart', userId || user?.id || 'anonymous'], updated);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // 5. Clear Cart Mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      saveLocalCart([]);
      return [];
    },
    onSuccess: () => {
      queryClient.setQueryData(['cart', userId || user?.id || 'anonymous'], []);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
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
    loading: cartLoading,
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
