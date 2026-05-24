import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 })
    }

    const profile = await getProfileByClerkId(clerkId)
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized: Profile not found.' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10')));
    const offset = (page - 1) * limit;

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

    // 2. Query paginated payout requests
    const { data: payouts, error: payoutErr, count } = await supabase
      .from('payout_requests')
      .select('*', { count: 'exact' })
      .eq('store_id', store.id)
      .order('requested_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (payoutErr) throw payoutErr

    // 3. Mask sensitive bank details
    const maskedPayouts = (payouts || []).map(p => {
      const details = p.bank_details as any;
      if (details && details.rib) {
        const maskedRib = details.rib.substring(0, 3) + '*'.repeat(17) + details.rib.substring(20);
        return {
          ...p,
          bank_details: {
            ...details,
            rib: maskedRib,
          },
        };
      }
      return p;
    });

    return NextResponse.json({
      success: true,
      payouts: maskedPayouts,
      pagination: {
        page,
        limit,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/v1/seller/payouts:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: err.message }, { status: 500 })
  }
}
