import { NextResponse } from 'next/server'
import { autoCompleteDeliveredOrders } from '@/lib/orders/auto-complete-worker'

export const dynamic = 'force-dynamic'

/**
 * POST /api/v1/cron/auto-complete
 * Hourly background worker to auto-complete delivered orders older than 48 hours.
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

    const { processedCount } = await autoCompleteDeliveredOrders()

    return NextResponse.json({
      success: true,
      data: {
        processed_count: processedCount
      },
      message: `Delivered orders auto-completion sweeper completed successfully. Processed ${processedCount} orders.`
    })
  } catch (err: any) {
    console.error('🔴 POST /api/v1/cron/auto-complete error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred during orders auto-completion.'
      },
      { status: 500 }
    )
  }
}
