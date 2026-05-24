import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { resolveDispute } from '@/lib/db/orders'
import * as z from 'zod'
import { DisputeResolution } from '@/types/orders.types'

const resolveSchema = z.object({
  resolution: z.enum(['refund_buyer', 'release_seller', 'partial_refund']),
  notes: z.string().min(5, { message: 'Resolution notes must be at least 5 characters long.' }),
})

export async function POST(
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

    // Role check (Admin or Moderator only)
    if (profile.role !== 'admin' && profile.role !== 'moderator') {
      return NextResponse.json({ error: 'Forbidden: Admin or Moderator access required.' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = resolveSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Malformed request body', details: parsed.error.format() }, { status: 400 })
    }

    const { resolution, notes } = parsed.data

    const updatedDispute = await resolveDispute(
      id,
      profile.id,
      resolution as DisputeResolution,
      notes
    )

    return NextResponse.json({
      success: true,
      message: 'Dispute resolved successfully.',
      dispute: updatedDispute,
    })
  } catch (err: any) {
    console.error('Error in POST /api/v1/admin/disputes/[id]/resolve:', err)
    return NextResponse.json({ error: 'Internal Server Error', message: err.message }, { status: 500 })
  }
}
