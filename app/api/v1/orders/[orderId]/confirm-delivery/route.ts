import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { createClient } from '@/lib/supabase/server'
import { transitionOrder } from '@/lib/orders/state-machine'
import { z } from 'zod'

const routeParamsSchema = z.object({
  orderId: z.string().uuid(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getProfileByClerkId(clerkId);
    if (!profile) {
      return NextResponse.json({ success: false, message: 'Profile not found' }, { status: 404 });
    }

    const resolvedParams = await params;
    const validation = routeParamsSchema.safeParse(resolvedParams);
    if (!validation.success) {
      return NextResponse.json({ success: false, message: 'Invalid order ID parameter' }, { status: 400 });
    }

    const { orderId: childOrderId } = validation.data;
    const supabase = await createClient();

    // Fetch child order and its parent order to check ownership
    const { data: childOrder, error: childErr } = await supabase
      .from('child_orders')
      .select('*, parent_orders(*)')
      .eq('id', childOrderId)
      .maybeSingle();

    if (childErr || !childOrder) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    const parentOrder = childOrder.parent_orders;
    if (!parentOrder || parentOrder.buyer_id !== profile.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized access to order' }, { status: 403 });
    }

    // Call state machine to execute transition to 'completed'
    const updatedOrder = await transitionOrder(
      childOrderId,
      'completed',
      profile.id,
      'buyer',
      'Buyer confirmed delivery received.'
    );

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Delivery successfully confirmed and payment released to seller.'
    });

  } catch (error: any) {
    console.error('Error confirming delivery:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
