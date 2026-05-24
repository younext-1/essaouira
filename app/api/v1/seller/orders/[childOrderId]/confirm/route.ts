import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { createClient } from '@/lib/supabase/server'
import { transitionOrder } from '@/lib/orders/state-machine'
import { z } from 'zod'

const paramsSchema = z.object({
  childOrderId: z.string().uuid(),
});

export async function POST(
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

    // Verify child order belongs to this store
    const { data: childOrder, error: childErr } = await supabase
      .from('child_orders')
      .select('status, store_id')
      .eq('id', childOrderId)
      .maybeSingle();

    if (childErr || !childOrder) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    if (childOrder.store_id !== store.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized access to order' }, { status: 403 });
    }

    // Transition state from pending to confirmed
    const updatedOrder = await transitionOrder(
      childOrderId,
      'confirmed',
      profile.id,
      'seller',
      'Artisan confirmed and accepted the order.'
    );

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Order successfully confirmed.'
    });

  } catch (error: any) {
    console.error('Error confirming order:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
