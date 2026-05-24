import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { getOrCreateCart, getCartSummary, clearCart } from '@/lib/cart/cart-manager'
import crypto from 'crypto'

/**
 * Resolves the current active cart session.
 * Works for both authenticated buyers and guest sessions using httpOnly cookies.
 */
export async function resolveCartSession() {
  const { userId: clerkId } = await auth()
  let buyerId: string | null = null

  if (clerkId) {
    const profile = await getProfileByClerkId(clerkId)
    if (profile) {
      buyerId = profile.id
    }
  }

  const cookieStore = await cookies()
  let guestToken = cookieStore.get('cart_token')?.value

  if (!buyerId && !guestToken) {
    guestToken = crypto.randomUUID()
    cookieStore.set('cart_token', guestToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    })
  }

  const cart = await getOrCreateCart(buyerId, guestToken)
  return cart
}

/**
 * GET /api/v1/cart
 * Retrieves the current cart summary grouped by store with subtotals.
 */
export async function GET(request: Request) {
  try {
    const cart = await resolveCartSession()
    const summary = await getCartSummary(cart.id)

    return NextResponse.json({
      success: true,
      data: summary,
      message: 'Cart retrieved successfully.'
    })
  } catch (err: any) {
    console.error('🔴 GET /api/v1/cart error:', err)
    return NextResponse.json(
      { success: false, data: null, message: err.message || 'Failed to retrieve cart.' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/cart
 * Clears the entire cart, deleting all items and resetting applied discounts.
 */
export async function DELETE(request: Request) {
  try {
    const cart = await resolveCartSession()
    const cleared = await clearCart(cart.id)

    return NextResponse.json({
      success: true,
      data: cleared,
      message: 'Cart cleared successfully.'
    })
  } catch (err: any) {
    console.error('🔴 DELETE /api/v1/cart error:', err)
    return NextResponse.json(
      { success: false, data: null, message: err.message || 'Failed to clear cart.' },
      { status: 500 }
    )
  }
}
