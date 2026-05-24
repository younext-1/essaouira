import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { getCheckoutSession } from '@/lib/db/checkout'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/v1/checkout/[id]
 * Retrieves the details of a specific checkout session.
 * Restricts access only to the buyer who created the session.
 */
export async function GET(request: Request, { params }: RouteParams) {
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

    // 3. Fetch checkout session
    const session = await getCheckoutSession(checkoutId)
    if (!session) {
      return NextResponse.json(
        { success: false, data: null, message: 'Checkout session not found.' },
        { status: 404 }
      )
    }

    // 4. Authorize check (ensure buyer owns session)
    if (session.buyer_id !== profile.id) {
      return NextResponse.json(
        { success: false, data: null, message: 'Forbidden. You do not own this checkout session.' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: session,
      message: 'Checkout session retrieved successfully.'
    })
  } catch (err: any) {
    console.error('🔴 GET /api/v1/checkout/[id] error:', err)
    return NextResponse.json(
      { success: false, data: null, message: err.message || 'Failed to retrieve checkout session.' },
      { status: 500 }
    )
  }
}
