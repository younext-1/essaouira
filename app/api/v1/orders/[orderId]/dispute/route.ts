import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { createClient } from '@/lib/supabase/server'
import { openDispute } from '@/lib/db/orders'
import { z } from 'zod'

const routeParamsSchema = z.object({
  orderId: z.string().uuid(),
});

const bodySchema = z.object({
  reason: z.enum([
    'item_not_received',
    'item_damaged',
    'item_not_as_described',
    'seller_unresponsive',
    'other'
  ]),
  description: z.string().min(10, 'Dispute description must be at least 10 characters long.'),
  evidenceUrls: z.array(z.string().url()).default([]),
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
    const paramValidation = routeParamsSchema.safeParse(resolvedParams);
    if (!paramValidation.success) {
      return NextResponse.json({ success: false, message: 'Invalid order ID parameter' }, { status: 400 });
    }

    const { orderId: childOrderId } = paramValidation.data;
    const body = await request.json();
    const bodyValidation = bodySchema.safeParse(body);

    if (!bodyValidation.success) {
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: bodyValidation.error.format()
      }, { status: 400 });
    }

    const validatedBody = bodyValidation.data;
    const supabase = await createClient();

    // Fetch child order and parent order to verify buyer ownership
    const { data: childOrder, error: childErr } = await supabase
      .from('child_orders')
      .select('*, parent_orders(*)')
      .eq('id', childOrderId)
      .maybeSingle();

    if (childErr || !childOrder) {
      return NextResponse.json({ success: false, message: 'Child order not found' }, { status: 404 });
    }

    const parentOrder = childOrder.parent_orders;
    if (!parentOrder || parentOrder.buyer_id !== profile.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized access to order' }, { status: 403 });
    }

    // Call openDispute helper. This will insert the dispute record.
    // The DB trigger trg_on_dispute_opened will automatically freeze the escrow.
    const dispute = await openDispute(childOrderId, profile.id, {
      reason: validatedBody.reason,
      description: validatedBody.description,
      evidenceUrls: validatedBody.evidenceUrls,
    });

    return NextResponse.json({
      success: true,
      data: dispute,
      message: 'Dispute successfully opened. Escrow funds have been frozen and the vendor has been notified.'
    });

  } catch (error: any) {
    console.error('Error opening order dispute:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
