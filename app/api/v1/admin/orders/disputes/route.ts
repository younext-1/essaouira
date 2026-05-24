import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const querySchema = z.object({
  status: z.enum(['open', 'investigating', 'resolved', 'closed']).optional(),
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
      .from('order_disputes')
      .select('*, child_orders(*, stores(name))', { count: 'exact' });

    if (validatedQuery.status) {
      query = query.eq('status', validatedQuery.status);
    } else {
      // By default show open/active disputes first
      query = query.in('status', ['open', 'investigating']);
    }

    const { data: disputes, count, error } = await query
      .order('opened_at', { ascending: false })
      .range(offset, offset + validatedQuery.limit - 1);

    if (error) {
      console.error('Error fetching admin disputes queue:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: disputes,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        totalCount: count ?? 0
      }
    });

  } catch (error: any) {
    console.error('Error in admin disputes API:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
