import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { getOrdersBySeller, getChildOrderById } from '@/lib/db/orders'
import { createClient } from '@/lib/supabase/server'
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
    if (!profile || profile.role !== 'artisan') {
      return NextResponse.json({ success: false, message: 'Seller profile not found' }, { status: 403 });
    }

    const supabase = await createClient();

    // Fetch the store belonging to this artisan
    const { data: store, error: storeErr } = await supabase
      .from('stores')
      .select('id')
      .eq('owner_id', profile.id)
      .maybeSingle();

    if (storeErr || !store) {
      return NextResponse.json({ success: false, message: 'Store onboarding not completed or store not found' }, { status: 404 });
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

    const { orders: childOrders, totalCount } = await getOrdersBySeller(
      store.id,
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

    // Hydrate each child order with anonymized buyer details and item details
    const compiledOrders = [];
    for (const child of childOrders) {
      const detailedView = await getChildOrderById(child.id, 'seller');
      compiledOrders.push(detailedView);
    }

    return NextResponse.json({
      success: true,
      data: compiledOrders,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        totalCount
      }
    });

  } catch (error: any) {
    console.error('Error fetching seller orders:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
