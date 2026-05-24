import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { createClient } from '@/lib/supabase/server'
import { logFinancialMutation } from '@/lib/db/payments'
import * as z from 'zod'

const processSchema = z.object({
  referenceNumber: z.string().min(4, { message: 'Reference number must be provided' }),
})

export async function PATCH(
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
    const parsed = processSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Malformed request body', details: parsed.error.format() }, { status: 400 })
    }

    const { referenceNumber } = parsed.data
    const supabase = await createClient();

    // 1. Retrieve the request
    const { data: requestRecord, error: fetchErr } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !requestRecord) {
      return NextResponse.json({ error: 'Payout request not found.' }, { status: 404 })
    }

    if (requestRecord.status !== 'pending' && requestRecord.status !== 'processing') {
      return NextResponse.json({ error: `Payout request is already: ${requestRecord.status}` }, { status: 400 })
    }

    // 2. Mark request as completed (this triggers trg_on_payout_completed to deduct available balance!)
    const { data: updatedRecord, error: updateErr } = await supabase
      .from('payout_requests')
      .update({
        status: 'completed',
        reference_number: referenceNumber,
        processed_at: new Date().toISOString(),
        processed_by: profile.id,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateErr) throw updateErr

    await logFinancialMutation({
      actor_id: profile.id,
      action: 'PAYOUT_APPROVED_COMPLETED',
      target_type: 'payout_requests',
      target_id: id,
      metadata: { amount: Number(updatedRecord.amount), referenceNumber },
    });

    return NextResponse.json({
      success: true,
      message: 'Payout request marked as completed successfully.',
      payout: updatedRecord,
    });
  } catch (err: any) {
    console.error('Error in PATCH /api/v1/admin/payouts/[id]/process:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: err.message }, { status: 500 })
  }
}
