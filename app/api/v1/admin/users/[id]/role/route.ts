import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { updateUserRole } from '@/lib/db/users'

// Change Role Zod Schema
const changeRoleSchema = z.object({
  role: z.enum(['tourist', 'artisan', 'moderator', 'admin'], {
    message: 'Target role is required.',
  }),
})

/**
 * PATCH /api/v1/admin/users/[id]/role
 * Restricted strictly to Admins.
 * Modifies a user profile role and logs details inside the platform audit ledger.
 */
export const PATCH = withAuth(async (request, context, profile) => {
  try {
    // Resolve dynamic path parameters safely supporting Next.js 14 & 15+ variations
    const resolvedParams = context.params instanceof Promise ? await context.params : context.params
    const targetUserId = resolvedParams?.id

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, data: null, message: 'Bad Request: Target User ID is required.' },
        { status: 400 }
      )
    }

    // Safety lock: prevent self-demotions or locking oneself out of admin access
    if (profile.id === targetUserId) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Forbidden: You are not permitted to change your own administrative role credentials.',
        },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate body payload
    const parsed = changeRoleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Validation failed: Invalid target role.',
          errors: parsed.error.format(),
        },
        { status: 400 }
      )
    }

    const { role } = parsed.data

    // Extract client IP address for auditing trails
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined

    // Execute role change and log the transaction
    const updatedUser = await updateUserRole(targetUserId, role, profile.id, ipAddress)

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: `User role has been successfully modified to [${role}] and logged to the audit system.`,
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An error occurred while changing user role.',
      },
      { status: 500 }
    )
  }
}, ['admin'])
