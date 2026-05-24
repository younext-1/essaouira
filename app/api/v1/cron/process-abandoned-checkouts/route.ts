import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAbandonedCheckouts } from '@/lib/db/checkout'
import { abandonCheckout } from '@/lib/checkout/checkout-manager'

export const dynamic = 'force-dynamic'

/**
 * POST /api/v1/cron/process-abandoned-checkouts
 * Background cron worker. Runs every few hours to identify uncompleted checkouts
 * that are older than 6 hours. Automatically marks them as abandoned,
 * releases their inventory locks, and registers an abandoned checkout recovery token.
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

    // 1. Fetch checkouts initiated > 6 hours ago that are not yet marked abandoned or completed
    const abandonedSessions = await getAbandonedCheckouts(6)
    
    const processed: string[] = []
    const failures: { id: string; error: string }[] = []

    // 2. Iterate and transition them to 'abandoned' status
    for (const session of abandonedSessions) {
      try {
        await abandonCheckout(session.id)
        processed.push(session.id)
      } catch (err: any) {
        console.error(`Failed to process abandoned session ${session.id}:`, err)
        failures.push({ id: session.id, error: err.message || 'Unknown error' })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total_found: abandonedSessions.length,
        processed_count: processed.length,
        processed_ids: processed,
        failures
      },
      message: `Abandoned checkouts processing completed. Successfully abandoned ${processed.length} of ${abandonedSessions.length} uncompleted checkout sessions.`
    })
  } catch (err: any) {
    console.error('🔴 POST /api/v1/cron/process-abandoned-checkouts error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred while sweeping abandoned checkouts.'
      },
      { status: 500 }
    )
  }
}
