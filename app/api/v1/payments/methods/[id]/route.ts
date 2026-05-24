import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 })
    }

    const profile = await getProfileByClerkId(clerkId)
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized: Profile not found.' }, { status: 404 })
    }

    const supabase = await createClient();

    // Verify ownership first
    const { data: method, error: fetchErr } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !method) {
      return NextResponse.json({ error: 'Payment method not found.' }, { status: 404 })
    }

    if (method.buyer_id !== profile.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this payment method.' }, { status: 403 })
    }

    const { error: deleteErr } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', id);

    if (deleteErr) throw deleteErr

    return NextResponse.json({ success: true, message: 'Payment method removed successfully.' });
  } catch (err: any) {
    console.error('Error in DELETE /api/v1/payments/methods/[id]:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: err.message }, { status: 500 })
  }
}
