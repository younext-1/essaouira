import { NextResponse } from 'next/server'
import { recoverAbandonedCheckout } from '@/lib/checkout/checkout-manager'
import { getCartSummary } from '@/lib/cart/cart-manager'

interface RouteParams {
  params: Promise<{ token: string }>
}

/**
 * GET /api/v1/checkout/recover/[token]
 * Restores and reactivates a previously abandoned cart from a secure recovery token.
 * Flags the recovery record as used, resets the cart status to 'active',
 * and returns the updated cart summary.
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { token } = await params

    if (!token) {
      return NextResponse.json(
        { success: false, data: null, message: 'Recovery token is required.' },
        { status: 400 }
      )
    }

    // 1. Process recovery and get reactivated cart
    const cart = await recoverAbandonedCheckout(token)

    // 2. Fetch updated summary
    const summary = await getCartSummary(cart.id)

    return NextResponse.json({
      success: true,
      data: summary,
      message: 'Cart successfully recovered and reactivated. You can now proceed to checkout.'
    })
  } catch (err: any) {
    console.error('🔴 GET /api/v1/checkout/recover/[token] error:', err)
    return NextResponse.json(
      { success: false, data: null, message: err.message || 'Failed to recover checkout cart.' },
      { status: 400 }
    )
  }
}
