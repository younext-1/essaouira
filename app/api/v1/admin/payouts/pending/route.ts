import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { getPendingPayouts } from '@/lib/db/payments'

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

    // Role verification (Admin only)
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 })
    }

    // Fetch pending requests
    const payouts = await getPendingPayouts();

    // Mask sensitive details
    const maskedPayouts = payouts.map(p => {
      const details = p.bank_details as any;
      if (details && details.rib) {
        const maskedRib = details.rib.substring(0, 3) + '*'.repeat(17) + details.rib.substring(20);
        return {
          ...p,
          bank_details: {
            ...details,
            rib: maskedRib,
          },
        };
      }
      return p;
    });

    return NextResponse.json({ success: true, pendingPayouts: maskedPayouts });
  } catch (err: any) {
    console.error('Error in GET /api/v1/admin/payouts/pending:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: err.message }, { status: 500 })
  }
}
