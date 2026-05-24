import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { createStore, getStoresByCategory } from '@/lib/db/stores'

// Store Creation Zod Schema
const createStoreSchema = z.object({
  name: z.string()
    .min(3, { message: 'Store name must be at least 3 characters.' })
    .max(100, { message: 'Store name cannot exceed 100 characters.' }),
  description: z.string().max(1000, { message: 'Description cannot exceed 1000 characters.' }).nullable().optional(),
  category: z.string().max(50).nullable().optional(),
  location: z.string().max(100).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  whatsapp: z.string().max(50).nullable().optional(),
  working_hours: z.record(z.string(), z.string()).optional(),
})

/**
 * Helper to auto-generate a kebab-case slug from a store name with a unique random suffix.
 */
function generateStoreSlug(name: string): string {
  const normalized = name
    .toLowerCase()
    .normalize('NFD') // decompose diacritics
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // strip special characters
    .trim()
    .replace(/[\s_]+/g, '-') // convert spaces and underscores to dashes
    .replace(/-+/g, '-') // remove double dashes
    .replace(/^-+|-+$/g, '') // trim leading/trailing dashes

  const base = normalized || 'artisanal-store'
  const uniqueSuffix = Math.random().toString(36).substring(2, 6)
  return `${base}-${uniqueSuffix}`
}

/**
 * POST /api/v1/stores
 * Restricted to verified artisans. Creates a new storefront in the inactive onboarding state.
 */
export const POST = withAuth(async (request, context, profile) => {
  try {
    // 1. Enforce verified artisan requirement
    if (profile.role !== 'artisan' || !profile.verified) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Forbidden: Only verified artisans are permitted to create an artisanal store.',
        },
        { status: 403 }
      )
    }

    const body = await request.json()

    // 2. Validate input fields
    const parsed = createStoreSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Validation failed: Invalid store properties.',
          errors: parsed.error.format(),
        },
        { status: 400 }
      )
    }

    // 3. Generate unique slug
    const slug = generateStoreSlug(parsed.data.name)

    // 4. Create the store record
    const store = await createStore({
      owner_id: profile.id,
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      category: parsed.data.category,
      location: parsed.data.location,
      phone: parsed.data.phone,
      whatsapp: parsed.data.whatsapp,
      working_hours: parsed.data.working_hours,
    })

    return NextResponse.json(
      {
        success: true,
        data: store,
        message: 'Artisanal store created successfully. Please complete the onboarding checklist to make it public.',
      },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('🔴 POST /api/v1/stores API error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected failure occurred while creating your store.',
      },
      { status: 500 }
    )
  }
})

/**
 * GET /api/v1/stores
 * Public access endpoint. Retrieves the list of active storefronts.
 * Support pagination and category filters.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'all'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '12', 10)

    const result = await getStoresByCategory(category, page, limit)

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
      message: 'Active artisanal stores retrieved successfully.',
    })
  } catch (err: any) {
    console.error('🔴 GET /api/v1/stores API error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred while fetching stores.',
      },
      { status: 500 }
    )
  }
}
