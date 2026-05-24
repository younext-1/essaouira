import { createClient } from '@/lib/supabase/server'
import { createTransaction, updateTransactionStatus, updateSellerBalance, createEscrowRecord, logFinancialMutation } from '../db/payments'
import { createOrdersFromCOD } from './order-factory'
import { ChildOrder, ParentOrder } from '@/types/orders.types'

/**
 * Initiate Cash on Delivery (COD) order.
 * Creates order structures, confirms stock deduction, and records a pending COD transaction.
 */
export async function initiateCODOrder(checkoutId: string) {
  const supabase = await createClient();

  // Create orders structures atomically
  const { parentOrder, childOrders, totalAmount, platformFee } = await createOrdersFromCOD(checkoutId);

  // Create COD transaction with status pending
  const transaction = await createTransaction({
    checkout_session_id: checkoutId,
    parent_order_id: parentOrder.id,
    gateway: 'cod',
    gateway_transaction_id: `cod_${parentOrder.id}`,
    amount: totalAmount,
    currency: 'MAD',
    exchange_rate: 1,
    amount_mad: totalAmount,
    platform_fee: platformFee,
    status: 'pending',
  });

  // Send mock seller notification
  for (const child of childOrders) {
    console.log(`Notification sent to Store ${child.store_id}: New COD order ${child.id} initiated.`);
  }

  await logFinancialMutation({
    actor_id: null,
    action: 'COD_ORDER_INITIATED',
    target_type: 'parent_orders',
    target_id: parentOrder.id,
    metadata: { transactionId: transaction.id, checkoutId },
  });

  return {
    orderId: parentOrder.id,
    childOrders: childOrders.map(c => c.id),
    instructions: 'Please pay cash to the courier upon delivery of your products.',
  };
}

/**
 * Confirm Cash on Delivery collection by seller/courier.
 * Marks payment as completed and reconciles the platform commission by booking it against future seller payouts.
 */
export async function confirmCODCollection(childOrderId: string, sellerId: string) {
  const supabase = await createClient();

  // 1. Fetch child order details
  const { data: childOrder, error: orderErr } = await supabase
    .from('child_orders')
    .select('*, parent_orders(*)')
    .eq('id', childOrderId)
    .single();

  if (orderErr || !childOrder) {
    throw new Error('Child order not found');
  }

  // Verify seller ownership
  const { data: store } = await supabase
    .from('stores')
    .select('id, owner_id')
    .eq('id', childOrder.store_id)
    .single();

  if (!store || store.owner_id !== sellerId) {
    throw new Error('Unauthorized to confirm COD collection for this store.');
  }

  if (childOrder.status === 'delivered') {
    throw new Error('COD collection already confirmed for this order.');
  }

  // 2. Fetch linked transaction
  const { data: transaction, error: txErr } = await supabase
    .from('transactions')
    .select('*')
    .eq('parent_order_id', childOrder.parent_id)
    .eq('gateway', 'cod')
    .single();

  if (txErr || !transaction) {
    throw new Error('COD Transaction not found');
  }

  // Calculate platform fee for this specific child order
  // Fetch order items to compute commission
  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('child_order_id', childOrderId);

  let childPlatformFee = 0.00;
  // If items exist, compute based on items, else fall back to a standard 10%
  if (items && items.length > 0) {
    const { calculateCommission } = await import('./commission-engine');
    for (const item of items) {
      const comm = await calculateCommission(item.product_id, childOrder.store_id, Number(item.unit_price) * Number(item.quantity));
      childPlatformFee += comm.platformFee;
    }
  } else {
    childPlatformFee = Math.round(Number(childOrder.subtotal) * 0.10 * 100) / 100;
  }

  // 3. Update status of the child order to delivered
  await supabase
    .from('child_orders')
    .update({ status: 'delivered', updated_at: new Date().toISOString() })
    .eq('id', childOrderId);

  // 4. Update transaction status to completed if all child orders are delivered/paid
  const { data: siblingOrders } = await supabase
    .from('child_orders')
    .select('status')
    .eq('parent_id', childOrder.parent_id);

  const allDelivered = siblingOrders?.every(o => o.status === 'delivered' || o.status === 'cancelled') ?? true;
  if (allDelivered) {
    await updateTransactionStatus(transaction.id, 'completed');
  }

  // 5. Trigger escrow hold record for platform fee reconciliation.
  // Since the seller collected the FULL cash amount, we book a "released" escrow representing the transaction,
  // but with negative disponible balance matching the platform fee to be deducted from future payouts.
  const escrow = await createEscrowRecord({
    transaction_id: transaction.id,
    child_order_id: childOrderId,
    store_id: childOrder.store_id,
    gross_amount: Number(childOrder.subtotal) + Number(childOrder.shipping_cost),
    platform_fee: childPlatformFee,
    shipping_fee: Number(childOrder.shipping_cost),
    net_amount: (Number(childOrder.subtotal) + Number(childOrder.shipping_cost)) - childPlatformFee,
    status: 'released', // immediately released since cash is already in hand
    release_trigger: 'buyer_confirmed',
    hold_reason: 'COD fee reconciliation booking',
  });

  // Reconcile platform fee: deduct from seller's available balance directly
  // This available balance will resolve on the next manual payout withdrawal request.
  await updateSellerBalance(childOrder.store_id, 'available', -childPlatformFee);

  await logFinancialMutation({
    actor_id: sellerId,
    action: 'COD_CASH_COLLECTED_FEE_RECONCILED',
    target_type: 'child_orders',
    target_id: childOrderId,
    metadata: { platformFeeDeducted: childPlatformFee, escrowId: escrow.id },
  });

  return {
    success: true,
    childOrderId,
    status: 'delivered',
    platformFeeDeducted: childPlatformFee,
  };
}

/**
 * Reject cash on delivery order upon delivery attempt.
 * Marks child order as cancelled and restores product stocks.
 */
export async function rejectCODDelivery(childOrderId: string, reason: string) {
  const supabase = await createClient();

  // Fetch child order details
  const { data: childOrder, error: orderErr } = await supabase
    .from('child_orders')
    .select('*')
    .eq('id', childOrderId)
    .single();

  if (orderErr || !childOrder) {
    throw new Error('Child order not found');
  }

  if (childOrder.status === 'cancelled') {
    throw new Error('Order is already cancelled');
  }

  // 1. Mark child order as cancelled.
  // The database trigger will automatically invoke `restore_order_stock` to restore all item inventory.
  await supabase
    .from('child_orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', childOrderId);

  // 2. Check if all sibling child orders are cancelled to cancel the parent order
  const { data: siblingOrders } = await supabase
    .from('child_orders')
    .select('status')
    .eq('parent_id', childOrder.parent_id);

  const allCancelled = siblingOrders?.every(o => o.status === 'cancelled') ?? true;
  if (allCancelled) {
    await supabase
      .from('parent_orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', childOrder.parent_id);

    // Cancel transaction
    await supabase
      .from('transactions')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('parent_order_id', childOrder.parent_id);
  }

  await logFinancialMutation({
    actor_id: null,
    action: 'COD_DELIVERY_REJECTED_STOCK_RESTORED',
    target_type: 'child_orders',
    target_id: childOrderId,
    metadata: { reason },
  });

  console.log(`COD order ${childOrderId} rejected by customer. Reason: ${reason}. Product stocks restored.`);

  return {
    success: true,
    childOrderId,
    status: 'cancelled',
  };
}
