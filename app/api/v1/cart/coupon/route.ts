import { NextResponse } from 'next/server'
import { z } from 'zod'
import { resolveCartSession } from '../route'
import { createClient } from '@/lib/supabase/server'
import { validateCoupon } from '@/lib/checkout/coupon-validator'
import { getCartSummary } from '@/lib/cart/cart-manager'

const applyCouponSchema = z.object({
  code: z.string().min(1).max(50)
})

/**
 * POST /api/v1/cart/coupon
 * Validates and applies a coupon code to the active cart.
 * If valid, updates the cart's coupon code and discount amount.
 */
export async function POST(request: Request) {
  try {
    const cart = await resolveCartSession()
    const body = await request.json().catch(() => ({}))

    const parsed = applyCouponSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Validation failed. Coupon code is required.',
          errors: parsed.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    const { code } = parsed.data
    const couponCode = code.trim().toUpperCase()

    // 1. Validate the coupon
    const validation = await validateCoupon(couponCode, cart.id, cart.buyer_id)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: validation.message || 'Coupon code is invalid or not applicable.'
        },
        { status: 400 }
      )
    }

    // 2. Update cart table
    const supabase = await createClient()
    const { error: updateError } = await supabase
      .from('carts')
      .update({
        coupon_code: couponCode,
        discount_amount: validation.discountAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', cart.id)

    if (updateError) throw updateError

    // 3. Fetch fresh summary
    const summary = await getCartSummary(cart.id)

    return NextResponse.json({
      success: true,
      data: summary,
      message: 'Coupon applied successfully.'
    })
  } catch (err: any) {
    console.error('🔴 POST /api/v1/cart/coupon error:', err)
    return NextResponse.json(
      { success: false, data: null, message: err.message || 'Failed to apply coupon.' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/cart/coupon
 * Removes the applied coupon code from the active cart.
 */
export async function DELETE(request: Request) {
  try {
    const cart = await resolveCartSession()
    const supabase = await createClient()

    // Remove coupon code and reset discount amount to 0
    const { error: updateError } = await supabase
      .from('carts')
      .update({
        coupon_code: null,
        discount_amount: 0.00,
        updated_at: new Date().toISOString()
      })
      .eq('id', cart.id)

    if (updateError) throw updateError

    // Fetch fresh summary
    const summary = await getCartSummary(cart.id)

    return NextResponse.json({
      success: true,
      data: summary,
      message: 'Coupon removed successfully.'
    })
  } catch (err: any) {
    console.error('🔴 DELETE /api/v1/cart/coupon error:', err)
    return NextResponse.json(
      { success: false, data: null, message: err.message || 'Failed to remove coupon.' },
      { status: 500 }
    )
  }
}
