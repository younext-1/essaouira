import { NextResponse } from 'next/server'
import { z } from 'zod'
import { syncUserProfile } from '@/lib/db/users'

// Clerk Webhook Event Zod Validation Schema
const clerkWebhookSchema = z.object({
  type: z.string(),
  data: z.object({
    id: z.string({ message: 'Clerk ID is required' }),
    email_addresses: z
      .array(
        z.object({
          email_address: z.string().email(),
        })
      )
      .min(1, { message: 'User must have at least one email address' }),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
    image_url: z.string().url().nullable().optional(),
    phone_numbers: z
      .array(
        z.object({
          phone_number: z.string(),
        })
      )
      .nullable()
      .optional(),
  }),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate the incoming Clerk webhook payload
    const parsed = clerkWebhookSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Malformed request: Clerk payload validation failed.',
          errors: parsed.error.format(),
        },
        { status: 400 }
      )
    }

    const { type, data } = parsed.data

    // We only process user.created and user.updated events
    if (type !== 'user.created' && type !== 'user.updated') {
      return NextResponse.json({
        success: true,
        data: null,
        message: `Event type [${type}] received but skipped. Sync processes user events only.`,
      })
    }

    // Process and sanitize incoming fields
    const email = data.email_addresses[0].email_address
    const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ') || null
    const avatarUrl = data.image_url || null
    const phone = data.phone_numbers && data.phone_numbers.length > 0
      ? data.phone_numbers[0].phone_number
      : null

    const profile = await syncUserProfile({
      clerk_id: data.id,
      email,
      full_name: fullName,
      avatar_url: avatarUrl,
      phone,
    })

    return NextResponse.json({
      success: true,
      data: profile,
      message: `User profile synchronized successfully. Transaction type: [${type}].`,
    })
  } catch (err: any) {
    console.error('🔴 Sync Route API error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected sync execution failure occurred.',
      },
      { status: 500 }
    )
  }
}
