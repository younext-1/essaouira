import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { createClient } from '@/lib/supabase/server'
import { createRefund } from '@/lib/payments/stripe'
import { logFinancialMutation } from '@/lib/db/payments'
import * as z from 'zod'

const approveSchema = z.object({
  notes: z.string().optional().default('Approved by Administrator.'),
  approvedAmount: z.number().positive(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 })
    }

    const profile = await getProfileByClerkId(clerkId)
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized: Profile not found.' }, { status: 404 })
    }

    // Role check (Admin only)
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = approveSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Malformed request body', details: parsed.error.format() }, { status: 400 })
    }

    const { notes, approvedAmount } = parsed.data
    const supabase = await createClient();

    // 1. Fetch the refund request
    const { data: refund, error: refundErr } = await supabase
      .from('refund_requests')
      .select('*, child_orders(*)')
      .eq('id', id)
      .single();

    if (refundErr || !refund) {
      return NextResponse.json({ error: 'Refund request not found.' }, { status: 404 })
    }

    if (refund.status === 'completed' || refund.status === 'approved') {
      return NextResponse.json({ error: 'Refund request is already processed.' }, { status: 400 })
    }

    if (approvedAmount > Number(refund.amount_requested)) {
      return NextResponse.json({ error: `Approved amount (${approvedAmount}) cannot exceed requested amount (${refund.amount_requested})` }, { status: 400 })
    }

    const childOrderId = refund.child_order_id;
    const parentOrderId = refund.child_orders.parent_order_id;

    // 2. Fetch the linked transaction to determine the gateway
    const { data: transaction, error: txErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('parent_order_id', parentOrderId)
      .single();

    if (txErr || !transaction) {
      return NextResponse.json({ error: 'Linked transaction not found.' }, { status: 404 })
    }

    // 3. Process Stripe refund if gateway is stripe
    if (transaction.gateway === 'stripe') {
      // Calls createRefund which refunds via Stripe and updates db status
      await createRefund(transaction.id, approvedAmount, refund.reason);
    } else {
      // If COD, we just mark transaction/escrow as refunded since no online card exists
      await supabase
        .from('transactions')
        .update({ status: 'refunded', refunded_at: new Date().toISOString() })
        .eq('id', transaction.id);

      await supabase
        .from('escrow_ledgers')
        .update({
          status: 'refunded',
          released_at: new Date().toISOString(),
          release_trigger: 'admin_manual',
          hold_reason: `COD Refund approved manually: ${notes}`,
        })
        .eq('child_order_id', childOrderId);
    }

    // 4. Update child order status to refunded
    await supabase
      .from('child_orders')
      .update({ status: 'refunded', updated_at: new Date().toISOString() })
      .eq('id', childOrderId);

    // 5. Update refund request to completed
    const { data: updatedRefund } = await supabase
      .from('refund_requests')
      .update({
        status: 'completed',
        amount_approved: approvedAmount,
        reviewed_by: profile.id,
        resolution_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    await logFinancialMutation({
      actor_id: profile.id,
      action: 'REFUND_REQUEST_APPROVED',
      target_type: 'refund_requests',
      target_id: id,
      metadata: { approvedAmount, gateway: transaction.gateway },
    });

    return NextResponse.json({
      success: true,
      message: 'Refund request approved and processed successfully.',
      refundRequest: updatedRefund,
    });
  } catch (err: any) {
    console.error('Error in POST /api/v1/admin/refunds/[id]/approve:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: err.message }, { status: 500 })
  }
}
