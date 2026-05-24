import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { createClient } from '@/lib/supabase/server'
import { getSellerBalance } from '@/lib/db/payments'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 })
    }

    const profile = await getProfileByClerkId(clerkId)
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized: Profile not found.' }, { status: 404 })
    }

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

    // 2. Retrieve balance
    const balance = await getSellerBalance(store.id);

    return NextResponse.json({
      success: true,
      balance: {
        available: balance ? Number(balance.available_mad) : 0.00,
        pending: balance ? Number(balance.pending_mad) : 0.00,
        totalEarned: balance ? Number(balance.total_earned_mad) : 0.00,
        totalWithdrawn: balance ? Number(balance.total_withdrawn_mad) : 0.00,
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/v1/seller/balance:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: err.message }, { status: 500 })
  }
}
