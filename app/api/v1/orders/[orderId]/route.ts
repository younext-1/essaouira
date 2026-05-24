import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { createClient } from '@/lib/supabase/server'
import { getChildOrderById } from '@/lib/db/orders'
import { z } from 'zod'

const routeParamsSchema = z.object({
  orderId: z.string().uuid(),
});

export async function GET(
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

    const { orderId } = validation.data;
    const supabase = await createClient();

    // Try fetching as a Parent Order first
    const { data: parentOrder, error: parentErr } = await supabase
      .from('parent_orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (!parentErr && parentOrder) {
      // Security check: verify that this parent order belongs to the buyer
      if (parentOrder.buyer_id !== profile.id) {
        return NextResponse.json({ success: false, message: 'Unauthorized access to order' }, { status: 403 });
      }

      // Fetch all child orders for this parent
      const { data: childOrders, error: childErr } = await supabase
        .from('child_orders')
        .select('id')
        .eq('parent_id', orderId);

      if (childErr || !childOrders) {
        return NextResponse.json({ success: false, message: 'Failed to fetch store details' }, { status: 500 });
      }

      // Compile views for each child order using helper
      const compiledChildOrders = [];
      for (const child of childOrders) {
        const childView = await getChildOrderById(child.id, 'buyer');
        compiledChildOrders.push(childView);
      }

      return NextResponse.json({
        success: true,
        data: {
          parentOrder: {
            id: parentOrder.id,
            total: Number(parentOrder.total_amount),
            address: parentOrder.shipping_address,
            createdAt: parentOrder.created_at,
          },
          childOrders: compiledChildOrders
        }
      });
    }

    // Fallback: try fetching as a Child Order
    const childView = await getChildOrderById(orderId, 'buyer');
    if (!childView) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: childView });

  } catch (error: any) {
    console.error('Error fetching order details:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
