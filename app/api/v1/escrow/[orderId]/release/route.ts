import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { createClient } from '@/lib/supabase/server'
import { releaseFunds } from '@/lib/payments/escrow-manager'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId: childOrderId } = await params
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 })
    }

    const profile = await getProfileByClerkId(clerkId)
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized: Profile not found.' }, { status: 404 })
    }

    const supabase = await createClient();

    // 1. Retrieve the child order and make sure the buyer owns it (via parent_orders)
    const { data: childOrder, error: orderErr } = await supabase
      .from('child_orders')
      .select('*, parent_orders(*)')
      .eq('id', childOrderId)
      .single();

    if (orderErr || !childOrder) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    }

    if (childOrder.parent_orders.buyer_id !== profile.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this order.' }, { status: 403 })
    }

    // 2. Fetch the corresponding escrow ledger record
    const { data: escrow, error: escrowErr } = await supabase
      .from('escrow_ledgers')
      .select('*')
      .eq('child_order_id', childOrderId)
      .single();

    if (escrowErr || !escrow) {
      return NextResponse.json({ error: 'Escrow ledger entry not found for this order.' }, { status: 404 })
    }

    if (escrow.status !== 'holding') {
      return NextResponse.json({ error: `Escrow is already in state: ${escrow.status}` }, { status: 400 })
    }

    // 3. Release the funds
    const releasedEscrow = await releaseFunds(escrow.id, 'buyer_confirmed');

    return NextResponse.json({
      success: true,
      message: 'Delivery confirmed and escrow funds released to seller balance.',
      escrow: releasedEscrow,
    });
  } catch (err: any) {
    console.error('Error in POST /api/v1/escrow/[orderId]/release:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: err.message }, { status: 500 })
  }
}
