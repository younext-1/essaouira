import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';
import { Order, OrderItem } from '@/types';
import { useProfile } from '@/hooks/useProfile';
import { useCart } from '@/hooks/useCart';

export function useOrders() {
  const { user } = useUser();
  const { profile, loading: profileLoading } = useProfile(user?.id);
  const queryClient = useQueryClient();
  const { clearCart } = useCart();

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

      // Group items by storeId (multi-vendor)
      const storesItems: Record<string, typeof items> = {};
      items.forEach((item) => {
        if (!storesItems[item.storeId]) {
          storesItems[item.storeId] = [];
        }
        storesItems[item.storeId].push(item);
      });

      const totalAmountAllStores = items.reduce(
        (sum, item) => sum + item.priceAtPurchase * item.quantity,
        0
      );

      // Create Parent Order
      const { data: parentOrder, error: parentError } = await supabase
        .from('parent_orders')
        .insert({
          buyer_id: userId,
          total_amount: totalAmountAllStores,
          shipping_address: {
            fullName: shippingAddress.fullName,
            addressLine1: shippingAddress.addressLine1,
            city: shippingAddress.city,
            country: shippingAddress.country,
            zip: shippingAddress.zip,
            phone: shippingAddress.phone
          },
          currency: 'MAD',
          notes,
          status: 'pending',
        })
        .select()
        .single();

      if (parentError || !parentOrder) throw parentError || new Error('Failed to create parent order');

      const placedOrders: any[] = [];

      // Create Child Order and Order Items for each store
      for (const [storeId, storeItems] of Object.entries(storesItems)) {
        const subtotal = storeItems.reduce(
          (sum, item) => sum + item.priceAtPurchase * item.quantity,
          0
        );

        // Insert Child Order
        const { data: childOrder, error: childError } = await supabase
          .from('child_orders')
          .insert({
            parent_id: parentOrder.id,
            store_id: storeId,
            status: 'pending',
            subtotal,
            shipping_cost: 0.00, // standard domestic standard cod
            platform_fee: Math.round(subtotal * 0.05 * 100) / 100, // 5% fee
            seller_earnings: Math.round(subtotal * 0.95 * 100) / 100,
          })
          .select()
          .single();

        if (childError || !childOrder) throw childError || new Error('Failed to create child order');

        // Insert Order Items
        const orderItemsToInsert = storeItems.map((item) => ({
          child_order_id: childOrder.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.priceAtPurchase,
          total_price: item.priceAtPurchase * item.quantity,
          selected_options: item.variant,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsToInsert);

        if (itemsError) throw itemsError;

        placedOrders.push(childOrder);
      }

      // Clear user cart
      await clearCart();

      return placedOrders;
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
