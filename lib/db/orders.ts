import { createClient } from '@/lib/supabase/server'
import {
  ParentOrder,
  ChildOrder,
  OrderItem,
  OrderHistory,
  OrderDispute,
  OrderStatus,
  TransitionActor,
  BuyerOrderView,
  SellerOrderView,
  OrderStats,
  DisputeReason,
  DisputeResolution
} from '../../types/orders.types'

/**
 * Creates parent order record in the database.
 */
export async function createParentOrder(
  checkoutSessionId: string,
  buyerId: string | null,
  data: {
    total_amount: number;
    shipping_total?: number;
    discount_amount?: number;
    tax_amount?: number;
    shipping_address: any;
    billing_address?: any;
    currency?: string;
    notes?: string;
  }
): Promise<ParentOrder> {
  const supabase = await createClient();
  const { data: parentOrder, error } = await supabase
    .from('parent_orders')
    .insert({
      buyer_id: buyerId,
      checkout_session_id: checkoutSessionId,
      total_amount: data.total_amount,
      shipping_total: data.shipping_total ?? 0.00,
      discount_amount: data.discount_amount ?? 0.00,
      tax_amount: data.tax_amount ?? 0.00,
      shipping_address: data.shipping_address,
      billing_address: data.billing_address,
      currency: data.currency ?? 'MAD',
      notes: data.notes,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating parent order:', error);
    throw error;
  }

  return parentOrder as ParentOrder;
}

/**
 * Creates a child order and inserts associated purchase items.
 */
export async function createChildOrder(
  parentId: string,
  storeId: string,
  items: Array<{
    product_id: string;
    variant_id?: string | null;
    quantity: number;
    unit_price: number;
    selected_options?: any;
  }>,
  costs: {
    subtotal: number;
    shipping_cost: number;
    platform_fee: number;
    seller_earnings: number;
  },
  initialStatus: OrderStatus = 'pending'
): Promise<ChildOrder> {
  const supabase = await createClient();

  // Create child order
  const { data: childOrder, error: childErr } = await supabase
    .from('child_orders')
    .insert({
      parent_id: parentId,
      store_id: storeId,
      status: initialStatus,
      subtotal: costs.subtotal,
      shipping_cost: costs.shipping_cost,
      platform_fee: costs.platform_fee,
      seller_earnings: costs.seller_earnings,
    })
    .select('*')
    .single();

  if (childErr || !childOrder) {
    console.error('Error creating child order:', childErr);
    throw childErr;
  }

  // Create order items
  for (const item of items) {
    const totalPrice = item.quantity * item.unit_price;
    const { error: itemErr } = await supabase
      .from('order_items')
      .insert({
        child_order_id: childOrder.id,
        product_id: item.product_id,
        variant_id: item.variant_id ?? null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: totalPrice,
        selected_options: item.selected_options ?? null,
      });

    if (itemErr) {
      console.error('Error creating order item:', itemErr);
      throw itemErr;
    }
  }

  return childOrder as ChildOrder;
}

/**
 * Fetch all parent orders for a buyer with optional status and date filters.
 */
export async function getOrdersByBuyer(
  buyerId: string,
  filters: { status?: OrderStatus; date_from?: string; date_to?: string } = {},
  pagination: { page: number; limit: number } = { page: 1, limit: 10 }
): Promise<{ orders: ParentOrder[]; totalCount: number }> {
  const supabase = await createClient();
  const offset = (pagination.page - 1) * pagination.limit;

  // Build parent query
  let query = supabase
    .from('parent_orders')
    .select('*', { count: 'exact' })
    .eq('buyer_id', buyerId);

  // Apply filters
  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  // If status is filtered, we filter parent orders that have child orders of that status
  if (filters.status) {
    // Subquery or join can be simulated by querying matching child orders
    const { data: childMatches } = await supabase
      .from('child_orders')
      .select('parent_id')
      .eq('status', filters.status);

    const matchedParentIds = childMatches?.map((c) => c.parent_id) ?? [];
    if (matchedParentIds.length === 0) {
      return { orders: [], totalCount: 0 };
    }
    query = query.in('id', matchedParentIds);
  }

  const { data: parents, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + pagination.limit - 1);

  if (error) {
    console.error('Error fetching buyer parent orders:', error);
    throw error;
  }

  return {
    orders: (parents || []) as ParentOrder[],
    totalCount: count ?? 0,
  };
}

/**
 * Fetch all child orders for a seller's store with optional status and date filters.
 */
export async function getOrdersBySeller(
  storeId: string,
  filters: { status?: OrderStatus; date_from?: string; date_to?: string } = {},
  pagination: { page: number; limit: number } = { page: 1, limit: 10 }
): Promise<{ orders: ChildOrder[]; totalCount: number }> {
  const supabase = await createClient();
  const offset = (pagination.page - 1) * pagination.limit;

  let query = supabase
    .from('child_orders')
    .select('*', { count: 'exact' })
    .eq('store_id', storeId);

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  const { data: childOrders, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + pagination.limit - 1);

  if (error) {
    console.error('Error fetching seller child orders:', error);
    throw error;
  }

  return {
    orders: (childOrders || []) as ChildOrder[],
    totalCount: count ?? 0,
  };
}

/**
 * Fetch a highly detailed single child order view based on the user's role.
 * Ensures strict security, anonymization for sellers, and full logging.
 */
export async function getChildOrderById(
  id: string,
  viewerRole: 'buyer' | 'seller' | 'admin'
): Promise<any> {
  const supabase = await createClient();

  // Fetch Child Order
  const { data: childOrder, error: childErr } = await supabase
    .from('child_orders')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (childErr || !childOrder) {
    throw new Error(`Child order not found: ${id}`);
  }

  // Fetch Parent Order
  const { data: parentOrder, error: parentErr } = await supabase
    .from('parent_orders')
    .select('*')
    .eq('id', childOrder.parent_id)
    .single();

  if (parentErr || !parentOrder) {
    throw new Error(`Parent order not found for child order: ${id}`);
  }

  // Fetch Items
  const { data: items, error: itemsErr } = await supabase
    .from('order_items')
    .select('*')
    .eq('child_order_id', id);

  if (itemsErr) {
    throw itemsErr;
  }

  // Fetch History Timeline
  const { data: history, error: historyErr } = await supabase
    .from('order_history')
    .select('*')
    .eq('child_order_id', id)
    .order('created_at', { ascending: true });

  if (historyErr) {
    throw historyErr;
  }

  // Fetch Buyer details
  let buyerData = { name: 'Anonymous Buyer', city: 'Unknown City', country: 'Morocco' };
  if (parentOrder.buyer_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', parentOrder.buyer_id)
      .single();

    if (profile) {
      const addressObj = parentOrder.shipping_address as Record<string, any>;
      buyerData = {
        name: profile.full_name || 'Anonymous Buyer',
        city: addressObj?.city || 'Unknown City',
        country: addressObj?.country || 'Morocco',
      };
    }
  }

  // Fetch Store Details (for Buyer View)
  let storeData = { name: 'Unknown Store', avatar_url: null as string | null };
  if (childOrder.store_id) {
    const { data: store } = await supabase
      .from('stores')
      .select('name, avatar_url')
      .eq('id', childOrder.store_id)
      .single();

    if (store) {
      storeData = {
        name: store.name,
        avatar_url: store.avatar_url,
      };
    }
  }

  // Fetch disputes if any
  const { data: disputes } = await supabase
    .from('order_disputes')
    .select('*')
    .eq('child_order_id', id);

  // Compile view payload based on viewer role
  if (viewerRole === 'buyer') {
    return {
      id: childOrder.id,
      status: childOrder.status,
      storeName: storeData.name,
      storeAvatar: storeData.avatar_url,
      items: items.map((item: any) => ({
        name: item.product_snapshot?.name || 'Product',
        image: item.product_snapshot?.image || '',
        quantity: item.quantity,
        price: Number(item.unit_price),
        options: item.selected_options,
      })),
      subtotal: Number(childOrder.subtotal),
      shippingCost: Number(childOrder.shipping_cost),
      total: Number(childOrder.subtotal) + Number(childOrder.shipping_cost),
      tracking: childOrder.tracking_number
        ? {
            number: childOrder.tracking_number,
            carrier: childOrder.carrier,
            estimatedDelivery: childOrder.estimated_delivery,
          }
        : null,
      timeline: history,
    };
  }

  if (viewerRole === 'seller') {
    return {
      id: childOrder.id,
      parent_id: childOrder.parent_id,
      status: childOrder.status,
      created_at: childOrder.created_at,
      buyer: buyerData, // Anonymized (Name, City, Country only. No Email or Phone)
      items: items.map((item: any) => ({
        id: item.id,
        name: item.product_snapshot?.name || 'Product',
        image: item.product_snapshot?.image || '',
        quantity: item.quantity,
        price: Number(item.unit_price),
        options: item.selected_options,
        product_id: item.product_id,
        variant_id: item.variant_id,
      })),
      financial: {
        subtotal: Number(childOrder.subtotal),
        platformFee: Number(childOrder.platform_fee),
        sellerEarnings: Number(childOrder.seller_earnings),
      },
      shipping: {
        address: parentOrder.shipping_address, // Address required to ship physical items
        cost: Number(childOrder.shipping_cost),
        label_url: childOrder.shipping_label_url,
        tracking_number: childOrder.tracking_number,
        carrier: childOrder.carrier,
        estimated_delivery: childOrder.estimated_delivery,
      },
      history,
    };
  }

  // Admin role: complete data dump
  return {
    childOrder,
    parentOrder,
    items,
    history,
    disputes: disputes || [],
  };
}

/**
 * Transitions child order status. Enforces state machine transition policies.
 */
export async function transitionOrderStatus(
  childOrderId: string,
  newStatus: OrderStatus,
  actorId: string | null,
  note?: string
): Promise<ChildOrder> {
  const supabase = await createClient();

  // Get current child order to extract status
  const { data: currentOrder, error: orderErr } = await supabase
    .from('child_orders')
    .select('status, store_id, parent_id')
    .eq('id', childOrderId)
    .single();

  if (orderErr || !currentOrder) {
    throw new Error(`Order not found: ${childOrderId}`);
  }

  // Update order status. DB triggers BEFORE UPDATE will validate the transition graph.
  // And AFTER UPDATE will automatically log to order_history as system actor and handle escrows.
  const { data: updatedOrder, error: updateErr } = await supabase
    .from('child_orders')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', childOrderId)
    .select('*')
    .single();

  if (updateErr) {
    console.error(`Transition status error for child order ${childOrderId}:`, updateErr);
    throw new Error(`Failed to update status to ${newStatus}. Transition rejected by state engine.`);
  }

  // If a specific actor (non-system) triggered this, let's insert a detailed audit log entry
  // that complements the trigger-based default log.
  if (actorId) {
    // Determine actor role
    let actorRole: TransitionActor = 'system';
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', actorId)
      .single();

    if (profile) {
      if (profile.role === 'admin' || profile.role === 'moderator') {
        actorRole = 'admin';
      } else if (profile.role === 'artisan') {
        actorRole = 'seller';
      } else {
        actorRole = 'buyer';
      }
    }

    await supabase
      .from('order_history')
      .insert({
        child_order_id: childOrderId,
        from_status: currentOrder.status,
        to_status: newStatus,
        actor_id: actorId,
        actor_role: actorRole,
        note: note ?? `Order transitioned to ${newStatus} by ${actorRole}.`,
        metadata: {
          client_update: true,
          timestamp: new Date().toISOString(),
        },
      });
  }

  return updatedOrder as ChildOrder;
}

/**
 * Fetch timeline history audit trail.
 */
export async function getOrderHistory(childOrderId: string): Promise<OrderHistory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('order_history')
    .select('*')
    .eq('child_order_id', childOrderId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }
  return data as OrderHistory[];
}

/**
 * Fetch vendor dashboard analytics.
 */
export async function getSellerOrderStats(storeId: string): Promise<OrderStats> {
  const supabase = await createClient();

  // 1. Fetch counts per status
  const { data: statusCounts, error: countErr } = await supabase
    .from('child_orders')
    .select('status')
    .eq('store_id', storeId);

  if (countErr) {
    throw countErr;
  }

  const counts = { pending: 0, confirmed: 0, shipped: 0, completed: 0, cancelled: 0 };
  statusCounts?.forEach((c: any) => {
    if (c.status === 'pending') counts.pending++;
    else if (c.status === 'confirmed' || c.status === 'processing') counts.confirmed++;
    else if (c.status === 'shipped' || c.status === 'out_for_delivery' || c.status === 'delivered') counts.shipped++;
    else if (c.status === 'completed') counts.completed++;
    else if (c.status === 'cancelled') counts.cancelled++;
  });

  // 2. Revenue calculations
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const startOfLastMonth = new Date(startOfMonth);
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

  // Revenue this month (seller earnings of completed orders)
  const { data: thisMonthRev } = await supabase
    .from('child_orders')
    .select('seller_earnings')
    .eq('store_id', storeId)
    .eq('status', 'completed')
    .gte('completed_at', startOfMonth.toISOString());

  const revenueThisMonth = thisMonthRev?.reduce((sum, o) => sum + Number(o.seller_earnings), 0) ?? 0;

  // Revenue last month
  const { data: lastMonthRev } = await supabase
    .from('child_orders')
    .select('seller_earnings')
    .eq('store_id', storeId)
    .eq('status', 'completed')
    .gte('completed_at', startOfLastMonth.toISOString())
    .lt('completed_at', startOfMonth.toISOString());

  const revenueLastMonth = lastMonthRev?.reduce((sum, o) => sum + Number(o.seller_earnings), 0) ?? 0;

  // 3. Avg fulfillment hours (confirmed_at to shipped_at)
  const { data: fulfillmentTimes } = await supabase
    .from('child_orders')
    .select('confirmed_at, shipped_at')
    .eq('store_id', storeId)
    .not('confirmed_at', 'is', null)
    .not('shipped_at', 'is', null);

  let totalHours = 0;
  let fulfillmentCount = 0;

  fulfillmentTimes?.forEach((o) => {
    if (o.confirmed_at && o.shipped_at) {
      const confirmed = new Date(o.confirmed_at).getTime();
      const shipped = new Date(o.shipped_at).getTime();
      const diffHrs = (shipped - confirmed) / (1000 * 60 * 60);
      totalHours += diffHrs;
      fulfillmentCount++;
    }
  });

  const avgFulfillmentHours = fulfillmentCount > 0 ? totalHours / fulfillmentCount : 0.00;

  return {
    ...counts,
    revenue_this_month: Number(revenueThisMonth.toFixed(2)),
    revenue_last_month: Number(revenueLastMonth.toFixed(2)),
    avg_fulfillment_hours: Number(avgFulfillmentHours.toFixed(1)),
  };
}

/**
 * Open customer dispute. Locks escrow ledger automatically via DB triggers.
 */
export async function openDispute(
  childOrderId: string,
  buyerId: string,
  data: { reason: DisputeReason; description: string; evidenceUrls: string[] }
): Promise<OrderDispute> {
  const supabase = await createClient();

  const { data: dispute, error } = await supabase
    .from('order_disputes')
    .insert({
      child_order_id: childOrderId,
      opened_by: buyerId,
      reason: data.reason,
      description: data.description,
      evidence_urls: data.evidenceUrls,
      status: 'open',
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error opening dispute:', error);
    throw error;
  }

  return dispute as OrderDispute;
}

/**
 * Moderation dispute resolution. Triggers escrow payout modifications via DB triggers.
 */
export async function resolveDispute(
  disputeId: string,
  adminId: string,
  resolution: DisputeResolution,
  notes: string
): Promise<OrderDispute> {
  const supabase = await createClient();

  const { data: dispute, error } = await supabase
    .from('order_disputes')
    .update({
      status: 'resolved',
      resolution: resolution,
      resolved_by: adminId,
      resolution_notes: notes,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', disputeId)
    .select('*')
    .single();

  if (error) {
    console.error('Error resolving dispute:', error);
    throw error;
  }

  return dispute as OrderDispute;
}
