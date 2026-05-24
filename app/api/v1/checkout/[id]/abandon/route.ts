import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { abandonCheckout } from '@/lib/checkout/checkout-manager'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/v1/checkout/[id]/abandon
 * Explicitly abandons the active checkout session.
 * Instantly releases all inventory stock reservations back to public catalog,
 * logs a recovery token for recovery tracking, and sets status to 'abandoned'.
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

    // 3. Mark session abandoned and release inventory locks
    const session = await abandonCheckout(checkoutId)

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
      message: 'Checkout session successfully abandoned. Stock reservations have been released back to catalog.'
    })
  } catch (err: any) {
    console.error('🔴 POST /api/v1/checkout/[id]/abandon error:', err)
    return NextResponse.json(
      { success: false, data: null, message: err.message || 'Failed to abandon checkout session.' },
      { status: 500 }
    )
  }
}
