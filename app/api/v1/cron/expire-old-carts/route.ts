import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * POST /api/v1/cron/expire-old-carts
 * Background cron worker. Runs daily to clean up inactive carts.
 * 1. Identifies and marks active carts that have been inactive for over 30 days (expires_at < NOW()) as 'abandoned'.
 * 2. Purges guest carts that are expired and abandoned to save storage.
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
    const now = new Date().toISOString()

    // 1. Mark active carts whose expires_at has passed as 'abandoned'
    const { data: abandonedCarts, error: updateError } = await supabase
      .from('carts')
      .update({
        status: 'abandoned',
        updated_at: now
      })
      .eq('status', 'active')
      .lt('expires_at', now)
      .select('id')

    if (updateError) {
      console.error('Failed to mark expired carts abandoned:', updateError)
      throw updateError
    }

    // 2. Purge guest carts that are expired and either marked as 'abandoned' or 'merged'
    // This keeps the database from accumulating millions of dead guest cart sessions.
    const { error: purgeError, count } = await supabase
      .from('carts')
      .delete({ count: 'exact' })
      .not('guest_token', 'is', null) // Only guest carts
      .in('status', ['abandoned', 'merged'])
      .lt('expires_at', now)

    if (purgeError) {
      console.error('Failed to purge old guest carts:', purgeError)
      throw purgeError
    }

    return NextResponse.json({
      success: true,
      data: {
        expired_marked_abandoned: abandonedCarts?.length || 0,
        purged_guest_carts: count || 0
      },
      message: `Daily cart sweep completed. Marked ${abandonedCarts?.length || 0} carts as abandoned, purged ${count || 0} dead guest carts.`
    })
  } catch (err: any) {
    console.error('🔴 POST /api/v1/cron/expire-old-carts error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred during daily cart sweep.'
      },
      { status: 500 }
    )
  }
}
