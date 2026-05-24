import { NextResponse } from 'next/server'
import { calculateDailyMetrics } from '@/lib/workers/store-metrics'

/**
 * POST /api/v1/cron/calculate-daily-metrics
 * Secures background execution. Checks authorization against local process env CRON_SECRET.
 * Optional query parameter: `date` (format YYYY-MM-DD) for backfilling specific calendar dates.
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Allow execution in development if CRON_SECRET is not configured
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, data: null, message: 'Unauthorized: Invalid or missing CRON_SECRET token.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const targetDate = dateParam ? new Date(dateParam) : undefined

    const result = await calculateDailyMetrics(targetDate)

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Store daily metrics aggregated successfully.',
    })
  } catch (err: any) {
    console.error('🔴 POST /api/v1/cron/calculate-daily-metrics error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected failure occurred during daily store metrics calculation.',
      },
      { status: 500 }
    )
  }
}
