import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { getPendingVerifications, reviewVerification } from '@/lib/db/users'

// Review Verification Zod Schema
const reviewVerificationSchema = z.object({
  verification_id: z.string().uuid({ message: 'Invalid verification record UUID.' }),
  status: z.enum(['approved', 'rejected'], {
    message: 'Status is required and must be either approved or rejected.',
  }),
  notes: z.string().max(500, { message: 'Review notes cannot exceed 500 characters.' }).optional(),
})

/**
 * GET /api/v1/admin/users/verifications
 * Restricted to Admins and Moderators.
 * Returns the queue of all pending profile verification submissions.
 */
export const GET = withAuth(async (request, context, profile) => {
  try {
    const queue = await getPendingVerifications()
    return NextResponse.json({
      success: true,
      data: queue,
      message: 'Pending verifications queue retrieved successfully.',
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An error occurred while fetching verifications queue.',
      },
      { status: 500 }
    )
  }
}, ['admin', 'moderator'])

/**
 * POST /api/v1/admin/users/verifications
 * Restricted to Admins and Moderators.
 * Reviews (approves/rejects) an artisan verification submission, logging the details to audit.
 */
export const POST = withAuth(async (request, context, profile) => {
  try {
    const body = await request.json()

    // Validate body payload
    const parsed = reviewVerificationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Validation failed: Invalid review properties.',
          errors: parsed.error.format(),
        },
        { status: 400 }
      )
    }

    const { verification_id, status, notes } = parsed.data
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined

    // Execute verification review and trigger conditional profile.verified updates
    const updatedVerification = await reviewVerification(
      verification_id,
      status,
      profile.id,
      notes,
      ipAddress
    )

    return NextResponse.json({
      success: true,
      data: updatedVerification,
      message: `Verification record review complete. State: [${status}].`,
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An error occurred while processing verification review.',
      },
      { status: 500 }
    )
  }
}, ['admin', 'moderator'])
