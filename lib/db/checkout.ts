import { createClient } from '@/lib/supabase/server'
import type { CheckoutSession, AbandonedCheckout } from '../cart-checkout.types'

/**
 * Creates a new checkout session record.
 */
export async function createCheckoutSession(data: Omit<CheckoutSession, 'id' | 'created_at' | 'updated_at'>): Promise<CheckoutSession> {
  const supabase = await createClient()

  const { data: session, error } = await supabase
    .from('checkout_sessions')
    .insert({
      cart_id: data.cart_id,
      buyer_id: data.buyer_id,
      status: data.status,
      shipping_address: data.shipping_address,
      billing_address: data.billing_address || null,
      partitioned_stores: data.partitioned_stores,
      subtotal: data.subtotal,
      shipping_total: data.shipping_total,
      discount_amount: data.discount_amount,
      tax_amount: data.tax_amount,
      total_amount: data.total_amount,
      payment_intent_id: data.payment_intent_id || null,
      coupon_id: data.coupon_id || null,
      expires_at: data.expires_at
    })
    .select()
    .single()

  if (error) throw error
  return session as CheckoutSession;
}

/**
 * Fetches a checkout session by its UUID.
 */
export async function getCheckoutSession(id: string): Promise<CheckoutSession | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('checkout_sessions')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null
  return data as CheckoutSession
}

/**
 * Updates a checkout session status.
 */
export async function updateCheckoutStatus(id: string, status: CheckoutSession['status']): Promise<CheckoutSession> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('checkout_sessions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as CheckoutSession
}

/**
 * Retrieves checkouts abandoned a specific number of hours ago that haven't been recovered yet.
 */
export async function getAbandonedCheckouts(hoursAgo = 6): Promise<CheckoutSession[]> {
  const supabase = await createClient()
  const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()

  // Find all initiated or payment_failed sessions that were created before the cutoff,
  // are not completed, and are not yet marked as abandoned in the db or recovered.
  const { data, error } = await supabase
    .from('checkout_sessions')
    .select('*')
    .in('status', ['initiated', 'payment_pending', 'payment_failed'])
    .lt('created_at', cutoff)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as CheckoutSession[]) ?? []
}
