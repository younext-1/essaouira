// API Route: app/api/v1/admin/shipping/active-shipments/route.ts
// Returns list of active in-transit shipments, filterable by carrier, status, and date range.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function verifyAdminAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized.');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
    throw new Error('Forbidden. Administrative privileges required.');
  }
}

export async function GET(request: Request) {
  try {
    await verifyAdminAccess();
    const adminClient = await createAdminClient();

    const { searchParams } = new URL(request.url);
    const carrierId = searchParams.get('carrierId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = adminClient
      .from('shipments')
      .select('*, carrier:carrier_configs(*), child_order:child_orders(id, store:stores(name))')
      .order('created_at', { ascending: false });

    // Apply active non-delivered standard fallback if no status parameter is specified
    if (status) {
      query = query.eq('status', status);
    } else {
      query = query.not('status', 'in', '("delivered","returned","failed_delivery")');
    }

    if (carrierId) {
      query = query.eq('carrier_id', carrierId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: shipments, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: shipments,
      message: 'Active shipments retrieved successfully.'
    });
  } catch (err: any) {
    console.error('🔴 GET /api/v1/admin/shipping/active-shipments error:', err);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'Failed to fetch active shipments.'
      },
      { status: err.message?.includes('Forbidden') ? 403 : err.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
