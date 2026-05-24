import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { transitionOrder } from '@/lib/orders/state-machine'
import { z } from 'zod'
import { OrderStatus } from '@/types/orders.types'

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const bodySchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'out_for_delivery',
    'delivered',
    'completed',
    'cancelled',
    'refund_requested',
    'refunded'
  ]),
  note: z.string().min(5, 'Override note must be at least 5 characters long.'),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getProfileByClerkId(clerkId);
    if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
      return NextResponse.json({ success: false, message: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    const paramValidation = paramsSchema.safeParse(resolvedParams);
    if (!paramValidation.success) {
      return NextResponse.json({ success: false, message: 'Invalid child order ID parameter' }, { status: 400 });
    }

    const { id: childOrderId } = paramValidation.data;

    const body = await request.json();
    const bodyValidation = bodySchema.safeParse(body);
    if (!bodyValidation.success) {
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: bodyValidation.error.format()
      }, { status: 400 });
    }

    const { status, note } = bodyValidation.data;

    // Call state machine as 'admin' role (bypasses transition path guards but updates DB properly)
    const updatedOrder = await transitionOrder(
      childOrderId,
      status as OrderStatus,
      profile.id,
      'admin',
      `Forced transition by Admin/Moderator. Rationale: ${note}`
    );

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: `Order status successfully forced to ${status} by administrator.`
    });

  } catch (error: any) {
    console.error('Error in admin forced transition:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
