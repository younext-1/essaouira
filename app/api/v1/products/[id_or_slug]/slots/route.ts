import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createPublicSupabaseClient } from '@/lib/supabase/server'
import { getProductBySlug } from '@/lib/db/products'

const querySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
})

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/products/[id_or_slug]/slots
 * Retrieves the experience booking slots calendar for experience type products, optionally filtered by year/month.
 */
export async function GET(
  request: Request,
  context: { params: any }
) {
  try {
    const resolvedParams = context.params instanceof Promise ? await context.params : context.params
    const idOrSlug = resolvedParams?.id_or_slug

    if (!idOrSlug) {
      return NextResponse.json(
        { success: false, data: null, message: 'Product ID or slug parameter is required.' },
        { status: 400 }
      )
    }

    // 1. Fetch target product and verify it is an experience
    const product = await getProductBySlug(idOrSlug)
    if (!product) {
      return NextResponse.json(
        { success: false, data: null, message: 'Product listing not found.' },
        { status: 404 }
      )
    }

    if (product.type !== 'experience') {
      return NextResponse.json(
        { success: false, data: null, message: 'Product is not an experience-based type.' },
        { status: 400 }
      )
    }

    // 2. Parse query parameters for year/month calendar view
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    const parseResult = querySchema.safeParse(queryParams)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Invalid slot query parameters.',
          errors: parseResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    const { year, month } = parseResult.data

    const supabase = createPublicSupabaseClient()
    let query = supabase
      .from('experience_slots')
      .select('*')
      .eq('product_id', product.id)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (year && month) {
      // Format month to 2 digits
      const monthStr = month.toString().padStart(2, '0')
      const startDate = `${year}-${monthStr}-01`
      
      // Calculate end date (last day of month)
      const lastDay = new Date(year, month, 0).getDate()
      const endDate = `${year}-${monthStr}-${lastDay}`

      query = query.gte('date', startDate).lte('date', endDate)
    } else {
      // Default to future slots only starting today
      const today = new Date().toISOString().split('T')[0]
      query = query.gte('date', today)
    }

    const { data: slots, error } = await query
    if (error) throw error

    return NextResponse.json({
      success: true,
      data: slots,
      message: 'Experience booking slots calendar retrieved successfully.'
    })
  } catch (err: any) {
    console.error(`🔴 GET /api/v1/products/[id_or_slug]/slots error:`, err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred while fetching booking slots.'
      },
      { status: 500 }
    )
  }
}
