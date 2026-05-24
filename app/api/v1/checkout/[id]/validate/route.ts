import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { validateCheckout } from '@/lib/checkout/checkout-manager'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/v1/checkout/[id]/validate
 * Re-validates that the checkout session is active and stock reservation locks are still securely held.
 * Prevents orders from completing with leaked or expired inventory holds.
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

    // 3. Perform checkout validation (session active + locks valid)
    const result = await validateCheckout(checkoutId)

    if (!result.session) {
      return NextResponse.json(
        { success: false, data: null, message: result.message },
        { status: 404 }
      )
    }

    // 4. Authorize check
    if (result.session.buyer_id !== profile.id) {
      return NextResponse.json(
        { success: false, data: null, message: 'Forbidden. You do not own this checkout session.' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: result.valid,
      data: {
        valid: result.valid,
        expiresAt: result.session.expires_at
      },
      message: result.message
    })
  } catch (err: any) {
    console.error('🔴 POST /api/v1/checkout/[id]/validate error:', err)
    return NextResponse.json(
      { success: false, data: null, message: err.message || 'Failed to validate checkout session.' },
      { status: 500 }
    )
  }
}
