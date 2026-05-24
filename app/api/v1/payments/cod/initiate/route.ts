import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { getCheckoutSession } from '@/lib/db/checkout'
import { initiateCODOrder } from '@/lib/payments/cod-handler'
import * as z from 'zod'

const bodySchema = z.object({
  checkoutId: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 })
    }

    const profile = await getProfileByClerkId(clerkId)
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized: Profile not found.' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Malformed request body', details: parsed.error.format() }, { status: 400 })
    }

    const { checkoutId } = parsed.data

    // Fetch and validate checkout session
    const session = await getCheckoutSession(checkoutId)
    if (!session) {
      return NextResponse.json({ error: 'Checkout session not found.' }, { status: 404 })
    }

    if (session.status !== 'initiated' && session.status !== 'payment_pending') {
      return NextResponse.json({ error: `Checkout session is already in state: ${session.status}` }, { status: 400 })
    }

    if (session.buyer_id !== profile.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this checkout session.' }, { status: 403 })
    }

    // Call COD handler to initiate order
    const result = await initiateCODOrder(checkoutId);

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      childOrders: result.childOrders,
      instructions: result.instructions,
    });
  } catch (err: any) {
    console.error('Error in POST /api/v1/payments/cod/initiate:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: err.message }, { status: 500 })
  }
}
