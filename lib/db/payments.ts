import { createClient } from '@/lib/supabase/server'
import { Transaction, EscrowLedger, SellerBalance, PayoutRequest } from '../payments.types'

/**
 * Log financial mutation to audit_logs table
 */
export async function logFinancialMutation(data: {
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string;
  metadata?: any;
}) {
  try {
    const supabase = await createClient();
    await supabase.from('audit_logs').insert({
      actor_id: data.actor_id,
      action: data.action,
      target_type: data.target_type,
      target_id: data.target_id,
      metadata: data.metadata ?? {},
      ip_address: '127.0.0.1',
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

/**
 * Fetch transaction by gateway transaction ID
 */
export async function getTransactionByGatewayId(gatewayTransactionId: string): Promise<Transaction | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('gateway_transaction_id', gatewayTransactionId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching transaction by gateway ID:', error);
    throw error;
  }
  return data as Transaction | null;
}

/**
 * Create new transaction record
 */
export async function createTransaction(data: Partial<Transaction>): Promise<Transaction> {
  const supabase = await createClient();
  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert({
      checkout_session_id: data.checkout_session_id,
      parent_order_id: data.parent_order_id,
      gateway: data.gateway,
      gateway_transaction_id: data.gateway_transaction_id,
      gateway_response: data.gateway_response ?? {},
      amount: data.amount,
      currency: data.currency ?? 'MAD',
      exchange_rate: data.exchange_rate ?? 1,
      amount_mad: data.amount_mad,
      platform_fee: data.platform_fee ?? 0.00,
      status: data.status ?? 'pending',
      paid_at: data.paid_at,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }

  await logFinancialMutation({
    actor_id: null,
    action: 'TRANSACTION_CREATE',
    target_type: 'transactions',
    target_id: transaction.id,
    metadata: { gateway: transaction.gateway, amount: transaction.amount_mad },
  });

  return transaction as Transaction;
}

/**
 * Update existing transaction status
 */
export async function updateTransactionStatus(
  id: string,
  status: Transaction['status'],
  gatewayResponse?: Record<string, any>
): Promise<Transaction> {
  const supabase = await createClient();
  const updateData: Record<string, any> = { status, updated_at: new Date().toISOString() };
  if (gatewayResponse) {
    updateData.gateway_response = gatewayResponse;
  }
  if (status === 'completed') {
    updateData.paid_at = new Date().toISOString();
  } else if (status === 'refunded') {
    updateData.refunded_at = new Date().toISOString();
  }

  const { data: transaction, error } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating transaction status:', error);
    throw error;
  }

  await logFinancialMutation({
    actor_id: null,
    action: `TRANSACTION_STATUS_UPDATE_${status.toUpperCase()}`,
    target_type: 'transactions',
    target_id: transaction.id,
    metadata: { status, gateway_response: gatewayResponse },
  });

  return transaction as Transaction;
}

/**
 * Fetch seller balance by store ID
 */
export async function getSellerBalance(storeId: string): Promise<SellerBalance | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('seller_balances')
    .select('*')
    .eq('store_id', storeId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching seller balance:', error);
    throw error;
  }
  return data as SellerBalance | null;
}

/**
 * Update seller balance available or pending amounts manually (e.g. for fee adjustments)
 */
export async function updateSellerBalance(
  storeId: string,
  type: 'available' | 'pending',
  amount: number
): Promise<SellerBalance> {
  const supabase = await createClient();
  const balance = await getSellerBalance(storeId);

  const available_mad = balance ? Number(balance.available_mad) : 0.00;
  const pending_mad = balance ? Number(balance.pending_mad) : 0.00;

  const targetAvailable = type === 'available' ? available_mad + amount : available_mad;
  const targetPending = type === 'pending' ? pending_mad + amount : pending_mad;

  const { data, error } = await supabase
    .from('seller_balances')
    .upsert({
      store_id: storeId,
      available_mad: targetAvailable,
      pending_mad: Math.max(0.00, targetPending),
      last_updated: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error updating seller balance:', error);
    throw error;
  }

  await logFinancialMutation({
    actor_id: null,
    action: `SELLER_BALANCE_MUTATED_${type.toUpperCase()}`,
    target_type: 'seller_balances',
    target_id: data.id,
    metadata: { storeId, type, amount, beforeAvailable: available_mad, afterAvailable: targetAvailable },
  });

  return data as SellerBalance;
}

/**
 * Create escrow ledger entry
 */
export async function createEscrowRecord(data: Partial<EscrowLedger>): Promise<EscrowLedger> {
  const supabase = await createClient();
  const { data: record, error } = await supabase
    .from('escrow_ledgers')
    .insert({
      transaction_id: data.transaction_id,
      child_order_id: data.child_order_id,
      store_id: data.store_id,
      gross_amount: data.gross_amount,
      platform_fee: data.platform_fee,
      shipping_fee: data.shipping_fee ?? 0.00,
      net_amount: data.net_amount,
      status: data.status ?? 'holding',
      hold_reason: data.hold_reason,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating escrow record:', error);
    throw error;
  }

  await logFinancialMutation({
    actor_id: null,
    action: 'ESCROW_CREATED',
    target_type: 'escrow_ledgers',
    target_id: record.id,
    metadata: { storeId: record.store_id, netAmount: record.net_amount },
  });

  return record as EscrowLedger;
}

/**
 * Update escrow record status
 */
export async function updateEscrowStatus(
  id: string,
  status: EscrowLedger['status'],
  trigger?: EscrowLedger['release_trigger']
): Promise<EscrowLedger> {
  const supabase = await createClient();
  const updateData: Record<string, any> = { status };
  if (status === 'released') {
    updateData.released_at = new Date().toISOString();
    updateData.release_trigger = trigger;
  } else if (status === 'disputed') {
    updateData.dispute_opened_at = new Date().toISOString();
  }

  const { data: record, error } = await supabase
    .from('escrow_ledgers')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating escrow status:', error);
    throw error;
  }

  await logFinancialMutation({
    actor_id: null,
    action: `ESCROW_STATUS_${status.toUpperCase()}`,
    target_type: 'escrow_ledgers',
    target_id: record.id,
    metadata: { status, trigger },
  });

  return record as EscrowLedger;
}

/**
 * Get all pending payout requests (for Admin view)
 */
export async function getPendingPayouts(): Promise<PayoutRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('payout_requests')
    .select('*')
    .eq('status', 'pending')
    .order('requested_at', { ascending: true });

  if (error) {
    console.error('Error getting pending payouts:', error);
    throw error;
  }
  return data as PayoutRequest[];
}

/**
 * Create a new payout request for a store
 */
export async function createPayoutRequest(
  storeId: string,
  data: { amount: number; method: PayoutRequest['method']; bank_details: any }
): Promise<PayoutRequest> {
  const supabase = await createClient();

  // Validate minimum amount is 100 MAD
  if (data.amount < 100.00) {
    throw new Error('Minimum payout amount is 100 MAD');
  }

  // Get available balance to verify
  const balance = await getSellerBalance(storeId);
  const available = balance ? Number(balance.available_mad) : 0.00;
  if (data.amount > available) {
    throw new Error('Insufficient available balance');
  }

  const { data: request, error } = await supabase
    .from('payout_requests')
    .insert({
      store_id: storeId,
      amount: data.amount,
      method: data.method,
      bank_details: data.bank_details,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating payout request:', error);
    throw error;
  }

  await logFinancialMutation({
    actor_id: null,
    action: 'PAYOUT_REQUEST_CREATED',
    target_type: 'payout_requests',
    target_id: request.id,
    metadata: { storeId, amount: data.amount },
  });

  return request as PayoutRequest;
}
