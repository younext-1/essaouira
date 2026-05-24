import { createClient } from '@/lib/supabase/server'
import { transitionOrder } from './state-machine'

/**
 * Hourly Cron Sweeper:
 * Automatically completes orders delivered > 48 hours ago if no dispute is open.
 */
export async function autoCompleteDeliveredOrders(): Promise<{ processedCount: number }> {
  const supabase = await createClient();
  const fortyEightHoursAgo = new Date();
  fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

  // 1. Find all child orders in 'delivered' state delivered > 48h ago
  const { data: eligibleOrders, error } = await supabase
    .from('child_orders')
    .select('id')
    .eq('status', 'delivered')
    .lt('delivered_at', fortyEightHoursAgo.toISOString());

  if (error) {
    console.error('Error selecting delivered orders for auto-completion:', error);
    throw error;
  }

  let processedCount = 0;

  for (const order of eligibleOrders || []) {
    // 2. Check if there are active disputes for this child order
    const { data: activeDisputes } = await supabase
      .from('order_disputes')
      .select('id')
      .eq('child_order_id', order.id)
      .in('status', ['open', 'investigating']);

    if (activeDisputes && activeDisputes.length > 0) {
      // Order has an active dispute, skip auto-completion
      console.log(`Order ${order.id} has an active dispute. Skipping auto-completion.`);
      continue;
    }

    // 3. Complete the order atomically
    try {
      await transitionOrder(
        order.id,
        'completed',
        null, // System actor
        'system',
        'Delivered order automatically completed after 48 hours without customer dispute.'
      );
      processedCount++;
    } catch (err) {
      console.error(`Failed to auto-complete order ${order.id}:`, err);
    }
  }

  console.log(`Auto-completion worker finished. Processed ${processedCount} orders.`);
  return { processedCount };
}

/**
 * Hourly Cron Sweeper:
 * Automatically cancels orders left pending > 48 hours, restores inventory stock,
 * and automatically suspends sellers exceeding 3 auto-cancellations.
 */
export async function autoCancelUnconfirmedOrders(): Promise<{ processedCount: number; suspendedStoresCount: number }> {
  const supabase = await createClient();
  const fortyEightHoursAgo = new Date();
  fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

  // 1. Find all pending child orders older than 48 hours
  const { data: pendingOrders, error } = await supabase
    .from('child_orders')
    .select('id, store_id')
    .eq('status', 'pending')
    .lt('created_at', fortyEightHoursAgo.toISOString());

  if (error) {
    console.error('Error selecting pending orders for auto-cancellation:', error);
    throw error;
  }

  let processedCount = 0;
  const impactedStoreIds = new Set<string>();

  for (const order of pendingOrders || []) {
    try {
      // 2. Transition order status to 'cancelled' with system actor
      await transitionOrder(
        order.id,
        'cancelled',
        null,
        'system',
        'Order automatically cancelled by system due to lack of artisan confirmation within 48 hours (seller_no_response).'
      );

      // Save store ID for suspension review
      if (order.store_id) {
        impactedStoreIds.add(order.store_id);
      }

      processedCount++;
    } catch (err) {
      console.error(`Failed to auto-cancel pending order ${order.id}:`, err);
    }
  }

  let suspendedStoresCount = 0;

  // 3. Conduct suspension review for stores with auto-cancellations
  for (const storeId of impactedStoreIds) {
    // 1. Fetch child order IDs for this store
    const { data: storeChildOrders, error: childOrdersErr } = await supabase
      .from('child_orders')
      .select('id')
      .eq('store_id', storeId);

    if (childOrdersErr || !storeChildOrders) {
      console.error(`Error fetching child orders for store ${storeId}:`, childOrdersErr);
      continue;
    }

    const childOrderIds = storeChildOrders.map((o) => o.id);
    if (childOrderIds.length === 0) {
      continue;
    }

    // 2. Fetch count of auto-cancellations for this store in history
    const { count, error: countErr } = await supabase
      .from('order_history')
      .select('id', { count: 'exact', head: true })
      .eq('actor_role', 'system')
      .like('note', '%seller_no_response%')
      .in('child_order_id', childOrderIds);

    if (countErr) {
      console.error(`Error counting auto-cancellations for store ${storeId}:`, countErr);
      continue;
    }

    const autoCancelCount = count ?? 0;

    if (autoCancelCount >= 3) {
      // Suspend store!
      const { error: suspendErr } = await supabase
        .from('stores')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', storeId);

      if (suspendErr) {
        console.error(`Failed to suspend store ${storeId}:`, suspendErr);
      } else {
        suspendedStoresCount++;
        console.log(`Store ${storeId} suspended automatically due to 3 or more auto-cancellations.`);
      }
    }
  }

  console.log(`Auto-cancellation worker finished. Processed ${processedCount} cancellations. Suspended ${suspendedStoresCount} stores.`);
  return { processedCount, suspendedStoresCount };
}
