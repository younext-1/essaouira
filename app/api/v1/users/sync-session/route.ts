import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { syncUserProfile } from '@/lib/db/users'

/**
 * POST /api/v1/users/sync-session
 * Browser-initiated endpoint to upsert the current Clerk session user
 * into the Supabase profiles table. Uses server-side auth so no direct
 * Supabase writes happen from the browser (avoids RLS violations).
 */
export async function POST() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json(
        { success: false, message: 'Unauthenticated: No active session.' },
        { status: 401 }
      )
    }

    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Could not retrieve user from Clerk.' },
        { status: 404 }
      )
    }

    const email = user.emailAddresses[0]?.emailAddress
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'User has no email address.' },
        { status: 400 }
      )
    }

    const fullName =
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
      user.username ||
      'Verified Buyer'
    const avatarUrl = user.imageUrl || null
    const phone = user.phoneNumbers?.[0]?.phoneNumber || null

    const profile = await syncUserProfile({
      clerk_id: clerkId,
      email,
      full_name: fullName,
      avatar_url: avatarUrl,
      phone,
    })

    return NextResponse.json({
      success: true,
      data: profile,
      message: 'User profile synchronized successfully.',
    })
  } catch (err: any) {
    console.error('🔴 Session sync error:', err)
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'An unexpected error occurred during sync.',
      },
      { status: 500 }
    )
  }
}
