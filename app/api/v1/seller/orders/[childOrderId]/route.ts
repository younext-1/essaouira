import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { getChildOrderById } from '@/lib/db/orders'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const paramsSchema = z.object({
  childOrderId: z.string().uuid(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ childOrderId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getProfileByClerkId(clerkId);
    if (!profile || profile.role !== 'artisan') {
      return NextResponse.json({ success: false, message: 'Seller profile not found' }, { status: 403 });
    }

    const validation = paramsSchema.safeParse(resolvedParams);
    if (!validation.success) {
      return NextResponse.json({ success: false, message: 'Invalid child order ID parameter' }, { status: 400 });
    }

    const { childOrderId } = validation.data;
    const supabase = await createClient();

    // Fetch the store of this seller
    const { data: store, error: storeErr } = await supabase
      .from('stores')
      .select('id')
      .eq('owner_id', profile.id)
      .maybeSingle();

    if (storeErr || !store) {
      return NextResponse.json({ success: false, message: 'Seller store not found' }, { status: 404 });
    }

    // Load full detailed seller view of child order
    const sellerView = await getChildOrderById(childOrderId, 'seller');

    // Security check: verify that this child order belongs to this store
    if (sellerView.store_id !== undefined && sellerView.store_id !== store.id) {
      // Sometime store_id might be wrapped. Let's do a double check on childOrder directly
      const { data: rawChild } = await supabase
        .from('child_orders')
        .select('store_id')
        .eq('id', childOrderId)
        .single();
      
      if (rawChild && rawChild.store_id !== store.id) {
        return NextResponse.json({ success: false, message: 'Unauthorized access to store order' }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      data: sellerView
    });

  } catch (error: any) {
    console.error('Error fetching seller order details:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
