import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { createClient } from '@/lib/supabase/server'
import { createPayoutRequest } from '@/lib/db/payments'
import * as z from 'zod'

const payoutRequestSchema = z.object({
  amount: z.number().min(100, { message: 'Minimum payout is 100 MAD' }),
  method: z.enum(['bank_transfer', 'cash', 'mobile_money']),
  bankDetails: z.object({
    bank_name: z.string().min(2),
    account_holder: z.string().min(2),
    rib: z.string().min(24, { message: 'Moroccan RIB must be exactly 24 digits' }).max(24),
  }),
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
    const parsed = payoutRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Malformed request body', details: parsed.error.format() }, { status: 400 })
    }

    const { amount, method, bankDetails } = parsed.data
    const supabase = await createClient();

    // 1. Fetch store owned by the seller
    const { data: store, error: storeErr } = await supabase
      .from('stores')
      .select('id')
      .eq('owner_id', profile.id)
      .single();

    if (storeErr || !store) {
      return NextResponse.json({ error: 'Seller store not found.' }, { status: 404 })
    }

    // 2. Submit request
    const payout = await createPayoutRequest(store.id, {
      amount,
      method,
      bank_details: bankDetails,
    });

    // 3. Mask sensitive details for response
    const maskedRib = bankDetails.rib.substring(0, 3) + '*'.repeat(17) + bankDetails.rib.substring(20);
    const responsePayout = {
      ...payout,
      bank_details: {
        bank_name: bankDetails.bank_name,
        account_holder: bankDetails.account_holder,
        rib: maskedRib,
      },
    };

    return NextResponse.json({
      success: true,
      message: 'Payout request submitted successfully.',
      payout: responsePayout,
    }, { status: 201 });
  } catch (err: any) {
    console.error('Error in POST /api/v1/seller/payouts/request:', err);
    return NextResponse.json({ error: 'Failed to create payout request', message: err.message }, { status: 400 })
  }
}
