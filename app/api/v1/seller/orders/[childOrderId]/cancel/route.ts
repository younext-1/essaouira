import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { createClient } from '@/lib/supabase/server'
import { transitionOrder } from '@/lib/orders/state-machine'
import { z } from 'zod'

const paramsSchema = z.object({
  childOrderId: z.string().uuid(),
});

const bodySchema = z.object({
  reason: z.string().min(5, 'Cancellation reason must be at least 5 characters long.'),
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

    const paramValidation = paramsSchema.safeParse(resolvedParams);
    if (!paramValidation.success) {
      return NextResponse.json({ success: false, message: 'Invalid child order ID parameter' }, { status: 400 });
    }

    const { childOrderId } = paramValidation.data;

    const body = await request.json();
    const bodyValidation = bodySchema.safeParse(body);
    if (!bodyValidation.success) {
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: bodyValidation.error.format()
      }, { status: 400 });
    }

    const { reason } = bodyValidation.data;
    const supabase = await createClient();

    // Fetch store of this seller
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

    // Save cancellation reason on the child order record
    const { error: cancelErr } = await supabase
      .from('child_orders')
      .update({
        cancellation_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', childOrderId);

    if (cancelErr) {
      console.error('Failed to save cancellation reason:', cancelErr);
      throw new Error('Failed to update cancellation reason.');
    }

    // Transition state to cancelled
    const updatedOrder = await transitionOrder(
      childOrderId,
      'cancelled',
      profile.id,
      'seller',
      `Artisan cancelled the order. Reason: ${reason}`
    );

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Order successfully cancelled and inventory stock restored.'
    });

  } catch (error: any) {
    console.error('Error cancelling order:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
