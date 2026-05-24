import { createClient } from '@/lib/supabase/server'
import type { CouponValidation } from '../cart-checkout.types'
import { getCartWithItems } from '../db/cart'

/**
 * Validates a coupon code against a specific active cart and buyer.
 */
export async function validateCoupon(
  code: string,
  cartId: string,
  buyerId: string | null
): Promise<CouponValidation> {
  const supabase = await createClient()

  // 1. Fetch Cart Details
  const cartDetails = await getCartWithItems(cartId)
  if (!cartDetails || cartDetails.items.length === 0) {
    return { valid: false, discountAmount: 0, discountType: null, message: 'Cart not found or empty.' }
  }

  // 2. Fetch Coupon from DB
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .eq('is_active', true)
    .maybeSingle()

  if (error || !coupon) {
    return { valid: false, discountAmount: 0, discountType: null, message: 'Invalid or inactive coupon code.' }
  }

  const now = new Date()
  const validFrom = new Date(coupon.valid_from)
  const validUntil = new Date(coupon.valid_until)

  // 3. Expiration Check
  if (now < validFrom || now > validUntil) {
    return { valid: false, discountAmount: 0, discountType: null, message: 'This coupon has expired.' }
  }

  // 4. Usage limit check (platform-wide)
  if (coupon.max_usages > 0 && coupon.used_count >= coupon.max_usages) {
    return { valid: false, discountAmount: 0, discountType: null, message: 'Coupon usage limit has been exceeded.' }
  }

  // 5. Per-buyer single-use check
  if (buyerId) {
    const { data: usage, error: usageError } = await supabase
      .from('coupon_usages')
      .select('*')
      .eq('coupon_id', coupon.id)
      .eq('buyer_id', buyerId)
      .maybeSingle()

    if (usage) {
      return { valid: false, discountAmount: 0, discountType: null, message: 'You have already used this coupon.' }
    }
  }

  // 6. Partition qualifying cart items based on applicable product/store scope
  const isGlobal = coupon.applicable_product_ids.length === 0 && coupon.applicable_store_ids.length === 0
  let qualifyingSubtotal = 0
  let totalSubtotal = 0

  for (const item of cartDetails.items) {
    const itemPrice = item.variant?.price_override !== undefined && item.variant.price_override !== null
      ? Number(item.variant.price_override)
      : Number(item.product.price)
    
    const lineTotal = itemPrice * item.quantity
    totalSubtotal += lineTotal

    if (isGlobal) {
      qualifyingSubtotal += lineTotal
    } else {
      const matchProduct = coupon.applicable_product_ids.includes(item.product_id)
      const matchStore = coupon.applicable_store_ids.includes(item.store_id)
      if (matchProduct || matchStore) {
        qualifyingSubtotal += lineTotal
      }
    }
  }

  // 7. Minimum Subtotal Check (enforced on total subtotal)
  if (totalSubtotal < Number(coupon.min_order_amount)) {
    return {
      valid: false,
      discountAmount: 0,
      discountType: null,
      message: `Minimum order amount of ${Number(coupon.min_order_amount).toFixed(2)} MAD is required for this coupon.`
    }
  }

  if (qualifyingSubtotal === 0) {
    return {
      valid: false,
      discountAmount: 0,
      discountType: null,
      message: 'This coupon is not applicable to any of the items in your cart.'
    }
  }

  // 8. Calculate Discount
  let discountAmount = 0
  if (coupon.discount_type === 'percentage') {
    discountAmount = qualifyingSubtotal * (Number(coupon.discount_value) / 100)
    if (coupon.max_discount_amount && discountAmount > Number(coupon.max_discount_amount)) {
      discountAmount = Number(coupon.max_discount_amount)
    }
  } else if (coupon.discount_type === 'fixed') {
    discountAmount = Number(coupon.discount_value)
  }

  // Cap discount at total subtotal
  if (discountAmount > totalSubtotal) {
    discountAmount = totalSubtotal
  }

  // Return final response with two-decimal-place rounding
  return {
    valid: true,
    discountAmount: Math.round(discountAmount * 100) / 100,
    discountType: coupon.discount_type as 'percentage' | 'fixed',
    message: 'Coupon applied successfully.'
  }
}
