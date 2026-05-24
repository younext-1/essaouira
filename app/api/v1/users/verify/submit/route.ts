import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { submitVerification } from '@/lib/db/users'

// Verification Submission Zod Schema
const verificationSubmitSchema = z.object({
  document_type: z.string().min(1, { message: 'Document type descriptor is required.' }),
  document_url: z.string().url({ message: 'Document URL must be a valid file link.' }),
})

/**
 * POST /api/v1/users/verify/submit
 * Submits dynamic documents to the admin moderation and verification queue.
 */
export const POST = withAuth(async (request, context, profile) => {
  try {
    const body = await request.json()

    // Validate incoming payload
    const parsed = verificationSubmitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Validation failed: Invalid document properties.',
          errors: parsed.error.format(),
        },
        { status: 400 }
      )
    }

    const { document_type, document_url } = parsed.data

    // Register verification record in database
    const verification = await submitVerification({
      profile_id: profile.id,
      document_type,
      document_url,
    })

    return NextResponse.json({
      success: true,
      data: verification,
      message: 'Verification document submitted successfully and is now pending review.',
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An error occurred during verification submission.',
      },
      { status: 500 }
    )
  }
})
