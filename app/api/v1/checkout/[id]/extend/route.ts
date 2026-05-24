import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { extendCheckoutExpiry } from '@/lib/checkout/checkout-manager'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/v1/checkout/[id]/extend
 * Extends the checkout session expiration and inventory stock locks by another 10 minutes.
 * Acts as a heartbeat during active buyer payment forms or gateway steps.
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: checkoutId } = await params

    // 1. Authenticate user
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json(
        { success: false, data: null, message: 'Unauthorized.' },
        { status: 401 }
      )
    }

    // 2. Fetch profile
    const profile = await getProfileByClerkId(clerkId)
    if (!profile) {
      return NextResponse.json(
        { success: false, data: null, message: 'Profile not found.' },
        { status: 404 }
      )
    }

    // 3. Extend session and lock expiry
    const session = await extendCheckoutExpiry(checkoutId)

    // 4. Authorize check
    if (session.buyer_id !== profile.id) {
      return NextResponse.json(
        { success: false, data: null, message: 'Forbidden. You do not own this checkout session.' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: session,
      message: 'Checkout session and stock reservation locks successfully extended by 10 minutes.'
    })
  } catch (err: any) {
    console.error('🔴 POST /api/v1/checkout/[id]/extend error:', err)
    return NextResponse.json(
      { success: false, data: null, message: err.message || 'Failed to extend checkout session.' },
      { status: 500 }
    )
  }
}
