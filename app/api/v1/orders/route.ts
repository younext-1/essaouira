import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { getOrdersByBuyer } from '@/lib/db/orders'
import { z } from 'zod'
import { OrderStatus } from '@/types/orders.types'

const querySchema = z.object({
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
  ]).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  page: z.preprocess((val) => Number(val ?? 1), z.number().int().min(1).default(1)),
  limit: z.preprocess((val) => Number(val ?? 10), z.number().int().min(1).max(100).default(10)),
});

export async function GET(request: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getProfileByClerkId(clerkId);
    if (!profile) {
      return NextResponse.json({ success: false, message: 'Profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const validation = querySchema.safeParse(params);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: 'Invalid query parameters',
        errors: validation.error.format()
      }, { status: 400 });
    }

    const validatedQuery = validation.data;

    const { orders, totalCount } = await getOrdersByBuyer(
      profile.id,
      {
        status: validatedQuery.status as OrderStatus | undefined,
        date_from: validatedQuery.date_from,
        date_to: validatedQuery.date_to
      },
      {
        page: validatedQuery.page,
        limit: validatedQuery.limit
      }
    );

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        totalCount
      }
    });

  } catch (error: any) {
    console.error('Error fetching buyer orders:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
