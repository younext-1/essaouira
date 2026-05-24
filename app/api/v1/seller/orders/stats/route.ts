import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { getSellerOrderStats } from '@/lib/db/orders'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getProfileByClerkId(clerkId);
    if (!profile || profile.role !== 'artisan') {
      return NextResponse.json({ success: false, message: 'Seller profile not found' }, { status: 403 });
    }

    const supabase = await createClient();

    // Fetch store belonging to this artisan
    const { data: store, error: storeErr } = await supabase
      .from('stores')
      .select('id')
      .eq('owner_id', profile.id)
      .maybeSingle();

    if (storeErr || !store) {
      return NextResponse.json({ success: false, message: 'Store not found' }, { status: 404 });
    }

    const stats = await getSellerOrderStats(store.id);

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('Error fetching seller stats:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
