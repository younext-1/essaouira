import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * POST /api/v1/cron/release-expired-locks
 * Background cron worker. Automatically releases stock reservation locks that have exceeded their 10-minute TTL.
 * Secured via CRON_SECRET token match.
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Enforce background service credentials check
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, data: null, message: 'Unauthorized: Invalid or missing CRON_SECRET token.' },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()

    // Execute Postgres atomic locks release RPC
    const { data: releasedCount, error } = await supabase.rpc('release_expired_locks')

    if (error) {
      console.error('Failed to execute release_expired_locks RPC in cron:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      data: {
        released_count: releasedCount || 0
      },
      message: `Expired inventory locks release task completed successfully. Released ${releasedCount || 0} locks.`
    })
  } catch (err: any) {
    console.error('🔴 POST /api/v1/cron/release-expired-locks error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred while releasing expired inventory locks.'
      },
      { status: 500 }
    )
  }
}
