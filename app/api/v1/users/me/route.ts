import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { updateProfileFields } from '@/lib/db/users'
import { getStoreByOwner } from '@/lib/db/stores'

// Profile Update Zod Validation Schema
const updateProfileSchema = z.object({
  full_name: z.string().max(100, { message: 'Full name cannot exceed 100 characters.' }).nullable().optional(),
  avatar_url: z.string().url({ message: 'Avatar URL must be a valid URL.' }).nullable().optional(),
  bio: z.string().max(1000, { message: 'Bio content cannot exceed 1000 characters.' }).nullable().optional(),
  phone: z.string().max(30, { message: 'Phone number cannot exceed 30 characters.' }).nullable().optional(),
})

/**
 * GET /api/v1/users/me
 * Retrieves current authenticated user's profile with optional Store info.
 */
export const GET = withAuth(async (request, context, profile) => {
  try {
    let store = null

    // If the user role is artisan, query and serialize their storefront metadata
    if (profile.role === 'artisan') {
      try {
        store = await getStoreByOwner(profile.id)
      } catch (storeError) {
        console.warn(`Failed to fetch store details for artisan profile ${profile.id}:`, storeError)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        profile,
        store,
      },
      message: 'Profile retrieved successfully.',
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An error occurred while fetching profile.',
      },
      { status: 500 }
    )
  }
})

/**
 * PATCH /api/v1/users/me
 * Updates allowed profile fields with strict validation checks.
 */
export const PATCH = withAuth(async (request, context, profile) => {
  try {
    const body = await request.json()

    // Validate request body
    const parsed = updateProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Validation failed: Invalid update properties.',
          errors: parsed.error.format(),
        },
        { status: 400 }
      )
    }

    // Update profile database record
    const updatedProfile = await updateProfileFields(profile.id, parsed.data)

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully.',
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An error occurred while updating profile.',
      },
      { status: 500 }
    )
  }
})
