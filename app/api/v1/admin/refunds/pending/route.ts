import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 })
    }

    const profile = await getProfileByClerkId(clerkId)
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized: Profile not found.' }, { status: 404 })
    }

    // Role check (Admin only)
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 })
    }

    const supabase = await createClient();

    // Query all pending or investigating refund requests
    const { data: refunds, error } = await supabase
      .from('refund_requests')
      .select('*, profiles(full_name, email), child_orders(*)')
      .in('status', ['pending', 'investigating'])
      .order('created_at', { ascending: true });

    if (error) throw error

    return NextResponse.json({ success: true, pendingRefunds: refunds });
  } catch (err: any) {
    console.error('Error in GET /api/v1/admin/refunds/pending:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: err.message }, { status: 500 })
  }
}
