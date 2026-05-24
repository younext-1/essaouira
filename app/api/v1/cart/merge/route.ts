import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { mergeGuestCart, getCartSummary } from '@/lib/cart/cart-manager'

const mergeCartSchema = z.object({
  guestToken: z.string().uuid()
})

/**
 * POST /api/v1/cart/merge
 * Merges a guest cart session into the authenticated buyer's active cart.
 * Quantities of duplicate items are summed. Guest cart is then flagged as 'merged'.
 */
export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json(
        { success: false, data: null, message: 'Unauthorized. You must be signed in to merge carts.' },
        { status: 401 }
      )
    }

    // 2. Fetch authenticated user's DB profile
    const profile = await getProfileByClerkId(clerkId)
    if (!profile) {
      return NextResponse.json(
        { success: false, data: null, message: 'Profile not found for authenticated user.' },
        { status: 404 }
      )
    }

    // 3. Validate request body
    const body = await request.json().catch(() => ({}))
    const parsed = mergeCartSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Validation failed.',
          errors: parsed.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    const { guestToken } = parsed.data

    // 4. Perform database merge
    const mergedCart = await mergeGuestCart(guestToken, profile.id)
    if (!mergedCart) {
      return NextResponse.json(
        { success: false, data: null, message: 'No active guest cart found for the provided token.' },
        { status: 404 }
      )
    }

    // 5. Get updated summary
    const summary = await getCartSummary(mergedCart.id)

    return NextResponse.json({
      success: true,
      data: summary,
      message: 'Guest cart merged successfully.'
    })
  } catch (err: any) {
    console.error('🔴 POST /api/v1/cart/merge error:', err)
    return NextResponse.json(
      { success: false, data: null, message: err.message || 'Failed to merge guest cart.' },
      { status: 500 }
    )
  }
}
