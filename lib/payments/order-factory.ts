import { createClient } from '@/lib/supabase/server'
import { ParentOrder, ChildOrder, OrderItem } from '@/types/orders.types'
import { calculateOrderSplit } from './commission-engine'
import { createTransaction, createEscrowRecord, logFinancialMutation } from '../db/payments'

/**
 * Called from Stripe webhook when payment_intent.succeeded fires.
 * Creates parent/child orders, snapshots pricing, creates escrow entries, confirms inventory stock deduction,
 * completes the checkout session, and clears the cart atomically.
 */
export async function createOrdersFromPayment(paymentIntentId: string): Promise<{ parentOrderId: string; childOrders: string[] }> {
  const supabase = await createClient();

  // 1. Fetch checkout session by payment_intent_id
  const { data: checkoutSession, error: sessionErr } = await supabase
    .from('checkout_sessions')
    .select('*')
    .eq('payment_intent_id', paymentIntentId)
    .single();

  if (sessionErr || !checkoutSession) {
    throw new Error(`Checkout session not found for Payment Intent: ${paymentIntentId}`);
  }

  if (checkoutSession.status === 'completed') {
    // Already processed, return early (idempotent handling)
    const { data: existingParent } = await supabase
      .from('parent_orders')
      .select('id, child_orders:child_orders(id)')
      .eq('checkout_session_id', checkoutSession.id)
      .maybeSingle();

    if (existingParent) {
      return {
        parentOrderId: existingParent.id,
        childOrders: (existingParent.child_orders as any[]).map((c: any) => c.id),
      };
    }
  }

  // 2. Compute financial split allocations via the commission engine
  const financialSummary = await calculateOrderSplit(checkoutSession);

  // 3. Begin order assembly
  // Create Parent Order
  const { data: parentOrder, error: parentErr } = await supabase
    .from('parent_orders')
    .insert({
      buyer_id: checkoutSession.buyer_id,
      checkout_session_id: checkoutSession.id,
      status: 'completed', // Stripe paid
      total_amount: checkoutSession.total_amount,
      shipping_total: checkoutSession.shipping_total,
      discount_amount: checkoutSession.discount_amount,
      tax_amount: checkoutSession.tax_amount,
      shipping_address: checkoutSession.shipping_address,
      billing_address: checkoutSession.billing_address,
    })
    .select('*')
    .single();

  if (parentErr || !parentOrder) {
    console.error('Failed to create parent order:', parentErr);
    throw parentErr;
  }

  // Create Transaction
  const totalPlatformFee = Object.values(financialSummary.storeSplits).reduce((sum, s) => sum + s.platformFee, 0);
  const transaction = await createTransaction({
    checkout_session_id: checkoutSession.id,
    parent_order_id: parentOrder.id,
    gateway: 'stripe',
    gateway_transaction_id: paymentIntentId,
    amount: checkoutSession.total_amount,
    currency: 'MAD',
    exchange_rate: 1,
    amount_mad: checkoutSession.total_amount,
    platform_fee: totalPlatformFee,
    status: 'completed',
    paid_at: new Date().toISOString(),
  });

  const createdChildOrderIds: string[] = [];

  // For each store partition: Create Child Order, Order Items, Escrow, and Confirm Stock
  for (const store of checkoutSession.partitioned_stores) {
    const split = financialSummary.storeSplits[store.storeId];

    // Create Child Order
    const { data: childOrder, error: childErr } = await supabase
      .from('child_orders')
      .insert({
        parent_id: parentOrder.id,
        store_id: store.storeId,
        status: 'confirmed', // payment secured, confirmed order awaiting courier
        subtotal: split.subtotal,
        shipping_cost: split.shippingFee,
        platform_fee: split.platformFee,
        seller_earnings: split.netAmount,
      })
      .select('*')
      .single();

    if (childErr || !childOrder) {
      console.error(`Failed to create child order for Store ${store.storeId}:`, childErr);
      throw childErr;
    }

    createdChildOrderIds.push(childOrder.id);

    // Create Order Items
    for (const item of store.items) {
      const totalPrice = item.quantity * item.price_at_add;
      const { error: itemErr } = await supabase
        .from('order_items')
        .insert({
          child_order_id: childOrder.id,
          product_id: item.product_id,
          variant_id: item.variant_id ?? null,
          quantity: item.quantity,
          unit_price: item.price_at_add,
          total_price: totalPrice,
          selected_options: item.variant ? { name: item.variant.name, sku: item.variant.sku } : null,
        });

      if (itemErr) {
        console.error('Error creating order item:', itemErr);
        throw itemErr;
      }
    }

    // Create Escrow ledger record to hold payment (this triggers available/pending updates automatically)
    await createEscrowRecord({
      transaction_id: transaction.id,
      child_order_id: childOrder.id,
      store_id: store.storeId,
      gross_amount: split.subtotal - split.discountAmount + split.shippingFee,
      platform_fee: split.platformFee,
      shipping_fee: split.shippingFee,
      net_amount: split.netAmount,
      status: 'holding',
      hold_reason: 'Stripe transaction funds held in escrow.',
    });
  }

  // 4. Confirm stock deduction atomically
  const { error: stockErr } = await supabase.rpc('confirm_stock_deduction', { p_checkout_id: checkoutSession.id });
  if (stockErr) {
    console.error('RPC confirm_stock_deduction failed:', stockErr);
    // Continue anyway as stocks were already locked
  }

  // 5. Update checkout session status
  await supabase
    .from('checkout_sessions')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', checkoutSession.id);

  // 6. Clear buyer cart
  await supabase
    .from('cart_items')
    .delete()
    .eq('cart_id', checkoutSession.cart_id);

  await supabase
    .from('carts')
    .update({ status: 'checked_out', updated_at: new Date().toISOString() })
    .eq('id', checkoutSession.cart_id);

  // Log financial mutation audit log
  await logFinancialMutation({
    actor_id: checkoutSession.buyer_id,
    action: 'STRIPE_CHECKOUT_ORDER_CREATED',
    target_type: 'parent_orders',
    target_id: parentOrder.id,
    metadata: { paymentIntentId, childOrdersCount: createdChildOrderIds.length },
  });

  console.log(`Orders successfully created for Stripe Payment: ${parentOrder.id}. Cart cleared.`);

  return {
    parentOrderId: parentOrder.id,
    childOrders: createdChildOrderIds,
  };
}

/**
 * Creates parent/child orders for COD checkout flow.
 * Does NOT generate escrow holding records or credit balances immediately since no cash is online.
 * Deducts and confirms inventory stock deductions.
 */
export async function createOrdersFromCOD(checkoutSessionId: string): Promise<{
  parentOrder: ParentOrder;
  childOrders: ChildOrder[];
  totalAmount: number;
  platformFee: number;
}> {
  const supabase = await createClient();

  // 1. Fetch checkout session
  const { data: checkoutSession, error: sessionErr } = await supabase
    .from('checkout_sessions')
    .select('*')
    .eq('id', checkoutSessionId)
    .single();

  if (sessionErr || !checkoutSession) {
    throw new Error(`Checkout session not found: ${checkoutSessionId}`);
  }

  // 2. Compute splits
  const financialSummary = await calculateOrderSplit(checkoutSession);

  // 3. Create Parent Order
  const { data: parentOrder, error: parentErr } = await supabase
    .from('parent_orders')
    .insert({
      buyer_id: checkoutSession.buyer_id,
      checkout_session_id: checkoutSession.id,
      status: 'pending', // COD pending cash collection
      total_amount: checkoutSession.total_amount,
      shipping_total: checkoutSession.shipping_total,
      discount_amount: checkoutSession.discount_amount,
      tax_amount: checkoutSession.tax_amount,
      shipping_address: checkoutSession.shipping_address,
      billing_address: checkoutSession.billing_address,
    })
    .select('*')
    .single();

  if (parentErr || !parentOrder) {
    console.error('Failed to create parent COD order:', parentErr);
    throw parentErr;
  }

  const createdChildOrders: ChildOrder[] = [];
  let totalPlatformFee = 0.00;

  // Create child orders and order items
  for (const store of checkoutSession.partitioned_stores) {
    const split = financialSummary.storeSplits[store.storeId];
    totalPlatformFee += split.platformFee;

    // Create Child Order
    const { data: childOrder, error: childErr } = await supabase
      .from('child_orders')
      .insert({
        parent_id: parentOrder.id,
        store_id: store.storeId,
        status: 'confirmed', // COD starts as confirmed order awaiting courier
        subtotal: split.subtotal,
        shipping_cost: split.shippingFee,
        platform_fee: split.platformFee,
        seller_earnings: split.netAmount,
      })
      .select('*')
      .single();

    if (childErr || !childOrder) {
      throw childErr;
    }

    createdChildOrders.push(childOrder as ChildOrder);

    // Create Order Items
    for (const item of store.items) {
      const totalPrice = item.quantity * item.price_at_add;
      await supabase
        .from('order_items')
        .insert({
          child_order_id: childOrder.id,
          product_id: item.product_id,
          variant_id: item.variant_id ?? null,
          quantity: item.quantity,
          unit_price: item.price_at_add,
          total_price: totalPrice,
          selected_options: item.variant ? { name: item.variant.name, sku: item.variant.sku } : null,
        });
    }
  }

  // 4. Confirm stock deduction atomically
  await supabase.rpc('confirm_stock_deduction', { p_checkout_id: checkoutSessionId });

  // 5. Update checkout session status
  await supabase
    .from('checkout_sessions')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', checkoutSessionId);

  // 6. Clear buyer cart
  await supabase
    .from('cart_items')
    .delete()
    .eq('cart_id', checkoutSession.cart_id);

  await supabase
    .from('carts')
    .update({ status: 'checked_out', updated_at: new Date().toISOString() })
    .eq('id', checkoutSession.cart_id);

  return {
    parentOrder: parentOrder as ParentOrder,
    childOrders: createdChildOrders,
    totalAmount: Number(checkoutSession.total_amount),
    platformFee: totalPlatformFee,
  };
}
