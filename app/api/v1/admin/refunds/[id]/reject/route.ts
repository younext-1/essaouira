import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { createClient } from '@/lib/supabase/server'
import { logFinancialMutation } from '@/lib/db/payments'
import * as z from 'zod'

const rejectSchema = z.object({
  reason: z.string().min(1, { message: 'Rejection reason is required.' }),
  notes: z.string().optional().default('Rejected by Administrator.'),
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
    const parsed = rejectSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Malformed request body', details: parsed.error.format() }, { status: 400 })
    }

    const { reason, notes } = parsed.data
    const supabase = await createClient()

    // 1. Fetch the refund request
    const { data: refund, error: refundErr } = await supabase
      .from('refund_requests')
      .select('*, child_orders(*)')
      .eq('id', id)
      .single()

    if (refundErr || !refund) {
      return NextResponse.json({ error: 'Refund request not found.' }, { status: 404 })
    }

    if (refund.status === 'completed' || refund.status === 'approved' || refund.status === 'rejected') {
      return NextResponse.json({ error: `Refund request is already processed with status: ${refund.status}` }, { status: 400 })
    }

    const childOrderId = refund.child_order_id

    // 2. Restore child order status to 'confirmed' (removing dispute state)
    const { error: orderUpdateErr } = await supabase
      .from('child_orders')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', childOrderId)

    if (orderUpdateErr) {
      console.error('Error updating child order status:', orderUpdateErr)
      throw orderUpdateErr
    }

    // 3. Restore escrow ledger status to 'holding' (removing dispute state)
    const { error: escrowUpdateErr } = await supabase
      .from('escrow_ledgers')
      .update({
        status: 'holding',
        hold_reason: `Refund request rejected. Reason: ${reason}. Notes: ${notes}`,
        dispute_opened_at: null // Clear dispute timestamp
      })
      .eq('child_order_id', childOrderId)

    if (escrowUpdateErr) {
      console.error('Error updating escrow status:', escrowUpdateErr)
      throw escrowUpdateErr
    }

    // 4. Update refund request to rejected
    const { data: updatedRefund, error: refundUpdateErr } = await supabase
      .from('refund_requests')
      .update({
        status: 'rejected',
        reviewed_by: profile.id,
        resolution_notes: `Rejected: ${reason}. ${notes}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (refundUpdateErr) {
      console.error('Error updating refund request:', refundUpdateErr)
      throw refundUpdateErr
    }

    // 5. Log the financial mutation to audit_logs
    await logFinancialMutation({
      actor_id: profile.id,
      action: 'REFUND_REQUEST_REJECTED',
      target_type: 'refund_requests',
      target_id: id,
      metadata: { reason, notes, childOrderId },
    })

    return NextResponse.json({
      success: true,
      message: 'Refund request rejected and dispute resolved successfully.',
      refundRequest: updatedRefund,
    })
  } catch (err: any) {
    console.error('Error in POST /api/v1/admin/refunds/[id]/reject:', err)
    return NextResponse.json({ error: 'Internal Server Error', message: err.message }, { status: 500 })
  }
}
