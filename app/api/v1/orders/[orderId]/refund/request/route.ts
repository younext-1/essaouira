import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { createClient } from '@/lib/supabase/server'
import * as z from 'zod'

const refundRequestSchema = z.object({
  reason: z.enum(['not_received', 'damaged', 'not_as_described', 'changed_mind', 'other']),
  description: z.string().min(10, { message: 'Description must be at least 10 characters long' }),
  evidenceUrls: z.array(z.string().url()).optional().default([]),
  amountRequested: z.number().positive(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId: childOrderId } = await params
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 })
    }

    const profile = await getProfileByClerkId(clerkId)
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized: Profile not found.' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = refundRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Malformed request body', details: parsed.error.format() }, { status: 400 })
    }

    const { reason, description, evidenceUrls, amountRequested } = parsed.data
    const supabase = await createClient();

    // 1. Fetch child order and verify buyer ownership via parent order
    const { data: childOrder, error: orderErr } = await supabase
      .from('child_orders')
      .select('*, parent_orders(*)')
      .eq('id', childOrderId)
      .single();

    if (orderErr || !childOrder) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    }

    if (childOrder.parent_orders.buyer_id !== profile.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this order.' }, { status: 403 })
    }

    if (childOrder.status === 'refunded' || childOrder.status === 'cancelled') {
      return NextResponse.json({ error: `Cannot request a refund on an order with status: ${childOrder.status}` }, { status: 400 })
    }

    // 2. Validate amountRequested is <= childOrder total_amount
    const totalOrderAmount = Number(childOrder.total_amount);
    if (amountRequested > totalOrderAmount) {
      return NextResponse.json({ error: `Requested refund amount (${amountRequested} MAD) exceeds order total (${totalOrderAmount} MAD).` }, { status: 400 })
    }

    // 3. Create the refund request
    const { data: refundRequest, error: refundErr } = await supabase
      .from('refund_requests')
      .insert({
        child_order_id: childOrderId,
        buyer_id: profile.id,
        reason,
        description,
        evidence_urls: evidenceUrls,
        amount_requested: amountRequested,
        status: 'pending',
      })
      .select('*')
      .single();

    if (refundErr) throw refundErr

    // 4. Temporarily shift child order status to disputed if it was confirmed/shipped
    await supabase
      .from('child_orders')
      .update({ status: 'disputed', updated_at: new Date().toISOString() })
      .eq('id', childOrderId);

    // FreezeRelated Escrow Ledgers
    await supabase
      .from('escrow_ledgers')
      .update({
        status: 'disputed',
        dispute_opened_at: new Date().toISOString(),
        hold_reason: `Refund requested by buyer: ${reason}`,
      })
      .eq('child_order_id', childOrderId);

    return NextResponse.json({
      success: true,
      message: 'Refund request submitted successfully. Order and escrow funds have been disputed and locked.',
      refundRequest,
    }, { status: 201 });
  } catch (err: any) {
    console.error('Error in POST /api/v1/orders/[orderId]/refund/request:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: err.message }, { status: 500 })
  }
}
