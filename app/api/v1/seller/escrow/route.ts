import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { createClient } from '@/lib/supabase/server'

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

    // 2. Fetch all escrow records for the store
    const { data: escrows, error: escrowErr } = await supabase
      .from('escrow_ledgers')
      .select('*')
      .eq('store_id', store.id)
      .order('held_at', { ascending: false });

    if (escrowErr) throw escrowErr

    // 3. Compute aggregations
    let holding = 0;
    let released = 0;
    let disputed = 0;
    let refunded = 0;

    for (const escrow of escrows || []) {
      const net = Number(escrow.net_amount);
      if (escrow.status === 'holding') holding += net;
      else if (escrow.status === 'released') released += net;
      else if (escrow.status === 'disputed') disputed += net;
      else if (escrow.status === 'refunded') refunded += net;
    }

    return NextResponse.json({
      success: true,
      totals: {
        holding: Math.round(holding * 100) / 100,
        released: Math.round(released * 100) / 100,
        disputed: Math.round(disputed * 100) / 100,
        refunded: Math.round(refunded * 100) / 100,
      },
      escrows,
    });
  } catch (err: any) {
    console.error('Error in GET /api/v1/seller/escrow:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: err.message }, { status: 500 })
  }
}
