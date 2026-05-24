import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { getStoreByOwner } from '@/lib/db/stores'
import { getProductBySlug } from '@/lib/db/products'
import { createPublicSupabaseClient } from '@/lib/supabase/server'

// Validation schema for creating experience slots
const slotsInputSchema = z.object({
  slots: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'),
      start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time format must be HH:MM'),
      max_participants: z.number().int().min(1, 'Participants count must be greater than 0'),
      price_override: z.number().min(0).nullable().optional()
    })
  ).optional(),

  // Or automated slot generator range
  generate: z.object({
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'),
    times: z.array(z.string().regex(/^\d{2}:\d{2}$/, 'Time format must be HH:MM')),
    max_participants: z.number().int().min(1, 'Participants count must be greater than 0'),
    price_override: z.number().min(0).nullable().optional()
  }).optional()
}).refine(data => data.slots || data.generate, {
  message: 'Either explicit slots array or generator config details must be provided.'
})

/**
 * POST /api/v1/seller/products/[id]/slots
 * Allocates calendar booking slots for experiences. Supports direct batches and automated generator ranges.
 */
export const POST = withAuth(async (request, context, profile) => {
  try {
    const resolvedParams = context.params instanceof Promise ? await context.params : context.params
    const productId = resolvedParams?.id

    if (!productId) {
      return NextResponse.json(
        { success: false, data: null, message: 'Product ID parameter is required.' },
        { status: 400 }
      )
    }

    // 1. Resolve store ownership
    const store = await getStoreByOwner(profile.id)
    if (!store) {
      return NextResponse.json(
        { success: false, data: null, message: 'Store not found.' },
        { status: 404 }
      )
    }

    // 2. Fetch product details
    const product = await getProductBySlug(productId)
    if (!product) {
      return NextResponse.json(
        { success: false, data: null, message: 'Product not found.' },
        { status: 404 }
      )
    }

    // 3. Enforce product type is experience
    if (product.type !== 'experience') {
      return NextResponse.json(
        { success: false, data: null, message: 'Allocation rejected. Product listing type is not an experience.' },
        { status: 400 }
      )
    }

    // 4. Enforce product ownership
    if (product.store_id !== store.id) {
      return NextResponse.json(
        { success: false, data: null, message: 'Forbidden. You do not own this product.' },
        { status: 403 }
      )
    }

    // 5. Parse request body
    const body = await request.json()
    const parseResult = slotsInputSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Validation failed for slots allocation request.',
          errors: parseResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    const { slots, generate } = parseResult.data
    const supabase = createPublicSupabaseClient()
    const slotsToInsert: any[] = []

    if (slots) {
      slots.forEach(slot => {
        slotsToInsert.push({
          product_id: product.id,
          date: slot.date,
          start_time: slot.start_time,
          max_participants: slot.max_participants,
          price_override: slot.price_override || null,
          booked_count: 0,
          is_available: true
        })
      })
    } else if (generate) {
      const start = new Date(generate.start_date)
      const end = new Date(generate.end_date)

      if (start > end) {
        return NextResponse.json(
          { success: false, data: null, message: 'Generate range invalid. Start date must be before end date.' },
          { status: 400 }
        )
      }

      // Generate slots day by day
      const current = new Date(start)
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0]
        
        generate.times.forEach(time => {
          slotsToInsert.push({
            product_id: product.id,
            date: dateStr,
            start_time: `${time}:00`,
            max_participants: generate.max_participants,
            price_override: generate.price_override || null,
            booked_count: 0,
            is_available: true
          })
        })
        
        current.setDate(current.getDate() + 1)
      }
    }

    // 6. Bulk insert slots into the database
    if (slotsToInsert.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No slots were generated.'
      })
    }

    const { data: insertedSlots, error } = await supabase
      .from('experience_slots')
      .insert(slotsToInsert)
      .select()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: insertedSlots,
      message: `Successfully allocated ${insertedSlots.length} booking slots to experience calendar.`
    })
  } catch (err: any) {
    console.error('🔴 POST /api/v1/seller/products/[id]/slots error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred while allocating booking slots.'
      },
      { status: 500 }
    )
  }
}, ['artisan', 'admin'])
