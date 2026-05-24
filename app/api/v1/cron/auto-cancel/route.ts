import { NextResponse } from 'next/server'
import { autoCancelUnconfirmedOrders } from '@/lib/orders/auto-complete-worker'

export const dynamic = 'force-dynamic'

/**
 * POST /api/v1/cron/auto-cancel
 * Hourly background worker to auto-cancel pending orders older than 48 hours.
 * Secured via CRON_SECRET token match.
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, data: null, message: 'Unauthorized: Invalid or missing CRON_SECRET token.' },
        { status: 401 }
      )
    }

    const { processedCount, suspendedStoresCount } = await autoCancelUnconfirmedOrders()

    return NextResponse.json({
      success: true,
      data: {
        processed_count: processedCount,
        suspended_stores_count: suspendedStoresCount
      },
      message: `Unconfirmed orders auto-cancellation sweeper completed successfully. Cancelled ${processedCount} orders and suspended ${suspendedStoresCount} stores.`
    })
  } catch (err: any) {
    console.error('🔴 POST /api/v1/cron/auto-cancel error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred during orders auto-cancellation.'
      },
      { status: 500 }
    )
  }
}
