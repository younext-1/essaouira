import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Cart, CheckoutSession, StoreCartSummary, FullCartItem, AbandonedCheckout } from '../cart-checkout.types'
import { getCartWithItems } from '../db/cart'
import { validateCoupon } from './coupon-validator'
import { reserveStock, releaseStock } from '../db/products'
import { createCheckoutSession, getCheckoutSession, updateCheckoutStatus } from '../db/checkout'
import crypto from 'crypto'

import { calculateStoreShipping } from '../shipping/calculator'


/**
 * Initializes a new checkout session.
 * 1. Checks available stock.
 * 2. Locks inventory for 10 minutes (TTL).
 * 3. Partitions products by store.
 * 4. Estimates shipping per store.
 * 5. Applies coupons.
 * 6. Creates a checkout session in the DB.
 */
export async function initializeCheckout(
  cartId: string,
  buyerId: string | null,
  shippingAddress: any,
  billingAddress?: any
): Promise<CheckoutSession> {
  const supabase = await createClient()

  // 1. Fetch Cart Details
  const cartDetails = await getCartWithItems(cartId)
  if (!cartDetails || cartDetails.items.length === 0) {
    throw new Error('Cart not found or is currently empty.')
  }

  const { cart, items } = cartDetails
  const sessionToken = crypto.randomUUID() // Used as checkout_session ID and lock checkout_id

  // 2. Lock inventory for all items in sequence.
  // If any single item lock fails, roll back all locks for this session.
  const acquiredLocks: { productId: string; variantId: string | null; qty: number }[] = []

  try {
    for (const item of items) {
      const lockSuccess = await reserveStock(item.product_id, item.variant_id, item.quantity, sessionToken)
      if (!lockSuccess) {
        throw new Error(`Insufficient stock for product '${item.product.name}'`)
      }
      acquiredLocks.push({ productId: item.product_id, variantId: item.variant_id, qty: item.quantity })
    }
  } catch (err: any) {
    // Release any locks that were already acquired in this transaction
    await releaseStock(sessionToken)
    throw new Error(`Checkout initialization failed: ${err.message}`)
  }

  // 3. Group and partition items by store
  const storeGroups: Record<string, { storeName: string; items: FullCartItem[] }> = {}
  for (const item of items) {
    const storeId = item.store_id
    if (!storeGroups[storeId]) {
      const { data: store } = await supabase
        .from('stores')
        .select('name')
        .eq('id', storeId)
        .maybeSingle()

      storeGroups[storeId] = {
        storeName: store?.name || 'Artisan Partner Store',
        items: []
      }
    }
    storeGroups[storeId].items.push(item)
  }

  // 4. Calculate store subtotals and shipping costs
  const partitionedStores: StoreCartSummary[] = []
  let subtotal = 0
  let shippingTotal = 0

  for (const [storeId, group] of Object.entries(storeGroups)) {
    let storeSubtotal = 0
    for (const item of group.items) {
      const price = item.variant?.price_override !== undefined && item.variant.price_override !== null
        ? Number(item.variant.price_override)
        : Number(item.product.price)
      storeSubtotal += price * item.quantity
    }

    const shippingInfo = await calculateStoreShipping(storeId, group.items, shippingAddress)
    const storeShipping = Number(shippingInfo.fee)
    
    subtotal += storeSubtotal
    shippingTotal += storeShipping

    partitionedStores.push({
      storeId,
      storeName: group.storeName,
      items: group.items,
      subtotal: Math.round(storeSubtotal * 100) / 100,
      shippingCost: Math.round(storeShipping * 100) / 100,
      storeTotal: Math.round((storeSubtotal + storeShipping) * 100) / 100
    })
  }

  // 5. Apply and validate coupon
  let discountAmount = 0.00
  let couponId = null

  if (cart.coupon_code) {
    const couponVal = await validateCoupon(cart.coupon_code, cartId, buyerId)
    if (couponVal.valid) {
      discountAmount = couponVal.discountAmount
      
      // Fetch coupon ID
      const { data: coupon } = await supabase
        .from('coupons')
        .select('id')
        .eq('code', cart.coupon_code.trim().toUpperCase())
        .maybeSingle()
      if (coupon) {
        couponId = coupon.id
      }
    }
  }

  // Cap discount at subtotal
  if (discountAmount > subtotal) {
    discountAmount = subtotal
  }

  const taxAmount = 0.00 // Included or platform fee
  const totalAmount = Math.max(0, subtotal + shippingTotal - discountAmount)

  // 6. Create database checkout session
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes session TTL
  
  const newSession = await createCheckoutSession({
    cart_id: cartId,
    buyer_id: buyerId,
    status: 'initiated',
    shipping_address: shippingAddress,
    billing_address: billingAddress || null,
    partitioned_stores: partitionedStores,
    subtotal: Math.round(subtotal * 100) / 100,
    shipping_total: Math.round(shippingTotal * 100) / 100,
    discount_amount: Math.round(discountAmount * 100) / 100,
    tax_amount: 0.00,
    total_amount: Math.round(totalAmount * 100) / 100,
    payment_intent_id: null,
    coupon_id: couponId,
    expires_at: expiresAt
  })

  // Set checkout session ID matching sessionToken in db if needed,
  // or return the newly created session which has its own UUID!
  // Note: in our SQL migration, we used the checkout session UUID. So we will update
  // the inventory locks checkout_id to match the session.id!
  const { error: lockUpdateError } = await supabase
    .from('inventory_locks')
    .update({ checkout_id: newSession.id })
    .eq('checkout_id', sessionToken)

  if (lockUpdateError) {
    // If locks update fails, release them
    await releaseStock(sessionToken)
    throw new Error('Failed to associate inventory locks with checkout session.')
  }

  return newSession
}

/**
 * Validates that the checkout session is active, has not expired,
 * and that inventory locks are still securely held.
 */
export async function validateCheckout(checkoutId: string): Promise<{ valid: boolean; session: CheckoutSession | null; message: string }> {
  const supabase = await createClient()

  // 1. Fetch Session
  const session = await getCheckoutSession(checkoutId)
  if (!session) {
    return { valid: false, session: null, message: 'Checkout session not found.' }
  }

  // 2. Check Expiry
  const now = new Date()
  const expiresAt = new Date(session.expires_at)
  if (now > expiresAt || session.status === 'abandoned' || session.status === 'completed') {
    return { valid: false, session, message: 'Checkout session has expired or is inactive.' }
  }

  // 3. Verify that the locks are still active and not released in inventory_locks
  const { data: activeLocks, error } = await supabase
    .from('inventory_locks')
    .select('*')
    .eq('checkout_id', checkoutId)
    .eq('released', false)

  if (error || !activeLocks || activeLocks.length === 0) {
    return { valid: false, session, message: 'Stock reservation locks have been released or expired.' }
  }

  return {
    valid: true,
    session,
    message: 'Checkout session is valid and inventory locks are secure.'
  }
}

/**
 * Abandons a checkout session.
 * Instantly releases all inventory locks, logs an abandoned_checkouts entry,
 * and schedules recovery tracking.
 */
export async function abandonCheckout(checkoutId: string): Promise<CheckoutSession> {
  const supabase = await createAdminClient() // Use admin client to write to locked tables bypass checks

  // 1. Get current session
  const session = await getCheckoutSession(checkoutId)
  if (!session) {
    throw new Error('Checkout session not found.')
  }

  if (session.status === 'abandoned') {
    return session
  }

  // 2. Release Stock Reservation Locks
  await releaseStock(checkoutId)

  // 3. Update session status to abandoned
  const updatedSession = await updateCheckoutStatus(checkoutId, 'abandoned')

  // 4. Resolve buyer email for recovery
  let buyerEmail = null
  if (session.buyer_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', session.buyer_id)
      .maybeSingle()
    buyerEmail = profile?.email || null
  }

  // 5. Generate abandoned_checkouts snapshot recovery token
  const recoveryToken = crypto.randomBytes(32).toString('hex')

  const { error: recoveryError } = await supabase
    .from('abandoned_checkouts')
    .insert({
      checkout_session_id: checkoutId,
      buyer_email: buyerEmail,
      cart_snapshot: {
        cart_id: session.cart_id,
        subtotal: session.subtotal,
        total_amount: session.total_amount,
        partitioned_stores: session.partitioned_stores
      },
      recovery_token: recoveryToken,
      discount_offered: 0.00
    })

  if (recoveryError) {
    console.error('Failed to log abandoned checkout recovery token:', recoveryError)
  }

  return updatedSession
}

/**
 * Extends the checkout session expiration and stock locks by another 10 minutes.
 * Invoked as a heartbeat while the user is actively filling out the payment gateway.
 */
export async function extendCheckoutExpiry(checkoutId: string): Promise<CheckoutSession> {
  const supabase = await createClient()

  // 1. Validate session is still active
  const { valid, session } = await validateCheckout(checkoutId)
  if (!valid || !session) {
    throw new Error('Cannot extend expired checkout session.')
  }

  // 2. Extend inventory locks TTL by 10 minutes
  const newLockExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString()
  const { error: lockError } = await supabase
    .from('inventory_locks')
    .update({ expires_at: newLockExpiry })
    .eq('checkout_id', checkoutId)
    .eq('released', false)

  if (lockError) throw lockError

  // 3. Extend session expiry
  const newSessionExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString()
  const { data: updatedSession, error: sessionError } = await supabase
    .from('checkout_sessions')
    .update({
      expires_at: newSessionExpiry,
      updated_at: new Date().toISOString()
    })
    .eq('id', checkoutId)
    .select()
    .single()

  if (sessionError) throw sessionError
  return updatedSession as CheckoutSession
}

/**
 * Recovers an abandoned checkout session using a recovery token.
 * Restores the items to the active cart.
 */
export async function recoverAbandonedCheckout(recoveryToken: string): Promise<Cart> {
  const supabase = await createClient()

  // 1. Fetch active abandoned checkout entry
  const { data: recovery, error } = await supabase
    .from('abandoned_checkouts')
    .select('*')
    .eq('recovery_token', recoveryToken)
    .is('recovered_at', null)
    .maybeSingle()

  if (error || !recovery) {
    throw new Error('Recovery token is invalid or has already been used.')
  }

  // 2. Fetch checkout session
  const session = await getCheckoutSession(recovery.checkout_session_id)
  if (!session) {
    throw new Error('Associated checkout session not found.')
  }

  // 3. Mark recovery record as used
  await supabase
    .from('abandoned_checkouts')
    .update({ recovered_at: new Date().toISOString() })
    .eq('id', recovery.id)

  // 4. Reactivate and return Cart details
  const { data: cart } = await supabase
    .from('carts')
    .update({ status: 'active' })
    .eq('id', session.cart_id)
    .select()
    .single()

  return cart as Cart
}
