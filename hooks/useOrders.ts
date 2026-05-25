import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { useSupabase } from '@/hooks/useSupabase';
import { Order, OrderItem } from '@/types';
import { useProfile } from '@/hooks/useProfile';
import { useCart } from '@/hooks/useCart';

export function useOrders() {
  const { user } = useUser();
  const { profile, loading: profileLoading } = useProfile(user?.id);
  const queryClient = useQueryClient();
  const { clearCart } = useCart();
  const supabase = useSupabase();

  const userId = profile?.id; // Secure DB UUID

  // 1. Fetch Buyer Orders (retrieves child orders under buyer's parents)
  const { data: buyerOrders = [], isLoading: buyerOrdersLoading } = useQuery<Order[]>({
    queryKey: ['buyer-orders', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('child_orders')
        .select('*, parent_orders!inner(*), stores(name, slug, logo_url), order_items(*, products(id, name, images, thumbnail_url, stores(slug)))')
        .eq('parent_orders.buyer_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      // Map to flat backward-compatible Order structure for app/orders/page.tsx
      return (data || []).map((co: any) => ({
        id: co.id,
        status: co.status,
        created_at: co.created_at,
        total_price: Number(co.subtotal) + Number(co.shipping_cost),
        shipping_city: co.parent_orders?.shipping_address?.city || 'Essaouira',
        order_items: co.order_items || [],
        stores: co.stores || null
      })) as unknown as Order[];
    },
    enabled: !!userId,
  });

  // 2. Fetch Seller Orders (for the seller's store)
  const useSellerOrders = (storeId: string | undefined) => {
    return useQuery<Order[]>({
      queryKey: ['seller-orders', storeId],
      queryFn: async () => {
        if (!storeId) return [];

        const { data, error } = await supabase
          .from('child_orders')
          .select('*, parent_orders(*, profiles(full_name, avatar_url, phone, email)), order_items(*, products(id, name, images, thumbnail_url, stores(slug)))')
          .eq('store_id', storeId)
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error(error.message);
        }

        return (data || []).map((co: any) => ({
          id: co.id,
          status: co.status,
          created_at: co.created_at,
          total_price: Number(co.subtotal) + Number(co.shipping_cost),
          shipping_city: co.parent_orders?.shipping_address?.city || 'Essaouira',
          order_items: co.order_items || [],
          profiles: co.parent_orders?.profiles || null
        })) as unknown as Order[];
      },
      enabled: !!storeId,
    });
  };

  // 3. Create/Place Order Mutation
  const placeOrderMutation = useMutation({
    mutationFn: async ({
      items,
      shippingAddress,
      notes = null,
    }: {
      items: Array<{
        productId: string;
        storeId: string;
        quantity: number;
        priceAtPurchase: number;
        variant: Record<string, string> | null;
      }>;
      shippingAddress: {
        fullName: string;
        addressLine1: string;
        city: string;
        country: string;
        zip: string;
        phone: string;
      };
      notes?: string | null;
    }) => {
      if (!userId) throw new Error('User profile not resolved');
      if (items.length === 0) throw new Error('No items to order');

      const response = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          shippingAddress,
          notes,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to place order transaction');
      }

      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.message || 'Failed to place order transaction');
      }

      // Clear user cart on the client side
      await clearCart();

      return resData.data; // placedOrders array
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-orders', userId] });
      queryClient.invalidateQueries({ queryKey: ['cart', userId] });
    },
  });

  // 4. Update Order Status Mutation (for sellers)
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: Order['status'] }) => {
      const { data, error } = await supabase
        .from('child_orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-orders'] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
    },
  });

  return {
    buyerOrders,
    buyerOrdersLoading: buyerOrdersLoading || profileLoading,
    useSellerOrders,
    placeOrder: placeOrderMutation.mutateAsync,
    placeOrderLoading: placeOrderMutation.isPending,
    updateOrderStatus: updateOrderStatusMutation.mutateAsync,
    updateOrderStatusLoading: updateOrderStatusMutation.isPending,
  };
}
