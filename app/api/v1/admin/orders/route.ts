import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const querySchema = z.object({
  status: z.string().optional(),
  store_id: z.string().uuid().optional(),
  buyer_id: z.string().uuid().optional(),
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
    if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
      return NextResponse.json({ success: false, message: 'Forbidden. Admin privileges required.' }, { status: 403 });
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
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;
    const supabase = await createClient();

    let query = supabase
      .from('child_orders')
      .select('*, parent_orders(*)', { count: 'exact' });

    if (validatedQuery.status) {
      query = query.eq('status', validatedQuery.status);
    }
    if (validatedQuery.store_id) {
      query = query.eq('store_id', validatedQuery.store_id);
    }
    if (validatedQuery.date_from) {
      query = query.gte('created_at', validatedQuery.date_from);
    }
    if (validatedQuery.date_to) {
      query = query.lte('created_at', validatedQuery.date_to);
    }

    // Filter by buyer_id (which is on parent_orders)
    if (validatedQuery.buyer_id) {
      // Subquery matches
      const { data: matchedParents } = await supabase
        .from('parent_orders')
        .select('id')
        .eq('buyer_id', validatedQuery.buyer_id);

      const matchedIds = matchedParents?.map((p) => p.id) ?? [];
      if (matchedIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page: validatedQuery.page, limit: validatedQuery.limit, totalCount: 0 }
        });
      }
      query = query.in('parent_id', matchedIds);
    }

    const { data: orders, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + validatedQuery.limit - 1);

    if (error) {
      console.error('Error fetching admin orders:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        totalCount: count ?? 0
      }
    });

  } catch (error: any) {
    console.error('Error in admin orders API:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
