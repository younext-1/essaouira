import { createClient } from '@/lib/supabase/server'
import { EscrowLedger } from '../payments.types'
import { createEscrowRecord, updateEscrowStatus, logFinancialMutation } from '../db/payments'
import { sendNotification } from '@/lib/notifications/engine'

/**
 * Hold funds in escrow for a multi-vendor child order.
 * Creates an escrow ledger record in 'holding' state.
 * Balance update (pending_mad += gross_amount) is handled automatically via database triggers.
 */
export async function holdFunds(
  transactionId: string,
  childOrderId: string,
  storeId: string,
  amounts: { gross: number; platformFee: number; shippingFee: number; net: number }
): Promise<any> {
  const record = await createEscrowRecord({
    transaction_id: transactionId,
    child_order_id: childOrderId,
    store_id: storeId,
    gross_amount: amounts.gross,
    platform_fee: amounts.platformFee,
    shipping_fee: amounts.shippingFee,
    net_amount: amounts.net,
    status: 'holding',
    hold_reason: 'Funds held in escrow pending delivery.',
  });

  return record;
}

/**
 * Release funds in escrow to the seller's available balance.
 * Balance updates (available_mad += net_amount, pending_mad -= gross_amount) are automated via triggers.
 */
export async function releaseFunds(
  escrowId: string,
  trigger: any,
  adminId?: string
): Promise<any> {
  const supabase = await createClient();

  // Retrieve escrow record to validate state
  const { data: escrow, error } = await supabase
    .from('escrow_ledgers')
    .select('*')
    .eq('id', escrowId)
    .single();

  if (error || !escrow) {
    throw new Error('Escrow ledger entry not found');
  }

  if (escrow.status !== 'holding') {
    throw new Error(`Escrow cannot be released from state: ${escrow.status}`);
  }

  // Update status to 'released'
  const record = await updateEscrowStatus(escrowId, 'released', trigger);

  // Update related child order status to 'completed' if buyer confirmed delivery
  await supabase
    .from('child_orders')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', escrow.child_order_id);

  // If released by admin, log the actor
  if (adminId && trigger === 'admin_manual') {
    await supabase
      .from('escrow_ledgers')
      .update({ hold_reason: `Released manually by Admin ID: ${adminId}` })
      .eq('id', escrowId);
  }

  // Dispatch real notification to store owner (seller)
  const { data: store } = await supabase
    .from('stores')
    .select('name, owner_id, profiles!stores_owner_id_fkey(email, full_name)')
    .eq('id', escrow.store_id)
    .single();

  if (store) {
    const sellerProfileId = store.owner_id;
    const seller: any = store.profiles;
    
    await sendNotification({
      profileId: sellerProfileId,
      type: 'escrow_released',
      title: 'Funds Released! 💰',
      body: `Congratulations! Payment of ${escrow.net_amount} MAD for child order #${escrow.child_order_id} has been released from escrow and added to your available balance.`,
      metadata: { childOrderId: escrow.child_order_id, escrowId: escrow.id },
      sendEmail: true,
      recipientEmail: seller?.email || null
    }).catch(err => console.error('⚠️ Failed to dispatch escrow release notification to seller:', err));
  }

  return record;
}

/**
 * Freeze funds in escrow due to buyer dispute or refund request.
 */
export async function freezeFunds(escrowId: string, reason: string): Promise<any> {
  const supabase = await createClient();

  // Update escrow status to 'disputed'
  const record = await updateEscrowStatus(escrowId, 'disputed');

  // Log dispute ticket details
  await logFinancialMutation({
    actor_id: null,
    action: 'ESCROW_FROZEN_DISPUTE_OPENED',
    target_type: 'escrow_ledgers',
    target_id: escrowId,
    metadata: { reason, childOrderId: record.child_order_id },
  });

  // Notify seller and buyer of the dispute/freeze
  const { data: orderDetails } = await supabase
    .from('child_orders')
    .select('id, store_id, parent_orders(buyer_id, profiles!parent_orders_buyer_id_fkey(email, full_name)), stores(name, owner_id, profiles!stores_owner_id_fkey(email, full_name))')
    .eq('id', record.child_order_id)
    .single();

  if (orderDetails) {
    const parentOrder = (orderDetails as any).parent_orders;
    const store = (orderDetails as any).stores;

    if (parentOrder) {
      const buyerProfileId = parentOrder.buyer_id;
      const buyer: any = parentOrder.profiles;
      
      // Notify Buyer
      await sendNotification({
        profileId: buyerProfileId,
        type: 'refund_requested',
        title: 'Escrow Frozen / Dispute Opened ⚠️',
        body: `Your dispute for order #${record.child_order_id} has been logged. Escrow funds (${record.gross_amount} MAD) have been frozen pending resolution.`,
        metadata: { childOrderId: record.child_order_id, escrowId },
        sendEmail: true,
        recipientEmail: buyer?.email || null
      }).catch(err => console.error('⚠️ Failed to notify buyer of frozen escrow:', err));
    }

    if (store) {
      const sellerProfileId = store.owner_id;
      const seller: any = store.profiles;

      // Notify Seller
      await sendNotification({
        profileId: sellerProfileId,
        type: 'refund_requested',
        title: 'Dispute Alert: Escrow Frozen ⚠️',
        body: `A dispute has been opened for order #${record.child_order_id}. Escrow funds (${record.gross_amount} MAD) are currently frozen pending review.`,
        metadata: { childOrderId: record.child_order_id, escrowId },
        sendEmail: true,
        recipientEmail: seller?.email || null
      }).catch(err => console.error('⚠️ Failed to notify seller of frozen escrow:', err));
    }
  }

  return record;
}

/**
 * Auto-release escrow records held for more than 7 days that do not have active disputes.
 * Scheduled background sweep job.
 */
export async function autoReleaseEscrow() {
  const supabase = await createClient();

  // Find all escrows in 'holding' state held for more than 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data: escrows, error } = await supabase
    .from('escrow_ledgers')
    .select('*, child_orders!inner(*)')
    .eq('status', 'holding')
    .lte('held_at', sevenDaysAgo);

  if (error) {
    console.error('Error fetching escrows for auto-release sweep:', error);
    throw error;
  }

  console.log(`Auto-Release Sweep: Found ${escrows?.length || 0} candidate escrow records.`);

  const releasedRecords: any[] = [];

  for (const escrow of escrows || []) {
    try {
      // 1. Check if the child order status is 'refund_requested' or similar dispute states
      if (escrow.child_orders.status === 'refund_requested') {
        console.log(`Auto-Release: Skipping Escrow ${escrow.id} because child order is under refund request.`);
        continue;
      }

      // 2. Check if there is an active (non-resolved) refund request or dispute for this child order
      const { data: activeRefunds } = await supabase
        .from('refund_requests')
        .select('id')
        .eq('child_order_id', escrow.child_order_id)
        .in('status', ['pending', 'investigating', 'approved']);

      if (activeRefunds && activeRefunds.length > 0) {
        console.log(`Auto-Release: Skipping Escrow ${escrow.id} because there is an active refund request.`);
        continue;
      }

      // 3. Atomically release funds
      const released = await releaseFunds(escrow.id, 'auto_7days');
      releasedRecords.push(released);
    } catch (err) {
      console.error(`Auto-Release: Failed to release Escrow ${escrow.id}:`, err);
    }
  }

  return {
    sweptCount: escrows?.length || 0,
    releasedCount: releasedRecords.length,
    releasedEscrows: releasedRecords.map(r => r.id),
  };
}
